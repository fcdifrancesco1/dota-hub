// Descobre em qual canal cada partida está passando. A agenda da Liquipedia só
// dá um nome de stream ("Special:Stream/twitch/Asgard_Championship_EN"), que nem
// sempre é o canal de verdade; a página do campeonato lista os canais reais.
// A própria Twitch diz se o canal está ao vivo e o título da transmissão, que
// costuma trazer os times ("1win Essence III | PARIVISION [0:0] DO KONCA").

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * "https://liquipedia.net/dota2/Special:Stream/twitch/EPC_EN" → { platform: 'twitch', channel: 'epc_en' }.
 * No YouTube a Liquipedia às vezes já traz o vídeo: ".../youtube/ESL_Dota2/nlOP63nfkFM" → video.
 */
export function channelFromStreamUrl(url) {
  const m = String(url || '').match(/Special:Stream\/(twitch|kick|youtube)\/([^/?#"]+)(?:\/([\w-]{11}))?/i);
  if (!m) return null;
  const out = { platform: m[1].toLowerCase(), channel: decodeURIComponent(m[2]).replace(/ /g, '_').toLowerCase() };
  if (m[3]) out.video = m[3];
  return out;
}

const YT_RESERVED = /^(watch|playlist|embed|shorts|results|feed|redirect|live|t|about)$/i;

/**
 * Canais citados numa página de campeonato (infobox e seção de transmissões):
 * [{ platform: 'twitch' | 'kick' | 'youtube', channel }]. No YouTube o canal é o
 * caminho ("@ESLDota2", "c/Nome", "channel/UC…" ou o nome antigo "ESLDota2").
 */
export function streamChannelsFromPage(html) {
  const out = [];
  const add = (platform, channel) => {
    if (!out.some((c) => c.platform === platform && c.channel.toLowerCase() === channel.toLowerCase())) out.push({ platform, channel });
  };
  const text = String(html || '');
  for (const m of text.matchAll(/href="https?:\/\/(?:www\.)?twitch\.tv\/([a-z0-9_]{3,25})\/?"/gi)) add('twitch', m[1].toLowerCase());
  for (const m of text.matchAll(/href="https?:\/\/(?:www\.)?kick\.com\/([a-z0-9_-]{3,25})\/?"/gi)) add('kick', m[1].toLowerCase());
  for (const m of text.matchAll(/href="https?:\/\/(?:www\.)?youtube\.com\/((?:c\/|user\/|channel\/)?@?[\w.-]{3,60})(?:\/(?:live|streams|videos|featured))?\/?"/gi)) {
    if (!YT_RESERVED.test(m[1])) add('youtube', m[1]);
  }
  return out;
}

/** Página "/live" de um canal (ou de um vídeo) do YouTube → { live, videoId, title }. */
export function parseYoutubeLive(html) {
  const text = String(html || '');
  const live = /"isLiveNow":true/.test(text);
  const videoId = text.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([\w-]{11})"/)?.[1] || null;
  const title = decodeHtml(text.match(/<meta name="title" content="([^"]*)"/)?.[1] || '').trim() || null;
  return { live: live && Boolean(videoId), videoId, title };
}

/** ID do canal (UC…) numa página do YouTube: o do próprio canal antes dos citados na página. */
export function youtubeChannelId(html) {
  const text = String(html || '');
  return text.match(/"externalId":"(UC[\w-]{22})"/)?.[1]
    || text.match(/itemprop="channelId" content="(UC[\w-]{22})"/)?.[1]
    || text.match(/"channelId":"(UC[\w-]{22})"/)?.[1]
    || null;
}

/**
 * Feed RSS de um canal do YouTube (/feeds/videos.xml?channel_id=UC…) → [{ videoId, title, published (ms) }].
 * Lista também as lives do canal, inclusive as que rodam ao mesmo tempo (BLAST "Stream A" e "Stream B").
 */
export function parseYoutubeFeed(xml) {
  return [...String(xml || '').matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, e]) => ({
    videoId: e.match(/<yt:videoId>([\w-]{11})<\/yt:videoId>/)?.[1] || null,
    title: decodeHtml(e.match(/<title>([^<]*)<\/title>/)?.[1] || '').trim(),
    published: Date.parse(e.match(/<published>([^<]*)<\/published>/)?.[1] || '') || 0
  })).filter((v) => v.videoId);
}

/** Resposta de kick.com/api/v2/channels/{slug} → { live, title }. */
export function parseKickChannel(json) {
  const ls = json?.livestream;
  return { live: Boolean(ls?.is_live), title: ls?.session_title || null };
}

/**
 * O nome do stream na Liquipedia nem sempre é o slug da Kick ("EPL_Dota_EN2" é
 * "epldota_en2"); testa as formas mais comuns.
 * shortcut: palpite de slug; se um canal não aparecer, ele precisa estar na página do campeonato.
 */
export function kickSlugCandidates(name) {
  const lower = String(name || '').toLowerCase();
  const parts = lower.split('_');
  return [...new Set([lower, lower.replace(/_/g, ''), parts.length > 1 ? `${parts.slice(0, -1).join('')}_${parts.at(-1)}` : lower])];
}

/** Nome do stream do YouTube na Liquipedia ("esl_dota2") → caminho do canal ("@esldota2"). */
export const youtubePathFromName = (name) => `@${String(name || '').replace(/_/g, '')}`;

const decodeHtml = (s) => String(s || '')
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>');

/** Página pública do canal na Twitch → { live, title }. */
export function parseTwitchPage(html) {
  const text = String(html || '');
  const live = /"isLiveBroadcast":true/.test(text);
  const desc = text.match(/<meta (?:name="description"|property="og:description") content="([^"]*)"/)?.[1] || '';
  // A descrição termina com "Streaming dota 2 for N viewers."
  const title = decodeHtml(desc).replace(/\s*Streaming [\s\S]*$/i, '').trim() || null;
  return { live, title };
}

/** Idioma pelo título ("[RU] ...") ou pelo fim do nome do canal ("_ru", "_en", "br"). */
export function streamLanguage(channel, title) {
  const tag = String(title || '').match(/\[(RU|EN|PT|BR|ES|CN|UA)\]/i)?.[1]?.toUpperCase();
  const fromName = String(channel || '').match(/(?:_|dota2?)(ru|en|br|pt|es|cn|ua)\d*$/i)?.[1]?.toUpperCase();
  const code = tag || fromName;
  if (!code) return null;
  return code === 'BR' || code === 'PT' ? 'pt-BR' : code.toLowerCase();
}

// Nome do time aparece no título? Aceita sem o "Team " da frente ("Team Synapse" → "synapse").
function teamInTitle(team, titleNorm) {
  const n = norm(team);
  if (n.length >= 3 && titleNorm.includes(n)) return true;
  const short = norm(String(team || '').replace(/^team\s+/i, ''));
  return short.length >= 4 && titleNorm.includes(short);
}

/** Partida que o título da transmissão anuncia (os dois times valem mais que um). */
export function matchForTitle(title, matches) {
  const t = norm(title);
  if (!t) return null;
  let best = null;
  let bestScore = 0;
  for (const m of matches || []) {
    const score = (teamInTitle(m.timeA, t) ? 1 : 0) + (teamInTitle(m.timeB, t) ? 1 : 0);
    if (score > bestScore) { best = m; bestScore = score; }
  }
  return best;
}
