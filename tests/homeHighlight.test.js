import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickHomeHighlight } from '../src/utils/tournamentFormat.js';

const essence = { name: '1win Essence III', page: '1win_Essence/3', status: 'ongoing', leagueId: 1, tier: 1, prizePoolUsd: 200000 };
const slam = { name: 'BLAST SLAM IX', page: 'BLAST/SLAM/9', status: 'upcoming', leagueId: 2, tier: 1, prizePoolUsd: 1000000 };
const now = 1_000_000_000_000;
const match = (page, h, extra = {}) => ({ tournamentPage: page, timeA: 'A', timeB: 'B', timestamp: now / 1000 + h * 3600, ...extra });

test('a partida em destaque é do torneio em destaque', () => {
  const slamMatch = match('BLAST/SLAM/9', 1);
  const essenceMatch = match('1win_Essence/3', 5);
  const h = pickHomeHighlight([slamMatch, essenceMatch], [essence, slam], now);
  assert.equal(h.tournament, essence);
  assert.equal(h.match, essenceMatch);
});

test('sem jogo do torneio em destaque, o destaque vira o campeonato da partida', () => {
  const slamMatch = match('BLAST/SLAM/9', 1);
  const h = pickHomeHighlight([slamMatch], [essence, slam], now);
  assert.equal(h.tournament, slam);
  assert.equal(h.match, slamMatch);
});

test('partida de campeonato desconhecido não aparece ao lado do destaque', () => {
  const h = pickHomeHighlight([match('Outro/1', 1, { tourneyName: 'Liga X' })], [essence], now);
  assert.equal(h.tournament, essence);
  assert.equal(h.match, null);
});
