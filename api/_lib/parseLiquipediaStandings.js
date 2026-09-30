// Lê as tabelas de classificação (GroupTableLeague) do HTML renderizado de uma
// página de campeonato da Liquipedia. Os números (séries e mapas) são calculados
// pela própria Liquipedia na renderização — o wikitext só lista os times.

const decode = (s) => String(s || '')
  .replace(/<[^>]+>/g, '')
  .replace(/&amp;/g, '&')
  .replace(/&#39;|&#039;/g, "'")
  .replace(/&quot;/g, '"')
  .replace(/&nbsp;/g, ' ')
  .trim();

const absoluteUrl = (src) => (src.startsWith('http') ? src : `https://liquipedia.net${src}`);

function pickImg(html) {
  const img = html.match(/<img[^>]*>/);
  if (!img) return null;
  const srcset2x = img[0].match(/srcset="[^"]*?,\s*([^\s"]+)\s+2x"/);
  const src = img[0].match(/src="([^"]+)"/);
  const url = srcset2x ? srcset2x[1] : (src ? src[1] : null);
  if (!url || /Dota_2_default/i.test(url)) return null;
  return absoluteUrl(url);
}

// Logo do time: a Liquipedia manda variantes lightmode/darkmode ou uma única allmode
function teamLogos(cellHtml) {
  const mode = (m) => {
    // Nas tabelas a classe é "team-template-image-icon darkmode"; em outras páginas, "team-template-darkmode"
    const span = cellHtml.match(new RegExp(`class="[^"]*\\b(?:team-template-)?${m}"[\\s\\S]*?<\\/span>`));
    return span ? pickImg(span[0]) : null;
  };
  const any = pickImg(cellHtml);
  return { dark: mode('darkmode') || any, light: mode('lightmode') || any };
}

const STATUS_BY_BG = { up: 'up', stayup: 'up', stay: 'stay', down: 'down', staydown: 'down', drop: 'down' };

function parseTable(tableHtml) {
  const title = decode(tableHtml.match(/<th[^>]*>([\s\S]*?)<\/th>/)?.[1]) || null;
  const rows = [];

  for (const tr of tableHtml.match(/<tr[\s\S]*?<\/tr>/g) || []) {
    if (!/grouptableslot/.test(tr)) continue;
    const cells = tr.match(/<td[\s\S]*?<\/td>/g) || [];
    const slotIdx = cells.findIndex((c) => /grouptableslot/.test(c));
    if (slotIdx < 0) continue;

    const posCell = cells[slotIdx - 1] || '';
    const bg = (posCell.match(/class="bg-([a-z]+)"/) || tr.match(/class="bg-([a-z]+)"/) || [])[1] || null;
    const slot = cells[slotIdx];
    const name = decode(slot.match(/team-template-text"[^>]*>\s*<a[^>]*title="([^"]+)"/)?.[1])
      || decode(slot.match(/team-template-text"[^>]*>([\s\S]*?)<\/span>/)?.[1])
      || decode(slot);
    if (!name) continue;

    const stats = cells.slice(slotIdx + 1).map((c) => decode(c)).filter(Boolean);
    const record = stats.find((v) => /^\d+-\d+(-\d+)?$/.test(v)) || null;
    const games = stats.filter((v) => /^\d+-\d+(-\d+)?$/.test(v))[1] || null;

    rows.push({
      position: parseInt(decode(posCell), 10) || rows.length + 1,
      team: name,
      logo: teamLogos(slot),
      record,             // séries (V-D)
      games,              // mapas (V-D), quando a tabela mostra
      status: STATUS_BY_BG[bg] || null  // up = avança, down = eliminado/rebaixado
    });
  }
  return { title, rows };
}

/**
 * Retorna [{ stage, group, title, rows: [{ position, team, logo, record, games, status }] }]
 * na ordem em que aparecem na página.
 */
export function parseLiquipediaStandings(html) {
  if (!html) return [];
  const tables = [];
  // Percorre cabeçalhos (h2 = fase, h3 = grupo) e tabelas na ordem do documento
  const re = /<h([23])[^>]*>([\s\S]*?)<\/h\1>|<table[^>]*class="[^"]*\bgrouptable\b[^"]*"[\s\S]*?<\/table>/g;
  let stage = null;
  let group = null;
  let m;
  while ((m = re.exec(html))) {
    if (m[1] === '2') { stage = decode(m[2]); group = null; continue; }
    if (m[1] === '3') { group = decode(m[2]); continue; }
    const { title, rows } = parseTable(m[0]);
    if (rows.length) tables.push({ stage, group, title, rows });
  }
  return tables;
}
