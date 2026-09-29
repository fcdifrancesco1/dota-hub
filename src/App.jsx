import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';

// Páginas
import Home from './pages/Home';
import LivePage from './pages/LivePage';
import TournamentsPage from './pages/TournamentsPage';
import TournamentDetailPage from './pages/TournamentDetailPage';
import MatchesPage from './pages/MatchesPage';
import MatchDetailPage from './pages/MatchDetailPage';
import TeamsPage from './pages/TeamsPage';
import TeamDetailPage from './pages/TeamDetailPage';
import PlayersPage from './pages/PlayersPage';
import PlayerDetailPage from './pages/PlayerDetailPage';
import HeroesPage from './pages/HeroesPage';
import HeroDetailPage from './pages/HeroDetailPage';
import PredictionsPage from './pages/PredictionsPage';
import AnalysesPage from './pages/AnalysesPage';
import AnalysisDetailPage from './pages/AnalysisDetailPage';
import AdminPage from './pages/AdminPage';

// Modais Globais
import MatchDetailModal from './components/MatchDetailModal';
import LiveMatchDetailModal from './components/LiveMatchDetailModal';
import TeamProfileModal from './components/TeamProfileModal';
import HeroDetailModal from './components/HeroDetailModal';

function AppContent() {
  const {
    constants,
    selectedSeries,
    setSelectedSeries,
    selectedLiveGame,
    setSelectedLiveGame,
    selectedTeam,
    setSelectedTeam,
    selectedHero,
    setSelectedHero
  } = useApp();

  return (
    <div className="min-h-screen bg-[#0A0C10] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,20,20,0.15),rgba(255,255,255,0))] text-gray-100 flex flex-col justify-between selection:bg-amber-500 selection:text-black">
      <div>
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/ao-vivo" element={<LivePage />} />
            <Route path="/campeonatos" element={<TournamentsPage />} />
            <Route path="/campeonatos/:id" element={<TournamentDetailPage />} />
            <Route path="/partidas" element={<MatchesPage />} />
            <Route path="/partidas/:id" element={<MatchDetailPage />} />
            <Route path="/times" element={<TeamsPage />} />
            <Route path="/times/:id" element={<TeamDetailPage />} />
            <Route path="/jogadores" element={<PlayersPage />} />
            <Route path="/jogadores/:id" element={<PlayerDetailPage />} />
            <Route path="/herois" element={<HeroesPage />} />
            <Route path="/herois/:id" element={<HeroDetailPage />} />
            <Route path="/palpites" element={<PredictionsPage />} />
            <Route path="/analises" element={<AnalysesPage />} />
            <Route path="/analises/:slug" element={<AnalysisDetailPage />} />
            <Route path="/admin" element={<AdminPage />} />
            {/* Fallback route */}
            <Route path="*" element={<Home />} />
          </Routes>
        </main>
      </div>

      <Footer />

      {/* MODAIS GLOBAIS DE TELEMETRIA E DETALHES */}
      {selectedSeries && (
        <MatchDetailModal
          series={selectedSeries}
          constants={constants}
          onClose={() => setSelectedSeries(null)}
          onSelectTeam={setSelectedTeam}
          onSelectHero={setSelectedHero}
        />
      )}

      {selectedLiveGame && (
        <LiveMatchDetailModal
          game={selectedLiveGame}
          constants={constants}
          onClose={() => setSelectedLiveGame(null)}
          onSelectTeam={setSelectedTeam}
          onSelectHero={setSelectedHero}
        />
      )}

      {selectedTeam && (
        <TeamProfileModal
          team={selectedTeam}
          constants={constants}
          onClose={() => setSelectedTeam(null)}
          onSelectMatch={setSelectedSeries}
          onSelectHero={setSelectedHero}
        />
      )}

      {selectedHero && (
        <HeroDetailModal
          hero={selectedHero}
          constants={constants}
          onClose={() => setSelectedHero(null)}
          onSelectTeam={setSelectedTeam}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}