import React from 'react';
import LiveTickerStrip from '../components/home/LiveTickerStrip';
import HomeHero from '../components/home/HomeHero';
import AnimatedHeroCard from '../components/home/AnimatedHeroCard';
import HomeStatsCards from '../components/home/HomeStatsCards';
import Upcoming24h from '../components/home/Upcoming24h';
import RecentResultsHome from '../components/home/RecentResultsHome';
import NewsPanel from '../components/home/NewsPanel';
import RankingsCard from '../components/home/RankingsCard';
import { useApp } from '../context/AppContext';

export default function Home() {
  const { loading } = useApp();

  return (
    <div className="min-h-screen text-white pb-16">
      {/* 1. Faixa de Partidas Ao Vivo */}
      <LiveTickerStrip />

      {/* Largura total da tela: rankings à esquerda, conteúdo no meio e notícias à direita.
          Telas médias: rankings + conteúdo, notícias embaixo; celular: tudo empilhado */}
      <div className="w-full px-4 sm:px-6 lg:px-8 grid grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)] 2xl:grid-cols-[320px_minmax(0,1fr)_340px] gap-6 items-start">
        <aside className="order-2 xl:order-1 xl:sticky xl:top-20">
          <RankingsCard />
        </aside>

        <div className="min-w-0 order-1 xl:order-2">
          {/* 2. Hero Principal */}
          <HomeHero />

          {/* 2.5 Destaque do meta: heróis mais disputados nas partidas profissionais */}
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
        <div className="order-3 xl:col-span-2 2xl:col-span-1 min-w-0">
          <NewsPanel />
        </div>
      </div>
    </div>
  );
}
