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

  const picks_bans = [
    ...(radSb.picks || []).map(p => ({ hero_id: p.hero_id, is_pick: true, team: 0 })),
    ...(radSb.bans || []).map(b => ({ hero_id: b.hero_id, is_pick: false, team: 0 })),
    ...(direSb.picks || []).map(p => ({ hero_id: p.hero_id, is_pick: true, team: 1 })),
    ...(direSb.bans || []).map(b => ({ hero_id: b.hero_id, is_pick: false, team: 1 }))
  ];

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
    players: [...radPlayers, ...direPlayers],
    radiant_players: radPlayers,
    dire_players: direPlayers,
    picks_bans: picks_bans.length > 0 ? picks_bans : g.picks_bans || [],
    is_live_telemetry: true,
    isGameDataActive: true
  };
}

// Normaliza o payload oficial do Dota 2 Coordinator (/api/live)
function normalizeOpenDotaLive(g) {
  if (!g) return null;

  const duration = g.game_time || 0;
  const radScore = g.radiant_score ?? 0;
  const direScore = g.dire_score ?? 0;

  // Bitmasks oficiais de Torres e Barracas (Valve Building State)
  const b = g.building_state || 0;
  const tower_status_radiant = b & 0x7FF;
  const barracks_status_radiant = (b >> 11) & 0x3F;
  const tower_status_dire = (b >>> 16) & 0x7FF;
  const barracks_status_dire = ((b >>> 16) >> 11) & 0x3F;

  const rawPlayers = Array.isArray(g.players) ? g.players : [];
  const radRaw = rawPlayers.filter(p => p.team === 0);
  const direRaw = rawPlayers.filter(p => p.team === 1);

  const radTeamName = g.team_name_radiant || "Radiant";
  const direTeamName = g.team_name_dire || "Dire";

  const mapPlayer = (p, idx, isRad) => {
    const teamName = isRad ? radTeamName : direTeamName;
    const durMin = duration > 0 ? duration / 60 : 1;
    const kills = p.kills ?? 0;
    const deaths = p.deaths ?? p.death ?? 0;
    const assists = p.assists ?? 0;
    const level = p.level ?? (duration > 0 ? Math.min(30, Math.max(1, Math.floor(duration / 120))) : 1);

    return {
      slot: isRad ? idx : idx + 5,
      player_slot: p.team_slot ? (isRad ? p.team_slot - 1 : (p.team_slot - 1) + 128) : (isRad ? idx : idx + 128),
      name: p.name || `${teamName} Pos ${idx + 1}`,
      account_id: p.account_id,
      hero_id: p.hero_id,
      level,
      kills,
      deaths,
      assists,
      last_hits: p.last_hits ?? 0,
      denies: p.denies ?? 0,
      gold: p.gold ?? 0,
      net_worth: p.net_worth ?? p.gold ?? 0,
      gpm: p.gold_per_min || (p.net_worth ? Math.round(p.net_worth / durMin) : 0),
      xpm: p.xp_per_min || (level ? Math.round((level * 420) / durMin) : 0),
      item_0: p.item0 ?? p.item_0 ?? 0,
      item_1: p.item1 ?? p.item_1 ?? 0,
      item_2: p.item2 ?? p.item_2 ?? 0,
      item_3: p.item3 ?? p.item_3 ?? 0,
      item_4: p.item4 ?? p.item_4 ?? 0,
      item_5: p.item5 ?? p.item_5 ?? 0,
      items: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5].filter(v => v !== undefined && v !== null && v !== 0),
      isRadiant: isRad
    };
  };

  const radPlayers = radRaw.map((p, i) => mapPlayer(p, i, true));
  const direPlayers = direRaw.map((p, i) => mapPlayer(p, i, false));

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
    radiant_lead: g.radiant_lead ?? 0,
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
    picks_bans: [],
    is_live_telemetry: true,
    isGameDataActive: true
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
            games = rawGames.map(normalizeValveLiveGame).filter(Boolean);
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
              games = tournamentMatches.map(normalizeOpenDotaLive).filter(Boolean);
              source = "dota_coordinator_tournaments";
            } else {
              // Se nenhum torneio estiver em andamento neste instante exato, exibe os jogos ao vivo mais assistidos
              const topWatched = [...rawList]
                .filter(g => (g.spectators > 20 || g.average_mmr > 7000) && g.game_time > 0)
                .sort((a, b) => (b.spectators || 0) - (a.spectators || 0))
                .slice(0, 4);

              games = topWatched.map(normalizeOpenDotaLive).filter(Boolean);
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