import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import RecentResultsSidebar from './components/RecentResultsSidebar';
import CenterChampion from './components/CenterChampion';
import LiveMatchesSection from './components/LiveMatchesSection';
import UpcomingSidebar from './components/UpcomingSidebar';
import MatchDetailModal from './components/MatchDetailModal';
import LiveMatchDetailModal from './components/LiveMatchDetailModal';
import HeroMetaView from './components/HeroMetaView';
import TournamentsView from './components/TournamentsView';
import MmrRankingView from './components/MmrRankingView';
import RecordsView from './components/RecordsView';
import CombosView from './components/CombosView';
import TeamProfileModal from './components/TeamProfileModal';
import HeroDetailModal from './components/HeroDetailModal';

import {
  fetchConstants,
  fetchProMatches,
  fetchLiveGames,
  fetchUpcomingMatches,
  isSeriesMatch,
  isSameTeamMatch,
  getCachedFast
} from './services/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState('hub'); // 'hub' | 'torneios' | 'meta' | 'mmr'
  const [mobileHubSubTab, setMobileHubSubTab] = useState('center'); // 'results' | 'center' | 'upcoming'
  const [searchQuery, setSearchQuery] = useState('');

  // Carregamento instantâneo a partir do cache local (Stale-While-Revalidate)
  const cachedPro = getCachedFast('pro_matches_v7');
  const cachedUpcoming = getCachedFast('upcoming_real_matches_v3');
  const cachedConstants = getCachedFast('constants_v6');

  const [constants, setConstants] = useState(cachedConstants || { heroes: {}, itemsById: {} });
  const [finishedSeries, setFinishedSeries] = useState(cachedPro?.finishedSeries || []);
  const [tournamentsList, setTournamentsList] = useState(cachedPro?.tournaments || []);
  const [liveGames, setLiveGames] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState(cachedUpcoming || []);

  // Se já temos cache, não exibe tela de carregamento / esqueletos!
  const [loadingData, setLoadingData] = useState(!cachedPro && !cachedUpcoming);
  const [loadingRefresh, setLoadingRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');

  // Modais
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [selectedLiveGame, setSelectedLiveGame] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null); // { id, name }
  const [selectedHero, setSelectedHero] = useState(null); // { id, localized_name, ... }

  // 1. Carregar Constantes de Heróis e Itens da Valve em segundo plano
  useEffect(() => {
    fetchConstants().then((data) => {
      if (data && (Object.keys(data.heroes || {}).length > 0)) {
        setConstants(data);
      }
    });
  }, []);

  // 2. Carregar Dados de Partidas, Séries e Torneios de forma desacoplada e fluida
  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setLoadingRefresh(true);

    try {
      // 1. Dispara proMatches e atualiza imediatamente a coluna de resultados assim que chegar
      const proPromise = fetchProMatches().then((proData) => {
        if (proData?.finishedSeries?.length) {
          setFinishedSeries(proData.finishedSeries);
          setTournamentsList(proData.tournaments || []);
        }
        return proData;
      });

      // 2. Dispara jogos da Liquipedia e DotaTV em paralelo
      const wikiPromise = fetchUpcomingMatches();
      const livePromise = fetchLiveGames();

      const [proData, allWikiMatches, gotvLiveData] = await Promise.all([
        proPromise,
        wikiPromise,
        livePromise
      ]);

      const now = Date.now();
      const rawMatches = proData?.rawMatches || [];

      // Separar jogos ao vivo reais da Liquipedia (placar ativo ou horário dentro da janela ao vivo)
      const liveFromWiki = (allWikiMatches || []).filter((m) => {
        const hasLiveScore = (m.scoreA > 0 || m.scoreB > 0);
        const isInLiveWindow = m.timestamp && (m.timestamp <= now + 15 * 60 * 1000) && (m.timestamp >= now - 3.5 * 3600 * 1000);
        return hasLiveScore || isInLiveWindow;
      });

      // Separar estritamente os jogos futuros agendados
      const strictlyUpcoming = (allWikiMatches || []).filter((m) => {
        const hasLiveScore = (m.scoreA > 0 || m.scoreB > 0);
        const isInLiveWindow = m.timestamp && (m.timestamp <= now + 15 * 60 * 1000) && (m.timestamp >= now - 3.5 * 3600 * 1000);
        return !hasLiveScore && !isInLiveWindow;
      });

      // Enriquecer partidas ao vivo com os ABATES DO JOGO (GAME SCORE) INDIVIDUALIZADOS
      const enrichedLive = liveFromWiki.map((m) => {
        const matchingRaw = rawMatches.find((rm) =>
          isSeriesMatch(m.timeA, m.timeB, rm.radiant_name, rm.dire_name)
        );

        if (matchingRaw) {
          const isTimeARadiant = isSameTeamMatch(m.timeA, matchingRaw.radiant_name);
          const gameScoreA = isTimeARadiant ? matchingRaw.radiant_score : matchingRaw.dire_score;
          const gameScoreB = isTimeARadiant ? matchingRaw.dire_score : matchingRaw.radiant_score;

          return {
            ...m,
            match_id: matchingRaw.match_id,
            gameScoreA: gameScoreA ?? 0,
            gameScoreB: gameScoreB ?? 0,
            gameDuration: matchingRaw.duration,
            isGameDataActive: true
          };
        }

        const elapsedMins = m.timestamp ? Math.max(0, Math.floor((now - m.timestamp) / 60000)) : null;

        return {
          ...m,
          gameScoreA: null,
          gameScoreB: null,
          gameDuration: elapsedMins != null ? elapsedMins * 60 : null,
          isGameDataActive: false
        };
      });

      // Inclui também quaisquer jogos do DotaTV (liveLeagueGames)
      (gotvLiveData || []).forEach(gotvGame => {
        const alreadyExists = enrichedLive.some(u => isSeriesMatch(u.timeA, u.timeB, gotvGame.radiant_team?.name, gotvGame.dire_team?.name));
        if (!alreadyExists) {
          enrichedLive.push(gotvGame);
        }
      });

      setLiveGames(enrichedLive);
      setUpcomingMatches(strictlyUpcoming);
      setLastUpdated(new Date().toLocaleTimeString('pt-BR'));
    } catch (err) {
      console.warn('Aviso ao sincronizar dados em segundo plano:', err);
    } finally {
      setLoadingData(false);
      setLoadingRefresh(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Polling de partidas ao vivo a cada 20 segundos, apenas nas abas que
  // realmente exibem esses dados (Hub e Torneios). 'meta' e 'mmr' usam
  // suas próprias fontes de dados e não precisam desse refresh.
  useEffect(() => {
    if (currentTab !== 'hub' && currentTab !== 'torneios') return;

    const liveInterval = setInterval(() => {
      loadData(false);
    }, 20000);

    return () => clearInterval(liveInterval);
  }, [loadData, currentTab]);

  return (
    <div className="app-container min-h-screen flex flex-col bg-[#0B0D12] text-[#E1E6F0] selection:bg-amber-500 selection:text-black">
      {/* CABEÇALHO GLOBAL */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onRefresh={() => loadData(true)}
        loadingRefresh={loadingRefresh}
        lastUpdated={lastUpdated}
      />

      {/* 1. VISUALIZAÇÃO: HUB PRINCIPAL */}
      {currentTab === 'hub' && (
        <div className="flex-1 flex flex-col">
          {/* Seletor de Colunas para Telas Mobile/Tablet */}
          <div className="lg:hidden flex items-center justify-around border-b border-white/10 bg-[#0E1118] p-1 text-xs font-bold uppercase">
            <button
              onClick={() => setMobileHubSubTab('results')}
              className={`flex-1 py-2 rounded-lg transition-colors ${
                mobileHubSubTab === 'results' ? 'bg-amber-500 text-black' : 'text-gray-400'
              }`}
            >
              Resultados
            </button>
            <button
              onClick={() => setMobileHubSubTab('center')}
              className={`flex-1 py-2 rounded-lg transition-colors ${
                mobileHubSubTab === 'center' ? 'bg-amber-500 text-black' : 'text-gray-400'
              }`}
            >
              Ao Vivo / Campeão
            </button>
            <button
              onClick={() => setMobileHubSubTab('upcoming')}
              className={`flex-1 py-2 rounded-lg transition-colors ${
                mobileHubSubTab === 'upcoming' ? 'bg-amber-500 text-black' : 'text-gray-400'
              }`}
            >
              Próximos
            </button>
          </div>

          <div className="main-grid">
            {/* COLUNA ESQUERDA: RESULTADOS RECENTES */}
            <div className={`${mobileHubSubTab === 'results' ? 'block' : 'hidden'} lg:block h-full`}>
              <RecentResultsSidebar
                series={finishedSeries}
                loading={loadingData}
                searchQuery={searchQuery}
                onSelectSeries={(s) => setSelectedSeries(s)}
              />
            </div>

            {/* COLUNA CENTRO: CAMPEÃO + AO VIVO */}
            <main
              className={`${
                mobileHubSubTab === 'center' ? 'block' : 'hidden'
              } lg:flex flex-1 flex-col items-center p-4 lg:p-7 overflow-y-auto custom-scrollbar space-y-6`}
            >
              {/* Card do Campeão Mundial */}
              <CenterChampion
                onOpenTeamProfile={(teamId, teamName) =>
                  setSelectedTeam({ id: teamId, name: teamName })
                }
              />

              {/* Grid de Partidas Ao Vivo no Centro */}
              <LiveMatchesSection
                liveGames={liveGames}
                loading={loadingData}
                onSelectLiveGame={(game) => {
                  setSelectedLiveGame(game);
                }}
              />
            </main>

            {/* COLUNA DIREITA: JOGOS AGENDADOS (ESTRITAMENTE FUTUROS) */}
            <div className={`${mobileHubSubTab === 'upcoming' ? 'block' : 'hidden'} lg:block h-full`}>
              <UpcomingSidebar
                upcoming={upcomingMatches}
                loading={loadingData}
                searchQuery={searchQuery}
                onOpenTeamProfile={(teamId, teamName) =>
                  setSelectedTeam({ id: teamId, name: teamName })
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. VISUALIZAÇÃO: TORNEIOS */}
      {currentTab === 'torneios' && (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <TournamentsView
            tournaments={tournamentsList}
            loading={loadingData}
            searchQuery={searchQuery}
            onSelectSeries={(s) => setSelectedSeries(s)}
          />
        </div>
      )}

      {/* 3. VISUALIZAÇÃO: META DO PATCH / TIER LIST */}
      {currentTab === 'meta' && (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <HeroMetaView
            searchQuery={searchQuery}
            onSelectHero={(h) => setSelectedHero(h)}
          />
        </div>
      )}

      {/* 4. VISUALIZAÇÃO: RANKING MMR IMMORTAL */}
      {currentTab === 'mmr' && (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <MmrRankingView searchQuery={searchQuery} />
        </div>
      )}

      {/* 5. VISUALIZAÇÃO: RECORDES MUNDIAIS (HISTÓRICO COMPETITIVO) */}
      {currentTab === 'records' && (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <RecordsView
            constants={constants}
            onSelectHero={(h) => setSelectedHero(h)}
          />
        </div>
      )}

      {/* 6. VISUALIZAÇÃO: COMBOS & SINERGIAS DE HERÓIS */}
      {currentTab === 'combos' && (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <CombosView
            constants={constants}
            onSelectHero={(h) => setSelectedHero(h)}
          />
        </div>
      )}

      {/* MODAL DETALHADO DE REPLAY DA SÉRIE (FINALIZADAS / RECENTES) */}
      {selectedSeries && (
        <MatchDetailModal
          series={selectedSeries}
          constants={constants}
          onClose={() => setSelectedSeries(null)}
          onOpenTeamProfile={(teamId, teamName) =>
            setSelectedTeam({ id: teamId, name: teamName })
          }
          onSelectHero={(h) => setSelectedHero(h)}
        />
      )}

      {/* MODAL DETALHADO DA PARTIDA AO VIVO (MINIMAPA, ESTATÍSTICAS, BUYBACKS, PICKS & BANS) */}
      {selectedLiveGame && (
        <LiveMatchDetailModal
          game={selectedLiveGame}
          constants={constants}
          onClose={() => setSelectedLiveGame(null)}
          onOpenTeamProfile={(teamId, teamName) =>
            setSelectedTeam({ id: teamId, name: teamName })
          }
          onSelectHero={(h) => setSelectedHero(h)}
        />
      )}

      {/* MODAL DE PERFIL DO TIME */}
      {selectedTeam && (
        <TeamProfileModal
          teamId={selectedTeam.id}
          teamName={selectedTeam.name}
          constants={constants}
          onClose={() => setSelectedTeam(null)}
          onSelectHero={(h) => setSelectedHero(h)}
        />
      )}

      {/* MODAL ENCICLOPÉDIA DE HERÓI (HABILIDADES, AGHANIM, TALENTOS, BENCHMARKS, COUNTERS) */}
      {selectedHero && (
        <HeroDetailModal
          hero={selectedHero}
          constants={constants}
          onClose={() => setSelectedHero(null)}
          onSelectAnotherHero={(h) => setSelectedHero(h)}
        />
      )}
    </div>
  );
}