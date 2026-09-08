const OPENDOTA_BASE = "https://api.opendota.com/api";
const STEAM_CDN = "https://cdn.cloudflare.steamstatic.com";

// Cache em memória com TTL
const memoryCache = new Map();
const CACHE_PREFIX = "dota_cache_";
const MAX_CACHE_ENTRIES = 80;

function getCached(key, ttlMs = 5 * 60 * 1000) {
  const item = memoryCache.get(key);
  if (item && Date.now() - item.ts < ttlMs) {
    return item.data;
  }
  try {
    const lsItem = localStorage.getItem(`${CACHE_PREFIX}${key}`);
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

// Retorna dados do cache imediatamente (mesmo expirados) para renderização instantânea (Stale-While-Revalidate)
export function getCachedFast(key) {
  const item = memoryCache.get(key);
  if (item && item.data) return item.data;
  try {
    const lsItem = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (lsItem) {
      const parsed = JSON.parse(lsItem);
      if (parsed && parsed.data) {
        memoryCache.set(key, parsed);
        return parsed.data;
      }
    }
  } catch (e) {}
  return null;
}

// Fetch resiliente com timeout automático para evitar bloqueios
async function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

// Evita que o localStorage cresça indefinidamente (ex.: um "match_<id>" por
// partida vista). Quando o número de entradas passa do limite, remove as
// mais antigas primeiro.
function pruneCache() {
  try {
    const entries = Object.keys(localStorage)
      .filter((k) => k.startsWith(CACHE_PREFIX))
      .map((k) => {
        let ts = 0;
        try {
          ts = JSON.parse(localStorage.getItem(k))?.ts || 0;
        } catch (e) {}
        return { key: k, ts };
      })
      .sort((a, b) => a.ts - b.ts);

    const excess = entries.length - MAX_CACHE_ENTRIES;
    if (excess > 0) {
      entries.slice(0, excess).forEach((e) => localStorage.removeItem(e.key));
    }
  } catch (e) {}
}

function setCache(key, data) {
  const payload = { ts: Date.now(), data };
  memoryCache.set(key, payload);
  try {
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(payload));
    pruneCache();
  } catch (e) {}
}

export function normalizeTeamKey(name) {
  if (!name) return "";
  return String(name)
    .toLowerCase()
    .replace(/\s*\([^)]*\)/g, '') // remove parenteses ex (stack), (esports)
    .replace(/\.(1xbet|ggbet|parimatch|betboom)\b/gi, '')
    .replace(/(^team\s+|\s+team$)/gi, '')
    .replace(/\b(team|gaming|esports|esport|club|dota|dota\s*2)\b/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export const KNOWN_TEAM_ALIASES = {
  'navi': ['natus vincere', 'na vi', 'natusvincere'],
  'natus vincere': ['navi', 'natusvincere'],
  'betboom': ['bb team', 'betboom team', 'bb', 'betboomteam'],
  'betboom team': ['bb team', 'betboom', 'bb', 'betboomteam'],
  'bb team': ['betboom', 'betboom team', 'bb', 'betboomteam'],
  'gaimin gladiators': ['gg', 'gaimin', 'gaimingladiators'],
  'gg': ['gaimin gladiators', 'gaimin', 'gaimingladiators'],
  'virtus pro': ['vp', 'virtus.pro', 'virtuspro'],
  'virtus.pro': ['vp', 'virtus pro', 'virtuspro'],
  'vp': ['virtus.pro', 'virtus pro', 'virtuspro'],
  'aurora': ['aurora.1xbet', 'aurora gaming', 'auroragaming'],
  'aurora.1xbet': ['aurora'],
  'cloud9': ['c9', 'cloud 9'],
  'cloud 9': ['c9', 'cloud9'],
  'c9': ['cloud 9', 'cloud9'],
  'shopify rebellion': ['sr', 'shopify', 'shopifyrebellion'],
  'evil geniuses': ['eg', 'evilgeniuses'],
  'invictus gaming': ['ig', 'invictusgaming'],
  'psg.lgd': ['lgd', 'lgd gaming', 'psglgd'],
  'lgd': ['psg.lgd', 'lgd gaming'],
  'team liquid': ['liquid', 'tl'],
  'liquid': ['team liquid', 'tl'],
  'team spirit': ['spirit', 'tspirit'],
  'spirit': ['team spirit', 'tspirit'],
  'team secret': ['secret'],
  'secret': ['team secret'],
  'xtreme gaming': ['xtreme', 'xg'],
  'xtreme': ['xtreme gaming', 'xg'],
  'tundra esports': ['tundra'],
  'tundra': ['tundra esports'],
  'beastcoast': ['bc'],
  'nigma galaxy': ['nigma', 'ngx'],
  'nigma': ['nigma galaxy', 'ngx'],
  'fnatic': ['fnc']
};

const ROSTER_REGEX = /\b(academy|junior|seed|young|rejects|kids|prodigy)\b/i;
export const isJuniorOrAcademy = (s) => ROSTER_REGEX.test(String(s || '')) || /\.(b|seed)\b/i.test(String(s || ''));

export function isSameTeamMatch(t1, t2) {
  if (!t1 || !t2) return false;
  const clean = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  const c1 = clean(t1);
  const c2 = clean(t2);
  if (!c1 || !c2) return false;
  if (c1 === c2) return true;

  // Se uma equipe for junior/academy/seed e a outra não, NUNCA considere a mesma equipe!
  if (isJuniorOrAcademy(t1) !== isJuniorOrAcademy(t2)) return false;

  // Verificar dicionário de apelidos e tags conhecidas
  const aliasList1 = KNOWN_TEAM_ALIASES[String(t1).toLowerCase().trim()] || KNOWN_TEAM_ALIASES[c1] || [];
  if (aliasList1.some((a) => clean(a) === c2)) return true;

  const aliasList2 = KNOWN_TEAM_ALIASES[String(t2).toLowerCase().trim()] || KNOWN_TEAM_ALIASES[c2] || [];
  if (aliasList2.some((a) => clean(a) === c1)) return true;

  // Comparação de nomes-raiz exatos (sem prefixos genéricos como "Team", "Gaming")
  const core1 = normalizeTeamKey(t1);
  const core2 = normalizeTeamKey(t2);
  if (core1 && core2 && core1 === core2 && core1.length >= 3) {
    return true;
  }

  return false;
}

export function resolveTeamFromList(teamName, allTeams) {
  if (!teamName || !allTeams?.length) return null;
  const clean = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  const cleanInput = clean(teamName);
  const coreInput = normalizeTeamKey(teamName);
  if (!cleanInput) return null;

  const isTargetJunior = isJuniorOrAcademy(teamName);

  // 1. Nome limpo idêntico
  let found = allTeams.find((t) => {
    if (isJuniorOrAcademy(t.name) !== isTargetJunior) return false;
    return clean(t.name) === cleanInput;
  });
  if (found) return found;

  // 2. Tag idêntica (somente se a busca for curta, ex: "OG", "NAVI", "VP", "LGD", "GG")
  if (cleanInput.length >= 2 && cleanInput.length <= 6) {
    found = allTeams.find((t) => {
      if (isJuniorOrAcademy(t.name) !== isTargetJunior) return false;
      return clean(t.tag) === cleanInput;
    });
    if (found) return found;
  }

  // 3. Dicionário de Apelidos Oficiais
  for (const [key, aliases] of Object.entries(KNOWN_TEAM_ALIASES)) {
    if (clean(key) === cleanInput || aliases.some((a) => clean(a) === cleanInput)) {
      found = allTeams.find((t) => {
        if (isJuniorOrAcademy(t.name) !== isTargetJunior) return false;
        const tClean = clean(t.name);
        const tTag = clean(t.tag);
        return tClean === clean(key) || tTag === clean(key) || aliases.some((a) => clean(a) === tClean || clean(a) === tTag);
      });
      if (found) return found;
    }
  }

  // 4. Nome-raiz exato (ex: "Team Falcons" -> "falcons" bate com "Falcons")
  if (coreInput && coreInput.length >= 3) {
    found = allTeams.find((t) => {
      if (isJuniorOrAcademy(t.name) !== isTargetJunior) return false;
      return normalizeTeamKey(t.name) === coreInput;
    });
    if (found) return found;
  }

  return null;
}

export function isSeriesMatch(teamA1, teamB1, teamA2, teamB2) {
  return (isSameTeamMatch(teamA1, teamA2) && isSameTeamMatch(teamB1, teamB2)) ||
         (isSameTeamMatch(teamA1, teamB2) && isSameTeamMatch(teamB1, teamA2));
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
  const cached = getCached("constants_v6", 48 * 3600 * 1000);
  if (cached) return cached;

  try {
    const [heroesRes, itemsRes] = await Promise.all([
      fetchWithTimeout(`${OPENDOTA_BASE}/constants/heroes`, {}, 5000),
      fetchWithTimeout(`${OPENDOTA_BASE}/constants/items`, {}, 5000)
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
    console.warn("Aviso ao carregar constantes da Valve (usando cache anterior):", err);
    return getCachedFast("constants_v6") || { heroes: {}, itemsById: {} };
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
      const sameTeams = isSeriesMatch(s.timeA, s.timeB, m.radiant_name, m.dire_name);
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
    const isRadTeamA = isSameTeamMatch(m.radiant_name, targetSeries.timeA);

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
      radiant_score: g.radiant_score,
      dire_score: g.dire_score,
      radiant_win: g.radiant_win,
      duration: g.duration
    }))
  }));
}

// 3. Buscar Partidas Profissionais Recentes (com timeout e cache de 3 min)
export async function fetchProMatches() {
  const cached = getCached("pro_matches_v7", 3 * 60 * 1000);
  if (cached) return cached;

  try {
    const res = await fetchWithTimeout(`${OPENDOTA_BASE}/proMatches`, {}, 5000);
    if (res.ok) {
      const list = await res.json();
      const rawList = Array.isArray(list) ? list : [];
      const clustered = clusterMatchesIntoSeries(rawList);
      const valid = clustered
        .filter(s => s.games.length >= 2 || (s.scoreA + s.scoreB === 1))
        .reverse();

      // Agrupamento por Liga
      const leaguesMap = {};
      rawList.forEach((m) => {
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
        rawMatches: rawList,
        finishedSeries: valid.slice(0, 15),
        tournaments: tournaments.slice(0, 15)
      };

      setCache("pro_matches_v7", result);
      return result;
    }
  } catch (err) {
    console.warn("Aviso ao buscar proMatches (usando cache anterior):", err);
  }
  return getCachedFast("pro_matches_v7") || { rawMatches: [], finishedSeries: [], tournaments: [] };
}

// 4. Buscar Detalhes Completos do Replay da Partida
export async function fetchMatchDetails(matchId) {
  if (!matchId) return null;
  const cached = getCached(`match_${matchId}`, 30 * 60 * 1000);
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
    const res = await fetchWithTimeout("/api/live", {}, 3500);
    if (res.ok) {
      const data = await res.json();
      const list = (data && data.result && data.result.games) || (Array.isArray(data) ? data : []);
      return list.filter(g => g && (g.radiant_team || g.scoreboard?.radiant) && (g.dire_team || g.scoreboard?.dire));
    }
  } catch (e) {
    // Timeout ou erro de rede não trava a UI
  }
  return [];
}

// 7. Buscar Próximos Jogos Reais da Liquipedia (com timeout e cache de 3 min)
export async function fetchUpcomingMatches() {
  const cached = getCached("upcoming_real_matches_v3", 3 * 60 * 1000);
  if (cached) return cached;

  try {
    const res = await fetchWithTimeout("/api/upcoming", {}, 5000);
    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      if (list.length > 0) {
        setCache("upcoming_real_matches_v3", list);
      }
      return list;
    }
  } catch (err) {
    console.warn("Aviso ao buscar upcoming (usando cache anterior):", err);
  }
  return getCachedFast("upcoming_real_matches_v3") || [];
}

// 8. Buscar Telemetria em Tempo Real de Partida Ao Vivo (com matching robusto)
export async function findLiveMatchDetails(game) {
  if (!game) return { matchData: null, maps: [] };

  const nameA = game.timeA || game.radiant_team?.name || game.radiant_team?.team_name || "Radiant";
  const nameB = game.timeB || game.dire_team?.name || game.dire_team?.team_name || "Dire";

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
        const rad = m.radiant_name || m.radiant_team_id;
        const dire = m.dire_name || m.dire_team_id;
        const matchTime = m.start_time;
        const isRecent = Math.abs(Date.now() - matchTime * 1000) < (36 * 3600 * 1000);
        return isRecent && isSeriesMatch(nameA, nameB, rad, dire);
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

  // 3. Fallback: Se não encontrou partida no proMatches, buscar se há dados no liveLeagueGames
  try {
    const liveRes = await fetch(`${OPENDOTA_BASE}/liveLeagueGames`);
    if (liveRes.ok) {
      const liveJson = await liveRes.json();
      const games = liveJson?.result?.games || [];
      const liveGame = games.find(g => {
        const rad = g.radiant_team?.team_name || g.radiant_team?.name;
        const dire = g.dire_team?.team_name || g.dire_team?.name;
        return isSeriesMatch(nameA, nameB, rad, dire);
      });

      if (liveGame) {
        return { matchData: liveGame, maps: [{ mapNumber: 1, match_id: String(liveGame.match_id || '') }] };
      }
    }
  } catch (e) {}

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

// 10. Buscar Perfil do Time (por ID ou Nome)
export async function fetchTeamProfile(teamId, teamName = "") {
  const cacheKey = `team_profile_v4_${teamId || 'name'}_${teamName || 'id'}`;
  const cached = getCached(cacheKey, 15 * 60 * 1000);
  if (cached) return cached;

  let resolvedId = teamId;
  let baseTeam = null;

  // 1. Se não temos teamId, buscar de forma rigorosa na lista geral de times da OpenDota
  if (!resolvedId && teamName) {
    try {
      const teamsRes = await fetchWithTimeout(`${OPENDOTA_BASE}/teams`, {}, 5000);
      if (teamsRes.ok) {
        const allTeams = await teamsRes.json();
        const found = resolveTeamFromList(teamName, allTeams);
        if (found) {
          resolvedId = found.team_id;
          baseTeam = found;
        }
      }
    } catch (e) {
      console.warn("Erro ao buscar lista de times para resolver nome:", e);
    }
  }

  // 2. Se ainda não temos teamId, verificar se a equipe participou de partidas profissionais recentes
  const localProMatches = getCachedFast("pro_matches_v7")?.rawMatches || [];
  if (!resolvedId && teamName && localProMatches.length > 0) {
    const matchingProMatch = localProMatches.find((m) =>
      isSameTeamMatch(m.radiant_name, teamName) || isSameTeamMatch(m.dire_name, teamName)
    );
    if (matchingProMatch) {
      const isRad = isSameTeamMatch(matchingProMatch.radiant_name, teamName);
      const possibleId = isRad ? matchingProMatch.radiant_team_id : matchingProMatch.dire_team_id;
      if (possibleId) {
        resolvedId = possibleId;
      }
    }
  }

  // 3. Se temos um resolvedId válido, consultar endpoints detalhados da OpenDota
  if (resolvedId) {
    try {
      const [teamRes, matchesRes, heroesRes] = await Promise.all([
        fetchWithTimeout(`${OPENDOTA_BASE}/teams/${resolvedId}`, {}, 5000).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetchWithTimeout(`${OPENDOTA_BASE}/teams/${resolvedId}/matches`, {}, 5000).then((r) => (r.ok ? r.json() : [])).catch(() => []),
        fetchWithTimeout(`${OPENDOTA_BASE}/teams/${resolvedId}/heroes`, {}, 5000).then((r) => (r.ok ? r.json() : [])).catch(() => [])
      ]);

      const teamData = teamRes || baseTeam || {};
      const matches = Array.isArray(matchesRes) ? matchesRes : [];
      const topHeroes = Array.isArray(heroesRes) ? heroesRes : [];

      const last20 = matches.slice(0, 20);
      const wins = last20.filter((m) => (m.radiant && m.radiant_win) || (!m.radiant && !m.radiant_win)).length;
      const winRate = last20.length > 0
        ? Math.round((wins / last20.length) * 100)
        : (teamData.wins ? Math.round((teamData.wins / (teamData.wins + (teamData.losses || 1))) * 100) : 56);

      const result = {
        name: teamData.name || teamName,
        tag: teamData.tag || "",
        logo_url: teamData.logo_url || null,
        rating: teamData.rating || 1320,
        wins: teamData.wins || wins,
        losses: teamData.losses || (last20.length - wins),
        recentMatches: last20,
        recentWinRate: winRate,
        topHeroes: topHeroes.slice(0, 5),
        isUnranked: false
      };

      setCache(cacheKey, result);
      return result;
    } catch (err) {
      console.error("Erro ao carregar perfil do time por id:", err);
    }
  }

  // 4. Fallback fiel para novas equipes / qualificatórias regionais (sem inventar outro time!)
  const localMatches = (localProMatches || [])
    .filter((m) => isSameTeamMatch(m.radiant_name, teamName) || isSameTeamMatch(m.dire_name, teamName))
    .slice(0, 8)
    .map((m) => {
      const isRad = isSameTeamMatch(m.radiant_name, teamName);
      return {
        radiant: isRad,
        radiant_win: m.radiant_win,
        opposing_team_name: isRad ? (m.dire_name || "Adversário") : (m.radiant_name || "Adversário"),
        league_name: m.league_name || "Torneio Dota 2"
      };
    });

  const localWins = localMatches.filter((m) => (m.radiant && m.radiant_win) || (!m.radiant && !m.radiant_win)).length;
  const localLosses = localMatches.length - localWins;

  const fallbackResult = {
    name: teamName || "Equipe Competitiva",
    tag: (teamName || "").replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase(),
    logo_url: null,
    rating: null,
    isUnranked: true,
    wins: localWins,
    losses: localLosses,
    recentMatches: localMatches,
    recentWinRate: localMatches.length > 0 ? Math.round((localWins / localMatches.length) * 100) : null,
    topHeroes: []
  };

  setCache(cacheKey, fallbackResult);
  return fallbackResult;
}

// 11. Buscar Detalhes Completos do Herói (Habilidades, Aghanim, Talentos, Benchmarks, Counters)
export async function fetchHeroFullDetails(heroId, heroInternalName = "") {
  if (!heroId) return null;
  const cacheKey = `hero_full_details_${heroId}`;
  const cached = getCached(cacheKey, 60 * 60 * 1000);
  if (cached) return cached;

  try {
    const [heroAbilitiesRes, abilitiesRes, aghsRes, benchmarksRes, matchupsRes] = await Promise.all([
      fetchWithTimeout(`${OPENDOTA_BASE}/constants/hero_abilities`, {}, 6000).then(r => r.ok ? r.json() : {}).catch(() => ({})),
      fetchWithTimeout(`${OPENDOTA_BASE}/constants/abilities`, {}, 6000).then(r => r.ok ? r.json() : {}).catch(() => ({})),
      fetchWithTimeout(`${OPENDOTA_BASE}/constants/aghs_desc`, {}, 5000).then(r => r.ok ? r.json() : []).catch(() => []),
      fetchWithTimeout(`${OPENDOTA_BASE}/benchmarks?hero_id=${heroId}`, {}, 5000).then(r => r.ok ? r.json() : {}).catch(() => ({})),
      fetchWithTimeout(`${OPENDOTA_BASE}/heroes/${heroId}/matchups`, {}, 5000).then(r => r.ok ? r.json() : []).catch(() => [])
    ]);

    // Resolver chave interna do herói
    let resolvedKey = heroInternalName;
    if (!resolvedKey || !heroAbilitiesRes[resolvedKey]) {
      const keys = Object.keys(heroAbilitiesRes);
      resolvedKey = keys.find(k => k.includes(String(heroInternalName).toLowerCase())) ||
                    keys.find(k => heroAbilitiesRes[k]?.hero_id === heroId) ||
                    keys[0];
    }

    const heroData = heroAbilitiesRes[resolvedKey] || {};
    const abilityNames = (heroData.abilities || []).filter(a => a && !a.includes('generic_hidden'));

    const abilitiesList = abilityNames.map(name => {
      const raw = abilitiesRes[name] || {};
      return {
        name,
        dname: raw.dname || name.replace(/_/g, ' '),
        desc: raw.desc || '',
        behavior: Array.isArray(raw.behavior) ? raw.behavior.join(', ') : (raw.behavior || ''),
        dmg_type: raw.dmg_type || '',
        bkbpierce: raw.bkbpierce || '',
        mc: Array.isArray(raw.mc) ? raw.mc.join(' / ') : (raw.mc || ''),
        cd: Array.isArray(raw.cd) ? raw.cd.join(' / ') : (raw.cd || ''),
        img: raw.img ? `${STEAM_CDN}${raw.img}` : `${STEAM_CDN}/apps/dota2/images/dota_react/abilities/${name}.png`,
        attrib: raw.attrib || []
      };
    });

    // Aghanim's Scepter e Shard
    let aghsData = {};
    if (Array.isArray(aghsRes)) {
      aghsData = aghsRes.find(a => a.hero_id === heroId || a.hero_name === resolvedKey) || {};
    } else if (aghsRes && typeof aghsRes === 'object') {
      const shortKey = resolvedKey.replace('npc_dota_hero_', '');
      aghsData = aghsRes[shortKey] || aghsRes[resolvedKey] || {};
    }

    // Árvore de Talentos
    const rawTalents = heroData.talents || [];
    const talents = [4, 3, 2, 1].map(lvl => {
      const pair = rawTalents.filter(t => t.level === lvl);
      return {
        level: lvl === 1 ? 10 : lvl === 2 ? 15 : lvl === 3 ? 20 : 25,
        left: abilitiesRes[pair[0]?.name]?.dname || pair[0]?.name || 'Talento',
        right: abilitiesRes[pair[1]?.name]?.dname || pair[1]?.name || 'Talento'
      };
    });

    // Matchups (Melhores e Maiores Counters)
    const validMatchups = (Array.isArray(matchupsRes) ? matchupsRes : []).filter(m => m.games_played >= 8);
    validMatchups.sort((a, b) => (b.wins / b.games_played) - (a.wins / a.games_played));

    const bestMatchups = validMatchups.slice(0, 5).map(m => ({
      hero_id: m.hero_id,
      games_played: m.games_played,
      wins: m.wins,
      winRate: Number(((m.wins / m.games_played) * 100).toFixed(1))
    }));

    const worstMatchups = validMatchups.slice(-5).reverse().map(m => ({
      hero_id: m.hero_id,
      games_played: m.games_played,
      wins: m.wins,
      winRate: Number(((m.wins / m.games_played) * 100).toFixed(1))
    }));

    // Benchmarks de Performance (Percentis)
    const rawBench = benchmarksRes?.result || {};
    const extractPercentile = (metricName) => {
      const list = rawBench[metricName] || [];
      const p50 = list.find(item => Math.abs(item.percentile - 0.5) < 0.08)?.value || 0;
      const p75 = list.find(item => Math.abs(item.percentile - 0.75) < 0.08)?.value || 0;
      const p90 = list.find(item => Math.abs(item.percentile - 0.9) < 0.08)?.value || 0;
      return { p50: Math.round(p50), p75: Math.round(p75), p90: Math.round(p90) };
    };

    const benchmarks = {
      gpm: extractPercentile('gold_per_min'),
      xpm: extractPercentile('xp_per_min'),
      kpm: extractPercentile('kills_per_min'),
      lpm: extractPercentile('last_hits_per_min'),
      damage: extractPercentile('hero_damage_per_min')
    };

    const result = {
      hero_id: heroId,
      abilities: abilitiesList,
      aghs: {
        has_scepter: aghsData.has_scepter ?? true,
        scepter_desc: aghsData.scepter_desc || 'Aprimora uma habilidade existente ou adiciona um novo poder ao herói.',
        scepter_skill_name: aghsData.scepter_skill_name || 'Habilidade Cetro',
        has_shard: aghsData.has_shard ?? true,
        shard_desc: aghsData.shard_desc || 'Concede melhorias táticas ou novos efeitos passivos ao herói.',
        shard_skill_name: aghsData.shard_skill_name || 'Habilidade Fragmento'
      },
      talents,
      bestMatchups,
      worstMatchups,
      benchmarks
    };

    setCache(cacheKey, result);
    return result;
  } catch (err) {
    console.error("Erro ao carregar detalhes completos do herói:", err);
    return getCachedFast(cacheKey) || null;
  }
}

// 12. Buscar Recordes Mundiais do Dota 2
export async function fetchDotaRecords(recordType = "kills") {
  const cacheKey = `records_${recordType}`;
  const cached = getCached(cacheKey, 30 * 60 * 1000);
  if (cached) return cached;

  try {
    const res = await fetchWithTimeout(`${OPENDOTA_BASE}/records/${recordType}`, {}, 5000);
    if (res.ok) {
      const data = await res.json();
      const list = (Array.isArray(data) ? data : []).slice(0, 50);
      setCache(cacheKey, list);
      return list;
    }
  } catch (err) {
    console.warn("Aviso ao carregar recordes do Dota 2:", err);
  }
  return getCachedFast(cacheKey) || [];
}

// 13. Sinergias e Combos de Heróis Populares
export const POPULAR_HERO_COMBOS = [
  {
    heroAId: 41, // Faceless Void
    heroBId: 74, // Invoker
    synergy: "Chronosphere + Cataclysm",
    description: "Paralisação total em área permitindo dano solar puro devastador em todos os alvos congelados.",
    lane: "Safelane + Midlane",
    tier: "S+"
  },
  {
    heroAId: 97, // Magnus
    heroBId: 48, // Luna
    synergy: "Reverse Polarity + Eclipse",
    description: "Agrupamento de 5 heróis no centro do RP, seguido de feixes lunares e Glaives quicando em todos os inimigos.",
    lane: "Offlane + Safelane",
    tier: "S+"
  },
  {
    heroAId: 86, // Rubick
    heroBId: 106, // Ember Spirit
    synergy: "Telekinesis + Searing Chains",
    description: "Controle de grupo em cadeia contínuo com alta mobilidade e ganks precoces imparáveis.",
    lane: "Suporte + Midlane",
    tier: "S"
  },
  {
    heroAId: 1, // Anti-Mage
    heroBId: 111, // Oracle
    synergy: "False Promise + Mana Break",
    description: "Proteção absoluta contra ganks mágicos, permitindo que o Anti-Mage farme e sobreviva até o late game.",
    lane: "Safelane Duo",
    tier: "S"
  },
  {
    heroAId: 99, // Bristleback
    heroBId: 84, // Ogre Magi
    synergy: "Bloodlust + Warpath",
    description: "Velocidade de movimento e ataque absurdas, transformando o Bristleback em um tanque imparável de espinhos.",
    lane: "Offlane Duo",
    tier: "S"
  },
  {
    heroAId: 129, // Mars
    heroBId: 110, // Phoenix
    synergy: "Arena of Blood + Supernova",
    description: "A Arena tranca os adversários sem escape enquanto a Supernova castiga e atordoa toda a equipe inimiga.",
    lane: "Offlane + Suporte",
    tier: "S+"
  },
  {
    heroAId: 18, // Sven
    heroBId: 90, // Keeper of the Light
    synergy: "Chakra Magic + Storm Hammer",
    description: "Mana infinita e redução de tempo de recarga para Sven lançar martelos de atordoamento constantes na lane.",
    lane: "Safelane Duo",
    tier: "A"
  },
  {
    heroAId: 68, // Ancient Apparition
    heroBId: 71, // Spirit Breaker
    synergy: "Charge of Darkness + Ice Blast",
    description: "Visão global garantida pela investida do Spirit Breaker, alinhando a explosão de gelo do AA à distância.",
    lane: "Roaming / Global",
    tier: "S"
  }
];