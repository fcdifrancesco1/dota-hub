import React from 'react';
import { Swords, Clock, Sparkles, Ban, TrendingUp } from 'lucide-react';
import { getHomeStats } from '../../services/supabase';

export default function HomeStatsCards() {
  const stats = getHomeStats();

  const cards = [
    {
      title: 'Partidas Jogadas Hoje',
      value: stats.matchesToday,
      subtitle: 'Cenário profissional',
      icon: Swords,
      color: 'from-amber-500/20 to-amber-600/5',
      borderColor: 'border-amber-500/30',
      iconColor: 'text-amber-400'
    },
    {
      title: 'Duração Média',
      value: `${stats.avgDurationMin}m`,
      subtitle: 'Tempo de mapa',
      icon: Clock,
      color: 'from-blue-500/20 to-blue-600/5',
      borderColor: 'border-blue-500/30',
      iconColor: 'text-blue-400'
    },
    {
      title: 'Mais Escolhido',
      value: stats.mostPickedHero.name,
      subtitle: `${stats.mostPickedHero.count} picks (${stats.mostPickedHero.winrate}% win)`,
      icon: Sparkles,
      color: 'from-emerald-500/20 to-emerald-600/5',
      borderColor: 'border-emerald-500/30',
      iconColor: 'text-emerald-400',
      heroImg: stats.mostPickedHero.img
    },
    {
      title: 'Mais Banido',
      value: stats.mostBannedHero.name,
      subtitle: `${stats.mostBannedHero.count} bans na semana`,
      icon: Ban,
      color: 'from-red-500/20 to-red-600/5',
      borderColor: 'border-red-500/30',
      iconColor: 'text-red-400',
      heroImg: stats.mostBannedHero.img
    },
    {
      title: 'Maior Winrate',
      value: stats.highestWinrateHero.name,
      subtitle: `${stats.highestWinrateHero.winrate}% (${stats.highestWinrateHero.matches} jogos)`,
      icon: TrendingUp,
      color: 'from-purple-500/20 to-purple-600/5',
      borderColor: 'border-purple-500/30',
      iconColor: 'text-purple-400',
      heroImg: stats.highestWinrateHero.img
    }
  ];

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
          <span className="w-1.5 h-4 bg-amber-500 rounded-full"></span>
          <span>Estatísticas Gerais do Cenário (Semana / Patch Atual)</span>
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`relative overflow-hidden rounded-xl bg-gradient-to-b ${card.color} bg-[#0E1118] border ${card.borderColor} p-4 transition-all hover:scale-[1.02] shadow-lg`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 truncate">
                  {card.title}
                </span>
                <div className={`p-1.5 rounded-lg bg-black/40 ${card.iconColor}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="flex items-center gap-3">
                {card.heroImg && (
                  <img
                    src={card.heroImg}
                    alt={card.value}
                    className="w-10 h-7 object-cover rounded shadow border border-white/10"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}
                <div>
                  <div className="text-xl font-black text-white font-mono leading-none">
                    {card.value}
                  </div>
                  <div className="text-[10px] text-gray-400 font-medium mt-1 truncate">
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
