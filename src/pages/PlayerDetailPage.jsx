import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Shield,
  Trophy,
  Swords,
  Medal,
  Sparkles,
  ExternalLink,
  Flame,
  Clock,
  ChevronRight,
  TrendingUp,
  User,
  CheckCircle2,
  Lock,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { fetchPlayerComprehensiveData } from '../services/playerProfile';
import { useApp } from '../context/AppContext';
import { getHeroImg, getHeroName } from '../services/api';
import TeamLogo from '../utils/teamLogos';

const MEDALS = ['', 'Arauto', 'Guardião', 'Cruzado', 'Arconte', 'Lenda', 'Ancestral', 'Divino', 'Imortal'];

function medalLabel(rankTier, leaderboardRank) {
  if (!rankTier && !leaderboardRank) return 'Sem Classificação';
  if (leaderboardRank) return `Imortal #${leaderboardRank}`;
  const tierIdx = Math.floor((rankTier || 0) / 10);
  const medal = MEDALS[tierIdx] || 'Imortal';
  const stars = (rankTier || 0) % 10;
  return stars && medal !== 'Imortal' ? `${medal} ${stars}` : medal;
}

const fmtDate = (secs) => (secs
  ? new Date(secs * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  : '—');

const fmtDuration = (secs) => `${Math.floor((secs || 0) / 60)}:${String((secs || 0) % 60).padStart(2, '0')}`;

const ROLE_LABELS = {
  1: 'Carry (Pos 1)',
  2: 'Midlane (Pos 2)',
  3: 'Offlane (Pos 3)',
  4: 'Suporte 4',
  5: 'Suporte 5'
};

export default function PlayerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { constants } = useApp();

  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('heroes'); // 'heroes' | 'matches' | 'badges'

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchPlayerComprehensiveData(id)
      .then((data) => {
        if (!cancelled) {
          setPlayer(data);
          setLoading(false);
          if (data?.name) {
            document.title = `${data.name} · Jogador · DotaHub Brasil`;
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error(err);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [id]);

  const backButton = (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/times'))}
      className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-amber-400 transition-colors mb-5"
    >
      <ArrowLeft className="w-4 h-4" />
      <span>Voltar</span>
    </button>
  );

  if (loading) {
    return (
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
        {backButton}
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          <span className="text-xs font-semibold">Carregando perfil e histórico do jogador...</span>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
        {backButton}
        <div className="glass-panel border border-line rounded-3xl p-12 text-center max-w-xl mx-auto shadow-2xl">
          <AlertTriangle className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <h1 className="text-xl font-black text-white uppercase mb-2">Jogador não encontrado</h1>
          <p className="text-xs text-gray-400 mb-6">
            Não conseguimos localizar o histórico deste jogador na base oficial da OpenDota. Verifique o ID ou tente novamente mais tarde.
          </p>
          <Link
            to="/times"
            className="inline-flex px-5 py-2.5 rounded-xl bg-amber-500 text-on-accent text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/20"
          >
            Ver Ranking de Times
          </Link>
        </div>
      </div>
    );
  }

  const { stats, topHeroes, recentMatches, badges } = player;
  const medal = medalLabel(player.rankTier, player.leaderboardRank);

  return (
    <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen space-y-8">
      <div>{backButton}</div>

      {/* CABEÇALHO DO JOGADOR */}
      <section className="glass-panel rounded-3xl p-6 sm:p-8 border border-line shadow-2xl relative overflow-hidden -mt-5">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Avatar e Identidade */}
          <div className="flex items-center gap-5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-surface-2 border border-line overflow-hidden flex items-center justify-center shadow-xl">
                {player.avatar ? (
                  <img
                    src={player.avatar}
                    alt={player.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User className="w-10 h-10 text-gray-500" />
                )}
              </div>
              {player.leaderboardRank && (
                <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-lg bg-amber-500 text-on-accent text-[10px] font-mono font-black shadow-md">
                  #{player.leaderboardRank}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight truncate">
                  {player.name}
                </h1>
                {player.team && (
                  <Link
                    to={`/times/${player.team.teamId}`}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:border-amber-400 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                    title={`Ver página do time ${player.team.name}`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>{player.team.tag || player.team.name}</span>
                  </Link>
                )}
                {player.countryCode && (
                  <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-surface-2 border border-line text-gray-400 font-bold">
                    {player.countryCode}
                  </span>
                )}
              </div>

              {player.realName && player.realName !== player.name && (
                <div className="text-xs text-gray-400 mt-1 font-medium">
                  Nome oficial: <strong className="text-gray-300">{player.realName}</strong>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                <span className="text-gray-400 flex items-center gap-1.5 font-bold">
                  <Medal className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-white">{medal}</span>
                </span>
                {player.fantasyRole && (
                  <>
                    <span className="text-gray-500">•</span>
                    <span className="text-amber-400 font-bold">{ROLE_LABELS[player.fantasyRole]}</span>
                  </>
                )}
                {player.profileUrl && (
                  <>
                    <span className="text-gray-500">•</span>
                    <a
                      href={player.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
                    >
                      <span>Steam</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </>
                )}
                <span className="text-gray-500">•</span>
                <a
                  href={`https://www.opendota.com/players/${player.accountId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-gray-400 hover:text-amber-400 transition-colors"
                >
                  <span>OpenDota</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Cards de Métricas Principais */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            <div className="glass-panel rounded-2xl px-4 py-3 text-center min-w-[105px] border border-line">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">Partidas</span>
              <span className="text-xl font-black font-mono text-white mt-0.5 block">
                {stats.totalMatches.toLocaleString('pt-BR')}
              </span>
            </div>

            <div className="glass-panel rounded-2xl px-4 py-3 text-center min-w-[105px] border border-line">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">Aproveitamento</span>
              <span className={`text-xl font-black font-mono mt-0.5 block ${stats.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {stats.winRate}%
              </span>
            </div>

            <div className="glass-panel rounded-2xl px-4 py-3 text-center min-w-[105px] border border-line">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">KDA Médio</span>
              <span className="text-xl font-black font-mono text-amber-400 mt-0.5 block">
                {stats.kda.toFixed(2)}
              </span>
            </div>

            <div className="glass-panel rounded-2xl px-4 py-3 text-center min-w-[105px] border border-line">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">GPM / XPM</span>
              <span className="text-base font-black font-mono text-white mt-1 block">
                <span className="text-amber-400">{stats.avgGpm}</span>
                <span className="text-gray-500 mx-1">/</span>
                <span className="text-cyan-400">{stats.avgXpm}</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* NAVEGAÇÃO POR ABAS */}
      <div className="flex items-center gap-2 border-b border-line pb-3 overflow-x-auto">
        {[
          { id: 'heroes', label: 'Heróis de Assinatura', icon: Swords },
          { id: 'matches', label: 'Partidas Recentes', icon: Clock },
          { id: 'badges', label: 'Conquistas & Badges', icon: Trophy }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-on-accent font-black shadow-lg shadow-amber-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-surface-2 border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ABA 1: HERÓIS DE ASSINATURA */}
      {activeTab === 'heroes' && (
        <section className="glass-panel border border-line rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-line flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Swords className="w-5 h-5 text-amber-400" />
                <span>Heróis Mais Jogados na Carreira</span>
              </h2>
              <span className="text-xs text-gray-400 mt-1 block">
                Clique em qualquer herói para abrir a página completa de habilidades e atributos
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-gray-400 bg-surface-2 px-3 py-1 rounded-lg border border-line">
              {topHeroes.length} heróis principais
            </span>
          </div>

          {topHeroes.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-400">
              Nenhum dado de heróis disponível para este jogador.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-surface-2/80 text-gray-400 font-mono text-[10px] uppercase border-b border-line">
                  <tr>
                    <th className="p-4 pl-6">Herói</th>
                    <th className="p-4 text-center">Partidas Jogadas</th>
                    <th className="p-4 text-center">Vitórias</th>
                    <th className="p-4 text-center">Taxa de Vitória</th>
                    <th className="p-4 text-center">Último Jogo</th>
                    <th className="p-4 pr-6 text-right">Enciclopédia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line font-medium text-gray-300">
                  {topHeroes.map((h) => {
                    const hName = getHeroName(constants, h.heroId);
                    const hImg = getHeroImg(constants, h.heroId);
                    return (
                      <tr
                        key={h.heroId}
                        onClick={() => navigate(`/herois/${h.heroId}`)}
                        className="hover:bg-surface-2/60 transition-colors cursor-pointer group"
                        title={`Ver detalhes do herói ${hName}`}
                      >
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <img
                              src={hImg}
                              alt={hName}
                              className="w-12 h-7 rounded-lg object-cover border border-line shrink-0 group-hover:border-amber-400 transition-colors shadow-sm"
                            />
                            <span className="font-bold text-white group-hover:text-amber-400 transition-colors">
                              {hName}
                            </span>
                          </div>
                        </td>

                        <td className="p-4 text-center font-mono font-bold text-white">
                          {h.games.toLocaleString('pt-BR')}
                        </td>

                        <td className="p-4 text-center font-mono text-emerald-400 font-bold">
                          {h.wins.toLocaleString('pt-BR')}
                        </td>

                        <td className="p-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className={`font-mono font-black text-xs ${h.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {h.winRate}%
                            </span>
                            <div className="w-20 h-1.5 bg-surface-2 rounded-full overflow-hidden mt-1 border border-line">
                              <div
                                className={`h-full rounded-full ${h.winRate >= 50 ? 'bg-emerald-400' : 'bg-rose-400'}`}
                                style={{ width: `${h.winRate}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="p-4 text-center font-mono text-gray-400 text-xs">
                          {fmtDate(h.lastPlayed)}
                        </td>

                        <td className="p-4 pr-6 text-right">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
                            <span>Ver herói</span>
                            <ChevronRight className="w-4 h-4" />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ABA 2: PARTIDAS RECENTES */}
      {activeTab === 'matches' && (
        <section className="glass-panel border border-line rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-line flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <span>Últimas 25 Partidas Registradas</span>
              </h2>
              <span className="text-xs text-gray-400 mt-1 block">
                Histórico de partidas com heróis, placares de abates e links diretos para a análise do jogo
              </span>
            </div>
          </div>

          {recentMatches.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-400">
              Nenhuma partida recente registrada para este jogador.
            </div>
          ) : (
            <div className="divide-y divide-line">
              {recentMatches.map((m) => {
                const hName = getHeroName(constants, m.heroId);
                const hImg = getHeroImg(constants, m.heroId);
                return (
                  <div
                    key={m.matchId}
                    onClick={() => navigate(`/partidas/${m.matchId}`)}
                    className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-surface-2/60 transition-colors cursor-pointer group"
                    title={`Abrir análise detalhada da partida #${m.matchId}`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span
                        className={`w-2 h-10 rounded-full shrink-0 ${m.won ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      />
                      <img
                        src={hImg}
                        alt={hName}
                        className="w-12 h-7 rounded-lg object-cover border border-line shrink-0 group-hover:border-amber-400 transition-colors shadow-sm"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs sm:text-sm group-hover:text-amber-400 transition-colors truncate">
                            {hName}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono border ${
                              m.won
                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                            }`}
                          >
                            {m.won ? 'Vitória' : 'Derrota'}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                          Partida #{m.matchId} · {fmtDate(m.startTime)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-8 shrink-0 text-right">
                      <div className="font-mono text-xs sm:text-sm">
                        <span className="text-white font-bold">{m.kills}</span>
                        <span className="text-gray-500 mx-1">/</span>
                        <span className="text-rose-400 font-bold">{m.deaths}</span>
                        <span className="text-gray-500 mx-1">/</span>
                        <span className="text-cyan-400 font-bold">{m.assists}</span>
                      </div>

                      <div className="hidden sm:block text-xs font-mono text-gray-400">
                        {fmtDuration(m.duration)}
                      </div>

                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ABA 3: CONQUISTAS & BADGES */}
      {activeTab === 'badges' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`tilt-card rounded-3xl p-6 border transition-all flex flex-col justify-between ${
                b.unlocked
                  ? 'glass-panel border-amber-500/40 shadow-xl'
                  : 'bg-surface-2/40 border-line opacity-50'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3.5 rounded-2xl shrink-0 ${
                    b.unlocked
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-md shadow-amber-500/10'
                      : 'bg-surface-2 text-gray-500'
                  }`}
                >
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">{b.title}</h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{b.description}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-xs">
                <span
                  className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase font-mono ${
                    b.unlocked
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-1'
                      : 'bg-surface-2 border border-line text-gray-500 flex items-center gap-1'
                  }`}
                >
                  {b.unlocked ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Conquistada</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Bloqueada</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
