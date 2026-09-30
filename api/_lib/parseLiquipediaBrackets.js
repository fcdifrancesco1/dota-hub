// Lê os chaveamentos (brkts-bracket) do HTML renderizado de uma página de
// campeonato da Liquipedia e devolve uma árvore fácil de desenhar:
//
//   bracket = { stage, title, headers: [nomes das rodadas], roots: [node] }
//   node    = { match, children: [node | { header: [...] }], qualified: [...] }
//
// Na Liquipedia cada partida ("round-center") tem à esquerda ("round-lower") as
// partidas de onde vêm os dois times; o chaveamento inferior aparece como um
// ramo com o próprio cabeçalho de rodadas.

// Espaço de largura zero (U+200B) que a Liquipedia usa em vagas vazias
const ZERO_WIDTH = new RegExp('&#8203;|' + String.fromCharCode(8203), 'g');

const decode = (s) => String(s || '')
  .replace(/<[^>]+>/g, '')
  .replace(ZERO_WIDTH, '')
  .replace(/&amp;/g, '&')
  .replace(/&#39;|&#039;/g, "'")
  .replace(/&quot;/g, '"')
  .replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ')
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

function logos(html) {
  const mode = (m) => {
    const span = html.match(new RegExp(`class="[^"]*\\b(?:team-template-)?${m}"[\\s\\S]*?<\\/span>`));
    return span ? pickImg(span[0]) : null;
  };
  const any = pickImg(html);
  if (!any) return null;
  return { dark: mode('darkmode') || any, light: mode('lightmode') || any };
}

// Posição do </div> que fecha o <div> iniciado em `start`
function divEnd(html, start) {
  const re = /<div\b|<\/div>/g;
  re.lastIndex = start;
  let depth = 0;
  let m;
  while ((m = re.exec(html))) {
    depth += m[0] === '</div>' ? -1 : 1;
    if (depth === 0) return re.lastIndex;
  }
  return html.length;
}

// <div>s filhos diretos do trecho [from, to)
function childDivs(html, from, to) {
  const out = [];
  let i = from;
  while (i < to) {
    const open = html.indexOf('<div', i);
    if (open < 0 || open >= to) break;
    const end = divEnd(html, open);
    const tagEnd = html.indexOf('>', open) + 1;
    const cls = (html.slice(open, tagEnd).match(/class="([^"]*)"/) || [])[1] || '';
    out.push({ cls, outer: html.slice(open, end), innerStart: tagEnd, innerEnd: end - 6 });
    i = end;
  }
  return out;
}

const has = (cls, name) => new RegExp(`(^|\\s)${name}(\\s|$)`).test(cls);

// Nomes das rodadas; cada cabeçalho tem 3 opções (longa, média, curta)
function parseHeader(html, div) {
  return childDivs(html, div.innerStart, div.innerEnd)
    .filter((d) => has(d.cls, 'brkts-header'))
    .map((d) => {
      const opt = d.outer.match(/class="brkts-header-option"[^>]*>([\s\S]*?)<\/div>/);
      return decode(opt ? opt[1] : d.outer);
    });
}

function parseOpponent(entryHtml) {
  const left = entryHtml.match(/class="brkts-opponent-entry-left[^"]*"[\s\S]*?(?=<div class="brkts-opponent-score-outer|$)/)?.[0] || entryHtml;
  const teamName = entryHtml.match(/data-team-name="([^"]*)"/)?.[1];
  const shortName = entryHtml.match(/data-team-shortname="([^"]*)"/)?.[1];
  const literal = decode(entryHtml.match(/brkts-opponent-block-literal[^>]*>([\s\S]*?)<\/div>/)?.[1]);
  const scoreText = decode(entryHtml.match(/brkts-opponent-score-inner[^>]*>([\s\S]*?)<\/div>/)?.[1]);
  const name = decode(teamName) || null;
  return {
    name,
    shortName: decode(shortName) || null,
    placeholder: name ? null : (literal || null), // ex.: "Group D 1st"
    logo: name ? logos(left) : null,
    score: scoreText === '' ? null : scoreText,
    winner: /brkts-opponent-win/.test(entryHtml)
  };
}

function parseMatch(html, div) {
  const matchDiv = childDivs(html, div.innerStart, div.innerEnd).find((d) => has(d.cls, 'brkts-match'));
  if (!matchDiv) return null;
  const parts = childDivs(html, matchDiv.innerStart, matchDiv.innerEnd);
  const opponents = parts.filter((d) => has(d.cls, 'brkts-opponent-entry')).map((d) => parseOpponent(d.outer));
  const popup = parts.find((d) => has(d.cls, 'brkts-popup'))?.outer || '';
  const timestamp = Number(popup.match(/data-timestamp="(\d+)"/)?.[1]) || null;
  const matchIds = [...new Set([...popup.matchAll(/(?:dotabuff|opendota|stratz)\.com\/matches\/(\d+)/g)].map((m) => m[1]))];
  return { opponents, timestamp, matchIds };
}

function parseQualified(html, div) {
  return childDivs(html, div.innerStart, div.innerEnd)
    .filter((d) => has(d.cls, 'brkts-qualified'))
    .map((d) => parseOpponent(d.outer));
}

function parseBody(html, div) {
  const node = { match: null, children: [], qualified: [] };
  for (const part of childDivs(html, div.innerStart, div.innerEnd)) {
    if (has(part.cls, 'brkts-round-lower')) {
      for (const child of childDivs(html, part.innerStart, part.innerEnd)) {
        if (has(child.cls, 'brkts-round-body')) node.children.push(parseBody(html, child));
        else if (has(child.cls, 'brkts-round-header')) node.children.push({ header: parseHeader(html, child) });
      }
    } else if (has(part.cls, 'brkts-round-center')) {
      node.match = parseMatch(html, part);
    } else if (has(part.cls, 'brkts-round-qual')) {
      node.qualified = parseQualified(html, part);
    }
  }
  return node;
}

/**
 * Retorna [{ stage, title, headers, roots }] na ordem da página. Um chaveamento
 * pode ter várias partidas independentes (ex.: duas "Seeding Matches").
 * `stage`/`title` vêm dos cabeçalhos h2/h3 anteriores ao chaveamento.
 */
export function parseLiquipediaBrackets(html) {
  if (!html) return [];
  const brackets = [];
  const re = /<h([23])[^>]*>([\s\S]*?)<\/h\1>|<div class="brkts-bracket-wrapper/g;
  let stage = null;
  let title = null;
  let m;
  while ((m = re.exec(html))) {
    if (m[1] === '2') { stage = decode(m[2]); title = null; continue; }
    if (m[1] === '3') { title = decode(m[2]); continue; }
    const start = m.index;
    const wrapper = { innerStart: html.indexOf('>', start) + 1, innerEnd: divEnd(html, start) - 6 };
    const bracketDiv = childDivs(html, wrapper.innerStart, wrapper.innerEnd).find((d) => has(d.cls, 'brkts-bracket'));
    if (!bracketDiv) continue;
    let headers = [];
    const roots = [];
    for (const part of childDivs(html, bracketDiv.innerStart, bracketDiv.innerEnd)) {
      if (has(part.cls, 'brkts-round-header')) headers = parseHeader(html, part);
      else if (has(part.cls, 'brkts-round-body')) roots.push(parseBody(html, part));
    }
    if (roots.length) brackets.push({ stage, title, headers, roots });
    re.lastIndex = wrapper.innerEnd;
  }
  return brackets;
}
