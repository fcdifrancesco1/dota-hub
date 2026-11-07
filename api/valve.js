// Feeds públicos da Valve (dota2.com/datafeed), em português, repassados por aqui porque
// o site da Valve não libera CORS: ficha do herói, lista de heróis, lista e ficha de itens
const DATAFEEDS = {
  herodata: (q) => `herodata?hero_id=${encodeURIComponent(q.hero_id || '8')}`,
  herolist: () => 'herolist',
  itemlist: () => 'itemlist',
  itemdata: (q) => `itemdata?item_id=${encodeURIComponent(q.item_id || '1')}`
};

export default async function handler(req, res) {
  const type = req.query.type || (req.query.hero_id ? 'herodata' : 'leaderboard');

  if (DATAFEEDS[type] || req.query.hero_id) {
    const feed = (DATAFEEDS[type] || DATAFEEDS.herodata)(req.query);
    const language = req.query.language || 'brazilian';
    const url = `https://www.dota2.com/datafeed/${feed}${feed.includes('?') ? '&' : '?'}language=${encodeURIComponent(language)}`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        res.setHeader('Cache-Control', 'no-store');
        return res.status(502).json({ error: `Valve HTTP ${response.status}` });
      }

      const data = await response.json();
      res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=86400');
      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Leaderboard oficial da Valve
  const division = req.query.division || 'europe';
  const url = `https://www.dota2.com/webapi/ILeaderboard/GetDivisionLeaderboard/v0001?division=${encodeURIComponent(division)}&leaderboard=0`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json',
      },
    });

    // A Valve responde com uma página HTML (ex.: 403 do firewall) quando bloqueia o pedido
    const isJson = (response.headers.get('content-type') || '').includes('json');
    if (!response.ok || !isJson) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(502).json({ error: `Valve HTTP ${response.status}` });
    }

    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
