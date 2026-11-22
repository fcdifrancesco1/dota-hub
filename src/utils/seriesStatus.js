/**
 * A série terminou? Pelo formato (MD1/MD3/MD5) quando conhecido. Uma série
 * incompleta só é considerada em andamento se o último mapa foi há menos de
 * 6h (séries antigas com dados incompletos continuam como finalizadas) e se
 * nenhum dos times já começou outra série depois dela.
 * Usado com as séries montadas a partir da OpenDota, que lista cada mapa assim
 * que termina — uma MD3 em 1x0 ainda não acabou.
 */
export function seriesStatus(series) {
  // Um dos times já começou outra série depois: esta acabou
  if (series?.closedByLaterSeries) return 'finished';
  const a = series?.scoreA || 0;
  const b = series?.scoreB || 0;
  const fmt = String(series?.formato || '').toUpperCase();
  const needed = { BO1: 1, BO3: 2, BO5: 3 }[fmt];
  let complete;
  if (fmt === 'BO2') complete = a + b >= 2;
  else if (needed) complete = Math.max(a, b) >= needed;
  else complete = true;
  const last = series?.lastMatchTime || series?.startTime || 0;
  const recent = last && (Date.now() / 1000 - last) < 6 * 3600;
  return complete || !recent ? 'finished' : 'ongoing';
}

export const isSeriesOngoing = (series) => seriesStatus(series) === 'ongoing';

/**
 * Placar de uma série da Liquipedia para exibir. Encerrada com vencedor e sem
 * mapas (vitória por W.O.): a Liquipedia mostra "W" e "FF" no lugar dos números.
 */
export function wikiScore(m) {
  const scoreA = m?.scoreA || 0;
  const scoreB = m?.scoreB || 0;
  if (m?.winner && scoreA + scoreB === 0) {
    const winA = m.winner === m.timeA;
    return { a: winA ? 'W' : 'FF', b: winA ? 'FF' : 'W', winA, winB: !winA, walkover: true };
  }
  return { a: scoreA, b: scoreB, winA: scoreA > scoreB, winB: scoreB > scoreA, walkover: false };
}

/** Formato pelo series_type da Valve: 0 = MD1, 1 = MD3, 2 = MD5 (não é o número de mapas). */
export const seriesTypeLabel = (type) => ['MD1', 'MD3', 'MD5'][type] || 'MD3';

/**
 * Placar da Liquipedia quando ela já registrou mais mapas que a OpenDota (que
 * costuma atrasar horas): a série 1x1 da OpenDota vira o 1x2 final, com os mapas que faltam.
 */
export function withWikiScore(s, bm, straight) {
  const a = Number(straight ? bm.a.score : bm.b.score);
  const b = Number(straight ? bm.b.score : bm.a.score);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a + b <= (s.scoreA || 0) + (s.scoreB || 0)) return s;
  const known = new Set((s.games || []).map((g) => String(g.match_id)));
  const extra = bm.idList.slice(0, a + b).filter((id) => !known.has(id));
  const games = [...(s.games || []), ...extra.map((id) => ({ match_id: id }))].map((g, i) => ({ ...g, mapNumber: i + 1 }));
  return {
    ...s,
    scoreA: a,
    scoreB: b,
    formato: bm.bestOf ? `BO${bm.bestOf}` : s.formato,
    games
  };
}

/** Partidas do chaveamento da Liquipedia com os IDs dos mapas (links de replay). */
export function bracketMatches(brackets) {
  const out = [];
  const walk = (node) => {
    if (!node) return;
    const m = node.match;
    if (m?.matchIds?.length && m.opponents?.length === 2 && m.opponents.every((o) => o?.name)) {
      out.push({ ids: new Set(m.matchIds.map(String)), idList: m.matchIds.map(String), a: m.opponents[0], b: m.opponents[1], timestamp: m.timestamp || null, bestOf: m.bestOf || null });
    }
    (node.children || []).forEach(walk);
  };
  for (const b of brackets || []) (b.roots || []).forEach(walk);
  return out;
}

/** "BO3" → "MD3" (o termo usado no site); sem formato, MD3. */
export const formatLabel = (f) => String(f || 'BO3').toUpperCase().replace(/^BO/, 'MD');

/**
 * Série que ainda não tem vencedor pelo formato (ex.: MD3 em 1-1). Depois de 6 horas o
 * seriesStatus a dá como encerrada, mas o placar está incompleto: a OpenDota não registrou
 * os últimos mapas. MD2 pode terminar empatada, então fica de fora.
 */
export function isIncompleteSeries(series) {
  const needed = { BO1: 1, BO3: 2, BO5: 3 }[String(series?.formato || '').toUpperCase()];
  return Boolean(needed) && Math.max(series?.scoreA || 0, series?.scoreB || 0) < needed;
}
