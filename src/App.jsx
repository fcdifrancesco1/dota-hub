import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import RecentResultsSidebar from './components/RecentResultsSidebar';
import CenterChampion from './components/CenterChampion';
import LiveMatchesSection from './components/LiveMatchesSection';
import UpcomingSidebar from './components/UpcomingSidebar';
import MatchDetailModal from './components/MatchDetailModal';
import HeroMetaView from './components/HeroMetaView';
import TournamentsView from './components/TournamentsView';
import MmrRankingView from './components/MmrRankingView';
import TeamProfileModal from './components/TeamProfileModal';

import {
  fetchConstants,
  fetchProMatches,
  fetchLiveGames,
  fetchUpcomingMatches
} from './services/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState('hub'); // 'hub' | 'torneios' | 'meta' | 'mmr'
  const [mobileHubSubTab, setMobileHubSubTab] = useState('center'); // 'results' | 'center' | 'upcoming'
  const [searchQuery, setSearchQuery] = useState('');

  const [constants, setConstants] = useState({ heroes: {}, itemsById: {} });
  const [finishedSeries, setFinishedSeries] = useState([]);
  const [tournamentsList, setTournamentsList] = useState([]);
  const [liveGames, setLiveGames] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);

  const [loadingData, setLoadingData] = useState(true);
  const [loadingRefresh, setLoadingRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');

  // Modais
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null); // { id, name }

  // 1. Carregar Constantes de Heróis e Itens da Valve
  useEffect(() => {
    fetchConstants().then((data) => {
      setConstants(data);
    });
  }, []);

  // 2. Carregar Dados de Partidas, Séries e Torneios
  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setLoadingRefresh(true);
    else setLoadingData(true);

    try {
      const [proData, liveData, upcomingData] = await Promise.all([
        fetchProMatches(),
        fetchLiveGames(),
        fetchUpcomingMatches()
      ]);

      setFinishedSeries(proData.finishedSeries || []);
      setTournamentsList(proData.tournaments || []);
      setLiveGames(liveData || []);
      setUpcomingMatches(upcomingData || []);
      setLastUpdated(new Date().toLocaleTimeString('pt-BR'));
    } catch (err) {
      console.error('Erro ao carregar dados do Hub:', err);
    } finally {
      setLoadingData(false);
      setLoadingRefresh(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Polling de partidas ao vivo a cada 20 segundos
    const liveInterval = setInterval(async () => {
      const live = await fetchLiveGames();
      setLiveGames(live || []);
    }, 20000);

    return () => clearInterval(liveInterval);
  }, [loadData]);

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

              {/* Grid de Partidas Ao Vivo */}
              <LiveMatchesSection
                liveGames={liveGames}
                loading={loadingData}
                onSelectLiveGame={(game) => {
                  // Se for uma partida com match_id, abre o modal
                  if (game.match_id) {
                    setSelectedSeries({
                      stage: game.league_name || "Partida Oficial Ao Vivo",
                      timeA: (game.radiant_team && game.radiant_team.name) || "Radiant",
                      timeB: (game.dire_team && game.dire_team.name) || "Dire",
                      scoreA: game.radiant_score || 0,
                      scoreB: game.dire_score || 0,
                      dur: "Em andamento",
                      games: [{ mapNumber: 1, match_id: String(game.match_id) }]
                    });
                  }
                }}
              />
            </main>

            {/* COLUNA DIREITA: JOGOS AGENDADOS */}
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
          <HeroMetaView searchQuery={searchQuery} />
        </div>
      )}

      {/* 4. VISUALIZAÇÃO: RANKING MMR IMMORTAL */}
      {currentTab === 'mmr' && (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <MmrRankingView searchQuery={searchQuery} />
        </div>
      )}

      {/* MODAL DETALHADO DA PARTIDA (REPLAY, DRAFT, VANTAGEM DE OURO/XP) */}
      {selectedSeries && (
        <MatchDetailModal
          series={selectedSeries}
          constants={constants}
          onClose={() => setSelectedSeries(null)}
          onOpenTeamProfile={(teamId, teamName) =>
            setSelectedTeam({ id: teamId, name: teamName })
          }
        />
      )}

      {/* MODAL DE PERFIL DO TIME */}
      {selectedTeam && (
        <TeamProfileModal
          teamId={selectedTeam.id}
          teamName={selectedTeam.name}
          constants={constants}
          onClose={() => setSelectedTeam(null)}
        />
      )}
    </div>
  );
}