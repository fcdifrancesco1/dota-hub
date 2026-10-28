import React, { useState } from 'react';
import { Hourglass } from 'lucide-react';
import TeamLogo from '../utils/teamLogos';
import { useOpenSeries } from '../utils/matchRoute';
import { useOpenWikiSeries } from '../utils/wikiSeries';
import MatchPreviewModal from './MatchPreviewModal';

/**
 * Série em andamento no intervalo entre mapas (sem mapa ao vivo agora): fica na
 * seção "ao vivo" com o placar da série até ela terminar.
 * `large` é o card grande da Central Ao Vivo; sem ele, o card da faixa da home.
 */
export default function BetweenMapsCard({ item, large = false }) {
  const openSeries = useOpenSeries();
  const openWikiSeries = useOpenWikiSeries();
  const [preview, setPreview] = useState(null);

  const nextMap = item.scoreA + item.scoreB + 1;
  const onClick = item.series ? () => openSeries(item.series) : () => openWikiSeries(item.wikiMatch, setPreview);
  const formato = String(item.formato || 'BO3').toUpperCase().replace('BO', 'MD');

  const team = (name, id, logo, right) => (
    <div className={`flex items-center gap-2 flex-1 min-w-0 ${right ? 'justify-end' : ''} ${large ? 'flex-col basis-0 text-center' : ''}`}>
      {!right || large ? (
        <TeamLogo teamName={name} teamId={id} logoUrl={logo} className={large ? 'w-14 h-14 rounded-2xl bg-surface-2 border border-line p-1.5 shadow-sm' : 'w-6 h-6 rounded shrink-0 shadow-sm'} />
      ) : null}
      <span className={`text-xs font-bold text-white leading-tight break-words line-clamp-2 ${right && !large ? 'text-right' : ''}`}>{name}</span>
      {right && !large ? (
        <TeamLogo teamName={name} teamId={id} logoUrl={logo} className="w-6 h-6 rounded shrink-0 shadow-sm" />
      ) : null}
    </div>
  );

  return (
    <>
      <div
        onClick={onClick}
        className={large
          ? 'glass-panel rounded-3xl p-6 sm:p-7 shadow-xl border border-dashed border-red-500/40 hover:border-amber-500/50 transition-all cursor-pointer flex flex-col justify-between'
          : 'flex-shrink-0 cursor-pointer bg-surface/80 hover:bg-surface ring-1 ring-red-500/15 rounded-2xl p-3 min-w-[280px] sm:min-w-[320px] transition-all home-float'}
      >
        <div className={`flex items-center justify-between text-[11px] text-gray-400 border-b border-line ${large ? 'pb-3 mb-4 text-xs' : 'mb-2 pb-1.5'}`}>
          <span className="font-semibold truncate max-w-[200px] text-amber-500">{item.tourneyName || 'Torneio Oficial'}</span>
          <span className="flex items-center gap-1 font-bold text-red-500 bg-surface-2 border border-line px-2 py-0.5 rounded whitespace-nowrap">
            <Hourglass className="w-3 h-3" /> Entre mapas
          </span>
        </div>

        <div className={`flex items-center justify-between gap-3 ${large ? 'py-2' : ''}`}>
          {team(item.timeA, item.idA, item.logoA, false)}
          <div className="flex flex-col items-center shrink-0">
            <div className={`flex items-center gap-1.5 font-mono font-black rounded-lg bg-surface-2 border border-line shadow-inner ${large ? 'text-2xl sm:text-3xl px-4 py-1.5 gap-3 rounded-2xl' : 'text-sm px-2.5 py-0.5'}`}>
              <span className="text-white">{item.scoreA}</span>
              <span className="text-gray-400">-</span>
              <span className="text-white">{item.scoreB}</span>
            </div>
            <span className="text-[10px] text-gray-400 font-bold mt-1">{formato}</span>
          </div>
          {team(item.timeB, item.idB, item.logoB, true)}
        </div>

        <div className={`flex items-center justify-between gap-3 text-[10px] text-gray-400 border-t border-line ${large ? 'mt-4 pt-3 text-xs' : 'mt-2.5 pt-1.5'}`}>
          <span className="font-medium">Aguardando o mapa {nextMap}</span>
          <span className="text-amber-500 font-bold hover:underline whitespace-nowrap">Ver série →</span>
        </div>
      </div>

      {preview && <MatchPreviewModal match={preview} onClose={() => setPreview(null)} />}
    </>
  );
}
