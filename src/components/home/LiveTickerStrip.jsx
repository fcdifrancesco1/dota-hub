import React from 'react';
import { Radio, ChevronRight, Zap, Shield, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useOpenLiveMatch } from '../../utils/liveMatchRoute';
import TeamLogo from '../../utils/teamLogos';
import BetweenMapsCard from '../BetweenMapsCard';

export default function LiveTickerStrip() {
  const { liveGames, betweenMaps } = useApp();
  const openLiveMatch = useOpenLiveMatch();
  const total = (liveGames?.length || 0) + (betweenMaps?.length || 0);

  if (total === 0) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-2.5 mb-2">
        <div className="w-full flex items-center justify-between gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-white">Servidores DotaTV Conectados:</span>
            <span>Nenhuma partida profissional oficial ao vivo no momento. Confira a agenda abaixo.</span>
          </div>
          <Link
            to="/ao-vivo"
            className="text-amber-500 hover:text-amber-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1 transition-colors"
          >
            <span>Ver Central Ao Vivo</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-3 mb-2">
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-red-500">
              Partidas Ao Vivo Agora ({total})
            </span>
          </div>
          <Link
            to="/ao-vivo"
            className="text-xs font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1 uppercase tracking-wider transition-colors"
          >
            <span>Central Multitela</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Scroll Horizontal de Cards Ao Vivo */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/10">
          {liveGames.map((game, idx) => {
            const radName = game.radiant_name || game.team1 || 'Radiant';
            const direName = game.dire_name || game.team2 || 'Dire';
            const radScore = game.radiant_score ?? game.score1 ?? 0;
            const direScore = game.dire_score ?? game.score2 ?? 0;
            const totalSec = Math.floor(game.duration || 0);
            const durationMin = Math.floor(totalSec / 60);
            const durationSec = String(totalSec % 60).padStart(2, '0');
            const goldLead = game.radiant_lead || game.gold_lead || 0;

            return (
              <div
                key={game.match_id || idx}
                onClick={() => openLiveMatch(game)}
                className="flex-shrink-0 cursor-pointer bg-surface/80 hover:bg-surface rounded-2xl p-3 min-w-[280px] sm:min-w-[320px] transition-all home-float"
              >
                {/* Cabeçalho do Card */}
                <div className="flex items-center justify-between text-[11px] text-gray-400 mb-2 border-b border-line/60 pb-1.5">
                  <span className="font-semibold truncate max-w-[170px] text-amber-500">
                    {game.league_name || 'Torneio Oficial'}
                  </span>
                  <span className="font-mono text-white font-bold bg-surface-2 px-2 py-0.5 rounded">
                    {durationMin}:{durationSec}
                  </span>
                </div>

                {/* Placar e Times */}
                <div className="flex items-center justify-between gap-3">
                  {/* Radiant */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <TeamLogo teamName={radName} teamId={game.radiant_team?.team_id || game.radiant_team_id} logoUrl={game.radiant_logo} className="w-6 h-6 rounded shrink-0 shadow-sm" />
                    <span className="text-xs font-bold text-emerald-500 leading-tight break-words line-clamp-2">{radName}</span>
                  </div>

                  {/* Kills Placar */}
                  <div className="flex items-center gap-1.5 font-mono font-black text-sm px-2.5 py-0.5 rounded-lg bg-surface-2 shrink-0">
                    <span className="text-emerald-500">{radScore}</span>
                    <span className="text-gray-400">:</span>
                    <span className="text-red-500">{direScore}</span>
                  </div>

                  {/* Dire */}
                  <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                    <span className="text-xs font-bold text-red-500 leading-tight break-words line-clamp-2 text-right">{direName}</span>
                    <TeamLogo teamName={direName} teamId={game.dire_team?.team_id || game.dire_team_id} logoUrl={game.dire_logo} className="w-6 h-6 rounded shrink-0 shadow-sm" />
                  </div>
                </div>

                {/* Vantagem de Ouro / Indicador */}
                <div className="mt-2.5 flex items-center justify-between text-[10px] text-gray-400 pt-1.5 border-t border-line/60">
                  <span className="flex items-center gap-1 font-medium">
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span>
                      {goldLead > 0
                        ? `Radiant +${(goldLead / 1000).toFixed(1)}k ouro`
                        : goldLead < 0
                        ? `Dire +${(Math.abs(goldLead) / 1000).toFixed(1)}k ouro`
                        : 'Ouro equilibrado'}
                    </span>
                  </span>
                  <span className="text-amber-500 font-bold hover:underline">Ver partida →</span>
                </div>
              </div>
            );
          })}
          {(betweenMaps || []).map((item) => (
            <BetweenMapsCard key={item.key} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
