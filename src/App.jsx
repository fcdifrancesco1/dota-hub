import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import Footer from './components/Footer';

// Páginas
import Home from './pages/Home';
import LivePage from './pages/LivePage';
import LiveMatchPage from './pages/LiveMatchPage';
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
import TeamProfileModal from './components/TeamProfileModal';
import HeroDetailModal from './components/HeroDetailModal';

function AppContent() {
  const {
    constants,
    selectedTeam,
    setSelectedTeam,
    selectedHero,
    setSelectedHero
  } = useApp();

  return (
    <div className="min-h-screen bg-canvas app-backdrop text-gray-100 flex flex-col justify-between selection:bg-amber-500 selection:text-black">
      <div>
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/ao-vivo" element={<LivePage />} />
            <Route path="/ao-vivo/:matchKey" element={<LiveMatchPage />} />
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

      {/* MODAIS GLOBAIS DE DETALHES */}
      {selectedTeam && (
        <TeamProfileModal
          team={selectedTeam}
          constants={constants}
          onClose={() => setSelectedTeam(null)}
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
      <ThemeProvider>
        <AuthProvider>
          <AppProvider>
            <AppContent />
          </AppProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}