import React from 'react';
import { Sun, Moon } from 'lucide-react';

const fmtClock = (secs) => {
  const s = Math.max(0, Math.floor(secs || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

// Mapas vencidos na série: os traços amarelos inclinados nos cantos de cima do relógio, como no jogo
function SeriesTicks({ wins, total, side }) {
  return (
    <span className={`absolute top-1 flex gap-0.5 ${side === 'left' ? 'left-2 flex-row-reverse' : 'right-2'}`} aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`h-3.5 w-1.5 ${side === 'left' ? '-skew-x-[18deg]' : 'skew-x-[18deg]'} ${i < (wins || 0) ? 'bg-amber-300 shadow-[0_0_6px_rgba(252,211,77,0.6)]' : 'bg-white/10'}`} />
      ))}
    </span>
  );
}

/**
 * Placar como o HUD do jogo: abates em branco dos lados da placa do relógio (dia/noite),
 * série nos cantos da placa e "▲ 1.2k" de ouro embaixo do lado que está na frente.
 * winsNeeded: 1 (MD1, sem traços), 2 (MD3) ou 3 (MD5). large: cabeçalho da página da partida.
 */
export default function HudScore({ radKills, direKills, duration, radWins, direWins, winsNeeded = 2, goldLead = 0, large = false }) {
  // Ciclo do jogo: 5 min de dia, 5 de noite, começando de dia
  const night = duration > 0 && Math.floor(duration / 300) % 2 === 1;
  const kills = `font-sans font-bold leading-none text-white tabular-nums [text-shadow:0_2px_6px_rgba(0,0,0,0.6)] ${large ? 'text-3xl sm:text-7xl' : 'text-4xl lg:text-5xl'}`;
  const goldChip = goldLead !== 0 && (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/50 font-semibold text-amber-300 tabular-nums ${large ? 'text-xs' : 'text-[11px]'}`}>
      <span className="text-emerald-400 text-[9px]" aria-hidden="true">▲</span>
      {(Math.abs(goldLead) / 1000).toFixed(1)}k
      <span className="sr-only"> de ouro a mais</span>
    </span>
  );

  return (
    <div className={`grid grid-cols-[1fr_auto_1fr] items-center gap-y-1 ${large ? 'gap-x-1.5 sm:gap-x-6' : 'gap-x-3 lg:gap-x-4'}`}>
      <span className={`text-right ${kills}`}>{radKills}</span>
      <div className="relative">
        <div
          className={`${large ? 'w-20 sm:w-36 pt-2.5 sm:pt-3 pb-3 sm:pb-3.5' : 'w-24 lg:w-28 pt-2.5 pb-3'} flex flex-col items-center gap-0.5 bg-gradient-to-b from-slate-700/80 to-slate-950 border-t border-white/10`}
          style={{ clipPath: 'polygon(0 0, 100% 0, 88% 100%, 12% 100%)' }}
        >
          {night ? <Moon className="w-4 h-4 text-sky-200" aria-label="Noite" /> : <Sun className="w-4 h-4 text-amber-200" aria-label="Dia" />}
          <time className={`font-sans font-bold text-white tabular-nums ${large ? 'text-sm sm:text-lg' : 'text-sm'}`}>{fmtClock(duration)}</time>
        </div>
        {winsNeeded > 1 && <>
          <SeriesTicks wins={radWins} total={winsNeeded} side="left" />
          <SeriesTicks wins={direWins} total={winsNeeded} side="right" />
          <span className="sr-only">Série {radWins || 0} a {direWins || 0}</span>
        </>}
      </div>
      <span className={`text-left ${kills}`}>{direKills}</span>
      <span className="flex justify-end min-h-[20px]">{goldLead > 0 && goldChip}</span>
      <span />
      <span className="flex justify-start min-h-[20px]">{goldLead < 0 && goldChip}</span>
    </div>
  );
}
