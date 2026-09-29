import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  fetchConstants,
  fetchProMatches,
  fetchLiveGames,
  fetchUpcomingMatches,
  isSeriesMatch,
  getCachedFast
} from '../services/api';
import { SITE_CONFIG } from '../config/siteConfig';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // Stale-While-Revalidate initial state
  const cachedPro = getCachedFast('pro_matches_v8');
  const cachedUpcoming = getCachedFast('upcoming_real_matches_v3');
  const cachedConstants = getCachedFast('constants_v6');

  const initialUpcoming = (cachedUpcoming || []).filter((m) => {
    if (m.isCompleted || m.winner) return false;
    const isFinished = (cachedPro?.finishedSeries || []).some((s) =>
      isSeriesMatch(m.timeA, m.timeB, s.timeA, s.timeB)
    );
    return !isFinished;
  });

  const [constants, setConstants] = useState(cachedConstants || { heroes: {}, itemsById: {} });
  const [finishedSeries, setFinishedSeries] = useState(cachedPro?.finishedSeries || []);
  const [tournamentsList, setTournamentsList] = useState(cachedPro?.tournaments || []);
  const [liveGames, setLiveGames] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState(initialUpcoming);
  const [loading, setLoading] = useState(!cachedPro && !cachedUpcoming);
  const [loadingRefresh, setLoadingRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');

  // Modais globais
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [selectedLiveGame, setSelectedLiveGame] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedHero, setSelectedHero] = useState(null);

  // Busca constantes Valve
  useEffect(() => {
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

        const isFinished = (proData?.finishedSeries || []).some((s) =>
          isSeriesMatch(m.timeA, m.timeB, s.timeA, s.timeB)
        );
        return !isFinished;
      });

      // Detecta jogos em andamento
      const currentLive = (gotvLiveData || []).filter((g) => {
        const isFinished = rawMatches.some(
          (m) => String(m.match_id) === String(g.match_id) || String(m.match_id) === String(g.matchId)
        );
        return !isFinished;
      });

      setUpcomingMatches(activeUpcoming);
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
        selectedSeries,
        setSelectedSeries,
        selectedLiveGame,
        setSelectedLiveGame,
        selectedTeam,
        setSelectedTeam,
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
