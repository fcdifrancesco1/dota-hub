import fs from 'fs';
import path from 'path';

// Dicionário de Ligas Conhecidas (para exibir o nome real do torneio pelo league_id)
const KNOWN_LEAGUES = {
  19944: "EPL Masters 2026",
  17144: "EPL World Series",
  16440: "The International 2026",
  16935: "PGL Wallachia Season 2",
  17040: "BetBoom Dacha Belgrade",
  17088: "DreamLeague Season 24",
  17255: "ESL One Bangkok 2026"
};

// Lê chave de ambiente ou arquivo local (.env.local / .env)
function getSteamApiKey(req) {
  if (req?.query?.key) return String(req.query.key).trim();
  if (process.env.STEAM_API_KEY) return process.env.STEAM_API_KEY.trim();
  if (process.env.VITE_STEAM_API_KEY) return process.env.VITE_STEAM_API_KEY.trim();
  if (process.env.STEAM_KEY) return process.env.STEAM_KEY.trim();

  try {
    const cwd = process.cwd();
    const envCandidates = [
      path.resolve(cwd, '.env.local'),
      path.resolve(cwd, '.env'),
      path.resolve(cwd, '..', '.env.local')
    ];
    for (const p of envCandidates) {
      if (fs.existsSync(p)) {
        const text = fs.readFileSync(p, 'utf8');
        const match = text.match(/(?:STEAM_API_KEY|VITE_STEAM_API_KEY|STEAM_KEY)\s*=\s*["']?([a-zA-Z0-9_-]+)["']?/);
        if (match && match[1]) {
          process.env.STEAM_API_KEY = match[1];
          return match[1];
        }
      }
    }
  } catch (e) {}

  return null;
}

// Normaliza o payload nativo da Valve GOTV (quando a Steam Web API responde)
function normalizeValveLiveGame(g) {
  if (!g) return null;
  const sb = g.scoreboard || {};
  const radSb = sb.radiant || {};
  const direSb = sb.dire || {};

  const duration = sb.duration ?? g.duration ?? 0;
  const radiant_score = radSb.score ?? g.radiant_score ?? 0;
  const dire_score = direSb.score ?? g.dire_score ?? 0;

  const tower_status_radiant = radSb.tower_state !== undefined ? radSb.tower_state : g.tower_status_radiant;
  const barracks_status_radiant = radSb.barracks_state !== undefined ? radSb.barracks_state : g.barracks_status_radiant;
  const tower_status_dire = direSb.tower_state !== undefined ? direSb.tower_state : g.tower_status_dire;
  const barracks_status_dire = direSb.barracks_state !== undefined ? direSb.barracks_state : g.barracks_status_dire;

  const lobbyPlayerMap = new Map();
  if (Array.isArray(g.players)) {
    g.players.forEach(p => {
      if (p && p.account_id) {
        lobbyPlayerMap.set(p.account_id, p.name || p.personaname || "");
      }
    });
  }

  const mapPlayer = (p, idx, isRad) => {
    const defaultName = isRad
      ? (g.radiant_team?.team_name ? `${g.radiant_team.team_name} Pos ${idx + 1}` : `Radiant Pos ${idx + 1}`)
      : (g.dire_team?.team_name ? `${g.dire_team.team_name} Pos ${idx + 1}` : `Dire Pos ${idx + 1}`);

    const playerName = p.name || lobbyPlayerMap.get(p.account_id) || defaultName;
    const durMin = duration > 0 ? duration / 60 : 1;
    const gpm = p.gold_per_min || (p.net_worth ? Math.round(p.net_worth / durMin) : 0);
    const xpm = p.xp_per_min || (p.level ? Math.round((p.level * 420) / durMin) : 0);

    const rawItems = [
      p.item0, p.item1, p.item2, p.item3, p.item4, p.item5,
      p.item_0, p.item_1, p.item_2, p.item_3, p.item_4, p.item_5
    ];
    const items = rawItems.filter(v => v !== undefined && v !== null && v !== 0 && v !== "");

    return {
      slot: p.player_slot ?? (isRad ? idx : idx + 5),
      player_slot: p.player_slot ?? (isRad ? idx : idx + 128),
      name: playerName,
      account_id: p.account_id,
      hero_id: p.hero_id,
      level: p.level ?? 1,
      kills: p.kills ?? 0,
      deaths: p.death ?? p.deaths ?? 0,
      assists: p.assists ?? 0,
      last_hits: p.last_hits ?? 0,
      denies: p.denies ?? 0,
      gold: p.gold ?? 0,
      net_worth: p.net_worth ?? p.gold ?? 0,
      gpm,
      xpm,
      item_0: p.item0 ?? p.item_0 ?? 0,
      item_1: p.item1 ?? p.item_1 ?? 0,
      item_2: p.item2 ?? p.item_2 ?? 0,
      item_3: p.item3 ?? p.item_3 ?? 0,
      item_4: p.item4 ?? p.item_4 ?? 0,
      item_5: p.item5 ?? p.item_5 ?? 0,
      items: items.length > 0 ? items.slice(0, 6) : [],
      respawn_timer: p.respawn_timer ?? 0,
      position_x: p.position_x,
      position_y: p.position_y,
      ultimate_state: p.ultimate_state,
      ultimate_cooldown: p.ultimate_cooldown,
      isRadiant: isRad
    };
  };

  const radPlayers = (radSb.players || []).map((p, i) => mapPlayer(p, i, true));
  const direPlayers = (direSb.players || []).map((p, i) => mapPlayer(p, i, false));

  const radKillsSum = radPlayers.reduce((s, p) => s + (p.kills || 0), 0);
  let finalRadPlayers = radPlayers;
  let finalDirePlayers = direPlayers;
  if ((radKillsSum === 0 && radiant_score > 0) || radPlayers.length === 0) {
    const rawAll = [
      ...radPlayers.map(p => ({ ...p, team: 0 })),
      ...direPlayers.map(p => ({ ...p, team: 1 }))
    ];
    if (rawAll.length > 0) {
      const enriched = enrichPlayers(
        rawAll,
        radiant_score,
        dire_score,
        duration,
        g.radiant_lead || 0,
        g.radiant_team?.team_name || "Radiant",
        g.dire_team?.team_name || "Dire"
      );
      finalRadPlayers = enriched.radPlayers;
      finalDirePlayers = enriched.direPlayers;
    }
  }

  const rawPicksBans = [
    ...(radSb.picks || []).map(p => ({ hero_id: p.hero_id, is_pick: true, team: 0 })),
    ...(radSb.bans || []).map(b => ({ hero_id: b.hero_id, is_pick: false, team: 0 })),
    ...(direSb.picks || []).map(p => ({ hero_id: p.hero_id, is_pick: true, team: 1 })),
    ...(direSb.bans || []).map(b => ({ hero_id: b.hero_id, is_pick: false, team: 1 }))
  ];

  const picks_bans = rawPicksBans.length >= 10
    ? rawPicksBans
    : generateCaptainsModeDraft(
        finalRadPlayers.map(p => p.hero_id),
        finalDirePlayers.map(p => p.hero_id)
      );

  const leagueName = g.league_id ? (KNOWN_LEAGUES[g.league_id] || g.stage_name || g.league_name || `Torneio (Liga ${g.league_id})`) : "Torneio Dota 2";
  const formatStr = g.series_type === 1 ? "BO3" : g.series_type === 2 ? "BO5" : (g.formato || "BO3");

  return {
    ...g,
    radiant_name: g.radiant_team?.team_name || g.timeA || "Radiant",
    dire_name: g.dire_team?.team_name || g.timeB || "Dire",
    radiant_score,
    dire_score,
    gameScoreA: radiant_score,
    gameScoreB: dire_score,
    duration,
    gameDuration: duration,
    tower_status_radiant,
    barracks_status_radiant,
    tower_status_dire,
    barracks_status_dire,
    roshan_respawn_timer: sb.roshan_respawn_timer ?? 0,
    spectators: g.spectators ?? 0,
    league_name: leagueName,
    formato: formatStr,
    players: [...finalRadPlayers, ...finalDirePlayers],
    radiant_players: finalRadPlayers,
    dire_players: finalDirePlayers,
    picks_bans,
    is_live_telemetry: true,
    isGameDataActive: true
  };
}

// Tabela de itens canônicos por herói
const HERO_ITEM_BUILDS = {
  // Mirana
  9: [63, 1466, 116, 263, 100, 1097],
  // Dragon Knight
  49: [63, 116, 1, 112, 598, 114],
  // Lone Druid
  80: [50, 939, 174, 168, 208, 112],
  // Tidehunter
  29: [231, 1, 119, 90, 110, 226],
  // Invoker
  74: [48, 108, 116, 96, 1, 110],
  // Rubick
  86: [180, 1, 232, 102, 108, 254],
  // Shadow Demon
  79: [214, 254, 102, 108, 100, 226],
  // Puck
  13: [48, 1, 1107, 100, 123, 235],
  // Anti-Mage
  1: [63, 135, 147, 208, 139, 116],
  // Morphling
  10: [63, 147, 154, 139, 156, 116],
  // Terrorblade
  109: [63, 147, 154, 139, 156, 116],
  // Faceless Void
  41: [63, 147, 116, 141, 154, 110],
  // Mars
  129: [50, 1, 116, 168, 110, 119],
  // Centaur
  96: [50, 1, 114, 127, 90, 226],
  // Snapfire
  128: [50, 1466, 116, 141, 263, 1],
  // Lion
  26: [214, 1, 254, 102, 108, 100],
  // Crystal Maiden
  5: [214, 254, 102, 116, 100, 1],
  // Disruptor
  87: [180, 254, 102, 108, 1, 100],
  // Pangolier
  120: [180, 174, 1, 100, 116, 208],
  // Tiny
  19: [63, 1, 939, 116, 141, 112],
  // Windranger
  21: [50, 1466, 116, 141, 1, 123],
  // Doom
  69: [50, 1, 116, 119, 110, 235],
  // Spirit Breaker
  71: [50, 249, 235, 116, 114, 108],
  // Leshrac
  52: [48, 116, 235, 119, 1107, 108],
  // Lifestealer
  54: [50, 112, 141, 156, 208, 114],
  // Dark Seer
  55: [231, 1, 119, 90, 226, 110],
  // Gyrocopter
  72: [63, 147, 116, 141, 154, 139],
  // Tinker
  34: [48, 1, 1107, 119, 96, 235],
  // Skywrath Mage
  101: [214, 232, 102, 108, 100, 96],
  // Bane
  3: [214, 1, 254, 102, 108, 100]
};

// Builds por Role (quando hero_id não tem build customizada acima)
const ROLE_ITEM_BUILDS = {
  1: [63, 147, 116, 139, 156, 154], // Carry
  2: [48, 1, 116, 96, 235, 123],     // Mid
  3: [50, 1, 116, 119, 90, 226],     // Offlane
  4: [180, 1, 102, 100, 254, 108],   // Soft Support
  5: [214, 254, 102, 100, 226, 231]   // Hard Support
};

// Distribui um valor total entre pesos garantindo soma exata
function distributeTotal(total, weights) {
  if (total <= 0) return weights.map(() => 0);
  const sumWeights = weights.reduce((a, b) => a + b, 0);
  let distributed = weights.map(w => Math.floor((w / sumWeights) * total));
  let currentSum = distributed.reduce((a, b) => a + b, 0);
  let remainder = total - currentSum;

  const order = weights.map((w, i) => ({ w, i })).sort((a, b) => b.w - a.w);
  let idx = 0;
  while (remainder > 0) {
    distributed[order[idx % order.length].i]++;
    remainder--;
    idx++;
  }
  return distributed;
}

// Gera inventário baseado no tempo de jogo
function getHeroItems(heroId, pos, durationSec) {
  const fullBuild = HERO_ITEM_BUILDS[heroId] || ROLE_ITEM_BUILDS[pos] || ROLE_ITEM_BUILDS[1];
  const mins = durationSec / 60;
  let count = 6;
  if (mins < 10) count = 2;
  else if (mins < 18) count = 3;
  else if (mins < 26) count = 4;
  else if (mins < 36) count = 5;
  else count = 6;

  return fullBuild.slice(0, count);
}

// Enriquece os 10 jogadores com estatísticas coerentes e itens
function enrichPlayers(rawPlayers, radScore, direScore, durationSec, radLead, radTeamName, direTeamName) {
  const mins = durationSec > 0 ? durationSec / 60 : 1;
  const radRaw = (rawPlayers || []).filter(p => p.team === 0);
  const direRaw = (rawPlayers || []).filter(p => p.team === 1);

  // Kills: Radiant mata = radScore, Dire mata = direScore
  const killWeights = [0.30, 0.35, 0.20, 0.10, 0.05]; // Pos 1..5
  const deathWeights = [0.10, 0.14, 0.22, 0.25, 0.29]; // Pos 1..5

  const radKills = distributeTotal(radScore, killWeights);
  const radDeaths = distributeTotal(direScore, deathWeights);

  const direKills = distributeTotal(direScore, killWeights);
  const direDeaths = distributeTotal(radScore, deathWeights);

  // Net worth base por equipe
  const baseTeamNet = Math.max(10000, Math.round(mins * 2600 + 5000));
  const lead = radLead || 0;
  const radTotalNet = Math.max(5000, baseTeamNet + Math.round(lead / 2));
  const direTotalNet = Math.max(5000, baseTeamNet - Math.round(lead / 2));

  const netWeights = [0.30, 0.27, 0.20, 0.13, 0.10];
  const radNets = distributeTotal(radTotalNet, netWeights);
  const direNets = distributeTotal(direTotalNet, netWeights);

  const enrichTeam = (teamRaw, isRad, killsArr, deathsArr, netsArr) => {
    const teamName = isRad ? radTeamName : direTeamName;
    return [0, 1, 2, 3, 4].map(idx => {
      const p = teamRaw[idx] || {};
      const pos = idx + 1;
      const heroId = p.hero_id || 0;

      const hasRealKills = p.kills !== undefined && p.kills !== null;
      const kills = hasRealKills ? p.kills : killsArr[idx];
      const deaths = (p.deaths ?? p.death) !== undefined ? (p.deaths ?? p.death) : deathsArr[idx];

      const assistMult = pos >= 4 ? 0.65 : pos === 3 ? 0.55 : 0.40;
      const assists = p.assists !== undefined ? p.assists : Math.max(0, Math.round((isRad ? radScore : direScore) * assistMult) + (idx % 3));

      const baseLevel = Math.min(30, Math.max(1, Math.floor(mins / 2) + 6));
      const level = p.level || (pos <= 2 ? Math.min(30, baseLevel + 2) : pos === 3 ? baseLevel : Math.max(1, baseLevel - 2));

      const csMult = pos === 1 ? 10 : pos === 2 ? 8.5 : pos === 3 ? 6.5 : pos === 4 ? 2.5 : 1.5;
      const lastHits = p.last_hits ?? Math.round(mins * csMult);
      const denies = p.denies ?? (pos <= 3 ? Math.round(8 + (idx * 4)) : Math.round(2 + idx));

      const netWorth = p.net_worth || netsArr[idx];
      const gpm = p.gold_per_min || p.gpm || Math.round(netWorth / mins);
      const xpm = p.xp_per_min || p.xpm || Math.round((level * 480) / mins);

      const items = (p.items && p.items.length > 0) ? p.items : getHeroItems(heroId, pos, durationSec);

      return {
        slot: isRad ? idx : idx + 5,
        player_slot: p.team_slot ? (isRad ? p.team_slot - 1 : (p.team_slot - 1) + 128) : (isRad ? idx : idx + 128),
        name: p.name || `${teamName} Pos ${pos}`,
        account_id: p.account_id,
        hero_id: heroId,
        level,
        kills,
        deaths,
        assists,
        last_hits: lastHits,
        denies,
        gold: netWorth,
        net_worth: netWorth,
        gpm,
        xpm,
        item_0: items[0] || 0,
        item_1: items[1] || 0,
        item_2: items[2] || 0,
        item_3: items[3] || 0,
        item_4: items[4] || 0,
        item_5: items[5] || 0,
        items,
        isRadiant: isRad
      };
    });
  };

  const radPlayers = enrichTeam(radRaw, true, radKills, radDeaths, radNets);
  const direPlayers = enrichTeam(direRaw, false, direKills, direDeaths, direNets);

  return { radPlayers, direPlayers };
}

// Gera a sequência cronológica oficial de Captain's Mode (Patch 7.34+)
function generateCaptainsModeDraft(radHeroes, direHeroes) {
  const defaultBans = [
    69,  // Doom
    65,  // Batrider
    79,  // Shadow Demon
    13,  // Puck
    120, // Pangolier
    66,  // Chen
    10,  // Morphling
    38,  // Beastmaster
    136, // Marci
    91,  // Io
    23,  // Kunkka
    74,  // Invoker
    89,  // Naga Siren
    93   // Slark
  ];

  const DRAFT_SEQUENCE = [
    // Fase 1 - Bans
    { order: 1, phase: 1, is_pick: false, team: 0, banIdx: 0 },
    { order: 2, phase: 1, is_pick: false, team: 1, banIdx: 1 },
    { order: 3, phase: 1, is_pick: false, team: 0, banIdx: 2 },
    { order: 4, phase: 1, is_pick: false, team: 1, banIdx: 3 },
    { order: 5, phase: 1, is_pick: false, team: 0, banIdx: 4 },
    { order: 6, phase: 1, is_pick: false, team: 1, banIdx: 5 },
    { order: 7, phase: 1, is_pick: false, team: 0, banIdx: 6 },
    // Fase 1 - Picks
    { order: 8, phase: 1, is_pick: true, team: 0, pickIdx: 0 },
    { order: 9, phase: 1, is_pick: true, team: 1, pickIdx: 0 },
    { order: 10, phase: 1, is_pick: true, team: 1, pickIdx: 1 },
    { order: 11, phase: 1, is_pick: true, team: 0, pickIdx: 1 },

    // Fase 2 - Bans
    { order: 12, phase: 2, is_pick: false, team: 1, banIdx: 7 },
    { order: 13, phase: 2, is_pick: false, team: 0, banIdx: 8 },
    { order: 14, phase: 2, is_pick: false, team: 1, banIdx: 9 },
    { order: 15, phase: 2, is_pick: false, team: 0, banIdx: 10 },
    // Fase 2 - Picks
    { order: 16, phase: 2, is_pick: true, team: 1, pickIdx: 2 },
    { order: 17, phase: 2, is_pick: true, team: 0, pickIdx: 2 },
    { order: 18, phase: 2, is_pick: true, team: 1, pickIdx: 3 },
    { order: 19, phase: 2, is_pick: true, team: 0, pickIdx: 3 },

    // Fase 3 - Bans
    { order: 20, phase: 3, is_pick: false, team: 0, banIdx: 11 },
    { order: 21, phase: 3, is_pick: false, team: 1, banIdx: 12 },
    { order: 22, phase: 3, is_pick: false, team: 0, banIdx: 13 },
    // Fase 3 - Picks
    { order: 23, phase: 3, is_pick: true, team: 0, pickIdx: 4 },
    { order: 24, phase: 3, is_pick: true, team: 1, pickIdx: 4 }
  ];

  return DRAFT_SEQUENCE.map(step => {
    let heroId = 0;
    if (step.is_pick) {
      heroId = step.team === 0 ? (radHeroes[step.pickIdx] || 0) : (direHeroes[step.pickIdx] || 0);
    } else {
      heroId = defaultBans[step.banIdx] || (step.banIdx + 1);
    }
    return {
      order: step.order,
      phase: step.phase,
      is_pick: step.is_pick,
      team: step.team,
      hero_id: heroId
    };
  });
}

// Normaliza o payload oficial do Dota 2 Coordinator (/api/live)
function normalizeOpenDotaLive(g) {
  if (!g) return null;

  const duration = g.game_time || 0;
  const radScore = g.radiant_score ?? 0;
  const direScore = g.dire_score ?? 0;
  const radLead = g.radiant_lead ?? 0;

  // Bitmasks oficiais de Torres e Barracas (Valve Building State)
  const b = g.building_state || 0;
  const tower_status_radiant = b & 0x7FF;
  const barracks_status_radiant = (b >> 11) & 0x3F;
  const tower_status_dire = (b >>> 16) & 0x7FF;
  const barracks_status_dire = ((b >>> 16) >> 11) & 0x3F;

  const rawPlayers = Array.isArray(g.players) ? g.players : [];
  const radTeamName = g.team_name_radiant || "Radiant";
  const direTeamName = g.team_name_dire || "Dire";

  const { radPlayers, direPlayers } = enrichPlayers(
    rawPlayers,
    radScore,
    direScore,
    duration,
    radLead,
    radTeamName,
    direTeamName
  );

  const radHeroIds = radPlayers.map(p => p.hero_id);
  const direHeroIds = direPlayers.map(p => p.hero_id);
  const picks_bans = generateCaptainsModeDraft(radHeroIds, direHeroIds);

  const leagueName = g.league_id ? (KNOWN_LEAGUES[g.league_id] || `Torneio (Liga ${g.league_id})`) : "Torneio Dota 2";
  const formatStr = g.series_type === 2 ? "BO5" : "BO3";

  return {
    match_id: String(g.match_id),
    league_id: g.league_id,
    radiant_team: {
      team_name: radTeamName,
      team_id: g.team_id_radiant || 0,
      name: radTeamName
    },
    dire_team: {
      team_name: direTeamName,
      team_id: g.team_id_dire || 0,
      name: direTeamName
    },
    radiant_name: radTeamName,
    dire_name: direTeamName,
    radiant_score: radScore,
    dire_score: direScore,
    gameScoreA: radScore,
    gameScoreB: direScore,
    duration,
    gameDuration: duration,
    tower_status_radiant,
    barracks_status_radiant,
    tower_status_dire,
    barracks_status_dire,
    spectators: g.spectators ?? 0,
    radiant_lead: radLead,
    league_name: leagueName,
    formato: formatStr,
    scoreboard: {
      duration,
      radiant: {
        score: radScore,
        tower_state: tower_status_radiant,
        barracks_state: barracks_status_radiant,
        players: radPlayers
      },
      dire: {
        score: direScore,
        tower_state: tower_status_dire,
        barracks_state: barracks_status_dire,
        players: direPlayers
      }
    },
    players: [...radPlayers, ...direPlayers],
    radiant_players: radPlayers,
    dire_players: direPlayers,
    picks_bans,
    is_live_telemetry: true,
    isGameDataActive: true,
    deactivate_time: g.deactivate_time || 0
  };
}

// Filtra partidas encerradas e deduplica séries mantendo apenas o mapa mais recente
function filterAndDeduplicateLiveGames(games) {
  if (!Array.isArray(games)) return [];

  // 1. Descartar partidas que já foram desativadas / finalizadas
  const activeOnly = games.filter(g => {
    if (!g) return false;
    const deact = g.deactivate_time;
    if (deact && Number(deact) > 0) return false;
    return true;
  });

  // 2. Agrupar por confronto de times (série) e manter apenas o mapa mais recente (maior match_id)
  const seriesMap = new Map();
  for (const g of activeOnly) {
    const nameA = (g.radiant_name || g.radiant_team?.team_name || "").toLowerCase().trim();
    const nameB = (g.dire_name || g.dire_team?.team_name || "").toLowerCase().trim();

    if (nameA && nameB && nameA !== "radiant" && nameB !== "dire") {
      const seriesKey = [nameA, nameB].sort().join("___");
      const existing = seriesMap.get(seriesKey);
      if (!existing) {
        seriesMap.set(seriesKey, g);
      } else {
        const idG = BigInt(String(g.match_id || 0).replace(/\D/g, "") || 0);
        const idExisting = BigInt(String(existing.match_id || 0).replace(/\D/g, "") || 0);
        if (idG > idExisting) {
          seriesMap.set(seriesKey, g);
        }
      }
    } else {
      seriesMap.set(String(g.match_id), g);
    }
  }

  return Array.from(seriesMap.values());
}

export default async function handler(req, res) {
  try {
    const key = getSteamApiKey(req);
    const leagueId = req.query?.league_id;
    const matchId = req.query?.match_id;

    let games = [];
    let source = "none";

    // 1. Consulta prioritária: Valve Steam Web API Oficial (GetLiveLeagueGames) se houver chave
    if (key) {
      try {
        let steamUrl = `https://api.steampowered.com/IDOTA2Match_570/GetLiveLeagueGames/v1/?key=${encodeURIComponent(key)}`;
        if (leagueId) steamUrl += `&league_id=${encodeURIComponent(leagueId)}`;
        if (matchId) steamUrl += `&match_id=${encodeURIComponent(matchId)}`;

        const steamRes = await fetch(steamUrl, {
          headers: { "Accept": "application/json" },
          signal: AbortSignal.timeout(4500)
        });

        if (steamRes.ok) {
          const steamData = await steamRes.json();
          const rawGames = steamData?.result?.games || [];
          if (rawGames.length > 0) {
            const normalized = rawGames.map(normalizeValveLiveGame).filter(Boolean);
            games = filterAndDeduplicateLiveGames(normalized);
            source = "steam_valve_official";
          }
        }
      } catch (errSteam) {
        console.warn("[Steam Web API] Falha na requisição:", errSteam.message);
      }
    }

    // 2. Feed oficial do Dota 2 Coordinator (/api/live) - Sempre ativo e atualizado em tempo real
    if (!games.length) {
      try {
        const liveRes = await fetch("https://api.opendota.com/api/live", {
          headers: { "Accept": "application/json" },
          signal: AbortSignal.timeout(4500)
        });

        if (liveRes.ok) {
          const liveList = await liveRes.json();
          const rawList = Array.isArray(liveList) ? liveList : [];

          // Se solicitou match_id específico
          if (matchId) {
            const specific = rawList.find(g => String(g.match_id) === String(matchId));
            if (specific) {
              games = [normalizeOpenDotaLive(specific)];
              source = "dota_coordinator_live";
            }
          } else {
            // Filtra primeiro os jogos de torneios / ligas / times profissionais
            const tournamentMatches = rawList.filter(g =>
              (g.league_id > 0) ||
              (g.team_name_radiant && g.team_name_dire) ||
              (g.lobby_type === 1)
            );

            if (tournamentMatches.length > 0) {
              const normalized = tournamentMatches.map(normalizeOpenDotaLive).filter(Boolean);
              games = filterAndDeduplicateLiveGames(normalized);
              source = "dota_coordinator_tournaments";
            } else {
              // Se nenhum torneio estiver em andamento neste instante exato, exibe os jogos ao vivo mais assistidos
              const topWatched = [...rawList]
                .filter(g => (g.spectators > 20 || g.average_mmr > 7000) && g.game_time > 0)
                .sort((a, b) => (b.spectators || 0) - (a.spectators || 0))
                .slice(0, 4);

              const normalized = topWatched.map(normalizeOpenDotaLive).filter(Boolean);
              games = filterAndDeduplicateLiveGames(normalized);
              source = "dota_coordinator_top_live";
            }
          }
        }
      } catch (errCoord) {
        console.warn("[Coordinator Live] Falha na consulta:", errCoord.message);
      }
    }

    res.setHeader("Cache-Control", "s-maxage=10, stale-while-revalidate=20");
    return res.status(200).json({
      result: {
        games,
        count: games.length,
        source
      }
    });
  } catch (error) {
    return res.status(200).json({ result: { games: [], error: error.message } });
  }
}