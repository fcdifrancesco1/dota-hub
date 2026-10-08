import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Swords, Clock, Sparkles, Ban, TrendingUp, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { fetchTournaments, fetchTournamentHeroStats, getHeroImg, getHeroName } from '../../services/api';
import { pickFeaturedTournament, tierLetter, tournamentPath } from '../../utils/tournamentFormat';

const REFRESH_MS = 10 * 60 * 1000;

const fmtDuration = (secs) => (secs ? `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}` : '—');

/**
 * Estatísticas do campeonato S-Tier/A-Tier em andamento (Liquipedia + OpenDota).
 * Sem campeonato grande acontecendo, a seção não aparece.
 */
export default function HomeStatsCards() {
  const { constants } = useApp();
  const [tournament, setTournament] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const featured = pickFeaturedTournament(await fetchTournaments());
      if (cancelled) return;
      setTournament(featured);
      if (!featured) { setStats(null); return; }
      const data = await fetchTournamentHeroStats(featured.leagueId);
      if (!cancelled) setStats(data);
    };
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  // Sem torneio grande em andamento (ou ainda sem nenhum mapa jogado): não mostra nada
  if (!tournament || !stats?.totalMatches) return null;

  const heroes = stats.heroes || [];
  const mostPicked = [...heroes].sort((a, b) => b.picks - a.picks || b.winRate - a.winRate)[0];
  const mostBanned = [...heroes].sort((a, b) => b.bans - a.bans)[0];
  // Mínimo de jogos para o winrate não ser dominado por heróis com 1 ou 2 partidas
  const minPicks = Math.max(3, Math.round(stats.totalMatches * 0.1));
  const bestWinrate = heroes
    .filter((h) => h.picks >= minPicks)
    .sort((a, b) => b.winRate - a.winRate || b.picks - a.picks)[0];

  const heroCard = (h) => (h ? { value: getHeroName(constants, h.hero_id), heroImg: getHeroImg(constants, h.hero_id) } : { value: '—' });

  const cards = [
    {
      title: 'Mapas Jogados',
      value: stats.totalMatches,
      subtitle: stats.matchesToday ? `${stats.matchesToday} hoje` : 'No campeonato',
      icon: Swords,
      color: 'from-amber-500/20 to-amber-600/5',
      borderColor: 'border-amber-500/30',
      iconColor: 'text-amber-400'
    },
    {
      title: 'Duração Média',
      value: fmtDuration(stats.avgDurationSec),
      subtitle: 'Tempo de mapa',
      icon: Clock,
      color: 'from-blue-500/20 to-blue-600/5',
      borderColor: 'border-blue-500/30',
      iconColor: 'text-blue-400'
    },
    {
      title: 'Mais Escolhido',
      ...heroCard(mostPicked),
      subtitle: mostPicked ? `${mostPicked.picks} picks (${Math.round(mostPicked.winRate)}% de vitórias)` : '',
      icon: Sparkles,
      color: 'from-emerald-500/20 to-emerald-600/5',
      borderColor: 'border-emerald-500/30',
      iconColor: 'text-emerald-400'
    },
    {
      title: 'Mais Banido',
      ...heroCard(mostBanned?.bans ? mostBanned : null),
      subtitle: mostBanned?.bans ? `${mostBanned.bans} bans` : '',
      icon: Ban,
      color: 'from-red-500/20 to-red-600/5',
      borderColor: 'border-red-500/30',
      iconColor: 'text-red-400'
    },
    {
      title: 'Maior Winrate',
      ...heroCard(bestWinrate),
      subtitle: bestWinrate
        ? `${Math.round(bestWinrate.winRate)}% (${bestWinrate.picks} jogos)`
        : `Mínimo de ${minPicks} jogos`,
      icon: TrendingUp,
      color: 'from-purple-500/20 to-purple-600/5',
      borderColor: 'border-purple-500/30',
      iconColor: 'text-purple-400'
    }
  ];

  return (
    <div className="mb-10">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-white flex flex-wrap items-center gap-2">
          <span className="w-1.5 h-4 bg-amber-500 rounded-full"></span>
          <span>Estatísticas do {tournament.name}</span>
          {tierLetter(tournament.tier) && (
            <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black">
              {tierLetter(tournament.tier)}
            </span>
          )}
        </h2>
        <Link
          to={tournamentPath(tournament)}
          className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 uppercase tracking-wider"
        >
          <span>Ver campeonato</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className={`relative overflow-hidden rounded-xl bg-gradient-to-b ${card.color} bg-surface border ${card.borderColor} p-3 sm:p-4 transition-all hover:scale-[1.02] shadow-lg`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-400 leading-tight">
                  {card.title}
                </span>
                <div className={`p-1.5 rounded-lg bg-black/40 ${card.iconColor}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
                {card.heroImg && (
                  <img
                    src={card.heroImg}
                    alt={card.value}
                    className="w-10 h-7 shrink-0 object-cover rounded shadow border border-white/10"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}
                <div className="min-w-0">
                  <div className="text-base sm:text-xl font-black text-white leading-tight break-words line-clamp-2">
                    {card.value}
                  </div>
                  <div className="text-[10px] text-gray-400 font-medium mt-1 leading-snug">
                    {card.subtitle}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
