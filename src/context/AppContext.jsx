import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  fetchConstants,
  fetchProMatches,
  fetchLiveGames,
  fetchUpcomingMatches,
  isSeriesMatch,
  getCachedFast,
  getCachedTournaments,
  fetchTournaments,
  normalizeUpcomingList,
  UPCOMING_CACHE_KEY,
  PRO_MATCHES_CACHE_KEY
} from '../services/api';
import { SITE_CONFIG } from '../config/siteConfig';
import { loadTeamLogoRegistry } from '../utils/teamLogos';
import { learnAliases, applyAliasesToSeries, applyAliasesToLiveGame } from '../utils/teamAliases';
import { isSeriesOngoing } from '../utils/seriesStatus';

const AppContext = createContext(null);

// Nome "limpo" para comparar times entre fontes (Liquipedia x Steam/OpenDota)
const cleanTeam = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const looseSameTeam = (a, b) => {
  const x = cleanTeam(a);
  const y = cleanTeam(b);
  if (!x || !y) return false;
  if (x === y) return true;
  // "yakultbrothers" x "yakultbros", "aurora" x "auroragaming"
  const [short, long] = x.length <= y.length ? [x, y] : [y, x];
  return short.length >= 4 && long.startsWith(short);
};

/** Jogo ao vivo agora entre os times de uma partida da agenda (ou undefined). */
export function findLiveGameFor(m, liveGames) {
  return (liveGames || []).find((g) => {
    const a = g.radiant_name || g.timeA || g.team1;
    const b = g.dire_name || g.timeB || g.team2;
    return isSeriesMatch(m.timeA, m.timeB, a, b) ||
      (looseSameTeam(m.timeA, a) && looseSameTeam(m.timeB, b)) ||
      (looseSameTeam(m.timeA, b) && looseSameTeam(m.timeB, a));
  });
}

const isUpcomingLive = (m, liveGames) => Boolean(findLiveGameFor(m, liveGames));

// Nome que a API ao vivo usa quando não conhece a liga (lista da OpenDota indisponível)
const isUnknownLeagueName = (name) => !name || /^Torneio \(Liga \d+\)$/.test(name) || name === 'Torneio Dota 2';

/** Nome do campeonato para uma liga da Valve, pelos campeonatos da Liquipedia. */
function leagueNameFromTournaments(leagueId, tournaments) {
  const same = (tournaments || []).filter((t) => t.leagueId && String(t.leagueId) === String(leagueId));
  if (same.length === 1) return same[0].name;
  if (same.length < 2) return null;
  // Várias classificatórias na mesma liga: a parte comum dos nomes ("DreamLeague Season 30")
  let prefix = same[0].name;
  for (const t of same) while (prefix && !t.name.startsWith(prefix)) prefix = prefix.slice(0, -1);
  // Prefixo terminando no meio de uma palavra ("...Season 30: South"): descarta a palavra cortada
  const cutsWord = same.some((t) => /\w/.test(t.name[prefix.length] || '')) && /\w$/.test(prefix);
  if (cutsWord) prefix = prefix.replace(/\w+$/, '');
  prefix = prefix.replace(/[\s:·-]+$/, '').trim();
  if (prefix.length < 4) return null;
  return same.every((t) => /qualifier/i.test(t.tierType || '')) ? `${prefix} · Qualificatória` : prefix;
}

/**
 * Completa o nome do campeonato dos jogos ao vivo que vieram só com o número da
 * liga: primeiro pela partida da agenda da Liquipedia entre os mesmos times
 * (traz até a região da classificatória), depois pelos campeonatos da Liquipedia.
 */
function withLeagueNames(games, wikiMatches) {
  const tournaments = getCachedTournaments();
  return games.map((g) => {
    if (!isUnknownLeagueName(g.league_name)) return g;
    const wiki = (wikiMatches || []).find((m) => findLiveGameFor(m, [g]));
    const name = wiki?.tourneyName && wiki.tourneyName !== 'Torneio'
      ? wiki.tourneyName
      : leagueNameFromTournaments(g.league_id, tournaments);
    return name ? { ...g, league_name: name } : g;
  });
}

/**
 * A partida agendada já foi jogada? Só conta uma série concluída com os mesmos
 * times jogada no horário da partida ou depois — na fase de grupos os times se
 * reencontram (ex.: abertura e partida decisiva), e a série antiga não pode
 * apagar o confronto de hoje.
 */
function isUpcomingFinished(m, finishedSeries) {
  const scheduled = Number(m.timestamp) || 0; // segundos
  return (finishedSeries || []).some((s) => {
    if (!isSeriesMatch(m.timeA, m.timeB, s.timeA, s.timeB)) return false;
    if (!scheduled) return true;
    const playedAt = Number(s.lastMatchTime || s.startTime) || 0;
    return playedAt >= scheduled - 3600;
  });
}

/**
 * Formato da série pela agenda da Liquipedia: a Valve às vezes marca MD1 como
 * MD3 (series_type 1), e uma MD1 encerrada ficaria "em andamento" em 1x0.
 * Usa a partida da Liquipedia com os mesmos times marcada até 3h do 1º mapa.
 */
function withWikiFormat(series, wikiMatches) {
  if (!series?.startTime) return series;
  const wiki = (wikiMatches || []).find((m) =>
    m.formato && m.timestamp &&
    Math.abs(Number(m.timestamp) - series.startTime) < 3 * 3600 &&
    isSeriesMatch(m.timeA, m.timeB, series.timeA, series.timeB));
  return wiki && wiki.formato !== series.formato ? { ...series, formato: wiki.formato } : series;
}

const WINS_NEEDED = { BO1: 1, BO2: 2, BO3: 2, BO5: 3 };
// Duração máxima de uma série a partir do horário marcado: a Liquipedia às vezes
// demora a marcar a série como encerrada, e ela não pode ficar "ao vivo" para sempre
const MAX_SERIES_HOURS = { BO1: 2, BO2: 3.5, BO3: 4.5, BO5: 7 };

/**
 * Séries que já começaram e ainda não terminaram, mas sem mapa ao vivo agora
 * (intervalo entre um mapa e outro): continuam na seção "ao vivo" até o fim da
 * série. Vêm das séries da OpenDota ainda incompletas (ex.: 1x0 numa MD3) e das
 * séries da Liquipedia com placar parcial que a OpenDota ainda não registrou.
 */
function seriesBetweenMaps(finishedSeries, ongoingSeries, liveGames, now = Date.now()) {
  // Um time não joga duas séries ao mesmo tempo: basta um dos times estar num mapa ao vivo.
  // Os nomes variam entre as fontes ("LVL UP academy" x "Level Up Academy"), então um lado basta.
  const liveTeams = (liveGames || []).flatMap((g) => [g.radiant_name || g.timeA || g.team1, g.dire_name || g.timeB || g.team2]);
  const isLive = (a, b) => Boolean(findLiveGameFor({ timeA: a, timeB: b }, liveGames)) ||
    liveTeams.some((t) => looseSameTeam(t, a) || looseSameTeam(t, b));
  const list = [];

  for (const s of finishedSeries || []) {
    if (!isSeriesOngoing(s) || isLive(s.timeA, s.timeB)) continue;
    list.push({
      key: `od-${s.series_id || `${s.timeA}-${s.timeB}-${s.startTime}`}`,
      timeA: s.timeA, timeB: s.timeB, idA: s.preferredIdA, idB: s.preferredIdB, logoA: s.logoA, logoB: s.logoB,
      scoreA: s.scoreA || 0, scoreB: s.scoreB || 0, formato: s.formato, tourneyName: s.stage,
      series: s
    });
  }

  for (const m of ongoingSeries || []) {
    const a = m.scoreA || 0;
    const b = m.scoreB || 0;
    const fmt = String(m.formato || 'BO3').toUpperCase();
    const needed = WINS_NEEDED[fmt] || 2;
    const recent = m.timestamp && now - m.timestamp * 1000 < (MAX_SERIES_HOURS[fmt] || 4.5) * 3600000;
    if (m.isCompleted || m.winner || a + b === 0 || Math.max(a, b) >= needed || !recent) continue;
    if (isLive(m.timeA, m.timeB)) continue;
    if (list.some((x) => isSeriesMatch(x.timeA, x.timeB, m.timeA, m.timeB))) continue;
    list.push({
      key: `wiki-${m.timeA}-${m.timeB}-${m.timestamp}`,
      timeA: m.timeA, timeB: m.timeB, logoA: m.logoA, logoB: m.logoB,
      scoreA: a, scoreB: b, formato: m.formato, tourneyName: m.tourneyName,
      wikiMatch: m
    });
  }
  return list;
}

/**
 * Separa a lista da Liquipedia em:
 *  - upcoming: ainda não começou (agenda)
 *  - ongoing: já começou (placar parcial ou mapa ao vivo) ou terminou há pouco e
 *    ainda não aparece nas séries concluídas da OpenDota (que demora a processar)
 */
function splitWikiMatches(list, finishedSeries, liveGames, now = Date.now()) {
  const pending = (list || []).filter((m) => !isUpcomingFinished(m, finishedSeries));
  const isDone = (m) => Boolean(m.isCompleted || m.winner);
  const hasStarted = (m) => (m.scoreA || 0) + (m.scoreB || 0) > 0 || isUpcomingLive(m, liveGames);

  const upcoming = pending.filter((m) => {
    if (isDone(m) || hasStarted(m)) return false;
    const matchTime = m.timestamp ? m.timestamp * 1000 : 0;
    return !(matchTime > 0 && now - matchTime > 4 * 3600000);
  });
  const ongoing = pending
    .filter((m) => isDone(m) || hasStarted(m))
    // Em andamento primeiro; depois as encerradas, da mais recente para a mais antiga
    .sort((a, b) => (isDone(a) - isDone(b)) || ((b.timestamp || 0) - (a.timestamp || 0)));
  return { upcoming, ongoing };
}

export function AppProvider({ children }) {
  // Stale-While-Revalidate initial state
  const cachedPro = getCachedFast(PRO_MATCHES_CACHE_KEY);
  const cachedUpcoming = normalizeUpcomingList(getCachedFast(UPCOMING_CACHE_KEY));
  const cachedConstants = getCachedFast('constants_v6');

  // Nomes da Liquipedia já conhecidos (ex.: "The Bot^$" → Skyreavers) valem desde a primeira exibição
  const cachedFinished = (cachedPro?.finishedSeries || []).map((s) => withWikiFormat(applyAliasesToSeries(s), cachedUpcoming));
  const initialSplit = splitWikiMatches(cachedUpcoming, cachedFinished, []);

  const [constants, setConstants] = useState(cachedConstants || { heroes: {}, itemsById: {} });
  const [finishedSeries, setFinishedSeries] = useState(cachedFinished);
  const [tournamentsList, setTournamentsList] = useState(cachedPro?.tournaments || []);
  const [liveGames, setLiveGames] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState(initialSplit.upcoming);
  // Séries começadas ou recém-encerradas (placar da Liquipedia) que ainda não estão nas concluídas
  const [ongoingSeries, setOngoingSeries] = useState(initialSplit.ongoing);
  const [loading, setLoading] = useState(!cachedPro && cachedUpcoming.length === 0);
  const [loadingRefresh, setLoadingRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');

  // Modais globais
  const [selectedHero, setSelectedHero] = useState(null);

  // Busca constantes Valve
  useEffect(() => {
    // Logos dos ~1000 principais times da OpenDota (cache de 24h no navegador)
    loadTeamLogoRegistry();
    // Campeonatos da Liquipedia em cache: dão nome às ligas desconhecidas dos jogos ao vivo
    fetchTournaments();
    fetchConstants().then((data) => {
      if (data && Object.keys(data.heroes || {}).length > 0) {
        setConstants(data);
      }
    });
  }, []);

  // Carrega e atualiza dados
  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setLoadingRefresh(true);
    try {
      const proPromise = fetchProMatches().then((proData) => {
        if (proData?.finishedSeries?.length) {
          setFinishedSeries(proData.finishedSeries.map(applyAliasesToSeries));
          setTournamentsList(proData.tournaments || []);
        }
        return proData;
      });

      const wikiPromise = fetchUpcomingMatches();
      const livePromise = fetchLiveGames();

      const [proData, allWikiMatches, gotvLiveData] = await Promise.all([
        proPromise,
        wikiPromise,
        livePromise
      ]);

      const rawMatches = proData?.rawMatches || [];

      // Séries concluídas da OpenDota com os nomes da Liquipedia: usadas também para
      // tirar da lista "em andamento" as séries que a OpenDota já registrou
      let finished = (proData?.finishedSeries || []).map(applyAliasesToSeries);

      // Times que a OpenDota conhece por outro nome: aprende pela agenda da Liquipedia
      // e aplica os nomes da Liquipedia nas séries e nos jogos ao vivo
      if (proData?.finishedSeries?.length) {
        const allSeries = [...proData.finishedSeries, ...(proData.tournaments || []).flatMap((t) => t.seriesList || [])];
        learnAliases(allSeries, allWikiMatches);
        const fixSeries = (s) => withWikiFormat(applyAliasesToSeries(s), allWikiMatches);
        finished = proData.finishedSeries.map(fixSeries);
        setFinishedSeries(finished);
        setTournamentsList((proData.tournaments || []).map((t) => (t.seriesList ? { ...t, seriesList: t.seriesList.map(fixSeries) } : t)));
      }

      // Detecta jogos em andamento
      const currentLive = withLeagueNames((gotvLiveData || []).map(applyAliasesToLiveGame).filter((g) => {
        const isFinished = rawMatches.some(
          (m) => String(m.match_id) === String(g.match_id) || String(m.match_id) === String(g.matchId)
        );
        return !isFinished;
      }), allWikiMatches);

      // Assim que a partida começa, sai da agenda e vai para "em andamento"
      const { upcoming, ongoing } = splitWikiMatches(allWikiMatches, finished, currentLive);
      setUpcomingMatches(upcoming);
      setOngoingSeries(ongoing);
      setLiveGames(currentLive);
      setLastUpdated(
        new Date().toLocaleTimeString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      );
    } catch (err) {
      console.error('Erro ao sincronizar dados no AppProvider:', err);
    } finally {
      setLoading(false);
      setLoadingRefresh(false);
    }
  }, []);

  // Intervalo de auto-refresh de 30 segundos (especificado no prompt)
  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData(false);
    }, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Séries em andamento esperando o próximo mapa também contam como ao vivo
  const betweenMaps = useMemo(
    () => seriesBetweenMaps(finishedSeries, ongoingSeries, liveGames),
    [finishedSeries, ongoingSeries, liveGames]
  );

  // Contagem de partidas ao vivo
  const liveCount = liveGames.length + betweenMaps.length;

  return (
    <AppContext.Provider
      value={{
        constants,
        finishedSeries,
        ongoingSeries,
        tournamentsList,
        liveGames,
        betweenMaps,
        upcomingMatches,
        loading,
        loadingRefresh,
        lastUpdated,
        liveCount,
        refreshData: () => loadData(true),
        // Modais
        selectedHero,
        setSelectedHero
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp deve ser usado dentro de um AppProvider');
  }
  return context;
}
