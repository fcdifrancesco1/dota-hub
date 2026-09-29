import React from 'react';
import { Star, ChevronRight, Trophy, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { SITE_CONFIG } from '../../config/siteConfig';
import { getTeamLogo } from '../../utils/teamLogos';
import { isSeriesMatch } from '../../services/api';

export default function FavoritesHighlight() {
  const { finishedSeries, upcomingMatches, setSelectedTeam } = useApp();

  const favTeams = SITE_CONFIG.favoriteTeams;

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span>Times Favoritos em Destaque</span>
        </h2>
        <Link
          to="/times"
          className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 uppercase tracking-wider"
        >
          <span>Todos os Times</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {favTeams.map((fav) => {
          // Busca última série concluída deste time
          const lastSeries = (finishedSeries || []).find(
            (s) =>
              (s.team1_id === fav.id || s.team2_id === fav.id) ||
              s.timeA?.toLowerCase().includes(fav.tag.toLowerCase()) ||
              s.timeB?.toLowerCase().includes(fav.tag.toLowerCase())
          );

          // Busca próximo jogo deste time
          const nextMatch = (upcomingMatches || []).find(
            (m) =>
              m.timeA?.toLowerCase().includes(fav.tag.toLowerCase()) ||
              m.timeB?.toLowerCase().includes(fav.tag.toLowerCase())
          );

          // Determina se venceu a última série
          let wonLast = false;
          let scoreText = '3 - 2';
          let opponentName = 'Adversário';

          if (lastSeries) {
            const isTeam1 = lastSeries.team1_id === fav.id || lastSeries.timeA?.toLowerCase().includes(fav.tag.toLowerCase());
            const myScore = isTeam1 ? (lastSeries.score_team1 ?? lastSeries.scoreA ?? 0) : (lastSeries.score_team2 ?? lastSeries.scoreB ?? 0);
            const oppScore = isTeam1 ? (lastSeries.score_team2 ?? lastSeries.scoreB ?? 0) : (lastSeries.score_team1 ?? lastSeries.scoreA ?? 0);
            wonLast = myScore > oppScore;
            scoreText = `${myScore} - ${oppScore}`;
            opponentName = isTeam1 ? (lastSeries.team2_name || lastSeries.timeB) : (lastSeries.team1_name || lastSeries.timeA);
          }

          return (
            <div
              key={fav.id}
              className="rounded-2xl bg-gradient-to-br from-[#121622] to-[#0D1017] border border-[#212838] p-5 shadow-xl hover:border-amber-500/40 transition-all"
            >
              {/* Cabeçalho do Card */}
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 p-2 flex items-center justify-center">
                    <img
                      src={getTeamLogo(fav.name)}
                      alt={fav.name}
                      className="w-8 h-8 object-contain"
                      onError={(e) => { e.target.src = '/placeholder-team.png'; }}
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">{fav.name}</h3>
                    <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">
                      Tier 1 • Favorito
                    </span>
                  </div>
                </div>

                <Link
                  to={`/times/${fav.id}`}
                  className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white transition-colors"
                >
                  Ver Perfil
                </Link>
              </div>

              {/* Informações: Último Resultado e Próximo Jogo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {/* Último Resultado */}
                <div className="bg-[#090C12] border border-[#1C2232] rounded-xl p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                    Último Resultado
                  </span>
                  {lastSeries ? (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {wonLast ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                        <span className={`text-xs font-black uppercase ${wonLast ? 'text-emerald-400' : 'text-red-400'}`}>
                          {wonLast ? 'Vitória' : 'Derrota'} ({scoreText})
                        </span>
                      </div>
                      <span className="text-xs text-gray-300 font-medium truncate max-w-[90px]">
                        vs {opponentName}
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">Nenhum jogo recente</div>
                  )}
                </div>

                {/* Próximo Jogo */}
                <div className="bg-[#090C12] border border-[#1C2232] rounded-xl p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-amber-400" />
                    <span>Próximo Confronto</span>
                  </span>
                  {nextMatch ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white truncate max-w-[110px]">
                        vs {nextMatch.timeA?.toLowerCase().includes(fav.tag.toLowerCase()) ? nextMatch.timeB : nextMatch.timeA}
                      </span>
                      <span className="text-[11px] font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded">
                        {nextMatch.startTime || 'Em breve'}
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">Aguardando calendário</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
