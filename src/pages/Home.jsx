import React from 'react';
import LiveTickerStrip from '../components/home/LiveTickerStrip';
import HomeHero from '../components/home/HomeHero';
import AnimatedHeroCard from '../components/home/AnimatedHeroCard';
import HomeStatsCards from '../components/home/HomeStatsCards';
import Upcoming24h from '../components/home/Upcoming24h';
import RecentResultsHome from '../components/home/RecentResultsHome';
import NewsPanel from '../components/home/NewsPanel';
import { useApp } from '../context/AppContext';

export default function Home() {
  const { loading } = useApp();

  return (
    <div className="min-h-screen text-slate-900 dark:text-gray-100 pb-16">
      {/* 1. Faixa de Partidas Ao Vivo */}
      <LiveTickerStrip />

      {/* Telas largas: notícias numa coluna à direita; nas menores, abaixo do conteúdo */}
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        <div className="min-w-0">
          {/* 2. Hero Principal */}
          <HomeHero />

          {/* 2.5 Destaque Interativo do Meta (Card 3D Animado) */}
          <div className="mb-8">
            <AnimatedHeroCard />
          </div>

          {/* 3. Grid de Próximas Partidas (24h) e Resultados Recentes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            <Upcoming24h />
            <RecentResultsHome />
          </div>

          {/* 4. Cards de Estatísticas Gerais do Dia/Semana */}
          <HomeStatsCards />
        </div>

        {/* 5. Notícias e transferências */}
        <NewsPanel />
      </div>
    </div>
  );
}
