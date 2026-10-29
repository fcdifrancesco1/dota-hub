import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import Footer from './components/Footer';
import { RouteMeta } from './utils/pageMeta';

// Páginas: a inicial vai no pacote principal; as demais são baixadas só quando abertas
import Home from './pages/Home';
const LivePage = lazy(() => import('./pages/LivePage'));
const LiveMatchPage = lazy(() => import('./pages/LiveMatchPage'));
const TournamentsPage = lazy(() => import('./pages/TournamentsPage'));
const TournamentDetailPage = lazy(() => import('./pages/TournamentDetailPage'));
const MatchesPage = lazy(() => import('./pages/MatchesPage'));
const MatchDetailPage = lazy(() => import('./pages/MatchDetailPage'));
const HeroesPage = lazy(() => import('./pages/HeroesPage'));
const HeroDetailPage = lazy(() => import('./pages/HeroDetailPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const TeamPage = lazy(() => import('./pages/TeamPage'));
const TeamsPage = lazy(() => import('./pages/TeamsPage'));
const PlayerDetailPage = lazy(() => import('./pages/PlayerDetailPage'));

function PageLoading() {
  return (
    <div className="flex justify-center items-center py-32" role="status" aria-label="Carregando página">
      <div className="w-8 h-8 rounded-full border-2 border-line border-t-amber-500 animate-spin" />
    </div>
  );
}

// Modais Globais
import HeroDetailModal from './components/HeroDetailModal';

// Ao trocar de página, volta ao topo (o React Router mantém a rolagem anterior)
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function AppContent() {
  const {
    constants,
    selectedHero,
    setSelectedHero
  } = useApp();

  return (
    <div className="min-h-screen bg-canvas app-backdrop text-white flex flex-col justify-between selection:bg-amber-500 selection:text-black">
      <div>
        <ScrollToTop />
        <RouteMeta />
        <Header />
        <main>
          <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/ao-vivo" element={<LivePage />} />
            <Route path="/ao-vivo/:matchKey" element={<LiveMatchPage />} />
            <Route path="/campeonatos" element={<TournamentsPage />} />
            <Route path="/campeonatos/:id" element={<TournamentDetailPage />} />
            <Route path="/partidas" element={<MatchesPage />} />
            <Route path="/partidas/:id" element={<MatchDetailPage />} />
            <Route path="/times" element={<TeamsPage />} />
            <Route path="/times/:id" element={<TeamPage />} />
            <Route path="/jogadores/:id" element={<PlayerDetailPage />} />
            <Route path="/players/:id" element={<PlayerDetailPage />} />
            <Route path="/herois" element={<HeroesPage />} />
            <Route path="/herois/:id" element={<HeroDetailPage />} />
            <Route path="/perfil" element={<ProfilePage />} />
            <Route path="/admin" element={<AdminPage />} />
            {/* Fallback route */}
            <Route path="*" element={<Home />} />
          </Routes>
          </Suspense>
        </main>
      </div>

      <Footer />

      {/* MODAIS GLOBAIS DE DETALHES */}
      {selectedHero && (
        <HeroDetailModal
          hero={selectedHero}
          constants={constants}
          onClose={() => setSelectedHero(null)}
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