// Parsers dos dados de campeonatos da Liquipedia (wikitext obtido via action=query).

const SECTION_STATUS = { upcoming: 'upcoming', ongoing: 'ongoing', completed: 'finished' };

/**
 * Lê a página "Liquipedia:Tournaments", que lista os campeonatos em seções:
 *   *Upcoming
 *   ** BLAST/SLAM/8 | BLAST SLAM VIII | icon= | iconfile=File:.. | icondarkfile=File:.. | startdate=Sep 29 | enddate=Oct 11
 */
export function parseTournamentList(wikitext) {
  const list = [];
  let status = null;
  for (const raw of String(wikitext || '').split('\n')) {
    const line = raw.trim();
    const section = line.match(/^\*\s*([A-Za-z]+)\s*$/);
    if (section) {
      status = SECTION_STATUS[section[1].toLowerCase()] || null;
      continue;
    }
    if (!status || !line.startsWith('**')) continue;

    const parts = line.replace(/^\*\*\s*/, '').split('|').map((p) => p.trim());
    const [page, shortName] = parts;
    if (!page) continue;
    const field = (key) => {
      const found = parts.find((p) => p.startsWith(`${key}=`));
      return found ? found.slice(key.length + 1).trim() : '';
    };
    list.push({
      page,
      shortName: shortName || page,
      status,
      iconFile: field('iconfile').replace(/^File:/, ''),
      iconDarkFile: field('icondarkfile').replace(/^File:/, '')
    });
  }
  return list;
}

/** Extrai os campos do {{Infobox league ...}} de uma página de campeonato. */
export function parseInfobox(wikitext) {
  const text = String(wikitext || '');
  const start = text.indexOf('{{Infobox league');
  if (start === -1) return null;

  // Acha o fechamento do template respeitando templates aninhados ({{...}})
  let depth = 0;
  let end = -1;
  for (let i = start; i < text.length - 1; i++) {
    if (text[i] === '{' && text[i + 1] === '{') { depth++; i++; continue; }
    if (text[i] === '}' && text[i + 1] === '}') { depth--; i++; if (depth === 0) { end = i + 1; break; } }
  }
  const body = text.slice(start, end === -1 ? undefined : end);

  const fields = {};
  for (const line of body.split('\n')) {
    const m = line.match(/^\|\s*([a-z0-9_]+)\s*=(.*)$/i);
    if (!m) continue;
    fields[m[1].toLowerCase()] = m[2]
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<br\s*\/?>/gi, ' · ')
      .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1')
      .replace(/'''?/g, '')
      .trim();
  }
  return fields;
}

const toNumber = (s) => {
  const n = Number(String(s || '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
};

const slugify = (page) => page.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** Monta o objeto de campeonato usado pelo front-end. */
export function buildTournament(entry, info) {
  const f = info || {};
  const location = [f.city, f.country2 || f.country].filter(Boolean).join(', ');
  const tierNum = parseInt(f.liquipediatier, 10);

  return {
    id: slugify(entry.page),
    page: entry.page,
    name: f.name || entry.shortName,
    shortName: entry.shortName,
    status: entry.status,
    startDate: /^\d{4}-\d{2}-\d{2}$/.test(f.sdate || '') ? f.sdate : null,
    endDate: /^\d{4}-\d{2}-\d{2}$/.test(f.edate || '') ? f.edate : null,
    tier: Number.isFinite(tierNum) ? tierNum : null,
    tierType: f.liquipediatiertype || null, // ex.: "Qualifier", "Showmatch"
    prizePoolUsd: toNumber(f.prizepoolusd),
    prizePoolLocal: f.prizepoolusd ? null : (toNumber(f.prizepool) ? { amount: toNumber(f.prizepool), currency: (f.localcurrency || '').toUpperCase() || null } : null),
    location: location || null,
    venue: f.venue || null,
    type: f.type || null, // Online / Offline / Online & Offline
    organizer: f.organizer || null,
    format: f.format || null,
    teamCount: toNumber(f.team_number),
    leagueId: toNumber(f.leagueid),
    imageFile: f.image || null,
    imageDarkFile: f.imagedark || null,
    iconFile: f.icon || entry.iconFile || null,
    iconDarkFile: f.icondark || entry.iconDarkFile || null,
    liquipediaUrl: `https://liquipedia.net/dota2/${entry.page}`
  };
}

const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const iso = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

/**
 * Datas da tabela de campeonatos da Liquipedia para ISO:
 *   "May 16, 2025" · "Dec 10–21, 2025" · "Nov 25 – Dec 07, 2025" · "Dec 28, 2025 – Jan 05, 2026"
 */
export function parseListingDates(text) {
  const s = String(text || '').replace(/&#160;|&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  const mon = (m) => MONTHS[String(m).slice(0, 3).toLowerCase()];
  let m = s.match(/^([A-Za-z]{3})\w* (\d{1,2}), (\d{4}) ?[–-] ?([A-Za-z]{3})\w* (\d{1,2}), (\d{4})$/);
  if (m) return { startDate: iso(m[3], mon(m[1]), m[2]), endDate: iso(m[6], mon(m[4]), m[5]) };
  m = s.match(/^([A-Za-z]{3})\w* (\d{1,2}) ?[–-] ?([A-Za-z]{3})\w* (\d{1,2}), (\d{4})$/);
  if (m) return { startDate: iso(m[5], mon(m[1]), m[2]), endDate: iso(m[5], mon(m[3]), m[4]) };
  m = s.match(/^([A-Za-z]{3})\w* (\d{1,2}) ?[–-] ?(\d{1,2}), (\d{4})$/);
  if (m) return { startDate: iso(m[4], mon(m[1]), m[2]), endDate: iso(m[4], mon(m[1]), m[3]) };
  m = s.match(/^([A-Za-z]{3})\w* (\d{1,2}), (\d{4})$/);
  if (m) return { startDate: iso(m[3], mon(m[1]), m[2]), endDate: iso(m[3], mon(m[1]), m[2]) };
  return { startDate: null, endDate: null };
}

const decode = (s) => String(s || '')
  .replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
  .replace(/&#160;|&nbsp;/g, ' ').replace(/&#95;/g, '_').trim();
const absolute = (src) => (src ? (src.startsWith('http') ? src : `https://liquipedia.net${src}`) : null);
const bestSrc = (imgTag) => {
  const x2 = imgTag.match(/srcset="[^"]*?,\s*([^\s"]+)\s+2x"/);
  const src = imgTag.match(/src="([^"]+)"/);
  return absolute(x2 ? x2[1] : src?.[1]);
};

/**
 * Tabela {{TournamentsList}} renderizada (histórico de campeonatos por ano e
 * tier): nome, página, datas, premiação, local, participantes, campeão e vice.
 */
export function parseTournamentsListing(html, tier) {
  const out = [];
  const tables = String(html || '').replace(/&#95;/g, '_').split('tournaments-listing').slice(1);
  for (const table of tables) {
    for (const row of table.split('table2__row--body').slice(1)) {
      const link = row.match(/class="column__tournament"[^>]*><a href="\/dota2\/([^"#]+)"[^>]*>([^<]+)<\/a>/);
      if (!link) continue;
      let page;
      try { page = decodeURIComponent(link[1]); } catch { page = link[1]; }
      page = page.replace(/_/g, ' ');
      const cells = row.split('<td').slice(1);
      const cellText = (i) => decode((cells[i] || '').replace(/^[^>]*>/, '').replace(/<[^>]+>/g, ' '));
      const { startDate, endDate } = parseListingDates(cellText(2));
      const icon = (mode) => {
        const span = row.match(new RegExp(`league-icon-small-image ${mode}"[\\s\\S]*?<\\/span>`));
        const img = span?.[0].match(/<img[^>]*>/);
        return img ? bestSrc(img[0]) : null;
      };
      const firstIcon = (() => { const img = (cells[0] || '').match(/<img[^>]*>/); return img ? bestSrc(img[0]) : null; })();
      const team = (cell) => {
        const name = (cell || '').match(/<span class="name"[^>]*>(?:<a[^>]*>)?([^<]+)/);
        const n = decode(name?.[1]);
        if (!n || n === 'TBD') return null;
        const img = (cell || '').match(/<img[^>]*>/);
        const logo = img ? bestSrc(img[0]) : null;
        return { name: n, logo: logo && !/Dota_2_default/i.test(logo) ? logo : null };
      };
      const prizeText = cellText(3);
      const prize = prizeText.startsWith('$') ? Number(prizeText.replace(/[^0-9.]/g, '')) || null : null;
      const teamCount = parseInt(cellText(5), 10);
      const light = icon('lightmode') || firstIcon;
      const dark = icon('darkmode') || light;
      out.push({
        id: slugify(page),
        page,
        name: decode(link[2]),
        shortName: decode(link[2]),
        startDate,
        endDate,
        tier,
        tierType: null,
        prizePoolUsd: prize,
        prizePoolLocal: null,
        location: cellText(4) || null,
        teamCount: Number.isFinite(teamCount) && teamCount > 0 ? teamCount : null,
        winner: team(cells[6]),
        runnerUp: team(cells[7]),
        image: { light: null, dark: null },
        icon: { light, dark },
        liquipediaUrl: `https://liquipedia.net/dota2/${page.replace(/ /g, '_')}`
      });
    }
  }
  return out;
}
