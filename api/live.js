export default async function handler(req, res) {
  try {
    let liveGames = [];

    const odRes = await fetch("https://api.opendota.com/api/liveLeagueGames", {
      headers: { "Accept": "application/json" }
    });
    
    if (odRes.ok) {
      const odData = await odRes.json();
      const games = (odData && odData.result && odData.result.games) || (Array.isArray(odData) ? odData : []);
      // Filtra apenas jogos que tenham placar ou jogadores ativos no servidor GOTV
      liveGames = games.filter(g => g && (g.radiant_team || g.dire_team || (g.scoreboard && g.scoreboard.duration > 0)));
    }

    res.setHeader("Cache-Control", "s-maxage=10, stale-while-revalidate=20");
    return res.status(200).json({ result: { games: liveGames } });
  } catch (error) {
    return res.status(500).json({ error: error.message, result: { games: [] } });
  }
}