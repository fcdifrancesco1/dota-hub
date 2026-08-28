import React from 'react';
import { Flame, Trophy, Award, BarChart3, Search, RefreshCw, X, Menu } from 'lucide-react';

export default function Header({
  currentTab,
  setCurrentTab,
  searchQuery,
  setSearchQuery,
  onRefresh,
  loadingRefresh,
  lastUpdated
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navTabs = [
    { id: 'hub', label: 'Hub Principal', icon: Flame },
    { id: 'torneios', label: 'Torneios', icon: Trophy },
    { id: 'meta', label: 'Meta do Patch', icon: BarChart3 },
    { id: 'mmr', label: 'Ranking MMR', icon: Award }
  ];

  return (
    <header className="top-header sticky top-0 z-50 bg-[#0C0F16]/90 backdrop-blur-xl border-b border-white/10 px-4 lg:px-8 py-2.5">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
        {/* LOGO & BRAND */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setCurrentTab('hub');
              setSearchQuery('');
            }}
            className="flex items-center gap-3 text-left group transition-transform hover:scale-105"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700 p-[1.5px] shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-[#0B0D12] rounded-[10px] flex items-center justify-center">
                <Flame className="w-5 h-5 text-amber-400 group-hover:text-amber-300 transition-colors" />
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="text-[10px] font-extrabold tracking-widest text-amber-400 uppercase">Competitive</div>
              <div className="text-base font-black tracking-wider text-white leading-tight">DOTA HUB</div>
            </div>
          </button>
        </div>

        {/* NAVEGAÇÃO DESKTOP */}
        <nav className="hidden md:flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setCurrentTab(tab.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-md shadow-amber-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-amber-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* BUSCA GLOBAL & REFRESH */}
        <div className="flex items-center gap-2 flex-1 md:flex-initial justify-end">
          <div className="relative w-full max-w-[220px] lg:max-w-[280px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar time, herói, liga..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-8 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400/80 focus:bg-white/10 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={onRefresh}
            disabled={loadingRefresh}
            title={lastUpdated ? `Atualizado em: ${lastUpdated}` : "Atualizar dados"}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-amber-400 hover:border-amber-500/40 hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loadingRefresh ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          {/* Botão Mobile Menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MENU DROPDOWN MOBILE */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 mt-2.5 pt-2 pb-1 space-y-1">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setCurrentTab(tab.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
                  isActive ? 'bg-amber-500 text-black font-extrabold' : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-amber-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
