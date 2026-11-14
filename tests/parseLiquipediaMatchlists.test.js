import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLiquipediaMatchlists } from '../api/_lib/parseLiquipediaBrackets.js';

// Partida de uma lista da fase de grupos, no formato da Liquipedia (só o que o parser lê)
const match = (a, sa, b, sb, winner, ids, bo = 3) => `
<div class="brkts-matchlist-match brkts-match-has-details brkts-match-popup-wrapper">
  <div class="brkts-matchlist-cell brkts-matchlist-opponent${winner === 'a' ? ' brkts-matchlist-slot-winner' : ''} brkts-opponent-hover" aria-label="${a}"><div class="block-team"><span class="name">${a}</span></div></div>
  <div class="brkts-matchlist-cell brkts-matchlist-score brkts-opponent-hover" aria-label="${a}"><div class="brkts-matchlist-cell-content">${sa}</div></div>
  <div class="brkts-match-info-icon"></div>
  <div class="brkts-matchlist-cell brkts-matchlist-score brkts-opponent-hover" aria-label="${b}"><div class="brkts-matchlist-cell-content">${sb}</div></div>
  <div class="brkts-matchlist-cell brkts-matchlist-opponent${winner === 'b' ? ' brkts-matchlist-slot-winner' : ''} brkts-opponent-hover" aria-label="${b}"><div class="block-team"><span class="name">${b}</span></div></div>
  <div class="brkts-popup brkts-popup-container"><span data-timestamp="1794046200"></span><span class="match-info-header-scoreholder-lower">(Bo${bo})</span>
    ${ids.map((id) => `<a href="https://www.dotabuff.com/matches/${id}">DB</a>`).join('')}
  </div>
</div>`;

test('lê as partidas da fase de grupos com placar, vencedor, formato e mapas', () => {
  const html = `<div class="brkts-matchlist">${match('LGD Gaming', 2, 'LEGION', 0, 'a', ['901', '902'])}${match('Team Liquid', 1, 'LEGION', 0, null, ['903'])}</div>`;
  const list = parseLiquipediaMatchlists(html);
  assert.equal(list.length, 2);
  assert.deepEqual(list[0].opponents.map((o) => [o.name, o.score, o.winner]), [['LGD Gaming', '2', true], ['LEGION', '0', false]]);
  assert.deepEqual(list[0].matchIds, ['901', '902']);
  assert.equal(list[0].timestamp, 1794046200);
  assert.equal(list[0].bestOf, 3);
  // Série em andamento: 1-0 numa MD3, sem vencedor
  assert.deepEqual(list[1].opponents.map((o) => o.winner), [false, false]);
});
