import React from 'react';
import { ChevronRight, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useOpenLiveMatch } from '../../utils/liveMatchRoute';
import TeamLogo from '../../utils/teamLogos';
import BetweenMapsCard, { STRIP_CARD } from '../BetweenMapsCard';
import { seriesTypeLabel } from '../../utils/seriesStatus';

// "em 12h40" / "em 25 min" até o horário (segundos); null se já passou
function timeUntil(ts, now = Date.now()) {
  const mins = Math.round((Number(ts) * 1000 - now) / 60000);
  if (!ts || mins <= 0) return null;
  if (mins < 60) return `em ${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `em ${h}h${m ? String(m).padStart(2, '0') : ''}`;
}

export default function LiveTickerStrip() {
  const { liveGames, betweenMaps, upcomingMatches, loading } = useApp();
  const openLiveMatch = useOpenLiveMatch();
  const total = (liveGames?.length || 0) + (betweenMaps?.length || 0);

  if (total === 0) {
    // Sem jogo ao vivo: o próximo jogo da agenda responde "quando tem jogo?"
    const next = (upcomingMatches || []).find((m) => timeUntil(m.timestamp));
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-2.5 mb-2">
        <div className="w-full flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 text-xs text-gray-400">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
            <span className="w-2 h-2 shrink-0 rounded-full bg-gray-600" aria-hidden="true"></span>
            <span className="font-semibold text-white">{loading ? 'Buscando os jogos ao vivo...' : 'Nenhum jogo ao vivo agora'}</span>
            {!loading && next && (
              <Link to="/partidas" className="min-w-0 hover:text-white transition-colors">
                <span className="text-gray-400" aria-hidden="true">· </span>
                Próximo: <span className="text-white font-medium">{next.timeA} x {next.timeB}</span>
                {next.tourneyName ? <span> · {next.tourneyName}</span> : null}
                <span className="font-mono"> · {next.startTime} ({timeUntil(next.timestamp)})</span>
              </Link>
            )}
          </div>
          <Link
            to="/ao-vivo"
            className="text-amber-500 hover:text-amber-400 font-medium text-xs flex items-center gap-1 transition-colors"
          >
            <span>Central ao vivo</span>
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
            <span className="text-xs font-semibold text-red-500">
              Partidas ao vivo agora ({total})
            </span>
          </div>
          <Link
            to="/ao-vivo"
            className="text-xs font-medium text-amber-500 hover:text-amber-400 flex items-center gap-1 transition-colors"
          >
            <span>Central ao vivo</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Scroll Horizontal de Cards Ao Vivo */}
        {/* items-stretch + largura fixa: cards ao vivo e "entre mapas" do mesmo tamanho */}
        <div className="flex items-stretch gap-3 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/10">
          {liveGames.map((game, idx) => {
            const radName = game.radiant_name || game.team1 || 'Radiant';
            const direName = game.dire_name || game.team2 || 'Dire';
            const radScore = game.radiant_score ?? game.score1 ?? 0;
            const direScore = game.dire_score ?? game.score2 ?? 0;
            const totalSec = Math.floor(game.duration || 0);
            const durationMin = Math.floor(totalSec / 60);
            const durationSec = String(totalSec % 60).padStart(2, '0');
            const goldLead = game.radiant_lead || game.gold_lead || 0;
            const hasSeries = Number.isFinite(game.radiant_series_wins) && Number.isFinite(game.dire_series_wins) &&
              game.radiant_series_wins + game.dire_series_wins > 0;

            return (
              <button
                type="button"
                key={game.match_id || idx}
                onClick={() => openLiveMatch(game)}
                aria-label={`${radName} ${radScore} x ${direScore} ${direName}, ver partida ao vivo`}
                className={`${STRIP_CARD} text-left bg-surface/80 hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400`}
              >
                {/* Cabeçalho do Card */}
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2 border-b border-line/60 pb-1.5">
                  <span className="font-semibold truncate max-w-[170px] text-amber-500">
                    {game.league_name || 'Torneio oficial'}
                  </span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono text-[11px] text-gray-400">
                      {seriesTypeLabel(game.series_type)}{hasSeries && ` · ${game.radiant_series_wins}:${game.dire_series_wins}`}
                    </span>
                    <span className="font-mono text-white font-medium bg-surface-2 px-2 py-0.5 rounded">
                      {durationMin}:{durationSec}
                    </span>
                  </span>
                </div>

                {/* Placar e Times */}
                <div className="flex items-center justify-between gap-3">
                  {/* Radiant */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <TeamLogo teamName={radName} teamId={game.radiant_team?.team_id || game.radiant_team_id} logoUrl={game.radiant_logo} className="w-6 h-6 rounded shrink-0 shadow-sm" />
                    <span className="text-xs font-medium text-emerald-500 leading-tight break-words line-clamp-2">{radName}</span>
                  </div>

                  {/* Kills Placar */}
                  <div className="flex items-center gap-1.5 font-mono font-semibold text-sm px-2.5 py-0.5 rounded-lg bg-surface-2 shrink-0">
                    <span className="text-emerald-500">{radScore}</span>
                    <span className="text-gray-400">:</span>
                    <span className="text-red-500">{direScore}</span>
                  </div>

                  {/* Dire */}
                  <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                    <span className="text-xs font-medium text-red-500 leading-tight break-words line-clamp-2 text-right">{direName}</span>
                    <TeamLogo teamName={direName} teamId={game.dire_team?.team_id || game.dire_team_id} logoUrl={game.dire_logo} className="w-6 h-6 rounded shrink-0 shadow-sm" />
                  </div>
                </div>

                {/* Vantagem de Ouro / Indicador */}
                <div className="mt-2.5 flex items-center justify-between text-[11px] text-gray-400 pt-1.5 border-t border-line/60">
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
                  <span className="text-amber-500 font-medium">Ver partida →</span>
                </div>
              </button>
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
