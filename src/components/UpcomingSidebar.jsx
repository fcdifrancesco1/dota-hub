import React, { useState } from 'react';
import { Calendar, Clock, Swords, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import { SkeletonCard } from './SkeletonLoader';

export default function UpcomingSidebar({
  upcoming = [],
  loading = false,
  onOpenTeamProfile,
  searchQuery = ""
}) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const filtered = upcoming.filter(m => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (m.timeA && m.timeA.toLowerCase().includes(q)) ||
      (m.timeB && m.timeB.toLowerCase().includes(q)) ||
      (m.torneio && m.torneio.toLowerCase().includes(q))
    );
  });

  return (
    <aside className="w-full lg:w-[340px] bg-[#0E1118]/80 backdrop-blur-xl border-l border-white/10 flex flex-col h-full overflow-hidden">
      <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-2 font-extrabold uppercase text-xs tracking-wider text-cyan-400">
          <Calendar className="w-4 h-4 text-cyan-400" />
          Próximos Confrontos
        </div>
        <span className="text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full">
          EM BREVE
        </span>
      </div>

      <div className="overflow-y-auto flex-1 p-3 space-y-2.5 custom-scrollbar">
        {loading ? (
          <div className="space-y-2.5">
            <SkeletonCard rows={2} />
            <SkeletonCard rows={2} />
            <SkeletonCard rows={2} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 px-4 text-xs text-gray-400">
            Nenhum confronto agendado no momento {searchQuery ? `para "${searchQuery}"` : ""}.
          </div>
        ) : (
          filtered.map((m, idx) => {
            const isExpanded = expandedIndex === idx;
            const matchDate = m.data ? new Date(m.data) : null;
            const timeStr = matchDate
              ? matchDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
              : "A definir";
            const dateStr = matchDate
              ? matchDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
              : "";

            return (
              <div
                key={idx}
                className="bg-[#161A24]/70 hover:bg-[#1C2230]/90 border border-white/10 hover:border-cyan-500/50 rounded-xl overflow-hidden transition-all duration-200 shadow-sm"
              >
                {/* Nome do Torneio */}
                <div className="px-3 py-1.5 bg-black/40 border-b border-white/5 flex items-center justify-between text-[10px]">
                  <span className="font-bold text-amber-400 truncate max-w-[190px] uppercase">
                    {m.torneio || "Torneio Profissional"}
                  </span>
                  <span className="font-mono text-cyan-400 font-bold bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded text-[9px]">
                    {m.formato || "BO3"}
                  </span>
                </div>

                {/* Confronto */}
                <div
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                  className="p-3 cursor-pointer flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                      <span className="text-xs font-bold text-white truncate">{m.timeA}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                      <span className="text-xs font-bold text-white truncate">{m.timeB}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-gray-300">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      {timeStr} <span className="text-[9px] text-gray-500">BRT</span>
                    </div>
                    {dateStr && (
                      <span className="text-[9px] text-gray-500 font-mono">{dateStr}</span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                    )}
                  </div>
                </div>

                {/* Bloco Expandido: Ações rápidas & Head-to-Head */}
                {isExpanded && (
                  <div className="p-3 bg-black/40 border-t border-white/5 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                      <span>Formato da Série:</span>
                      <strong className="text-white font-mono">{m.formato || "BO3 (Melhor de 3)"}</strong>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenTeamProfile && m.teamAId) onOpenTeamProfile(m.teamAId, m.timeA);
                        }}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/40 text-[10px] font-bold text-cyan-300 text-center truncate transition-all"
                      >
                        Perfil {m.timeA}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenTeamProfile && m.teamBId) onOpenTeamProfile(m.teamBId, m.timeB);
                        }}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/40 text-[10px] font-bold text-rose-300 text-center truncate transition-all"
                      >
                        Perfil {m.timeB}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
