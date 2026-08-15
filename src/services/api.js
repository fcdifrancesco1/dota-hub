const OPENDOTA = "https://api.opendota.com/api";

export async function getTop16Teams() {
  try {
    const res = await fetch(`${OPENDOTA}/teams`);
    if (!res.ok) return [];
    const data = await res.json();
    return data
      .filter((t) => t.name && t.rating && t.logo_url)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 16);
  } catch {
    return [];
  }
}

// Busca os últimos 100 jogos de um time e infere os 5 jogadores por posição
export async function getTeam100GamesStats(teamId, teamName) {
  try {
    const res = await fetch(`${OPENDOTA}/teams/${teamId}/matches`);
    if (!res.ok) return [];
    const matches = await res.json();
    const last100 = (matches || []).slice(0, 100);

    // Amostra detalhada com fallback de dados
    const sample = await Promise.all(
      last100.slice(0, 15).map(async (m) => {
        try {
          const mRes = await fetch(`${OPENDOTA}/matches/${m.match_id}`);
          return mRes.ok ? await mRes.json() : null;
        } catch {
          return null;
        }
      })
    );

    const playerAgg = {};

    sample.filter(Boolean).forEach((match) => {
      const isRadiant = String(match.radiant_name || "").toLowerCase().includes(teamName.toLowerCase());
      const players = (match.players || []).filter((p) => (isRadiant ? p.player_slot < 128 : p.player_slot >= 128));

      players.forEach((pl, idx) => {
        const id = pl.account_id || pl.personaname || `p_${idx}`;
        if (!playerAgg[id]) {
          playerAgg[id] = {
            id,
            name: pl.name || pl.personaname || `Jogador ${idx + 1}`,
            games: 0,
            kills: 0,
            deaths: 0,
            assists: 0,
            gpm: 0,
            xpm: 0,
            mid: 0,
            safe: 0,
            off: 0,
          };
        }
        playerAgg[id].games++;
        playerAgg[id].kills += pl.kills || 0;
        playerAgg[id].deaths += pl.deaths || 0;
        playerAgg[id].assists += pl.assists || 0;
        playerAgg[id].gpm += pl.gold_per_min || 0;
        playerAgg[id].xpm += pl.xp_per_min || 0;

        if (pl.lane_role === 2) playerAgg[id].mid++;
        else if (pl.lane_role === 1) playerAgg[id].safe++;
        else if (pl.lane_role === 3) playerAgg[id].off++;
      });
    });

    const list = Object.values(playerAgg);
    if (!list.length) return [];

    // Cálculo das Posições (1 a 5)
    let mid = list.reduce((prev, cur) => (cur.mid > prev.mid ? cur : prev), list[0]);
    mid.position = 2;
    const rest = list.filter((p) => p !== mid).sort((a, b) => b.gpm / (b.games || 1) - a.gpm / (a.games || 1));

    if (rest.length >= 4) {
      if (rest[0].safe >= rest[1].safe) {
        rest[0].position = 1;
        rest[1].position = 3;
      } else {
        rest[0].position = 3;
        rest[1].position = 1;
      }
      rest[2].position = 4;
      rest[3].position = 5;
    } else {
      rest.forEach((p, i) => (p.position = i === 0 ? 1 : i === 1 ? 3 : i === 2 ? 4 : 5));
    }

    return list.sort((a, b) => a.position - b.position);
  } catch {
    return [];
  }
}

export async function getOfficialMmr(division = "europe") {
  try {
    const res = await fetch(`/.netlify/functions/leaderboard?division=${division}`);
    if (!res.ok) {
      // Fallback para api route vercel
      const resVercel = await fetch(`/api/leaderboard?division=${division}`);
      if (!resVercel.ok) return [];
      const dataV = await resVercel.json();
      return dataV.leaderboard || [];
    }
    const data = await res.json();
    return data.leaderboard || [];
  } catch {
    return [];
  }
}