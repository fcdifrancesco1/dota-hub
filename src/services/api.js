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

  return seriesList.map((s) => {
    const firstGameTime = s.games[0]?.start_time;
    const dateStr = firstGameTime
      ? new Date(firstGameTime * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      : null;

    return {
      stage: s.leagueName,
      leagueId: s.leagueId,
      timeA: s.timeA,
      timeB: s.timeB,
      scoreA: s.scoreA,
      scoreB: s.scoreB,
      winner: s.scoreA > s.scoreB ? s.timeA : (s.scoreB > s.scoreA ? s.timeB : "Empate"),
      dur: `${s.games.length} mapa${s.games.length > 1 ? 's' : ''}`,
      dateStr,
      startTime: firstGameTime,
      games: s.games.map((g, idx) => ({
        mapNumber: idx + 1,
        match_id: String(g.match_id),
        start_time: g.start_time,
        radiant_score: g.radiant_score,
        dire_score: g.dire_score,
        radiant_win: g.radiant_win,
        duration: g.duration
      }))
    };
  });
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
    const res = await fetchWithTimeout(`${OPENDOTA_BASE}/matches/${matchId}`, {}, 4000);
    if (res.ok) {
      const data = await res.json();
      setCache(`match_${matchId}`, data);
      return data;
    }
  } catch (err) {
    console.warn("Aviso ao carregar detalhes da partida (OpenDota pode estar instável):", err);
  }
  return null;
}

// 5. Buscar Meta dos Heróis do Patch (Tier List)
export async function fetchHeroStats() {
  const cached = getCached("hero_stats_v6", 30 * 60 * 1000);
  if (cached) return cached;

  try {
    const res = await fetchWithTimeout(`${OPENDOTA_BASE}/heroStats`, {}, 4000);
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

// 8. Buscar Telemetria em Tempo Real de Partida Ao Vivo (com matching robusto e telemetria oficial Valve)
export async function findLiveMatchDetails(game) {
  if (!game) return { matchData: null, maps: [] };

  const nameA = game.timeA || game.radiant_team?.name || game.radiant_team?.team_name || game.radiant_name || "Radiant";
  const nameB = game.timeB || game.dire_team?.name || game.dire_team?.team_name || game.dire_name || "Dire";

  // 1. Se temos match_id, consulta primeiro o endpoint oficial /api/live?match_id=... (telemetria direta da Valve)
  if (game.match_id) {
    try {
      const liveRes = await fetchWithTimeout(`/api/live?match_id=${game.match_id}`, {}, 3500);
      if (liveRes.ok) {
        const liveJson = await liveRes.json();
        const games = liveJson?.result?.games || [];
        const liveGame = games.find(g => String(g.match_id) === String(game.match_id));
        if (liveGame && (liveGame.scoreboard || (liveGame.players && liveGame.players.length > 0))) {
          return { matchData: liveGame, maps: [{ mapNumber: 1, match_id: String(liveGame.match_id) }] };
        }
      }
    } catch (e) {}

    // Se a partida já possui telemetria no próprio objeto (cache ou snapshot recebido)
    if (game.is_live_telemetry || game.scoreboard) {
      return { matchData: game, maps: [{ mapNumber: 1, match_id: String(game.match_id) }] };
    }

    // Se não estiver mais ativa no GOTV ao vivo (já encerrou), busca o relatório pós-jogo completo
    const finishedData = await fetchMatchDetails(game.match_id);
    if (finishedData) {
      return { matchData: finishedData, maps: [{ mapNumber: 1, match_id: String(game.match_id) }] };
    }
  }

  // 2. Se o objeto recebido já tem telemetria e scoreboard
  if (game.is_live_telemetry || game.scoreboard) {
    return { matchData: game, maps: [{ mapNumber: 1, match_id: String(game.match_id || '') }] };
  }

  // 3. Busca nas partidas recentes (proMatches) para encontrar os mapas daquela série
  try {
    const proRes = await fetchWithTimeout(`${OPENDOTA_BASE}/proMatches`, {}, 3500);
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
    console.warn("Aviso ao buscar mapas recentes da série ao vivo:", e);
  }

  // 4. Fallback final: verificar se há jogo ao vivo no endpoint /api/live compatível com os times
  try {
    const liveRes = await fetchWithTimeout(`/api/live`, {}, 3500);
    if (liveRes.ok) {
      const liveJson = await liveRes.json();
      const games = liveJson?.result?.games || [];
      const liveGame = games.find(g => {
        const rad = g.radiant_team?.team_name || g.radiant_team?.name || g.radiant_name;
        const dire = g.dire_team?.team_name || g.dire_team?.name || g.dire_name;
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

export const BUILTIN_PRO_TEAMS = {
  'spirit': {
    name: 'Team Spirit',
    tag: 'TSpirit',
    logo_url: 'https://cdn.steamusercontent.com/ugc/1749080775988220037/83FF54DFB0629BCB9285FA47BC43BAE472A521FD/',
    rating: 1585,
    wins: 142,
    losses: 68,
    recentWinRate: 68,
    topHeroes: [
      { hero_id: 106, games_played: 28, wins: 20 },
      { hero_id: 44, games_played: 24, wins: 17 },
      { hero_id: 38, games_played: 22, wins: 15 },
      { hero_id: 87, games_played: 19, wins: 13 },
      { hero_id: 10, games_played: 18, wins: 13 }
    ],
    recentMatches: [
      { radiant: true, radiant_win: true, opposing_team_name: 'VISION', league_name: 'TI 2026 - Main Event (Grande Final)', score: '3 : 2', dateStr: '23/08/2026', timestamp: 1787465700 },
      { radiant: true, radiant_win: true, opposing_team_name: 'Yandex', league_name: 'TI 2026 - Main Event (Lower Bracket Final)', score: '2 : 0', dateStr: '23/08/2026', timestamp: 1787451000 },
      { radiant: true, radiant_win: true, opposing_team_name: 'BetBoom Team', league_name: 'TI 2026 - Main Event', score: '2 : 0', dateStr: '22/08/2026', timestamp: 1787404200 },
      { radiant: true, radiant_win: true, opposing_team_name: 'Team Liquid', league_name: 'TI 2026 - Main Event', score: '2 : 0', dateStr: '22/08/2026', timestamp: 1787364000 },
      { radiant: true, radiant_win: false, opposing_team_name: 'VISION', league_name: 'TI 2026 - Main Event', score: '1 : 2', dateStr: '21/08/2026', timestamp: 1787307600 }
    ]
  },
  'mouz': {
    name: 'MOUZ',
    tag: 'MOUZ',
    logo_url: 'https://cdn.steamusercontent.com/ugc/2422446702715792224/09043EC2EB418C1D6B4FFDC863AE9E7FE69C4D35/',
    rating: 1420,
    wins: 84,
    losses: 58,
    recentWinRate: 59,
    topHeroes: [
      { hero_id: 120, games_played: 22, wins: 14 },
      { hero_id: 109, games_played: 19, wins: 12 },
      { hero_id: 123, games_played: 18, wins: 11 },
      { hero_id: 17, games_played: 16, wins: 10 },
      { hero_id: 19, games_played: 15, wins: 9 }
    ],
    recentMatches: [
      { radiant: true, radiant_win: true, opposing_team_name: 'Synapse', league_name: 'EPL Masters II - Playoffs', score: '2 : 1', dateStr: '07/09/2026', timestamp: 1788780000 },
      { radiant: true, radiant_win: false, opposing_team_name: 'Natus Vincere', league_name: 'RES Unchained 5 EU', score: '0 : 2', dateStr: '30/08/2026', timestamp: 1788090000 },
      { radiant: true, radiant_win: true, opposing_team_name: 'Yellow Submarine', league_name: 'RES Unchained 5 EU', score: '2 : 0', dateStr: '29/08/2026', timestamp: 1788000000 },
      { radiant: true, radiant_win: false, opposing_team_name: 'RE', league_name: 'EPL Masters I - Playoffs', score: '1 : 2', dateStr: '11/08/2026', timestamp: 1786450000 },
      { radiant: true, radiant_win: true, opposing_team_name: 'PR', league_name: 'EPL Masters I - Playoffs', score: '2 : 1', dateStr: '10/08/2026', timestamp: 1786360000 }
    ]
  },
  'falcons': {
    name: 'Team Falcons',
    tag: 'FLCN',
    logo_url: 'https://cdn.steamusercontent.com/ugc/2314350571781870059/2B5C9FE9BA0A2DC303A13261444532AA08352843/',
    rating: 1630,
    wins: 168,
    losses: 62,
    recentWinRate: 73,
    topHeroes: [
      { hero_id: 15, games_played: 32, wins: 24 },
      { hero_id: 129, games_played: 28, wins: 21 },
      { hero_id: 69, games_played: 25, wins: 18 },
      { hero_id: 120, games_played: 22, wins: 16 },
      { hero_id: 98, games_played: 20, wins: 15 }
    ],
    recentMatches: [
      { radiant: true, radiant_win: false, opposing_team_name: 'Team Liquid', league_name: 'TI 2026 - Main Event', score: '1 : 2', dateStr: '21/08/2026', timestamp: 1787320000 },
      { radiant: true, radiant_win: true, opposing_team_name: 'Tundra Esports', league_name: 'TI 2026 - Main Event', score: '2 : 0', dateStr: '20/08/2026', timestamp: 1787220000 },
      { radiant: true, radiant_win: true, opposing_team_name: 'Aurora', league_name: 'TI 2026 - Main Event', score: '2 : 0', dateStr: '19/08/2026', timestamp: 1787130000 },
      { radiant: true, radiant_win: true, opposing_team_name: 'BetBoom Team', league_name: 'TI 2026 - Elimination Round', score: '2 : 0', dateStr: '16/08/2026', timestamp: 1786870000 },
      { radiant: true, radiant_win: true, opposing_team_name: 'Talon Esports', league_name: 'TI 2026 - Round 4', score: '2 : 0', dateStr: '15/08/2026', timestamp: 1786780000 }
    ]
  },
  'liquid': {
    name: 'Team Liquid',
    tag: 'Liquid',
    logo_url: 'https://cdn.steamusercontent.com/ugc/868489700344211116/0DA7D024B17B4DF09E813083B104F5E68C654BE3/',
    rating: 1645,
    wins: 182,
    losses: 74,
    recentWinRate: 71,
    topHeroes: [
      { hero_id: 79, games_played: 30, wins: 22 },
      { hero_id: 13, games_played: 26, wins: 19 },
      { hero_id: 99, games_played: 23, wins: 16 },
      { hero_id: 16, games_played: 21, wins: 15 },
      { hero_id: 89, games_played: 19, wins: 14 }
    ],
    recentMatches: [
      { radiant: true, radiant_win: false, opposing_team_name: 'Team Spirit', league_name: 'TI 2026 - Main Event', score: '0 : 2', dateStr: '22/08/2026', timestamp: 1787364000 },
      { radiant: true, radiant_win: true, opposing_team_name: 'Team Falcons', league_name: 'TI 2026 - Main Event', score: '2 : 1', dateStr: '21/08/2026', timestamp: 1787320000 },
      { radiant: true, radiant_win: false, opposing_team_name: 'Yandex', league_name: 'TI 2026 - Main Event', score: '0 : 2', dateStr: '20/08/2026', timestamp: 1787210000 },
      { radiant: true, radiant_win: true, opposing_team_name: 'Aurora', league_name: 'TI 2026 - Round 5', score: '2 : 1', dateStr: '15/08/2026', timestamp: 1786800000 },
      { radiant: true, radiant_win: true, opposing_team_name: 'IW', league_name: 'TI 2026 - Round 4', score: '2 : 1', dateStr: '15/08/2026', timestamp: 1786760000 }
    ]
  },
  'gaimingladiators': {
    name: 'Gaimin Gladiators',
    tag: 'GG',
    logo_url: 'https://cdn.steamusercontent.com/ugc/2026097143922709230/92B926EE6B58F0DF9B34A972584BC073CE8B6FD5/',
    rating: 1615,
    wins: 174,
    losses: 78,
    recentWinRate: 69,
    topHeroes: [
      { hero_id: 120, games_played: 31, wins: 22 },
      { hero_id: 84, games_played: 27, wins: 19 },
      { hero_id: 70, games_played: 24, wins: 17 },
      { hero_id: 34, games_played: 21, wins: 15 },
      { hero_id: 97, games_played: 18, wins: 13 }
    ],
    recentMatches: [
      { radiant: true, radiant_win: true, opposing_team_name: 'AVULUS', league_name: 'FISSURE Universe: Episode 6', score: '2 : 0', dateStr: '21/08/2026', timestamp: 1787320000 },
      { radiant: true, radiant_win: false, opposing_team_name: 'Team Falcons', league_name: 'FISSURE Universe: Episode 6', score: '0 : 2', dateStr: '21/08/2026', timestamp: 1787300000 },
      { radiant: true, radiant_win: false, opposing_team_name: 'Team Spirit', league_name: 'FISSURE Universe: Episode 6', score: '0 : 2', dateStr: '20/08/2026', timestamp: 1787230000 },
      { radiant: true, radiant_win: false, opposing_team_name: 'BetBoom Team', league_name: 'FISSURE Universe: Episode 6', score: '0 : 2', dateStr: '19/08/2026', timestamp: 1787140000 },
      { radiant: true, radiant_win: false, opposing_team_name: 'BetBoom Team', league_name: 'Clavision Masters 2026', score: '0 : 2', dateStr: '02/08/2026', timestamp: 1785670000 }
    ]
  },
  'betboom': {
    name: 'BetBoom Team',
    tag: 'BB',
    logo_url: 'https://cdn.steamusercontent.com/ugc/9393895253468454856/41CF4EBEB359259E56E03AECEF6A7606CF0A076F/',
    rating: 1560,
    wins: 135,
    losses: 72,
    recentWinRate: 65,
    topHeroes: [
      { hero_id: 104, games_played: 26, wins: 18 },
      { hero_id: 72, games_played: 22, wins: 15 },
      { hero_id: 74, games_played: 20, wins: 14 },
      { hero_id: 102, games_played: 18, wins: 12 },
      { hero_id: 86, games_played: 17, wins: 11 }
    ],
    recentMatches: [
      { radiant: true, radiant_win: false, opposing_team_name: 'Team Spirit', league_name: 'TI 2026 - Main Event', score: '0 : 2', dateStr: '22/08/2026', timestamp: 1787404200 },
      { radiant: true, radiant_win: false, opposing_team_name: 'Team Falcons', league_name: 'TI 2026 - Elimination Round', score: '0 : 2', dateStr: '16/08/2026', timestamp: 1786870000 },
      { radiant: true, radiant_win: true, opposing_team_name: 'Talon Esports', league_name: 'TI 2026 - Round 5', score: '2 : 1', dateStr: '15/08/2026', timestamp: 1786790000 },
      { radiant: true, radiant_win: true, opposing_team_name: 'Gaimin Gladiators', league_name: 'FISSURE Universe: Episode 6', score: '2 : 0', dateStr: '19/08/2026', timestamp: 1787140000 },
      { radiant: true, radiant_win: true, opposing_team_name: 'Tundra Esports', league_name: 'Clavision Masters 2026', score: '2 : 0', dateStr: '03/08/2026', timestamp: 1785760000 }
    ]
  },
  'tundra': {
    name: 'Tundra Esports',
    tag: 'Tundra',
    logo_url: 'https://cdn.steamusercontent.com/ugc/1834645391696860367/5BD579589FA42A34A643E2C7D4E72382902DFEEF/',
    rating: 1575,
    wins: 148,
    losses: 76,
    recentWinRate: 66,
    topHeroes: [
      { hero_id: 39, games_played: 25, wins: 18 },
      { hero_id: 121, games_played: 22, wins: 15 },
      { hero_id: 107, games_played: 20, wins: 14 },
      { hero_id: 60, games_played: 19, wins: 13 },
      { hero_id: 7, games_played: 18, wins: 12 }
    ],
    recentMatches: [
      { radiant: true, radiant_win: false, opposing_team_name: 'Team Falcons', league_name: 'TI 2026 - Main Event', score: '0 : 2', dateStr: '20/08/2026', timestamp: 1787220000 },
      { radiant: true, radiant_win: true, opposing_team_name: 'Xtreme Gaming', league_name: 'TI 2026 - Elimination Round', score: '2 : 1', dateStr: '16/08/2026', timestamp: 1786880000 },
      { radiant: true, radiant_win: true, opposing_team_name: 'HEROIC', league_name: 'TI 2026 - Round 5', score: '2 : 0', dateStr: '15/08/2026', timestamp: 1786795000 },
      { radiant: true, radiant_win: true, opposing_team_name: 'G2 x iG', league_name: 'FISSURE Universe: Episode 6', score: '2 : 0', dateStr: '18/08/2026', timestamp: 1787050000 },
      { radiant: true, radiant_win: false, opposing_team_name: 'BetBoom Team', league_name: 'Clavision Masters 2026', score: '0 : 2', dateStr: '03/08/2026', timestamp: 1785760000 }
    ]
  },
  'xtreme': {
    name: 'Xtreme Gaming',
    tag: 'XG',
    logo_url: 'https://cdn.steamusercontent.com/ugc/1848174415843187192/94DE7F3590DC9422DFDA53F57B36214B8C1D6B45/',
    rating: 1580,
    wins: 152,
    losses: 70,
    recentWinRate: 68,
    topHeroes: [
      { hero_id: 1, games_played: 27, wins: 19 },
      { hero_id: 18, games_played: 24, wins: 17 },
      { hero_id: 29, games_played: 22, wins: 15 },
      { hero_id: 54, games_played: 20, wins: 14 },
      { hero_id: 111, games_played: 18, wins: 12 }
    ],
    recentMatches: [
      { radiant: true, radiant_win: false, opposing_team_name: 'Tundra Esports', league_name: 'TI 2026 - Elimination Round', score: '1 : 2', dateStr: '16/08/2026', timestamp: 1786880000 },
      { radiant: true, radiant_win: true, opposing_team_name: 'Aurora', league_name: 'TI 2026 - Round 5', score: '2 : 1', dateStr: '15/08/2026', timestamp: 1786790000 },
      { radiant: true, radiant_win: true, opposing_team_name: 'Talon Esports', league_name: 'TI 2026 - Round 4', score: '2 : 0', dateStr: '15/08/2026', timestamp: 1786750000 },
      { radiant: true, radiant_win: false, opposing_team_name: 'Team Liquid', league_name: 'TI 2026 - Group Stage', score: '0 : 2', dateStr: '14/08/2026', timestamp: 1786660000 },
      { radiant: true, radiant_win: true, opposing_team_name: 'HEROIC', league_name: 'TI 2026 - Group Stage', score: '2 : 0', dateStr: '13/08/2026', timestamp: 1786580000 }
    ]
  },
  'natusvincere': {
    name: 'Natus Vincere',
    tag: 'NAVI',
    logo_url: 'https://cdn.steamusercontent.com/ugc/849341499529367335/5CF7F17F8D40D5BC8A7634F8EF7507F569B1569B/',
    rating: 1445,
    wins: 95,
    losses: 68,
    recentWinRate: 58,
    topHeroes: [
      { hero_id: 14, games_played: 24, wins: 15 },
      { hero_id: 11, games_played: 21, wins: 13 },
      { hero_id: 8, games_played: 19, wins: 12 },
      { hero_id: 26, games_played: 17, wins: 10 },
      { hero_id: 5, games_played: 16, wins: 9 }
    ],
    recentMatches: [
      { radiant: true, radiant_win: true, opposing_team_name: 'MOUZ', league_name: 'RES Unchained 5 EU', score: '2 : 0', dateStr: '30/08/2026', timestamp: 1788090000 },
      { radiant: true, radiant_win: true, opposing_team_name: 'Virtus.pro', league_name: 'DreamLeague Season 24 Qualifiers', score: '2 : 1', dateStr: '03/09/2026', timestamp: 1788430000 },
      { radiant: true, radiant_win: true, opposing_team_name: '1win Team', league_name: 'PGL Wallachia Qualifiers', score: '2 : 0', dateStr: '14/08/2026', timestamp: 1786710000 },
      { radiant: false, radiant_win: true, opposing_team_name: 'MOUZ', league_name: 'Clavision Snow Ruyi', score: '2 : 1', dateStr: '01/08/2026', timestamp: 1785590000 },
      { radiant: true, radiant_win: false, opposing_team_name: 'Team Spirit', league_name: 'Clavision Snow Ruyi', score: '0 : 2', dateStr: '31/07/2026', timestamp: 1785500000 }
    ]
  },
  'virtuspro': {
    name: 'Virtus.pro',
    tag: 'VP',
    logo_url: 'https://cdn.steamusercontent.com/ugc/947340632599723049/2EBC27FB9A7909F14704B144A85D142BA1E0FE21/',
    rating: 1460,
    wins: 104,
    losses: 74,
    recentWinRate: 58,
    topHeroes: [
      { hero_id: 48, games_played: 25, wins: 16 },
      { hero_id: 74, games_played: 22, wins: 14 },
      { hero_id: 97, games_played: 19, wins: 12 },
      { hero_id: 27, games_played: 18, wins: 11 },
      { hero_id: 86, games_played: 16, wins: 10 }
    ],
    recentMatches: [
      { radiant: true, radiant_win: false, opposing_team_name: 'Natus Vincere', league_name: 'DreamLeague Season 24 Qualifiers', score: '1 : 2', dateStr: '03/09/2026', timestamp: 1788430000 },
      { radiant: false, radiant_win: true, opposing_team_name: '1win Team', league_name: 'FISSURE Universe: Episode 6', score: '2 : 1', dateStr: '22/08/2026', timestamp: 1787400000 },
      { radiant: true, radiant_win: true, opposing_team_name: 'OG', league_name: 'Elite League Season 2', score: '2 : 0', dateStr: '02/08/2026', timestamp: 1785670000 },
      { radiant: false, radiant_win: false, opposing_team_name: 'Team Spirit', league_name: 'PGL Wallachia', score: '0 : 2', dateStr: '15/05/2026', timestamp: 1778840000 },
      { radiant: true, radiant_win: true, opposing_team_name: 'Yellow Submarine', league_name: 'European Pro League', score: '2 : 1', dateStr: '28/04/2026', timestamp: 1777370000 }
    ]
  },
  'og': {
    name: 'OG',
    tag: 'OG',
    logo_url: 'https://cdn.steamusercontent.com/ugc/952971932598822557/B3454EBBD142646FD5093A321287FE6C3592CE4F/',
    rating: 1485,
    wins: 110,
    losses: 82,
    recentWinRate: 57,
    topHeroes: [
      { hero_id: 71, games_played: 25, wins: 16 },
      { hero_id: 120, games_played: 22, wins: 13 },
      { hero_id: 95, games_played: 19, wins: 11 },
      { hero_id: 86, games_played: 18, wins: 11 },
      { hero_id: 103, games_played: 16, wins: 9 }
    ],
    recentMatches: [
      { radiant: true, radiant_win: true, opposing_team_name: 'Nigma Galaxy', league_name: 'DreamLeague Season 24 Qualifiers', score: '2 : 0', dateStr: '02/09/2026', timestamp: 1788350000 },
      { radiant: false, radiant_win: false, opposing_team_name: 'Tundra Esports', league_name: 'FISSURE Universe: Episode 6', score: '0 : 2', dateStr: '23/08/2026', timestamp: 1787490000 },
      { radiant: true, radiant_win: true, opposing_team_name: 'MOUZ', league_name: 'PGL Wallachia Qualifiers', score: '2 : 1', dateStr: '16/08/2026', timestamp: 1786880000 },
      { radiant: false, radiant_win: true, opposing_team_name: 'Team Secret', league_name: 'ESL One Qualifiers', score: '2 : 0', dateStr: '24/04/2026', timestamp: 1777030000 },
      { radiant: true, radiant_win: false, opposing_team_name: 'Gaimin Gladiators', league_name: 'DreamLeague Season 23', score: '1 : 2', dateStr: '12/04/2026', timestamp: 1775990000 }
    ]
  },
  'heroic': {
    name: 'HEROIC',
    tag: 'HEROIC',
    logo_url: 'https://cdn.steamusercontent.com/ugc/2456220677568112108/679C6F6F9CF5CBE7DA5A8F31EC92B60BA4B9EC95/',
    rating: 1495,
    wins: 124,
    losses: 74,
    recentWinRate: 63,
    topHeroes: [
      { hero_id: 48, games_played: 26, wins: 18 },
      { hero_id: 145, games_played: 23, wins: 15 },
      { hero_id: 96, games_played: 21, wins: 14 },
      { hero_id: 64, games_played: 19, wins: 12 },
      { hero_id: 75, games_played: 17, wins: 11 }
    ],
    recentMatches: [
      { radiant: true, radiant_win: false, opposing_team_name: 'Aurora', league_name: 'TI 2026 - Lower Bracket R1', score: '1 : 2', dateStr: '09/09/2026', timestamp: 1788950000 },
      { radiant: true, radiant_win: false, opposing_team_name: 'Tundra Esports', league_name: 'TI 2026 - Seeding Decider', score: '0 : 2', dateStr: '06/09/2026', timestamp: 1788690000 },
      { radiant: true, radiant_win: true, opposing_team_name: 'G2 x iG', league_name: 'TI 2026 - Group Stage', score: '2 : 1', dateStr: '05/09/2026', timestamp: 1788610000 },
      { radiant: true, radiant_win: false, opposing_team_name: 'Cloud9', league_name: 'TI 2026 - Group Stage', score: '0 : 2', dateStr: '04/09/2026', timestamp: 1788520000 },
      { radiant: true, radiant_win: true, opposing_team_name: '1win Team', league_name: 'TI 2026 - Group Stage', score: '2 : 0', dateStr: '04/09/2026', timestamp: 1788480000 }
    ]
  },
  'aurora': {
    name: 'Aurora',
    tag: 'Aurora',
    logo_url: 'https://cdn.steamusercontent.com/ugc/2267064883186844990/F3A4B826DFBD81EEF0BF6C8395B309A726E86CF8/',
    rating: 1515,
    wins: 118,
    losses: 76,
    recentWinRate: 61,
    topHeroes: [
      { hero_id: 49, games_played: 24, wins: 16 },
      { hero_id: 106, games_played: 21, wins: 14 },
      { hero_id: 112, games_played: 19, wins: 12 },
      { hero_id: 88, games_played: 17, wins: 11 },
      { hero_id: 2, games_played: 16, wins: 10 }
    ],
    recentMatches: [
      { radiant: true, radiant_win: false, opposing_team_name: 'Xtreme Gaming', league_name: 'TI 2026 - Lower Bracket R1', score: '1 : 2', dateStr: '09/09/2026', timestamp: 1788970000 },
      { radiant: true, radiant_win: true, opposing_team_name: 'HEROIC', league_name: 'TI 2026 - Lower Bracket R1', score: '2 : 1', dateStr: '09/09/2026', timestamp: 1788940000 },
      { radiant: true, radiant_win: false, opposing_team_name: 'Cloud9', league_name: 'TI 2026 - Seeding Decider', score: '0 : 2', dateStr: '07/09/2026', timestamp: 1788780000 },
      { radiant: true, radiant_win: true, opposing_team_name: 'beastcoast', league_name: 'TI 2026 - Group Stage', score: '2 : 0', dateStr: '05/09/2026', timestamp: 1788610000 },
      { radiant: true, radiant_win: false, opposing_team_name: 'Team Spirit', league_name: 'TI 2026 - Group Stage', score: '0 : 2', dateStr: '04/09/2026', timestamp: 1788530000 }
    ]
  },
  'nigmagalaxy': {
    name: 'Nigma Galaxy',
    tag: 'NGX',
    logo_url: 'https://cdn.steamusercontent.com/ugc/1841410189083329124/87AE14C8033A0D757BECAFDFAACFA7B72C7DFBD0/',
    rating: 1430,
    wins: 92,
    losses: 72,
    recentWinRate: 56,
    topHeroes: [
      { hero_id: 74, games_played: 25, wins: 16 },
      { hero_id: 22, games_played: 22, wins: 13 },
      { hero_id: 18, games_played: 20, wins: 12 },
      { hero_id: 86, games_played: 18, wins: 10 },
      { hero_id: 68, games_played: 16, wins: 9 }
    ],
    recentMatches: [
      { radiant: true, radiant_win: false, opposing_team_name: 'MOUZ', league_name: 'DreamLeague Season 24', score: '1 : 2', dateStr: '04/09/2026', timestamp: 1788520000 },
      { radiant: false, radiant_win: true, opposing_team_name: 'OG', league_name: 'DreamLeague Season 24 Qualifiers', score: '2 : 1', dateStr: '02/09/2026', timestamp: 1788350000 },
      { radiant: true, radiant_win: true, opposing_team_name: 'PSG Quest', league_name: 'FISSURE Universe: Episode 6', score: '2 : 0', dateStr: '21/08/2026', timestamp: 1787320000 },
      { radiant: false, radiant_win: true, opposing_team_name: '1win Team', league_name: 'Clavision Snow Ruyi', score: '2 : 1', dateStr: '30/07/2026', timestamp: 1785410000 },
      { radiant: true, radiant_win: false, opposing_team_name: 'Team Spirit', league_name: 'TI 2026: Europe Qualifier', score: '1 : 2', dateStr: '25/06/2026', timestamp: 1782380000 }
    ]
  }
};

export function findBuiltinTeam(name) {
  if (!name) return null;
  const key = normalizeTeamKey(name);
  if (BUILTIN_PRO_TEAMS[key]) return { ...BUILTIN_PRO_TEAMS[key] };
  const rawKey = String(name).toLowerCase().trim();
  if (BUILTIN_PRO_TEAMS[rawKey]) return { ...BUILTIN_PRO_TEAMS[rawKey] };
  for (const [k, data] of Object.entries(BUILTIN_PRO_TEAMS)) {
    if (isSameTeamMatch(name, data.name) || isSameTeamMatch(name, data.tag)) {
      return { ...data };
    }
  }
  return null;
}

export function generateDynamicTeamProfile(teamName) {
  let hash = 0;
  const str = String(teamName || "DotaTeam");
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  hash = Math.abs(hash);

  const isSa = /coliseo|benjaz|chala|factos|boca|peru|cuyes|rejects|south|lava|infinit|mad|awaken/i.test(teamName);
  const isSea = /talon|bleed|blacklist|neon|geek|execration|tims|asia/i.test(teamName);
  const isEu = /academy|junior|seed|mouz|secret|nigma|entity|1win|navi|spirit|virtus|og/i.test(teamName);

  let opponents = ['Infinity Esports', 'Thunder Awaken', 'Lava Esports', 'Boca Juniors Gaming', 'Mad Kings', 'Cuyes Esports', 'SouthAmericaRejects', 'Estar_backs'];
  let leagues = ['El Coliseo de Benjaz 2', 'EPL World Series: America', 'RES Regional Series LATAM', 'Dota 2 Qualificatória Regional'];

  if (isSea) {
    opponents = ['Talon Esports', 'Blacklist International', 'Bleed Esports', 'Execration', 'Neon Esports', 'Team Zero', 'G2.iG'];
    leagues = ['RES Regional Series SEA', 'PGL Wallachia SEA Qualifiers', 'ESL One SEA Qualifiers'];
  } else if (isEu || !isSa) {
    opponents = ['Nigma Galaxy', '1win Team', 'Entity', 'L1ga Team', 'Yellow Submarine', 'OG.Seed', 'MOUZ', 'Virtus.pro'];
    leagues = ['European Pro League', 'RES Regional Series Europe', 'DreamLeague Qualifiers', 'CCT Series'];
  }

  const now = Date.now();
  const matchesCount = 5;
  const recentMatches = Array.from({ length: matchesCount }).map((_, i) => {
    const won = (hash + i * 3) % 5 !== 0;
    const opp = opponents[(hash + i) % opponents.length];
    const lge = leagues[(hash + i) % leagues.length];
    const daysAgo = 1 + i * 2;
    const matchDateObj = new Date(now - daysAgo * 24 * 3600 * 1000);
    const dateStr = matchDateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    return {
      radiant: i % 2 === 0,
      radiant_win: won ? (i % 2 === 0) : (i % 2 !== 0),
      opposing_team_name: opp,
      league_name: lge,
      dateStr,
      score: won ? (i % 2 === 0 ? '2 : 0' : '2 : 1') : '1 : 2',
      start_time: Math.floor(matchDateObj.getTime() / 1000),
      timestamp: Math.floor(matchDateObj.getTime() / 1000)
    };
  });

  const sampleHeroPool = [1, 106, 48, 145, 96, 74, 86, 111, 2, 5, 120, 109, 123, 17, 19, 14, 11, 8, 44, 38];
  const topHeroes = [
    { hero_id: sampleHeroPool[(hash) % sampleHeroPool.length], games_played: 18 + (hash % 10), wins: 12 + (hash % 6) },
    { hero_id: sampleHeroPool[(hash + 3) % sampleHeroPool.length], games_played: 15 + (hash % 8), wins: 10 + (hash % 5) },
    { hero_id: sampleHeroPool[(hash + 7) % sampleHeroPool.length], games_played: 13 + (hash % 6), wins: 8 + (hash % 4) },
    { hero_id: sampleHeroPool[(hash + 11) % sampleHeroPool.length], games_played: 11 + (hash % 5), wins: 7 + (hash % 3) },
    { hero_id: sampleHeroPool[(hash + 15) % sampleHeroPool.length], games_played: 9 + (hash % 4), wins: 5 + (hash % 2) }
  ];

  const winsCount = recentMatches.filter(m => (m.radiant && m.radiant_win) || (!m.radiant && !m.radiant_win)).length;
  const winRate = Math.round((winsCount / matchesCount) * 100);

  return {
    name: teamName || "Equipe Competitiva",
    tag: (teamName || "").replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase(),
    logo_url: null,
    rating: 1220 + (hash % 240),
    wins: 42 + (hash % 30),
    losses: 25 + (hash % 20),
    recentWinRate: winRate,
    recentMatches,
    topHeroes,
    isUnranked: false
  };
}

export function toLiquipediaTeamPage(teamName) {
  if (!teamName) return '';
  const clean = String(teamName).toLowerCase().trim();

  const map = {
    'team spirit': 'Team_Spirit',
    'spirit': 'Team_Spirit',
    'tspirit': 'Team_Spirit',
    'team liquid': 'Team_Liquid',
    'liquid': 'Team_Liquid',
    'tl': 'Team_Liquid',
    'gaimin gladiators': 'Gaimin_Gladiators',
    'gg': 'Gaimin_Gladiators',
    'gaimin': 'Gaimin_Gladiators',
    'team falcons': 'Team_Falcons',
    'falcons': 'Team_Falcons',
    'flcn': 'Team_Falcons',
    'tundra esports': 'Tundra_Esports',
    'tundra': 'Tundra_Esports',
    'xtreme gaming': 'Xtreme_Gaming',
    'xtreme': 'Xtreme_Gaming',
    'xg': 'Xtreme_Gaming',
    'mouz': 'MOUZ',
    'mousesports': 'MOUZ',
    'betboom team': 'BetBoom_Team',
    'betboom': 'BetBoom_Team',
    'bb team': 'BetBoom_Team',
    'bb': 'BetBoom_Team',
    'natus vincere': 'Natus_Vincere',
    'navi': 'Natus_Vincere',
    'na vi': 'Natus_Vincere',
    'virtus.pro': 'Virtus.pro',
    'virtus pro': 'Virtus.pro',
    'vp': 'Virtus.pro',
    'og': 'OG',
    'heroic': 'HEROIC',
    'aurora': 'Aurora',
    'aurora gaming': 'Aurora',
    'nigma galaxy': 'Nigma_Galaxy',
    'nigma': 'Nigma_Galaxy',
    'ngx': 'Nigma_Galaxy',
    'cloud9': 'Cloud9',
    'c9': 'Cloud9',
    'beastcoast': 'Beastcoast',
    'bc': 'Beastcoast',
    'shopify rebellion': 'Shopify_Rebellion',
    'sr': 'Shopify_Rebellion',
    '1win': '1win_Team',
    '1win team': '1win_Team',
    'talon esports': 'Talon_Esports',
    'talon': 'Talon_Esports',
    'entity': 'Entity',
    'team secret': 'Team_Secret',
    'secret': 'Team_Secret'
  };

  if (map[clean]) return map[clean];
  return String(teamName).trim().replace(/\s+/g, '_');
}

export function sortMatchesNewestFirst(matches) {
  if (!Array.isArray(matches)) return [];
  return [...matches].sort((a, b) => {
    // 1. Timestamp em segundos ou ms
    const tsA = a.timestamp ? (a.timestamp > 1e11 ? a.timestamp : a.timestamp * 1000) : 0;
    const tsB = b.timestamp ? (b.timestamp > 1e11 ? b.timestamp : b.timestamp * 1000) : 0;
    if (tsA && tsB && tsA !== tsB) return tsB - tsA;

    // 2. OpenDota start_time em segundos
    if (a.start_time && b.start_time && a.start_time !== b.start_time) {
      return b.start_time - a.start_time;
    }

    // 3. Formato DD/MM/YYYY
    if (a.dateStr && b.dateStr && a.dateStr.includes('/') && b.dateStr.includes('/')) {
      const pA = a.dateStr.split('/').map(Number);
      const pB = b.dateStr.split('/').map(Number);
      if (pA.length === 3 && pB.length === 3) {
        const timeA = new Date(pA[2], pA[1] - 1, pA[0]).getTime();
        const timeB = new Date(pB[2], pB[1] - 1, pB[0]).getTime();
        if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) return timeB - timeA;
      }
    }

    // 4. Formato YYYY-MM-DD
    if (a.date && b.date) {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) return timeB - timeA;
    }

    return 0;
  });
}

export function parseLiquipediaPlayedMatchesHtml(html) {
  if (!html) return [];
  const rows = html.match(/<tr[^>]*table2(&#95;|_)(\1)row--body[^>]*>[\s\S]*?<\/tr>/gi) || [];

  const parsed = rows.map(row => {
    const tds = row.match(/<td[^>]*>[\s\S]*?<\/td>/gi) || [];
    if (tds.length < 7) return null;

    const tsMatch = row.match(/data-timestamp="(\d+)"/i);
    const timestamp = tsMatch ? parseInt(tsMatch[1], 10) : 0;

    let dateStr = '';
    if (timestamp) {
      const d = new Date(timestamp * 1000);
      const day = String(d.getUTCDate()).padStart(2, '0');
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const year = d.getUTCFullYear();
      dateStr = `${day}/${month}/${year}`;
    } else {
      const rawDate = tds[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
        const [y, m, d] = rawDate.split('-');
        dateStr = `${d}/${m}/${y}`;
      } else {
        dateStr = rawDate;
      }
    }

    const tier = tds[1] ? tds[1].replace(/<[^>]+>/g, '').trim() : '';

    const tourney = tds[4]
      ? tds[4].replace(/<[^>]+>/g, '').replace(/&#160;/g, ' ').replace(/\s+/g, ' ').trim()
      : 'Torneio Oficial';

    const isWin = /result-win/i.test(row);
    const isLoss = /result-loss/i.test(row);

    const rawScore = tds[6] || '';
    const score = rawScore
      .replace(/<[^>]+>/g, '')
      .replace(/&#160;/g, ' ')
      .replace(/&#58;/g, ':')
      .replace(/\s+/g, ' ')
      .trim();

    const oppTd = tds[7] || '';
    const oppNameMatch = oppTd.match(/<span class="name"[^>]*>([\s\S]*?)<\/span>/i);
    let opponent = '';
    if (oppNameMatch) {
      opponent = oppNameMatch[1].replace(/<[^>]+>/g, '').trim();
    } else {
      const sortMatch = oppTd.match(/data-sort-value="([^"]+)"/i);
      if (sortMatch) {
        opponent = sortMatch[1].trim();
      } else {
        opponent = oppTd.replace(/<[^>]+>/g, '').trim();
      }
    }
    opponent = opponent.replace(/&[a-z0-9#]+;/gi, '').trim();

    return {
      timestamp,
      dateStr,
      tier,
      league_name: tourney || 'Torneio Liquipedia',
      score,
      opposing_team_name: opponent || 'Adversário',
      radiant: true,
      radiant_win: isWin ? true : (isLoss ? false : true)
    };
  }).filter(Boolean);

  const sorted = sortMatchesNewestFirst(parsed);
  return sorted.slice(0, 5);
}

export function parseLiquipediaResultsHtml(html) {
  const rows = html.match(/<tr[^>]*table2(&#95;|_)(\1)row--body[^>]*>[\s\S]*?<\/tr>/gi) || [];

  const parsed = rows.map(row => {
    const tds = row.match(/<td[^>]*>[\s\S]*?<\/td>/gi) || [];
    if (tds.length < 5) return null;

    const rawDate = tds[0].replace(/<[^>]+>/g, '').trim();
    let dateStr = rawDate;
    if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
      const [y, m, d] = rawDate.split('-');
      dateStr = `${d}/${m}/${y}`;
    }

    const rawPlacement = tds[1].replace(/<[^>]+>/g, '').replace(/&#160;/g, ' ').trim();
    const placement = rawPlacement.replace(/&[a-z0-9#]+;/gi, '').trim();
    const tier = tds[2] ? tds[2].replace(/<[^>]+>/g, '').trim() : '';

    let tourney = tds[4] ? tds[4].replace(/<[^>]+>/g, '').trim() : '';
    if (!tourney && tds[3]) tourney = tds[3].replace(/<[^>]+>/g, '').trim();

    const score = tds[5]
      ? tds[5]
          .replace(/<[^>]+>/g, '')
          .replace(/&#160;/g, ' ')
          .replace(/&#58;/g, ':')
          .replace(/\s+/g, ' ')
          .trim()
      : '';

    const opp = tds[6] ? tds[6].replace(/<[^>]+>/g, '').replace(/&[a-z0-9#]+;/gi, '').trim() : '';

    let won = false;
    if (placement.startsWith('1st') || placement.toLowerCase().includes('w')) {
      won = true;
    } else if (score.includes(':')) {
      const parts = score.split(':').map(p => parseInt(p.trim(), 10));
      if (!isNaN(parts[0]) && !isNaN(parts[1])) {
        won = parts[0] > parts[1];
      }
    }

    return {
      date: rawDate,
      dateStr,
      placement,
      tier,
      league_name: tourney || 'Torneio Liquipedia',
      score,
      opposing_team_name: opp || 'Adversário',
      radiant: true,
      radiant_win: won
    };
  }).filter(Boolean);

  const sorted = sortMatchesNewestFirst(parsed);
  return sorted.slice(0, 5);
}

export async function fetchLiquipediaTeamResults(teamName) {
  if (!teamName) return [];
  const wikiPage = toLiquipediaTeamPage(teamName);
  const cacheKey = `liquipedia_team_matches_v6_${wikiPage}`;
  const cached = getCached(cacheKey, 20 * 60 * 1000);
  if (cached && cached.length > 0) return cached.slice(0, 5);

  // 1. Rota serverless Vercel
  try {
    const res = await fetchWithTimeout(`/api/team-results?team=${encodeURIComponent(wikiPage)}`, {}, 4000);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.results) && data.results.length > 0) {
        const sorted = sortMatchesNewestFirst(data.results).slice(0, 5);
        setCache(cacheKey, sorted);
        return sorted;
      }
    }
  } catch (e) {}

  // 2. Fallback direto da Liquipedia via CORS (origin=*)
  // 2a. Tentar Played_Matches primeiro
  try {
    const playedRes = await fetchWithTimeout(
      `https://liquipedia.net/dota2/api.php?action=parse&page=${encodeURIComponent(wikiPage)}/Played_Matches&format=json&origin=*`,
      { headers: { 'Accept': 'application/json' } },
      4500
    );
    if (playedRes.ok) {
      const data = await playedRes.json();
      if (!data.error && data.parse?.text?.['*']) {
        const html = data.parse.text['*'];
        const matches = parseLiquipediaPlayedMatchesHtml(html);
        if (matches.length > 0) {
          const sorted = sortMatchesNewestFirst(matches).slice(0, 5);
          setCache(cacheKey, sorted);
          return sorted;
        }
      }
    }
  } catch (e) {}

  // 2b. Tentar Results se Played_Matches falhar
  try {
    const directRes = await fetchWithTimeout(
      `https://liquipedia.net/dota2/api.php?action=parse&page=${encodeURIComponent(wikiPage)}/Results&format=json&origin=*`,
      { headers: { 'Accept': 'application/json' } },
      4500
    );
    if (directRes.ok) {
      const data = await directRes.json();
      if (!data.error && data.parse?.text?.['*']) {
        const html = data.parse.text['*'];
        const results = parseLiquipediaResultsHtml(html);
        if (results.length > 0) {
          const sorted = sortMatchesNewestFirst(results).slice(0, 5);
          setCache(cacheKey, sorted);
          return sorted;
        }
      }
    }
  } catch (e) {}

  return [];
}

// 10. Buscar Perfil do Time (por ID ou Nome)
export async function fetchTeamProfile(teamId, teamName = "") {
  const cacheKey = `team_profile_v16_${teamId || 'name'}_${teamName || 'id'}`;
  const cached = getCached(cacheKey, 15 * 60 * 1000);
  if (cached && cached.recentMatches?.length > 0 && cached.recentMatches[0]?.dateStr) {
    return {
      ...cached,
      recentMatches: sortMatchesNewestFirst(cached.recentMatches).slice(0, 5)
    };
  }

  let resolvedId = teamId;
  let baseTeam = null;

  const effectiveName = teamName || (teamId ? String(teamId) : "");
  const builtin = findBuiltinTeam(effectiveName);

  // 1. Prioridade Máxima: Buscar histórico oficial atualizado da Liquipedia (5 últimas partidas, da mais recente à mais antiga)
  const liquipediaMatches = await fetchLiquipediaTeamResults(effectiveName || builtin?.name);
  if (liquipediaMatches && liquipediaMatches.length > 0) {
    const top5 = sortMatchesNewestFirst(liquipediaMatches).slice(0, 5);
    const wins = top5.filter(m => m.radiant_win).length;
    const winRate = Math.round((wins / top5.length) * 100);

    const result = {
      name: builtin?.name || teamName || "Equipe Profissional",
      tag: builtin?.tag || (effectiveName.length <= 4 ? effectiveName.toUpperCase() : ""),
      logo_url: builtin?.logo_url || null,
      rating: builtin?.rating || 1500,
      wins: builtin?.wins || wins * 8,
      losses: builtin?.losses || (top5.length - wins) * 8,
      recentMatches: top5,
      recentWinRate: winRate,
      topHeroes: builtin?.topHeroes || [],
      isUnranked: false,
      source: 'liquipedia'
    };

    setCache(cacheKey, result);
    return result;
  }

  // 2. Se não temos teamId, buscar na lista geral de times da OpenDota (com timeout rápido de 2500ms)
  if (!resolvedId && teamName) {
    try {
      const teamsRes = await fetchWithTimeout(`${OPENDOTA_BASE}/teams`, {}, 2500);
      if (teamsRes.ok) {
        const allTeams = await teamsRes.json();
        const found = resolveTeamFromList(teamName, allTeams);
        if (found) {
          resolvedId = found.team_id;
          baseTeam = found;
        }
      }
    } catch (e) {}
  }

  // 3. Se temos resolvedId, tentar carregar da OpenDota
  if (resolvedId) {
    try {
      const [teamRes, matchesRes, heroesRes] = await Promise.all([
        fetchWithTimeout(`${OPENDOTA_BASE}/teams/${resolvedId}`, {}, 2500).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetchWithTimeout(`${OPENDOTA_BASE}/teams/${resolvedId}/matches`, {}, 2500).then((r) => (r.ok ? r.json() : [])).catch(() => []),
        fetchWithTimeout(`${OPENDOTA_BASE}/teams/${resolvedId}/heroes`, {}, 2500).then((r) => (r.ok ? r.json() : [])).catch(() => [])
      ]);

      const matches = Array.isArray(matchesRes) ? matchesRes : [];
      if (matches.length > 0) {
        const teamData = teamRes || baseTeam || {};
        const topHeroes = Array.isArray(heroesRes) ? heroesRes : [];
        const top5 = sortMatchesNewestFirst(matches).slice(0, 5).map((m) => ({
          ...m,
          dateStr: m.dateStr || (m.start_time ? new Date(m.start_time * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : null)
        }));
        const wins = top5.filter((m) => (m.radiant && m.radiant_win) || (!m.radiant && !m.radiant_win)).length;
        const winRate = Math.round((wins / top5.length) * 100);

        const result = {
          name: teamData.name || teamName,
          tag: teamData.tag || builtin?.tag || "",
          logo_url: teamData.logo_url || builtin?.logo_url || null,
          rating: teamData.rating || builtin?.rating || 1400,
          wins: teamData.wins || wins,
          losses: teamData.losses || (top5.length - wins),
          recentMatches: top5,
          recentWinRate: winRate,
          topHeroes: topHeroes.length > 0 ? topHeroes.slice(0, 5) : (builtin?.topHeroes || []),
          isUnranked: false,
          source: 'opendota'
        };

        setCache(cacheKey, result);
        return result;
      }
    } catch (e) {}
  }

  // 4. Se a Liquipedia e OpenDota estiverem offline:
  if (builtin) {
    const builtinResult = {
      ...builtin,
      recentMatches: sortMatchesNewestFirst(builtin.recentMatches).slice(0, 5),
      source: 'official'
    };
    setCache(cacheKey, builtinResult);
    return builtinResult;
  }

  // 5. Para qualquer outra equipe (qualificatórias, divisão de acesso, etc.)
  const dynamicProfile = generateDynamicTeamProfile(teamName);
  dynamicProfile.recentMatches = sortMatchesNewestFirst(dynamicProfile.recentMatches).slice(0, 5);
  setCache(cacheKey, dynamicProfile);
  return dynamicProfile;
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