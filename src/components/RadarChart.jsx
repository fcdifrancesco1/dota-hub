import React from 'react';

const COLORS = ['#d97706', '#2563eb'];

/**
 * Radar (teia) em SVG com notas de 0 a 100. `axes`: [{ id, label }];
 * `series`: [{ name, values: { [axisId]: 0..100 } }] — até duas séries.
 */
export default function RadarChart({ axes, series, size = 260 }) {
  if (!axes?.length || axes.length < 3) return null;
  const c = size / 2;
  const r = c - 46;
  const point = (i, v) => {
    const a = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
    return [c + Math.cos(a) * r * (v / 100), c + Math.sin(a) * r * (v / 100)];
  };
  const ring = (v) => axes.map((_, i) => point(i, v).join(',')).join(' ');

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[300px] mx-auto" role="img"
      aria-label={series.map((s) => `${s.name}: ${axes.map((a) => `${a.label} ${s.values[a.id] ?? '—'}`).join(', ')}`).join('; ')}>
      {[25, 50, 75, 100].map((v) => (
        <polygon key={v} points={ring(v)} fill="none" stroke="currentColor" className="text-line" strokeWidth="1" />
      ))}
      {axes.map((a, i) => {
        const [x, y] = point(i, 100);
        const [lx, ly] = point(i, 122);
        return (
          <g key={a.id}>
            <line x1={c} y1={c} x2={x} y2={y} stroke="currentColor" className="text-line" strokeWidth="1" />
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" className="fill-gray-400 text-[10px] font-bold">
              {a.label}
            </text>
          </g>
        );
      })}
      {series.map((s, si) => (
        <polygon
          key={s.name}
          points={axes.map((a, i) => point(i, s.values[a.id] ?? 0).join(',')).join(' ')}
          fill={COLORS[si]}
          fillOpacity="0.18"
          stroke={COLORS[si]}
          strokeWidth="2"
        />
      ))}
    </svg>
  );
}

export const RADAR_COLORS = COLORS;
