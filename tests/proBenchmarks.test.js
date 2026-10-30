import { test } from 'node:test';
import assert from 'node:assert/strict';
import { percentile, performanceRating, topLabel, playerRow, statsFromMatchPlayers } from '../src/utils/proBenchmarks.js';

const row = (account_id, position, v) => ({
  account_id, position, games: 10,
  kills: v, deaths: 10 - v, assists: v, gpm: v * 100, xpm: v * 100, lh10: v * 10,
  dmg_min: v * 100, tower_min: v * 10, wards: v, kp: v * 10
});
// Posição 1: valores 1..9; o jogador 9 é o melhor em tudo
const rows = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((v) => row(v, 1, v));

test('percentil: maior é melhor, e em mortes menor é melhor', () => {
  assert.equal(percentile(rows, 1, 'gpm', 900), 94);
  assert.equal(percentile(rows, 1, 'gpm', 100), 6);
  assert.equal(percentile(rows, 1, 'deaths', 1), 94);
  assert.equal(percentile(rows, 2, 'gpm', 500), null);
});

test('nota: o melhor da posição fica no topo e o pior embaixo', () => {
  assert.ok(performanceRating(rows, 1, rows[8]).overall >= 90);
  assert.ok(performanceRating(rows, 1, rows[0]).overall <= 10);
  assert.equal(performanceRating(rows, 3, rows[0]), null);
  // Carry não tem a área Visão (peso 0)
  assert.ok(!performanceRating(rows, 1, rows[4]).areas.some((a) => a.id === 'vision'));
});

test('rótulo Top X% e linha do jogador', () => {
  assert.equal(topLabel(94), 'Top 6%');
  assert.equal(topLabel(100), 'Top 1%');
  assert.equal(playerRow([...rows, { ...row(9, 2, 1), games: 3 }], 9).position, 1);
});

test('médias por jogo a partir das partidas', () => {
  const s = statsFromMatchPlayers(
    [{ kills: 10, deaths: 2, assists: 5, gold_per_min: 600, xp_per_min: 700, last_hits: 300, hero_damage: 30000, tower_damage: 6000, obs_placed: 1, sen_placed: 1, duration: 3000 }],
    () => 30
  );
  assert.equal(s.kp, 50);
  assert.equal(s.lh10, 60);
  assert.equal(s.dmg_min, 600);
  assert.equal(s.wards, 2);
});
