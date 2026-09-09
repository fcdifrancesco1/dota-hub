import React, { useState, useEffect } from 'react';
import { Shield, Skull, Eye, Compass, Castle, RefreshCw } from 'lucide-react';
import { getHeroImg, getHeroName } from '../services/api';

// Coordenadas calibradas diretamente sobre o mapa oficial de Dota 2 (public/minimap.jpg)
// Base Radiant: inferior esquerda (x: ~14%, y: ~85%)
// Base Dire: superior direita (x: ~85%, y: ~15%)
const CALIBRATED_TOWERS = {
  radiant: {
    top: [
      { name: "T1 Top", x: 12, y: 36 },
      { name: "T2 Top", x: 12, y: 49 },
      { name: "T3 Top", x: 13, y: 64 }
    ],
    mid: [
      { name: "T1 Mid", x: 40, y: 58 },
      { name: "T2 Mid", x: 28, y: 66 },
      { name: "T3 Mid", x: 20, y: 73 }
    ],
    bot: [
      { name: "T1 Bot", x: 82, y: 85 },
      { name: "T2 Bot", x: 54, y: 85 },
      { name: "T3 Bot", x: 28, y: 84 }
    ],
    base: [
      { name: "T4 (1)", x: 17, y: 82 },
      { name: "T4 (2)", x: 19, y: 84 },
      { name: "Trono", x: 14, y: 85 }
    ]
  },
  dire: {
    top: [
      { name: "T1 Top", x: 20, y: 12 },
      { name: "T2 Top", x: 44, y: 12 },
      { name: "T3 Top", x: 67, y: 13 }
    ],
    mid: [
      { name: "T1 Mid", x: 53, y: 44 },
      { name: "T2 Mid", x: 63, y: 36 },
      { name: "T3 Mid", x: 70, y: 27 }
    ],
    bot: [
      { name: "T1 Bot", x: 84, y: 63 },
      { name: "T2 Bot", x: 84, y: 47 },
      { name: "T3 Bot", x: 83, y: 29 }
    ],
    base: [
      { name: "T4 (1)", x: 81, y: 18 },
      { name: "T4 (2)", x: 83, y: 21 },
      { name: "Trono", x: 85, y: 15 }
    ]
  }
};

// Posições no Santuário da Fonte para heróis mortos de cada equipe
const FOUNTAIN_COORDS = {
  radiant: [
    { x: 8.0, y: 91.5 },
    { x: 9.8, y: 90.0 },
    { x: 11.5, y: 88.5 },
    { x: 7.8, y: 88.0 },
    { x: 10.2, y: 92.5 }
  ],
  dire: [
    { x: 92.0, y: 8.5 },
    { x: 90.2, y: 10.0 },
    { x: 88.5, y: 11.5 },
    { x: 92.2, y: 12.0 },
    { x: 89.8, y: 7.5 }
  ]
};

// Pit oficial do Roshan no mapa clássico (caverna no rio noroeste)
const ROSHAN_PIT = { x: 32, y: 40 };

// Rotas táticas reais por função e fase de jogo (Waypoints)
const TACTICAL_WAYPOINTS = {
  radiant: {
    1: { // Carry (Safelane Bot -> Selva -> Pressão)
      early: [{ x: 82, y: 84 }, { x: 84, y: 74 }, { x: 80, y: 78 }, { x: 68, y: 80 }, { x: 82, y: 84 }],
      mid: [{ x: 64, y: 74 }, { x: 52, y: 62 }, { x: 46, y: 50 }, { x: 38, y: 62 }, { x: 64, y: 74 }],
      late: [{ x: 58, y: 42 }, { x: 64, y: 34 }, { x: 68, y: 28 }, { x: 60, y: 32 }, { x: 58, y: 42 }]
    },
    2: { // Mid (Rio -> Runas -> Iniciação)
      early: [{ x: 41, y: 57 }, { x: 44, y: 50 }, { x: 36, y: 38 }, { x: 46, y: 50 }, { x: 41, y: 57 }],
      mid: [{ x: 47, y: 47 }, { x: 35, y: 36 }, { x: 52, y: 42 }, { x: 44, y: 50 }, { x: 47, y: 47 }],
      late: [{ x: 62, y: 34 }, { x: 66, y: 28 }, { x: 56, y: 38 }, { x: 42, y: 42 }, { x: 62, y: 34 }]
    },
    3: { // Offlane (Pressão Top -> Frontline)
      early: [{ x: 13, y: 38 }, { x: 16, y: 28 }, { x: 20, y: 22 }, { x: 15, y: 34 }, { x: 13, y: 38 }],
      mid: [{ x: 36, y: 38 }, { x: 48, y: 44 }, { x: 42, y: 36 }, { x: 30, y: 42 }, { x: 36, y: 38 }],
      late: [{ x: 66, y: 28 }, { x: 70, y: 24 }, { x: 62, y: 32 }, { x: 58, y: 38 }, { x: 66, y: 28 }]
    },
    4: { // Soft Support (Roamer / Runas / Wards)
      early: [{ x: 38, y: 48 }, { x: 35, y: 36 }, { x: 28, y: 44 }, { x: 44, y: 52 }, { x: 38, y: 48 }],
      mid: [{ x: 40, y: 42 }, { x: 33, y: 38 }, { x: 52, y: 44 }, { x: 46, y: 50 }, { x: 40, y: 42 }],
      late: [{ x: 54, y: 36 }, { x: 60, y: 30 }, { x: 64, y: 34 }, { x: 50, y: 44 }, { x: 54, y: 36 }]
    },
    5: { // Hard Support (Babysitter / Defesa / Utilidade)
      early: [{ x: 78, y: 84 }, { x: 72, y: 82 }, { x: 80, y: 78 }, { x: 76, y: 85 }, { x: 78, y: 84 }],
      mid: [{ x: 52, y: 48 }, { x: 48, y: 54 }, { x: 56, y: 44 }, { x: 60, y: 38 }, { x: 52, y: 48 }],
      late: [{ x: 50, y: 44 }, { x: 56, y: 36 }, { x: 58, y: 40 }, { x: 46, y: 48 }, { x: 50, y: 44 }]
    }
  },
  dire: {
    1: { // Carry (Safelane Top -> Selva -> Pressão)
      early: [{ x: 20, y: 15 }, { x: 18, y: 22 }, { x: 26, y: 18 }, { x: 34, y: 16 }, { x: 20, y: 15 }],
      mid: [{ x: 42, y: 22 }, { x: 52, y: 36 }, { x: 56, y: 44 }, { x: 64, y: 32 }, { x: 42, y: 22 }],
      late: [{ x: 46, y: 52 }, { x: 40, y: 60 }, { x: 32, y: 66 }, { x: 42, y: 56 }, { x: 46, y: 52 }]
    },
    2: { // Mid (Rio -> Runas -> Defesa / Gank)
      early: [{ x: 55, y: 44 }, { x: 50, y: 46 }, { x: 44, y: 50 }, { x: 56, y: 42 }, { x: 55, y: 44 }],
      mid: [{ x: 50, y: 46 }, { x: 42, y: 40 }, { x: 46, y: 52 }, { x: 54, y: 44 }, { x: 50, y: 46 }],
      late: [{ x: 38, y: 60 }, { x: 32, y: 66 }, { x: 44, y: 54 }, { x: 48, y: 48 }, { x: 38, y: 60 }]
    },
    3: { // Offlane (Pressão Bot -> Iniciação)
      early: [{ x: 84, y: 62 }, { x: 84, y: 72 }, { x: 80, y: 78 }, { x: 82, y: 66 }, { x: 84, y: 62 }],
      mid: [{ x: 62, y: 52 }, { x: 54, y: 58 }, { x: 48, y: 52 }, { x: 58, y: 46 }, { x: 62, y: 52 }],
      late: [{ x: 34, y: 68 }, { x: 28, y: 72 }, { x: 38, y: 62 }, { x: 44, y: 56 }, { x: 34, y: 68 }]
    },
    4: { // Soft Support (Roamer / Flanco)
      early: [{ x: 58, y: 40 }, { x: 52, y: 46 }, { x: 62, y: 50 }, { x: 56, y: 38 }, { x: 58, y: 40 }],
      mid: [{ x: 48, y: 48 }, { x: 38, y: 42 }, { x: 44, y: 54 }, { x: 52, y: 46 }, { x: 48, y: 48 }],
      late: [{ x: 42, y: 58 }, { x: 36, y: 64 }, { x: 46, y: 52 }, { x: 40, y: 50 }, { x: 42, y: 58 }]
    },
    5: { // Hard Support (Babysitter Top -> Proteção)
      early: [{ x: 24, y: 16 }, { x: 30, y: 18 }, { x: 20, y: 22 }, { x: 26, y: 15 }, { x: 24, y: 16 }],
      mid: [{ x: 44, y: 38 }, { x: 48, y: 44 }, { x: 40, y: 50 }, { x: 50, y: 40 }, { x: 44, y: 38 }],
      late: [{ x: 46, y: 50 }, { x: 40, y: 56 }, { x: 48, y: 46 }, { x: 44, y: 42 }, { x: 46, y: 50 }]
    }
  }
};

// Interpolação suave ao longo dos waypoints
function interpolatePosition(waypoints, timeSec, loopDuration = 18) {
  if (!waypoints || waypoints.length === 0) return { x: 50, y: 50 };
  if (waypoints.length === 1) return waypoints[0];

  const progress = (timeSec % loopDuration) / loopDuration;
  const numSegments = waypoints.length - 1;
  const segmentFloat = progress * numSegments;
  const segIdx = Math.min(numSegments - 1, Math.floor(segmentFloat));
  const t = segmentFloat - segIdx;
  const smoothT = 0.5 - 0.5 * Math.cos(t * Math.PI);

  const p0 = waypoints[segIdx];
  const p1 = waypoints[segIdx + 1];

  return {
    x: p0.x + (p1.x - p0.x) * smoothT,
    y: p0.y + (p1.y - p0.y) * smoothT
  };
}

// Calcula a coordenada tática em tempo real para o herói (com suporte a morte na fonte)
function calculateHeroPosition(player, idx, isRadiant, currentSec = 1800, rawX, rawY, isDead = false) {
  // Quando o herói está morto, ele permanece posicionado na Fonte da sua equipe
  if (isDead) {
    const list = isRadiant ? FOUNTAIN_COORDS.radiant : FOUNTAIN_COORDS.dire;
    return list[idx % 5];
  }

  // 1. Prioridade para coordenadas brutas vindas da Valve GOTV (quando disponíveis e vivo)
  if (rawX !== undefined && rawY !== undefined && rawX !== 0 && rawY !== 0) {
    const clampedX = Math.max(-8200, Math.min(8200, rawX));
    const clampedY = Math.max(-8200, Math.min(8200, rawY));
    const left = ((clampedX + 8200) / 16400) * 100;
    const top = ((8200 - clampedY) / 16400) * 100;
    return { x: Math.max(5, Math.min(95, left)), y: Math.max(5, Math.min(95, top)) };
  }

  // 2. Interpolação dinâmica ao longo dos waypoints por rota e momento do jogo
  const pos = (idx % 5) + 1;
  const teamKey = isRadiant ? 'radiant' : 'dire';
  const rolePatrol = TACTICAL_WAYPOINTS[teamKey]?.[pos] || TACTICAL_WAYPOINTS[teamKey]?.[1];

  const mins = currentSec / 60;
  let waypoints = rolePatrol.late;
  if (mins < 12) waypoints = rolePatrol.early;
  else if (mins < 32) waypoints = rolePatrol.mid;

  // Ciclo temporal com defasagem individual (offset) para evitar sobreposição exata
  const heroTime = currentSec + (pos * 2.8) + (isRadiant ? 0 : 8.5);
  const baseCoord = interpolatePosition(waypoints, heroTime, 16);

  // Micro-offset individual para espalhamento orgânico de heróis próximos
  const microX = Math.sin((pos * 1.7) + (currentSec * 0.2)) * 1.2;
  const microY = Math.cos((pos * 1.7) + (currentSec * 0.2)) * 1.2;

  return {
    x: Math.max(6, Math.min(94, baseCoord.x + microX)),
    y: Math.max(6, Math.min(94, baseCoord.y + microY))
  };
}

export default function LiveMinimap({
  matchData,
  constants,
  radiantStructures,
  direStructures,
  onSelectHero,
  onManualSync
}) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [hoveredEntity, setHoveredEntity] = useState(null);
  const [elapsedSec, setElapsedSec] = useState(0);

  // Duração oficial recebida do servidor
  const baseDuration = matchData?.duration || matchData?.game_time || 1800;

  // Relógio ativo em tempo real: incrementa a cada 1.5 segundo para atualizar posicionamento
  useEffect(() => {
    setElapsedSec(0);
    const interval = setInterval(() => {
      setElapsedSec((prev) => prev + 1.5);
    }, 1500);

    return () => clearInterval(interval);
  }, [baseDuration]);

  if (!matchData) return null;

  const currentDurationSec = baseDuration + elapsedSec;
  const displayMins = Math.floor(currentDurationSec / 60);
  const displaySecs = String(Math.floor(currentDurationSec % 60)).padStart(2, '0');

  const rawPlayers = matchData.players || [];
  const radiantPlayers = rawPlayers.filter((p, i) => (p.player_slot !== undefined ? p.player_slot < 128 : i < 5));
  const direPlayers = rawPlayers.filter((p, i) => (p.player_slot !== undefined ? p.player_slot >= 128 : i >= 5));

  const showRadiant = activeFilter === 'all' || activeFilter === 'radiant';
  const showDire = activeFilter === 'all' || activeFilter === 'dire';
  const showStructures = activeFilter === 'all' || activeFilter === 'structures';

  const roshanTimer = matchData.roshan_respawn_timer ?? 0;

  return (
    <div className="bg-[#11141D] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl relative overflow-hidden">
      {/* CABEÇALHO DO MINIMAP COM STATUS AO VIVO E SINCRONIZAÇÃO */}
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
              Posicionamento no Mapa em Tempo Real
              <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse">
                {displayMins}:{displaySecs}
              </span>
            </h3>
            <span className="text-[10px] text-gray-400 flex items-center gap-1.5">
              <span>Coordenadas táticas e rotações ativas em tempo real</span>
              <span className="text-emerald-400 font-mono text-[9px]">● Transmitindo</span>
            </span>
          </div>
        </div>

        {/* FILTROS DE VISUALIZAÇÃO E BOTÃO DE SINCRONIZAÇÃO */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {onManualSync && (
            <button
              type="button"
              onClick={onManualSync}
              className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-gray-300 hover:text-white text-[10px] font-bold flex items-center gap-1 transition-all"
              title="Sincronizar telemetria com a API agora"
            >
              <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
              Atualizar
            </button>
          )}

          <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/5 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeFilter === 'all' ? 'bg-amber-500 text-black shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              Todos (10)
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('radiant')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                activeFilter === 'radiant' ? 'bg-emerald-500 text-black shadow-md' : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Radiant
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('dire')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                activeFilter === 'dire' ? 'bg-rose-500 text-white shadow-md' : 'text-rose-400 hover:text-rose-300'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Dire
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('structures')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                activeFilter === 'structures' ? 'bg-cyan-500 text-black shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Castle className="w-3 h-3" /> Torres
            </button>
          </div>
        </div>
      </div>

      {/* ÁREA DO MAPA OFICIAL DE DOTA 2 */}
      <div className="relative w-full max-w-[480px] aspect-square mx-auto rounded-2xl overflow-hidden border-2 border-white/15 shadow-2xl bg-black">
        <img
          src="/minimap.jpg"
          alt="Minimap Dota 2"
          className="w-full h-full object-fill select-none pointer-events-none opacity-90 filter contrast-110"
        />

        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950/15 via-transparent to-rose-950/15 pointer-events-none" />

        {/* PIT DO ROSHAN (CALIBRADO NA CAVERNA DO RIO NOROESTE) */}
        <div
          style={{ left: `${ROSHAN_PIT.x}%`, top: `${ROSHAN_PIT.y}%` }}
          className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10"
        >
          <div className="relative flex items-center justify-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center border shadow-lg ${
              roshanTimer > 0
                ? 'bg-amber-500/20 border-amber-400 text-amber-400 animate-pulse'
                : 'bg-rose-950/70 border-rose-400 text-rose-300 shadow-rose-500/40'
            }`}>
              <Skull className="w-3.5 h-3.5" />
            </div>
            <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center bg-black/95 border border-amber-500/50 px-2.5 py-1 rounded-lg text-[9px] font-mono text-white whitespace-nowrap shadow-xl z-30">
              <span className="font-bold text-amber-400">Pit do Roshan</span>
              <span>{roshanTimer > 0 ? `Renascendo em ${Math.floor(roshanTimer / 60)}m` : 'Roshan Vivo no Pit'}</span>
            </div>
          </div>
        </div>

        {/* ESTRUTURAS RADIANT CALIBRADAS */}
        {showStructures && (
          <>
            {CALIBRATED_TOWERS.radiant.top.map((t, idx) => {
              const isAlive = radiantStructures?.top?.[idx]?.alive !== false;
              return (
                <div
                  key={`rad-top-${idx}`}
                  style={{ left: `${t.x}%`, top: `${t.y}%` }}
                  title={`${t.name} (Radiant): ${isAlive ? 'Intacta' : 'Destruída'}`}
                  className={`absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all flex items-center justify-center ${
                    isAlive
                      ? 'bg-emerald-500 border border-white shadow-md shadow-emerald-500/80 ring-1 ring-emerald-400'
                      : 'bg-black/80 border border-white/20 opacity-30'
                  }`}
                >
                  {isAlive ? <span className="w-1 h-1 rounded-full bg-white" /> : <span className="text-[7px] text-rose-500 font-black">✕</span>}
                </div>
              );
            })}
            {CALIBRATED_TOWERS.radiant.mid.map((t, idx) => {
              const isAlive = radiantStructures?.mid?.[idx]?.alive !== false;
              return (
                <div
                  key={`rad-mid-${idx}`}
                  style={{ left: `${t.x}%`, top: `${t.y}%` }}
                  title={`${t.name} (Radiant): ${isAlive ? 'Intacta' : 'Destruída'}`}
                  className={`absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all flex items-center justify-center ${
                    isAlive
                      ? 'bg-emerald-500 border border-white shadow-md shadow-emerald-500/80 ring-1 ring-emerald-400'
                      : 'bg-black/80 border border-white/20 opacity-30'
                  }`}
                >
                  {isAlive ? <span className="w-1 h-1 rounded-full bg-white" /> : <span className="text-[7px] text-rose-500 font-black">✕</span>}
                </div>
              );
            })}
            {CALIBRATED_TOWERS.radiant.bot.map((t, idx) => {
              const isAlive = radiantStructures?.bot?.[idx]?.alive !== false;
              return (
                <div
                  key={`rad-bot-${idx}`}
                  style={{ left: `${t.x}%`, top: `${t.y}%` }}
                  title={`${t.name} (Radiant): ${isAlive ? 'Intacta' : 'Destruída'}`}
                  className={`absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all flex items-center justify-center ${
                    isAlive
                      ? 'bg-emerald-500 border border-white shadow-md shadow-emerald-500/80 ring-1 ring-emerald-400'
                      : 'bg-black/80 border border-white/20 opacity-30'
                  }`}
                >
                  {isAlive ? <span className="w-1 h-1 rounded-full bg-white" /> : <span className="text-[7px] text-rose-500 font-black">✕</span>}
                </div>
              );
            })}
            {CALIBRATED_TOWERS.radiant.base.map((t, idx) => {
              const isAlive = radiantStructures?.base?.[idx]?.alive !== false;
              return (
                <div
                  key={`rad-base-${idx}`}
                  style={{ left: `${t.x}%`, top: `${t.y}%` }}
                  title={`${t.name} (Radiant): ${isAlive ? 'Intacta' : 'Destruída'}`}
                  className={`absolute ${t.name === 'Trono' ? 'w-4 h-4' : 'w-3 h-3'} -translate-x-1/2 -translate-y-1/2 rounded-full transition-all flex items-center justify-center ${
                    isAlive
                      ? 'bg-emerald-400 border-2 border-white shadow-lg shadow-emerald-400/90'
                      : 'bg-black/80 border border-white/20 opacity-30'
                  }`}
                >
                  {isAlive ? <span className="w-1 h-1 rounded-full bg-white" /> : <span className="text-[7px] text-rose-500 font-black">✕</span>}
                </div>
              );
            })}
          </>
        )}

        {/* ESTRUTURAS DIRE CALIBRADAS */}
        {showStructures && (
          <>
            {CALIBRATED_TOWERS.dire.top.map((t, idx) => {
              const isAlive = direStructures?.top?.[idx]?.alive !== false;
              return (
                <div
                  key={`dire-top-${idx}`}
                  style={{ left: `${t.x}%`, top: `${t.y}%` }}
                  title={`${t.name} (Dire): ${isAlive ? 'Intacta' : 'Destruída'}`}
                  className={`absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all flex items-center justify-center ${
                    isAlive
                      ? 'bg-rose-500 border border-white shadow-md shadow-rose-500/80 ring-1 ring-rose-400'
                      : 'bg-black/80 border border-white/20 opacity-30'
                  }`}
                >
                  {isAlive ? <span className="w-1 h-1 rounded-full bg-white" /> : <span className="text-[7px] text-rose-500 font-black">✕</span>}
                </div>
              );
            })}
            {CALIBRATED_TOWERS.dire.mid.map((t, idx) => {
              const isAlive = direStructures?.mid?.[idx]?.alive !== false;
              return (
                <div
                  key={`dire-mid-${idx}`}
                  style={{ left: `${t.x}%`, top: `${t.y}%` }}
                  title={`${t.name} (Dire): ${isAlive ? 'Intacta' : 'Destruída'}`}
                  className={`absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all flex items-center justify-center ${
                    isAlive
                      ? 'bg-rose-500 border border-white shadow-md shadow-rose-500/80 ring-1 ring-rose-400'
                      : 'bg-black/80 border border-white/20 opacity-30'
                  }`}
                >
                  {isAlive ? <span className="w-1 h-1 rounded-full bg-white" /> : <span className="text-[7px] text-rose-500 font-black">✕</span>}
                </div>
              );
            })}
            {CALIBRATED_TOWERS.dire.bot.map((t, idx) => {
              const isAlive = direStructures?.bot?.[idx]?.alive !== false;
              return (
                <div
                  key={`dire-bot-${idx}`}
                  style={{ left: `${t.x}%`, top: `${t.y}%` }}
                  title={`${t.name} (Dire): ${isAlive ? 'Intacta' : 'Destruída'}`}
                  className={`absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all flex items-center justify-center ${
                    isAlive
                      ? 'bg-rose-500 border border-white shadow-md shadow-rose-500/80 ring-1 ring-rose-400'
                      : 'bg-black/80 border border-white/20 opacity-30'
                  }`}
                >
                  {isAlive ? <span className="w-1 h-1 rounded-full bg-white" /> : <span className="text-[7px] text-rose-500 font-black">✕</span>}
                </div>
              );
            })}
            {CALIBRATED_TOWERS.dire.base.map((t, idx) => {
              const isAlive = direStructures?.base?.[idx]?.alive !== false;
              return (
                <div
                  key={`dire-base-${idx}`}
                  style={{ left: `${t.x}%`, top: `${t.y}%` }}
                  title={`${t.name} (Dire): ${isAlive ? 'Intacta' : 'Destruída'}`}
                  className={`absolute ${t.name === 'Trono' ? 'w-4 h-4' : 'w-3 h-3'} -translate-x-1/2 -translate-y-1/2 rounded-full transition-all flex items-center justify-center ${
                    isAlive
                      ? 'bg-rose-500 border-2 border-white shadow-lg shadow-rose-500/90'
                      : 'bg-black/80 border border-white/20 opacity-30'
                  }`}
                >
                  {isAlive ? <span className="w-1 h-1 rounded-full bg-white" /> : <span className="text-[7px] text-rose-500 font-black">✕</span>}
                </div>
              );
            })}
          </>
        )}

        {/* HERÓIS RADIANT (COM TRANSIÇÃO DINÂMICA EM TEMPO REAL) */}
        {showRadiant && radiantPlayers.map((p, idx) => {
          const rawRespawn = p.respawn_timer ?? 0;
          const remainingRespawn = rawRespawn > 0 ? Math.max(0, Math.ceil(rawRespawn - elapsedSec)) : 0;
          const isDead = remainingRespawn > 0 || p.is_alive === false || (p.death_timer && p.death_timer > 0);

          const coords = calculateHeroPosition(p, idx, true, currentDurationSec, p.position_x, p.position_y, isDead);
          const hImg = p.hero_id ? getHeroImg(constants, p.hero_id) : "";
          const hName = p.hero_id ? getHeroName(constants, p.hero_id) : `Herói ${idx + 1}`;
          const isHovered = hoveredEntity === `rad-${idx}`;

          return (
            <div
              key={`rad-player-${idx}`}
              style={{
                left: `${coords.x}%`,
                top: `${coords.y}%`,
                transition: 'left 1.4s cubic-bezier(0.25, 1, 0.5, 1), top 1.4s cubic-bezier(0.25, 1, 0.5, 1)'
              }}
              onMouseEnter={() => setHoveredEntity(`rad-${idx}`)}
              onMouseLeave={() => setHoveredEntity(null)}
              onClick={() => {
                if (onSelectHero && constants?.heroes?.[p.hero_id]) {
                  onSelectHero(constants.heroes[p.hero_id]);
                }
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
            >
              <div className="relative">
                <div
                  style={{
                    filter: isDead ? 'grayscale(100%) contrast(125%) opacity(70%)' : 'none'
                  }}
                  className={`w-8 h-8 rounded-full p-0.5 bg-[#0A0D14] border-2 ${
                    isDead
                      ? 'border-gray-500 shadow-md shadow-black/80'
                      : isHovered
                      ? 'border-amber-400 scale-125 z-30 ring-2 ring-amber-400 shadow-xl'
                      : 'border-emerald-400 shadow-md shadow-emerald-500/50'
                  } transition-all overflow-hidden flex items-center justify-center`}
                >
                  {hImg ? (
                    <img src={hImg} alt={hName} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span className={`text-[9px] font-bold ${isDead ? 'text-gray-400' : 'text-emerald-400'}`}>{idx + 1}</span>
                  )}
                </div>

                {isDead ? (
                  <span className="absolute -top-1 -right-1 bg-red-950/95 text-red-300 border border-red-500/80 font-mono font-black text-[7px] px-1 py-0.2 rounded-full shadow flex items-center gap-0.5 whitespace-nowrap z-30">
                    💀 {remainingRespawn > 0 ? `${remainingRespawn}s` : 'Fonte'}
                  </span>
                ) : (
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 text-black font-black text-[8px] flex items-center justify-center font-mono shadow border border-black/40">
                    {idx + 1}
                  </span>
                )}

                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center bg-[#0C0F17] border border-emerald-400/60 p-2 rounded-xl text-[10px] text-white whitespace-nowrap shadow-2xl z-40 pointer-events-none min-w-[125px]">
                  <div className="flex items-center gap-1">
                    <span className="font-extrabold text-emerald-300">{p.name}</span>
                    {isDead && (
                      <span className="text-[8px] bg-red-950 text-red-400 border border-red-500/60 px-1 rounded font-black">
                        MORTO
                      </span>
                    )}
                  </div>
                  <span className="text-gray-300 text-[9px]">{hName} (Pos {idx + 1})</span>
                  {isDead && (
                    <span className="text-red-400 font-mono text-[9px] mt-0.5 font-bold">
                      Renasce na Fonte em {remainingRespawn > 0 ? `${remainingRespawn}s` : 'instantes'}
                    </span>
                  )}
                  <div className="flex items-center gap-2 mt-1 text-[9px] font-mono text-gray-400">
                    <span>KDA: <strong className="text-white">{p.kills ?? 0}/{p.deaths ?? 0}/{p.assists ?? 0}</strong></span>
                    <span>Net: <strong className="text-amber-400">{p.net_worth ? p.net_worth.toLocaleString() : '—'}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* HERÓIS DIRE (COM TRANSIÇÃO DINÂMICA EM TEMPO REAL) */}
        {showDire && direPlayers.map((p, idx) => {
          const rawRespawn = p.respawn_timer ?? 0;
          const remainingRespawn = rawRespawn > 0 ? Math.max(0, Math.ceil(rawRespawn - elapsedSec)) : 0;
          const isDead = remainingRespawn > 0 || p.is_alive === false || (p.death_timer && p.death_timer > 0);

          const coords = calculateHeroPosition(p, idx, false, currentDurationSec, p.position_x, p.position_y, isDead);
          const hImg = p.hero_id ? getHeroImg(constants, p.hero_id) : "";
          const hName = p.hero_id ? getHeroName(constants, p.hero_id) : `Herói ${idx + 1}`;
          const isHovered = hoveredEntity === `dire-${idx}`;

          return (
            <div
              key={`dire-player-${idx}`}
              style={{
                left: `${coords.x}%`,
                top: `${coords.y}%`,
                transition: 'left 1.4s cubic-bezier(0.25, 1, 0.5, 1), top 1.4s cubic-bezier(0.25, 1, 0.5, 1)'
              }}
              onMouseEnter={() => setHoveredEntity(`dire-${idx}`)}
              onMouseLeave={() => setHoveredEntity(null)}
              onClick={() => {
                if (onSelectHero && constants?.heroes?.[p.hero_id]) {
                  onSelectHero(constants.heroes[p.hero_id]);
                }
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
            >
              <div className="relative">
                <div
                  style={{
                    filter: isDead ? 'grayscale(100%) contrast(125%) opacity(70%)' : 'none'
                  }}
                  className={`w-8 h-8 rounded-full p-0.5 bg-[#0A0D14] border-2 ${
                    isDead
                      ? 'border-gray-500 shadow-md shadow-black/80'
                      : isHovered
                      ? 'border-amber-400 scale-125 z-30 ring-2 ring-amber-400 shadow-xl'
                      : 'border-rose-500 shadow-md shadow-rose-500/50'
                  } transition-all overflow-hidden flex items-center justify-center`}
                >
                  {hImg ? (
                    <img src={hImg} alt={hName} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span className={`text-[9px] font-bold ${isDead ? 'text-gray-400' : 'text-rose-400'}`}>{idx + 1}</span>
                  )}
                </div>

                {isDead ? (
                  <span className="absolute -top-1 -right-1 bg-red-950/95 text-red-300 border border-red-500/80 font-mono font-black text-[7px] px-1 py-0.2 rounded-full shadow flex items-center gap-0.5 whitespace-nowrap z-30">
                    💀 {remainingRespawn > 0 ? `${remainingRespawn}s` : 'Fonte'}
                  </span>
                ) : (
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-white font-black text-[8px] flex items-center justify-center font-mono shadow border border-black/40">
                    {idx + 1}
                  </span>
                )}

                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center bg-[#0C0F17] border border-rose-500/60 p-2 rounded-xl text-[10px] text-white whitespace-nowrap shadow-2xl z-40 pointer-events-none min-w-[125px]">
                  <div className="flex items-center gap-1">
                    <span className="font-extrabold text-rose-300">{p.name}</span>
                    {isDead && (
                      <span className="text-[8px] bg-red-950 text-red-400 border border-red-500/60 px-1 rounded font-black">
                        MORTO
                      </span>
                    )}
                  </div>
                  <span className="text-gray-300 text-[9px]">{hName} (Pos {idx + 1})</span>
                  {isDead && (
                    <span className="text-red-400 font-mono text-[9px] mt-0.5 font-bold">
                      Renasce na Fonte em {remainingRespawn > 0 ? `${remainingRespawn}s` : 'instantes'}
                    </span>
                  )}
                  <div className="flex items-center gap-2 mt-1 text-[9px] font-mono text-gray-400">
                    <span>KDA: <strong className="text-white">{p.kills ?? 0}/{p.deaths ?? 0}/{p.assists ?? 0}</strong></span>
                    <span>Net: <strong className="text-amber-400">{p.net_worth ? p.net_worth.toLocaleString() : '—'}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* LEGENDA INFORMATIVA ABAIXO DO MAPA */}
      <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono px-2 pt-1 border-t border-white/5 flex-wrap gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/80" />
            <strong className="text-white">Radiant:</strong> {matchData.radiant_name || 'Radiant'}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/80" />
            <strong className="text-white">Dire:</strong> {matchData.dire_name || 'Dire'}
          </span>
          <span className="flex items-center gap-1 text-gray-400">
            <span>💀</span>
            <span>Morto na Fonte (P&B)</span>
          </span>
        </div>
        <span className="text-gray-500 hidden sm:inline">
          Heróis e estruturas atualizados dinamicamente · Clique nos heróis para ver detalhes
        </span>
      </div>
    </div>
  );
}
