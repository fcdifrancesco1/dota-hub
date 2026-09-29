import React, { useState } from 'react';
import { Swords, Filter, Calendar, Search, Trophy, ChevronRight, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getTeamLogo } from '../utils/teamLogos';

export default function MatchesPage() {
  const { finishedSeries, setSelectedSeries, upcomingMatches } = useApp();
  const [filterMode, setFilterMode] = useState('finished'); // 'finished' | 'upcoming'
  const [selectedTournament, setSelectedTournament] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [search, setSearch] = useState('');

  const displayedList = (filterMode === 'finished' ? finishedSeries : upcomingMatches) || [];

  // Obter lista única de torneios e times para os dropdowns de filtro
  const tournamentsList = Array.from(new Set(
    displayedList.map(s => s.league_name || s.tourneyName).filter(Boolean)
  ));
  const teamsList = Array.from(new Set(
    displayedList.flatMap(s => [s.team1_name || s.timeA, s.team2_name || s.timeB]).filter(Boolean)
  ));

  const filtered = displayedList.filter((item) => {
    const tA = (item.team1_name || item.timeA || '').toLowerCase();
    const tB = (item.team2_name || item.timeB || '').toLowerCase();
    const tourney = (item.league_name || item.tourneyName || '').toLowerCase();

    // Filtro por texto
    if (search) {
      const term = search.toLowerCase();
      if (!tA.includes(term) && !tB.includes(term) && !tourney.includes(term)) return false;
    }

    // Filtro por torneio
    if (selectedTournament !== 'all') {
      if (tourney !== selectedTournament.toLowerCase()) return false;
    }

    // Filtro por time
    if (selectedTeam !== 'all') {
      const sel = selectedTeam.toLowerCase();
      if (!tA.includes(sel) && !tB.includes(sel)) return false;
    }

    return true;
  });

  return (
    <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      {/* HEADER DA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#212838]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase font-serif tracking-tight flex items-center gap-2.5">
            <Swords className="w-7 h-7 text-amber-500" />
            <span>Partidas & Séries Profissionais</span>
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            Histórico completo de confrontos, replays, estatísticas individuais e agenda de partidas futuras.
          </p>
        </div>

        {/* ALTERNADOR DE MODO (CONCLUÍDAS VS FUTURAS) */}
        <div className="flex bg-[#11141E] p-1 rounded-xl border border-[#212838]">
          <button
            onClick={() => setFilterMode('finished')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap ${
              filterMode === 'finished' ? 'bg-amber-500 text-black font-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            Séries Concluídas
          </button>
          <button
            onClick={() => setFilterMode('upcoming')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap ${
              filterMode === 'upcoming' ? 'bg-amber-500 text-black font-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            Agenda Futura
          </button>
        </div>
      </div>

      {/* BARRA DE FILTROS AVANÇADOS */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Filtro Torneio */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Filtrar por Campeonato</label>
          <select
            value={selectedTournament}
            onChange={(e) => setSelectedTournament(e.target.value)}
            className="w-full bg-[#11141E] border border-[#212838] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
          >
            <option value="all">Todos os Campeonatos</option>
            {tournamentsList.map((t, idx) => (
              <option key={idx} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Filtro Time */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Filtrar por Time</label>
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="w-full bg-[#11141E] border border-[#212838] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
          >
            <option value="all">Todos os Times</option>
            {teamsList.map((tm, idx) => (
              <option key={idx} value={tm}>{tm}</option>
            ))}
          </select>
        </div>

        {/* Busca por Texto */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Busca Rápida</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Digite time ou torneio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#11141E] border border-[#212838] rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>
      </div>

      {/* GRID DE SÉRIES / PARTIDAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-[#0C0E14] border border-[#212838] rounded-2xl p-12 text-center text-gray-400 text-xs">
            Nenhuma partida encontrada para os filtros selecionados.
          </div>
        ) : (
          filtered.map((s, idx) => {
            const tA = s.team1_name || s.timeA || 'Team 1';
            const tB = s.team2_name || s.timeB || 'Team 2';
            const scoreA = s.score_team1 ?? s.scoreA ?? 0;
            const scoreB = s.score_team2 ?? s.scoreB ?? 0;
            const tourney = s.league_name || s.tourneyName || 'Torneio Oficial';
            const isWinnerA = scoreA > scoreB;
            const isWinnerB = scoreB > scoreA;

            return (
              <div
                key={s.series_id || s.id || idx}
                onClick={() => setSelectedSeries(s)}
                className="bg-[#0C0E14] hover:bg-[#11141E] border border-[#212838] hover:border-amber-500/40 rounded-2xl p-5 transition-all cursor-pointer shadow-xl group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-gray-400 mb-3 border-b border-white/5 pb-2">
                    <span className="font-semibold truncate max-w-[200px] text-amber-400/90">{tourney}</span>
                    <span className="font-mono text-gray-400 font-bold bg-white/5 px-2 py-0.5 rounded">
                      {s.stage || (s.series_type ? `MD${s.series_type}` : 'MD3')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 py-2">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <img
                        src={getTeamLogo(tA, s.team1_logo || s.logoA)}
                        alt={tA}
                        className="w-7 h-7 object-contain"
                        onError={(e) => { e.target.src = '/placeholder-team.png'; }}
                      />
                      <span className={`text-xs font-bold truncate ${isWinnerA ? 'text-amber-400 font-black' : 'text-gray-200'}`}>
                        {tA}
                      </span>
                    </div>

                    <div className="font-mono font-black text-xs px-3 py-1 bg-black/60 rounded-xl border border-white/10 text-white">
                      {filterMode === 'finished' ? `${scoreA} - ${scoreB}` : 'VS'}
                    </div>

                    <div className="flex items-center gap-2.5 flex-1 justify-end min-w-0">
                      <span className={`text-xs font-bold truncate text-right ${isWinnerB ? 'text-amber-400 font-black' : 'text-gray-200'}`}>
                        {tB}
                      </span>
                      <img
                        src={getTeamLogo(tB, s.team2_logo || s.logoB)}
                        alt={tB}
                        className="w-7 h-7 object-contain"
                        onError={(e) => { e.target.src = '/placeholder-team.png'; }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                  <span className="text-gray-500">
                    {s.start_time ? new Date(s.start_time).toLocaleDateString('pt-BR') : s.startTime || 'Recentemente'}
                  </span>
                  <span className="text-amber-400 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    <span>Ver Replay & Draft</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
