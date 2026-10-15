// Aba Perfil: login com a Steam (OpenID) e estatísticas da conta via OpenDota.
import { OPENDOTA_BASE, getCached, setCache, fetchWithTimeout } from './api';

// ---- Vínculo com a Steam ----
// O vínculo é uma sessão assinada pelo servidor num cookie HttpOnly (/api/auth):
// a página não consegue ler nem forjar o ID da conta, só pergunta ao servidor.

// Vínculo antigo, guardado no navegador antes da sessão no servidor
const OLD_LINK_KEY = 'dotahub_profile_link_v1';

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

/** Confirma o login no servidor, que grava a sessão do perfil no cookie. */
export async function completeSteamLogin(search) {
  const params = new URLSearchParams(search);
  const forward = new URLSearchParams({ action: 'steam' });
  for (const [key, value] of params) if (key.startsWith('openid.')) forward.set(key, value);
  const res = await fetchWithTimeout(`/api/auth?${forward}`, { credentials: 'same-origin' }, 15000);
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) throw new Error(data?.error || 'Não foi possível confirmar o login');
  return { accountId: data.accountId };
}

/** Perfil vinculado segundo o servidor (ou null). */
export async function fetchProfileLink() {
  try { localStorage.removeItem(OLD_LINK_KEY); } catch { /* ignore */ }
  try {
    const res = await fetchWithTimeout('/api/auth?action=me', { credentials: 'same-origin' }, 10000);
    const data = res.ok ? await res.json() : null;
    return data?.profile?.accountId ? { accountId: data.profile.accountId } : null;
  } catch {
    return null;
  }
}

export async function unlinkProfile() {
  try {
    await fetchWithTimeout('/api/auth?action=logout&scope=profile', { method: 'POST', credentials: 'same-origin' }, 10000);
  } catch { /* ignore */ }
}

// ---- Modos de jogo ----

// Mesma separação da OpenDota: a visão padrão dela (significant=1) traz as
// partidas "normais" — ranked e não ranqueadas — e deixa o Turbo de fora; o Turbo
// (modo 23) só aparece pedindo o modo com significant=0
export const MODES = {
  normal: { label: 'Normal', hint: 'Ranked e não ranqueadas, sem Turbo', query: {} },
  turbo: { label: 'Turbo', hint: 'Partidas de Turbo', query: { game_mode: 23, significant: 0 } }
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
  const key = `profile_summary_v3_${accountId}`;
  const cached = getCached(key, 10 * 60 * 1000);
  if (cached) return cached;

  const [player, normal, turbo] = await Promise.all([
    getJson(`/players/${accountId}`),
    getJson(`/players/${accountId}/wl?${qs(MODES.normal.query)}`).catch(() => null),
    getJson(`/players/${accountId}/wl?${qs(MODES.turbo.query)}`).catch(() => null)
  ]);
  const result = {
    profile: player?.profile || null,
    rankTier: player?.rank_tier || null,
    leaderboardRank: player?.leaderboard_rank || null,
    totals: {
      normal,
      turbo
    }
  };
  setCache(key, result);
  return result;
}

const MATCH_FIELDS = ['hero_id', 'kills', 'deaths', 'assists', 'duration', 'start_time', 'radiant_win', 'player_slot', 'game_mode', 'lobby_type', 'gold_per_min', 'xp_per_min', 'last_hits'];

/** Heróis do modo em TODO o histórico da conta na OpenDota (não só nas últimas partidas). */
async function fetchModeHeroes(accountId, mode) {
  const list = await getJson(`/players/${accountId}/heroes?${qs(MODES[mode].query)}`, 12000);
  return (Array.isArray(list) ? list : [])
    .filter((h) => h.games > 0)
    .map((h) => ({ heroId: Number(h.hero_id), games: h.games, wins: h.win, lastPlayed: h.last_played || null }))
    .sort((a, b) => b.games - a.games || b.wins - a.wins);
}

/** Últimas partidas de um modo (até 100), médias delas e heróis do histórico completo. */
export async function fetchModeMatches(accountId, mode) {
  const cfg = MODES[mode];
  const key = `profile_matches_v4_${accountId}_${mode}`;
  const cached = getCached(key, 10 * 60 * 1000);
  if (cached) return cached;

  const query = qs({ ...cfg.query, limit: 100 });
  const project = MATCH_FIELDS.map((f) => `project=${f}`).join('&');
  const list = await getJson(`/players/${accountId}/matches?${query}&${project}`, 12000);
  const matches = (Array.isArray(list) ? list : [])
    .map((m) => ({ ...m, won: (m.player_slot < 128) === Boolean(m.radiant_win) }));

  const heroes = await fetchModeHeroes(accountId, mode).catch(() => []);
  const n = matches.length || 1;
  const avg = (field) => matches.reduce((a, m) => a + (m[field] || 0), 0) / n;
  const result = {
    matches,
    heroes,
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

// ---- Recordes (como a aba Records da OpenDota) ----

const fmtInt = (v) => Math.round(v).toLocaleString('pt-BR');
const fmtMin = (secs) => `${Math.floor(secs / 60)}:${String(Math.round(secs % 60)).padStart(2, '0')}`;

export const RECORD_FIELDS = [
  { field: 'kills', label: 'Abates', format: fmtInt },
  { field: 'deaths', label: 'Mortes', format: fmtInt },
  { field: 'assists', label: 'Assistências', format: fmtInt },
  { field: 'kda', label: 'KDA', format: (v) => Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) },
  { field: 'gold_per_min', label: 'Ouro por minuto', format: fmtInt },
  { field: 'xp_per_min', label: 'XP por minuto', format: fmtInt },
  { field: 'last_hits', label: 'Last hits', format: fmtInt },
  { field: 'denies', label: 'Denies', format: fmtInt },
  { field: 'hero_damage', label: 'Dano em heróis', format: fmtInt },
  { field: 'tower_damage', label: 'Dano em torres', format: fmtInt },
  { field: 'hero_healing', label: 'Cura em heróis', format: fmtInt },
  { field: 'stuns', label: 'Atordoamento (s)', format: fmtInt },
  { field: 'level', label: 'Nível', format: fmtInt },
  { field: 'actions_per_min', label: 'Ações por minuto', format: fmtInt },
  { field: 'duration', label: 'Partida mais longa', format: fmtMin }
];

/**
 * Melhor partida da conta em cada estatística, no modo escolhido: a lista de
 * partidas da OpenDota ordenada pelo campo (mesmo método da aba Records dela).
 * Busca em grupos de 4 para respeitar o limite de requisições da OpenDota.
 */
export async function fetchModeRecords(accountId, mode) {
  const key = `profile_records_v1_${accountId}_${mode}`;
  const cached = getCached(key, 6 * 3600 * 1000);
  if (cached) return cached;

  const one = async ({ field }) => {
    const query = qs({ ...MODES[mode].query, sort: field, limit: 1 });
    const project = [field, 'hero_id', 'start_time'].map((f) => `project=${f}`).join('&');
    const [m] = await getJson(`/players/${accountId}/matches?${query}&${project}`, 12000);
    if (!m || m[field] === null || m[field] === undefined) return null;
    return {
      field,
      value: m[field],
      matchId: m.match_id,
      heroId: m.hero_id,
      startTime: m.start_time,
      won: (m.player_slot < 128) === Boolean(m.radiant_win)
    };
  };

  const records = [];
  let failures = 0;
  for (let i = 0; i < RECORD_FIELDS.length; i += 4) {
    const group = await Promise.all(RECORD_FIELDS.slice(i, i + 4).map((f) => one(f).catch(() => { failures++; return null; })));
    records.push(...group);
  }
  const result = records.filter(Boolean);
  // Só guarda se veio completo, para uma falha momentânea não ficar 6 h no cache
  if (!failures) setCache(key, result);
  return result;
}

// ---- Totais, Parceiros, Nuvem de palavras e Classificações (abas da OpenDota) ----

// Campos do /totals com rótulo; avg = média por partida
export const TOTAL_FIELDS = [
  { field: 'kills', label: 'Abates', avg: true },
  { field: 'deaths', label: 'Mortes', avg: true },
  { field: 'assists', label: 'Assistências', avg: true },
  { field: 'last_hits', label: 'Last hits', avg: true },
  { field: 'denies', label: 'Denies', avg: true },
  { field: 'hero_damage', label: 'Dano em heróis', avg: true },
  { field: 'tower_damage', label: 'Dano em torres', avg: true },
  { field: 'hero_healing', label: 'Cura em heróis', avg: true },
  { field: 'tower_kills', label: 'Torres destruídas', avg: true },
  { field: 'neutral_kills', label: 'Neutros abatidos', avg: true },
  { field: 'courier_kills', label: 'Couriers abatidos', avg: true },
  { field: 'stuns', label: 'Atordoamento (s)', avg: true },
  { field: 'duration', label: 'Tempo jogado', time: true },
  { field: 'purchase_tpscroll', label: 'TPs comprados', avg: true },
  { field: 'purchase_ward_observer', label: 'Observer wards', avg: true },
  { field: 'purchase_ward_sentry', label: 'Sentry wards', avg: true },
  { field: 'purchase_gem', label: 'Gemas compradas', avg: true },
  { field: 'purchase_rapier', label: 'Rapiers compradas', avg: true },
  { field: 'pings', label: 'Pings', avg: true }
];

async function cachedFetch(key, ttlMs, loader) {
  const cached = getCached(key, ttlMs);
  if (cached) return cached;
  const data = await loader();
  setCache(key, data);
  return data;
}

/** Somas e médias por partida em todo o histórico do modo. */
export function fetchModeTotals(accountId, mode) {
  return cachedFetch(`profile_totals_v1_${accountId}_${mode}`, 6 * 3600 * 1000, async () => {
    const list = await getJson(`/players/${accountId}/totals?${qs(MODES[mode].query)}`, 15000);
    const byField = Object.fromEntries((Array.isArray(list) ? list : []).map((t) => [t.field, t]));
    return TOTAL_FIELDS.map((f) => {
      const t = byField[f.field];
      return t && t.n ? { ...f, sum: t.sum, n: t.n, average: t.sum / t.n } : null;
    }).filter(Boolean);
  });
}

/** Com quem a conta mais jogou junto (e contra), no modo. */
export function fetchModePeers(accountId, mode) {
  return cachedFetch(`profile_peers_v1_${accountId}_${mode}`, 6 * 3600 * 1000, async () => {
    const list = await getJson(`/players/${accountId}/peers?${qs(MODES[mode].query)}`, 15000);
    return (Array.isArray(list) ? list : [])
      .filter((p) => p.with_games > 0)
      .sort((a, b) => b.with_games - a.with_games)
      .slice(0, 30)
      .map((p) => ({
        accountId: p.account_id,
        name: p.personaname || p.name || `Jogador ${p.account_id}`,
        avatar: p.avatar || null,
        withGames: p.with_games,
        withWin: p.with_win,
        againstGames: p.against_games,
        againstWin: p.against_win,
        lastPlayed: p.last_played || null
      }));
  });
}

/** Palavras mais usadas no chat das partidas (o próprio jogador), no modo. */
export function fetchModeWordcloud(accountId, mode) {
  return cachedFetch(`profile_words_v1_${accountId}_${mode}`, 6 * 3600 * 1000, async () => {
    const data = await getJson(`/players/${accountId}/wordcloud?${qs(MODES[mode].query)}`, 15000);
    return Object.entries(data?.my_word_counts || {})
      .filter(([word]) => word.length >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 80);
  });
}

/** Percentil da conta com cada herói (a OpenDota calcula sobre todas as partidas). */
export function fetchRankings(accountId) {
  return cachedFetch(`profile_rankings_v1_${accountId}`, 6 * 3600 * 1000, async () => {
    const list = await getJson(`/players/${accountId}/rankings`, 15000);
    return (Array.isArray(list) ? list : [])
      .filter((r) => r.hero_id && r.percent_rank !== undefined)
      .sort((a, b) => b.percent_rank - a.percent_rank)
      .slice(0, 30)
      .map((r) => ({ heroId: Number(r.hero_id), percentRank: r.percent_rank, score: r.score }));
  });
}

/** Pede para a OpenDota buscar as partidas novas da conta e limpa o cache local. */
export async function refreshProfile(accountId) {
  try {
    await fetchWithTimeout(`${OPENDOTA_BASE}/players/${accountId}/refresh`, { method: 'POST' }, 10000);
  } catch { /* segue mesmo se o pedido falhar */ }
  try {
    for (const k of Object.keys(localStorage)) {
      if (k.includes(`profile_summary_v3_${accountId}`) || k.includes(`profile_matches_v4_${accountId}_`) || k.includes(`profile_records_v1_${accountId}_`) || /^dota_cache_profile_(totals|peers|words|rankings)_v1_/.test(k) && k.includes(String(accountId))) localStorage.removeItem(k);
    }
  } catch { /* ignore */ }
}
