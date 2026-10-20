import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  User,
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
  Sun,
  Moon
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { SITE_CONFIG } from '../config/siteConfig';

// Contador de partidas ao vivo: cores fixas (não dependem do tema) para o
// número ficar sempre legível; só o halo por trás pulsa, o número não.
function LiveBadge({ count, className = '' }) {
  return (
    <span className={`relative inline-flex items-center justify-center ${className}`} aria-label={`${count} ao vivo`}>
      <span className="absolute inset-0 rounded-full animate-ping opacity-40" style={{ backgroundColor: '#EF4444' }} />
      <span
        className="relative min-w-[20px] h-5 px-1.5 rounded-full text-[11px] leading-none font-black tabular-nums flex items-center justify-center shadow-sm"
        style={{ backgroundColor: '#DC2626', color: '#FFFFFF' }}
      >
        {count}
      </span>
    </span>
  );
}

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
    { to: '/perfil', label: 'Perfil', icon: User },
    { to: '/admin', label: 'Admin', icon: Lock }
  ];

  return (
    <>
      <header className="sticky top-0 z-50 glass-panel border-b border-line transition-all">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* LOGO & BRAND: volta para o hub HanG0V3R (a página inicial do Dota fica em "Início") */}
          <a
            href="https://hangover.com.br"
            title="Voltar para o HanG0V3R Hub"
            className="flex items-center gap-3 group focus:outline-none"
          >
            <img
              src="/logo-96.png"
              alt=""
              width="44"
              height="44"
              className="w-11 h-11 shrink-0 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)] group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <span className="text-[10px] font-black tracking-widest text-blue-600 dark:text-amber-500 uppercase leading-none">
                Competitive
              </span>
              <span className="text-base sm:text-lg font-black tracking-wider text-white uppercase leading-tight font-serif">
                {SITE_CONFIG.name}
              </span>
            </div>
          </a>

          {/* DESKTOP NAVIGATION */}
          <nav className="hidden xl:flex items-center gap-1 bg-surface-2 px-2 py-1.5 rounded-2xl border border-line">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to || 
                (item.to !== '/' && location.pathname.startsWith(item.to));

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-blue-600 text-on-accent shadow-md shadow-blue-500/25 font-black'
                      : 'text-gray-400 hover:text-white hover:bg-surface-3'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-on-accent' : 'text-blue-600 dark:text-amber-400'}`} />
                  <span>{item.label}</span>

                  {/* Badge Ao Vivo */}
                  {item.badge > 0 && <LiveBadge count={item.badge} className="ml-1" />}
                </NavLink>
              );
            })}
          </nav>

          {/* RIGHT ACTIONS: SYNC STATUS & MOBILE TRIGGER */}
          <div className="flex items-center gap-3">
            {/* Refresh Button */}
            <button
              onClick={refreshData}
              disabled={loadingRefresh}
              title={`Atualizado às ${lastUpdated || 'recentemente'}. Clique para atualizar.`}
              className="p-2 rounded-xl bg-surface-2 border border-line text-gray-400 hover:text-white transition-all disabled:opacity-50 shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loadingRefresh ? 'animate-spin text-blue-600 dark:text-amber-400' : ''}`} />
            </button>

            {/* Alternar tema claro / escuro */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'}
              aria-label={theme === 'dark' ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'}
              className="p-2 rounded-xl bg-surface-2 border border-line text-gray-400 hover:text-white transition-all shadow-sm"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl bg-surface-2 border border-line text-gray-400 hover:text-white"
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
          <div className="fixed inset-y-0 right-0 w-full max-w-xs glass-panel border-l border-line p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-6 border-b border-line">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                    <Flame className="w-4 h-4 text-blue-600 dark:text-amber-400" />
                  </div>
                  <span className="font-serif font-black text-white uppercase tracking-wider text-sm">
                    {SITE_CONFIG.name}
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white bg-surface-2"
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
                          ? 'bg-blue-600 text-on-accent font-black shadow-md shadow-blue-500/25'
                          : 'text-gray-400 hover:text-white hover:bg-surface-2'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-on-accent' : 'text-blue-600 dark:text-amber-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge > 0 && <LiveBadge count={item.badge} />}
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            {/* Drawer Footer */}
            <div className="pt-6 border-t border-line flex flex-col gap-3">
              <div className="text-[11px] text-gray-400 text-center">
                Última sincronização: {lastUpdated || '--:--'}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
