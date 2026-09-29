import React, { useState, useEffect } from 'react';
import { Trophy, Radio, ArrowRight, Clock, Flame, Calendar, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useOpenLiveMatch } from '../../utils/liveMatchRoute';
import { SITE_CONFIG } from '../../config/siteConfig';
import TeamLogo from '../../utils/teamLogos';

export default function HomeHero() {
  const { tournamentsList, upcomingMatches, liveGames } = useApp();
  const openLiveMatch = useOpenLiveMatch();

  // Encontra o torneio em andamento de maior relevância
  const featuredTournament = tournamentsList && tournamentsList.length > 0
    ? tournamentsList[0]
    : {
        name: 'ESL One Bangkok 2026',
        tier: 'tier_1',
        prize_pool: '$1,000,000',
        stage: 'Playoffs - Grande Final',
        logo_url: 'https://eslgaming.com/wp-content/uploads/2021/04/esl-logo-small.png'
      };

  // Próxima partida que ainda não começou (a lista já vem ordenada por horário)
  const nowMs = Date.now();
  const nextMatch = (upcomingMatches || []).find((m) => m.timestamp && m.timestamp * 1000 > nowMs)
    || (upcomingMatches || [])[0]
    || null;

  // Contagem regressiva dinâmica para a próxima partida
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!nextMatch || !nextMatch.timestamp) {
      setTimeLeft(null);
      return;
    }

    function calculateTime() {
      const targetTime = nextMatch.timestamp * 1000;
      const difference = targetTime - Date.now();

      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    }

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [nextMatch]);

  const hasLive = liveGames && liveGames.length > 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-[#121622] via-[#0E1119] to-[#181116] p-6 sm:p-10 mb-8 shadow-2xl">
      {/* Detalhes de iluminação de fundo */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Lado Esquerdo: Informações do Torneio em Destaque */}
        <div className="lg:col-span-7 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5" />
            <span>Torneio em Destaque • Tier 1</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white uppercase tracking-tight font-serif leading-tight">
            {featuredTournament.name}
          </h1>

          <p className="text-gray-300 text-sm sm:text-base max-w-xl leading-relaxed">
            Acompanhe em tempo real as potências mundiais de Dota 2 disputando a glória, pontos do ranking internacional e a premiação de{' '}
            <span className="text-amber-400 font-bold">{featuredTournament.prize_pool || '$1,000,000'}</span>.
          </p>

          {/* CTAs */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            {hasLive ? (
              <button
                onClick={() => openLiveMatch(liveGames[0])}
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black uppercase tracking-wider text-xs shadow-lg shadow-red-900/50 hover:scale-105 transition-all"
              >
                <Radio className="w-4 h-4 animate-pulse text-white" />
                <span>Assistir Ao Vivo Agora</span>
              </button>
            ) : (
              <Link
                to="/ao-vivo"
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black uppercase tracking-wider text-xs shadow-lg shadow-amber-500/20 hover:scale-105 transition-all"
              >
                <Radio className="w-4 h-4 text-black" />
                <span>Central Ao Vivo</span>
              </Link>
            )}

            <Link
              to="/campeonatos"
              className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-[#1A1F2C] hover:bg-[#222838] border border-white/10 hover:border-amber-500/40 text-gray-200 hover:text-white font-bold uppercase tracking-wider text-xs transition-all"
            >
              <span>Ver Campeonatos</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Lado Direito: Próximo Confronto com Contagem Regressiva */}
        <div className="lg:col-span-5 bg-[#0C0E14]/90 border border-[#262F44] rounded-2xl p-6 backdrop-blur-md shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs">
            <span className="text-gray-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Próxima Grande Partida</span>
            </span>
            {nextMatch && (
              <span className="text-amber-400 font-mono font-bold text-[11px] bg-amber-500/10 px-2 py-0.5 rounded">
                {nextMatch.formato || 'BO3'}
              </span>
            )}
          </div>

          {!nextMatch ? (
            <div className="py-10 text-center text-xs text-gray-400">
              Nenhuma partida profissional agendada no momento.
            </div>
          ) : (
          <>
          <div className="pt-3 text-center text-[11px] font-semibold text-amber-400/80 truncate">
            {nextMatch.tourneyName}
          </div>

          {/* Confronto */}
          <div className="py-5 flex items-center justify-between gap-4">
            {/* Time 1 */}
            <div className="flex flex-col items-center flex-1 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 p-2 flex items-center justify-center mb-2 shadow-inner">
                <TeamLogo teamName={nextMatch.timeA} logoUrl={nextMatch.logoA} className="w-10 h-10" />
              </div>
              <span className="text-sm font-black text-white truncate max-w-[120px]">
                {nextMatch.timeA}
              </span>
            </div>

            {/* VS */}
            <div className="flex flex-col items-center">
              <span className="text-xs font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                VS
              </span>
            </div>

            {/* Time 2 */}
            <div className="flex flex-col items-center flex-1 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 p-2 flex items-center justify-center mb-2 shadow-inner">
                <TeamLogo teamName={nextMatch.timeB} logoUrl={nextMatch.logoB} className="w-10 h-10" />
              </div>
              <span className="text-sm font-black text-white truncate max-w-[120px]">
                {nextMatch.timeB}
              </span>
            </div>
          </div>

          {/* Relógio / Contagem Regressiva */}
          <div className="pt-3 border-t border-white/10">
            {!timeLeft ? (
              <div className="text-[11px] text-gray-400 text-center font-semibold py-2">Horário a definir</div>
            ) : (timeLeft.hours + timeLeft.minutes + timeLeft.seconds) === 0 ? (
              <div className="text-[11px] text-red-400 text-center font-black uppercase tracking-wider py-2">Em andamento / começando</div>
            ) : (
            <>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider text-center mb-2 font-semibold">
              Inicia em ({nextMatch.startTime}):
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#121622] border border-[#212838] rounded-xl py-2">
                <span className="block font-mono text-xl font-black text-white">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">Horas</span>
              </div>
              <div className="bg-[#121622] border border-[#212838] rounded-xl py-2">
                <span className="block font-mono text-xl font-black text-amber-400">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">Minutos</span>
              </div>
              <div className="bg-[#121622] border border-[#212838] rounded-xl py-2">
                <span className="block font-mono text-xl font-black text-red-400">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">Segundos</span>
              </div>
            </div>
            </>
            )}
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
