import { test } from 'node:test';
import assert from 'node:assert/strict';
import { playerSummary } from '../src/utils/playerSummary.js';

test('resumo completo do jogador', () => {
  assert.equal(
    playerSummary({ name: 'Topson', position: 2, team: 'OG', country: 'Finlândia', titles: 5, tier1: 2, prizeUsd: 5000000, heroes: ['Pugna', 'Void Spirit', 'Monkey King'], rating: { overall: 71, label: 'Acima da média' } }),
    'Topson joga de mid na OG (Finlândia). Soma 5 títulos (2 de Tier 1) e US$ 5.000.000 em premiação. Na carreira, os heróis mais jogados são Pugna, Void Spirit e Monkey King. Nos jogos oficiais dos últimos 90 dias, a nota é 71 (acima da média entre os profissionais da posição).'
  );
});

test('resumo sem posição, time nem títulos', () => {
  assert.equal(playerSummary({ name: 'X', heroes: ['Axe'] }), 'X é jogador profissional de Dota 2. Na carreira, os heróis mais jogados são Axe.');
  assert.equal(playerSummary({ name: '' }), '');
});
