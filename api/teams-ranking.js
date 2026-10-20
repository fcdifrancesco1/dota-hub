import { fetchLiquipediaApi } from './_lib/liquipediaClient.js';

export function parseLiquipediaRankings(html) {
  if (!html) return [];

  const rowRegex = /<tr[^>]*class="[^"]*table2(?:&#95;|_)(?:&#95;|_)row--body[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi;
  let match;
  const teams = [];

  while ((match = rowRegex.exec(html)) !== null) {
    const row = match[1];
    if (row.includes('ranking-table__graph-row')) continue;

    const rankMatch = row.match(/data-ranking-table-cell="rank"[^>]*>(\d+)/i);
    if (!rankMatch) continue;
    const rank = Number(rankMatch[1]);

    // +/- change
    let change = '-';
    const changeMatch = row.match(/data-ranking-table-cell="change"[^>]*>([\s\S]*?)<\/td>/i);
    if (changeMatch) {
      const cHtml = changeMatch[1];
      if (cHtml.includes('movement-up')) {
        const num = (cHtml.match(/(\d+)/) || [])[1] || '1';
        change = `+${num}`;
      } else if (cHtml.includes('movement-down')) {
        const num = (cHtml.match(/(\d+)/) || [])[1] || '1';
        change = `-${num}`;
      }
    }

    // Name & Tag
    const nameMatch = row.match(/<span class="name hidden-xs"[^>]*><a[^>]*>([^<]+)<\/a><\/span>/i) ||
                      row.match(/<span class="name[^"]*"[^>]*><a[^>]*>([^<]+)<\/a><\/span>/i);
    const tagMatch = row.match(/<span class="name visible-xs"[^>]*><a[^>]*>([^<]+)<\/a><\/span>/i);
    const pageMatch = row.match(/<a href="\/dota2\/([^"]+)"/i);

    const name = nameMatch ? nameMatch[1].trim() : `Time #${rank}`;
    const tag = tagMatch ? tagMatch[1].trim() : '';
    const slug = pageMatch ? pageMatch[1].replace(/^\/dota2\//, '') : '';

    // Logo
    const logoMatch = row.match(/<span class="team-template-image-icon[^"]*"[\s\S]*?<img[^>]*src="([^"]+)"/i);
    let logo = logoMatch ? logoMatch[1] : null;
    if (logo && !logo.startsWith('http')) {
      logo = `https://liquipedia.net${logo}`;
    }

    // Rating / Points
    const pointsMatch = row.match(/data-ranking-table-cell="rating"[^>]*>([0-9.,]+)/i);
    const points = pointsMatch ? Math.round(Number(pointsMatch[1].replace(/,/g, ''))) : 0;

    // Region
    const regionMatch = row.match(/data-ranking-table-cell="region"[^>]*>([\s\S]*?)<\/td>/i);
    let region = '';
    if (regionMatch) {
      region = regionMatch[1].replace(/<[^>]+>/g, '').trim();
    }

    teams.push({
      rank,
      change,
      name,
      tag,
      slug,
      points,
      region,
      logo
    });
  }

  return teams;
}

// Fallback robusto oficial baseado na Liquipedia
const STATIC_FALLBACK_RANKINGS = [
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

export default async function handler(req, res) {
  try {
    const parsed = await fetchLiquipediaApi('Portal:Rankings', { ttlMs: 60 * 60 * 1000 });
    let teams = [];

    if (parsed?.html) {
      teams = parseLiquipediaRankings(parsed.html);
    }

    if (!teams || teams.length === 0) {
      teams = STATIC_FALLBACK_RANKINGS;
    }

    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
    return res.status(200).json({
      source: 'Liquipedia & SAP',
      lastUpdated: new Date().toISOString().split('T')[0],
      total: teams.length,
      teams
    });
  } catch (error) {
    console.error('[Teams Ranking API] Erro ao buscar rankings:', error.message);
    return res.status(200).json({
      source: 'Liquipedia & SAP (Fallback)',
      lastUpdated: new Date().toISOString().split('T')[0],
      total: STATIC_FALLBACK_RANKINGS.length,
      teams: STATIC_FALLBACK_RANKINGS
    });
  }
}
