import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Trophy, X } from 'lucide-react';
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
  simplifyTourneyName,
  getCachedFast
} from './services/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState('hub'); // 'hub' | 'torneios' | 'meta' | 'mmr'
  const [mobileHubSubTab, setMobileHubSubTab] = useState('center'); // 'results' | 'center' | 'upcoming'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTournamentFilter, setSelectedTournamentFilter] = useState('all');

  // Carregamento instantâneo a partir do cache local (Stale-While-Revalidate)
  const cachedPro = getCachedFast('pro_matches_v7');
  const cachedUpcoming = getCachedFast('upcoming_real_matches_v3');
  const cachedConstants = getCachedFast('constants_v6');

  // Filtra o cache inicial para não exibir confrontos já encerrados antes da resposta da API
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

      // 1. Processar partidas ao vivo REAIS vindas do Dota Coordinator / Valve GOTV (/api/live)
      // Ordena decrescente por match_id para garantir que o mapa mais recente tenha prioridade
      const sortedGotv = [...(gotvLiveData || [])]
        .filter(g => !g.deactivate_time || Number(g.deactivate_time) === 0)
        .sort((a, b) => {
          const idA = BigInt(String(a.match_id || 0).replace(/\D/g, "") || 0);
          const idB = BigInt(String(b.match_id || 0).replace(/\D/g, "") || 0);
          return idA > idB ? -1 : idA < idB ? 1 : 0;
        });

      const enrichedGotvLive = sortedGotv.map((gotvGame) => {
        const radName = gotvGame.radiant_name || gotvGame.radiant_team?.team_name || gotvGame.radiant_team?.name;
        const direName = gotvGame.dire_name || gotvGame.dire_team?.team_name || gotvGame.dire_team?.name;

        // Tenta enriquecer com metadados da Liquipedia (logos oficiais, torneio, formato, stream)
        const matchingWiki = (allWikiMatches || []).find((w) =>
          isSeriesMatch(w.timeA, w.timeB, radName, direName)
        );

        if (matchingWiki) {
          const isTimeARadiant = isSameTeamMatch(matchingWiki.timeA, radName);
          return {
            ...gotvGame,
            timeA: matchingWiki.timeA,
            timeB: matchingWiki.timeB,
            logoA: matchingWiki.logoA,
            logoB: matchingWiki.logoB,
            torneio: matchingWiki.torneio || gotvGame.league_name,
            formato: matchingWiki.formato || gotvGame.formato || "BO3",
            streamUrl: matchingWiki.streamUrl || gotvGame.streamUrl,
            series_score: (matchingWiki.scoreA > 0 || matchingWiki.scoreB > 0) ? `${matchingWiki.scoreA} - ${matchingWiki.scoreB}` : null,
            gameScoreA: isTimeARadiant ? gotvGame.radiant_score : gotvGame.dire_score,
            gameScoreB: isTimeARadiant ? gotvGame.dire_score : gotvGame.radiant_score,
            isGameDataActive: true
          };
        }

        return {
          ...gotvGame,
          timeA: radName,
          timeB: direName,
          torneio: gotvGame.league_name || "Torneio Dota 2",
          formato: gotvGame.formato || "BO3",
          gameScoreA: gotvGame.radiant_score,
          gameScoreB: gotvGame.dire_score,
          isGameDataActive: true
        };
      });

      // 2. Partidas que tenham placar ativo de série em andamento confirmado pela Liquipedia
      // (somente se scoreA > 0 ou scoreB > 0, nunca baseado apenas em horário passado)
      const confirmedWikiLive = (allWikiMatches || []).filter((m) => {
        const hasLiveScore = (m.scoreA > 0 || m.scoreB > 0);
        const alreadyInGotv = enrichedGotvLive.some((g) =>
          isSeriesMatch(m.timeA, m.timeB, g.timeA, g.timeB)
        );
        return hasLiveScore && !alreadyInGotv;
      });

      // 3. Deduplicação estrita de séries ao vivo: nunca exibir jogo terminado ao lado do jogo atual
      const deduplicatedLive = [];
      const seenSeries = new Set();
      const combinedLive = [...enrichedGotvLive, ...confirmedWikiLive];

      for (const game of combinedLive) {
        const tA = (game.timeA || game.radiant_name || "").toLowerCase().trim();
        const tB = (game.timeB || game.dire_name || "").toLowerCase().trim();

        if (tA && tB && tA !== "radiant" && tB !== "dire") {
          const seriesKey = [tA, tB].sort().join(" vs ");
          if (seenSeries.has(seriesKey)) {
            continue; // Já temos o mapa mais recente desta série
          }
          seenSeries.add(seriesKey);
        }
        deduplicatedLive.push(game);
      }

      const finalLiveGames = deduplicatedLive;

      // 3. Separar estritamente os jogos agendados que NÃO estão em andamento nem foram finalizados
      const currentFinished = proData?.finishedSeries?.length ? proData.finishedSeries : finishedSeries;
      const nowTs = Date.now();

      const strictlyUpcoming = (allWikiMatches || []).filter((m) => {
        // A. Se a partida está ocorrendo ao vivo agora
        const isLive = finalLiveGames.some((g) =>
          isSeriesMatch(m.timeA, m.timeB, g.timeA, g.timeB)
        );
        if (isLive) return false;

        // B. Se a série já terminou e está na coluna de resultados recentes (finishedSeries)
        const isAlreadyFinished = (currentFinished || []).some((s) =>
          isSeriesMatch(m.timeA, m.timeB, s.timeA, s.timeB)
        );
        if (isAlreadyFinished) return false;

        // C. Se já foi marcada como concluída na Liquipedia
        if (m.isCompleted || m.winner) return false;

        // D. Placar que indica série já concluída
        const sA = Number(m.scoreA) || 0;
        const sB = Number(m.scoreB) || 0;
        const fmt = (m.formato || "BO3").toUpperCase();
        if (fmt === "BO1" && (sA >= 1 || sB >= 1)) return false;
        if (fmt === "BO3" && (sA >= 2 || sB >= 2)) return false;
        if (fmt === "BO5" && (sA >= 3 || sB >= 3)) return false;
        if (fmt === "BO2" && (sA + sB >= 2)) return false;

        // E. Partida agendada há mais de 3 horas que não está ao vivo
        if (m.timestamp && (nowTs - m.timestamp > 3 * 3600 * 1000)) {
          return false;
        }

        return true;
      });

      setLiveGames(finalLiveGames);
      setUpcomingMatches(strictlyUpcoming);
      setLastUpdated(new Date().toLocaleTimeString('pt-BR'));
    } catch (err) {
      console.warn('Aviso ao sincronizar dados em segundo plano:', err);
    } finally {
      setLoadingData(false);
      setLoadingRefresh(false);
    }
  }, [finishedSeries]);

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

  // Opções disponíveis para o filtro de torneios na tela inicial
  const tournamentOptions = useMemo(() => {
    const counts = {};
    const addTourney = (name) => {
      const clean = simplifyTourneyName(name);
      if (clean && clean !== "Torneio Dota 2" && clean !== "Torneio Profissional") {
        counts[clean] = (counts[clean] || 0) + 1;
      }
    };

    (finishedSeries || []).forEach((s) => addTourney(s.stage || s.leagueName));
    (liveGames || []).forEach((g) => addTourney(g.torneio || g.league_name));
    (upcomingMatches || []).forEach((m) => addTourney(m.torneio));

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [finishedSeries, liveGames, upcomingMatches]);

  // Listas filtradas conforme o torneio selecionado na tela inicial
  const filteredFinishedSeries = useMemo(() => {
    if (selectedTournamentFilter === 'all') return finishedSeries;
    return finishedSeries.filter(
      (s) => simplifyTourneyName(s.stage || s.leagueName) === selectedTournamentFilter
    );
  }, [finishedSeries, selectedTournamentFilter]);

  const filteredLiveGames = useMemo(() => {
    if (selectedTournamentFilter === 'all') return liveGames;
    return liveGames.filter(
      (g) => simplifyTourneyName(g.torneio || g.league_name) === selectedTournamentFilter
    );
  }, [liveGames, selectedTournamentFilter]);

  const filteredUpcomingMatches = useMemo(() => {
    if (selectedTournamentFilter === 'all') return upcomingMatches;
    return upcomingMatches.filter(
      (m) => simplifyTourneyName(m.torneio) === selectedTournamentFilter
    );
  }, [upcomingMatches, selectedTournamentFilter]);

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

          {/* BARRA DE FILTRO POR TORNEIO NA TELA INICIAL */}
          {tournamentOptions.length > 0 && (
            <div className="bg-[#0E1118]/90 border-b border-white/10 px-3 sm:px-6 py-2.5 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar no-scrollbar py-0.5">
                <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-400 shrink-0 mr-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Torneio:</span>
                </span>

                <button
                  type="button"
                  onClick={() => setSelectedTournamentFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    selectedTournamentFilter === 'all'
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-extrabold'
                      : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
                  }`}
                >
                  <span>Todos os Torneios</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                      selectedTournamentFilter === 'all'
                        ? 'bg-black/20 text-black font-extrabold'
                        : 'bg-white/10 text-gray-400'
                    }`}
                  >
                    {finishedSeries.length + liveGames.length + upcomingMatches.length}
                  </span>
                </button>

                {tournamentOptions.map((opt) => {
                  const isSelected = selectedTournamentFilter === opt.name;
                  return (
                    <button
                      key={opt.name}
                      type="button"
                      onClick={() => setSelectedTournamentFilter(isSelected ? 'all' : opt.name)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-extrabold'
                          : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
                      }`}
                    >
                      <span>{opt.name}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-black/20 text-black font-extrabold'
                            : 'bg-white/10 text-gray-400'
                        }`}
                      >
                        {opt.count}
                      </span>
                    </button>
                  );
                })}

                {selectedTournamentFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedTournamentFilter('all')}
                    title="Remover filtro de torneio"
                    className="flex items-center gap-1 text-[11px] font-bold text-gray-400 hover:text-rose-400 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors shrink-0 ml-auto cursor-pointer"
                  >
                    <X className="w-3 h-3" /> Limpar
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="main-grid">
            {/* COLUNA ESQUERDA: RESULTADOS RECENTES */}
            <div className={`${mobileHubSubTab === 'results' ? 'block' : 'hidden'} lg:block h-full`}>
              <RecentResultsSidebar
                series={filteredFinishedSeries}
                loading={loadingData}
                searchQuery={searchQuery}
                tournamentFilter={selectedTournamentFilter}
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
                liveGames={filteredLiveGames}
                loading={loadingData}
                tournamentFilter={selectedTournamentFilter}
                onSelectLiveGame={(game) => {
                  setSelectedLiveGame(game);
                }}
              />
            </main>

            {/* COLUNA DIREITA: JOGOS AGENDADOS (ESTRITAMENTE FUTUROS) */}
            <div className={`${mobileHubSubTab === 'upcoming' ? 'block' : 'hidden'} lg:block h-full`}>
              <UpcomingSidebar
                upcoming={filteredUpcomingMatches}
                loading={loadingData}
                searchQuery={searchQuery}
                tournamentFilter={selectedTournamentFilter}
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

      {/* MODAL DETALHADO DA PARTIDA AO VIVO (DRAFT, ESTATÍSTICAS, ITENS, TORRES) */}
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