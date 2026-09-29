import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  Flame,
  Radio,
  Trophy,
  Swords,
  Sparkles,
  Award,
  Lock,
  Menu,
  X,
  RefreshCw,
  ExternalLink,
  Sun,
  Moon
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { SITE_CONFIG } from '../config/siteConfig';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { liveCount, refreshData, loadingRefresh, lastUpdated } = useApp();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const navLinks = [
    { to: '/', label: 'Início', icon: Flame },
    { to: '/ao-vivo', label: 'Ao Vivo', icon: Radio, badge: liveCount },
    { to: '/campeonatos', label: 'Campeonatos', icon: Trophy },
    { to: '/partidas', label: 'Partidas', icon: Swords },
    { to: '/herois', label: 'Heróis', icon: Sparkles },
    { to: '/palpites', label: 'Palpites', icon: Award },
    { to: '/admin', label: 'Admin', icon: Lock }
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-surface/90 backdrop-blur-xl border-b border-line transition-all">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* LOGO & BRAND */}
          <Link
            to="/"
            className="flex items-center gap-3 group focus:outline-none"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-red-600 to-amber-700 p-[1.5px] shadow-lg shadow-red-950/40 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-surface rounded-[10px] flex items-center justify-center">
                <Flame className="w-5 h-5 text-amber-400 group-hover:text-amber-300 transition-colors" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black tracking-widest text-amber-500 uppercase leading-none">
                Competitive
              </span>
              <span className="text-base sm:text-lg font-black tracking-wider text-white uppercase leading-tight font-serif">
                {SITE_CONFIG.name}
              </span>
            </div>
          </Link>

          {/* DESKTOP NAVIGATION */}
          <nav className="hidden xl:flex items-center gap-1 bg-surface-2/80 px-2 py-1.5 rounded-xl border border-line">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to || 
                (item.to !== '/' && location.pathname.startsWith(item.to));

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-md shadow-amber-500/20 font-black'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-amber-400/80'}`} />
                  <span>{item.label}</span>

                  {/* Badge Ao Vivo */}
                  {item.badge > 0 && (
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1 ${
                      isActive
                        ? 'bg-red-950 text-red-200'
                        : 'bg-red-600/90 text-on-accent animate-pulse'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* RIGHT ACTIONS: SYNC STATUS & MOBILE TRIGGER */}
          <div className="flex items-center gap-3">
            {/* Live Count Pill (Desktop) */}
            {liveCount > 0 && (
              <Link
                to="/ao-vivo"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-950/60 border border-red-800/40 text-red-400 text-xs font-black uppercase tracking-wider hover:bg-red-900/50 transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                <span>{liveCount} {liveCount === 1 ? 'Partida Ao Vivo' : 'Partidas Ao Vivo'}</span>
              </Link>
            )}

            {/* Refresh Button */}
            <button
              onClick={refreshData}
              disabled={loadingRefresh}
              title={`Atualizado às ${lastUpdated || 'recentemente'}. Clique para atualizar.`}
              className="p-2 rounded-lg bg-surface-2 border border-line text-gray-400 hover:text-amber-400 hover:border-amber-500/30 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loadingRefresh ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            {/* Alternar tema claro / escuro */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'}
              aria-label={theme === 'dark' ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'}
              className="p-2 rounded-lg bg-surface-2 border border-line text-gray-400 hover:text-amber-400 hover:border-amber-500/30 transition-all"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-lg bg-surface-2 border border-line text-gray-300 hover:text-white"
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER (SLIDE-OVER OVERLAY) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 xl:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Menu */}
          <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-surface border-l border-line p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-6 border-b border-line">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                    <Flame className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="font-serif font-black text-white uppercase tracking-wider text-sm">
                    {SITE_CONFIG.name}
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="mt-6 flex flex-col gap-1.5">
                {navLinks.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.to || 
                    (item.to !== '/' && location.pathname.startsWith(item.to));

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                        isActive
                          ? 'bg-amber-500 text-black font-black'
                          : 'text-gray-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-amber-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          isActive ? 'bg-black text-amber-400' : 'bg-red-600 text-on-accent animate-pulse'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            {/* Drawer Footer */}
            <div className="pt-6 border-t border-line flex flex-col gap-3">
              <a
                href={SITE_CONFIG.community.discord}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#5865F2]/20 border border-[#5865F2]/40 text-[#3C45C8] dark:text-[#5865F2] hover:bg-[#5865F2] hover:text-on-accent text-xs font-bold transition-all"
              >
                <span>Entrar no Discord da Comunidade</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <div className="text-[11px] text-gray-500 text-center">
                Última sincronização: {lastUpdated || '--:--'}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
