import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { usePageMeta } from '../utils/pageMeta';
import {
  Trophy,
  Calendar,
  MapPin,
  DollarSign,
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
  Shield,
  Crown
} from 'lucide-react';
import { fetchLeagueById, isSupabaseConfigured } from '../services/supabase';
import { fetchTournaments, fetchTournamentArchive, fetchTournamentByPage, fetchLeagueSeries, fetchTournamentHeroStats, fetchTournamentPlayerStats, fetchTournamentStandings, getHeroImg, getHeroName, isSameTeamMatch } from '../services/api';
import TournamentPlayers from '../components/TournamentPlayers';
import TournamentStandings from '../components/TournamentStandings';
import TournamentBracket from '../components/TournamentBracket';
import TournamentTeams from '../components/TournamentTeams';
import { useApp } from '../context/AppContext';
import { useOpenSeries } from '../utils/matchRoute';
import BackButton from '../components/BackButton';
import { rememberAliases } from '../utils/teamAliases';
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

/**
 * Campeonato que divide o ID de liga da Valve com outros (ex.: todas as
 * classificatórias regionais da DreamLeague usam a mesma liga): as séries e
 * estatísticas da liga precisam ser filtradas pelos participantes.
 */
function sharesLeague(t, list) {
  if (!t?.leagueId) return false;
  if (/qualifier/i.test(t.tierType || '')) return true;
  return (list || []).some((o) => o.id !== t.id && String(o.leagueId) === String(t.leagueId));
}

// Times do campeonato: cards de participantes + quem aparece na classificação e no chaveamento
function allParticipants(data) {
  const names = new Set(data?.participants || []);
  for (const table of data?.tables || []) for (const r of table.rows || []) if (r.team) names.add(r.team);
  const walk = (node) => {
    if (!node) return;
    for (const o of node.match?.opponents || []) if (o?.name && o.name !== 'TBD') names.add(o.name);
    (node.children || []).forEach(walk);
  };
  for (const b of data?.brackets || []) (b.roots || []).forEach(walk);
  return [...names];
}

/** Partidas do chaveamento da Liquipedia com os IDs dos mapas (links de replay). */
function bracketMatches(brackets) {
  const out = [];
  const walk = (node) => {
    if (!node) return;
    const m = node.match;
    if (m?.matchIds?.length && m.opponents?.length === 2 && m.opponents.every((o) => o?.name)) {
      out.push({ ids: new Set(m.matchIds.map(String)), idList: m.matchIds.map(String), a: m.opponents[0], b: m.opponents[1], timestamp: m.timestamp || null });
    }
    (node.children || []).forEach(walk);
  };
  for (const b of brackets || []) (b.roots || []).forEach(walk);
  return out;
}

/**
 * Troca os nomes da OpenDota pelos da Liquipedia quando a série está no
 * chaveamento (ex.: o time "Skyreavers" está registrado na Valve como "The Bot^$").
 * O lado de cada time sai do nome ou, se nenhum bater, do placar.
 * Retorna as séries renomeadas, os IDs de mapa do chaveamento e o mapa
 * "ID do time na OpenDota → nome na Liquipedia".
 */
function withLiquipediaNames(list, brackets) {
  const matches = bracketMatches(brackets);
  const idToName = {};
  const inBracket = new Set();
  const aligned = list.map((s) => {
    const ids = (s.games || []).map((g) => String(g.match_id));
    const bm = matches.find((m) => ids.some((id) => m.ids.has(id)));
    if (!bm) return s;
    ids.forEach((id) => inBracket.add(id));
    const scoreA = Number(bm.a.score);
    const scoreB = Number(bm.b.score);
    let straight = null;
    if (isSameTeamMatch(s.timeA, bm.a.name) || isSameTeamMatch(s.timeB, bm.b.name)) straight = true;
    else if (isSameTeamMatch(s.timeA, bm.b.name) || isSameTeamMatch(s.timeB, bm.a.name)) straight = false;
    else if (scoreA !== scoreB && Number.isFinite(scoreA) && Number.isFinite(scoreB)) {
      if (scoreA === s.scoreA && scoreB === s.scoreB) straight = true;
      else if (scoreA === s.scoreB && scoreB === s.scoreA) straight = false;
    }
    if (straight === null) return s;
    const [nameA, nameB] = straight ? [bm.a.name, bm.b.name] : [bm.b.name, bm.a.name];
    if (s.preferredIdA) idToName[s.preferredIdA] = nameA;
    if (s.preferredIdB) idToName[s.preferredIdB] = nameB;
    return { ...s, timeA: nameA, timeB: nameB };
  });
  // Séries fora do chaveamento (ex.: fase de grupos) com um time já identificado
  const renamed = aligned.map((s) => {
    const nameA = idToName[s.preferredIdA];
    const nameB = idToName[s.preferredIdB];
    const next = nameA || nameB ? { ...s, timeA: nameA || s.timeA, timeB: nameB || s.timeB } : s;
    return Object.keys(idToName).length ? { ...next, teamNames: idToName } : next;
  });
  rememberAliases(idToName);
  return { list: renamed, inBracket };
}

// Nome das abas no endereço
const TAB_TO_URL = {
  matches: 'partidas', teams: 'equipes', standings: 'classificacao', bracket: 'chaveamento',
  players: 'jogadores', heroes: 'herois', info: 'informacoes'
};
const TAB_FROM_URL = Object.fromEntries(Object.entries(TAB_TO_URL).map(([k, v]) => [v, k]));

/**
 * Séries do chaveamento da Liquipedia que a lista da OpenDota ainda não tem
 * (o banco de consultas da OpenDota demora a incluir algumas ligas, como as
 * classificatórias). Times, placar e data vêm da Liquipedia; os mapas, pelo
 * número, abrem na página da partida direto da OpenDota.
 */
function seriesFromBracket(brackets, known, stage) {
  const knownIds = new Set(known.flatMap((s) => (s.games || []).map((g) => String(g.match_id))));
  return bracketMatches(brackets)
    .filter((m) => !m.idList.some((id) => knownIds.has(id)))
    .map((m) => {
      const scoreA = Number(m.a.score) || 0;
      const scoreB = Number(m.b.score) || 0;
      const played = m.idList.slice(0, scoreA + scoreB);
      const wins = Math.max(scoreA, scoreB);
      return {
        series_id: null,
        fromBracket: true,
        stage,
        formato: wins >= 3 ? 'BO5' : wins === 1 && scoreA + scoreB === 1 ? 'BO1' : 'BO3',
        timeA: m.a.name,
        timeB: m.b.name,
        logoA: m.a.logo?.dark || null,
        logoB: m.b.logo?.dark || null,
        scoreA,
        scoreB,
        startTime: m.timestamp,
        lastMatchTime: m.timestamp,
        dateStr: m.timestamp ? new Date(m.timestamp * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '',
        games: played.map((id, idx) => ({ mapNumber: idx + 1, match_id: id }))
      };
    })
    .filter((s) => s.games.length > 0);
}

const DAY = 86400;
const isoToSecs = (iso) => (iso ? Date.parse(`${iso}T00:00:00Z`) / 1000 : null);

/** Só as séries entre participantes do campeonato e dentro das datas dele. */
function filterOwnSeries(list, t, participants, inBracket = new Set()) {
  const from = isoToSecs(t.startDate);
  const to = isoToSecs(t.endDate);
  const isParticipant = (name) => participants.some((p) => isSameTeamMatch(name, p));
  return list.filter((s) => {
    // Série cujo mapa aparece no chaveamento da Liquipedia é deste campeonato
    if ((s.games || []).some((g) => inBracket.has(String(g.match_id)))) return true;
    const when = s.startTime || 0;
    if (from && when < from - DAY) return false;
    if (to && when > to + 2 * DAY) return false;
    return participants.length < 2 || (isParticipant(s.timeA) && isParticipant(s.timeB));
  });
}

export default function TournamentDetailPage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = searchParams.get('p');
  const { tournamentsList, finishedSeries, upcomingMatches, constants } = useApp();
  const openSeries = useOpenSeries();
  const { theme } = useTheme();
  const [tournament, setTournament] = useState(null);
  const [notFound, setNotFound] = useState(false);
  usePageMeta(tournament?.name, tournament?.name ? `Partidas, chaveamento, equipes, jogadores e heróis do ${tournament.name}.` : null);
  // Aba aberta fica no endereço (?aba=chaveamento), para o "Voltar" de uma partida reabrir a mesma aba
  const activeTab = TAB_FROM_URL[searchParams.get('aba')] || 'matches';
  const setActiveTab = (tab) => {
    const next = new URLSearchParams(searchParams);
    if (tab === 'matches') next.delete('aba');
    else next.set('aba', TAB_TO_URL[tab] || tab);
    setSearchParams(next, { replace: true });
  };
  const [standings, setStandings] = useState([]);
  const [brackets, setBrackets] = useState([]);
  const [heroStats, setHeroStats] = useState(null);
  const [heroLoading, setHeroLoading] = useState(false);
  const [playerStats, setPlayerStats] = useState(null);
  const [leagueSeries, setLeagueSeries] = useState(null);
  const [shared, setShared] = useState(false);
  const [participants, setParticipants] = useState(null);
  const [teams, setTeams] = useState([]);

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
      if (found) {
        setShared(sharesLeague(found, list));
        setTournament(found);
      }
      else setNotFound(true);
    });
    return () => { active = false; };
  }, [id, pageParam]);

  // Classificação da fase de grupos e chaveamentos (Liquipedia). As abas só aparecem se houver dados.
  const standingsPage = tournament?.page;
  useEffect(() => {
    setStandings([]);
    setBrackets([]);
    setParticipants(null);
    setTeams([]);
    if (!standingsPage) return;
    let active = true;
    fetchTournamentStandings(standingsPage).then((data) => {
      if (!active) return;
      setStandings(data?.tables || []);
      setBrackets(data?.brackets || []);
      setParticipants(allParticipants(data));
      setTeams(data?.teams || []);
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

  // Séries concluídas da liga (OpenDota, pelo leagueId oficial da Valve)
  const series = useMemo(() => {
    const t = tournament;
    if (!t?.leagueId) return [];
    const leagueEntry = (tournamentsList || []).find((l) => String(l.league_id) === String(t.leagueId));
    const recentSeries = leagueEntry?.seriesList?.length
      ? leagueEntry.seriesList
      : (finishedSeries || []).filter((s) => String(s.leagueId) === String(t.leagueId));
    // Lista completa da liga + as recentes que ela ainda não tem (a OpenDota
    // demora a indexar os mapas mais novos), sem repetir séries
    const known = new Set((leagueSeries || []).flatMap((x) => (x.games || []).map((g) => String(g.match_id))));
    const extra = recentSeries.filter((x) => !(x.games || []).some((g) => known.has(String(g.match_id))));
    const raw = [...(leagueSeries || []), ...extra].sort((x, y) => (y.startTime || 0) - (x.startTime || 0));
    const { list: named, inBracket } = withLiquipediaNames(raw, brackets);
    // A lista da liga vem sem nome de campeonato: usa o desta página
    const all = named.map((x) => (x.stage && x.stage !== 'Torneio Profissional' ? x : { ...x, stage: t.name }));
    const own = !shared ? all : participants === null ? [] : filterOwnSeries(all, t, participants, inBracket);
    // Completa com as séries do chaveamento que a OpenDota ainda não listou
    return [...own, ...seriesFromBracket(brackets, own, t.name)]
      .sort((x, y) => (y.startTime || 0) - (x.startTime || 0));
  }, [tournament, tournamentsList, finishedSeries, leagueSeries, shared, participants, brackets]);

  // Liga dividida: as estatísticas contam só os mapas deste campeonato, depois
  // de saber os participantes e as séries
  const statsReady = !shared || (participants !== null && leagueSeries !== null);
  const ownMatchIds = useMemo(
    () => (shared ? series.flatMap((s) => (s.games || []).map((g) => g.match_id)) : null),
    [shared, series]
  );
  const matchKey = ownMatchIds ? ownMatchIds.join(',') : 'all';
  useEffect(() => {
    setHeroStats(null);
    setPlayerStats(null);
  }, [matchKey]);

  // Estatísticas dos jogadores no torneio (OpenDota), carregadas ao abrir a aba
  useEffect(() => {
    if (activeTab !== 'players' || !tournament?.leagueId || playerStats || !statsReady) return;
    if (ownMatchIds && !ownMatchIds.length) { setPlayerStats({ players: [] }); return; }
    let active = true;
    fetchTournamentPlayerStats(tournament.leagueId, ownMatchIds).then((data) => {
      if (active) setPlayerStats(data || { players: [] });
    });
    return () => { active = false; };
  }, [activeTab, tournament, playerStats, statsReady, ownMatchIds]);

  // 2. Estatísticas de heróis do torneio (OpenDota), carregadas ao abrir a aba
  useEffect(() => {
    if (activeTab !== 'heroes' || !tournament?.leagueId || heroStats || !statsReady) return;
    if (ownMatchIds && !ownMatchIds.length) { setHeroStats({ heroes: [], totalMatches: 0 }); return; }
    let active = true;
    setHeroLoading(true);
    fetchTournamentHeroStats(tournament.leagueId, ownMatchIds).then((data) => {
      if (!active) return;
      setHeroStats(data || { heroes: [], totalMatches: 0 });
      setHeroLoading(false);
    });
    return () => { active = false; };
  }, [activeTab, tournament, heroStats, statsReady, ownMatchIds]);

  if (notFound) {
    return (
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
        <BackButton fallbackPath="/campeonatos" fallbackLabel="Campeonatos" className="mb-6" />
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


  // Partidas agendadas (Liquipedia), pelo nome do campeonato ("BLAST SLAM VIII - Group B")
  const names = [norm(t.name), norm(t.shortName)].filter((n) => n.length >= 4);
  const scheduled = (upcomingMatches || []).filter((m) => {
    const tn = norm(m.tourneyName || m.torneio);
    return names.some((n) => tn.startsWith(n) || n.startsWith(tn));
  });

  const tabs = [
    { id: 'matches', label: 'Partidas', icon: Swords },
    ...(teams.length ? [{ id: 'teams', label: 'Equipes', icon: Shield }] : []),
    ...(standings.length ? [{ id: 'standings', label: 'Classificação', icon: ListOrdered }] : []),
    ...(brackets.length ? [{ id: 'bracket', label: 'Chaveamento', icon: GitBranch }] : []),
    { id: 'players', label: 'Jogadores', icon: UserCheck, disabled: !t.leagueId },
    { id: 'heroes', label: 'Heróis do Torneio', icon: Sparkles, disabled: !t.leagueId },
    { id: 'info', label: 'Informações', icon: Info }
  ];

  return (
    <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      <BackButton fallbackPath="/campeonatos" fallbackLabel="Campeonatos" className="mb-6" />

      {/* CABEÇALHO DO CAMPEONATO */}
      <div className="tilt-card glass-panel relative overflow-hidden rounded-3xl border border-line p-6 sm:p-8 mb-8 shadow-2xl">
        <div className="holo-sheen" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-28 h-20 sm:w-40 sm:h-24 rounded-2xl bg-surface-2 border border-line flex items-center justify-center p-3 shrink-0 shadow-inner">
              {image ? (
                <img src={image} alt={t.name} referrerPolicy="no-referrer" className="max-w-full max-h-full object-contain drop-shadow" />
              ) : (
                <Trophy className="w-10 h-10 text-blue-600 dark:text-amber-400" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-600 text-on-accent dark:bg-amber-500 dark:text-black shadow-sm">
                  {tierLabel(t)}
                </span>
                <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                  t.status === 'ongoing' ? 'bg-red-600 text-on-accent shadow-sm' : 'bg-surface-2 text-gray-400 border border-line'
                }`}>
                  {statusLabel(t)}
                </span>
                {t.organizer && <span className="text-[11px] text-gray-400">por <strong className="text-white">{t.organizer}</strong></span>}
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white font-serif uppercase tracking-tight">{t.name}</h1>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-400 mt-3">
                {dates && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-semibold text-white">{dates}</span>
                  </span>
                )}
                {(t.location || t.type) && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span>{[t.location, t.venue, t.type].filter(Boolean).join(' · ')}</span>
                  </span>
                )}
                {t.teamCount && (
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    <span>{t.teamCount} times</span>
                  </span>
                )}
                {t.winner && (
                  <span className="flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-blue-600 dark:text-amber-400" />
                    <span>Campeão: <strong className="text-blue-600 dark:text-amber-400">{t.winner.name}</strong>{t.runnerUp && <span className="text-gray-400"> · vice {t.runnerUp.name}</span>}</span>
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-emerald-500 font-bold font-mono">
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
              className="self-start md:self-center inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-surface-2 border border-line hover:border-blue-500/50 dark:hover:border-amber-500/50 text-xs font-bold text-gray-400 hover:text-white transition-all whitespace-nowrap shadow-sm"
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
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap disabled:opacity-40 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-on-accent dark:bg-amber-500 dark:text-black font-black shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-surface-2'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ABA: EQUIPES */}
      {activeTab === 'teams' && teams.length > 0 && <TournamentTeams teams={teams} />}

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {scheduled.map((m, idx) => (
                  <div key={`${m.timeA}-${m.timeB}-${m.timestamp || idx}`} className="tilt-card glass-panel border border-line rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between text-[10px] text-gray-400 mb-2">
                      <span className="truncate text-blue-600 dark:text-amber-400 font-semibold">{m.tourneyName}</span>
                      <span className="font-mono font-bold text-white">{m.startTime || 'A definir'} · {m.formato}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <TeamLogo teamName={m.timeA} logoUrl={m.logoA} className="w-6 h-6" />
                        <span className="text-xs font-bold text-white leading-tight break-words line-clamp-2">{m.timeA}</span>
                      </div>
                      <span className="text-[10px] font-black text-gray-400 px-2">VS</span>
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
              <Swords className="w-4 h-4 text-blue-600 dark:text-amber-400" /> Séries concluídas
            </h2>
            {series.length === 0 ? (
              <div className="glass-panel border border-line rounded-2xl p-8 text-center text-xs text-gray-400">
                {t.status === 'upcoming'
                  ? 'O campeonato ainda não começou.'
                  : t.leagueId && (leagueSeries === null || (shared && participants === null))
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
                      onClick={() => openSeries(s, t.name)}
                      className="w-full tilt-card glass-panel hover:bg-surface-2 border border-line hover:border-blue-500/50 dark:hover:border-amber-500/40 rounded-2xl p-3.5 sm:p-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-x-2 gap-y-1.5 sm:gap-4 transition-all group text-left shadow-sm"
                    >
                      <span className="text-[10px] font-mono text-gray-400 w-full sm:w-20 shrink-0">{s.dateStr || ''}</span>
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className={`text-xs font-bold leading-tight break-words line-clamp-2 ${aWon ? 'text-blue-600 dark:text-amber-400 font-black' : 'text-white'}`}>{s.timeA}</span>
                        <TeamLogo teamName={s.timeA} teamId={s.preferredIdA} logoUrl={s.logoA} className="w-6 h-6 shrink-0" />
                      </div>
                      <span className="font-mono font-black text-sm px-2.5 sm:px-3.5 py-1 rounded-xl bg-surface-2 border border-line text-white shrink-0 whitespace-nowrap shadow-inner">
                        {s.scoreA} : {s.scoreB}
                      </span>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <TeamLogo teamName={s.timeB} teamId={s.preferredIdB} logoUrl={s.logoB} className="w-6 h-6 shrink-0" />
                        <span className={`text-xs font-bold leading-tight break-words line-clamp-2 ${bWon ? 'text-blue-600 dark:text-amber-400 font-black' : 'text-white'}`}>{s.timeB}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-amber-400 shrink-0" />
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
            <Loader2 className="w-7 h-7 animate-spin text-blue-600 dark:text-amber-400" />
            <span className="text-xs">Calculando estatísticas dos jogadores...</span>
          </div>
        ) : playerStats.players.length === 0 ? (
          <div className="glass-panel border border-line rounded-2xl p-8 text-center text-xs text-gray-400">
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
            <Loader2 className="w-7 h-7 animate-spin text-blue-600 dark:text-amber-400" />
            <span className="text-xs">Calculando picks e bans do torneio...</span>
          </div>
        ) : heroStats.heroes.length === 0 ? (
          <div className="glass-panel border border-line rounded-2xl p-8 text-center text-xs text-gray-400">
            Ainda não há partidas com draft registradas na OpenDota para este campeonato.
          </div>
        ) : (
          <TournamentHeroes heroStats={heroStats} constants={constants} />
        )
      )}

      {/* ABA: INFORMAÇÕES */}
      {activeTab === 'info' && (
        <div className="glass-panel border border-line rounded-3xl p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4 text-sm shadow-xl">
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
