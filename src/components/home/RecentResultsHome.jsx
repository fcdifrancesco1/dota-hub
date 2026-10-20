import React, { useState } from 'react';
import { Trophy, ChevronRight, CheckCircle2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp, findLiveGameFor } from '../../context/AppContext';
import { useOpenSeries } from '../../utils/matchRoute';
import { useOpenLiveMatch } from '../../utils/liveMatchRoute';
import TeamLogo from '../../utils/teamLogos';
import { isSeriesOngoing } from '../../utils/seriesStatus';
import MatchPreviewModal from '../MatchPreviewModal';
import { useOpenWikiSeries } from '../../utils/wikiSeries';

export default function RecentResultsHome() {
  const { finishedSeries, ongoingSeries, liveGames, loading } = useApp();
  const openSeries = useOpenSeries();
  const openLiveMatch = useOpenLiveMatch();
  // Série da Liquipedia sem mapa ao vivo nem dados na OpenDota: janela com os jogadores no torneio
  const [preview, setPreview] = useState(null);
  const openWikiSeries = useOpenWikiSeries();

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
      <div className="glass-panel rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="h-6 w-44 bg-slate-200 dark:bg-white/5 rounded-xl animate-pulse mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-slate-200 dark:bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-white/10 mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <Trophy className="w-4 h-4 text-blue-600 dark:text-amber-400" />
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white whitespace-nowrap">
              Resultados Recentes
            </h3>
          </div>
          <Link
            to="/partidas"
            className="text-xs font-bold text-blue-600 dark:text-amber-400 hover:text-blue-700 dark:hover:text-amber-300 flex items-center gap-1 uppercase tracking-wider whitespace-nowrap shrink-0 transition-colors"
          >
            <span>Ver Histórico</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recent10.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-gray-500 text-xs">
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

              // Série da Liquipedia: abre a partida ao vivo (se houver) ou as estatísticas dos jogadores
              const liveGame = series.fromWiki ? findLiveGameFor(series, liveGames) : null;
              const wikiStatus = series.fromWiki
                ? (liveGame ? 'Ao vivo' : isDone(series) ? 'Encerrada' : 'Em andamento')
                : (!isDone(series) ? 'Em andamento' : null);
              const onClick = !series.fromWiki
                ? () => openSeries(series)
                : liveGame
                  ? () => openLiveMatch(liveGame)
                  : () => openWikiSeries(series, setPreview);

              return (
                <div
                  key={series.series_id || series.id || `${teamAName}-${teamBName}-${series.sortTime || idx}`}
                  onClick={onClick}
                  className={`bg-white/70 dark:bg-white/5 hover:bg-white/95 dark:hover:bg-white/10 border rounded-2xl p-3.5 transition-all group shadow-sm ${
                    !isDone(series) ? 'border-rose-500/30' : 'border-slate-200/80 dark:border-white/10'
                  } ${onClick ? 'cursor-pointer hover:border-blue-500/40 hover:scale-[1.01]' : ''}`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-gray-400 mb-1.5">
                    <span className="font-semibold truncate max-w-[200px] text-blue-700 dark:text-amber-400/90">
                      {tourney}
                    </span>
                    {wikiStatus ? (
                      <span className={`flex items-center gap-1 font-bold ${isDone(series) ? 'text-slate-500 dark:text-gray-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {!isDone(series) && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />}
                        {wikiStatus}
                      </span>
                    ) : (
                      <span className="text-slate-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-amber-400 font-bold transition-colors">
                        Ver detalhes →
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    {/* Time A */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <TeamLogo teamName={teamAName} teamId={series.team1_id || series.preferredIdA} logoUrl={series.team1_logo || series.logoA} className="w-5 h-5 shadow-sm" />
                      <span className={`text-xs font-bold leading-tight break-words line-clamp-2 ${isWinnerA ? 'text-blue-700 dark:text-amber-400 font-black' : 'text-slate-700 dark:text-gray-300'}`}>
                        {teamAName}
                      </span>
                    </div>

                    {/* Placar */}
                    <div className="flex items-center gap-1 font-mono font-black text-xs px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-black/40 border border-slate-300 dark:border-white/10 shadow-inner">
                      <span className={isWinnerA ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-gray-400'}>{scoreA}</span>
                      <span className="text-slate-400 dark:text-gray-500">-</span>
                      <span className={isWinnerB ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-gray-400'}>{scoreB}</span>
                    </div>

                    {/* Time B */}
                    <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                      <span className={`text-xs font-bold leading-tight break-words line-clamp-2 text-right ${isWinnerB ? 'text-blue-700 dark:text-amber-400 font-black' : 'text-slate-700 dark:text-gray-300'}`}>
                        {teamBName}
                      </span>
                      <TeamLogo teamName={teamBName} teamId={series.team2_id || series.preferredIdB} logoUrl={series.team2_logo || series.logoB} className="w-5 h-5 shadow-sm" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-white/10 text-[11px] text-slate-500 dark:text-gray-400 text-center">
        Clique em qualquer série para conferir o draft completo e a tabela de jogadores.
      </div>

      {preview && <MatchPreviewModal match={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}
