import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLiquipediaMatches } from '../api/_lib/parseLiquipediaMatches.js';
import { wikiScore } from '../src/utils/seriesStatus.js';

// Bloco no formato do HTML da "Liquipedia:Matches" (só o que o parser lê)
const block = ({ a, b, scoreA, scoreB, winner, fmt = 'Bo3' }) => `
<div class="match-info"><span data-timestamp="1793199600"></span>
  <div class="match-info-header-opponent match-info-header-opponent-left${winner === 'a' ? ' match-info-header-winner' : ''}">
    <span class="name"><a href="/dota2/${a}" title="${a}">${a}</a></span>
  </div>
  <div class="match-info-header-scoreholder"><span class="match-info-header-scoreholder-score">${scoreA}</span><span class="match-info-header-scoreholder-divider">:</span><span class="match-info-header-scoreholder-score">${scoreB}</span><span>(${fmt})</span></div>
  <div class="match-info-header-opponent${winner === 'b' ? ' match-info-header-winner' : ''}">
    <span class="name"><a href="/dota2/${b}" title="${b}">${b}</a></span>
  </div>
  <div class="match-info-tournament"><a href="/dota2/Esports_Pro_Circuit/3" title="Esports Pro Circuit/3"><span class="match-info-tournament-name"><span>EPC Season 3</span></span></a></div>
</div>`;

test('série encerrada com placar: lê placar, formato, vencedor e campeonato', () => {
  const [m] = parseLiquipediaMatches(block({ a: 'Team Spirit', b: 'OG', scoreA: 2, scoreB: 1, winner: 'a' }));
  assert.equal(m.timeA, 'Team Spirit');
  assert.equal(m.timeB, 'OG');
  assert.equal(m.scoreA, 2);
  assert.equal(m.scoreB, 1);
  assert.equal(m.formato, 'BO3');
  assert.equal(m.winner, 'Team Spirit');
  assert.equal(m.isCompleted, true);
  assert.equal(m.tournamentPage, 'Esports_Pro_Circuit/3');
  assert.equal(m.timestamp, 1793199600000);
});

test('vitória por W.O. ("W" e "FF"): encerrada, vencedor marcado e exibida como W - FF', () => {
  const [m] = parseLiquipediaMatches(block({ a: 'Angry birds', b: 'Roshan Hunters', scoreA: 'W', scoreB: 'FF', winner: 'a' }));
  assert.equal(m.isCompleted, true);
  assert.equal(m.winner, 'Angry birds');
  assert.deepEqual(wikiScore(m), { a: 'W', b: 'FF', winA: true, winB: false, walkover: true });
});

test('série que não começou: sem vencedor e não encerrada', () => {
  const [m] = parseLiquipediaMatches(block({ a: 'Team Spirit', b: 'OG', scoreA: 0, scoreB: 0, fmt: 'Bo1' }));
  assert.equal(m.formato, 'BO1');
  assert.equal(m.isCompleted, false);
  assert.equal(m.winner, null);
});
