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
