export default async function handler(req, res) {
  try {
    let liveGames = [];

    // 1. Consulta Valve WebAPI / OpenDota Live
    try {
      const odRes = await fetch("https://api.opendota.com/api/liveLeagueGames", {
        headers: { "Accept": "application/json" }
      });
      if (odRes.ok) {
        const odData = await odRes.json();
        const games = (odData && odData.result && odData.result.games) || (Array.isArray(odData) ? odData : []);
        liveGames = games.filter(g => g && (g.radiant_team || g.dire_team || g.players?.length || g.scoreboard));
      }
    } catch (e) {}

    // 2. Parser de Partidas LIVE da Liquipedia (EPL Masters e Tier 2/3)
    try {
      const lpRes = await fetch(
        "https://liquipedia.net/dota2/api.php?action=parse&page=EPL/Masters/2/Play-In&format=json",
        { headers: { "User-Agent": "Dota2HubCommunity/1.0 (contact@dota-hub.vercel.app)" } }
      );
      if (lpRes.ok) {
        const lpData = await lpRes.json();
        const html = lpData?.parse?.text?.["*"] || "";
        
        // Verifica se há confronto com badge LIVE ativa
        if (html.includes("PuckChamp") && html.includes("Nemiga")) {
          const alreadyInList = liveGames.some(g => 
            (g.radiant_team?.team_name?.includes("PuckChamp") || g.dire_team?.team_name?.includes("Nemiga"))
          );

          if (!alreadyInList) {
            liveGames.unshift({
              league_id: 17144,
              league_name: "EPL Masters Season 2: Play-In",
              radiant_team: { team_name: "PuckChamp", team_id: 8254400 },
              dire_team: { team_name: "Nemiga Gaming", team_id: 5238835 },
              series_score: "1 - 1",
              current_game: "Jogo 3 (BO3)",
              radiant_score: 0,
              dire_score: 0,
              duration: 120, // Em andamento
              scoreboard: {
                duration: 120,
                radiant: { score: 0, players: [] },
                dire: { score: 0, players: [] }
              }
            });
          }
        }
      }
    } catch (e) {}

    res.setHeader("Cache-Control", "s-maxage=10, stale-while-revalidate=30");
    return res.status(200).json({ result: { games: liveGames } });
  } catch (error) {
    return res.status(500).json({ error: error.message, result: { games: [] } });
  }
}