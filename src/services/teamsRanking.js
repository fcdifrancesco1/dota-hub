import { getCached, setCache, fetchWithTimeout, resolveTeamFromList, OPENDOTA_BASE } from './api';
import { resolveTeamId } from './teamPage';

const TEAMS_CACHE_KEY = 'dotahub_liquipedia_teams_ranking_v4';
const TEAMS_CACHE_TTL = 30 * 60 * 1000; // 30 minutos

export const STATIC_LIQUIPEDIA_TEAMS = [
  { rank: 1, change: '-', name: 'Team Yandex', tag: 'Yandex', points: 1856, region: 'CIS', slug: 'Team_Yandex' },
  { rank: 2, change: '-', name: 'PARIVISION', tag: 'PV', points: 1832, region: 'CIS', slug: 'PARIVISION' },
  { rank: 3, change: '-', name: 'Team Spirit', tag: 'TSpirit', points: 1762, region: 'CIS', slug: 'Team_Spirit' },
  { rank: 4, change: '+1', name: 'Aurora Gaming', tag: 'Aurora', points: 1729, region: 'CIS', slug: 'Aurora_Gaming' },
  { rank: 5, change: '+1', name: 'BetBoom Team', tag: 'BB', points: 1725, region: 'CIS', slug: 'BetBoom_Team' },
  { rank: 6, change: '+1', name: 'Team Liquid', tag: 'Liquid', points: 1701, region: 'Europe', slug: 'Team_Liquid' },
  { rank: 7, change: '+1', name: 'Natus Vincere', tag: 'NAVI', points: 1681, region: 'Europe', slug: 'Natus_Vincere' },
  { rank: 8, change: '+2', name: 'Xtreme Gaming', tag: 'XG', points: 1635, region: 'China', slug: 'Xtreme_Gaming' },
  { rank: 9, change: '+3', name: '1w Team', tag: '1w', points: 1585, region: 'CIS', slug: '1w_Team' },
  { rank: 10, change: '+1', name: 'GamerLegion', tag: 'GL', points: 1585, region: 'North America', slug: 'GamerLegion' },
  { rank: 11, change: '+2', name: 'OG', tag: 'OG', points: 1571, region: 'Southeast Asia', slug: 'OG' },
  { rank: 12, change: '+2', name: 'LGD Gaming', tag: 'LGD', points: 1568, region: 'South America', slug: 'LGD_Gaming' },
  { rank: 13, change: '+2', name: 'MOUZ', tag: 'MOUZ', points: 1515, region: 'Europe', slug: 'MOUZ' },
  { rank: 14, change: '+2', name: 'PlayTime', tag: 'PTime', points: 1503, region: 'South America', slug: 'PlayTime' },
  { rank: 15, change: '+4', name: 'Yellow Submarine', tag: 'YeS', points: 1495, region: 'CIS', slug: 'Yellow_Submarine' },
  { rank: 16, change: '+1', name: 'Yakult Brothers', tag: 'YkBros', points: 1486, region: 'China', slug: "Yakult's_Brothers" },
  { rank: 17, change: '+1', name: 'Team Nemesis', tag: 'Nem', points: 1451, region: 'Southeast Asia', slug: 'Team_Nemesis' },
  { rank: 18, change: '+2', name: 'Zero Tenacity', tag: 'Z10', points: 1441, region: 'Europe', slug: 'Zero_Tenacity' },
  { rank: 19, change: '+3', name: 'Pipsqueak+4', tag: 'Pips+4', points: 1421, region: 'Europe', slug: 'Pipsqueak%2B4' },
  { rank: 20, change: '+1', name: 'Arcade', tag: 'ARCADE', points: 1410, region: 'CIS', slug: 'Arcade' }
];

/**
 * ID de cada time na OpenDota, pelo nome (lista /teams baixada uma vez; os que
 * não estiverem nela, pelo banco de consultas). Sem ID, teamId fica null e a
 * página do time abre pelo nome.
 */
async function withOpenDotaIds(list) {
  let allTeams = [];
  try {
    const res = await fetchWithTimeout(`${OPENDOTA_BASE}/teams`, {}, 10000);
    if (res.ok) allTeams = await res.json();
  } catch { /* segue para a busca individual */ }
  return Promise.all(list.map(async (t) => {
    const found = resolveTeamFromList(t.name, allTeams);
    const teamId = found?.team_id || await resolveTeamId(t.name).catch(() => null);
    return { ...t, teamId: teamId || null };
  }));
}

export async function fetchTeamsRanking() {
  const cached = getCached(TEAMS_CACHE_KEY, TEAMS_CACHE_TTL);
  if (cached && Array.isArray(cached) && cached.length > 0) {
    return cached;
  }

  try {
    const res = await fetchWithTimeout('/api/teams-ranking', {}, 8000);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const rawList = Array.isArray(data?.teams) && data.teams.length > 0
      ? data.teams
      : STATIC_LIQUIPEDIA_TEAMS;

    const enriched = await withOpenDotaIds(rawList.map((t, idx) => ({
      ...t,
      rank: t.rank || idx + 1,
      rating: t.points || t.rating || 1500
    })));

    setCache(TEAMS_CACHE_KEY, enriched);
    return enriched;
  } catch (err) {
    console.warn('[Teams Ranking] Usando ranking oficial de contingência:', err);
    return withOpenDotaIds(STATIC_LIQUIPEDIA_TEAMS);
  }
}
