import React, { useState, useEffect } from 'react';
import { Trophy, Radio, ArrowRight, Clock, Flame, Calendar, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { useOpenLiveMatch } from '../../utils/liveMatchRoute';
import { SITE_CONFIG } from '../../config/siteConfig';
import TeamLogo from '../../utils/teamLogos';
import { liquipediaImage } from '../../utils/liquipediaImage';
import { fetchTournaments } from '../../services/api';
import { pickFeaturedTournament, pickHeadlineMatch, tierLetter, formatPrize, tournamentPath } from '../../utils/tournamentFormat';

export default function HomeHero() {
  const { upcomingMatches, liveGames } = useApp();
  const openLiveMatch = useOpenLiveMatch();
  const { theme } = useTheme();

  // Campeonatos da Liquipedia (tier, premiação) — cache de 30 min
  const [tournaments, setTournaments] = useState([]);
  useEffect(() => {
    let active = true;
    fetchTournaments().then((list) => { if (active) setTournaments(list || []); });
    return () => { active = false; };
  }, []);

  // Próxima partida do campeonato de maior tier (S, depois A, B...); dentro do
  // tier, a mais próxima — ver pickHeadlineMatch
  const headline = pickHeadlineMatch(upcomingMatches, tournaments);
  const nextMatch = headline?.match || null;

  // Torneio em destaque: o S/A-Tier em andamento; senão, o da partida em destaque
  const featuredTournament = pickFeaturedTournament(tournaments) || headline?.tournament || null;
  const featuredPrize = featuredTournament ? formatPrize(featuredTournament) : null;
  const featuredTier = featuredTournament ? tierLetter(featuredTournament.tier) : null;
  // Logo oficial do campeonato (versão do tema atual); se não houver ou não carregar, fica o nome em texto
  const featuredLogo = featuredTournament?.image?.[theme] || featuredTournament?.icon?.[theme] || null;
  const [logoFailed, setLogoFailed] = useState(false);
  useEffect(() => { setLogoFailed(false); }, [featuredLogo]);
  // Campeonato da partida em destaque (ou o torneio em destaque); sem nenhum, a lista de campeonatos
  const linkedTournament = headline?.tournament || featuredTournament;

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
    <div className="relative overflow-hidden rounded-3xl glass-panel p-6 sm:p-10 mb-8 shadow-2xl transition-all">
      {/* Aurora Ambient Glows */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-600/15 dark:bg-blue-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 -mb-20 w-80 h-80 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-0 -ml-20 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Lado Esquerdo: Informações do Torneio em Destaque */}
        <div className="lg:col-span-7 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-400 text-xs font-bold uppercase tracking-wider shadow-sm">
            <Trophy className="w-3.5 h-3.5" />
            <span>{featuredTournament ? `Torneio em Destaque${featuredTier ? ` • ${featuredTier}` : ''}` : 'Dota 2 Competitivo'}</span>
          </div>

          {featuredLogo && !logoFailed ? (
            <h1>
              <img
                src={liquipediaImage(featuredLogo)}
                alt={featuredTournament.name}
                title={featuredTournament.name}
                referrerPolicy="no-referrer"
                className="h-20 sm:h-24 lg:h-28 w-auto max-w-full object-contain object-left drop-shadow-md"
                onError={() => setLogoFailed(true)}
              />
            </h1>
          ) : (
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white uppercase tracking-tight font-serif leading-tight">
              {featuredTournament ? featuredTournament.name : 'Cenário profissional de Dota 2'}
            </h1>
          )}

          <p className="text-gray-300 text-sm sm:text-base max-w-xl leading-relaxed">
            {featuredTournament ? (
              <>
                Acompanhe em tempo real as potências mundiais de Dota 2 disputando o título
                {featuredPrize ? (
                  <> e a premiação de <span className="text-amber-500 font-bold">{featuredPrize}</span>.</>
                ) : '.'}
              </>
            ) : (
              'Partidas ao vivo, resultados, agenda e estatísticas dos principais campeonatos.'
            )}
          </p>

          {/* CTAs */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            {hasLive ? (
              <button
                onClick={() => openLiveMatch(liveGames[0])}
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-on-accent font-black uppercase tracking-wider text-xs shadow-lg shadow-red-900/30 hover:scale-105 transition-all"
              >
                <Radio className="w-4 h-4 animate-pulse text-on-accent" />
                <span>Assistir Ao Vivo Agora</span>
              </button>
            ) : (
              <Link
                to="/ao-vivo"
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-on-accent font-black uppercase tracking-wider text-xs shadow-lg shadow-blue-600/30 hover:scale-105 transition-all"
              >
                <Radio className="w-4 h-4 text-on-accent" />
                <span>Central Ao Vivo</span>
              </Link>
            )}

            <Link
              to={linkedTournament ? tournamentPath(linkedTournament) : '/campeonatos'}
              title={linkedTournament ? linkedTournament.name : undefined}
              className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-surface-2 hover:bg-surface-3 border border-line hover:border-amber-500/40 text-white font-bold uppercase tracking-wider text-xs transition-all shadow-sm"
            >
              <span>{linkedTournament ? 'Ver Campeonato' : 'Ver Campeonatos'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Lado Direito: Próximo Confronto com Contagem Regressiva */}
        <div className="lg:col-span-5 min-w-0 tilt-card bg-surface rounded-2xl p-5 sm:p-6 shadow-xl border border-line">
          <div className="flex items-center justify-between pb-3 border-b border-line text-xs">
            <span className="text-gray-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Próxima Grande Partida</span>
            </span>
            {nextMatch && (
              <span className="text-amber-500 font-mono font-bold text-[11px] bg-surface-2 px-2 py-0.5 rounded border border-line">
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
          <div className="pt-3 flex items-center justify-center gap-2 text-[11px] font-semibold text-amber-500">
            <span className="truncate">{nextMatch.tourneyName}</span>
            {tierLetter(headline?.tournament?.tier) && (
              <span className="shrink-0 px-1.5 py-0.5 rounded bg-surface-2 border border-line text-[9px] font-black uppercase">
                {tierLetter(headline.tournament.tier)}
              </span>
            )}
          </div>

          {/* Confronto */}
          <div className="py-5 flex items-center justify-between gap-2 sm:gap-4">
            {/* Time 1 */}
            <div className="flex flex-col items-center flex-1 basis-0 min-w-0 text-center">
              <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-line p-2 flex items-center justify-center mb-2 shadow-sm">
                <TeamLogo teamName={nextMatch.timeA} logoUrl={nextMatch.logoA} className="w-10 h-10" />
              </div>
              <span className="w-full text-sm font-black text-white leading-tight break-words line-clamp-2">
                {nextMatch.timeA}
              </span>
            </div>

            {/* VS */}
            <div className="flex flex-col items-center shrink-0">
              <span className="text-xs font-black text-amber-500 uppercase tracking-widest bg-surface-2 px-3 py-1 rounded-full border border-line shadow-sm">
                VS
              </span>
            </div>

            {/* Time 2 */}
            <div className="flex flex-col items-center flex-1 basis-0 min-w-0 text-center">
              <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-line p-2 flex items-center justify-center mb-2 shadow-sm">
                <TeamLogo teamName={nextMatch.timeB} logoUrl={nextMatch.logoB} className="w-10 h-10" />
              </div>
              <span className="w-full text-sm font-black text-white leading-tight break-words line-clamp-2">
                {nextMatch.timeB}
              </span>
            </div>
          </div>

          {/* Relógio / Contagem Regressiva */}
          <div className="pt-3 border-t border-line">
            {!timeLeft ? (
              <div className="text-[11px] text-gray-400 text-center font-semibold py-2">Horário a definir</div>
            ) : (timeLeft.hours + timeLeft.minutes + timeLeft.seconds) === 0 ? (
              <div className="text-[11px] text-red-500 text-center font-black uppercase tracking-wider py-2">Em andamento / começando</div>
            ) : (
            <>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider text-center mb-2 font-semibold">
              Inicia em ({nextMatch.startTime}):
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-surface-2 border border-line rounded-xl py-2 shadow-sm">
                <span className="block font-mono text-xl font-black text-white">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Horas</span>
              </div>
              <div className="bg-surface-2 border border-line rounded-xl py-2 shadow-sm">
                <span className="block font-mono text-xl font-black text-amber-500">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Minutos</span>
              </div>
              <div className="bg-surface-2 border border-line rounded-xl py-2 shadow-sm">
                <span className="block font-mono text-xl font-black text-red-500">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Segundos</span>
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
