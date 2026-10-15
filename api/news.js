// GET /api/news
// Notícias de Dota 2 (anúncios oficiais da Valve na Steam e blog do Dotabuff) e
// transferências recentes de jogadores (Liquipedia). Só título, resumo curto,
// imagem e link para a matéria original. Cache de 20 min na CDN da Vercel.
import { fetchLiquipediaApi } from './_lib/liquipediaClient.js';

const STEAM_NEWS = 'https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=570&count=15&maxlength=0&feeds=steam_community_announcements&format=json';
const DOTABUFF_RSS = 'https://www.dotabuff.com/blog.rss';
const SUMMARY_MAX = 220;

const decodeEntities = (s) => String(s || '')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&#39;|&#039;|&apos;/g, "'").replace(/&#160;|&nbsp;/g, ' ').replace(/&#95;/g, '_')
  .replace(/&amp;/g, '&');

/** Texto puro e curto (sem HTML nem BBCode da Steam). */
function summarize(text) {
  const plain = decodeEntities(text)
    .replace(/\[img[^\]]*\][\s\S]*?\[\/img\]/gi, ' ')
    .replace(/\[\/?[^\]]+\]/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > SUMMARY_MAX ? `${plain.slice(0, SUMMARY_MAX).replace(/\s+\S*$/, '')}…` : plain;
}

async function steamNews() {
  const r = await fetch(STEAM_NEWS, { signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`Steam HTTP ${r.status}`);
  const items = (await r.json())?.appnews?.newsitems || [];
  return items.map((n) => {
    const img = (n.contents || '').match(/\[img(?: src="([^"]+)")?\]([^[]*)\[\/img\]/i);
    const raw = img ? (img[1] || img[2]) : null;
    const image = raw ? raw.replace(/\{STEAM_CLAN(?:_LOC)?_IMAGE\}/, 'https://clan.akamai.steamstatic.com/images').trim() : null;
    return {
      id: `steam-${n.gid}`,
      source: 'Valve',
      title: decodeEntities(n.title),
      summary: summarize(n.contents),
      url: `https://store.steampowered.com/news/app/570/view/${n.gid}`,
      image: image && image.startsWith('https://') ? image : null,
      date: n.date * 1000
    };
  });
}

async function dotabuffNews() {
  const r = await fetch(DOTABUFF_RSS, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DotaHubBrasil/1.0; +https://dota.hangover.com.br)' },
    signal: AbortSignal.timeout(8000)
  });
  if (!r.ok) throw new Error(`Dotabuff HTTP ${r.status}`);
  const xml = await r.text();
  const tag = (block, name) => (block.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`)) || [])[1] || '';
  return xml.split('<item>').slice(1).map((block) => {
    const url = decodeEntities(tag(block, 'link')).trim();
    const image = decodeEntities(tag(block, 'dotabuff:image')).trim();
    return {
      id: `dotabuff-${url}`,
      source: 'Dotabuff',
      title: decodeEntities(tag(block, 'title')).trim(),
      summary: summarize(tag(block, 'description')),
      url,
      image: image ? (image.startsWith('http') ? image : `https://www.dotabuff.com${image}`) : null,
      date: Date.parse(tag(block, 'pubDate')) || null
    };
  }).filter((n) => n.title && n.url.startsWith('https://'));
}

// ---- Transferências (Liquipedia: Portal:Transfers) ----

function cellOf(row, cls) {
  const i = row.indexOf(`divCell ${cls}`);
  if (i < 0) return '';
  const rest = row.slice(i);
  const next = rest.indexOf('<div class="divCell', 10);
  return next > 0 ? rest.slice(0, next) : rest;
}

const absolute = (src) => (src && !src.startsWith('http') ? `https://liquipedia.net${src}` : src);

function teamSide(cell) {
  const name = decodeEntities((cell.match(/data-highlighting-class="([^"]+)"/) || [])[1] || '') || null;
  const dark = cell.match(/team-template-darkmode"[\s\S]*?<img[^>]*src="([^"]+)"/);
  const any = cell.match(/team-template-image-icon[\s\S]*?<img[^>]*src="([^"]+)"/);
  const role = decodeEntities((cell.match(/font-size:85%">\(([^)]+)\)/) || [])[1] || '') || null;
  return { name, logo: absolute((dark || any || [])[1] || null), role };
}

function parseTransfers(html) {
  const rows = String(html || '').replace(/&#95;/g, '_').split(/<div class="divRow[^"]*"/).slice(1);
  return rows.map((row) => {
    const date = (row.match(/divCell Date">([^<]+)/) || [])[1] || null;
    const players = cellOf(row, 'Name').split('class="block-player"').slice(1).map((chunk) => {
      const name = (chunk.match(/<span class="name"[^>]*>(?:<a[^>]*>)?([^<]+)/) || [])[1];
      const country = (chunk.match(/<span class="flag"><img alt="([^"]*)"/) || [])[1];
      return name ? { name: decodeEntities(name).trim(), country: country ? decodeEntities(country) : null } : null;
    }).filter(Boolean);
    const ref = (cellOf(row, 'Ref').match(/href="(https:\/\/[^"]+)"/) || [])[1] || null;
    return { date, players, from: teamSide(cellOf(row, 'Team OldTeam')), to: teamSide(cellOf(row, 'Team NewTeam')), ref };
  }).filter((t) => t.date && t.players.length && (t.from.name || t.to.name));
}

async function transfers() {
  const parsed = await fetchLiquipediaApi('Portal:Transfers', { ttlMs: 30 * 60 * 1000 });
  return parseTransfers(parsed?.html).slice(0, 25);
}

export default async function handler(req, res) {
  const [steam, dotabuff, moves] = await Promise.allSettled([steamNews(), dotabuffNews(), transfers()]);
  for (const [label, r] of [['Steam', steam], ['Dotabuff', dotabuff], ['Transferências', moves]]) {
    if (r.status === 'rejected') console.warn(`[News API] ${label} indisponível:`, r.reason?.message);
  }
  const news = [...(steam.value || []), ...(dotabuff.value || [])]
    .filter((n) => n.date)
    .sort((a, b) => b.date - a.date)
    .slice(0, 20);
  const transfersList = moves.value || [];
  // Sem nada para mostrar: não deixa a CDN guardar uma resposta vazia
  res.setHeader('Cache-Control', news.length || transfersList.length
    ? 's-maxage=1200, stale-while-revalidate=86400'
    : 'no-store');
  return res.status(200).json({ news, transfers: transfersList });
}
