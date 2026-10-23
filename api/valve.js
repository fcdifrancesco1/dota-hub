export default async function handler(req, res) {
  const type = req.query.type || (req.query.hero_id ? 'herodata' : 'leaderboard');

  if (type === 'herodata' || req.query.hero_id) {
    const heroId = req.query.hero_id || '8';
    const language = req.query.language || 'brazilian';
    const url = `https://www.dota2.com/datafeed/herodata?language=${encodeURIComponent(language)}&hero_id=${encodeURIComponent(heroId)}`;

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
  const url = `https://www.dota2.com/webapi/ILeaderboard/GetDivisionLeaderboard/v0001?division=${division}&leaderboard=0`;

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
