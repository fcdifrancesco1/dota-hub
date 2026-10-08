import { fetchLiquipediaQuery, fetchLiquipediaApi } from './_lib/liquipediaClient.js';
import { parseTournamentList, parseInfobox, buildTournament, parseTournamentsListing } from './_lib/parseLiquipediaTournaments.js';
import { parseLiquipediaStandings } from './_lib/parseLiquipediaStandings.js';
import { parseLiquipediaBrackets } from './_lib/parseLiquipediaBrackets.js';

const TTL = 30 * 60 * 1000;

function pagesContent(json) {
  const byTitle = {};
  for (const p of Object.values(json?.query?.pages || {})) {
    byTitle[p.title] = p.revisions?.[0]?.slots?.main?.['*'] || '';
  }
  // A API normaliza títulos (ex.: "BLAST/SLAM/8" continua igual, "a_b" vira "A b")
  const normalized = {};
  for (const n of json?.query?.normalized || []) normalized[n.from] = n.to;
  return (title) => byTitle[normalized[title] || title] ?? byTitle[title.replace(/_/g, ' ')] ?? '';
}

/**
 * GET /api/tournaments
 * Campeonatos atuais da Liquipedia (próximos, em andamento e encerrados
 * recentes) com banner, datas, local, premiação e tier reais.
 * São 3 consultas leves em lote à Liquipedia, com cache de 30 minutos.
 */
// Nome de página da Liquipedia (ex.: "BLAST/SLAM/8"); evita usar a rota como proxy genérico
const PAGE_RE = /^[\w ./()'&:+-]{1,120}$/;

/**
 * GET /api/tournaments?standings=<página>
 * Tabelas de classificação (fase de grupos) e chaveamentos do campeonato, já
 * com séries, mapas e vencedores calculados pela Liquipedia. Cache de 5 minutos.
 */
async function handleStandings(page, res) {
  if (!PAGE_RE.test(page)) return res.status(400).json({ error: 'Página inválida' });
  try {
    const parsed = await fetchLiquipediaApi(page, { ttlMs: 5 * 60 * 1000 });
    const html = parsed?.html || '';
    const tables = parseLiquipediaStandings(html);
    const brackets = parseLiquipediaBrackets(html);
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=900');
    return res.status(200).json({ page, tables, brackets });
  } catch (error) {
    console.error('[Tournaments API] Erro na classificação:', error.message);
    return res.status(200).json({ page, tables: [], brackets: [] });
  }
}

/** Completa os campeonatos com a ficha (infobox) e as URLs de banners e ícones. */
async function enrichEntries(entries) {
  // Ficha (infobox) de todos os campeonatos numa única consulta
  const pagesJson = await fetchLiquipediaQuery({
    prop: 'revisions', rvprop: 'content', rvslots: 'main', titles: entries.map((e) => e.page).join('|')
  }, { ttlMs: TTL });
  const contentOf = pagesContent(pagesJson);
  const tournaments = entries.map((e) => buildTournament(e, parseInfobox(contentOf(e.page))));

  // URLs das imagens (banners e ícones) numa única consulta
  const files = [...new Set(tournaments.flatMap((t) => [t.imageFile, t.imageDarkFile, t.iconFile, t.iconDarkFile]).filter(Boolean))];
  const urlOf = {};
  for (let i = 0; i < files.length; i += 50) {
    const imgJson = await fetchLiquipediaQuery({
      prop: 'imageinfo', iiprop: 'url', iiurlwidth: '640',
      titles: files.slice(i, i + 50).map((f) => `File:${f}`).join('|')
    }, { ttlMs: TTL });
    const normalized = {};
    for (const n of imgJson?.query?.normalized || []) normalized[n.to] = n.from;
    for (const p of Object.values(imgJson?.query?.pages || {})) {
      const info = p.imageinfo?.[0];
      if (!info) continue;
      const original = (normalized[p.title] || p.title).replace(/^File:/, '');
      urlOf[original] = info.thumburl || info.url;
      urlOf[p.title.replace(/^File:/, '')] = info.thumburl || info.url;
    }
  }

  const result = tournaments.map(({ imageFile, imageDarkFile, iconFile, iconDarkFile, ...t }) => ({
    ...t,
    image: { light: urlOf[imageFile] || urlOf[imageDarkFile] || null, dark: urlOf[imageDarkFile] || urlOf[imageFile] || null },
    icon: { light: urlOf[iconFile] || urlOf[iconDarkFile] || null, dark: urlOf[iconDarkFile] || urlOf[iconFile] || null }
  }));

  return result;
}

const YEAR_RE = /^\d{4}$/;
const FIRST_YEAR = 2011;

/**
 * GET /api/tournaments?archive=<ano>
 * Histórico permanente: campeonatos Tier 1 e Tier 2 encerrados no ano, com
 * campeão e vice, das tabelas "Tier 1/2 Tournaments" da Liquipedia.
 */
async function handleArchive(yearText, res) {
  const year = Number(yearText);
  const current = new Date().getUTCFullYear();
  if (!YEAR_RE.test(yearText) || year < FIRST_YEAR || year > current) {
    return res.status(400).json({ error: 'Ano inválido' });
  }
  const pastYear = year < current;
  try {
    const json = await fetchLiquipediaQuery({
      action: 'parse', prop: 'text', contentmodel: 'wikitext', disablelimitreport: '1',
      text: `{{TournamentsList|year=${year}|tier=1|tiertype=none}}{{TournamentsList|year=${year}|tier=2|tiertype=none}}`
    }, { ttlMs: pastYear ? 24 * 3600 * 1000 : 3 * 3600 * 1000 });
    const html = json?.parse?.text?.['*'] || '';
    // A primeira tabela é a do Tier 1 e a segunda, a do Tier 2
    const [tier1Html, ...rest] = html.split(/(?=<div class="table2 table2--generic tournaments-listing")/).filter((p) => p.includes('tournaments-listing'));
    const today = new Date().toISOString().slice(0, 10);
    const list = [
      ...parseTournamentsListing(tier1Html || '', 1),
      ...parseTournamentsListing(rest.join(''), 2)
    ]
      .filter((t) => t.endDate && t.endDate < today)
      .map((t) => ({ ...t, status: 'finished', archived: true }));
    res.setHeader('Cache-Control', pastYear ? 's-maxage=86400, stale-while-revalidate=604800' : 's-maxage=10800, stale-while-revalidate=86400');
    return res.status(200).json(list);
  } catch (error) {
    console.error('[Tournaments API] Erro no histórico:', error.message);
    return res.status(200).json([]);
  }
}

/**
 * GET /api/tournaments?page=<página>
 * Um campeonato qualquer da Liquipedia (ex.: do histórico), com a mesma ficha
 * completa da lista atual.
 */
async function handlePage(page, res) {
  if (!PAGE_RE.test(page)) return res.status(400).json({ error: 'Página inválida' });
  try {
    const [t] = await enrichEntries([{ page, shortName: page, status: 'finished' }]);
    if (!t || !t.startDate) return res.status(404).json({ error: 'Campeonato não encontrado' });
    const today = new Date().toISOString().slice(0, 10);
    t.status = t.endDate && t.endDate < today ? 'finished' : (t.startDate > today ? 'upcoming' : 'ongoing');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json(t);
  } catch (error) {
    console.error('[Tournaments API] Erro no campeonato:', error.message);
    return res.status(404).json({ error: 'Campeonato não encontrado' });
  }
}

export default async function handler(req, res) {
  if (req.query?.standings) return handleStandings(String(req.query.standings), res);
  if (req.query?.archive) return handleArchive(String(req.query.archive), res);
  if (req.query?.page) return handlePage(String(req.query.page), res);
  try {
    // 1. Lista de campeonatos por status
    const listJson = await fetchLiquipediaQuery({
      prop: 'revisions', rvprop: 'content', rvslots: 'main', titles: 'Liquipedia:Tournaments'
    }, { ttlMs: TTL });
    const listText = Object.values(listJson?.query?.pages || {})[0]?.revisions?.[0]?.slots?.main?.['*'] || '';
    const entries = parseTournamentList(listText).slice(0, 50);
    if (entries.length === 0) {
      return res.status(200).json([]);
    }

    const result = await enrichEntries(entries);

    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
    return res.status(200).json(result);
  } catch (error) {
    console.error('[Tournaments API] Erro:', error.message);
    return res.status(200).json([]);
  }
}
