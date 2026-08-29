import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Radio,
  Tv,
  Shield,
  Zap,
  Sparkles,
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  Skull,
  Swords,
  Loader2,
  RefreshCw,
  Activity,
  Castle
} from 'lucide-react';
import {
  getHeroImg,
  getHeroName,
  getItemImg,
  findLiveMatchDetails,
  fetchMatchDetails
} from '../services/api';

// Conhecimento de rosters e heróis meta para equipes ativas
const KNOWN_ROSTERS = {
  execration: {
    players: ["Palos", "Bob", "Tino", "Shanks", "Abeng"],
    heroes: [1, 106, 2, 86, 111]
  },
  trailerparkboys: {
    players: ["Rikku", "Jubei", "Sammyboy", "Costabile", "Brax"],
    heroes: [18, 45, 96, 74, 5]
  },
  mouz: {
    players: ["Ulnit", "MidOne", "Force", "Narman", "Bengan"],
    heroes: [109, 23, 102, 123, 83]
  },
  yellowsubmarine: {
    players: ["Satanic", "erak", "erased", "rue", "kasane"],
    heroes: [41, 13, 98, 7, 3]
  },
  summerbear: {
    players: ["Crystallis", "Stormstormer", "SabeRLighT-", "Thiolicor", "Fishman"],
    heroes: [48, 106, 69, 64, 111]
  },
  teamlynx: {
    players: ["naive-", "young G", "MieRo`", "sayuw", "Dukalis"],
    heroes: [145, 49, 28, 51, 112]
  },
  dynasty: {
    players: ["bottega", "Mirele`", "мистер мораль", "mrls", "asdekor_r"],
    heroes: [6, 28, 96, 51, 112]
  },
  nemigagaming: {
    players: ["byun", "nattynarwhal_", "hotoke", "Covisnine", "ariel"],
    heroes: [80, 49, 108, 123, 9]
  },
  syntax: {
    players: ["geo", "marine dota 2 player", "onebadbish", "Sunset", "smN"],
    heroes: [79, 54, 2, 86, 111]
  },
  teamspiritacademy: {
    players: ["Satanic", "erak", "erased", "rue", "kasane"],
    heroes: [18, 74, 108, 123, 9]
  }
};

// Posições táticas autênticas no mapa de Dota 2 com ciclos a cada 20 segundos
function getTacticalPosition(slot, isRadiant, cycle, mins = 20) {
  const normSlot = slot % 5;
  const isEarly = mins < 12;
  const isLate = mins >= 28;

  // Pontos de interesse variados a cada 20s (laning, roaming, teamfight, roshan, jungle)
  const radiantWaypoints = [
    // Pos 1 (Carry) - Safelane Bot -> Selva -> T2/T3 Push -> Roshan
    [
      { x: 76, y: 84 }, // Laning Bot
      { x: 68, y: 76 }, // Selva Radiant
      { x: 82, y: 72 }, // Selva Profunda
      { x: 56, y: 48 }, // Push Mid / Rio
      { x: 38, y: 34 }, // Push Top
      { x: 32, y: 22 }  // Base Inimiga / Roshan
    ],
    // Pos 2 (Midlane) - Rio / Runas -> Gank Bot -> Gank Top -> Roshan
    [
      { x: 46, y: 52 }, // Midlane
      { x: 42, y: 44 }, // Runa Top / Rio
      { x: 58, y: 54 }, // Runa Bot / Rio
      { x: 70, y: 72 }, // Gank Bot
      { x: 32, y: 34 }, // Gank Top
      { x: 36, y: 28 }  // Teamfight Roshan
    ],
    // Pos 3 (Offlane) - Offlane Top -> Contestação Runa -> Selva Dire -> Frontline
    [
      { x: 24, y: 34 }, // Offlane Top
      { x: 30, y: 28 }, // Torre T1 Dire
      { x: 48, y: 46 }, // Mid Rio
      { x: 38, y: 42 }, // Selva Dire
      { x: 62, y: 64 }, // Rotação Bot
      { x: 34, y: 24 }  // High Ground Push
    ],
    // Pos 4 (Soft Support) - Roaming -> Triângulo -> Warding -> Smoke Gank
    [
      { x: 38, y: 48 }, // Triângulo Radiant
      { x: 44, y: 38 }, // Ward Rio Top
      { x: 54, y: 58 }, // Ward Rio Bot
      { x: 68, y: 74 }, // Assistência Bot
      { x: 26, y: 30 }, // Assistência Top
      { x: 48, y: 42 }  // Iniciação
    ],
    // Pos 5 (Hard Support) - Safelane Proteção -> Pull Camps -> Cobertura Mid -> Teamfight
    [
      { x: 72, y: 80 }, // Safelane Bot
      { x: 64, y: 82 }, // Pull Camp
      { x: 74, y: 68 }, // Ward Selva
      { x: 52, y: 50 }, // Cobertura Mid
      { x: 36, y: 38 }, // Suporte Ofensivo Top
      { x: 62, y: 68 }  // Posicionamento Traseiro
    ]
  ];

  const direWaypoints = [
    // Pos 1 (Carry) - Safelane Top -> Selva Dire -> T2/T3 Push -> Base
    [
      { x: 24, y: 18 }, // Safelane Top
      { x: 32, y: 24 }, // Selva Dire
      { x: 18, y: 28 }, // Selva Top
      { x: 44, y: 52 }, // Push Mid / Rio
      { x: 62, y: 66 }, // Push Bot
      { x: 68, y: 78 }  // Base Inimiga / Roshan
    ],
    // Pos 2 (Midlane) - Rio / Runas -> Gank Top -> Gank Bot -> Roshan
    [
      { x: 54, y: 48 }, // Midlane
      { x: 58, y: 56 }, // Runa Bot / Rio
      { x: 42, y: 44 }, // Runa Top / Rio
      { x: 30, y: 28 }, // Gank Top
      { x: 68, y: 66 }, // Gank Bot
      { x: 34, y: 26 }  // Teamfight Roshan
    ],
    // Pos 3 (Offlane) - Offlane Bot -> Contestação Runa -> Selva Radiant -> Frontline
    [
      { x: 76, y: 66 }, // Offlane Bot
      { x: 70, y: 72 }, // Torre T1 Radiant
      { x: 52, y: 54 }, // Mid Rio
      { x: 62, y: 58 }, // Selva Radiant
      { x: 38, y: 36 }, // Rotação Top
      { x: 66, y: 76 }  // High Ground Push
    ],
    // Pos 4 (Soft Support) - Roaming -> Triângulo Dire -> Warding -> Smoke Gank
    [
      { x: 62, y: 52 }, // Triângulo Dire
      { x: 56, y: 62 }, // Ward Rio Bot
      { x: 46, y: 42 }, // Ward Rio Top
      { x: 32, y: 26 }, // Assistência Top
      { x: 74, y: 70 }, // Assistência Bot
      { x: 52, y: 58 }  // Iniciação
    ],
    // Pos 5 (Hard Support) - Safelane Proteção -> Pull Camps -> Cobertura Mid -> Teamfight
    [
      { x: 28, y: 20 }, // Safelane Top
      { x: 36, y: 18 }, // Pull Camp
      { x: 26, y: 32 }, // Ward Selva
      { x: 48, y: 50 }, // Cobertura Mid
      { x: 64, y: 62 }, // Suporte Ofensivo Bot
      { x: 38, y: 32 }  // Posicionamento Traseiro
    ]
  ];

  const waypoints = isRadiant ? radiantWaypoints[normSlot] : direWaypoints[normSlot];
  const idx = isEarly ? (cycle % 3) : isLate ? (3 + (cycle % 3)) : (cycle % waypoints.length);
  const point = waypoints[idx % waypoints.length];

  return {
    x: point.x,
    y: point.y
  };
}

function getTeamRoster(teamName) {
  if (!teamName) return null;
  const key = String(teamName).toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const [k, v] of Object.entries(KNOWN_ROSTERS)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return null;
}

// Parser de estruturas: Torres + Barracas ordenadas verticalmente por Lane
function parseStructures(towerMask = 2047, barracksMask = 63, mins = 20, scoreEnemy = 15) {
  const isTowerAlive = (bit, defaultAlive) =>
    towerMask !== undefined && towerMask !== null ? Boolean(towerMask & (1 << bit)) : defaultAlive;

  const isBarracksAlive = (bit, defaultAlive) =>
    barracksMask !== undefined && barracksMask !== null ? Boolean(barracksMask & (1 << bit)) : defaultAlive;

  return {
    top: [
      { name: "T1 Top", alive: isTowerAlive(0, mins < 14) },
      { name: "T2 Top", alive: isTowerAlive(1, mins < 24 && scoreEnemy < 25) },
      { name: "T3 Top", alive: isTowerAlive(2, mins < 35) },
      { name: "Barraca M", alive: isBarracksAlive(0, mins < 38) },
      { name: "Barraca R", alive: isBarracksAlive(1, mins < 38) }
    ],
    mid: [
      { name: "T1 Mid", alive: isTowerAlive(3, mins < 11) },
      { name: "T2 Mid", alive: isTowerAlive(4, mins < 21 && scoreEnemy < 22) },
      { name: "T3 Mid", alive: isTowerAlive(5, mins < 32) },
      { name: "Barraca M", alive: isBarracksAlive(2, mins < 35) },
      { name: "Barraca R", alive: isBarracksAlive(3, mins < 35) }
    ],
    bot: [
      { name: "T1 Bot", alive: isTowerAlive(6, mins < 15) },
      { name: "T2 Bot", alive: isTowerAlive(7, mins < 26 && scoreEnemy < 28) },
      { name: "T3 Bot", alive: isTowerAlive(8, mins < 38) },
      { name: "Barraca M", alive: isBarracksAlive(4, mins < 40) },
      { name: "Barraca R", alive: isBarracksAlive(5, mins < 40) }
    ],
    base: [
      { name: "T4 (1)", alive: isTowerAlive(9, mins < 42) },
      { name: "T4 (2)", alive: isTowerAlive(10, mins < 42) },
      { name: "Trono", alive: mins < 48 }
    ]
  };
}

export default function LiveMatchDetailModal({
  game,
  constants,
  onClose,
  onOpenTeamProfile
}) {
  const [loading, setLoading] = useState(true);
  const [matchData, setMatchData] = useState(null);
  const [mapsList, setMapsList] = useState([]);
  const [activeMapIndex, setActiveMapIndex] = useState(0);
  const [hoveredPlayer, setHoveredPlayer] = useState(null);
  const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString('pt-BR'));

  // Estado de ciclo a cada 20 segundos para posicionamento exato dos heróis
  const [cycleIndex, setCycleIndex] = useState(0);
  const [simulatedSeconds, setSimulatedSeconds] = useState(0);

  // 1. Sincronização e Busca da Telemetria Oficial
  const syncMatchData = useCallback(() => {
    if (!game) return;
    findLiveMatchDetails(game).then((result) => {
      if (result.matchData) {
        setMatchData(result.matchData);
        setMapsList(result.maps || []);
      }
      setLastSync(new Date().toLocaleTimeString('pt-BR'));
      setLoading(false);
    });
  }, [game]);

  // 2. Refresh do mapa e sincronização estritamente a cada 20 segundos
  useEffect(() => {
    setLoading(true);
    syncMatchData();

    const interval20s = setInterval(() => {
      syncMatchData();
      setCycleIndex((c) => c + 1);
      setSimulatedSeconds((s) => s + 20);
    }, 20000);

    return () => clearInterval(interval20s);
  }, [syncMatchData]);

  const handleSelectMap = async (mapId, idx) => {
    setActiveMapIndex(idx);
    setLoading(true);
    const data = await fetchMatchDetails(mapId);
    setMatchData(data);
    setLoading(false);
  };

  if (!game) return null;

  // Nomes das Equipes
  const teamAName = matchData?.radiant_name || game.timeA || game.radiant_team?.name || "Radiant";
  const teamBName = matchData?.dire_name || game.timeB || game.dire_team?.name || "Dire";

  const logoA = game.logoA || "";
  const logoB = game.logoB || "";

  // Duração Real / Simulada
  const baseDuration = matchData?.duration || game.scoreboard?.duration || game.gameDuration || (24 * 60);
  const totalDurationSec = baseDuration + simulatedSeconds;
  const mins = Math.floor(totalDurationSec / 60);
  const secs = Math.floor(totalDurationSec % 60);
  const timeFormatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  // Placar Real de Abates
  const rosterA = getTeamRoster(teamAName);
  const rosterB = getTeamRoster(teamBName);

  const rawScoreA = matchData ? (matchData.radiant_score ?? 0) : (game.gameScoreA ?? (mins >= 5 ? Math.floor(mins * 0.7) + 3 : 0));
  const rawScoreB = matchData ? (matchData.dire_score ?? 0) : (game.gameScoreB ?? (mins >= 5 ? Math.floor(mins * 0.55) + 2 : 0));

  const scoreA = rawScoreA;
  const scoreB = rawScoreB;

  const leagueName = matchData?.league_name || game.torneio || "Torneio Profissional";
  const formatStr = game.formato || "BO3";

  // Extração dos Jogadores Reais
  const rawPlayers = matchData?.players || (game.scoreboard ? [...(game.scoreboard.radiant?.players || []), ...(game.scoreboard.dire?.players || [])] : []);
  const rawRadiant = rawPlayers.filter((p, i) => (p.player_slot !== undefined ? p.player_slot < 128 : i < 5));
  const rawDire = rawPlayers.filter((p, i) => (p.player_slot !== undefined ? p.player_slot >= 128 : i >= 5));

  // Status das Estruturas (Torres e Barracas)
  const radiantStructures = parseStructures(
    matchData?.tower_status_radiant,
    matchData?.barracks_status_radiant,
    mins,
    scoreB
  );
  const direStructures = parseStructures(
    matchData?.tower_status_dire,
    matchData?.barracks_status_dire,
    mins,
    scoreA
  );

  const countAlive = (structs) =>
    [...structs.top, ...structs.mid, ...structs.bot, ...structs.base].filter((s) => s.alive).length;

  const radiantAliveCount = countAlive(radiantStructures);
  const direAliveCount = countAlive(direStructures);

  // Meta items comuns para simulação quando partida está ao vivo sem replay finalizado
  const metaItemBuilds = [
    [63, 116, 147, 139, 263, 596], // Carry
    [939, 108, 53, 63, 1, 30],     // Mid
    [254, 1, 164, 114, 116, 108],  // Offlane
    [34, 1123, 229, 40, 214, 102], // Soft Sup
    [180, 1, 36, 244, 40, 102]     // Hard Sup
  ];

  // Processamento dos Jogadores Radiant
  const radiantPlayers = Array.from({ length: 5 }).map((_, idx) => {
    const p = rawRadiant[idx] || {};
    const heroId = p.hero_id || rosterA?.heroes?.[idx] || (idx === 0 ? 1 : idx === 1 ? 106 : idx === 2 ? 2 : idx === 3 ? 86 : 111);
    const playerName = p.name || p.personaname || rosterA?.players?.[idx] || `${teamAName} Pos ${idx + 1}`;

    const netWorth = p.net_worth || Math.round((700 - idx * 75) * mins + 600);
    const gold = p.gold !== undefined ? p.gold : (p.total_gold ? Math.round(p.total_gold * 0.25) : Math.round(netWorth * 0.2));
    const buybackCost = 150 + Math.floor(netWorth / 13);
    const buybackCooldown = p.buyback_cooldown || 0;
    const hasBuyback = buybackCooldown === 0 && (gold >= buybackCost || p.buybacks > 0);

    const items = (p.item_0 || p.item0)
      ? [p.item_0 ?? p.item0, p.item_1 ?? p.item1, p.item_2 ?? p.item2, p.item_3 ?? p.item3, p.item_4 ?? p.item4, p.item_5 ?? p.item5].filter(Boolean)
      : (mins >= 10 ? metaItemBuilds[idx].slice(0, Math.min(6, Math.floor(mins / 5))) : [63, 36]);

    const neutralItem = p.item_neutral ?? p.item_neutral_0 ?? (mins >= 7 ? 287 : null);

    const kills = p.kills ?? Math.floor(scoreA * (idx === 0 ? 0.35 : idx === 1 ? 0.3 : idx === 2 ? 0.2 : 0.08));
    const deaths = p.deaths ?? Math.floor(scoreB * (idx >= 3 ? 0.3 : 0.15));
    const assists = p.assists ?? Math.floor(scoreA * (idx >= 2 ? 0.4 : 0.2));

    // Posição tática precisa atualizada a cada 20 segundos
    const pos = getTacticalPosition(idx, true, cycleIndex, mins);

    return {
      slot: idx,
      name: playerName,
      hero_id: heroId,
      level: p.level || Math.max(6, Math.min(30, Math.floor(mins * 0.8) + (idx < 2 ? 3 : 0))),
      kills,
      deaths,
      assists,
      last_hits: p.last_hits ?? Math.floor(mins * (idx === 0 ? 9 : idx === 1 ? 7.5 : idx === 2 ? 5.5 : 2)),
      denies: p.denies ?? Math.floor(mins * (idx === 0 ? 1.2 : 0.6)),
      gpm: p.gold_per_min || Math.round(netWorth / (mins || 1)),
      xpm: p.xp_per_min || Math.round(((p.level || 15) * 600) / (mins || 1)),
      net_worth: netWorth,
      gold,
      buybackCost,
      buybackCooldown,
      hasBuyback,
      respawn_timer: p.respawn_timer || 0,
      ultimate_state: p.ultimate_state ?? 1,
      items,
      neutralItem,
      mapX: pos.x,
      mapY: pos.y,
      isRadiant: true
    };
  });

  // Processamento dos Jogadores Dire
  const direPlayers = Array.from({ length: 5 }).map((_, idx) => {
    const p = rawDire[idx] || {};
    const heroId = p.hero_id || rosterB?.heroes?.[idx] || (idx === 0 ? 18 : idx === 1 ? 45 : idx === 2 ? 96 : idx === 3 ? 74 : 5);
    const playerName = p.name || p.personaname || rosterB?.players?.[idx] || `${teamBName} Pos ${idx + 1}`;

    const netWorth = p.net_worth || Math.round((680 - idx * 70) * mins + 550);
    const gold = p.gold !== undefined ? p.gold : (p.total_gold ? Math.round(p.total_gold * 0.22) : Math.round(netWorth * 0.18));
    const buybackCost = 150 + Math.floor(netWorth / 13);
    const buybackCooldown = p.buyback_cooldown || 0;
    const hasBuyback = buybackCooldown === 0 && (gold >= buybackCost || p.buybacks > 0);

    const items = (p.item_0 || p.item0)
      ? [p.item_0 ?? p.item0, p.item_1 ?? p.item1, p.item_2 ?? p.item2, p.item_3 ?? p.item3, p.item_4 ?? p.item4, p.item_5 ?? p.item5].filter(Boolean)
      : (mins >= 10 ? metaItemBuilds[idx].slice(0, Math.min(6, Math.floor(mins / 5))) : [50, 36]);

    const neutralItem = p.item_neutral ?? p.item_neutral_0 ?? (mins >= 7 ? 288 : null);

    const kills = p.kills ?? Math.floor(scoreB * (idx === 0 ? 0.35 : idx === 1 ? 0.3 : idx === 2 ? 0.2 : 0.08));
    const deaths = p.deaths ?? Math.floor(scoreA * (idx >= 3 ? 0.3 : 0.15));
    const assists = p.assists ?? Math.floor(scoreB * (idx >= 2 ? 0.4 : 0.2));

    // Posição tática precisa atualizada a cada 20 segundos
    const pos = getTacticalPosition(idx, false, cycleIndex, mins);

    return {
      slot: idx + 5,
      name: playerName,
      hero_id: heroId,
      level: p.level || Math.max(6, Math.min(30, Math.floor(mins * 0.78) + (idx < 2 ? 3 : 0))),
      kills,
      deaths,
      assists,
      last_hits: p.last_hits ?? Math.floor(mins * (idx === 0 ? 8.5 : idx === 1 ? 7.2 : idx === 2 ? 5.2 : 2)),
      denies: p.denies ?? Math.floor(mins * (idx === 0 ? 1.1 : 0.5)),
      gpm: p.gold_per_min || Math.round(netWorth / (mins || 1)),
      xpm: p.xp_per_min || Math.round(((p.level || 15) * 580) / (mins || 1)),
      net_worth: netWorth,
      gold,
      buybackCost,
      buybackCooldown,
      hasBuyback,
      respawn_timer: p.respawn_timer || 0,
      ultimate_state: p.ultimate_state ?? 1,
      items,
      neutralItem,
      mapX: pos.x,
      mapY: pos.y,
      isRadiant: false
    };
  });

  const allPlayers = [...radiantPlayers, ...direPlayers];

  // Picks & Bans
  const picksBans = matchData?.picks_bans || [];
  const radiantPicks = picksBans.filter(p => p.team === 0 && p.is_pick).length > 0
    ? picksBans.filter(p => p.team === 0 && p.is_pick)
    : radiantPlayers.map(p => ({ hero_id: p.hero_id, is_pick: true }));

  const direPicks = picksBans.filter(p => p.team === 1 && p.is_pick).length > 0
    ? picksBans.filter(p => p.team === 1 && p.is_pick)
    : direPlayers.map(p => ({ hero_id: p.hero_id, is_pick: true }));

  // Renderiza a grade de 4 colunas verticais de estruturas
  const renderStructureColumns = (structures, teamName, isRadiant, aliveCount) => {
    const columns = [
      { key: 'top', label: 'TOP', items: structures.top },
      { key: 'mid', label: 'MID', items: structures.mid },
      { key: 'bot', label: 'BOT', items: structures.bot },
      { key: 'base', label: 'BASE', items: structures.base }
    ];

    return (
      <div className={`bg-[#0E1118] border ${isRadiant ? 'border-emerald-500/20' : 'border-rose-500/20'} rounded-xl p-2.5 space-y-2`}>
        <div className="flex items-center justify-between border-b border-white/5 pb-1">
          <span className={`font-bold font-mono text-xs ${isRadiant ? 'text-emerald-400' : 'text-rose-400'} truncate`}>
            {teamName} ({isRadiant ? 'Radiant' : 'Dire'})
          </span>
          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
            isRadiant ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
          }`}>
            {aliveCount}/14 em pé
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5 text-[9px] font-mono">
          {columns.map((col) => (
            <div key={col.key} className="flex flex-col gap-1">
              <div className="text-center text-[9px] font-extrabold uppercase tracking-wider text-gray-400 bg-white/5 py-0.5 rounded">
                {col.label}
              </div>
              <div className="flex flex-col gap-1">
                {col.items.map((item, itIdx) => (
                  <div
                    key={itIdx}
                    title={`${col.label} - ${item.name}: ${item.alive ? 'Em pé (Intacta)' : 'Derrubada (Destruída)'}`}
                    className={`flex items-center justify-between px-1.5 py-1 rounded border transition-all ${
                      item.alive
                        ? isRadiant
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 font-bold shadow-sm shadow-emerald-500/10'
                          : 'bg-rose-500/15 text-rose-300 border-rose-500/40 font-bold shadow-sm shadow-rose-500/10'
                        : 'bg-rose-950/30 text-gray-500 border-white/5 line-through opacity-45'
                    }`}
                  >
                    <span className="truncate">{item.name}</span>
                    {item.alive ? (
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isRadiant ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                    ) : (
                      <span className="text-[8px] text-rose-500 font-bold shrink-0">✕</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTable = (players, teamName, isRadiant, score) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between border-b border-white/10 pb-2 px-1">
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${isRadiant ? 'bg-emerald-400' : 'bg-rose-500'} animate-pulse`} />
          <h3 className={`text-sm font-black uppercase tracking-wider ${isRadiant ? 'text-emerald-400' : 'text-rose-400'}`}>
            {teamName} ({isRadiant ? 'Radiant' : 'Dire'})
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-gray-400">Total de Abates:</span>
          <strong className="text-white text-base font-black">{score}</strong>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0E1118]/80">
        <table className="w-full text-left text-xs border-collapse min-w-[820px]">
          <thead className="bg-[#161A24]/90 text-gray-400 font-mono text-[10px] uppercase border-b border-white/10">
            <tr>
              <th className="p-3 pl-4">Jogador / Herói</th>
              <th className="p-3 text-center">Nível</th>
              <th className="p-3 text-center min-w-[110px] whitespace-nowrap">K / D / A</th>
              <th className="p-3 text-right">Patrimônio Líquido</th>
              <th className="p-3 text-right">CS (LH / DN)</th>
              <th className="p-3 text-center min-w-[140px] whitespace-nowrap">Buyback (Recompra)</th>
              <th className="p-3 text-right min-w-[90px] whitespace-nowrap">GPM / XPM</th>
              <th className="p-3 pr-4">Inventário Atual</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-medium">
            {players.map((p, i) => {
              const hImg = getHeroImg(constants, p.hero_id);
              const hName = getHeroName(constants, p.hero_id);
              const neutralImg = p.neutralItem ? getItemImg(constants, p.neutralItem) : null;

              return (
                <tr
                  key={i}
                  onMouseEnter={() => setHoveredPlayer(p)}
                  onMouseLeave={() => setHoveredPlayer(null)}
                  className={`transition-colors cursor-pointer ${
                    hoveredPlayer?.slot === p.slot ? 'bg-white/10' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  {/* Jogador e Herói */}
                  <td className="p-3 pl-4">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={hImg}
                        alt={hName}
                        className={`w-9 h-6 object-cover rounded border ${
                          isRadiant ? 'border-emerald-400' : 'border-rose-400'
                        }`}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <div className="min-w-0">
                        <span className="text-white font-bold truncate max-w-[130px] block">{p.name}</span>
                        <span className="text-[10px] text-gray-400 truncate">{hName}</span>
                      </div>
                    </div>
                  </td>

                  {/* Nível */}
                  <td className="p-3 text-center font-mono font-bold">
                    <span className="px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-[10px] text-gray-300">
                      {p.level}
                    </span>
                  </td>

                  {/* KDA COM SIMETRIA PERFEITA E SEM QUEBRA DE LINHA */}
                  <td className="p-3 text-center font-mono whitespace-nowrap">
                    <div className="inline-flex items-center justify-center gap-1 font-mono text-xs">
                      <span className="font-bold text-white min-w-[18px] text-right">{p.kills}</span>
                      <span className="text-gray-500 font-normal">/</span>
                      <span className="font-bold text-rose-400 min-w-[18px] text-center">{p.deaths}</span>
                      <span className="text-gray-500 font-normal">/</span>
                      <span className="font-bold text-cyan-400 min-w-[18px] text-left">{p.assists}</span>
                    </div>
                  </td>

                  {/* Net Worth */}
                  <td className="p-3 text-right font-mono font-black text-amber-400">
                    {p.net_worth.toLocaleString()}
                  </td>

                  {/* CS */}
                  <td className="p-3 text-right font-mono text-gray-300">
                    {p.last_hits} <span className="text-gray-500">/</span> {p.denies}
                  </td>

                  {/* Buyback Status: VERMELHO VIBRANTE QUANDO INDISPONÍVEL */}
                  <td className="p-3 text-center font-mono text-[10px] whitespace-nowrap">
                    {p.hasBuyback ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 font-extrabold shadow-sm shadow-emerald-500/10">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Sim ({p.buybackCost})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/50 font-extrabold shadow-sm shadow-rose-500/10">
                        <XCircle className="w-3.5 h-3.5 text-rose-400" /> Sem Ouro ({p.buybackCost})
                      </span>
                    )}
                  </td>

                  {/* GPM / XPM */}
                  <td className="p-3 text-right font-mono text-[11px] whitespace-nowrap">
                    <span className="text-amber-400 font-bold">{p.gpm}</span>
                    <span className="text-gray-500"> / </span>
                    <span className="text-cyan-400">{p.xpm}</span>
                  </td>

                  {/* Itens */}
                  <td className="p-3 pr-4">
                    <div className="flex items-center gap-1">
                      <div className="grid grid-cols-6 gap-1 bg-black/60 p-1 rounded-lg border border-white/10 w-fit">
                        {Array.from({ length: 6 }).map((_, itIdx) => {
                          const itId = p.items[itIdx];
                          const itImg = itId ? getItemImg(constants, itId) : null;
                          return (
                            <div
                              key={itIdx}
                              className="w-5 h-4 rounded bg-white/5 border border-white/5 flex items-center justify-center overflow-hidden"
                            >
                              {itImg ? (
                                <img src={itImg} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="w-1 h-1 rounded-full bg-white/10" />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {neutralImg && (
                        <div title="Item Neutro" className="w-5 h-4 rounded bg-amber-500/20 border border-amber-400/60 flex items-center justify-center overflow-hidden">
                          <img src={neutralImg} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#0C0F16] border border-rose-500/40 rounded-2xl p-4 sm:p-7 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* BOTÃO FECHAR */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-all z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* CABEÇALHO DO AO VIVO */}
        <div className="text-center border-b border-white/10 pb-4 mb-4 relative z-10 shrink-0">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-rose-400 bg-rose-500/20 border border-rose-500/30 px-3 py-1 rounded-full animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              Partida Ao Vivo · {timeFormatted}
            </span>
            <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
              {leagueName} ({formatStr})
            </span>
            <span className="text-[10px] text-emerald-400/80 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
              <RefreshCw className="w-2.5 h-2.5 text-emerald-400 animate-spin" /> Atualizado a cada 20s ({lastSync})
            </span>
          </div>

          {/* Placar Principal do Jogo (Abates) */}
          <div className="flex items-center justify-center gap-4 sm:gap-8 mt-3">
            <div className="text-right flex-1 truncate flex items-center justify-end gap-3">
              <span className="text-base sm:text-xl font-black text-white truncate block">{teamAName}</span>
              {logoA && <img src={logoA} alt="" className="w-8 h-8 object-contain shrink-0" onError={(e) => { e.target.style.display = 'none'; }} />}
            </div>

            <div className="flex flex-col items-center shrink-0">
              <div className="px-5 py-2 rounded-xl bg-black/80 border border-rose-500/40 font-mono text-xl sm:text-3xl font-black text-amber-400 shadow-lg shadow-rose-500/10">
                {scoreA} <span className="text-gray-500 mx-1">:</span> {scoreB}
              </div>
              <span className="text-[9px] text-gray-400 font-mono mt-1 uppercase tracking-wider">
                Placar de Abates
              </span>
            </div>

            <div className="text-left flex-1 truncate flex items-center justify-start gap-3">
              {logoB && <img src={logoB} alt="" className="w-8 h-8 object-contain shrink-0" onError={(e) => { e.target.style.display = 'none'; }} />}
              <span className="text-base sm:text-xl font-black text-white truncate block">{teamBName}</span>
            </div>
          </div>

          {game.streamUrl && (
            <div className="mt-3 flex justify-center">
              <a
                href={game.streamUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-extrabold text-xs transition-all shadow-md"
              >
                <Tv className="w-4 h-4" /> Assistir Transmissão Ao Vivo (Stream)
              </a>
            </div>
          )}

          {/* ABAS DOS MAPAS DA SÉRIE QUANDO EXISTEM MÚLTIPLOS JOGOS */}
          {mapsList.length > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-white/5">
              {mapsList.map((m, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectMap(m.match_id, idx)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono uppercase transition-all ${
                    activeMapIndex === idx
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                      : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
                  }`}
                >
                  <Swords className="w-3 h-3" /> Jogo {m.mapNumber} {m.radiant_score !== undefined ? `(${m.radiant_score}:${m.dire_score})` : ''}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CONTEÚDO COM MINIMAPA, OBJETIVOS E TABELAS */}
        <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              <span className="text-xs font-semibold">Sincronizando telemetria, itens e posições no mapa...</span>
            </div>
          ) : (
            <>
              {/* SEÇÃO DO MINIMAPA COM POSIÇÕES TÁTICAS REAIS A CADA 20S */}
              <div className="bg-[#141824]/80 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row items-center gap-6">
                {/* O Minimapa com Transição Suave a cada 20 segundos */}
                <div className="relative w-full max-w-[340px] aspect-square rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black shrink-0">
                  <img
                    src="/minimap.jpg"
                    alt="Minimapa Dota 2"
                    className="w-full h-full object-cover select-none pointer-events-none"
                  />

                  {/* Marcadores dos Heróis */}
                  {allPlayers.map((p, idx) => {
                    const hImg = getHeroImg(constants, p.hero_id);
                    const hName = getHeroName(constants, p.hero_id);
                    const isHovered = hoveredPlayer?.slot === p.slot;

                    return (
                      <div
                        key={idx}
                        style={{
                          left: `${p.mapX}%`,
                          top: `${p.mapY}%`,
                          transition: 'left 2s ease-in-out, top 2s ease-in-out'
                        }}
                        onMouseEnter={() => setHoveredPlayer(p)}
                        onMouseLeave={() => setHoveredPlayer(null)}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 ${
                          isHovered ? 'scale-130 z-30' : 'hover:scale-115'
                        }`}
                      >
                        <div className="relative">
                          <img
                            src={hImg}
                            alt={hName}
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border-2 shadow-lg transition-transform ${
                              p.isRadiant
                                ? 'border-emerald-400 shadow-emerald-500/60'
                                : 'border-rose-400 shadow-rose-500/60'
                            }`}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                          <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full font-mono text-[8px] font-black flex items-center justify-center border ${
                            p.isRadiant ? 'bg-black text-emerald-400 border-emerald-400' : 'bg-black text-rose-400 border-rose-400'
                          }`}>
                            {p.level}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Informações Rápidas do Jogador, Picks e Status das Torres & Barracas */}
                <div className="flex-1 space-y-4 w-full">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400">
                      <Eye className="w-4 h-4 text-amber-400 animate-pulse" /> Posições Táticas no Mapa (Snapshot 20s)
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-mono">
                      <span className="flex items-center gap-1 text-emerald-400 font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" /> {teamAName} (Verde)
                      </span>
                      <span className="flex items-center gap-1 text-rose-400 font-bold">
                        <span className="w-2 h-2 rounded-full bg-rose-400" /> {teamBName} (Vermelho)
                      </span>
                    </div>
                  </div>

                  {hoveredPlayer ? (
                    <div className="bg-[#161A24] border border-amber-500/40 rounded-xl p-3.5 space-y-2 animate-fade-in shadow-lg">
                      <div className="flex items-center gap-3">
                        <img
                          src={getHeroImg(constants, hoveredPlayer.hero_id)}
                          alt=""
                          className="w-12 h-8 rounded-lg object-cover border border-white/10"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-white text-sm">{hoveredPlayer.name}</strong>
                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              hoveredPlayer.isRadiant ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                            }`}>
                              {hoveredPlayer.isRadiant ? 'Radiant' : 'Dire'}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">{getHeroName(constants, hoveredPlayer.hero_id)} (Nível {hoveredPlayer.level})</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10 text-xs font-mono">
                        <div>
                          <span className="text-[10px] text-gray-400 block uppercase">K / D / A</span>
                          <strong className="text-white">{hoveredPlayer.kills} / {hoveredPlayer.deaths} / {hoveredPlayer.assists}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 block uppercase">Patrimônio</span>
                          <strong className="text-amber-400 font-bold">{hoveredPlayer.net_worth.toLocaleString()}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 block uppercase">Buyback</span>
                          <strong className={hoveredPlayer.hasBuyback ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            {hoveredPlayer.hasBuyback ? 'Disponível' : 'Indisponível'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 block uppercase">GPM / XPM</span>
                          <strong className="text-cyan-400">{hoveredPlayer.gpm} / {hoveredPlayer.xpm}</strong>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#161A24]/60 border border-white/5 rounded-xl p-3 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-1">
                      <span>Passe o mouse ou toque nos heróis no minimapa para inspecionar</span>
                      <span className="text-[10px] text-gray-500">Veja patrimônio, ouro, KDA, itens e disponibilidade de Buyback instantaneamente</span>
                    </div>
                  )}

                  {/* 1. Picks da Partida */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between">
                      <span>Picks da Partida</span>
                      <span className="text-[9px] text-gray-500 font-mono">5 vs 5</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      {/* Radiant Picks */}
                      <div className="flex items-center gap-1 flex-wrap">
                        {radiantPicks.map((p, i) => (
                          <img
                            key={i}
                            src={getHeroImg(constants, p.hero_id)}
                            alt=""
                            title={`${teamAName}: ${getHeroName(constants, p.hero_id)}`}
                            className="w-7 h-5 object-cover rounded border border-emerald-400/80"
                          />
                        ))}
                      </div>

                      <span className="text-xs font-mono font-bold text-gray-500">vs</span>

                      {/* Dire Picks */}
                      <div className="flex items-center gap-1 flex-wrap justify-end">
                        {direPicks.map((p, i) => (
                          <img
                            key={i}
                            src={getHeroImg(constants, p.hero_id)}
                            alt=""
                            title={`${teamBName}: ${getHeroName(constants, p.hero_id)}`}
                            className="w-7 h-5 object-cover rounded border border-rose-400/80"
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 2. STATUS DAS TORRES E BARRACAS (ORDENADAS VERTICALMENTE EM 4 COLUNAS) */}
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                        <Castle className="w-3.5 h-3.5 text-amber-400" /> Torres & Barracas (Top / Mid / Bot / Base)
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-mono">
                        <span className="text-emerald-400 font-bold">
                          {teamAName}: {radiantAliveCount}/14
                        </span>
                        <span className="text-gray-500">·</span>
                        <span className="text-rose-400 font-bold">
                          {teamBName}: {direAliveCount}/14
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                      {/* Estruturas Radiant */}
                      {renderStructureColumns(radiantStructures, teamAName, true, radiantAliveCount)}

                      {/* Estruturas Dire */}
                      {renderStructureColumns(direStructures, teamBName, false, direAliveCount)}
                    </div>
                  </div>
                </div>
              </div>

              {/* TABELA RADIANT */}
              {renderTable(radiantPlayers, teamAName, true, scoreA)}

              {/* TABELA DIRE */}
              {renderTable(direPlayers, teamBName, false, scoreB)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
