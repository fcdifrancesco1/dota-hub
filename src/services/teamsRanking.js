import { getCached, setCache, fetchWithTimeout } from './api';

const TEAMS_CACHE_KEY = 'dotahub_liquipedia_teams_ranking_v3';
const TEAMS_CACHE_TTL = 30 * 60 * 1000; // 30 minutos

export const TEAM_ID_MAP = {
  'team yandex': 9823272,
  'yandex': 9823272,
  'parivision': 9824702,
  'pari vision': 9824702,
  'pv': 9824702,
  'team spirit': 7119388,
  'spirit': 7119388,
  'tspirit': 7119388,
  'aurora gaming': 9255706,
  'aurora': 9255706,
  'betboom team': 8255888,
  'betboom': 8255888,
  'bb': 8255888,
  'team liquid': 2163,
  'liquid': 2163,
  'natus vincere': 36,
  'navi': 36,
  'xtreme gaming': 8574561,
  'xtreme': 8574561,
  'xg': 8574561,
  '1w team': 9338270,
  '1w': 9338270,
  'gamerlegion': 9964962,
  'gamer legion': 9964962,
  'gl': 9964962,
  'og': 2586976,
  'lgd gaming': 15,
  'lgd': 15,
  'mouz': 9459989,
  'playtime': 9850123,
  'ptime': 9850123,
  'yellow submarine': 7732977,
  'yes': 7732977,
  'yakult brothers': 9971032,
  "yakult's brothers": 9971032,
  'ykbros': 9971032,
  'team nemesis': 9691969,
  'nemesis': 9691969,
  'nem': 9691969,
  'zero tenacity': 9876543,
  'z10': 9876543,
  'pipsqueak+4': 9876544,
  'arcade': 9876545,
  'team falcons': 9247354,
  'falcons': 9247354,
  'flcn': 9247354,
  'nigma galaxy': 7554697,
  'nigma': 7554697
};

export const STATIC_LIQUIPEDIA_TEAMS = [
  { rank: 1, change: '-', name: 'Team Yandex', tag: 'Yandex', points: 1856, region: 'CIS', slug: 'Team_Yandex', teamId: 9823272 },
  { rank: 2, change: '-', name: 'PARIVISION', tag: 'PV', points: 1832, region: 'CIS', slug: 'PARIVISION', teamId: 9824702 },
  { rank: 3, change: '-', name: 'Team Spirit', tag: 'TSpirit', points: 1762, region: 'CIS', slug: 'Team_Spirit', teamId: 7119388 },
  { rank: 4, change: '+1', name: 'Aurora Gaming', tag: 'Aurora', points: 1729, region: 'CIS', slug: 'Aurora_Gaming', teamId: 9255706 },
  { rank: 5, change: '+1', name: 'BetBoom Team', tag: 'BB', points: 1725, region: 'CIS', slug: 'BetBoom_Team', teamId: 8255888 },
  { rank: 6, change: '+1', name: 'Team Liquid', tag: 'Liquid', points: 1701, region: 'Europe', slug: 'Team_Liquid', teamId: 2163 },
  { rank: 7, change: '+1', name: 'Natus Vincere', tag: 'NAVI', points: 1681, region: 'Europe', slug: 'Natus_Vincere', teamId: 36 },
  { rank: 8, change: '+2', name: 'Xtreme Gaming', tag: 'XG', points: 1635, region: 'China', slug: 'Xtreme_Gaming', teamId: 8574561 },
  { rank: 9, change: '+3', name: '1w Team', tag: '1w', points: 1585, region: 'CIS', slug: '1w_Team', teamId: 9338270 },
  { rank: 10, change: '+1', name: 'GamerLegion', tag: 'GL', points: 1585, region: 'North America', slug: 'GamerLegion', teamId: 9964962 },
  { rank: 11, change: '+2', name: 'OG', tag: 'OG', points: 1571, region: 'Southeast Asia', slug: 'OG', teamId: 2586976 },
  { rank: 12, change: '+2', name: 'LGD Gaming', tag: 'LGD', points: 1568, region: 'South America', slug: 'LGD_Gaming', teamId: 15 },
  { rank: 13, change: '+2', name: 'MOUZ', tag: 'MOUZ', points: 1515, region: 'Europe', slug: 'MOUZ', teamId: 9459989 },
  { rank: 14, change: '+2', name: 'PlayTime', tag: 'PTime', points: 1503, region: 'South America', slug: 'PlayTime', teamId: 9850123 },
  { rank: 15, change: '+4', name: 'Yellow Submarine', tag: 'YeS', points: 1495, region: 'CIS', slug: 'Yellow_Submarine', teamId: 7732977 },
  { rank: 16, change: '+1', name: 'Yakult Brothers', tag: 'YkBros', points: 1486, region: 'China', slug: "Yakult's_Brothers", teamId: 9971032 },
  { rank: 17, change: '+1', name: 'Team Nemesis', tag: 'Nem', points: 1451, region: 'Southeast Asia', slug: 'Team_Nemesis', teamId: 9691969 },
  { rank: 18, change: '+2', name: 'Zero Tenacity', tag: 'Z10', points: 1441, region: 'Europe', slug: 'Zero_Tenacity', teamId: 9876543 },
  { rank: 19, change: '+3', name: 'Pipsqueak+4', tag: 'Pips+4', points: 1421, region: 'Europe', slug: 'Pipsqueak%2B4', teamId: 9876544 },
  { rank: 20, change: '+1', name: 'Arcade', tag: 'ARCADE', points: 1410, region: 'CIS', slug: 'Arcade', teamId: 9876545 }
];

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

    const enriched = rawList.map((t, idx) => {
      const clean = String(t.name || '').toLowerCase().trim();
      const teamId = t.teamId || TEAM_ID_MAP[clean] || TEAM_ID_MAP[String(t.tag || '').toLowerCase()] || (1000000 + idx);
      return {
        ...t,
        rank: t.rank || idx + 1,
        teamId,
        rating: t.points || t.rating || 1500
      };
    });

    setCache(TEAMS_CACHE_KEY, enriched);
    return enriched;
  } catch (err) {
    console.warn('[Teams Ranking] Usando ranking oficial de contingência:', err);
    return STATIC_LIQUIPEDIA_TEAMS;
  }
}
