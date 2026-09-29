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

// Mapeamento de logos verificados para partidas ao vivo e torneios
const VERIFIED_TEAM_LOGOS = {
  'spirit': '/team-logos/spirit.png',
  'team spirit': '/team-logos/spirit.png',
  'tspirit': '/team-logos/spirit.png',
  '7119388': '/team-logos/spirit.png',
  'nemesis': '/team-logos/nemesis.png',
  'team nemesis': '/team-logos/nemesis.png',
  'nmss': '/team-logos/nemesis.png',
  '9691969': '/team-logos/nemesis.png',
  'levelup': '/team-logos/levelup.png',
  'level up': '/team-logos/levelup.png',
  'level up esports': '/team-logos/levelup.png',
  '9256405': '/team-logos/levelup.png',
  'parivision': '/team-logos/parivision.png',
  'pari vision': '/team-logos/parivision.png',
  'vision': '/team-logos/parivision.png',
  'pv': '/team-logos/parivision.png',
  '9824702': '/team-logos/parivision.png',
  'gamerlegion': '/team-logos/gamerlegion.png',
  '9964962': '/team-logos/gamerlegion.png',
  'hokori': '/team-logos/hokori.png',
  '7119077': '/team-logos/hokori.png',
  'conventus': '/team-logos/conventus.png',
  'conventus stellarum': '/team-logos/conventus.png',
  '10261180': '/team-logos/conventus.png',
  'falcons': '/team-logos/falcons.png',
  'team falcons': '/team-logos/falcons.png',
  'flcn': '/team-logos/falcons.png',
  '9247354': '/team-logos/falcons.png',
  'liquid': '/team-logos/liquid.png',
  'team liquid': '/team-logos/liquid.png',
  '2163': '/team-logos/liquid.png',
  'gladiators': '/team-logos/gladiators.png',
  'gaimin gladiators': '/team-logos/gladiators.png',
  '8599101': '/team-logos/gladiators.png',
  'betboom': '/team-logos/betboom.png',
  'betboom team': '/team-logos/betboom.png',
  '8605863': '/team-logos/betboom.png',
  '9131584': '/team-logos/betboom.png',
  'tundra': '/team-logos/tundra.png',
  'tundra esports': '/team-logos/tundra.png',
  '8255776': '/team-logos/tundra.png',
  'xtreme': '/team-logos/xtreme.png',
  'xtreme gaming': '/team-logos/xtreme.png',
  '8254400': '/team-logos/xtreme.png',
  '8261500': '/team-logos/xtreme.png',
  'og': '/team-logos/og.png',
  '2586976': '/team-logos/og.png',
  'navi': '/team-logos/navi.png',
  'natus vincere': '/team-logos/navi.png',
  '36': '/team-logos/navi.png',
  'secret': '/team-logos/secret.png',
  'team secret': '/team-logos/secret.png',
  '1838315': '/team-logos/secret.png',
  'aurora': '/team-logos/aurora.png',
  'aurora gaming': '/team-logos/aurora.png',
  '9247498': '/team-logos/aurora.png',
  '9467224': '/team-logos/aurora.png',
  'cloud9': '/team-logos/cloud9.png',
  '1333179': '/team-logos/cloud9.png',
  'shopify': '/team-logos/shopify.png',
  'shopify rebellion': '/team-logos/shopify.png',
  '8894818': '/team-logos/shopify.png',
  'talon': '/team-logos/talon.png',
  'talon esports': '/team-logos/talon.png',
  '8632698': '/team-logos/talon.png',
  'heroic': '/team-logos/heroic.png',
  '9272362': '/team-logos/heroic.png',
  'beastcoast': '/team-logos/beastcoast.png',
  '7390454': '/team-logos/beastcoast.png',
  'mouz': '/team-logos/mouz.png',
  '9459989': '/team-logos/mouz.png',
  '1win': '/team-logos/1win.png',
  '8676239': '/team-logos/1win.png',
  '10182357': '/team-logos/1win.png',
  'quest': '/team-logos/quest.png',
  'psg quest': '/team-logos/quest.png',
  '8897531': '/team-logos/quest.png',
  'nigma': '/team-logos/nigma.png',
  'nigma galaxy': '/team-logos/nigma.png',
  '7554697': '/team-logos/nigma.png',
  'virtus': '/team-logos/virtus.png',
  'virtus pro': '/team-logos/virtus.png',
  '1883502': '/team-logos/virtus.png',
  'boom': '/team-logos/boom.png',
  '726228': '/team-logos/boom.png',
  'lgd': '/team-logos/lgd.png',
  '15': '/team-logos/lgd.png',
  'azureray': '/team-logos/azureray.png',
  '9170852': '/team-logos/azureray.png'
};

function resolveVerifiedTeamLogo(teamName, teamId, explicitUrl) {
  if (teamId && VERIFIED_TEAM_LOGOS[String(teamId)]) {
    return VERIFIED_TEAM_LOGOS[String(teamId)];
  }
  if (teamName) {
    const clean = String(teamName).toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    for (const [k, p] of Object.entries(VERIFIED_TEAM_LOGOS)) {
      if (k.replace(/[^a-z0-9]/g, '') === clean) return p;
    }
    const stripped = clean.replace(/^(team|gaming|esports)/, '').replace(/(team|gaming|esports)$/, '');
    if (stripped && stripped.length >= 2) {
      for (const [k, p] of Object.entries(VERIFIED_TEAM_LOGOS)) {
        if (k.replace(/[^a-z0-9]/g, '') === stripped) return p;
      }
    }
  }
  if (explicitUrl && typeof explicitUrl === 'string' && (explicitUrl.startsWith('http') || explicitUrl.startsWith('/'))) {
    return explicitUrl;
  }
  // Sem logo conhecido: o front-end (TeamLogo) mostra as iniciais do time
  return '';
}

// Ligas profissionais segundo a OpenDota (tier "premium" ou "professional").
// Usado para nunca exibir partidas amadoras ou públicas no site. A lista
// completa tem ~1 MB, então guardamos só os IDs em memória por 6 horas.
const PRO_LEAGUE_TIERS = new Set(['premium', 'professional']);
let proLeagueCache = { ids: null, expiresAt: 0 };
// Nome oficial de cada liga profissional (leagueid -> nome), da mesma lista
const LEAGUE_NAMES = new Map();

async function getProLeagueIds() {
  if (proLeagueCache.ids && Date.now() < proLeagueCache.expiresAt) return proLeagueCache.ids;
  try {
    const res = await fetch("https://api.opendota.com/api/leagues", {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(6000)
    });
    if (res.ok) {
      const leagues = await res.json();
      const pro = (Array.isArray(leagues) ? leagues : []).filter(l => PRO_LEAGUE_TIERS.has(l.tier));
      const ids = new Set(pro.map(l => Number(l.leagueid)));
      for (const l of pro) if (l.name) LEAGUE_NAMES.set(Number(l.leagueid), l.name);
      if (ids.size > 0) proLeagueCache = { ids, expiresAt: Date.now() + 6 * 3600 * 1000 };
    }
  } catch (err) {
    console.warn("[Ligas] Falha ao carregar tiers da OpenDota:", err.message);
  }
  return proLeagueCache.ids; // pode ser a lista anterior (expirada) ou null
}

// Partida profissional: liga premium/professional. Se a lista de ligas estiver
// indisponível, exige ao menos liga e os dois times cadastrados.
function isProGame(leagueId, radiantName, direName, proLeagueIds) {
  const id = Number(leagueId);
  if (!id) return false;
  if (proLeagueIds) return proLeagueIds.has(id);
  return Boolean(radiantName && direName);
}

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

  // A Steam envia a duração com casas decimais (ex.: 678.8000488)
  const duration = Math.floor(Number(sb.duration ?? g.duration ?? 0)) || 0;
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
    const gpm = p.gold_per_min ?? null;
    const xpm = p.xp_per_min ?? null;

    const rawItems = [
      p.item0, p.item1, p.item2, p.item3, p.item4, p.item5,
      p.item_0, p.item_1, p.item_2, p.item_3, p.item_4, p.item_5
    ];
    const items = rawItems.filter(v => v !== undefined && v !== null && v !== 0 && v !== "");

    // No scoreboard da Valve o player_slot vai de 1 a 5 em CADA time; normalizamos
    // para o padrão da OpenDota (0-4 Radiant, 128-132 Dire), usado para separar os times
    return {
      slot: isRad ? idx : idx + 5,
      team_slot: idx + 1,
      player_slot: isRad ? idx : idx + 128,
      name: playerName,
      account_id: p.account_id,
      hero_id: p.hero_id,
      level: p.level ?? null,
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
  let hasPlayerStats = radPlayers.length > 0;
  if (radPlayers.length === 0 && Array.isArray(g.players) && g.players.length > 0) {
    const mapped = mapCoordinatorPlayers(
      g.players,
      g.radiant_team?.team_name || "Radiant",
      g.dire_team?.team_name || "Dire"
    );
    finalRadPlayers = mapped.radPlayers;
    finalDirePlayers = mapped.direPlayers;
    hasPlayerStats = mapped.hasPlayerStats;
  }

  const rawPicksBans = [
    ...(radSb.picks || []).map(p => ({ hero_id: p.hero_id, is_pick: true, team: 0 })),
    ...(radSb.bans || []).map(b => ({ hero_id: b.hero_id, is_pick: false, team: 0 })),
    ...(direSb.picks || []).map(p => ({ hero_id: p.hero_id, is_pick: true, team: 1 })),
    ...(direSb.bans || []).map(b => ({ hero_id: b.hero_id, is_pick: false, team: 1 }))
  ];

  // Draft somente quando a Valve envia os picks/bans (sem ordem inventada)
  const picks_bans = rawPicksBans;

  const leagueName = g.league_id ? (KNOWN_LEAGUES[g.league_id] || LEAGUE_NAMES.get(Number(g.league_id)) || g.stage_name || g.league_name || `Torneio (Liga ${g.league_id})`) : "Torneio Dota 2";
  const formatStr = g.series_type === 1 ? "BO3" : g.series_type === 2 ? "BO5" : (g.formato || "BO3");

  const radTeamName = g.radiant_team?.team_name || g.timeA || "Radiant";
  const direTeamName = g.dire_team?.team_name || g.timeB || "Dire";
  const radLogo = resolveVerifiedTeamLogo(radTeamName, g.radiant_team?.team_id || g.team_id_radiant, g.radiant_team?.logo_url);
  const direLogo = resolveVerifiedTeamLogo(direTeamName, g.dire_team?.team_id || g.team_id_dire, g.dire_team?.logo_url);

  return {
    ...g,
    radiant_name: radTeamName,
    dire_name: direTeamName,
    timeA: radTeamName,
    timeB: direTeamName,
    logoA: radLogo,
    logoB: direLogo,
    radiant_logo: radLogo,
    dire_logo: direLogo,
    radiant_team: {
      team_name: radTeamName,
      team_id: g.radiant_team?.team_id || g.team_id_radiant || 0,
      name: radTeamName,
      logo_url: radLogo
    },
    dire_team: {
      team_name: direTeamName,
      team_id: g.dire_team?.team_id || g.team_id_dire || 0,
      name: direTeamName,
      logo_url: direLogo
    },
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
    has_player_stats: hasPlayerStats,
    is_live_telemetry: true,
    isGameDataActive: true
  };
}

// Mapeia os jogadores do feed do Game Coordinator (OpenDota /api/live).
// Esse feed informa quem está jogando e com qual herói, mas NÃO traz
// estatísticas por jogador (KDA, CS, ouro, nível, itens). Esses campos só são
// preenchidos quando a fonte realmente os envia; do contrário ficam null e a
// interface mostra "—". Nada é estimado.
function mapCoordinatorPlayers(rawPlayers, radTeamName, direTeamName) {
  const radRaw = (rawPlayers || []).filter(p => p.team === 0 || (p.team_slot && p.team_slot <= 5 && p.team === undefined));
  const direRaw = (rawPlayers || []).filter(p => p.team === 1 || (p.team_slot && p.team_slot > 5 && p.team === undefined));

  // Ordena pelo slot de equipe oficial (team_slot 1..5)
  const sortBySlot = (a, b) => (a.team_slot || 0) - (b.team_slot || 0);
  radRaw.sort(sortBySlot);
  direRaw.sort(sortBySlot);

  const real = (v) => (v === undefined || v === null ? null : v);

  const mapTeam = (teamList, isRad) => {
    const teamName = isRad ? radTeamName : direTeamName;
    return teamList.map((p, idx) => {
      const slotNum = p.team_slot || (idx + 1);
      const items = [
        p.item0, p.item1, p.item2, p.item3, p.item4, p.item5,
        p.item_0, p.item_1, p.item_2, p.item_3, p.item_4, p.item_5,
        ...(Array.isArray(p.items) ? p.items : [])
      ].filter(v => v !== undefined && v !== null && v !== 0 && v !== "").slice(0, 6);

      return {
        slot: isRad ? idx : idx + 5,
        team_slot: slotNum,
        player_slot: p.player_slot ?? (isRad ? idx : idx + 128),
        name: p.name || p.personaname || `${teamName} Pos ${slotNum}`,
        account_id: p.account_id,
        hero_id: p.hero_id || 0,
        level: real(p.level),
        kills: real(p.kills),
        deaths: real(p.deaths ?? p.death),
        assists: real(p.assists),
        last_hits: real(p.last_hits),
        denies: real(p.denies),
        net_worth: real(p.net_worth),
        gold: real(p.gold),
        gpm: real(p.gold_per_min ?? p.gpm),
        xpm: real(p.xp_per_min ?? p.xpm),
        item_0: items[0] || null,
        item_1: items[1] || null,
        item_2: items[2] || null,
        item_3: items[3] || null,
        item_4: items[4] || null,
        item_5: items[5] || null,
        items,
        isRadiant: isRad,
        is_pro: Boolean(p.is_pro),
        country_code: p.country_code || null
      };
    });
  };

  const radPlayers = mapTeam(radRaw, true);
  const direPlayers = mapTeam(direRaw, false);
  return {
    radPlayers,
    direPlayers,
    hasPlayerStats: [...radPlayers, ...direPlayers].some(p => p.kills !== null)
  };
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

  const duration = Math.floor(Number(g.game_time || 0)) || 0;
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

  const { radPlayers, direPlayers, hasPlayerStats } = mapCoordinatorPlayers(
    rawPlayers,
    radTeamName,
    direTeamName
  );

  const radHeroIds = radPlayers.map(p => p.hero_id);
  const direHeroIds = direPlayers.map(p => p.hero_id);
  // O feed do Coordinator não informa bans nem a ordem do draft
  const picks_bans = [];

  const leagueName = g.league_id ? (KNOWN_LEAGUES[g.league_id] || LEAGUE_NAMES.get(Number(g.league_id)) || `Torneio (Liga ${g.league_id})`) : "Torneio Dota 2";
  const formatStr = g.series_type === 2 ? "BO5" : "BO3";

  const radLogo = resolveVerifiedTeamLogo(radTeamName, g.team_id_radiant, g.team_logo_radiant);
  const direLogo = resolveVerifiedTeamLogo(direTeamName, g.team_id_dire, g.team_logo_dire);

  return {
    match_id: String(g.match_id),
    league_id: g.league_id,
    radiant_team: {
      team_name: radTeamName,
      team_id: g.team_id_radiant || 0,
      name: radTeamName,
      logo_url: radLogo
    },
    dire_team: {
      team_name: direTeamName,
      team_id: g.team_id_dire || 0,
      name: direTeamName,
      logo_url: direLogo
    },
    radiant_name: radTeamName,
    dire_name: direTeamName,
    timeA: radTeamName,
    timeB: direTeamName,
    logoA: radLogo,
    logoB: direLogo,
    radiant_logo: radLogo,
    dire_logo: direLogo,
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
    radiant_picks: radHeroIds,
    dire_picks: direHeroIds,
    team_id_radiant: g.team_id_radiant || 0,
    team_id_dire: g.team_id_dire || 0,
    picks_bans,
    has_player_stats: hasPlayerStats,
    is_live_telemetry: true,
    isGameDataActive: true,
    series_id: g.series_id || null,
    deactivate_time: g.deactivate_time || 0
  };
}

// Filtra partidas encerradas e deduplica séries mantendo apenas o mapa mais recente
function filterAndDeduplicateLiveGames(games) {
  if (!Array.isArray(games)) return [];

  // deactivate_time só é preenchido quando o jogo termina (a OpenDota o agenda
  // ~15 min no futuro e mantém o jogo no feed por até 1h30). Jogo encerrado sai
  // da lista ao vivo; os mapas concluídos da série são buscados pela página da partida.
  const activeOrRecent = games.filter(g => g && !Number(g.deactivate_time || 0));

  // Agrupar por confronto de times (série) e manter apenas o mapa mais recente (maior match_id)
  const seriesMap = new Map();
  for (const g of activeOrRecent) {
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

  const radName = m.radiant_name || m.radiant_team?.name || "Radiant";
  const direName = m.dire_name || m.dire_team?.name || "Dire";
  const radLogo = resolveVerifiedTeamLogo(radName, m.radiant_team_id || m.radiant_team?.team_id, m.radiant_team?.logo_url);
  const direLogo = resolveVerifiedTeamLogo(direName, m.dire_team_id || m.dire_team?.team_id, m.dire_team?.logo_url);

  return {
    match_id: String(m.match_id),
    league_id: m.leagueid,
    radiant_name: radName,
    dire_name: direName,
    timeA: radName,
    timeB: direName,
    logoA: radLogo,
    logoB: direLogo,
    radiant_logo: radLogo,
    dire_logo: direLogo,
    radiant_team: {
      team_name: radName,
      name: radName,
      team_id: m.radiant_team_id || m.radiant_team?.team_id || 0,
      logo_url: radLogo
    },
    dire_team: {
      team_name: direName,
      name: direName,
      team_id: m.dire_team_id || m.dire_team?.team_id || 0,
      logo_url: direLogo
    },
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
    series_id: m.series_id || null,
    radiant_win: m.radiant_win
  };
}

// Canais oficiais no YouTube (BLAST, ESL, PGL). Só estes podem ser consultados,
// para a rota não virar um proxy aberto do YouTube.
const YOUTUBE_CHANNELS = new Set([
  'UCAvIC2XmBLLXFPdveirTrmw', // BLAST SLAM Dota 2
  'UCaYLBJfw6d8XqmNlL204lNg', // ESL Dota 2
  'UC7VWLs_Ivccq22rM2_xo0Rg'  // PGL DOTA2
]);

/**
 * Descobre o vídeo ao vivo atual de um canal. O embed "live_stream?channel="
 * do YouTube deixou de funcionar de forma confiável, então lemos a página
 * /channel/<id>/live, que redireciona (canonical) para o vídeo da live.
 */
async function fetchYoutubeLive(channelId) {
  const res = await fetch(`https://www.youtube.com/channel/${channelId}/live`, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'en' }
  });
  if (!res.ok) return { channelId, live: false, videoId: null };
  const html = await res.text();
  const videoId = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([\w-]{11})"/)?.[1] || null;
  // Lives agendadas também têm canonical de vídeo, mas sem "isLive":true
  const live = Boolean(videoId) && /"isLive(?:Now)?":true/.test(html);
  const title = videoId ? (html.match(/<meta name="title" content="([^"]*)"/)?.[1] || null) : null;
  return { channelId, live, videoId: live ? videoId : null, title: live ? title : null };
}

async function handleYoutube(res) {
  const results = await Promise.all([...YOUTUBE_CHANNELS].map((id) =>
    fetchYoutubeLive(id).catch(() => ({ channelId: id, live: false, videoId: null }))
  ));
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
  return res.status(200).json({ channels: results });
}

export default async function handler(req, res) {
  if (req.query?.youtube) return handleYoutube(res);
  try {
    const key = getSteamApiKey(req);
    const leagueId = req.query?.league_id;
    const matchId = req.query?.match_id;

    let games = [];
    let source = "none";
    const proLeagueIds = await getProLeagueIds();

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
            // Só ligas profissionais (a Steam também lista ligas amadoras)
            const proGames = rawGames.filter(g => isProGame(g.league_id, g.radiant_team?.team_name, g.dire_team?.team_name, proLeagueIds));
            const normalized = proGames.map(normalizeValveLiveGame).filter(Boolean);
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
            const specific = rawList.find(g =>
              String(g.match_id) === String(matchId) &&
              isProGame(g.league_id, g.team_name_radiant, g.team_name_dire, proLeagueIds)
            );
            if (specific) {
              const liveGame = normalizeOpenDotaLive(specific);

              // Tenta complementar com estatísticas detalhadas se a partida já tiver sido indexada/concluída
              try {
                const matchDetailRes = await fetch(`https://api.opendota.com/api/matches/${matchId}`, {
                  headers: { "Accept": "application/json" },
                  signal: AbortSignal.timeout(5000)
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
                  signal: AbortSignal.timeout(5000)
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
            // Somente partidas de ligas profissionais (nunca partidas públicas ou amadoras)
            const tournamentMatches = rawList.filter(g =>
              isProGame(g.league_id, g.team_name_radiant, g.team_name_dire, proLeagueIds)
            );

            if (tournamentMatches.length > 0) {
              const normalized = tournamentMatches.map(normalizeOpenDotaLive).filter(Boolean);
              games = filterAndDeduplicateLiveGames(normalized);
              source = "dota_coordinator_tournaments";
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