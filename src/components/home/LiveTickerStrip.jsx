import React from 'react';
import { Radio, ChevronRight, Zap, Shield, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import TeamLogo from '../../utils/teamLogos';

export default function LiveTickerStrip() {
  const { liveGames, setSelectedLiveGame } = useApp();

  if (!liveGames || liveGames.length === 0) {
    return (
      <div className="w-full bg-[#11141E]/80 border-y border-[#212838] py-2.5 px-4 mb-6">
        <div className="max-w-[1680px] mx-auto flex items-center justify-between gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500/80"></span>
            <span className="font-semibold text-gray-300">Servidores DotaTV Conectados:</span>
            <span>Nenhuma partida profissional oficial ao vivo no momento. Confira a agenda abaixo.</span>
          </div>
          <Link
            to="/ao-vivo"
            className="text-amber-400 hover:text-amber-300 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1"
          >
            <span>Ver Central Ao Vivo</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-r from-red-950/60 via-[#131722] to-red-950/60 border-y border-red-900/50 py-3 px-4 mb-6 backdrop-blur-md">
      <div className="max-w-[1680px] mx-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-red-400">
              Partidas Ao Vivo Agora ({liveGames.length})
            </span>
          </div>
          <Link
            to="/ao-vivo"
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 uppercase tracking-wider"
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
            const durationMin = Math.floor((game.duration || 0) / 60);
            const durationSec = String((game.duration || 0) % 60).padStart(2, '0');
            const goldLead = game.radiant_lead || game.gold_lead || 0;

            return (
              <div
                key={game.match_id || idx}
                onClick={() => setSelectedLiveGame(game)}
                className="flex-shrink-0 cursor-pointer bg-[#0D1017] hover:bg-[#131824] border border-[#262F44] hover:border-amber-500/40 rounded-xl p-3 min-w-[280px] sm:min-w-[320px] transition-all shadow-lg"
              >
                {/* Cabeçalho do Card */}
                <div className="flex items-center justify-between text-[11px] text-gray-400 mb-2 border-b border-white/5 pb-1.5">
                  <span className="font-semibold truncate max-w-[170px] text-amber-400/90">
                    {game.league_name || 'Torneio Oficial'}
                  </span>
                  <span className="font-mono text-white font-bold bg-white/5 px-2 py-0.5 rounded">
                    {durationMin}:{durationSec}
                  </span>
                </div>

                {/* Placar e Times */}
                <div className="flex items-center justify-between gap-3">
                  {/* Radiant */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <TeamLogo teamName={radName} logoUrl={game.radiant_logo} className="w-6 h-6 rounded" />
                    <span className="text-xs font-bold text-emerald-400 truncate">{radName}</span>
                  </div>

                  {/* Kills Placar */}
                  <div className="flex items-center gap-1.5 font-mono font-black text-sm px-2 py-0.5 rounded bg-black/40 border border-white/10">
                    <span className="text-emerald-400">{radScore}</span>
                    <span className="text-gray-500">:</span>
                    <span className="text-red-400">{direScore}</span>
                  </div>

                  {/* Dire */}
                  <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                    <span className="text-xs font-bold text-red-400 truncate text-right">{direName}</span>
                    <TeamLogo teamName={direName} logoUrl={game.dire_logo} className="w-6 h-6 rounded" />
                  </div>
                </div>

                {/* Vantagem de Ouro / Indicador */}
                <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400 pt-1.5 border-t border-white/5">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>
                      {goldLead > 0
                        ? `Radiant +${(goldLead / 1000).toFixed(1)}k ouro`
                        : goldLead < 0
                        ? `Dire +${(Math.abs(goldLead) / 1000).toFixed(1)}k ouro`
                        : 'Ouro equilibrado'}
                    </span>
                  </span>
                  <span className="text-amber-400 font-bold hover:underline">Ver telemetria →</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
