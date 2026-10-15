function normalizeTeamKey(name) {
  if (!name) return "";
  return String(name)
    .toLowerCase()
    .replace(/\b(team|gaming|esports|esport|gg|club)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * GET /api/results?heroStats=1
 * Estatísticas de heróis da OpenDota com cache na CDN da Vercel: a resposta vale
 * 30 min e continua sendo servida por até 7 dias enquanto revalida, então a
 * página de heróis segue funcionando quando a OpenDota fica fora do ar.
 * Falhas respondem 503 para não substituir a cópia boa em cache.
 */
async function handleHeroStats(res) {
  try {
    const r = await fetch('https://api.opendota.com/api/heroStats', {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(9000)
    });
    const list = r.ok ? await r.json() : null;
    if (!Array.isArray(list) || list.length === 0) throw new Error(`HTTP ${r.status}`);
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=604800');
    return res.status(200).json(list);
  } catch (err) {
    console.error('[Results API] heroStats indisponível:', err.message);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({ error: 'OpenDota indisponível' });
  }
}

export default async function handler(req, res) {
  if (req.query?.heroStats) return handleHeroStats(res);
  try {
    const proRes = await fetch("https://api.opendota.com/api/proMatches", {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(4000)
    });
    
    if (!proRes.ok) {
      return res.status(200).json({ series: [] });
    }

    const proMatches = await proRes.json();
    const rawList = (proMatches || []).slice(0, 120);
    const seriesClusters = [];

    rawList.forEach((m) => {
      const tA = normalizeTeamKey(m.radiant_name || m.radiant_team_id);
      const tB = normalizeTeamKey(m.dire_name || m.dire_team_id);
      const leagueId = m.leagueid;
      const matchTime = m.start_time;

      let cluster = seriesClusters.find(c => {
        const hasSameTeams = (c.teamAKey === tA && c.teamBKey === tB) || (c.teamAKey === tB && c.teamBKey === tA);
        const isSameLeague = !leagueId || !c.leagueId || leagueId === c.leagueId;
        const isNearInTime = Math.abs(c.baseTime - matchTime) < (8 * 3600);
        return hasSameTeams && isSameLeague && isNearInTime;
      });

      if (!cluster) {
        cluster = {
          teamAKey: tA,
          teamBKey: tB,
          leagueId,
          leagueName: m.league_name,
          baseTime: matchTime,
          preferredNameA: m.radiant_name || "Time A",
          preferredNameB: m.dire_name || "Time B",
          preferredIdA: m.radiant_team_id,
          preferredIdB: m.dire_team_id,
          games: []
        };
        seriesClusters.push(cluster);
      }

      cluster.games.push(m);
    });

    const completedSeries = [];

    seriesClusters.forEach((cluster) => {
      const games = cluster.games;
      games.sort((a, b) => a.start_time - b.start_time);
      
      const teamAName = cluster.preferredNameA;
      const teamBName = cluster.preferredNameB;
      const teamAId = cluster.preferredIdA;
      const teamAKey = cluster.teamAKey;

      let scoreA = 0;
      let scoreB = 0;

      games.forEach((g) => {
        const radWon = g.radiant_win;
        const radKey = normalizeTeamKey(g.radiant_name || g.radiant_team_id);
        const isRadTeamA = (g.radiant_team_id && g.radiant_team_id === teamAId) || (radKey === teamAKey);

        if (isRadTeamA) {
          if (radWon) scoreA++; else scoreB++;
        } else {
          if (radWon) scoreB++; else scoreA++;
        }
      });

      const isFinished = (scoreA >= 2 || scoreB >= 2) || (games.length >= 2 && scoreA !== scoreB);
      if (!isFinished) return;

      const winner = scoreA > scoreB ? teamAName : teamBName;

      completedSeries.push({
        stage: cluster.leagueName || "Torneio Profissional",
        timeA: teamAName,
        timeB: teamBName,
        scoreA,
        scoreB,
        winner,
        dur: `${games.length} mapa${games.length > 1 ? 's' : ''}`,
        games: games.map((g, idx) => ({
          mapNumber: idx + 1,
          match_id: String(g.match_id)
        }))
      });
    });

    // Cache de 2 minutos na CDN da Vercel
    res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");
    return res.status(200).json({ series: completedSeries.slice(0, 10) });
  } catch (error) {
    return res.status(500).json({ error: error.message, series: [] });
  }
}