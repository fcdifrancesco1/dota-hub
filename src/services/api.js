const OPENDOTA_BASE = "https://api.opendota.com/api";
const STEAM_CDN = "https://cdn.cloudflare.steamstatic.com";

// Cache em memória com TTL
const memoryCache = new Map();

function getCached(key, ttlMs = 5 * 60 * 1000) {
  const item = memoryCache.get(key);
  if (item && Date.now() - item.ts < ttlMs) {
    return item.data;
  }
  try {
    const lsItem = localStorage.getItem(`dota_cache_${key}`);
    if (lsItem) {
      const parsed = JSON.parse(lsItem);
      if (Date.now() - parsed.ts < ttlMs) {
        memoryCache.set(key, parsed);
        return parsed.data;
      }
    }
  } catch (e) {}
  return null;
}

function setCache(key, data) {
  const payload = { ts: Date.now(), data };
  memoryCache.set(key, payload);
  try {
    localStorage.setItem(`dota_cache_${key}`, JSON.stringify(payload));
  } catch (e) {}
}

export function normalizeTeamKey(name) {
  if (!name) return "";
  return String(name)
    .toLowerCase()
    .replace(/\b(team|gaming|esports|esport|gg|club|academy)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export function getHeroImg(constants, heroId) {
  const h = constants?.heroes?.[heroId];
  return h ? `${STEAM_CDN}${h.img}` : "";
}

export function getHeroName(constants, heroId) {
  const h = constants?.heroes?.[heroId];
  return h ? h.localized_name : `Herói ${heroId}`;
}

export function getItemImg(constants, itemId) {
  const it = constants?.itemsById?.[itemId];
  return it ? `${STEAM_CDN}${it.img}` : "";
}

// 1. Carregar Constantes de Heróis e Itens da Valve
export async function fetchConstants() {
  const cached = getCached("constants_v6", 24 * 3600 * 1000);
  if (cached) return cached;

  try {
    const [heroesRes, itemsRes] = await Promise.all([
      fetch(`${OPENDOTA_BASE}/constants/heroes`),
      fetch(`${OPENDOTA_BASE}/constants/items`)
    ]);

    const heroes = heroesRes.ok ? await heroesRes.json() : {};
    const items = itemsRes.ok ? await itemsRes.json() : {};

    const itemsById = {};
    Object.values(items || {}).forEach((it) => {
      if (it && it.id != null) itemsById[it.id] = it;
    });

    const result = { heroes, itemsById };
    setCache("constants_v6", result);
    return result;
  } catch (err) {
    console.error("Erro ao carregar constantes da Valve:", err);
    return { heroes: {}, itemsById: {} };
  }
}

// 2. Agrupamento Sequencial de Séries (BO3 / BO5)
export function clusterMatchesIntoSeries(rawMatches) {
  const list = [...rawMatches].sort((a, b) => a.start_time - b.start_time);
  const seriesList = [];

  list.forEach((m) => {
    const tA = normalizeTeamKey(m.radiant_name || m.radiant_team_id);
    const tB = normalizeTeamKey(m.dire_name || m.dire_team_id);
    const matchTime = m.start_time;

    let targetSeries = seriesList.find((s) => {
      const sameTeams = (s.teamAKey === tA && s.teamBKey === tB) || (s.teamAKey === tB && s.teamBKey === tA);
      const sameLeague = !m.leagueid || !s.leagueId || m.leagueid === s.leagueId;
      const lastGameTime = s.games[s.games.length - 1].start_time;
      const withinTime = (matchTime - lastGameTime) <= (3.5 * 3600) && (matchTime >= lastGameTime);

      const isAlreadyClosed = (s.scoreA >= 2 && s.scoreB < s.scoreA && s.games.length <= 3) || 
                              (s.scoreB >= 2 && s.scoreA < s.scoreB && s.games.length <= 3) || 
                              (s.scoreA >= 3 || s.scoreB >= 3);

      return sameTeams && sameLeague && withinTime && !isAlreadyClosed;
    });

    if (!targetSeries) {
      targetSeries = {
        leagueId: m.leagueid,
        leagueName: m.league_name || "Torneio Profissional",
        teamAKey: tA,
        teamBKey: tB,
        timeA: m.radiant_name || "Radiant",
        timeB: m.dire_name || "Dire",
        preferredIdA: m.radiant_team_id,
        preferredIdB: m.dire_team_id,
        scoreA: 0,
        scoreB: 0,
        games: []
      };
      seriesList.push(targetSeries);
    }

    targetSeries.games.push(m);
    const radWon = m.radiant_win;
    const isRadTeamA = (m.radiant_team_id === targetSeries.preferredIdA);

    if (isRadTeamA) {
      if (radWon) targetSeries.scoreA++; else targetSeries.scoreB++;
    } else {
      if (radWon) targetSeries.scoreB++; else targetSeries.scoreA++;
    }
  });

  return seriesList.map((s) => ({
    stage: s.leagueName,
    leagueId: s.leagueId,
    timeA: s.timeA,
    timeB: s.timeB,
    scoreA: s.scoreA,
    scoreB: s.scoreB,
    winner: s.scoreA > s.scoreB ? s.timeA : (s.scoreB > s.scoreA ? s.timeB : "Empate"),
    dur: `${s.games.length} mapa${s.games.length > 1 ? 's' : ''}`,
    games: s.games.map((g, idx) => ({
      mapNumber: idx + 1,
      match_id: String(g.match_id),
      start_time: g.start_time,
      radiant_win: g.radiant_win,
      duration: g.duration
    }))
  }));
}

// 3. Buscar Partidas Profissionais Recentes
export async function fetchProMatches() {
  const cached = getCached("pro_matches_v6", 2 * 60 * 1000);
  if (cached) return cached;

  try {
    const res = await fetch(`${OPENDOTA_BASE}/proMatches`);
    if (res.ok) {
      const list = await res.json();
      const clustered = clusterMatchesIntoSeries(Array.isArray(list) ? list : []);
      const valid = clustered
        .filter(s => s.games.length >= 2 || (s.scoreA + s.scoreB === 1))
        .reverse();

      // Agrupamento por Liga
      const leaguesMap = {};
      (list || []).forEach((m) => {
        const lId = m.leagueid || m.league_name;
        if (!lId) return;
        if (!leaguesMap[lId]) {
          leaguesMap[lId] = {
            id: lId,
            league_id: m.leagueid,
            name: m.league_name || "Torneio Dota 2",
            recentDate: new Date(m.start_time * 1000).toLocaleDateString("pt-BR", { month: "short", year: "numeric" }),
            rawMatches: []
          };
        }
        leaguesMap[lId].rawMatches.push(m);
      });

      const tournaments = Object.values(leaguesMap).map((l) => ({
        ...l,
        seriesList: clusterMatchesIntoSeries(l.rawMatches).reverse()
      }));

      const result = {
        finishedSeries: valid.slice(0, 15),
        tournaments: tournaments.slice(0, 15)
      };

      setCache("pro_matches_v6", result);
      return result;
    }
  } catch (err) {
    console.error("Erro ao buscar proMatches:", err);
  }
  return { finishedSeries: [], tournaments: [] };
}

// 4. Buscar Detalhes Completos do Replay da Partida
export async function fetchMatchDetails(matchId) {
  if (!matchId) return null;
  const cached = getCached(`match_${matchId}`, 60 * 60 * 1000);
  if (cached) return cached;

  try {
    const res = await fetch(`${OPENDOTA_BASE}/matches/${matchId}`);
    if (res.ok) {
      const data = await res.json();
      setCache(`match_${matchId}`, data);
      return data;
    }
  } catch (err) {
    console.error("Erro ao carregar detalhes da partida:", err);
  }
  return null;
}

// 5. Buscar Meta dos Heróis do Patch (Tier List)
export async function fetchHeroStats() {
  const cached = getCached("hero_stats_v6", 30 * 60 * 1000);
  if (cached) return cached;

  try {
    const res = await fetch(`${OPENDOTA_BASE}/heroStats`);
    if (res.ok) {
      const list = await res.json();
      
      const processed = (list || []).map((h) => {
        const proPick = h.pro_pick || 0;
        const proWin = h.pro_win || 0;
        const proBan = h.pro_ban || 0;
        const proWinRate = proPick > 0 ? (proWin / proPick) * 100 : 0;

        const pub8Pick = h["8_pick"] || 0;
        const pub8Win = h["8_win"] || 0;
        const pub8WinRate = pub8Pick > 0 ? (pub8Win / pub8Pick) * 100 : 0;

        const compositeScore = (proWinRate * 0.45) + (pub8WinRate * 0.35) + (Math.min(proPick / 5, 20));
        let tier = "B";
        if (compositeScore >= 60 && (proPick >= 5 || pub8Pick >= 500)) tier = "S+";
        else if (compositeScore >= 54) tier = "S";
        else if (compositeScore >= 49) tier = "A";
        else if (compositeScore < 45) tier = "C";

        const primaryAttrMap = {
          str: "Força",
          agi: "Agilidade",
          int: "Inteligência",
          all: "Universal"
        };

        return {
          id: h.id,
          name: h.localized_name,
          img: `${STEAM_CDN}${h.img}`,
          icon: `${STEAM_CDN}${h.icon}`,
          primaryAttr: primaryAttrMap[h.primary_attr] || "Universal",
          attrCode: h.primary_attr,
          attackType: h.attack_type,
          roles: h.roles || [],
          proPick,
          proWin,
          proBan,
          proWinRate: Number(proWinRate.toFixed(1)),
          pub8Pick,
          pub8WinRate: Number(pub8WinRate.toFixed(1)),
          tier,
          baseHealth: h.base_health,
          baseMana: h.base_mana,
          moveSpeed: h.move_speed,
          turboPicks: h.turbo_picks || 0
        };
      });

      setCache("hero_stats_v6", processed);
      return processed;
    }
  } catch (err) {
    console.error("Erro ao carregar heroStats:", err);
  }
  return [];
}

// 6. Buscar Partidas Ao Vivo
export async function fetchLiveGames() {
  try {
    let list = [];
    try {
      const res = await fetch("/api/live");
      if (res.ok) {
        const data = await res.json();
        list = (data && data.result && data.result.games) || (Array.isArray(data) ? data : []);
      }
    } catch (e) {}

    if (!list.length) {
      const res = await fetch(`${OPENDOTA_BASE}/liveLeagueGames`);
      if (res.ok) {
        const data = await res.json();
        list = (data && data.result && data.result.games) || (Array.isArray(data) ? data : []);
      }
    }

    return (list || []).filter(g => g && (g.radiant_team || g.scoreboard?.radiant) && (g.dire_team || g.scoreboard?.dire));
  } catch {
    return [];
  }
}

// Parser de Jogos Reais da Liquipedia
function parseLiquipediaHtml(html) {
  const matches = [];
  const matchBlocks = html.split('<div class="match-info">').slice(1);

  matchBlocks.forEach((block) => {
    try {
      const tsMatch = block.match(/data-timestamp="(\d+)"/);
      const timestamp = tsMatch ? parseInt(tsMatch[1], 10) * 1000 : null;

      const leftBlockMatch = block.match(/class="match-info-header-opponent[^"]*match-info-header-opponent-left"([\s\S]*?)<div class="match-info-header-scoreholder"/);
      const rightBlockMatch = block.match(/class="match-info-header-opponent"[^>]*>([\s\S]*?)<\/div><\/div><div class="match-info-tournament"/);

      let timeA = "TBD";
      let logoA = "";
      if (leftBlockMatch) {
        const leftBlock = leftBlockMatch[1];
        const titleMatch = leftBlock.match(/class="team-template-image-icon[^"]*"[^>]*><a[^>]*title="([^"]+)"/);
        const nameMatch = leftBlock.match(/<span class="name"[^>]*><a[^>]*>([^<]+)<\/a>/);
        timeA = (titleMatch ? titleMatch[1] : (nameMatch ? nameMatch[1] : "TBD")).trim();
        timeA = timeA.replace(/\(page does not exist\)/gi, '').trim();

        const imgMatch = leftBlock.match(/<img[^>]*src="([^"]+)"/);
        if (imgMatch) {
          logoA = imgMatch[1].startsWith('http') ? imgMatch[1] : `https://liquipedia.net${imgMatch[1]}`;
        }
      }

      let timeB = "TBD";
      let logoB = "";
      if (rightBlockMatch) {
        const rightBlock = rightBlockMatch[1];
        const titleMatch = rightBlock.match(/class="team-template-image-icon[^"]*"[^>]*><a[^>]*title="([^"]+)"/);
        const nameMatch = rightBlock.match(/<span class="name"[^>]*><a[^>]*>([^<]+)<\/a>/);
        timeB = (titleMatch ? titleMatch[1] : (nameMatch ? nameMatch[1] : "TBD")).trim();
        timeB = timeB.replace(/\(page does not exist\)/gi, '').trim();

        const imgMatch = rightBlock.match(/<img[^>]*src="([^"]+)"/);
        if (imgMatch) {
          logoB = imgMatch[1].startsWith('http') ? imgMatch[1] : `https://liquipedia.net${imgMatch[1]}`;
        }
      }

      const formatMatch = block.match(/\((Bo\d+)\)/i);
      const formato = formatMatch ? formatMatch[1].toUpperCase() : "BO3";

      const scoreMatch = block.match(/class="match-info-header-score">(\d+)<\/span><span class="match-info-header-scoreholder-divider">:<\/span><span class="match-info-header-score">(\d+)<\/span>/);
      const scoreA = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;
      const scoreB = scoreMatch ? parseInt(scoreMatch[2], 10) : 0;

      let torneio = "Torneio Profissional";
      const tourneyNameMatch = block.match(/class="match-info-tournament-name"[^>]*>[\s\S]*?<span>([^<]+)<\/span>/);
      if (tourneyNameMatch) {
        torneio = tourneyNameMatch[1].replace(/ - [A-Za-z]+ \d+$/i, '').trim();
      } else {
        const tourneyBlock = block.match(/class="match-info-tournament"[\s\S]*?<\/div>/);
        if (tourneyBlock) {
          const tTitle = tourneyBlock[0].match(/title="([^"#]+)/);
          if (tTitle) {
            torneio = tTitle[1].replace(/_/g, ' ').replace(/\//g, ' ').trim();
          }
        }
      }

      let streamUrl = "";
      const streamMatch = block.match(/href="([^"]*Special:Stream\/[^"]+)"/);
      if (streamMatch) {
        streamUrl = `https://liquipedia.net${streamMatch[1]}`;
      }

      if (timeA && timeB && (timeA !== "TBD" || timeB !== "TBD")) {
        matches.push({
          timeA,
          timeB,
          logoA,
          logoB,
          formato,
          scoreA,
          scoreB,
          torneio,
          streamUrl,
          data: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
          timestamp
        });
      }
    } catch (err) {}
  });

  return matches;
}

// 7. Buscar Próximos Jogos Reais da Liquipedia
export async function fetchUpcomingMatches() {
  const cached = getCached("upcoming_real_matches_v2", 2 * 60 * 1000);
  if (cached) return cached;

  try {
    let list = [];
    try {
      const res = await fetch("/api/upcoming");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) list = data;
      }
    } catch (e) {}

    // Fallback direto via Liquipedia com CORS
    if (!list.length) {
      try {
        const resWiki = await fetch(
          "https://liquipedia.net/dota2/api.php?action=parse&page=Liquipedia:Matches&format=json&origin=*",
          {
            headers: {
              "Accept": "application/json"
            }
          }
        );
        if (resWiki.ok) {
          const dataWiki = await resWiki.json();
          const html = dataWiki?.parse?.text?.["*"] || "";
          list = parseLiquipediaHtml(html);
        }
      } catch (e) {
        console.error("Falha ao consultar Liquipedia diretamente:", e);
      }
    }

    if (list.length > 0) {
      setCache("upcoming_real_matches_v2", list);
    }
    return list;
  } catch {
    return [];
  }
}

// 8. Buscar Telemetria em Tempo Real de Partida Ao Vivo
export async function findLiveMatchDetails(game) {
  if (!game) return { matchData: null, maps: [] };

  const normA = normalizeTeamKey(game.timeA || game.radiant_team?.name || game.radiant_team?.team_name);
  const normB = normalizeTeamKey(game.timeB || game.dire_team?.name || game.dire_team?.team_name);

  // 1. Se o objeto já possui match_id explícito
  if (game.match_id) {
    const data = await fetchMatchDetails(game.match_id);
    return { matchData: data, maps: [{ mapNumber: 1, match_id: String(game.match_id) }] };
  }

  // 2. Busca nos proMatches recentes para encontrar os mapas daquela série
  try {
    const proRes = await fetch(`${OPENDOTA_BASE}/proMatches`);
    if (proRes.ok) {
      const list = await proRes.json();
      const matched = (list || []).filter(m => {
        const rad = normalizeTeamKey(m.radiant_name || m.radiant_team_id);
        const dire = normalizeTeamKey(m.dire_name || m.dire_team_id);
        const matchTime = m.start_time;
        const isRecent = Math.abs(Date.now() - matchTime * 1000) < (24 * 3600 * 1000);
        return isRecent && ((rad.includes(normA) && dire.includes(normB)) || (rad.includes(normB) && dire.includes(normA)));
      });

      if (matched.length > 0) {
        matched.sort((a, b) => a.start_time - b.start_time);
        const latestMatch = matched[matched.length - 1];
        const matchData = await fetchMatchDetails(latestMatch.match_id);

        const maps = matched.map((m, idx) => ({
          mapNumber: idx + 1,
          match_id: String(m.match_id),
          radiant_score: m.radiant_score,
          dire_score: m.dire_score,
          start_time: m.start_time
        }));

        return { matchData, maps };
      }
    }
  } catch (e) {
    console.error("Erro ao buscar mapas recentes da série ao vivo:", e);
  }

  return { matchData: null, maps: [] };
}

// 9. Buscar Leaderboard Oficial da Valve
export async function fetchOfficialLeaderboard(division = "europe") {
  const cached = getCached(`leaderboard_${division}`, 10 * 60 * 1000);
  if (cached) return cached;

  try {
    let players = [];
    try {
      const res = await fetch(`/api/leaderboard?division=${division}`);
      if (res.ok) {
        const data = await res.json();
        players = data.leaderboard || [];
      }
    } catch (e) {}

    if (!players.length) {
      const resFallback = await fetch(`https://www.dota2.com/webapi/ILeaderboard/GetDivisionLeaderboard/v0001?division=${division}&leaderboard=0`);
      if (resFallback.ok) {
        const dataFallback = await resFallback.json();
        players = dataFallback.leaderboard || [];
      }
    }

    setCache(`leaderboard_${division}`, players);
    return players;
  } catch {
    return [];
  }
}

// 10. Buscar Perfil do Time
export async function fetchTeamProfile(teamId) {
  if (!teamId) return null;
  const cached = getCached(`team_profile_${teamId}`, 15 * 60 * 1000);
  if (cached) return cached;

  try {
    const [teamRes, matchesRes, heroesRes] = await Promise.all([
      fetch(`${OPENDOTA_BASE}/teams/${teamId}`),
      fetch(`${OPENDOTA_BASE}/teams/${teamId}/matches`),
      fetch(`${OPENDOTA_BASE}/teams/${teamId}/heroes`)
    ]);

    const teamData = teamRes.ok ? await teamRes.json() : {};
    const matches = matchesRes.ok ? await matchesRes.json() : [];
    const topHeroes = heroesRes.ok ? await heroesRes.json() : [];

    const last20 = (matches || []).slice(0, 20);
    const wins = last20.filter(m => (m.radiant && m.radiant_win) || (!m.radiant && !m.radiant_win)).length;
    const winRate = last20.length > 0 ? ((wins / last20.length) * 100).toFixed(0) : 0;

    const result = {
      ...teamData,
      recentMatches: last20,
      recentWinRate: winRate,
      topHeroes: (topHeroes || []).slice(0, 5)
    };

    setCache(`team_profile_${teamId}`, result);
    return result;
  } catch (err) {
    console.error("Erro ao carregar perfil do time:", err);
    return null;
  }
}