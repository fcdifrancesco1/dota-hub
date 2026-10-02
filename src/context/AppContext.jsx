import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  fetchConstants,
  fetchProMatches,
  fetchLiveGames,
  fetchUpcomingMatches,
  isSeriesMatch,
  getCachedFast,
  normalizeUpcomingList,
  UPCOMING_CACHE_KEY
} from '../services/api';
import { SITE_CONFIG } from '../config/siteConfig';
import { loadTeamLogoRegistry } from '../utils/teamLogos';

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

/** A partida da agenda já está sendo jogada (algum mapa ao vivo)? */
function isUpcomingLive(m, liveGames) {
  return (liveGames || []).some((g) => {
    const a = g.radiant_name || g.timeA || g.team1;
    const b = g.dire_name || g.timeB || g.team2;
    return isSeriesMatch(m.timeA, m.timeB, a, b) ||
      (looseSameTeam(m.timeA, a) && looseSameTeam(m.timeB, b)) ||
      (looseSameTeam(m.timeA, b) && looseSameTeam(m.timeB, a));
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

export function AppProvider({ children }) {
  // Stale-While-Revalidate initial state
  const cachedPro = getCachedFast('pro_matches_v8');
  const cachedUpcoming = normalizeUpcomingList(getCachedFast(UPCOMING_CACHE_KEY));
  const cachedConstants = getCachedFast('constants_v6');

  const initialUpcoming = cachedUpcoming.filter((m) => {
    if (m.isCompleted || m.winner) return false;
    return !isUpcomingFinished(m, cachedPro?.finishedSeries);
  });

  const [constants, setConstants] = useState(cachedConstants || { heroes: {}, itemsById: {} });
  const [finishedSeries, setFinishedSeries] = useState(cachedPro?.finishedSeries || []);
  const [tournamentsList, setTournamentsList] = useState(cachedPro?.tournaments || []);
  const [liveGames, setLiveGames] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState(initialUpcoming);
  const [loading, setLoading] = useState(!cachedPro && cachedUpcoming.length === 0);
  const [loadingRefresh, setLoadingRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');

  // Modais globais
  const [selectedHero, setSelectedHero] = useState(null);

  // Busca constantes Valve
  useEffect(() => {
    // Logos dos ~1000 principais times da OpenDota (cache de 24h no navegador)
    loadTeamLogoRegistry();
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
          setFinishedSeries(proData.finishedSeries);
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

      const now = Date.now();
      const rawMatches = proData?.rawMatches || [];

      // Filtra partidas futuras
      const activeUpcoming = (allWikiMatches || []).filter((m) => {
        if (m.isCompleted || m.winner) return false;
        const matchTime = m.timestamp ? m.timestamp * 1000 : 0;
        if (matchTime > 0 && now - matchTime > 4 * 3600000) return false;

        return !isUpcomingFinished(m, proData?.finishedSeries);
      });

      // Detecta jogos em andamento
      const currentLive = (gotvLiveData || []).filter((g) => {
        const isFinished = rawMatches.some(
          (m) => String(m.match_id) === String(g.match_id) || String(m.match_id) === String(g.matchId)
        );
        return !isFinished;
      });

      // Assim que a partida começa, sai da agenda: tem mapa ao vivo agora ou a
      // série já tem placar (intervalo entre mapas)
      const notStarted = activeUpcoming.filter((m) =>
        !isUpcomingLive(m, currentLive) && !((m.scoreA || 0) + (m.scoreB || 0) > 0)
      );

      setUpcomingMatches(notStarted);
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

  // Contagem de partidas ao vivo
  const liveCount = liveGames.length;

  return (
    <AppContext.Provider
      value={{
        constants,
        finishedSeries,
        tournamentsList,
        liveGames,
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
