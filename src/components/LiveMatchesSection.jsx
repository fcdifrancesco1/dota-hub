import React from 'react';
import { Radio, Eye, Tv, Swords, ExternalLink } from 'lucide-react';
import { SkeletonCard } from './SkeletonLoader';

export default function LiveMatchesSection({ liveGames = [], loading = false, onSelectLiveGame }) {
  return (
    <section className="w-full max-w-4xl space-y-3.5">
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
          </span>
          <h2 className="text-xs font-black uppercase tracking-widest text-amber-400">Partidas Ao Vivo</h2>
          {liveGames.length > 0 && (
            <span className="text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 px-2.5 py-0.5 rounded-full animate-pulse">
              {liveGames.length} EM ANDAMENTO
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <SkeletonCard rows={2} />
          <SkeletonCard rows={2} />
        </div>
      ) : liveGames.length === 0 ? (
        <div className="bg-[#0E1118]/70 border border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-2 backdrop-blur-xl">
          <Radio className="w-8 h-8 text-amber-500/40 animate-pulse" />
          <span className="text-sm font-bold text-white">Nenhuma partida oficial ao vivo no momento</span>
          <span className="text-xs text-gray-400 max-w-md">
            As transmissões de torneios profissionais aparecem aqui automaticamente quando estiverem em andamento. Confira os próximos confrontos na coluna à direita!
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {liveGames.map((g, idx) => {
            const isLiquipedia = !!g.timeA;

            const rName = isLiquipedia
              ? g.timeA
              : (g.radiant_team && (g.radiant_team.team_name || g.radiant_team.name)) || "Radiant";
            const dName = isLiquipedia
              ? g.timeB
              : (g.dire_team && (g.dire_team.team_name || g.dire_team.name)) || "Dire";

            const rLogo = isLiquipedia ? g.logoA : "";
            const dLogo = isLiquipedia ? g.logoB : "";

            const sb = g.scoreboard || {};
            // O placar principal é SEMPRE o Placar de Abates do Jogo (Game Score Kills)
            const rScore = g.gameScoreA !== undefined
              ? g.gameScoreA
              : (sb.radiant ? sb.radiant.score : (g.radiant_score ?? g.scoreA ?? 0));
            const dScore = g.gameScoreB !== undefined
              ? g.gameScoreB
              : (sb.dire ? sb.dire.score : (g.dire_score ?? g.scoreB ?? 0));

            const mins = g.gameDuration ? Math.floor(g.gameDuration / 60) : (!isLiquipedia ? Math.floor((sb.duration || g.duration || 0) / 60) : null);
            const leagueName = g.torneio || (g.league_tier ? `Liga Tier ${g.league_tier}` : "Torneio Dota 2");
            const formatStr = g.formato || "BO3";

            return (
              <div
                key={idx}
                onClick={() => onSelectLiveGame && onSelectLiveGame(g)}
                className="group bg-[#161A24]/90 hover:bg-[#1C2230] border border-rose-500/30 hover:border-rose-400 rounded-2xl p-4.5 cursor-pointer transition-all duration-200 shadow-md hover:shadow-xl hover:shadow-rose-500/10 hover:-translate-y-1 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between gap-3"
              >
                {/* Indicador de glow sutil ao vivo */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />

                {/* Topo do Card */}
                <div className="flex items-center justify-between text-[10px] border-b border-white/5 pb-2.5">
                  <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-rose-400">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    AO VIVO {mins ? `· ${mins} min` : '· Em andamento'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400 truncate max-w-[140px] font-semibold">{leagueName}</span>
                    <span className="font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded text-[9px] font-bold">
                      {formatStr}
                    </span>
                  </div>
                </div>

                {/* Confronto e Placar do Jogo (Abates) */}
                <div className="flex items-center justify-between gap-3 py-1 relative z-10">
                  <div className="flex-1 text-left truncate flex items-center gap-2">
                    {rLogo ? (
                      <img src={rLogo} alt="" className="w-5 h-5 object-contain shrink-0" onError={(e) => { e.target.style.display = 'none'; }} />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    )}
                    <div className="truncate">
                      <span className="text-xs font-black text-white truncate block">{rName}</span>
                      <span className="text-[9px] text-emerald-400 font-bold uppercase">Time A</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center shrink-0">
                    <div className="px-3.5 py-1 bg-black/80 border border-rose-500/30 rounded-xl text-base sm:text-lg font-mono font-black text-amber-400 shadow-inner">
                      {rScore} <span className="text-gray-500 mx-0.5">:</span> {dScore}
                    </div>
                    <span className="text-[8px] text-gray-400 font-mono mt-0.5 uppercase tracking-wider">
                      Placar do Jogo
                    </span>
                  </div>

                  <div className="flex-1 text-right truncate flex items-center justify-end gap-2">
                    <div className="truncate">
                      <span className="text-xs font-black text-white truncate block">{dName}</span>
                      <span className="text-[9px] text-rose-400 font-bold uppercase">Time B</span>
                    </div>
                    {dLogo ? (
                      <img src={dLogo} alt="" className="w-5 h-5 object-contain shrink-0" onError={(e) => { e.target.style.display = 'none'; }} />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                    )}
                  </div>
                </div>

                {/* Rodapé: Botão de Stream ou Acompanhar */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                  {g.streamUrl ? (
                    <a
                      href={g.streamUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-extrabold text-xs transition-all"
                    >
                      <Tv className="w-3.5 h-3.5" /> Assistir Stream Oficial
                    </a>
                  ) : (
                    <span className="text-gray-400 text-[10px] flex items-center gap-1">
                      <Radio className="w-3 h-3 text-rose-400" /> Transmissão ao vivo
                    </span>
                  )}

                  <span className="text-gray-400 group-hover:text-amber-400 transition-colors flex items-center gap-1 text-[10px] font-bold">
                    Ver Telemetria <Eye className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
