import React from 'react';
import LiveTickerStrip from '../components/home/LiveTickerStrip';
import HomeHero from '../components/home/HomeHero';
import HomeStatsCards from '../components/home/HomeStatsCards';
import FavoritesHighlight from '../components/home/FavoritesHighlight';
import Upcoming24h from '../components/home/Upcoming24h';
import RecentResultsHome from '../components/home/RecentResultsHome';
import { useApp } from '../context/AppContext';

export default function Home() {
  const { loading } = useApp();

  return (
    <div className="min-h-screen text-gray-100 pb-16">
      {/* 1. Faixa de Partidas Ao Vivo */}
      <LiveTickerStrip />

      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* 2. Hero Principal */}
        <HomeHero />

        {/* 3. Destaque dos Times Favoritos */}
        <FavoritesHighlight />

        {/* 4. Grid de Próximas Partidas (24h) e Resultados Recentes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <Upcoming24h />
          <RecentResultsHome />
        </div>

        {/* 5. Cards de Estatísticas Gerais do Dia/Semana */}
        <HomeStatsCards />
      </div>
    </div>
  );
}
