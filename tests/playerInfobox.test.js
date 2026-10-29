import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePlayerTeam, parsePlayerRole } from '../api/player-achievements.js';

// Trecho da ficha (infobox) de um jogador na Liquipedia
const infobox = (teamRow) => `
<div><div class="infobox-cell-2 infobox-description">Nationality:</div><div><span class="flag"><a href="/dota2/Category:Finland" title="Finland"></a></span>&#160;<a href="/dota2/Category:Finland" title="Category:Finland">Finland</a></div></div>
${teamRow}
<div><div class="infobox-cell-2 infobox-description">Role:</div><div><a href="/dota2/Category:Solo_middle_players" title="Category:Solo middle players">Solo Middle</a></div></div>`;

test('lê o time atual da ficha', () => {
  const html = infobox('<div><div class="infobox-cell-2 infobox-description">Team:</div><div><a href="/dota2/OG" title="OG">OG</a></div></div>');
  assert.equal(parsePlayerTeam(html), 'OG');
});

test('jogador sem time: null, sem pegar o link de outra linha', () => {
  assert.equal(parsePlayerTeam(infobox('')), null);
});

test('a linha "Role:" (singular) continua dando a posição', () => {
  assert.deepEqual(parsePlayerRole(infobox('')), { role: 'Solo Middle', position: 2 });
});
