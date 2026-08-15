import React from 'react';
import { Flame, Trophy, Award } from 'lucide-react';

export default function Navbar({ currentView, setCurrentView }) {
  return (
    <header className="h-16 border-b border-dota-border bg-dota-surface/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
      {/* Logo com Espaço em Branco (Sem Texto) */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-600 to-amber-400 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
          <div className="w-full h-full bg-dota-bg rounded-[7px] flex items-center justify-center">
            <Flame className="w-6 h-6 text-dota-accent animate-pulse" />
          </div>
        </div>
      </div>

      {/* Navegação Principal: Somente Torneios e Ranking MMR */}
      <nav className="flex items-center gap-2">
        <button
          onClick={() => setCurrentView('torneios')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-sm tracking-wider uppercase transition-all ${
            currentView === 'torneios'
              ? 'bg-dota-accent text-dota-bg shadow-md shadow-dota-accent/20'
              : 'text-dota-dim hover:text-white hover:bg-dota-card'
          }`}
        >
          <Trophy className="w-4 h-4" />
          Torneios
        </button>

        <button
          onClick={() => setCurrentView('ranking')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-sm tracking-wider uppercase transition-all ${
            currentView === 'ranking'
              ? 'bg-dota-accent text-dota-bg shadow-md shadow-dota-accent/20'
              : 'text-dota-dim hover:text-white hover:bg-dota-card'
          }`}
        >
          <Award className="w-4 h-4" />
          Ranking MMR
        </button>
      </nav>

      <div className="w-10" />
    </header>
  );
}