export default async function handler(req, res) {
  try {
    const response = await fetch(
      "https://api.steampowered.com/IDOTA2Match_570/GetLiveLeagueGames/v1/?key=STEAM_API_KEY_OR_PUBLIC",
      { headers: { "Accept": "application/json" } }
    );
    
    if (response.ok) {
      const data = await response.json();
      res.setHeader("Cache-Control", "s-maxage=10, stale-while-revalidate=30");
      return res.status(200).json(data);
    }
    
    // Fallback para o endpoint espelho da OpenDota
    const fallbackRes = await fetch("https://api.opendota.com/api/liveLeagueGames");
    const fallbackData = await fallbackRes.json();
    return res.status(200).json(fallbackData);
  } catch (error) {
    return res.status(500).json({ error: error.message, result: { games: [] } });
  }
}