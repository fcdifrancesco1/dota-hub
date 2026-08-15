export default async function handler(req, res) {
  try {
    const response = await fetch("https://api.opendota.com/api/liveLeagueGames", {
      headers: { "Accept": "application/json" }
    });
    
    if (!response.ok) {
      const fallback = await fetch("https://api.opendota.com/api/live");
      const dataFallback = await fallback.json();
      res.setHeader("Cache-Control", "s-maxage=10, stale-while-revalidate=30");
      return res.status(200).json(dataFallback);
    }

    const data = await response.json();
    res.setHeader("Cache-Control", "s-maxage=10, stale-while-revalidate=30");
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message, result: { games: [] } });
  }
}