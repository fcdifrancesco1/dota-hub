export default async function handler(req, res) {
  const { league_id } = req.query;

  if (!league_id) {
    return res.status(400).json({ error: "league_id é obrigatório" });
  }

  try {
    const response = await fetch(`https://api.opendota.com/api/leagues/${league_id}/matches`, {
      headers: { "Accept": "application/json" }
    });

    if (!response.ok) {
      return res.status(200).json({ series: [] });
    }

    const matches = await response.json();
    const rawList = Array.isArray(matches) ? matches : [];

    // Agrupa as partidas em séries
    const groups = {};
    rawList.forEach((m) => {
      const tA = m.radiant_team_id || m.radiant_name || "A";
      const tB = m.dire_team_id || m.dire_name || "B";
      const pairKey = [tA, tB].sort().join("___");
      const key = m.series_id && m.series_id !== 0 ? `s_${m.series_id}` : `p_${pairKey}_${Math.floor(m.start_time / (86400 * 2))}`;

      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    });

    const seriesList = Object.values(groups).map((games) => {
      games.sort((a, b) => a.start_time - b.start_time);
      const first = games[0];
      const tAId = first.radiant_team_id;
      const timeAName = first.radiant_name || "Time A";
      const timeBName = first.dire_name || "Time B";

      let scoreA = 0;
      let scoreB = 0;

      games.forEach((g) => {
        const radWon = g.radiant_win;
        const isRadTeamA = (g.radiant_team_id === tAId);
        if (isRadTeamA) {
          if (radWon) scoreA++; else scoreB++;
        } else {
          if (radWon) scoreB++; else scoreA++;
        }
      });

      return {
        stage: first.league_name || "Confronto do Torneio",
        timeA: timeAName,
        timeB: timeBName,
        scoreA,
        scoreB,
        winner: scoreA > scoreB ? timeAName : (scoreB > scoreA ? timeBName : "Empate"),
        dur: `${games.length} mapa${games.length > 1 ? 's' : ''}`,
        games: games.map((g, idx) => ({
          mapNumber: idx + 1,
          match_id: String(g.match_id)
        }))
      };
    });

    // Cache na borda da Vercel
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json({ series: seriesList });
  } catch (err) {
    return res.status(500).json({ error: err.message, series: [] });
  }
}