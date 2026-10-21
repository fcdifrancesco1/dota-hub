import { OPENDOTA_BASE, getCached, setCache, fetchWithTimeout } from './api';

const PLAYER_TTL = 30 * 60 * 1000; // 30 min
const PRO_PLAYERS_CACHE_KEY = 'dotahub_pro_players_list';
const PRO_PLAYERS_TTL = 24 * 3600 * 1000; // 24h

async function getJson(url, timeoutMs = 8000) {
  const res = await fetchWithTimeout(url, {}, timeoutMs);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** Busca lista de Pro Players para cruzar informações de time, role e país */
export async function getProPlayerInfo(accountId) {
  try {
    let list = getCached(PRO_PLAYERS_CACHE_KEY, PRO_PLAYERS_TTL);
    if (!list) {
      list = await getJson(`${OPENDOTA_BASE}/proPlayers`).catch(() => []);
      if (Array.isArray(list) && list.length > 0) {
        setCache(PRO_PLAYERS_CACHE_KEY, list);
      }
    }
    if (Array.isArray(list)) {
      return list.find((p) => String(p.account_id) === String(accountId)) || null;
    }
  } catch (e) {
    console.warn('Erro ao verificar pro player:', e);
  }
  return null;
}

/** Busca títulos oficiais e histórico de campeonatos na Liquipedia */
// teamName: o elenco do time na Liquipedia mostra qual é a página do jogador lá
export async function fetchPlayerAchievements(playerName, accountId, teamName) {
  if (!playerName) return { titles: [], allAchievements: [], summary: {} };
  const key = `player_achievements_v6_${accountId || playerName}`;
  const cached = getCached(key, 60 * 60 * 1000);
  if (cached) return cached;

  try {
    const res = await fetchWithTimeout(
      `/api/player-achievements?player=${encodeURIComponent(playerName)}&account_id=${accountId || ''}&team=${encodeURIComponent(teamName || '')}`,
      {},
      20000
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    setCache(key, data);
    return data;
  } catch (err) {
    console.warn(`[Player Achievements] Falha ao carregar conquistas para ${playerName}:`, err);
    return { titles: [], allAchievements: [], summary: {} };
  }
}

export async function fetchPlayerComprehensiveData(accountId) {
  if (!accountId) return null;
  const key = `player_full_profile_v6_${accountId}`;
  const cached = getCached(key, PLAYER_TTL);
  if (cached) return cached;

  const [playerRaw, wlRaw, totalsRaw, heroesRaw, matchesRaw, proInfo] = await Promise.all([
    getJson(`${OPENDOTA_BASE}/players/${accountId}`).catch(() => null),
    getJson(`${OPENDOTA_BASE}/players/${accountId}/wl`).catch(() => ({ win: 0, lose: 0 })),
    getJson(`${OPENDOTA_BASE}/players/${accountId}/totals`).catch(() => []),
    getJson(`${OPENDOTA_BASE}/players/${accountId}/heroes`).catch(() => []),
    getJson(`${OPENDOTA_BASE}/players/${accountId}/matches?limit=25`).catch(() => []),
    getProPlayerInfo(accountId)
  ]);

  if (!playerRaw || (!playerRaw.profile && !proInfo)) {
    return null;
  }

  const profile = playerRaw.profile || {};
  const wins = wlRaw?.win || 0;
  const losses = wlRaw?.lose || 0;
  const totalMatches = wins + losses;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

  // Extrai médias de Totais
  const totalsMap = {};
  if (Array.isArray(totalsRaw)) {
    totalsRaw.forEach((t) => {
      totalsMap[t.field] = {
        total: t.sum,
        games: t.n,
        avg: t.n > 0 ? (t.sum / t.n) : 0
      };
    });
  }

  const avgKills = totalsMap.kills?.avg || 0;
  const avgDeaths = totalsMap.deaths?.avg || 0;
  const avgAssists = totalsMap.assists?.avg || 0;
  const avgGpm = Math.round(totalsMap.gold_per_min?.avg || 0);
  const avgXpm = Math.round(totalsMap.xp_per_min?.avg || 0);
  const avgLastHits = Math.round(totalsMap.last_hits?.avg || 0);
  const avgDenies = Math.round(totalsMap.denies?.avg || 0);
  const kda = avgDeaths > 0 ? (avgKills + avgAssists) / avgDeaths : (avgKills + avgAssists);

  // Top Heróis
  const sortedHeroes = Array.isArray(heroesRaw)
    ? [...heroesRaw]
        .filter((h) => h.games > 0)
        .sort((a, b) => b.games - a.games)
        .slice(0, 15)
        .map((h) => ({
          heroId: Number(h.hero_id),
          games: h.games,
          wins: h.win,
          winRate: h.games > 0 ? Math.round((h.win / h.games) * 100) : 0,
          lastPlayed: h.last_played
        }))
    : [];

  // Partidas recentes formatadas
  const formattedMatches = Array.isArray(matchesRaw)
    ? matchesRaw.map((m) => {
        const isRadiant = m.player_slot < 128;
        const won = (isRadiant && m.radiant_win) || (!isRadiant && !m.radiant_win);
        return {
          matchId: m.match_id,
          heroId: m.hero_id,
          won,
          kills: m.kills ?? 0,
          deaths: m.deaths ?? 0,
          assists: m.assists ?? 0,
          duration: m.duration,
          gameMode: m.game_mode,
          startTime: m.start_time
        };
      })
    : [];

  // Buscar títulos e conquistas na Liquipedia
  const playerName = proInfo?.name || profile.personaname || '';
  const achievementsData = await fetchPlayerAchievements(playerName, accountId, proInfo?.team_name);

  const result = {
    accountId,
    name: proInfo?.name || profile.personaname || `Jogador ${accountId}`,
    personaname: profile.personaname,
    realName: proInfo?.name || null,
    avatar: profile.avatarfull || profile.avatarmedium || proInfo?.avatarfull || null,
    countryCode: proInfo?.country_code || profile.loccountrycode || null,
    profileUrl: profile.profileurl,
    rankTier: playerRaw.rank_tier || null,
    leaderboardRank: playerRaw.leaderboard_rank || null,
    team: proInfo?.team_name ? {
      teamId: proInfo.team_id,
      name: proInfo.team_name,
      tag: proInfo.team_tag
    } : null,
    // Posição pela ficha da Liquipedia; o fantasy_role da OpenDota só diz núcleo (1) ou suporte (2)
    position: achievementsData.position || null,
    role: achievementsData.role || null,
    fantasyRole: proInfo?.fantasy_role || null,
    stats: {
      wins,
      losses,
      totalMatches,
      winRate,
      avgKills,
      avgDeaths,
      avgAssists,
      kda,
      avgGpm,
      avgXpm,
      avgLastHits,
      avgDenies
    },
    topHeroes: sortedHeroes,
    recentMatches: formattedMatches,
    titles: achievementsData.titles || [],
    allAchievements: achievementsData.allAchievements || [],
    achievementsSummary: achievementsData.summary || {}
  };

  setCache(key, result);
  return result;
}
