import React, { useState } from 'react';
import { Trophy, Calendar, Swords, ArrowLeft, ChevronRight, Shield } from 'lucide-react';
import { SkeletonGrid } from './SkeletonLoader';

export default function TournamentsView({
  tournaments = [],
  loading = false,
  onSelectSeries,
  searchQuery = ""
}) {
  const [selectedTournament, setSelectedTournament] = useState(null);

  const filteredTournaments = tournaments.filter((t) => {
    if (!searchQuery) return true;
    return t.name && t.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="max-w-6xl mx-auto w-full p-4 sm:p-6 space-y-6">
      {selectedTournament ? (
        <div className="space-y-5">
          <button
            onClick={() => setSelectedTournament(null)}
            className="flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar para lista de torneios
          </button>

          {/* Banner do Torneio Selecionado */}
          <div className="bg-gradient-to-r from-[#161A24]/90 via-[#10131C]/90 to-[#0C0E14]/90 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                  Torneio Profissional Oficial
                </span>
                <h1 className="text-2xl font-black text-white mt-2">{selectedTournament.name}</h1>
                <div className="flex items-center gap-4 text-xs text-gray-400 mt-2 font-mono">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" /> {selectedTournament.recentDate}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" /> {selectedTournament.seriesList?.length || 0} Séries Registradas
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Grid de Séries do Torneio */}
          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-3">
              Séries e Confrontos do Torneio
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {(selectedTournament.seriesList || []).map((s, idx) => {
                const aWon = s.scoreA > s.scoreB;
                const bWon = s.scoreB > s.scoreA;

                return (
                  <div
                    key={idx}
                    onClick={() => onSelectSeries && onSelectSeries(s)}
                    className="group bg-[#161A24]/80 hover:bg-[#1C2230] border border-white/10 hover:border-amber-500/60 rounded-xl p-4 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-amber-500/5 hover:-translate-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px] text-gray-400 border-b border-white/5 pb-2 mb-2.5">
                      <span className="font-bold text-amber-400 uppercase tracking-wider">{s.stage}</span>
                      <span className="font-mono bg-black/40 px-1.5 py-0.5 rounded border border-white/5">{s.dur}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2 py-1">
                      <span className={`text-xs font-bold truncate ${aWon ? 'text-white font-extrabold' : 'text-gray-400'}`}>
                        {s.timeA}
                      </span>
                      <span className={`font-mono text-xs font-black px-2 py-0.5 rounded ${aWon ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 text-rose-400/80'}`}>
                        {s.scoreA}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 py-1">
                      <span className={`text-xs font-bold truncate ${bWon ? 'text-white font-extrabold' : 'text-gray-400'}`}>
                        {s.timeB}
                      </span>
                      <span className={`font-mono text-xs font-black px-2 py-0.5 rounded ${bWon ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 text-rose-400/80'}`}>
                        {s.scoreB}
                      </span>
                    </div>

                    <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-400 group-hover:text-amber-400 transition-colors">
                      <span>Ver Estatísticas e Replay</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="border-b border-white/10 pb-4">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-amber-400">
              <Trophy className="w-4 h-4" /> Torneios Competitivos
            </div>
            <h1 className="text-2xl font-black text-white tracking-wide mt-1">
              Campeonatos e Ligas Profissionais
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Consulte as séries completas, resultados e estatísticas de cada torneio oficial de Dota 2
            </p>
          </div>

          {loading ? (
            <SkeletonGrid count={6} />
          ) : filteredTournaments.length === 0 ? (
            <div className="text-center py-16 text-xs text-gray-400">
              Nenhum torneio encontrado {searchQuery ? `para "${searchQuery}"` : ""}.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTournaments.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTournament(t)}
                  className="group bg-[#161A24]/70 hover:bg-[#1C2230]/90 border border-white/10 hover:border-amber-500/60 rounded-2xl p-5 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-1 flex flex-col justify-between gap-4 backdrop-blur-xl"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2 text-[10px]">
                      <span className="font-extrabold text-amber-400 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                        Oficial
                      </span>
                      <span className="font-mono text-gray-400">{t.recentDate}</span>
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2">
                      {t.name}
                    </h3>
                  </div>

                  <div className="border-t border-white/10 pt-3 flex items-center justify-between text-xs">
                    <span className="text-gray-400">Séries Disputadas:</span>
                    <strong className="text-cyan-400 font-mono font-black">{t.seriesList?.length || 0}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}