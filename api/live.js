import fs from 'fs';
import path from 'path';

// Dicionário de Ligas Conhecidas (para exibir o nome real do torneio pelo league_id)
const KNOWN_LEAGUES = {
  20279: "PGL Wallachia Season 9",
  20176: "BetBoom Streamers Battle 15",
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

  let finalRadPlayers = radPlayers;
  let finalDirePlayers = direPlayers;
  if (radPlayers.length === 0 && Array.isArray(g.players) && g.players.length > 0) {
    const mapped = mapCoordinatorPlayers(
      g.players,
      g.radiant_team?.team_name || "Radiant",
      g.dire_team?.team_name || "Dire"
    );
    finalRadPlayers = mapped.radPlayers;
    finalDirePlayers = mapped.direPlayers;
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

// Mapeia os 10 jogadores a partir do feed do Coordinator ou Valve sem inventar estatísticas fictícias
function mapCoordinatorPlayers(rawPlayers, radTeamName, direTeamName) {
  const radRaw = (rawPlayers || []).filter(p => p.team === 0 || (p.team_slot && p.team_slot <= 5 && p.team === undefined));
  const direRaw = (rawPlayers || []).filter(p => p.team === 1 || (p.team_slot && p.team_slot > 5 && p.team === undefined));

  // Ordena pelo slot de equipe oficial (team_slot 1..5)
  const sortBySlot = (a, b) => (a.team_slot || 0) - (b.team_slot || 0);
  radRaw.sort(sortBySlot);
  direRaw.sort(sortBySlot);

  const mapTeam = (teamList, isRad) => {
    const teamName = isRad ? radTeamName : direTeamName;
    return teamList.map((p, idx) => {
      const slotNum = p.team_slot || (idx + 1);
      const heroId = p.hero_id || 0;
      const playerName = p.name || p.personaname || `${teamName} Jogador ${slotNum}`;

      const hasRealKills = p.kills !== undefined && p.kills !== null;
      const hasRealDeaths = (p.deaths ?? p.death) !== undefined && (p.deaths ?? p.death) !== null;
      const hasRealAssists = p.assists !== undefined && p.assists !== null;
      const hasRealLH = p.last_hits !== undefined && p.last_hits !== null;
      const hasRealDN = p.denies !== undefined && p.denies !== null;
      const hasRealNet = (p.net_worth || p.gold) !== undefined && (p.net_worth || p.gold) !== null;
      const hasRealGpm = (p.gold_per_min || p.gpm) !== undefined && (p.gold_per_min || p.gpm) !== null;
      const hasRealXpm = (p.xp_per_min || p.xpm) !== undefined && (p.xp_per_min || p.xpm) !== null;

      const rawItems = [
        p.item0, p.item1, p.item2, p.item3, p.item4, p.item5,
        p.item_0, p.item_1, p.item_2, p.item_3, p.item_4, p.item_5,
        ...(Array.isArray(p.items) ? p.items : [])
      ].filter(v => v !== undefined && v !== null && v !== 0 && v !== "");

      return {
        slot: isRad ? idx : idx + 5,
        team_slot: slotNum,
        player_slot: isRad ? (slotNum - 1) : (slotNum - 1) + 128,
        name: playerName,
        account_id: p.account_id,
        hero_id: heroId,
        level: p.level ?? null,
        kills: hasRealKills ? p.kills : null,
        deaths: hasRealDeaths ? (p.deaths ?? p.death) : null,
        assists: hasRealAssists ? p.assists : null,
        last_hits: hasRealLH ? p.last_hits : null,
        denies: hasRealDN ? p.denies : null,
        net_worth: hasRealNet ? (p.net_worth || p.gold) : null,
        gold: hasRealNet ? (p.net_worth || p.gold) : null,
        gpm: hasRealGpm ? (p.gold_per_min || p.gpm) : null,
        xpm: hasRealXpm ? (p.xp_per_min || p.xpm) : null,
        item_0: rawItems[0] || null,
        item_1: rawItems[1] || null,
        item_2: rawItems[2] || null,
        item_3: rawItems[3] || null,
        item_4: rawItems[4] || null,
        item_5: rawItems[5] || null,
        items: rawItems,
        isRadiant: isRad,
        is_pro: Boolean(p.is_pro),
        country_code: p.country_code || null
      };
    });
  };

  return {
    radPlayers: mapTeam(radRaw, true),
    direPlayers: mapTeam(direRaw, false)
  };
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

// Decodifica o building_state de 32 bits do Dota 2 Coordinator (CMsgConnectedPlayers)
// para as bitmasks oficiais da Valve (11 bits para torres, 6 bits para barracas)
function decodeBuildingState(b, duration = 0) {
  // Antes do início oficial da partida (fase de draft ou pre-horn, tempo <= 0), todas as estruturas estão 100% de pé
  if (duration <= 0 || !b) {
    return {
      tower_status_radiant: 2047,
      barracks_status_radiant: 63,
      tower_status_dire: 2047,
      barracks_status_dire: 63
    };
  }

  function decodeTeam(mask) {
    // Se a máscara for 0 ou 0x49 (estado inicial padrão onde todas as T1 estão ativas), todas as 11 torres e 6 barracas estão de pé
    if (!mask || mask === 0x49) {
      return { tower_status: 2047, barracks_status: 63 };
    }

    let tower = 0;
    let rax = 0;
    let anyBreached = false;

    // As 3 lanes: 0: TOP, 1: MID, 2: BOT
    for (let lane = 0; lane < 3; lane++) {
      const bits = (mask >> (lane * 3)) & 7;
      let t1 = true, t2 = true, t3 = true, rMelee = true, rRanged = true;

      if (bits === 1) {
        // 001: T1 de pé e ativa -> todas as 3 torres e barracas da lane intactas
        t1 = true; t2 = true; t3 = true;
      } else if (bits === 2) {
        // 010: T1 caiu, T2 na linha de frente intacta
        t1 = false; t2 = true; t3 = true;
      } else if (bits === 3 || bits === 4 || bits === 5 || bits === 6) {
        // T1 e T2 caíram, T3 de pé
        t1 = false; t2 = false; t3 = true;
      } else if (bits === 7 || bits === 0) {
        // 111 ou 000: T1, T2 e T3 caíram (lane invadida)
        t1 = false; t2 = false; t3 = false;
        rMelee = false;
        rRanged = false;
        anyBreached = true;
      }

      const t1Bit = lane * 3;
      const t2Bit = lane * 3 + 1;
      const t3Bit = lane * 3 + 2;
      const rMBit = lane * 2;
      const rRBit = lane * 2 + 1;

      if (t1) tower |= (1 << t1Bit);
      if (t2) tower |= (1 << t2Bit);
      if (t3) tower |= (1 << t3Bit);
      if (rMelee) rax |= (1 << rMBit);
      if (rRanged) rax |= (1 << rRBit);
    }

    // Torres T4 da Base (bits 9 e 10)
    // No Dota 2, as T4 são invulneráveis enquanto nenhuma lane teve T3 derrubada
    if (!anyBreached) {
      tower |= (1 << 9) | (1 << 10);
    } else {
      const t4Bits = (mask >> 9) & 3;
      if (t4Bits === 3) {
        tower |= (1 << 9) | (1 << 10);
      } else if (t4Bits === 1) {
        tower |= (1 << 9);
      } else if (t4Bits === 2) {
        tower |= (1 << 10);
      } else {
        tower |= (1 << 9) | (1 << 10);
      }
    }

    return { tower_status: tower, barracks_status: rax };
  }

  const rad = decodeTeam(b & 0xFFFF);
  const dire = decodeTeam((b >>> 16) & 0xFFFF);

  return {
    tower_status_radiant: rad.tower_status,
    barracks_status_radiant: rad.barracks_status,
    tower_status_dire: dire.tower_status,
    barracks_status_dire: dire.barracks_status
  };
}

// Normaliza o payload oficial do Dota 2 Coordinator (/api/live)
function normalizeOpenDotaLive(g) {
  if (!g) return null;

  const duration = g.game_time || 0;
  const radScore = g.radiant_score ?? 0;
  const direScore = g.dire_score ?? 0;
  const radLead = g.radiant_lead ?? 0;

  // Decodifica bitmasks oficiais de Torres e Barracas da Valve a partir do building_state do Coordinator
  const b = g.building_state || 0;
  const {
    tower_status_radiant,
    barracks_status_radiant,
    tower_status_dire,
    barracks_status_dire
  } = decodeBuildingState(b, duration);

  const rawPlayers = Array.isArray(g.players) ? g.players : [];
  const radTeamName = g.team_name_radiant || "Radiant";
  const direTeamName = g.team_name_dire || "Dire";

  const { radPlayers, direPlayers } = mapCoordinatorPlayers(
    rawPlayers,
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

// Normaliza partida já finalizada ou com replay indexado pela OpenDota
function normalizeFinishedMatch(m) {
  if (!m || !m.match_id) return null;
  const radPlayers = (m.players || []).filter(p => p.player_slot < 128).map((p, idx) => ({
    slot: idx,
    team_slot: idx + 1,
    player_slot: p.player_slot,
    name: p.personaname || p.name || `${m.radiant_name || "Radiant"} Pos ${idx + 1}`,
    account_id: p.account_id,
    hero_id: p.hero_id,
    level: p.level ?? null,
    kills: p.kills ?? 0,
    deaths: p.deaths ?? 0,
    assists: p.assists ?? 0,
    last_hits: p.last_hits ?? 0,
    denies: p.denies ?? 0,
    net_worth: p.net_worth || p.total_gold || 0,
    gold: p.gold ?? 0,
    gpm: p.gold_per_min || 0,
    xpm: p.xp_per_min || 0,
    item_0: p.item_0 || null,
    item_1: p.item_1 || null,
    item_2: p.item_2 || null,
    item_3: p.item_3 || null,
    item_4: p.item_4 || null,
    item_5: p.item_5 || null,
    items: [p.item_0, p.item_1, p.item_2, p.item_3, p.item_4, p.item_5].filter(Boolean),
    isRadiant: true
  }));

  const direPlayers = (m.players || []).filter(p => p.player_slot >= 128).map((p, idx) => ({
    slot: idx + 5,
    team_slot: idx + 1,
    player_slot: p.player_slot,
    name: p.personaname || p.name || `${m.dire_name || "Dire"} Pos ${idx + 1}`,
    account_id: p.account_id,
    hero_id: p.hero_id,
    level: p.level ?? null,
    kills: p.kills ?? 0,
    deaths: p.deaths ?? 0,
    assists: p.assists ?? 0,
    last_hits: p.last_hits ?? 0,
    denies: p.denies ?? 0,
    net_worth: p.net_worth || p.total_gold || 0,
    gold: p.gold ?? 0,
    gpm: p.gold_per_min || 0,
    xpm: p.xp_per_min || 0,
    item_0: p.item_0 || null,
    item_1: p.item_1 || null,
    item_2: p.item_2 || null,
    item_3: p.item_3 || null,
    item_4: p.item_4 || null,
    item_5: p.item_5 || null,
    items: [p.item_0, p.item_1, p.item_2, p.item_3, p.item_4, p.item_5].filter(Boolean),
    isRadiant: false
  }));

  const picks_bans = (m.picks_bans || []).map(pb => ({
    is_pick: Boolean(pb.is_pick),
    hero_id: pb.hero_id,
    team: pb.team,
    order: pb.order
  }));

  return {
    match_id: String(m.match_id),
    league_id: m.leagueid,
    radiant_name: m.radiant_name || m.radiant_team?.name || "Radiant",
    dire_name: m.dire_name || m.dire_team?.name || "Dire",
    radiant_score: m.radiant_score ?? 0,
    dire_score: m.dire_score ?? 0,
    gameScoreA: m.radiant_score ?? 0,
    gameScoreB: m.dire_score ?? 0,
    duration: m.duration ?? 0,
    gameDuration: m.duration ?? 0,
    tower_status_radiant: m.tower_status_radiant ?? 0,
    barracks_status_radiant: m.barracks_status_radiant ?? 0,
    tower_status_dire: m.tower_status_dire ?? 0,
    barracks_status_dire: m.barracks_status_dire ?? 0,
    scoreboard: {
      duration: m.duration ?? 0,
      radiant: {
        score: m.radiant_score ?? 0,
        players: radPlayers
      },
      dire: {
        score: m.dire_score ?? 0,
        players: direPlayers
      }
    },
    players: [...radPlayers, ...direPlayers],
    radiant_players: radPlayers,
    dire_players: direPlayers,
    picks_bans,
    is_live_telemetry: false,
    is_finished: true,
    radiant_win: m.radiant_win
  };
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
              const liveGame = normalizeOpenDotaLive(specific);

              // Tenta complementar com estatísticas detalhadas se a partida já tiver sido indexada/concluída
              try {
                const matchDetailRes = await fetch(`https://api.opendota.com/api/matches/${matchId}`, {
                  headers: { "Accept": "application/json" },
                  signal: AbortSignal.timeout(2000)
                });
                if (matchDetailRes.ok) {
                  const mData = await matchDetailRes.json();
                  if (mData && Array.isArray(mData.players) && mData.players.length === 10) {
                    const finished = normalizeFinishedMatch(mData);
                    if (finished) {
                      games = [finished];
                      source = "opendota_match_details";
                    }
                  }
                }
              } catch (_) {}

              if (!games.length) {
                games = [liveGame];
                source = "dota_coordinator_live";
              }
            } else {
              // Se não estiver mais na lista de live (ex: partida encerrou), busca direto do endpoint de matches
              try {
                const matchDetailRes = await fetch(`https://api.opendota.com/api/matches/${matchId}`, {
                  headers: { "Accept": "application/json" },
                  signal: AbortSignal.timeout(2500)
                });
                if (matchDetailRes.ok) {
                  const mData = await matchDetailRes.json();
                  const finished = normalizeFinishedMatch(mData);
                  if (finished) {
                    games = [finished];
                    source = "opendota_match_details";
                  }
                }
              } catch (_) {}
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