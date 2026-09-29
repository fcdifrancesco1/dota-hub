import {
  OPENDOTA_BASE,
  getCached,
  setCache,
  fetchWithTimeout,
  resolveTeamFromList
} from './api';
import { SITE_CONFIG } from '../config/siteConfig';

// Dados da página do time, todos reais da OpenDota:
//  - /teams/{id}            → nome, tag, logo, rating, vitórias/derrotas
//  - /teams/{id}/players    → elenco atual
//  - /teams/{id}/matches    → partidas, agrupadas em séries
//  - /players/{id}          → avatar e medalha
//  - /players/{id}/matches  → últimas partidas de campeonato (estatísticas)

const TEAM_TTL = 15 * 60 * 1000;
const PLAYER_TTL = 30 * 60 * 1000;
const SERIES_GAP_SECONDS = 5 * 3600;
const PLAYER_MATCHES_LIMIT = 20;

async function getJson(url, timeoutMs = 8000) {
  const res = await fetchWithTimeout(url, {}, timeoutMs);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** Aceita o ID numérico da OpenDota ou o nome do time (resolvido pela lista /teams). */
export async function resolveTeamId(idOrName) {
  const raw = decodeURIComponent(String(idOrName || '')).trim();
  if (!raw) return null;
  if (/^\d+$/.test(raw)) return Number(raw);

  const key = `team_id_by_name_${raw.toLowerCase()}`;
  const cached = getCached(key, 24 * 3600 * 1000);
  if (cached) return cached;
  try {
    const found = resolveTeamFromList(raw, await getJson(`${OPENDOTA_BASE}/teams`));
    if (found?.team_id) {
      setCache(key, found.team_id);
      return found.team_id;
    }
  } catch { /* segue sem ID */ }
  return null;
}

/**
 * Agrupa as partidas do time em séries: mapas consecutivos contra o mesmo
 * adversário, na mesma liga, com menos de 5h entre um e outro. O formato é
 * compatível com a página /partidas/:id (games em ordem cronológica).
 */
export function groupTeamSeries(team, matches, limit = 10) {
  const sorted = [...(matches || [])].sort((a, b) => b.start_time - a.start_time);
  const series = [];
  let current = null;

  for (const m of sorted) {
    const sameSeries = current
      && current.opponentId === m.opposing_team_id
      && current.leagueId === m.leagueid
      && (current.earliest - m.start_time) <= SERIES_GAP_SECONDS;

    if (!sameSeries) {
      if (series.length >= limit) break;
      current = {
        opponentId: m.opposing_team_id,
        opponentName: m.opposing_team_name || 'Adversário',
        opponentLogo: m.opposing_team_logo || null,
        leagueId: m.leagueid,
        leagueName: m.league_name || 'Torneio Profissional',
        earliest: m.start_time,
        matches: []
      };
      series.push(current);
    }
    current.matches.push(m);
    current.earliest = m.start_time;
  }

  return series.map((s) => {
    const games = [...s.matches].sort((a, b) => a.start_time - b.start_time);
    const won = (m) => Boolean(m.radiant) === Boolean(m.radiant_win);
    const scoreA = games.filter(won).length;
    const scoreB = games.length - scoreA;
    const first = games[0];
    return {
      series_id: null,
      stage: s.leagueName,
      leagueId: s.leagueId,
      timeA: team.name,
      timeB: s.opponentName,
      preferredIdA: team.team_id,
      preferredIdB: s.opponentId,
      logoA: team.logo_url || null,
      logoB: s.opponentLogo,
      scoreA,
      scoreB,
      winner: scoreA > scoreB ? team.name : (scoreB > scoreA ? s.opponentName : 'Empate'),
      startTime: first.start_time,
      lastMatchTime: games[games.length - 1].start_time,
      dateStr: new Date(first.start_time * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      games: games.map((g, idx) => ({
        mapNumber: idx + 1,
        match_id: String(g.match_id),
        start_time: g.start_time,
        radiant_score: g.radiant_score,
        dire_score: g.dire_score,
        radiant_win: g.radiant_win,
        duration: g.duration,
        teamWon: won(g)
      }))
    };
  });
}

function summarizePlayerMatches(matches) {
  const list = Array.isArray(matches) ? matches : [];
  if (!list.length) return null;
  const n = list.length;
  const sum = (field) => list.reduce((acc, m) => acc + (m[field] || 0), 0);
  const wins = list.filter((m) => (m.player_slot < 128) === Boolean(m.radiant_win)).length;
  const kills = sum('kills');
  const deaths = sum('deaths');
  const assists = sum('assists');

  const heroes = new Map();
  for (const m of list) {
    const h = heroes.get(m.hero_id) || { hero_id: m.hero_id, games: 0, wins: 0 };
    h.games += 1;
    if ((m.player_slot < 128) === Boolean(m.radiant_win)) h.wins += 1;
    heroes.set(m.hero_id, h);
  }

  return {
    matches: n,
    wins,
    winRate: Math.round((wins / n) * 100),
    avgKills: kills / n,
    avgDeaths: deaths / n,
    avgAssists: assists / n,
    kda: (kills + assists) / Math.max(deaths, 1),
    gpm: Math.round(sum('gold_per_min') / n),
    xpm: Math.round(sum('xp_per_min') / n),
    lastHits: Math.round(sum('last_hits') / n),
    topHeroes: [...heroes.values()].sort((a, b) => b.games - a.games || b.wins - a.wins).slice(0, 3),
    lastMatchTime: Math.max(...list.map((m) => m.start_time || 0))
  };
}

/** Perfil e estatísticas recentes (partidas de campeonato) de um jogador. */
export async function fetchPlayerStats(accountId) {
  const key = `player_stats_v1_${accountId}`;
  const cached = getCached(key, PLAYER_TTL);
  if (cached) return cached;

  const fields = ['kills', 'deaths', 'assists', 'hero_id', 'gold_per_min', 'xp_per_min', 'last_hits', 'start_time', 'player_slot', 'radiant_win']
    .map((f) => `project=${f}`).join('&');
  const [profile, matches] = await Promise.all([
    getJson(`${OPENDOTA_BASE}/players/${accountId}`).catch(() => null),
    getJson(`${OPENDOTA_BASE}/players/${accountId}/matches?limit=${PLAYER_MATCHES_LIMIT}&lobby_type=1&${fields}`).catch(() => null)
  ]);

  const result = {
    avatar: profile?.profile?.avatarfull || profile?.profile?.avatarmedium || null,
    countryCode: profile?.profile?.loccountrycode || null,
    rankTier: profile?.rank_tier || null,
    leaderboardRank: profile?.leaderboard_rank || null,
    stats: summarizePlayerMatches(matches)
  };
  // Só guarda em cache quando as partidas vieram (evita fixar uma falha por 30 min)
  if (matches) setCache(key, result);
  return result;
}

/** Time, elenco atual e últimas séries. As estatísticas dos jogadores vêm à parte (fetchPlayerStats). */
export async function fetchTeamPage(teamId) {
  const key = `team_page_v3_${teamId}`;
  const cached = getCached(key, TEAM_TTL);
  if (cached) return cached;

  const [team, players, matches] = await Promise.all([
    getJson(`${OPENDOTA_BASE}/teams/${teamId}`),
    getJson(`${OPENDOTA_BASE}/teams/${teamId}/players`).catch(() => []),
    getJson(`${OPENDOTA_BASE}/teams/${teamId}/matches`).catch(() => [])
  ]);
  if (!team?.team_id) return null;

  const playerList = Array.isArray(players) ? players : [];
  const byAccount = new Map(playerList.map((p) => [p.account_id, p]));
  const toRosterEntry = (accountId, fallbackName) => {
    const p = byAccount.get(accountId);
    return {
      accountId,
      name: p?.name || fallbackName || `Jogador ${accountId}`,
      gamesWithTeam: p?.games_played || 0,
      winsWithTeam: p?.wins || 0
    };
  };

  // O "is_current_team_member" da OpenDota costuma estar incompleto; a escalação
  // real é a dos 5 jogadores do time na partida mais recente.
  let roster = [];
  const latest = Array.isArray(matches) && matches.length
    ? [...matches].sort((a, b) => b.start_time - a.start_time)[0]
    : null;
  if (latest) {
    const detail = await getJson(`${OPENDOTA_BASE}/matches/${latest.match_id}`).catch(() => null);
    const side = (detail?.players || []).filter((p) => (p.player_slot < 128) === Boolean(latest.radiant));
    if (side.length === 5 && side.every((p) => p.account_id)) {
      roster = side.map((p) => toRosterEntry(p.account_id, p.name || p.personaname));
    }
  }
  if (!roster.length) {
    roster = playerList
      .filter((p) => p.is_current_team_member && p.account_id)
      .map((p) => toRosterEntry(p.account_id, p.name));
  }
  // Trocas de elenco que a OpenDota ainda não reflete (siteConfig.rosterOverrides)
  const override = SITE_CONFIG.rosterOverrides?.[teamId];
  if (override) {
    const out = new Set(override.out || []);
    roster = roster.filter((p) => !out.has(p.accountId));
    for (const p of override.in || []) {
      if (!roster.some((r) => r.accountId === p.accountId)) {
        roster.push({ ...toRosterEntry(p.accountId, p.name), name: p.name, isNewcomer: true });
      }
    }
  }
  roster.sort((a, b) => b.gamesWithTeam - a.gamesWithTeam);

  const result = {
    team: {
      id: team.team_id,
      name: team.name,
      tag: team.tag,
      logo: team.logo_url || null,
      rating: team.rating ? Math.round(team.rating) : null,
      wins: team.wins || 0,
      losses: team.losses || 0,
      lastMatchTime: team.last_match_time || null
    },
    roster,
    series: groupTeamSeries(team, Array.isArray(matches) ? matches.slice(0, 60) : [], 10)
  };
  setCache(key, result);
  return result;
}
