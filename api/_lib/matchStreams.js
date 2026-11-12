// Descobre em qual canal cada partida está passando. A agenda da Liquipedia só
// dá um nome de stream ("Special:Stream/twitch/Asgard_Championship_EN"), que nem
// sempre é o canal de verdade; a página do campeonato lista os canais reais.
// A própria Twitch diz se o canal está ao vivo e o título da transmissão, que
// costuma trazer os times ("1win Essence III | PARIVISION [0:0] DO KONCA").

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

/** "https://liquipedia.net/dota2/Special:Stream/twitch/EPC_EN" → { platform: 'twitch', channel: 'epc_en' } */
export function channelFromStreamUrl(url) {
  const m = String(url || '').match(/Special:Stream\/(twitch|kick|youtube)\/([^/?#"]+)/i);
  if (!m) return null;
  return { platform: m[1].toLowerCase(), channel: decodeURIComponent(m[2]).replace(/ /g, '_').toLowerCase() };
}

/** Canais da Twitch citados numa página de campeonato (infobox e seção de transmissões). */
export function twitchChannelsFromPage(html) {
  const out = [];
  for (const m of String(html || '').matchAll(/href="https?:\/\/(?:www\.)?twitch\.tv\/([a-z0-9_]{3,25})\/?"/gi)) {
    const ch = m[1].toLowerCase();
    if (!out.includes(ch)) out.push(ch);
  }
  return out;
}

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
