import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withWikiScore, seriesStatus } from '../src/utils/seriesStatus.js';

// Série da OpenDota com 2 mapas (1x1) e a partida da Liquipedia já com o 3º mapa (1x2)
const od = {
  timeA: 'Team Spirit', timeB: 'Xtreme Gaming', scoreA: 1, scoreB: 1, formato: 'BO3',
  lastMatchTime: Math.floor(Date.now() / 1000) - 3600,
  games: [{ match_id: '101', start_time: 1 }, { match_id: '102', start_time: 2 }]
};
const bm = { a: { name: 'Team Spirit', score: '1' }, b: { name: 'Xtreme Gaming', score: '2' }, idList: ['101', '102', '103'], bestOf: 3 };

test('Liquipedia com mais mapas: placar final e o mapa que faltava', () => {
  const s = withWikiScore(od, bm, true);
  assert.equal(s.scoreA, 1);
  assert.equal(s.scoreB, 2);
  assert.deepEqual(s.games.map((g) => [g.mapNumber, g.match_id]), [[1, '101'], [2, '102'], [3, '103']]);
  assert.equal(seriesStatus(s), 'finished');
  assert.equal(seriesStatus(od), 'ongoing');
});

test('lados trocados na Liquipedia: o placar segue o lado de cada time', () => {
  const swapped = { ...bm, a: bm.b, b: bm.a };
  const s = withWikiScore(od, swapped, false);
  assert.equal(s.scoreA, 1);
  assert.equal(s.scoreB, 2);
});

test('OpenDota igual ou à frente, ou W.O. na Liquipedia: mantém a série da OpenDota', () => {
  assert.equal(withWikiScore(od, { ...bm, b: { ...bm.b, score: '1' } }, true), od);
  assert.equal(withWikiScore(od, { ...bm, a: { ...bm.a, score: 'W' }, b: { ...bm.b, score: 'FF' } }, true), od);
});
