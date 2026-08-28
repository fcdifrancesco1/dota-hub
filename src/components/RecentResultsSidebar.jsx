import React from 'react';
import { History, Trophy, Swords, ChevronRight } from 'lucide-react';
import { SkeletonCard } from './SkeletonLoader';

export default function RecentResultsSidebar({
  series = [],
  loading = false,
  onSelectSeries,
  searchQuery = ""
}) {
  const filtered = series.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (s.timeA && s.timeA.toLowerCase().includes(q)) ||
      (s.timeB && s.timeB.toLowerCase().includes(q)) ||
      (s.stage && s.stage.toLowerCase().includes(q))
    );
  });

  return (
    <aside className="w-full lg:w-[320px] bg-[#0E1118]/80 backdrop-blur-xl border-r border-white/10 flex flex-col h-full overflow-hidden">
      <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-2 font-extrabold uppercase text-xs tracking-wider text-amber-400">
          <History className="w-4 h-4 text-amber-400" />
          Resultados Recentes
        </div>
        <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
          {filtered.length} SÉRIES
        </span>
      </div>

      <div className="overflow-y-auto flex-1 p-3 space-y-2.5 custom-scrollbar">
        {loading ? (
          <div className="space-y-2.5">
            <SkeletonCard rows={2} />
            <SkeletonCard rows={2} />
            <SkeletonCard rows={2} />
            <SkeletonCard rows={2} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 px-4 text-xs text-gray-400">
            Nenhuma série encontrada {searchQuery ? `para "${searchQuery}"` : ""}.
          </div>
        ) : (
          filtered.map((s, idx) => {
            const aWon = s.scoreA > s.scoreB;
            const bWon = s.scoreB > s.scoreA;

            return (
              <div
                key={idx}
                onClick={() => onSelectSeries(s)}
                className="group relative bg-[#161A24]/70 hover:bg-[#1C2230]/90 border border-white/10 hover:border-amber-500/50 rounded-xl p-3 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-amber-500/5 hover:-translate-y-0.5"
              >
                {/* Cabeçalho do Card */}
                <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2 mb-2 text-[10px]">
                  <span className="font-bold text-amber-400/90 truncate uppercase tracking-wider max-w-[190px]">
                    {s.stage || "Torneio Profissional"}
                  </span>
                  <span className="font-mono text-gray-400 font-semibold bg-black/40 px-1.5 py-0.5 rounded border border-white/5">
                    {s.dur}
                  </span>
                </div>

                {/* Linha Time A */}
                <div className="flex items-center justify-between gap-2 py-1">
                  <div className="flex items-center gap-2 truncate">
                    <span className={`text-xs font-bold truncate ${aWon ? 'text-white font-extrabold' : 'text-gray-400'}`}>
                      {s.timeA}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-xs font-black px-2 py-0.5 rounded ${
                      aWon
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : s.scoreA === s.scoreB
                        ? 'bg-white/10 text-white'
                        : 'bg-rose-500/10 text-rose-400/80 border border-rose-500/20'
                    }`}
                  >
                    {s.scoreA}
                  </span>
                </div>

                {/* Linha Time B */}
                <div className="flex items-center justify-between gap-2 py-1">
                  <div className="flex items-center gap-2 truncate">
                    <span className={`text-xs font-bold truncate ${bWon ? 'text-white font-extrabold' : 'text-gray-400'}`}>
                      {s.timeB}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-xs font-black px-2 py-0.5 rounded ${
                      bWon
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : s.scoreA === s.scoreB
                        ? 'bg-white/10 text-white'
                        : 'bg-rose-500/10 text-rose-400/80 border border-rose-500/20'
                    }`}
                  >
                    {s.scoreB}
                  </span>
                </div>

                <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-400 group-hover:text-amber-400 transition-colors">
                  <span>Ver Replay & Draft</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
