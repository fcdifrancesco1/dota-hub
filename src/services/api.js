const OPENDOTA_BASE = "https://api.opendota.com/api";

// Cache local persistente para partidas
export const getCachedMatch = async (matchId) => {
  const key = `dota_m_${matchId}`;
  const local = localStorage.getItem(key);
  if (local) return JSON.parse(local);

  try {
    const res = await fetch(`${OPENDOTA_BASE}/matches/${matchId}`);
    if (!res.ok) return null;
    const data = await res.json();
    const compact = {
      match_id: data.match_id,
      radiant_name: data.radiant_name,
      dire_name: data.dire_name,
      players: (data.players || []).map(p => ({
        account_id: p.account_id,
        name: p.personaname || p.name,
        slot: p.player_slot,
        kills: p.kills,
        deaths: p.deaths,
        assists: p.assists,
        gpm: p.gold_per_min,
        xpm: p.xp_per_min,
        lane_role: p.lane_role
      }))
    };
    localStorage.setItem(key, JSON.stringify(compact));
    return compact;
  } catch {
    return null;
  }
};

// Top 16 Times Oficiais (OpenDota Teams)
export const fetchTopTeams = async () => {
  try {
    const res = await fetch(`${OPENDOTA_BASE}/teams`);
    if (!res.ok) return [];
    const data = await res.json();
    return data
      .filter(t => t.name && t.rating)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 16);
  } catch {
    return [];
  }
};

// Estatísticas dos últimos 100 jogos de um time
export const fetchTeam100MatchesStats = async (teamId, teamName) => {
  try {
    const res = await fetch(`${OPENDOTA_BASE}/teams/${teamId}/matches`);
    if (!res.ok) return [];
    const teamMatches = await res.json();
    const sample = teamMatches.slice(0, 100);

    const matchesDetails = await Promise.all(
      sample.slice(0, 20).map(m => getCachedMatch(m.match_id))
    );

    const agg = {};
    matchesDetails.filter(Boolean).forEach(m => {
      const isRadiant = String(m.radiant_name || "").toLowerCase().includes(teamName.toLowerCase());
      const side = (m.players || []).filter(p => isRadiant ? p.slot < 128 : p.slot >= 128);

      side.forEach((pl, idx) => {
        const id = pl.account_id || `pl_${idx}`;
        if (!agg[id]) {
          agg[id] = {
            id,
            name: pl.name || `Jogador ${idx + 1}`,
            games: 0, kills: 0, deaths: 0, assists: 0, gpm: 0, xpm: 0,
            mid: 0, safe: 0, off: 0
          };
        }
        agg[id].games++;
        agg[id].kills += pl.kills || 0;
        agg[id].deaths += pl.deaths || 0;
        agg[id].assists += pl.assists || 0;
        agg[id].gpm += pl.gpm || 0;
        agg[id].xpm += pl.xpm || 0;
        if (pl.lane_role === 2) agg[id].mid++;
        else if (pl.lane_role === 1) agg[id].safe++;
        else if (pl.lane_role === 3) agg[id].off++;
      });
    });

    const list = Object.values(agg);
    if (!list.length) return [];

    // Cálculo das Posições (1 a 5)
    let mid = list.reduce((prev, cur) => cur.mid > prev.mid ? cur : prev, list[0]);
    mid.position = 2;
    const rest = list.filter(p => p !== mid).sort((a, b) => (b.gpm / (b.games || 1)) - (a.gpm / (a.games || 1)));

    if (rest.length >= 4) {
      if (rest[0].safe >= rest[1].safe) {
        rest[0].position = 1; rest[1].position = 3;
      } else {
        rest[0].position = 3; rest[1].position = 1;
      }
      rest[2].position = 4;
      rest[3].position = 5;
    } else {
      rest.forEach((p, i) => p.position = i === 0 ? 1 : i === 1 ? 3 : i === 2 ? 4 : 5);
    }

    return list.sort((a, b) => a.position - b.position);
  } catch {
    return [];
  }
};

// Ranking Oficial MMR Valve (Edge / Proxy)
export const fetchOfficialLeaderboard = async (division = "europe") => {
  try {
    const res = await fetch(`/api/leaderboard?division=${division}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.leaderboard || [];
  } catch {
    return [];
  }
};