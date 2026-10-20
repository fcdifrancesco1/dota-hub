export default async function handler(req, res) {
  const heroId = req.query.hero_id;
  if (!heroId) {
    return res.status(400).json({ error: 'hero_id is required' });
  }

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
      return res.status(response.status).json({ error: `Valve HTTP ${response.status}` });
    }

    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=86400');
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
