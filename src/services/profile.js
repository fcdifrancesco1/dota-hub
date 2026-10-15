// Aba Perfil: login com a Steam (OpenID) e estatísticas da conta via OpenDota.
import { OPENDOTA_BASE, getCached, setCache, fetchWithTimeout } from './api';

const LINK_KEY = 'dotahub_profile_link_v1';

// ---- Vínculo com a Steam ----

/** Link da página oficial de login da Steam, que volta para /perfil. */
export function steamLoginUrl() {
  const origin = window.location.origin;
  const params = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': `${origin}/perfil`,
    'openid.realm': origin,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select'
  });
  return `https://steamcommunity.com/openid/login?${params}`;
}

/** Retorno da Steam na URL (?openid.mode=id_res...)? */
export function hasSteamReturn(search) {
  return new URLSearchParams(search).get('openid.mode') === 'id_res';
}

/** Confirma o login no servidor e guarda o vínculo neste navegador. */
export async function completeSteamLogin(search) {
  const params = new URLSearchParams(search);
  const forward = new URLSearchParams({ openid: 'verify' });
  for (const [key, value] of params) if (key.startsWith('openid.')) forward.set(key, value);
  const res = await fetchWithTimeout(`/api/sync-steam?${forward}`, {}, 15000);
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) throw new Error(data?.error || 'Não foi possível confirmar o login');
  const link = { accountId: data.accountId, steamId64: data.steamId64, linkedAt: Date.now() };
  try { localStorage.setItem(LINK_KEY, JSON.stringify(link)); } catch { /* navegador sem armazenamento */ }
  return link;
}

export function getProfileLink() {
  try {
    const link = JSON.parse(localStorage.getItem(LINK_KEY) || 'null');
    return link?.accountId ? link : null;
  } catch {
    return null;
  }
}

export function unlinkProfile() {
  try { localStorage.removeItem(LINK_KEY); } catch { /* ignore */ }
}

// ---- Modos de jogo ----

// Ranked = lobby 7; Turbo = modo 23; Casual = lobby normal (0) que não é Turbo
export const MODES = {
  ranked: { label: 'Ranked', query: { lobby_type: 7 } },
  casual: { label: 'Casual', query: { lobby_type: 0 }, exclude: (m) => m.game_mode === 23 },
  turbo: { label: 'Turbo', query: { game_mode: 23 } }
};

const MEDALS = ['', 'Arauto', 'Guardião', 'Cruzado', 'Arconte', 'Lenda', 'Ancestral', 'Divino', 'Imortal'];

/** Medalha a partir do rank_tier da OpenDota (ex.: 54 = Lenda 4). */
export function medalOf(rankTier, leaderboardRank) {
  if (!rankTier) return null;
  const medal = Math.floor(rankTier / 10);
  const stars = rankTier % 10;
  const base = 'https://www.opendota.com/assets/images/dota2/rank_icons';
  return {
    name: medal === 8 ? (leaderboardRank ? `Imortal #${leaderboardRank}` : 'Imortal') : `${MEDALS[medal] || 'Sem medalha'} ${stars || ''}`.trim(),
    icon: `${base}/rank_icon_${medal}.png`,
    star: medal < 8 && stars ? `${base}/rank_star_${stars}.png` : null
  };
}

// ---- Dados da OpenDota ----

async function getJson(path, timeout = 10000) {
  const res = await fetchWithTimeout(`${OPENDOTA_BASE}${path}`, {}, timeout);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const qs = (obj) => new URLSearchParams(Object.entries(obj).map(([k, v]) => [k, String(v)])).toString();

/** Perfil da conta e vitórias/derrotas totais por modo. */
export async function fetchProfileSummary(accountId) {
  const key = `profile_summary_v1_${accountId}`;
  const cached = getCached(key, 10 * 60 * 1000);
  if (cached) return cached;

  const [player, ranked, normal, turbo] = await Promise.all([
    getJson(`/players/${accountId}`),
    getJson(`/players/${accountId}/wl?${qs(MODES.ranked.query)}`).catch(() => null),
    getJson(`/players/${accountId}/wl?lobby_type=0`).catch(() => null),
    getJson(`/players/${accountId}/wl?${qs(MODES.turbo.query)}`).catch(() => null)
  ]);
  // Turbo também é lobby normal: casual = normal − turbo
  const turboNormal = turbo ? { win: turbo.win, lose: turbo.lose } : { win: 0, lose: 0 };
  const result = {
    profile: player?.profile || null,
    rankTier: player?.rank_tier || null,
    leaderboardRank: player?.leaderboard_rank || null,
    totals: {
      ranked: ranked,
      casual: normal ? { win: Math.max(0, normal.win - turboNormal.win), lose: Math.max(0, normal.lose - turboNormal.lose) } : null,
      turbo: turbo
    }
  };
  setCache(key, result);
  return result;
}

const MATCH_FIELDS = ['hero_id', 'kills', 'deaths', 'assists', 'duration', 'start_time', 'radiant_win', 'player_slot', 'game_mode', 'lobby_type', 'gold_per_min', 'xp_per_min', 'last_hits'];

/** Últimas partidas de um modo (até 100) com resumo de heróis e médias. */
export async function fetchModeMatches(accountId, mode) {
  const cfg = MODES[mode];
  const key = `profile_matches_v1_${accountId}_${mode}`;
  const cached = getCached(key, 10 * 60 * 1000);
  if (cached) return cached;

  const query = qs({ ...cfg.query, limit: cfg.exclude ? 150 : 100 });
  const project = MATCH_FIELDS.map((f) => `project=${f}`).join('&');
  const list = await getJson(`/players/${accountId}/matches?${query}&${project}`, 12000);
  const matches = (Array.isArray(list) ? list : [])
    .filter((m) => !cfg.exclude || !cfg.exclude(m))
    .slice(0, 100)
    .map((m) => ({ ...m, won: (m.player_slot < 128) === Boolean(m.radiant_win) }));

  const byHero = {};
  for (const m of matches) {
    const h = (byHero[m.hero_id] ||= { heroId: m.hero_id, games: 0, wins: 0, kills: 0, deaths: 0, assists: 0 });
    h.games++;
    if (m.won) h.wins++;
    h.kills += m.kills || 0;
    h.deaths += m.deaths || 0;
    h.assists += m.assists || 0;
  }
  const n = matches.length || 1;
  const avg = (field) => matches.reduce((a, m) => a + (m[field] || 0), 0) / n;
  const result = {
    matches,
    heroes: Object.values(byHero).sort((a, b) => b.games - a.games || b.wins - a.wins),
    averages: matches.length ? {
      kills: avg('kills'), deaths: avg('deaths'), assists: avg('assists'),
      gpm: Math.round(avg('gold_per_min')), xpm: Math.round(avg('xp_per_min')),
      lastHits: Math.round(avg('last_hits')), duration: Math.round(avg('duration')),
      winRate: (matches.filter((m) => m.won).length / matches.length) * 100
    } : null
  };
  setCache(key, result);
  return result;
}

/** Pede para a OpenDota buscar as partidas novas da conta e limpa o cache local. */
export async function refreshProfile(accountId) {
  try {
    await fetchWithTimeout(`${OPENDOTA_BASE}/players/${accountId}/refresh`, { method: 'POST' }, 10000);
  } catch { /* segue mesmo se o pedido falhar */ }
  try {
    for (const k of Object.keys(localStorage)) {
      if (k.includes(`profile_summary_v1_${accountId}`) || k.includes(`profile_matches_v1_${accountId}_`)) localStorage.removeItem(k);
    }
  } catch { /* ignore */ }
}
