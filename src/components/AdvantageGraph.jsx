import React, { useState } from 'react';
import { Coins, Zap } from 'lucide-react';

export default function AdvantageGraph({ goldAdv = [], xpAdv = [], radiantName = "Radiant", direName = "Dire" }) {
  const [activeType, setActiveType] = useState('gold'); // 'gold' | 'xp'
  const [hoverIndex, setHoverIndex] = useState(null);

  const data = activeType === 'gold' ? goldAdv : xpAdv;

  if (!data || data.length < 2) {
    return (
      <div className="p-4 bg-dota-card/40 border border-dota-border/50 rounded-xl text-center text-xs text-dota-dim">
        Dados de vantagem ao longo do tempo não disponíveis para este replay.
      </div>
    );
  }

  const width = 800;
  const height = 180;
  const paddingX = 40;
  const paddingY = 24;

  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingY * 2;

  // Encontrar valores máximos e mínimos para escala simétrica ou balanceada
  const maxVal = Math.max(...data, 1000);
  const minVal = Math.min(...data, -1000);
  const absMax = Math.max(Math.abs(maxVal), Math.abs(minVal));

  const getY = (val) => {
    // 0 fica exatamente no meio vertical
    const normalized = val / (absMax || 1);
    return paddingY + innerHeight / 2 - (normalized * (innerHeight / 2));
  };

  const getX = (idx) => {
    return paddingX + (idx / (data.length - 1)) * innerWidth;
  };

  const zeroY = getY(0);

  // Construir caminho SVG da linha
  const points = data.map((val, idx) => `${getX(idx)},${getY(val)}`).join(' ');

  // Áreas preenchidas separadas (Radiant e Dire)
  const pathData = data.map((val, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(val)}`).join(' ');
  const areaPath = `${pathData} L ${getX(data.length - 1)} ${zeroY} L ${getX(0)} ${zeroY} Z`;

  const hoveredMinute = hoverIndex !== null ? hoverIndex : null;
  const hoveredValue = hoveredMinute !== null ? data[hoveredMinute] : null;

  return (
    <div className="bg-dota-card/70 border border-dota-border/70 rounded-xl p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dota-border/40 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-white">Vantagem da Partida</span>
          <span className="text-[11px] text-dota-dim">
            {hoveredMinute !== null ? (
              <span>
                Minuto <strong className="text-white">{hoveredMinute}m</strong>: {' '}
                <strong style={{ color: hoveredValue >= 0 ? 'var(--accent-radiant, #00E676)' : 'var(--accent-dire, #FF4655)' }}>
                  {hoveredValue >= 0 ? `${radiantName} +${Math.abs(hoveredValue).toLocaleString()}` : `${direName} +${Math.abs(hoveredValue).toLocaleString()}`}
                </strong>
              </span>
            ) : (
              <span>Passe o mouse no gráfico para ver minuto a minuto</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-dota-bg/80 p-1 rounded-lg border border-dota-border/50">
          <button
            onClick={() => setActiveType('gold')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition-all ${
              activeType === 'gold'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm'
                : 'text-dota-dim hover:text-white'
            }`}
          >
            <Coins className="w-3.5 h-3.5" /> Ouro
          </button>
          <button
            onClick={() => setActiveType('xp')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition-all ${
              activeType === 'xp'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                : 'text-dota-dim hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" /> XP
          </button>
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
          onMouseLeave={() => setHoverIndex(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = ((e.clientX - rect.left) / rect.width) * width;
            const clampedX = Math.max(paddingX, Math.min(width - paddingX, mouseX));
            const progress = (clampedX - paddingX) / innerWidth;
            const index = Math.round(progress * (data.length - 1));
            setHoverIndex(Math.max(0, Math.min(data.length - 1, index)));
          }}
        >
          <defs>
            <linearGradient id="gradientRadiant" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00E676" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#00E676" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="gradientDire" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#FF4655" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#FF4655" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Linha Zero (Equilíbrio) */}
          <line
            x1={paddingX}
            y1={zeroY}
            x2={width - paddingX}
            y2={zeroY}
            stroke="rgba(255, 255, 255, 0.2)"
            strokeDasharray="4 4"
            strokeWidth="1"
          />

          {/* Rótulos Radiant / Dire */}
          <text x={paddingX} y={paddingY + 8} fill="#00E676" fontSize="10" fontWeight="700" opacity="0.85">
            ▲ {radiantName} (+{(absMax).toLocaleString()})
          </text>
          <text x={paddingX} y={height - 8} fill="#FF4655" fontSize="10" fontWeight="700" opacity="0.85">
            ▼ {direName} (+{(absMax).toLocaleString()})
          </text>

          {/* Eixo de Tempo (Minutos) */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const minIndex = Math.round(pct * (data.length - 1));
            const x = getX(minIndex);
            return (
              <g key={idx}>
                <line x1={x} y1={paddingY} x2={x} y2={height - paddingY} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <text x={x} y={height - 6} fill="rgba(255,255,255,0.4)" fontSize="9" textAnchor="middle" fontFamily="monospace">
                  {minIndex}m
                </text>
              </g>
            );
          })}

          {/* Área Preenchida com Gradiente */}
          <path d={areaPath} fill={activeType === 'gold' ? 'url(#gradientRadiant)' : 'url(#gradientRadiant)'} />

          {/* Linha Principal da Vantagem */}
          <polyline
            fill="none"
            stroke={activeType === 'gold' ? '#E5A93C' : '#00E5FF'}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />

          {/* Cursor e ponto em foco */}
          {hoveredMinute !== null && (
            <g>
              <line
                x1={getX(hoveredMinute)}
                y1={paddingY}
                x2={getX(hoveredMinute)}
                y2={height - paddingY}
                stroke="#fff"
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.8"
              />
              <circle
                cx={getX(hoveredMinute)}
                cy={getY(hoveredValue)}
                r="5"
                fill={hoveredValue >= 0 ? '#00E676' : '#FF4655'}
                stroke="#fff"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
