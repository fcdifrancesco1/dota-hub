import React from 'react';
import LiveTickerStrip from '../components/home/LiveTickerStrip';
import HomeHero from '../components/home/HomeHero';
import AnimatedHeroCard from '../components/home/AnimatedHeroCard';
import HomeStatsCards from '../components/home/HomeStatsCards';
import Upcoming24h from '../components/home/Upcoming24h';
import RecentResultsHome from '../components/home/RecentResultsHome';
import NewsPanel from '../components/home/NewsPanel';
import RankingsCard from '../components/home/RankingsCard';

// Linha suave que separa as seções dentro da superfície única da Home
const Divider = () => <div className="home-divider my-6 sm:my-8" />;

export default function Home() {
  return (
    <div className="min-h-screen text-white pb-16">
      {/* 1. Faixa de Partidas Ao Vivo */}
      <LiveTickerStrip />

      {/* A Home é uma única superfície: as colunas são separadas por linhas finas, não por cards.
          Largura total: rankings à esquerda, conteúdo no meio e notícias à direita.
          Telas médias: rankings + conteúdo, notícias embaixo; celular: tudo empilhado */}
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="home-shell grid grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)] 2xl:grid-cols-[320px_minmax(0,1fr)_340px] items-start">
          {/* Fixo ao rolar só quando as notícias têm coluna própria (2xl); no xl elas ficam
              embaixo, ocupando as duas colunas, e o ranking passaria por cima delas */}
          <aside className="order-2 xl:order-1 2xl:sticky 2xl:top-20 p-2 sm:p-3 border-t border-line/60 xl:border-t-0">
            <RankingsCard />
          </aside>

          <div className="min-w-0 order-1 xl:order-2 p-3 sm:p-5 xl:border-l border-line/60 self-stretch">
            {/* 2. Hero Principal */}
            <HomeHero />

            <Divider />

            {/* 2.5 Destaque do meta: heróis mais disputados nas partidas profissionais */}
            <AnimatedHeroCard />

            <Divider />

            {/* 3. Próximas Partidas (24h) e Resultados Recentes, lado a lado com uma linha entre eles */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-0 lg:divide-x divide-line/60">
              <div className="lg:pr-5"><Upcoming24h /></div>
              <div className="lg:pl-5"><RecentResultsHome /></div>
            </div>

            {/* 4. Estatísticas do campeonato em destaque (some quando não há torneio) */}
            <div className="home-stats empty:hidden px-1 sm:px-3"><HomeStatsCards /></div>
          </div>

          {/* 5. Notícias e transferências: a coluna estica (linha divisória até o fim) e o
              conteúdo fica fixo ao rolar, como o ranking, só quando tem coluna própria (2xl) */}
          <div className="order-3 xl:col-span-2 2xl:col-span-1 min-w-0 p-5 sm:p-6 border-t border-line/60 2xl:border-t-0 2xl:border-l self-stretch">
            <div className="2xl:sticky 2xl:top-20">
              <NewsPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
