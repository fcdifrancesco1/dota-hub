import React, { useState } from 'react';
import { Swords, Filter, Calendar, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getTeamLogo } from '../utils/teamLogos';

export default function MatchesPage() {
  const { finishedSeries, setSelectedSeries, upcomingMatches } = useApp();
  const [filterMode, setFilterMode] = useState('finished'); // 'finished' | 'upcoming'
  const [search, setSearch] = useState('');

  const displayedList = (filterMode === 'finished' ? finishedSeries : upcomingMatches) || [];
  const filtered = displayedList.filter(item => {
    if (!search) return true;
    const term = search.toLowerCase();
    const tA = (item.team1_name || item.timeA || '').toLowerCase();
    const tB = (item.team2_name || item.timeB || '').toLowerCase();
    const tourney = (item.league_name || item.tourneyName || '').toLowerCase();
    return tA.includes(term) || tB.includes(term) || tourney.includes(term);
  });

  return (
    <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#212838]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase font-serif tracking-tight flex items-center gap-2.5">
            <Swords className="w-7 h-7 text-amber-500" />
            <span>Partidas & Confrontos</span>
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            Histórico completo de séries profissionais, placares detalhados e agenda futura.
          </p>
        </div>

        {/* Filtros e Busca */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-[#11141E] p-1 rounded-xl border border-[#212838]">
            <button
              onClick={() => setFilterMode('finished')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                filterMode === 'finished' ? 'bg-amber-500 text-black font-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              Resultados Concluídos
            </button>
            <button
              onClick={() => setFilterMode('upcoming')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                filterMode === 'upcoming' ? 'bg-amber-500 text-black font-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              Agenda Futura
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filtrar por time ou torneio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#11141E] border border-[#212838] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>
      </div>

      {/* Grid de Partidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((s, idx) => {
          const tA = s.team1_name || s.timeA || 'Team 1';
          const tB = s.team2_name || s.timeB || 'Team 2';
          const scoreA = s.score_team1 ?? s.scoreA ?? 0;
          const scoreB = s.score_team2 ?? s.scoreB ?? 0;
          const tourney = s.league_name || s.tourneyName || 'Torneio Oficial';

          return (
            <div
              key={s.series_id || s.id || idx}
              onClick={() => setSelectedSeries(s)}
              className="bg-[#0C0E14] hover:bg-[#11141E] border border-[#212838] hover:border-amber-500/40 rounded-xl p-4 transition-all cursor-pointer shadow-lg group"
            >
              <div className="flex items-center justify-between text-[11px] text-gray-400 mb-3 border-b border-white/5 pb-2">
                <span className="font-semibold truncate max-w-[200px] text-amber-400/90">{tourney}</span>
                <span className="font-mono text-gray-400 font-bold">{s.stage || 'MD3'}</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <img src={getTeamLogo(tA)} alt={tA} className="w-6 h-6 object-contain" />
                  <span className="text-xs font-bold text-white truncate">{tA}</span>
                </div>

                <div className="font-mono font-black text-xs px-2.5 py-1 bg-black/60 rounded-lg border border-white/10 text-white">
                  {filterMode === 'finished' ? `${scoreA} - ${scoreB}` : 'VS'}
                </div>

                <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                  <span className="text-xs font-bold text-white truncate text-right">{tB}</span>
                  <img src={getTeamLogo(tB)} alt={tB} className="w-6 h-6 object-contain" />
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                <span className="text-gray-500">
                  {s.start_time ? new Date(s.start_time).toLocaleDateString('pt-BR') : 'Recentemente'}
                </span>
                <span className="text-amber-400 font-bold group-hover:underline">
                  Ver Estatísticas & Draft →
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
