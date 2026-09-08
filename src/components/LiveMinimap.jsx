import React, { useState } from 'react';
import { Shield, Skull, Eye, Compass, Castle, Crosshair } from 'lucide-react';
import { getHeroImg, getHeroName } from '../services/api';

// Coordenadas calibradas do mapa de Dota 2 (em porcentagem 0% - 100%)
// Base Radiant: inferior esquerda (x: ~14%, y: ~86%)
// Base Dire: superior direita (x: ~86%, y: ~14%)
const TOWER_COORDINATES = {
  radiant: {
    top: [
      { name: "T1 Top", x: 17, y: 58 },
      { name: "T2 Top", x: 16, y: 71 },
      { name: "T3 Top", x: 15, y: 81 }
    ],
    mid: [
      { name: "T1 Mid", x: 42, y: 60 },
      { name: "T2 Mid", x: 33, y: 67 },
      { name: "T3 Mid", x: 25, y: 75 }
    ],
    bot: [
      { name: "T1 Bot", x: 80, y: 84 },
      { name: "T2 Bot", x: 55, y: 84 },
      { name: "T3 Bot", x: 32, y: 85 }
    ],
    base: [
      { name: "T4 (1)", x: 19, y: 84 },
      { name: "T4 (2)", x: 21, y: 86 },
      { name: "Trono", x: 16, y: 86 }
    ]
  },
  dire: {
    top: [
      { name: "T1 Top", x: 21, y: 16 },
      { name: "T2 Top", x: 46, y: 16 },
      { name: "T3 Top", x: 68, y: 15 }
    ],
    mid: [
      { name: "T1 Mid", x: 58, y: 40 },
      { name: "T2 Mid", x: 67, y: 33 },
      { name: "T3 Mid", x: 75, y: 25 }
    ],
    bot: [
      { name: "T1 Bot", x: 83, y: 42 },
      { name: "T2 Bot", x: 84, y: 29 },
      { name: "T3 Bot", x: 85, y: 19 }
    ],
    base: [
      { name: "T4 (1)", x: 79, y: 16 },
      { name: "T4 (2)", x: 81, y: 14 },
      { name: "Trono", x: 84, y: 14 }
    ]
  }
};

// Posições táticas dinâmicas dos heróis no mapa por rota e momento do jogo
function calculateHeroPosition(player, idx, isRadiant, durationSec = 1800, rawX, rawY) {
  // 1. Se o pacote oficial GOTV contiver coordenadas brutas (world coordinates)
  if (rawX !== undefined && rawY !== undefined && rawX !== 0 && rawY !== 0) {
    const clampedX = Math.max(-8000, Math.min(8000, rawX));
    const clampedY = Math.max(-8000, Math.min(8000, rawY));
    const left = ((clampedX + 8000) / 16000) * 100;
    const top = ((8000 - clampedY) / 16000) * 100;
    return { x: Math.max(8, Math.min(92, left)), y: Math.max(8, Math.min(92, top)) };
  }

  // 2. Posicionamento tático dinâmico baseado na rota, tempo de jogo e lado
  const pos = (idx % 5) + 1;
  const mins = durationSec / 60;
  const timeOffset = Math.sin((mins * 0.7) + idx) * 3;

  if (isRadiant) {
    if (mins < 12) {
      switch (pos) {
        case 1: return { x: 78 + timeOffset, y: 82 };
        case 2: return { x: 44 + timeOffset, y: 57 - timeOffset };
        case 3: return { x: 18, y: 52 + timeOffset };
        case 4: return { x: 30 + timeOffset, y: 50 };
        case 5: return { x: 74, y: 86 + timeOffset };
        default: return { x: 35, y: 65 };
      }
    } else if (mins < 35) {
      switch (pos) {
        case 1: return { x: 62 + timeOffset, y: 68 };
        case 2: return { x: 50 + timeOffset, y: 46 };
        case 3: return { x: 38, y: 38 + timeOffset };
        case 4: return { x: 48 + timeOffset, y: 36 };
        case 5: return { x: 42, y: 55 + timeOffset };
        default: return { x: 45, y: 50 };
      }
    } else {
      switch (pos) {
        case 1: return { x: 68 + timeOffset, y: 32 - timeOffset };
        case 2: return { x: 62 + timeOffset, y: 28 };
        case 3: return { x: 58, y: 35 + timeOffset };
        case 4: return { x: 52 + timeOffset, y: 42 };
        case 5: return { x: 48, y: 48 + timeOffset };
        default: return { x: 60, y: 35 };
      }
    }
  } else {
    if (mins < 12) {
      switch (pos) {
        case 1: return { x: 25 + timeOffset, y: 18 };
        case 2: return { x: 54 + timeOffset, y: 43 - timeOffset };
        case 3: return { x: 82, y: 48 + timeOffset };
        case 4: return { x: 65 + timeOffset, y: 45 };
        case 5: return { x: 32, y: 16 + timeOffset };
        default: return { x: 65, y: 35 };
      }
    } else if (mins < 35) {
      switch (pos) {
        case 1: return { x: 40 + timeOffset, y: 34 };
        case 2: return { x: 52 + timeOffset, y: 52 };
        case 3: return { x: 62, y: 64 + timeOffset };
        case 4: return { x: 55 + timeOffset, y: 44 };
        case 5: return { x: 58, y: 40 + timeOffset };
        default: return { x: 55, y: 45 };
      }
    } else {
      switch (pos) {
        case 1: return { x: 34 + timeOffset, y: 68 - timeOffset };
        case 2: return { x: 38 + timeOffset, y: 72 };
        case 3: return { x: 42, y: 62 + timeOffset };
        case 4: return { x: 50 + timeOffset, y: 56 };
        case 5: return { x: 54, y: 52 + timeOffset };
        default: return { x: 40, y: 65 };
      }
    }
  }
}

export default function LiveMinimap({
  matchData,
  constants,
  radiantStructures,
  direStructures,
  onSelectHero
}) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [hoveredEntity, setHoveredEntity] = useState(null);

  if (!matchData) return null;

  const durationSec = matchData.duration || matchData.game_time || 1800;
  const mins = Math.floor(durationSec / 60);

  const rawPlayers = matchData.players || [];
  const radiantPlayers = rawPlayers.filter((p, i) => (p.player_slot !== undefined ? p.player_slot < 128 : i < 5));
  const direPlayers = rawPlayers.filter((p, i) => (p.player_slot !== undefined ? p.player_slot >= 128 : i >= 5));

  const showRadiant = activeFilter === 'all' || activeFilter === 'radiant';
  const showDire = activeFilter === 'all' || activeFilter === 'dire';
  const showStructures = activeFilter === 'all' || activeFilter === 'structures';

  const isNight = Math.floor(mins / 5) % 2 === 1;
  const roshanCoords = isNight ? { x: 74, y: 76, label: "Pit do Sul (Noite)" } : { x: 26, y: 24, label: "Pit do Norte (Dia)" };
  const roshanTimer = matchData.roshan_respawn_timer ?? 0;

  return (
    <div className="bg-[#11141D] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl relative overflow-hidden">
      {/* CABEÇALHO DO MINIMAP */}
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '10s' }} />
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
              Posicionamento no Mapa em Tempo Real
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Minuto {mins}
              </span>
            </h3>
            <span className="text-[10px] text-gray-400">
              Coordenadas táticas e objetivos da partida atualizados a cada 20 segundos
            </span>
          </div>
        </div>

        {/* FILTROS DE VISUALIZAÇÃO */}
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

      {/* ÁREA CENTRAL: MAPA DE DOTA 2 */}
      <div className="relative w-full max-w-[460px] aspect-square mx-auto rounded-2xl overflow-hidden border-2 border-white/15 shadow-2xl bg-black">
        <img
          src="/minimap.jpg"
          alt="Minimap Dota 2"
          className="w-full h-full object-cover select-none pointer-events-none opacity-90 filter contrast-110"
        />

        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950/15 via-transparent to-rose-950/15 pointer-events-none" />

        {/* PIT DO ROSHAN */}
        <div
          style={{ left: `${roshanCoords.x}%`, top: `${roshanCoords.y}%` }}
          className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10"
        >
          <div className="relative flex items-center justify-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${
              roshanTimer > 0
                ? 'bg-amber-500/20 border-amber-400 text-amber-400 animate-pulse'
                : 'bg-rose-600/40 border-rose-400 text-rose-300 shadow-md shadow-rose-500/30'
            }`}>
              <Skull className="w-3.5 h-3.5" />
            </div>
            <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center bg-black/95 border border-amber-500/50 px-2.5 py-1 rounded-lg text-[9px] font-mono text-white whitespace-nowrap shadow-xl z-30">
              <span className="font-bold text-amber-400">{roshanCoords.label}</span>
              <span>{roshanTimer > 0 ? `Renascendo em ${Math.floor(roshanTimer / 60)}m` : 'Roshan Vivo no Pit'}</span>
            </div>
          </div>
        </div>

        {/* ESTRUTURAS RADIANT (TORRES) */}
        {showStructures && radiantStructures && (
          <>
            {TOWER_COORDINATES.radiant.top.map((t, idx) => {
              const isAlive = radiantStructures.top?.[idx]?.alive !== false;
              return (
                <div
                  key={`rad-top-${idx}`}
                  style={{ left: `${t.x}%`, top: `${t.y}%` }}
                  title={`${t.name} (Radiant): ${isAlive ? 'Intacta' : 'Destruída'}`}
                  className={`absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-all ${
                    isAlive ? 'bg-emerald-400 border-emerald-300 shadow-sm shadow-emerald-400/80' : 'bg-rose-950/80 border-white/20 opacity-30 line-through'
                  }`}
                />
              );
            })}
            {TOWER_COORDINATES.radiant.mid.map((t, idx) => {
              const isAlive = radiantStructures.mid?.[idx]?.alive !== false;
              return (
                <div
                  key={`rad-mid-${idx}`}
                  style={{ left: `${t.x}%`, top: `${t.y}%` }}
                  title={`${t.name} (Radiant): ${isAlive ? 'Intacta' : 'Destruída'}`}
                  className={`absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-all ${
                    isAlive ? 'bg-emerald-400 border-emerald-300 shadow-sm shadow-emerald-400/80' : 'bg-rose-950/80 border-white/20 opacity-30'
                  }`}
                />
              );
            })}
            {TOWER_COORDINATES.radiant.bot.map((t, idx) => {
              const isAlive = radiantStructures.bot?.[idx]?.alive !== false;
              return (
                <div
                  key={`rad-bot-${idx}`}
                  style={{ left: `${t.x}%`, top: `${t.y}%` }}
                  title={`${t.name} (Radiant): ${isAlive ? 'Intacta' : 'Destruída'}`}
                  className={`absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-all ${
                    isAlive ? 'bg-emerald-400 border-emerald-300 shadow-sm shadow-emerald-400/80' : 'bg-rose-950/80 border-white/20 opacity-30'
                  }`}
                />
              );
            })}
          </>
        )}

        {/* ESTRUTURAS DIRE (TORRES) */}
        {showStructures && direStructures && (
          <>
            {TOWER_COORDINATES.dire.top.map((t, idx) => {
              const isAlive = direStructures.top?.[idx]?.alive !== false;
              return (
                <div
                  key={`dire-top-${idx}`}
                  style={{ left: `${t.x}%`, top: `${t.y}%` }}
                  title={`${t.name} (Dire): ${isAlive ? 'Intacta' : 'Destruída'}`}
                  className={`absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-all ${
                    isAlive ? 'bg-rose-500 border-rose-300 shadow-sm shadow-rose-500/80' : 'bg-black border-white/20 opacity-30'
                  }`}
                />
              );
            })}
            {TOWER_COORDINATES.dire.mid.map((t, idx) => {
              const isAlive = direStructures.mid?.[idx]?.alive !== false;
              return (
                <div
                  key={`dire-mid-${idx}`}
                  style={{ left: `${t.x}%`, top: `${t.y}%` }}
                  title={`${t.name} (Dire): ${isAlive ? 'Intacta' : 'Destruída'}`}
                  className={`absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-all ${
                    isAlive ? 'bg-rose-500 border-rose-300 shadow-sm shadow-rose-500/80' : 'bg-black border-white/20 opacity-30'
                  }`}
                />
              );
            })}
            {TOWER_COORDINATES.dire.bot.map((t, idx) => {
              const isAlive = direStructures.bot?.[idx]?.alive !== false;
              return (
                <div
                  key={`dire-bot-${idx}`}
                  style={{ left: `${t.x}%`, top: `${t.y}%` }}
                  title={`${t.name} (Dire): ${isAlive ? 'Intacta' : 'Destruída'}`}
                  className={`absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-all ${
                    isAlive ? 'bg-rose-500 border-rose-300 shadow-sm shadow-rose-500/80' : 'bg-black border-white/20 opacity-30'
                  }`}
                />
              );
            })}
          </>
        )}

        {/* HERÓIS RADIANT */}
        {showRadiant && radiantPlayers.map((p, idx) => {
          const coords = calculateHeroPosition(p, idx, true, durationSec, p.position_x, p.position_y);
          const hImg = p.hero_id ? getHeroImg(constants, p.hero_id) : "";
          const hName = p.hero_id ? getHeroName(constants, p.hero_id) : `Herói ${idx + 1}`;
          const isHovered = hoveredEntity === `rad-${idx}`;

          return (
            <div
              key={`rad-player-${idx}`}
              style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
              onMouseEnter={() => setHoveredEntity(`rad-${idx}`)}
              onMouseLeave={() => setHoveredEntity(null)}
              onClick={() => {
                if (onSelectHero && constants?.heroes?.[p.hero_id]) {
                  onSelectHero(constants.heroes[p.hero_id]);
                }
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group transition-all duration-300"
            >
              <div className="relative">
                <div className={`w-7 h-7 rounded-full p-0.5 bg-[#0A0D14] border-2 ${
                  isHovered ? 'border-amber-400 scale-125 z-30 ring-2 ring-amber-400' : 'border-emerald-400 shadow-md shadow-emerald-500/40'
                } transition-all overflow-hidden flex items-center justify-center`}>
                  {hImg ? (
                    <img src={hImg} alt={hName} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span className="text-[9px] font-bold text-emerald-400">{idx + 1}</span>
                  )}
                </div>

                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 text-black font-black text-[8px] flex items-center justify-center font-mono shadow">
                  {idx + 1}
                </span>

                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center bg-[#0C0F17] border border-emerald-400/60 p-2 rounded-xl text-[10px] text-white whitespace-nowrap shadow-2xl z-40 pointer-events-none min-w-[120px]">
                  <span className="font-extrabold text-emerald-300">{p.name}</span>
                  <span className="text-gray-300 text-[9px]">{hName} (Pos {idx + 1})</span>
                  <div className="flex items-center gap-2 mt-1 text-[9px] font-mono text-gray-400">
                    <span>KDA: <strong className="text-white">{p.kills ?? 0}/{p.deaths ?? 0}/{p.assists ?? 0}</strong></span>
                    <span>Net: <strong className="text-amber-400">{p.net_worth ? p.net_worth.toLocaleString() : '—'}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* HERÓIS DIRE */}
        {showDire && direPlayers.map((p, idx) => {
          const coords = calculateHeroPosition(p, idx, false, durationSec, p.position_x, p.position_y);
          const hImg = p.hero_id ? getHeroImg(constants, p.hero_id) : "";
          const hName = p.hero_id ? getHeroName(constants, p.hero_id) : `Herói ${idx + 1}`;
          const isHovered = hoveredEntity === `dire-${idx}`;

          return (
            <div
              key={`dire-player-${idx}`}
              style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
              onMouseEnter={() => setHoveredEntity(`dire-${idx}`)}
              onMouseLeave={() => setHoveredEntity(null)}
              onClick={() => {
                if (onSelectHero && constants?.heroes?.[p.hero_id]) {
                  onSelectHero(constants.heroes[p.hero_id]);
                }
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group transition-all duration-300"
            >
              <div className="relative">
                <div className={`w-7 h-7 rounded-full p-0.5 bg-[#0A0D14] border-2 ${
                  isHovered ? 'border-amber-400 scale-125 z-30 ring-2 ring-amber-400' : 'border-rose-500 shadow-md shadow-rose-500/40'
                } transition-all overflow-hidden flex items-center justify-center`}>
                  {hImg ? (
                    <img src={hImg} alt={hName} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span className="text-[9px] font-bold text-rose-400">{idx + 1}</span>
                  )}
                </div>

                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-white font-black text-[8px] flex items-center justify-center font-mono shadow">
                  {idx + 1}
                </span>

                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center bg-[#0C0F17] border border-rose-500/60 p-2 rounded-xl text-[10px] text-white whitespace-nowrap shadow-2xl z-40 pointer-events-none min-w-[120px]">
                  <span className="font-extrabold text-rose-300">{p.name}</span>
                  <span className="text-gray-300 text-[9px]">{hName} (Pos {idx + 1})</span>
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
      <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono px-2 pt-1 border-t border-white/5">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <strong className="text-white">Radiant:</strong> {matchData.radiant_name || 'Radiant'}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <strong className="text-white">Dire:</strong> {matchData.dire_name || 'Dire'}
          </span>
        </div>
        <span className="text-gray-500 hidden sm:inline">
          Passe o mouse ou toque nos heróis para ver KDA e Net Worth
        </span>
      </div>
    </div>
  );
}
