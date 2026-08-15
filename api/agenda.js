export default async function handler(req, res) {
  try {
    // 1. Consulta partidas oficiais pro matches e torneios ativos
    const [proRes, teamsRes, leaguesRes] = await Promise.all([
      fetch("https://api.opendota.com/api/proMatches"),
      fetch("https://api.opendota.com/api/teams"),
      fetch("https://api.opendota.com/api/leagues")
    ]);

    const proMatches = await proRes.json();
    const allTeams = await teamsRes.json();
    const leagues = await leaguesRes.json();

    const teamMap = {};
    (allTeams || []).forEach(t => { 
      if (t.team_id) teamMap[t.team_id] = t; 
    });

    const leagueMap = {};
    (leagues || []).forEach(l => { 
      if (l.leagueid) leagueMap[l.leagueid] = l.name; 
    });

    // 2. Agrupa séries competitivas e mapeia confrontos reais
    const seenSeries = new Set();
    const dynamicSchedule = [];

    (proMatches || []).slice(0, 30).forEach(m => {
      const tA = teamMap[m.radiant_team_id] || { name: m.radiant_name, logo_url: "" };
      const tB = teamMap[m.dire_team_id] || { name: m.dire_name, logo_url: "" };
      const seriesKey = [m.radiant_team_id, m.dire_team_id].sort().join("-");

      if (!seenSeries.has(seriesKey) && tA.name && tB.name) {
        seenSeries.add(seriesKey);
        dynamicSchedule.push({
          id: m.match_id,
          torneio: leagueMap[m.leagueid] || m.league_name || "Torneio Profissional",
          timeA: tA.name,
          timeB: tB.name,
          logoA: tA.logo_url || "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/global/dota2_logo_symbol.png",
          logoB: tB.logo_url || "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/global/dota2_logo_symbol.png",
          formato: m.series_type === 1 ? "BO3" : m.series_type === 2 ? "BO5" : "BO3",
          data: new Date(m.start_time * 1000).toISOString()
        });
      }
    });

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json(dynamicSchedule);
  } catch (error) {
    return res.status(500).json({ error: error.message, data: [] });
  }
}