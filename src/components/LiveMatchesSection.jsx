import React from 'react';
import { Radio, Eye, Swords } from 'lucide-react';
import { SkeletonCard } from './SkeletonLoader';

export default function LiveMatchesSection({ liveGames = [], loading = false, onSelectLiveGame }) {
  return (
    <section className="w-full max-w-4xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
          </span>
          <h2 className="text-xs font-black uppercase tracking-widest text-amber-400">Partidas Ao Vivo</h2>
          {liveGames.length > 0 && (
            <span className="text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 px-2 py-0.5 rounded-full">
              {liveGames.length} EM ANDAMENTO
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SkeletonCard rows={2} />
          <SkeletonCard rows={2} />
        </div>
      ) : liveGames.length === 0 ? (
        <div className="bg-[#0E1118]/70 border border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-2 backdrop-blur-xl">
          <Radio className="w-8 h-8 text-amber-500/40 animate-pulse" />
          <span className="text-sm font-bold text-white">Nenhuma partida oficial ao vivo no momento</span>
          <span className="text-xs text-gray-400 max-w-md">
            Novas transmissões de torneios profissionais aparecem aqui automaticamente via DotaTV. Confira os próximos confrontos agendados na coluna à direita!
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {liveGames.map((g, idx) => {
            const sb = g.scoreboard || {};
            const rScore = sb.radiant ? sb.radiant.score : (g.radiant_score ?? 0);
            const dScore = sb.dire ? sb.dire.score : (g.dire_score ?? 0);
            const mins = Math.floor((sb.duration || g.duration || 0) / 60);
            const rName = (g.radiant_team && (g.radiant_team.team_name || g.radiant_team.name)) || "Radiant";
            const dName = (g.dire_team && (g.dire_team.team_name || g.dire_team.name)) || "Dire";
            const leagueName = g.league_tier ? `Liga Tier ${g.league_tier}` : "Torneio Dota 2";

            return (
              <div
                key={idx}
                onClick={() => onSelectLiveGame && onSelectLiveGame(g)}
                className="group bg-[#161A24]/80 hover:bg-[#1C2230] border border-white/10 hover:border-amber-500/60 rounded-xl p-4 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-amber-500/10 hover:-translate-y-0.5 backdrop-blur-xl"
              >
                <div className="flex items-center justify-between text-[10px] border-b border-white/5 pb-2 mb-3">
                  <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-rose-400">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    Ao Vivo · {mins} min
                  </span>
                  <span className="text-gray-400 truncate max-w-[150px] font-semibold">{leagueName}</span>
                </div>

                <div className="flex items-center justify-between gap-3 py-1">
                  <div className="flex-1 text-left truncate">
                    <span className="text-xs font-bold text-white truncate block">{rName}</span>
                    <span className="text-[10px] text-emerald-400 font-semibold">Radiant</span>
                  </div>

                  <div className="px-3 py-1 bg-black/60 border border-white/10 rounded-lg text-sm font-mono font-black text-amber-400">
                    {rScore} - {dScore}
                  </div>

                  <div className="flex-1 text-right truncate">
                    <span className="text-xs font-bold text-white truncate block">{dName}</span>
                    <span className="text-[10px] text-rose-400 font-semibold">Dire</span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-400 group-hover:text-amber-400 transition-colors">
                  <span>Acompanhar tempo real</span>
                  <Eye className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
