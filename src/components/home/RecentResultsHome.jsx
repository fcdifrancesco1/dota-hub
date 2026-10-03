import React from 'react';
import { Trophy, ChevronRight, CheckCircle2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp, findLiveGameFor } from '../../context/AppContext';
import { useOpenSeries } from '../../utils/matchRoute';
import { useOpenLiveMatch } from '../../utils/liveMatchRoute';
import TeamLogo from '../../utils/teamLogos';
import { isSeriesOngoing } from '../../utils/seriesStatus';

export default function RecentResultsHome() {
  const { finishedSeries, ongoingSeries, liveGames, loading } = useApp();
  const openSeries = useOpenSeries();
  const openLiveMatch = useOpenLiveMatch();

  // Séries da Liquipedia (em andamento ou recém-encerradas, ainda sem registro na
  // OpenDota) junto com as concluídas da OpenDota: em andamento primeiro, depois
  // tudo por data, da mais recente para a mais antiga.
  // Séries da OpenDota ainda incompletas (ex.: 1x0 numa MD3) também estão em andamento
  const isDone = (m) => (m.fromWiki ? Boolean(m.isCompleted || m.winner) : !isSeriesOngoing(m));
  const wikiItems = (ongoingSeries || []).map((m) => ({ ...m, fromWiki: true, sortTime: m.timestamp || 0 }));
  const odItems = (finishedSeries || []).map((s) => ({ ...s, sortTime: s.lastMatchTime || s.startTime || 0 }));
  const recent10 = [
    ...[...wikiItems, ...odItems].filter((m) => !isDone(m)),
    ...[...wikiItems, ...odItems].filter(isDone).sort((a, b) => b.sortTime - a.sortTime)
  ].slice(0, 8);

  if (loading) {
    return (
      <div className="bg-surface border border-line rounded-2xl p-5 shadow-xl">
        <div className="h-6 w-44 bg-white/5 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-line rounded-2xl p-5 shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/5 mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-black uppercase tracking-wider text-white whitespace-nowrap">
              Resultados Recentes
            </h3>
          </div>
          <Link
            to="/partidas"
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 uppercase tracking-wider whitespace-nowrap shrink-0"
          >
            <span>Ver Histórico</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recent10.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-xs">
            Nenhum resultado recente registrado.
          </div>
        ) : (
          <div className="space-y-2.5">
            {recent10.map((series, idx) => {
              const teamAName = series.team1_name || series.timeA || 'Team 1';
              const teamBName = series.team2_name || series.timeB || 'Team 2';
              const scoreA = series.score_team1 ?? series.scoreA ?? 0;
              const scoreB = series.score_team2 ?? series.scoreB ?? 0;
              const tourney = series.league_name || series.tourneyName || series.stage || 'Torneio';
              // Série em andamento não tem vencedor ainda
              const decided = isDone(series);
              const isWinnerA = decided && scoreA > scoreB;
              const isWinnerB = decided && scoreB > scoreA;

              // Série da Liquipedia: abre a partida ao vivo (se houver) ou a transmissão
              const liveGame = series.fromWiki ? findLiveGameFor(series, liveGames) : null;
              const wikiStatus = series.fromWiki
                ? (liveGame ? 'Ao vivo' : isDone(series) ? 'Encerrada' : 'Em andamento')
                : (!isDone(series) ? 'Em andamento' : null);
              const onClick = !series.fromWiki
                ? () => openSeries(series)
                : liveGame
                  ? () => openLiveMatch(liveGame)
                  : (!isDone(series) && series.streamUrl)
                    ? () => window.open(series.streamUrl, '_blank', 'noopener')
                    : undefined;

              return (
                <div
                  key={series.series_id || series.id || `${teamAName}-${teamBName}-${series.sortTime || idx}`}
                  onClick={onClick}
                  className={`bg-surface-2 hover:bg-surface-2 border rounded-xl p-3 transition-all group ${
                    !isDone(series) ? 'border-red-500/30' : 'border-surface-3'
                  } ${onClick ? 'cursor-pointer hover:border-amber-500/30' : ''}`}
                >
                  <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1.5">
                    <span className="font-semibold truncate max-w-[200px] text-amber-400/80">
                      {tourney}
                    </span>
                    {wikiStatus ? (
                      <span className={`flex items-center gap-1 font-bold ${isDone(series) ? 'text-gray-400' : 'text-red-400'}`}>
                        {!isDone(series) && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                        {wikiStatus}
                      </span>
                    ) : (
                      <span className="text-gray-400 group-hover:text-amber-400 font-bold transition-colors">
                        Ver detalhes →
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    {/* Time A */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <TeamLogo teamName={teamAName} teamId={series.team1_id || series.preferredIdA} logoUrl={series.team1_logo || series.logoA} className="w-5 h-5" />
                      <span className={`text-xs font-bold leading-tight break-words line-clamp-2 ${isWinnerA ? 'text-amber-400 font-black' : 'text-gray-300'}`}>
                        {teamAName}
                      </span>
                    </div>

                    {/* Placar */}
                    <div className="flex items-center gap-1 font-mono font-black text-xs px-2 py-0.5 rounded bg-black/40 border border-white/5">
                      <span className={isWinnerA ? 'text-emerald-400' : 'text-gray-400'}>{scoreA}</span>
                      <span className="text-gray-500">-</span>
                      <span className={isWinnerB ? 'text-emerald-400' : 'text-gray-400'}>{scoreB}</span>
                    </div>

                    {/* Time B */}
                    <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                      <span className={`text-xs font-bold leading-tight break-words line-clamp-2 text-right ${isWinnerB ? 'text-amber-400 font-black' : 'text-gray-300'}`}>
                        {teamBName}
                      </span>
                      <TeamLogo teamName={teamBName} teamId={series.team2_id || series.preferredIdB} logoUrl={series.team2_logo || series.logoB} className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-gray-500 text-center">
        Clique em qualquer série para conferir o draft completo e a tabela de jogadores.
      </div>
    </div>
  );
}
