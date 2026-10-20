import { OPENDOTA_BASE, getCached, setCache, fetchWithTimeout } from './api';

const TEAMS_CACHE_KEY = 'dotahub_teams_ranking_v1';
const TEAMS_CACHE_TTL = 30 * 60 * 1000; // 30 minutos

export async function fetchTeamsRanking() {
  const cached = getCached(TEAMS_CACHE_KEY, TEAMS_CACHE_TTL);
  if (cached && Array.isArray(cached) && cached.length > 0) {
    return cached;
  }

  try {
    const res = await fetchWithTimeout(`${OPENDOTA_BASE}/teams`, {}, 10000);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (!Array.isArray(data)) return [];

    // Filtra times sem jogos ou sem nome válido e ordena por rating
    const validTeams = data
      .filter((t) => t && t.name && (t.wins + t.losses > 0))
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .map((t, idx) => {
        const total = (t.wins || 0) + (t.losses || 0);
        const winRate = total > 0 ? Math.round(((t.wins || 0) / total) * 100) : 0;
        return {
          rank: idx + 1,
          teamId: t.team_id,
          name: t.name,
          tag: t.tag || '',
          rating: t.rating ? Math.round(t.rating) : 1000,
          rawRating: t.rating || 0,
          wins: t.wins || 0,
          losses: t.losses || 0,
          totalGames: total,
          winRate,
          lastMatchTime: t.last_match_time || null,
          logoUrl: t.logo_url || null
        };
      });

    setCache(TEAMS_CACHE_KEY, validTeams);
    return validTeams;
  } catch (err) {
    console.warn('Erro ao carregar ranking de times da OpenDota:', err);
    const stale = getCached(TEAMS_CACHE_KEY, 24 * 3600 * 1000);
    return stale || [];
  }
}
