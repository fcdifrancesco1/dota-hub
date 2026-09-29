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
