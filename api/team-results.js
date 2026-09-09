import { fetchLiquipediaApi } from './_lib/liquipediaClient.js';

export function sortMatchesNewestFirst(matches) {
  if (!Array.isArray(matches)) return [];
  return [...matches].sort((a, b) => {
    const tsA = a.timestamp ? (a.timestamp > 1e11 ? a.timestamp : a.timestamp * 1000) : 0;
    const tsB = b.timestamp ? (b.timestamp > 1e11 ? b.timestamp : b.timestamp * 1000) : 0;
    if (tsA && tsB) return tsB - tsA;

    if (a.dateStr && b.dateStr && a.dateStr.includes('/') && b.dateStr.includes('/')) {
      const [d1, m1, y1] = a.dateStr.split('/').map(Number);
      const [d2, m2, y2] = b.dateStr.split('/').map(Number);
      const timeA = new Date(y1, m1 - 1, d1).getTime();
      const timeB = new Date(y2, m2 - 1, d2).getTime();
      if (!isNaN(timeA) && !isNaN(timeB)) return timeB - timeA;
    }

    if (a.date && b.date) {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      if (!isNaN(timeA) && !isNaN(timeB)) return timeB - timeA;
    }

    return 0;
  });
}

export function parseLiquipediaPlayedMatches(html) {
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

export function parseLiquipediaResults(html) {
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

export default async function handler(req, res) {
  const teamQuery = req.query.team || req.query.name || '';
  if (!teamQuery) {
    return res.status(400).json({ error: 'Missing team parameter' });
  }

  const wikiPage = toLiquipediaTeamPage(teamQuery);
  const TTL_2_HOURS = 2 * 60 * 60 * 1000;

  try {
    // 1. Tentar primeiro na página Played_Matches (tem séries detalhadas)
    try {
      const playedResult = await fetchLiquipediaApi(`${wikiPage}/Played_Matches`, { ttlMs: TTL_2_HOURS });
      if (playedResult?.html) {
        const matches = parseLiquipediaPlayedMatches(playedResult.html);
        if (matches.length > 0) {
          res.setHeader('Cache-Control', 's-maxage=7200, stale-while-revalidate=86400');
          return res.status(200).json({
            team: wikiPage,
            source: 'liquipedia',
            page: 'Played_Matches',
            results: matches.slice(0, 5)
          });
        }
      }
    } catch (e) {}

    // 2. Fallback para a página Results
    const resultsResult = await fetchLiquipediaApi(`${wikiPage}/Results`, { ttlMs: TTL_2_HOURS });
    if (resultsResult?.html) {
      const results = parseLiquipediaResults(resultsResult.html);
      if (results.length > 0) {
        res.setHeader('Cache-Control', 's-maxage=7200, stale-while-revalidate=86400');
        return res.status(200).json({
          team: wikiPage,
          source: 'liquipedia',
          page: 'Results',
          results: results.slice(0, 5)
        });
      }
    }

    return res.status(200).json({ team: wikiPage, results: [], source: 'none' });
  } catch (error) {
    return res.status(200).json({ team: wikiPage, results: [], error: error.message });
  }
}
