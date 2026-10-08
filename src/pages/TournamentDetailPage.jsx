import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import {
  Trophy,
  Calendar,
  MapPin,
  DollarSign,
  ArrowLeft,
  Swords,
  Users,
  Sparkles,
  Info,
  ExternalLink,
  Clock,
  Loader2,
  ChevronRight,
  ListOrdered,
  GitBranch,
  UserCheck,
  Crown
} from 'lucide-react';
import { fetchLeagueById, isSupabaseConfigured } from '../services/supabase';
import { fetchTournaments, fetchTournamentArchive, fetchTournamentByPage, fetchLeagueSeries, fetchTournamentHeroStats, fetchTournamentPlayerStats, fetchTournamentStandings, getHeroImg, getHeroName } from '../services/api';
import TournamentPlayers from '../components/TournamentPlayers';
import TournamentStandings from '../components/TournamentStandings';
import TournamentBracket from '../components/TournamentBracket';
import { useApp } from '../context/AppContext';
import { useOpenSeries } from '../utils/matchRoute';
import { useTheme } from '../context/ThemeContext';
import TeamLogo from '../utils/teamLogos';
import { formatDateRange, formatPrize, tierLabel, statusLabel, leagueFromDatabase } from '../utils/tournamentFormat';

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Campeão, vice e premiação do histórico de encerrados (a premiação da tabela
// da Liquipedia é mais confiável que a da ficha, que às vezes vem de fórmulas)
async function withArchiveInfo(t) {
  const year = Number(String(t?.endDate || '').slice(0, 4));
  if (!t || t.status !== 'finished' || !year) return t;
  const entry = (await fetchTournamentArchive(year)).find((a) => a.id === t.id);
  return entry
    ? { ...t, winner: entry.winner, runnerUp: entry.runnerUp, prizePoolUsd: entry.prizePoolUsd || t.prizePoolUsd, prizePoolLocal: entry.prizePoolUsd ? null : t.prizePoolLocal }
    : t;
}

// Procura o campeonato no histórico recente quando o link não traz a página (?p=)
async function findInRecentArchive(id) {
  const year = new Date().getFullYear();
  for (const y of [year, year - 1]) {
    const found = (await fetchTournamentArchive(y)).find((a) => a.id === id);
    if (found) return found;
  }
  return null;
}

export default function TournamentDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const pageParam = searchParams.get('p');
  const { tournamentsList, finishedSeries, upcomingMatches, constants } = useApp();
  const openSeries = useOpenSeries();
  const { theme } = useTheme();
  const [tournament, setTournament] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState('matches'); // 'matches' | 'standings' | 'bracket' | 'heroes' | 'info'
  const [standings, setStandings] = useState([]);
  const [brackets, setBrackets] = useState([]);
  const [heroStats, setHeroStats] = useState(null);
  const [heroLoading, setHeroLoading] = useState(false);
  const [playerStats, setPlayerStats] = useState(null);
  const [leagueSeries, setLeagueSeries] = useState(null);

  // 1. Campeonato: Liquipedia primeiro; ligas numéricas do Admin (Supabase) como alternativa
  useEffect(() => {
    let active = true;
    setTournament(null);
    setNotFound(false);
    // Outro campeonato: descarta as estatísticas do anterior
    setHeroStats(null);
    setPlayerStats(null);
    setLeagueSeries(null);
    fetchTournaments().then(async (list) => {
      let found = (list || []).find((t) => t.id === id) || null;
      // Fora da lista atual: busca direto na Liquipedia (campeonatos do histórico)
      if (!found) {
        const page = pageParam || (await findInRecentArchive(id))?.page;
        if (page) found = await fetchTournamentByPage(page);
      }
      if (found) found = await withArchiveInfo(found);
      if (!found && isSupabaseConfigured) {
        const db = await fetchLeagueById(id);
        if (db) found = leagueFromDatabase(db);
      }
      if (!active) return;
      if (found) setTournament(found);
      else setNotFound(true);
    });
    return () => { active = false; };
  }, [id, pageParam]);

  // Classificação da fase de grupos e chaveamentos (Liquipedia). As abas só aparecem se houver dados.
  const standingsPage = tournament?.page;
  useEffect(() => {
    setStandings([]);
    setBrackets([]);
    if (!standingsPage) return;
    let active = true;
    fetchTournamentStandings(standingsPage).then((data) => {
      if (!active) return;
      setStandings(data?.tables || []);
      setBrackets(data?.brackets || []);
    });
    return () => { active = false; };
  }, [standingsPage]);

  // Todas as séries da liga (OpenDota Explorer): as partidas recentes não cobrem campeonatos antigos
  const leagueId = tournament?.status !== 'upcoming' ? tournament?.leagueId : null;
  useEffect(() => {
    if (!leagueId) return;
    let active = true;
    fetchLeagueSeries(leagueId).then((list) => { if (active) setLeagueSeries(list || []); });
    return () => { active = false; };
  }, [leagueId]);

  // Estatísticas dos jogadores no torneio (OpenDota), carregadas ao abrir a aba
  useEffect(() => {
    if (activeTab !== 'players' || !tournament?.leagueId || playerStats) return;
    let active = true;
    fetchTournamentPlayerStats(tournament.leagueId).then((data) => {
      if (active) setPlayerStats(data || { players: [] });
    });
    return () => { active = false; };
  }, [activeTab, tournament, playerStats]);

  // 2. Estatísticas de heróis do torneio (OpenDota), carregadas ao abrir a aba
  useEffect(() => {
    if (activeTab !== 'heroes' || !tournament?.leagueId || heroStats) return;
    setHeroLoading(true);
    fetchTournamentHeroStats(tournament.leagueId).then((data) => {
      setHeroStats(data || { heroes: [], totalMatches: 0 });
      setHeroLoading(false);
    });
  }, [activeTab, tournament, heroStats]);

  if (notFound) {
    return (
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
        <Link to="/campeonatos" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-amber-400 mb-6">
          <ArrowLeft className="w-4 h-4" /> Voltar para Campeonatos
        </Link>
        <div className="bg-surface border border-line rounded-2xl p-10 text-center text-sm text-gray-400">
          Campeonato não encontrado.
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="py-32 flex flex-col items-center gap-3 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        <span className="text-xs font-semibold">Carregando campeonato...</span>
      </div>
    );
  }

  const t = tournament;
  const image = t.image?.[theme] || t.icon?.[theme];
  const dates = formatDateRange(t.startDate, t.endDate);
  const prize = formatPrize(t);

  // Séries concluídas da liga (OpenDota, pelo leagueId oficial da Valve)
  const leagueEntry = t.leagueId ? (tournamentsList || []).find((l) => String(l.league_id) === String(t.leagueId)) : null;
  const recentSeries = leagueEntry?.seriesList?.length
    ? leagueEntry.seriesList
    : (finishedSeries || []).filter((s) => t.leagueId && String(s.leagueId) === String(t.leagueId));
  // Encerrado: a lista completa da liga; em andamento: as recentes (mais atualizadas) se houver
  const series = (t.status === 'finished' || !recentSeries.length) && leagueSeries?.length ? leagueSeries : recentSeries;

  // Partidas agendadas (Liquipedia), pelo nome do campeonato ("BLAST SLAM VIII - Group B")
  const names = [norm(t.name), norm(t.shortName)].filter((n) => n.length >= 4);
  const scheduled = (upcomingMatches || []).filter((m) => {
    const tn = norm(m.tourneyName || m.torneio);
    return names.some((n) => tn.startsWith(n) || n.startsWith(tn));
  });

  const tabs = [
    { id: 'matches', label: 'Partidas', icon: Swords },
    ...(standings.length ? [{ id: 'standings', label: 'Classificação', icon: ListOrdered }] : []),
    ...(brackets.length ? [{ id: 'bracket', label: 'Chaveamento', icon: GitBranch }] : []),
    { id: 'players', label: 'Jogadores', icon: UserCheck, disabled: !t.leagueId },
    { id: 'heroes', label: 'Heróis do Torneio', icon: Sparkles, disabled: !t.leagueId },
    { id: 'info', label: 'Informações', icon: Info }
  ];

  return (
    <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      <Link
        to="/campeonatos"
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-amber-400 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar para Campeonatos</span>
      </Link>

      {/* CABEÇALHO DO CAMPEONATO */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-surface-2 via-surface to-surface-2 border border-line p-6 sm:p-8 mb-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-28 h-20 sm:w-40 sm:h-24 rounded-2xl bg-surface-2 border border-line flex items-center justify-center p-3 shrink-0">
              {image ? (
                <img src={image} alt={t.name} referrerPolicy="no-referrer" className="max-w-full max-h-full object-contain" />
              ) : (
                <Trophy className="w-10 h-10 text-amber-400" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500 text-black">
                  {tierLabel(t)}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  t.status === 'ongoing' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-white/10 text-gray-300'
                }`}>
                  {statusLabel(t)}
                </span>
                {t.organizer && <span className="text-[11px] text-gray-400">por <strong className="text-gray-300">{t.organizer}</strong></span>}
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white font-serif uppercase tracking-tight">{t.name}</h1>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-400 mt-3">
                {dates && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-500" />
                    <span className="font-semibold text-gray-300">{dates}</span>
                  </span>
                )}
                {(t.location || t.type) && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-500" />
                    <span>{[t.location, t.venue, t.type].filter(Boolean).join(' · ')}</span>
                  </span>
                )}
                {t.teamCount && (
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-gray-500" />
                    <span>{t.teamCount} times</span>
                  </span>
                )}
                {t.winner && (
                  <span className="flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>Campeão: <strong className="text-amber-400">{t.winner.name}</strong>{t.runnerUp && <span className="text-gray-500"> · vice {t.runnerUp.name}</span>}</span>
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold font-mono">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>{prize ? `Premiação: ${prize}` : 'Premiação não divulgada'}</span>
                </span>
              </div>
            </div>
          </div>

          {t.liquipediaUrl && (
            <a
              href={t.liquipediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="self-start md:self-center inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-2 border border-line hover:border-amber-500/40 text-xs font-bold text-gray-300 hover:text-amber-400 transition-all whitespace-nowrap"
            >
              Ver na Liquipedia
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* ABAS */}
      <div className="flex items-center gap-2 border-b border-line pb-3 mb-8 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
              disabled={tab.disabled}
              title={tab.disabled ? 'Este campeonato ainda não tem ID de liga da Valve' : undefined}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap disabled:opacity-40 ${
                isActive
                  ? 'bg-amber-500 text-black font-black shadow-lg shadow-amber-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ABA: CLASSIFICAÇÃO */}
      {activeTab === 'standings' && standings.length > 0 && (
        <TournamentStandings tables={standings} liquipediaUrl={t.liquipediaUrl} />
      )}

      {/* ABA: CHAVEAMENTO */}
      {activeTab === 'bracket' && brackets.length > 0 && <TournamentBracket brackets={brackets} />}

      {/* ABA: PARTIDAS */}
      {activeTab === 'matches' && (
        <div className="space-y-8">
          {scheduled.length > 0 && (
            <section>
              <h2 className="text-xs font-black uppercase tracking-wider text-white mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" /> Próximas partidas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {scheduled.map((m, idx) => (
                  <div key={`${m.timeA}-${m.timeB}-${m.timestamp || idx}`} className="bg-surface border border-line rounded-xl p-4">
                    <div className="flex items-center justify-between text-[10px] text-gray-400 mb-2">
                      <span className="truncate text-amber-400/90 font-semibold">{m.tourneyName}</span>
                      <span className="font-mono font-bold text-gray-300">{m.startTime || 'A definir'} · {m.formato}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <TeamLogo teamName={m.timeA} logoUrl={m.logoA} className="w-6 h-6" />
                        <span className="text-xs font-bold text-white leading-tight break-words line-clamp-2">{m.timeA}</span>
                      </div>
                      <span className="text-[10px] font-black text-gray-500 px-2">VS</span>
                      <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                        <span className="text-xs font-bold text-white leading-tight break-words line-clamp-2 text-right">{m.timeB}</span>
                        <TeamLogo teamName={m.timeB} logoUrl={m.logoB} className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-xs font-black uppercase tracking-wider text-white mb-3 flex items-center gap-2">
              <Swords className="w-4 h-4 text-amber-400" /> Séries concluídas
            </h2>
            {series.length === 0 ? (
              <div className="bg-surface border border-line rounded-xl p-8 text-center text-xs text-gray-400">
                {t.status === 'upcoming'
                  ? 'O campeonato ainda não começou.'
                  : t.leagueId && leagueSeries === null
                  ? 'Carregando as séries do campeonato...'
                  : 'Nenhuma série deste campeonato registrada na OpenDota.'}
              </div>
            ) : (
              <div className="space-y-2">
                {series.map((s, idx) => {
                  const aWon = s.scoreA > s.scoreB;
                  const bWon = s.scoreB > s.scoreA;
                  return (
                    <button
                      key={s.series_id || idx}
                      onClick={() => openSeries(s)}
                      className="w-full bg-surface hover:bg-surface-2 border border-line hover:border-amber-500/40 rounded-xl p-3 sm:p-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-x-2 gap-y-1.5 sm:gap-4 transition-all group text-left"
                    >
                      <span className="text-[10px] font-mono text-gray-500 w-full sm:w-20 shrink-0">{s.dateStr || ''}</span>
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className={`text-xs font-bold leading-tight break-words line-clamp-2 ${aWon ? 'text-amber-400' : 'text-gray-300'}`}>{s.timeA}</span>
                        <TeamLogo teamName={s.timeA} teamId={s.preferredIdA} className="w-6 h-6 shrink-0" />
                      </div>
                      <span className="font-mono font-black text-sm px-2 sm:px-3 py-1 rounded-lg bg-black/40 border border-white/10 text-white shrink-0 whitespace-nowrap">
                        {s.scoreA} : {s.scoreB}
                      </span>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <TeamLogo teamName={s.timeB} teamId={s.preferredIdB} className="w-6 h-6 shrink-0" />
                        <span className={`text-xs font-bold leading-tight break-words line-clamp-2 ${bWon ? 'text-amber-400' : 'text-gray-300'}`}>{s.timeB}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-amber-400 shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ABA: JOGADORES */}
      {activeTab === 'players' && (
        !playerStats ? (
          <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
            <Loader2 className="w-7 h-7 animate-spin text-amber-400" />
            <span className="text-xs">Calculando estatísticas dos jogadores...</span>
          </div>
        ) : playerStats.players.length === 0 ? (
          <div className="bg-surface border border-line rounded-xl p-8 text-center text-xs text-gray-400">
            Ainda não há partidas deste campeonato registradas na OpenDota.
          </div>
        ) : (
          <TournamentPlayers data={playerStats} constants={constants} />
        )
      )}

      {/* ABA: HERÓIS DO TORNEIO */}
      {activeTab === 'heroes' && (
        heroLoading || !heroStats ? (
          <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
            <Loader2 className="w-7 h-7 animate-spin text-amber-400" />
            <span className="text-xs">Calculando picks e bans do torneio...</span>
          </div>
        ) : heroStats.heroes.length === 0 ? (
          <div className="bg-surface border border-line rounded-xl p-8 text-center text-xs text-gray-400">
            Ainda não há partidas com draft registradas na OpenDota para este campeonato.
          </div>
        ) : (
          <TournamentHeroes heroStats={heroStats} constants={constants} />
        )
      )}

      {/* ABA: INFORMAÇÕES */}
      {activeTab === 'info' && (
        <div className="bg-surface border border-line rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4 text-sm">
          {[
            ['Nome oficial', t.name],
            ['Organizador', t.organizer],
            ['Datas', dates],
            ['Nível', tierLabel(t)],
            ['Local', [t.location, t.venue].filter(Boolean).join(' · ')],
            ['Modalidade', t.type],
            ['Times', t.teamCount],
            ['Premiação', prize],
            ['Formato', t.format],
            ['ID da liga (Valve)', t.leagueId]
          ].filter(([, v]) => v).map(([label, value]) => (
            <div key={label} className="border-b border-white/5 pb-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">{label}</div>
              <div className="text-gray-200 font-semibold">{value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const HERO_SORTS = [
  { id: 'contested', label: 'Mais disputados', fn: (a, b) => b.contested - a.contested || b.picks - a.picks },
  { id: 'picks', label: 'Mais escolhidos', fn: (a, b) => b.picks - a.picks || b.winRate - a.winRate },
  { id: 'bans', label: 'Mais banidos', fn: (a, b) => b.bans - a.bans || b.picks - a.picks },
  { id: 'winrate', label: 'Maior vitória', fn: (a, b) => b.winRate - a.winRate || b.picks - a.picks }
];

function HeroCard({ h, constants }) {
  return (
    <div className="bg-surface border border-line rounded-xl p-3 text-center">
      <img src={getHeroImg(constants, h.hero_id)} alt="" className="w-full h-14 object-cover rounded-lg mb-2" />
      <div className="text-xs font-black text-white leading-tight break-words line-clamp-2">{getHeroName(constants, h.hero_id)}</div>
      <div className="mt-1.5 grid grid-cols-3 gap-1 text-[10px] font-mono">
        <div><div className="text-gray-500">Picks</div><div className="text-white font-bold">{h.picks}</div></div>
        <div><div className="text-gray-500">Bans</div><div className="text-rose-400 font-bold">{h.bans}</div></div>
        <div><div className="text-gray-500">Vit.</div><div className="text-emerald-400 font-bold">{h.picks ? `${Math.round(h.winRate)}%` : '—'}</div></div>
      </div>
    </div>
  );
}

/** Todos os heróis escolhidos no torneio, e à parte os que só foram banidos. */
function TournamentHeroes({ heroStats, constants }) {
  const [sortId, setSortId] = useState('contested');
  const sort = HERO_SORTS.find((s) => s.id === sortId) || HERO_SORTS[0];
  const picked = heroStats.heroes.filter((h) => h.picks > 0).sort(sort.fn);
  const bannedOnly = heroStats.heroes.filter((h) => h.picks === 0 && h.bans > 0).sort((a, b) => b.bans - a.bans);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-gray-400">
          <strong className="text-white">{picked.length}</strong> heróis escolhidos em{' '}
          <strong className="text-white">{heroStats.totalMatches}</strong> partidas com draft registrado na OpenDota.
        </p>
        <div className="flex flex-wrap bg-surface-2 p-1 rounded-xl border border-line">
          {HERO_SORTS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSortId(s.id)}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                sortId === s.id ? 'bg-amber-500 text-on-accent font-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {picked.map((h) => <HeroCard key={h.hero_id} h={h} constants={constants} />)}
      </div>

      {bannedOnly.length > 0 && (
        <section>
          <h3 className="text-xs font-black uppercase tracking-wider text-white mb-3">
            Só banidos ({bannedOnly.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {bannedOnly.map((h) => <HeroCard key={h.hero_id} h={h} constants={constants} />)}
          </div>
        </section>
      )}
    </div>
  );
}
