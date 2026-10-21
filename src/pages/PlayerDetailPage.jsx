import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { usePageMeta } from '../utils/pageMeta';
import {
  ArrowLeft,
  Shield,
  Trophy,
  Swords,
  Medal,
  Sparkles,
  ExternalLink,
  Clock,
  ChevronRight,
  User,
  Loader2,
  AlertTriangle,
  DollarSign
} from 'lucide-react';
import { fetchPlayerComprehensiveData } from '../services/playerProfile';
import { useTheme } from '../context/ThemeContext';
import { medalStyle } from '../utils/medals';
import { tournamentPath } from '../utils/tournamentFormat';

// Página do campeonato no site a partir da página dele na Liquipedia (ex.: "BLAST/SLAM/8")
function tournamentLinkFromSlug(slug) {
  if (!slug) return null;
  let page = slug;
  try { page = decodeURIComponent(slug); } catch { /* mantém como veio */ }
  page = page.replace(/_/g, ' ');
  const id = page.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return id ? tournamentPath({ id, page }) : null;
}
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

function formatTournamentDate(val) {
  if (!val) return '—';
  if (typeof val === 'string' && val.includes('-')) {
    const parts = val.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return val;
  }
  const num = Number(val);
  if (!isNaN(num) && num > 0) {
    const ms = num > 1e11 ? num : num * 1000;
    return new Date(ms).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  return String(val);
}

const fmtDuration = (secs) => `${Math.floor((secs || 0) / 60)}:${String((secs || 0) % 60).padStart(2, '0')}`;

const POSITION_LABELS = {
  1: 'Carry (Pos 1)',
  2: 'Midlane (Pos 2)',
  3: 'Offlaner (Pos 3)',
  4: 'Suporte (Pos 4)',
  5: 'Suporte (Pos 5)'
};
// Sem posição na Liquipedia: o fantasy_role da OpenDota só separa núcleo de suporte
const FANTASY_ROLE_LABELS = { 1: 'Núcleo', 2: 'Suporte' };

function roleLabel(player) {
  if (player.position) return POSITION_LABELS[player.position];
  if (player.role) return /support/i.test(player.role) ? 'Suporte' : player.role;
  return FANTASY_ROLE_LABELS[player.fantasyRole] || null;
}

export default function PlayerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { constants } = useApp();

  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  usePageMeta(player?.name, player?.name ? `Títulos, heróis mais jogados e partidas recentes de ${player.name} no Dota 2 profissional.` : null);
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('heroes'); // 'heroes' | 'matches' | 'badges'
  const [titleFilter, setTitleFilter] = useState('champions'); // 'champions' | 'podiums' | 'tier1' | 'all'

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

  const displayedAchievements = useMemo(() => {
    if (!player) return [];
    const all = player.allAchievements || [];
    if (titleFilter === 'champions') {
      return all.filter((a) => a.isChampion);
    }
    if (titleFilter === 'podiums') {
      return all.filter((a) => a.isPodium);
    }
    if (titleFilter === 'tier1') {
      return all.filter((a) => /tier\s*1/i.test(a.tier) || /major|international|blast|riyadh/i.test(a.tournament));
    }
    return all;
  }, [player, titleFilter]);

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

  const { stats, topHeroes, recentMatches, titles, allAchievements, achievementsSummary } = player;
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
                {roleLabel(player) && (
                  <>
                    <span className="text-gray-500">•</span>
                    <span className="text-amber-400 font-bold">{roleLabel(player)}</span>
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
              <span className="text-xl font-black font-mono text-cyan-400 mt-0.5 block">
                {stats.kda.toFixed(2)}
              </span>
            </div>

            <div className="glass-panel rounded-2xl px-4 py-3 text-center min-w-[105px] border border-line">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">GPM / XPM</span>
              <span className="text-base font-black font-mono text-amber-400 mt-1 block">
                {stats.avgGpm} <span className="text-gray-400 font-normal text-xs">/</span> {stats.avgXpm}
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
          { id: 'badges', label: 'Títulos & Conquistas', icon: Trophy }
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
              {tab.id === 'badges' && titles?.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 text-amber-300 font-mono font-black ml-1">
                  {titles.length}
                </span>
              )}
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
              Nenhum dado de herói disponível para este jogador.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                <thead className="bg-surface-2/80 text-gray-400 font-mono text-[10px] uppercase border-b border-line">
                  <tr>
                    <th className="p-4 pl-6">Herói</th>
                    <th className="p-4 text-center">Partidas</th>
                    <th className="p-4 text-center">Vitórias</th>
                    <th className="p-4 text-center">Aproveitamento</th>
                    <th className="p-4 text-center">Último Jogo</th>
                    <th className="p-4 pr-6 text-right">Ação</th>
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
                      >
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <img
                              src={hImg}
                              alt={hName}
                              className="w-12 h-7 rounded-lg object-cover border border-line shadow-sm group-hover:scale-105 transition-transform"
                            />
                            <div>
                              <span className="font-bold text-white text-sm group-hover:text-amber-400 transition-colors block">
                                {hName}
                              </span>
                              <span className="text-[10px] font-mono text-gray-400">
                                ID #{h.heroId}
                              </span>
                            </div>
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

      {/* ABA 3: TÍTULOS E CONQUISTAS OFICIAIS */}
      {activeTab === 'badges' && (
        <div className="space-y-8">
          {/* PAINEL DE RESUMO DE TÍTULOS E PREMIAÇÃO */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="tilt-card glass-panel rounded-3xl p-5 border border-amber-500/40 shadow-xl bg-gradient-to-br from-amber-500/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl border" style={medalStyle(1)}>
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">Títulos de Campeão</span>
                  <span className="text-2xl font-black font-mono text-amber-400 block mt-0.5">
                    {titles.length || (achievementsSummary?.totalChampionships || 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="tilt-card glass-panel rounded-3xl p-5 border border-line shadow-xl">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-surface-2 text-slate-300 border border-slate-400/30">
                  <Medal className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">Pódios (Top 3)</span>
                  <span className="text-2xl font-black font-mono text-white block mt-0.5">
                    {achievementsSummary?.totalPodiums || allAchievements.filter(a => a.isPodium).length}
                  </span>
                </div>
              </div>
            </div>

            <div className="tilt-card glass-panel rounded-3xl p-5 border border-line shadow-xl">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-surface-2 text-amber-500 border border-amber-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">Tier 1 & Majors</span>
                  <span className="text-2xl font-black font-mono text-white block mt-0.5">
                    {achievementsSummary?.tier1Titles || titles.filter(a => /tier\s*1/i.test(a.tier)).length}
                  </span>
                </div>
              </div>
            </div>

            <div className="tilt-card glass-panel rounded-3xl p-5 border border-line shadow-xl">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-surface-2 text-emerald-400 border border-emerald-500/30">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">Premiação Acumulada</span>
                  <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400 block mt-0.5">
                    {achievementsSummary?.totalPrizeUsd ? `$${achievementsSummary.totalPrizeUsd.toLocaleString('en-US')}` : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* LISTA DE TÍTULOS CONQUISTADOS NOS TIMES */}
          <section className="glass-panel border border-line rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-line flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <span>Títulos e Campeonatos Conquistados por Equipe</span>
                </h2>
                <span className="text-xs text-gray-400 mt-1 block">
                  Histórico oficial de conquistas obtidas pelo jogador nos times em que atuou (Dados Liquipedia)
                </span>
              </div>

              {/* Filtros de Conquistas */}
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { id: 'champions', label: '🏆 Campeão (1º Lugar)' },
                  { id: 'podiums', label: '🏅 Pódios (Top 3)' },
                  { id: 'tier1', label: '⭐ Tier 1 & Majors' },
                  { id: 'all', label: '📜 Todos os Torneios' }
                ].map((btn) => (
                  <button
                    key={btn.id}
                    onClick={() => setTitleFilter(btn.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      titleFilter === btn.id
                        ? 'bg-amber-500 text-on-accent font-black shadow-md shadow-amber-500/25'
                        : 'bg-surface-2 border border-line text-gray-400 hover:text-white'
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {displayedAchievements.length === 0 ? (
              <div className="p-16 text-center">
                <Trophy className="w-12 h-12 text-gray-500 mx-auto mb-3 opacity-50" />
                <h3 className="text-base font-black text-white uppercase">Nenhum título listado neste filtro</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                  Este jogador ainda não possui conquistas oficiais registradas sob o critério selecionado na base da Liquipedia.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-line">
                {displayedAchievements.map((item, idx) => {
                  const is1st = item.isChampion;
                  // Clique leva à página do campeonato (partidas, chaveamento, estatísticas)
                  const link = tournamentLinkFromSlug(item.tourneySlug);
                  const open = () => link && navigate(link, { state: { from: { label: 'Títulos' } } });
                  return (
                    <div
                      key={idx}
                      role={link ? 'link' : undefined}
                      tabIndex={link ? 0 : undefined}
                      onClick={open}
                      onKeyDown={(e) => { if (link && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); open(); } }}
                      title={link ? `Abrir ${item.tournament}` : undefined}
                      className={`p-5 sm:px-7 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-2/50 transition-colors ${link ? 'cursor-pointer' : ''}`}
                    >
                      {/* Lado Esquerdo: Colocação, Torneio e Tier */}
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="flex flex-col items-center gap-1.5 shrink-0 w-14">
                          <div className="w-12 h-12 rounded-2xl bg-surface-2 border border-line flex items-center justify-center p-1.5 shadow-sm">
                            {item.tournamentIcon ? (
                              <img
                                src={item.tournamentIcon[theme] || item.tournamentIcon.dark || item.tournamentIcon.light}
                                alt={item.tournament}
                                referrerPolicy="no-referrer"
                                loading="lazy"
                                className="max-w-full max-h-full object-contain"
                              />
                            ) : is1st ? (
                              <Trophy className="w-5 h-5 text-gray-400" />
                            ) : (
                              <Medal className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <span
                            className={`px-1.5 py-px rounded-md border text-[10px] font-mono font-black leading-tight whitespace-nowrap ${
                              medalStyle(item.placement) ? '' : 'bg-surface-2 text-gray-400 border-line'
                            }`}
                            style={medalStyle(item.placement) || undefined}
                          >
                            {item.placement.replace(/&#160;/g, ' ')}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-black text-white text-sm sm:text-base tracking-tight truncate">
                              {item.tournament}
                            </h3>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase bg-surface-3 border border-line text-blue-500 dark:text-cyan-400">
                              {item.tier}
                            </span>
                            {is1st && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 border border-amber-500/40 text-amber-400">
                                Campeão
                              </span>
                            )}
                          </div>

                          {/* Time pelo qual Conquistou */}
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[11px] text-gray-400 font-medium">Equipe:</span>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-2 border border-line">
                              {item.teamLogo ? (
                                <img src={item.teamLogo} alt={item.teamName} referrerPolicy="no-referrer" className="w-4 h-4 object-contain" />
                              ) : (
                                <TeamLogo teamName={item.teamName} className="w-4 h-4" />
                              )}
                              <span className="text-xs font-black text-white">{item.teamName}</span>
                            </div>
                            <span className="text-gray-500 text-xs">•</span>
                            <span className="text-[11px] text-gray-400 font-mono">
                              {formatTournamentDate(item.date)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Lado Direito: Placar da Final e Premiação */}
                      <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 pl-16 md:pl-0 pt-2 md:pt-0 border-t md:border-t-0 border-line/60">
                        {item.opponent && (
                          <div className="text-left md:text-right">
                            <span className="text-[10px] uppercase font-bold text-gray-500 block">Final / Adversário</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              {item.score && (
                                <span className="font-mono font-black text-white text-xs px-2 py-0.5 rounded bg-surface-2 border border-line">
                                  {item.score}
                                </span>
                              )}
                              <span className="text-xs font-bold text-gray-300">vs {item.opponent}</span>
                            </div>
                          </div>
                        )}

                        {item.prize && (
                          <div className="text-right min-w-[90px]">
                            <span className="text-[10px] uppercase font-bold text-emerald-500 block">Prêmio</span>
                            <span className="font-mono font-black text-emerald-400 text-sm block mt-0.5">
                              {item.prize}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
