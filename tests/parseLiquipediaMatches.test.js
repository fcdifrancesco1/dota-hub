import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLiquipediaMatches } from '../api/_lib/parseLiquipediaMatches.js';
import { wikiScore } from '../src/utils/seriesStatus.js';

// Cartão no formato do HTML da "Liquipedia:Matches" desde nov/2026 (só o que o parser lê)
const team = (name, score, won) => `<div class="match-ticker-card&#95;&#95;opponent${won ? ' winner' : ''}"><div class="block-team"><span class="team-template-image-icon"><a href="/dota2/${name}" title="${name}"><img alt="" src="/commons/images/${name}.png" /></a></span><span class="name team-name-dynamic"><a href="/dota2/${name}" title="${name}"><div class="team-shortname">${name.slice(0, 3)}</div><div class="team-bracketname">${name}</div><div class="team-name">${name}</div></a></span></div><div>${score}</div></div>`;
const block = ({ a, b, scoreA, scoreB, winner, fmt = 'Bo3', stream = '' }) => `<div class="match-ticker-card"><div class="match-ticker-card&#95;&#95;header"><span class="match-info-countdown"><span class="timer-object" data-timestamp="1793199600">Nov 1</span></span><div>November 1 - Playoffs - ${fmt}</div></div><div class="match-ticker-card&#95;&#95;opponents">${team(a, scoreA, winner === 'a')}${team(b, scoreB, winner === 'b')}</div><div class="match-ticker-card-tournament"><span class="match-ticker-card-tournament-wrapper"><span class="match-ticker-card-tournament-name"><a href="/dota2/Esports_Pro_Circuit/3#Playoffs" title="Esports Pro Circuit/3">EPC Season 3</a></span></span></div><div class="match-info-links">${stream}</div></div>`;

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

test('lê nome curto, logo e todas as transmissões da partida', () => {
  const stream = '<a href="/dota2/Special:Stream/twitch/ESL_Dota_2">x</a><a href="/dota2/Special:Stream/youtube/ESL_Dota2/UGYWrYZUjy0">y</a>';
  const [m] = parseLiquipediaMatches(block({ a: 'Team Spirit', b: 'OG', scoreA: '', scoreB: '', stream }));
  assert.equal(m.shortA, 'Tea');
  assert.equal(m.logoA, 'https://liquipedia.net/commons/images/Team Spirit.png');
  assert.equal(m.torneio, 'EPC Season 3');
  assert.deepEqual(m.streamUrls, [
    'https://liquipedia.net/dota2/Special:Stream/twitch/ESL_Dota_2',
    'https://liquipedia.net/dota2/Special:Stream/youtube/ESL_Dota2/UGYWrYZUjy0'
  ]);
});
