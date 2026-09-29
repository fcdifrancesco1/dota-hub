import { fetchLiquipediaQuery } from './_lib/liquipediaClient.js';
import { parseTournamentList, parseInfobox, buildTournament } from './_lib/parseLiquipediaTournaments.js';

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
export default async function handler(req, res) {
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

    // 2. Ficha (infobox) de todos os campeonatos numa única consulta
    const pagesJson = await fetchLiquipediaQuery({
      prop: 'revisions', rvprop: 'content', rvslots: 'main', titles: entries.map((e) => e.page).join('|')
    }, { ttlMs: TTL });
    const contentOf = pagesContent(pagesJson);
    const tournaments = entries.map((e) => buildTournament(e, parseInfobox(contentOf(e.page))));

    // 3. URLs das imagens (banners e ícones) numa única consulta
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

    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
    return res.status(200).json(result);
  } catch (error) {
    console.error('[Tournaments API] Erro:', error.message);
    return res.status(200).json([]);
  }
}
