export function parseLiquipediaResults(html) {
  const rows = html.match(/<tr[^>]*table2(&#95;|_)(\1)row--body[^>]*>[\s\S]*?<\/tr>/gi) || [];

  return rows.slice(0, 15).map(row => {
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

  try {
    const response = await fetch(
      `https://liquipedia.net/dota2/api.php?action=parse&page=${encodeURIComponent(wikiPage)}/Results&format=json`,
      {
        headers: {
          'User-Agent': 'DotaHubCommunity/2.0 (contact@dota-hub.vercel.app)',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(6000)
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (!data.error && data.parse?.text?.['*']) {
        const html = data.parse.text['*'];
        const results = parseLiquipediaResults(html);

        res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');
        return res.status(200).json({
          team: wikiPage,
          source: 'liquipedia',
          results
        });
      }
    }
    return res.status(200).json({ team: wikiPage, results: [], source: 'none' });
  } catch (error) {
    return res.status(200).json({ team: wikiPage, results: [], error: error.message });
  }
}
