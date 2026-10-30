import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, GitCompare } from 'lucide-react';
import { fetchPlayerPeriodStats } from '../services/playerProfile';
import { METRICS, percentile, positionAverage, topLabel, performanceRating, playerRow } from '../utils/proBenchmarks';
import RadarChart from './RadarChart';

const PERIODS = [
  { id: 90, label: '3 meses' },
  { id: 365, label: '1 ano' },
  { id: null, label: 'Carreira' }
];
const TILE_METRICS = ['kills', 'deaths', 'assists', 'gpm', 'xpm', 'lh10', 'dmg_min', 'tower_min'];
const winPct = (s) => Math.round((s.wins / (s.wins + s.losses || 1)) * 100);

/** Nota 0–100 com o rótulo, em círculo (estilo medidor). */
export function RatingBadge({ rating, size = 'lg' }) {
  if (!rating) return null;
  const color = rating.overall >= 58 ? 'text-emerald-500' : rating.overall >= 42 ? 'text-amber-500' : 'text-rose-500';
  const big = size === 'lg';
  return (
    <div className="flex flex-col items-center">
      <div className={`relative ${big ? 'w-28 h-28' : 'w-12 h-12'}`}>
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" className="text-line" strokeWidth="3" />
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" className={color} strokeWidth="3"
            strokeDasharray={`${rating.overall} 100`} strokeLinecap="round" />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center font-mono font-black ${color} ${big ? 'text-3xl' : 'text-sm'}`}>
          {rating.overall}
        </span>
      </div>
      {big && <span className={`mt-1 text-xs font-black uppercase tracking-wider ${color}`}>{rating.label}</span>}
    </div>
  );
}

/** Pílula "Top X%" colorida pelo percentil. */
export function TopBadge({ pct }) {
  if (pct == null) return null;
  const tone = pct >= 75 ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
    : pct >= 40 ? 'bg-surface-2 text-gray-400 border-line'
    : 'bg-rose-500/10 text-rose-500 border-rose-500/30';
  return <span className={`px-1.5 py-px rounded-md border text-[10px] font-black whitespace-nowrap ${tone}`}>{topLabel(pct)}</span>;
}

/**
 * Aba "Desempenho" do perfil: nota contra os profissionais da mesma posição
 * (90 dias, jogos oficiais) e médias por período com Top X% e diferença para a média.
 */
export default function PlayerPerformance({ accountId, position, benchmarks }) {
  const [days, setDays] = useState(90);
  const [official, setOfficial] = useState(true);
  const [stats, setStats] = useState(undefined);

  useEffect(() => {
    let cancelled = false;
    setStats(undefined);
    fetchPlayerPeriodStats(accountId, { days, official }).then((s) => !cancelled && setStats(s));
    return () => { cancelled = true; };
  }, [accountId, days, official]);

  const row = playerRow(benchmarks, accountId, position) || playerRow(benchmarks, accountId);
  const pos = position || row?.position || null;
  const rating = row ? performanceRating(benchmarks, pos, row) : null;

  const toggle = (active) => `px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
    active ? 'bg-amber-500 text-on-accent font-black shadow-sm' : 'text-gray-400 hover:text-white'
  }`;

  return (
    <div className="space-y-6">
      {/* NOTA E RADAR */}
      <section className="glass-panel border border-line rounded-3xl p-6 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-black text-white uppercase tracking-wider">Nota de desempenho</h2>
            <p className="text-xs text-gray-400 mt-1">
              Comparado com os profissionais da mesma posição nos jogos oficiais dos últimos 90 dias (0 a 100).
            </p>
          </div>
          <Link
            to={`/jogadores/comparar?a=${accountId}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-2 border border-line text-xs font-bold text-gray-400 hover:text-white transition-colors"
          >
            <GitCompare className="w-3.5 h-3.5" /> Comparar com outro jogador
          </Link>
        </div>
        {rating ? (
          <div className="grid md:grid-cols-[auto_1fr_1fr] items-center gap-6">
            <RatingBadge rating={rating} />
            <RadarChart
              axes={rating.areas.map((a) => ({ id: a.id, label: a.label }))}
              series={[{ name: 'Nota', values: Object.fromEntries(rating.areas.map((a) => [a.id, a.score])) }]}
            />
            <ul className="space-y-2.5">
              {rating.areas.map((a) => (
                <li key={a.id}>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-gray-400">{a.label}</span>
                    <span className="font-mono text-white">{a.score}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-2 mt-1 overflow-hidden">
                    <div className={`h-full rounded-full ${a.score >= 58 ? 'bg-emerald-500' : a.score >= 42 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${a.score}%` }} />
                  </div>
                </li>
              ))}
              <li className="text-[11px] text-gray-500 pt-1">Base: {row.games} jogos oficiais na Pos {pos}.</li>
            </ul>
          </div>
        ) : (
          <p className="text-xs text-gray-400">
            Sem jogos oficiais suficientes nos últimos 90 dias (mínimo de 8 na mesma posição) para calcular a nota.
          </p>
        )}
      </section>

      {/* MÉDIAS POR PERÍODO */}
      <section className="glass-panel border border-line rounded-3xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <h2 className="text-base font-black text-white uppercase tracking-wider">Médias por jogo</h2>
          <div className="flex flex-wrap gap-2">
            <div className="flex bg-surface-2 p-1 rounded-xl border border-line">
              {PERIODS.map((p) => (
                <button key={p.label} type="button" onClick={() => setDays(p.id)} className={toggle(days === p.id)}>{p.label}</button>
              ))}
            </div>
            <div className="flex bg-surface-2 p-1 rounded-xl border border-line">
              <button type="button" onClick={() => setOfficial(true)} className={toggle(official)}>Oficiais</button>
              <button type="button" onClick={() => setOfficial(false)} className={toggle(!official)}>Todas</button>
            </div>
          </div>
        </div>

        {stats === undefined ? (
          <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-amber-400" /></div>
        ) : !stats?.games ? (
          <p className="text-xs text-gray-400">Nenhuma partida neste período.</p>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-4">
              <strong className="text-white">{stats.games}</strong> partidas ·{' '}
              <strong className={winPct(stats) >= 50 ? 'text-emerald-500' : 'text-rose-500'}>{winPct(stats)}%</strong>{' '}de vitórias{pos ? ` · Top % e diferença contra a média dos profissionais na Pos ${pos}` : ''}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {TILE_METRICS.map((m) => {
                const value = stats[m];
                const meta = METRICS[m];
                const pct = pos ? percentile(benchmarks, pos, m, value) : null;
                const avg = pos ? positionAverage(benchmarks, pos, m) : null;
                const diff = avg != null ? value - avg : null;
                const better = diff != null && (meta.lowerIsBetter ? diff < 0 : diff > 0);
                return (
                  <div key={m} className="rounded-2xl bg-surface-2/60 border border-line p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{meta.label}</span>
                      <TopBadge pct={pct} />
                    </div>
                    <div className="text-xl font-black font-mono text-white mt-1">{meta.fmt(value)}</div>
                    {diff != null && Math.abs(diff) > 0.05 && (
                      <div className={`text-[11px] font-bold mt-0.5 ${better ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {diff > 0 ? '▲' : '▼'} {meta.fmt(Math.abs(diff))} vs média
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
