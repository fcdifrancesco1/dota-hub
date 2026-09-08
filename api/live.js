import fs from 'fs';
import path from 'path';

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

// Normaliza o payload oficial da Valve GOTV para o formato esperado pelo frontend
function normalizeValveLiveGame(g) {
  if (!g) return null;
  const sb = g.scoreboard || {};
  const radSb = sb.radiant || {};
  const direSb = sb.dire || {};

  const duration = sb.duration ?? g.duration ?? 0;
  const radiant_score = radSb.score ?? g.radiant_score ?? 0;
  const dire_score = direSb.score ?? g.dire_score ?? 0;

  // Bitmasks oficiais de Torres e Barracas (Valve GOTV bitmasks)
  const tower_status_radiant = radSb.tower_state !== undefined ? radSb.tower_state : g.tower_status_radiant;
  const barracks_status_radiant = radSb.barracks_state !== undefined ? radSb.barracks_state : g.barracks_status_radiant;
  const tower_status_dire = direSb.tower_state !== undefined ? direSb.tower_state : g.tower_status_dire;
  const barracks_status_dire = direSb.barracks_state !== undefined ? direSb.barracks_state : g.barracks_status_dire;

  // Dicionário de jogadores do lobby (game.players)
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

  // Picks & Bans
  const picks_bans = [
    ...(radSb.picks || []).map(p => ({ hero_id: p.hero_id, is_pick: true, team: 0 })),
    ...(radSb.bans || []).map(b => ({ hero_id: b.hero_id, is_pick: false, team: 0 })),
    ...(direSb.picks || []).map(p => ({ hero_id: p.hero_id, is_pick: true, team: 1 })),
    ...(direSb.bans || []).map(b => ({ hero_id: b.hero_id, is_pick: false, team: 1 }))
  ];

  const formatStr = g.series_type === 1 ? "BO3" : g.series_type === 2 ? "BO5" : (g.formato || "BO3");

  return {
    ...g,
    radiant_name: g.radiant_team?.team_name || g.timeA || "Radiant",
    dire_name: g.dire_team?.team_name || g.timeB || "Dire",
    radiant_score,
    dire_score,
    duration,
    tower_status_radiant,
    barracks_status_radiant,
    tower_status_dire,
    barracks_status_dire,
    roshan_respawn_timer: sb.roshan_respawn_timer ?? 0,
    spectators: g.spectators ?? 0,
    league_name: g.stage_name || g.league_name || "Torneio Dota 2",
    formato: formatStr,
    players: [...radPlayers, ...direPlayers],
    radiant_players: radPlayers,
    dire_players: direPlayers,
    picks_bans: picks_bans.length > 0 ? picks_bans : g.picks_bans || [],
    is_live_telemetry: true
  };
}

export default async function handler(req, res) {
  try {
    const key = getSteamApiKey(req);
    const leagueId = req.query?.league_id;
    const matchId = req.query?.match_id;

    let games = [];
    let source = "none";

    // 1. Consulta prioritária: Valve Steam Web API Oficial (GetLiveLeagueGames)
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
          games = rawGames.map(normalizeValveLiveGame).filter(Boolean);
          source = "steam_valve_official";
        } else {
          console.warn(`[Steam Web API] Status: ${steamRes.status}`);
        }
      } catch (errSteam) {
        console.warn("[Steam Web API] Falha na requisição:", errSteam.message);
      }
    }

    // 2. Fallback de contingência caso a chave da Steam ainda não esteja configurada no ambiente
    if (!games.length) {
      try {
        const odRes = await fetch("https://api.opendota.com/api/liveLeagueGames", {
          headers: { "Accept": "application/json" },
          signal: AbortSignal.timeout(3500)
        });
        if (odRes.ok) {
          const odData = await odRes.json();
          const rawGames = (odData && odData.result && odData.result.games) || (Array.isArray(odData) ? odData : []);
          let filtered = rawGames;
          if (matchId) {
            filtered = rawGames.filter(g => String(g.match_id) === String(matchId));
          } else if (leagueId) {
            filtered = rawGames.filter(g => String(g.league_id) === String(leagueId));
          }
          games = filtered.map(normalizeValveLiveGame).filter(Boolean);
          source = "opendota_mirror_fallback";
        }
      } catch (errFallback) {
        console.warn("[Fallback Live] Falha no espelho:", errFallback.message);
      }
    }

    // Filtra jogos ativos que tenham informações de equipes, placar ou jogadores
    const validGames = games.filter(g =>
      g && (g.radiant_team || g.dire_team || (g.scoreboard && g.scoreboard.duration > 0) || (g.players && g.players.length > 0))
    );

    res.setHeader("Cache-Control", "s-maxage=10, stale-while-revalidate=20");
    return res.status(200).json({
      result: {
        games: validGames,
        count: validGames.length,
        source
      }
    });
  } catch (error) {
    return res.status(200).json({ result: { games: [], error: error.message } });
  }
}