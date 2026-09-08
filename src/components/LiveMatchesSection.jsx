import React from 'react';
import { Radio, Eye, Tv, Swords, ExternalLink } from 'lucide-react';
import { SkeletonCard } from './SkeletonLoader';
import TeamLogo from '../utils/teamLogos';

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            // O placar principal é SEMPRE o Placar de Abates real do Jogo (Game Score Kills)
            const rScore = g.gameScoreA !== undefined && g.gameScoreA !== null
              ? g.gameScoreA
              : (sb.radiant ? sb.radiant.score : (g.radiant_score ?? (isLiquipedia ? null : g.scoreA) ?? null));
            const dScore = g.gameScoreB !== undefined && g.gameScoreB !== null
              ? g.gameScoreB
              : (sb.dire ? sb.dire.score : (g.dire_score ?? (isLiquipedia ? null : g.scoreB) ?? null));
            const hasRealScore = rScore !== null && dScore !== null;

            const mins = g.gameDuration ? Math.floor(g.gameDuration / 60) : (!isLiquipedia ? Math.floor((sb.duration || g.duration || 0) / 60) : null);
            const leagueName = g.torneio || (g.league_tier ? `Liga Tier ${g.league_tier}` : "Torneio Dota 2");
            const formatStr = g.formato || "BO3";

            return (
              <div
                key={idx}
                onClick={() => onSelectLiveGame && onSelectLiveGame(g)}
                className="group bg-[#161A24]/90 hover:bg-[#1C2230] border border-rose-500/30 hover:border-rose-400 rounded-2xl p-5 sm:p-6 cursor-pointer transition-all duration-200 shadow-md hover:shadow-xl hover:shadow-rose-500/10 hover:-translate-y-1 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between gap-4"
              >
                {/* Indicador de glow sutil ao vivo */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />

                {/* Topo do Card */}
                <div className="flex items-center justify-between text-xs border-b border-white/10 pb-3">
                  <span className="flex items-center gap-2 font-black uppercase tracking-wider text-rose-400 text-[10px] sm:text-[11px]">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                    </span>
                    AO VIVO {mins ? `· ${mins} MIN` : '· EM ANDAMENTO'}
                  </span>
                  <div className="flex items-center gap-2 min-w-0 justify-end">
                    <span className="text-gray-400 truncate max-w-[130px] sm:max-w-[170px] font-semibold text-[10px] sm:text-[11px]" title={leagueName}>
                      {leagueName}
                    </span>
                    <span className="font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold shrink-0">
                      {formatStr}
                    </span>
                  </div>
                </div>

                {/* Confronto e Placar do Jogo (Abates) - Grid 100% Simétrico */}
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2.5 sm:gap-3 py-1 relative z-10">
                  {/* Time A (Esquerda) */}
                  <div className="flex items-center gap-2.5 min-w-0 justify-start">
                    <TeamLogo
                      teamName={rName}
                      logoUrl={rLogo}
                      className="w-7 h-7 sm:w-8 h-8 rounded-lg bg-black/40 border border-white/10 p-0.5"
                    />
                    <div className="min-w-0">
                      <span className="text-xs sm:text-sm font-black text-white truncate block tracking-tight group-hover:text-amber-400 transition-colors" title={rName}>
                        {rName}
                      </span>
                      <span className="text-[9px] sm:text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                        Time A
                      </span>
                    </div>
                  </div>

                  {/* Placar Central do Jogo (Abates) */}
                  <div className="flex flex-col items-center justify-center shrink-0 px-2 sm:px-4">
                    {hasRealScore ? (
                      <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-xl bg-black/80 border border-rose-500/40 shadow-md shadow-rose-500/10">
                        <span className="font-mono text-base sm:text-xl font-black text-emerald-400">
                          {rScore}
                        </span>
                        <span className="text-gray-500 text-xs sm:text-sm font-bold">:</span>
                        <span className="font-mono text-base sm:text-xl font-black text-rose-400">
                          {dScore}
                        </span>
                      </div>
                    ) : (
                      <div className="px-2.5 py-1 rounded-lg bg-black/60 border border-white/10 text-[10px] font-mono text-gray-400">
                        VS
                      </div>
                    )}
                    <span className="text-[8px] sm:text-[9px] text-gray-500 font-mono mt-1 uppercase tracking-wider">
                      {hasRealScore ? 'Abates' : 'Confronto'}
                    </span>
                  </div>

                  {/* Time B (Direita) */}
                  <div className="flex items-center gap-2.5 min-w-0 justify-end text-right">
                    <div className="min-w-0">
                      <span className="text-xs sm:text-sm font-black text-white truncate block tracking-tight group-hover:text-amber-400 transition-colors" title={dName}>
                        {dName}
                      </span>
                      <span className="text-[9px] sm:text-[10px] text-rose-400 font-bold uppercase tracking-wider block">
                        Time B
                      </span>
                    </div>
                    <TeamLogo
                      teamName={dName}
                      logoUrl={dLogo}
                      className="w-7 h-7 sm:w-8 h-8 rounded-lg bg-black/40 border border-white/10 p-0.5"
                    />
                  </div>
                </div>

                {/* Rodapé: Botão de Stream ou Acompanhar */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  {g.streamUrl ? (
                    <a
                      href={g.streamUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-black text-xs transition-all shadow-sm"
                    >
                      <Tv className="w-3.5 h-3.5" /> Assistir Stream Oficial
                    </a>
                  ) : (
                    <span className="text-gray-400 text-[10px] sm:text-[11px] flex items-center gap-1.5 font-medium">
                      <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" /> Transmissão ao vivo
                    </span>
                  )}

                  <span className="text-gray-400 group-hover:text-amber-400 transition-colors flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold">
                    Ver Telemetria <Eye className="w-3.5 h-3.5 text-cyan-400" />
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
