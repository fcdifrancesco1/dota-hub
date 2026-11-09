import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLiquipediaStandings } from '../api/_lib/parseLiquipediaStandings.js';

// Linha no formato novo da Liquipedia (table2 standings-group; "_" vem como &#95;)
const row = (pos, team, status, match, game, logo = '') => `
<tr class="table2&#95;&#95;row--body" data-position-status="${status}">
  <td class="brkts-opponent-hover" aria-label="${team}"><div class="generic-label label--placement">${pos}</div></td>
  <td class="brkts-opponent-hover" aria-label="${team}"><div class="block-team"><span class="team-template-image-icon">${logo}</span><span class="name hidden-xs"><a title="${team}">${team}</a></span></div></td>
  <td aria-label="${team}" style="font-weight:bold">${match}</td><td aria-label="${team}">${game}</td><td>+2</td><td>1</td>
</tr>`;

const group = (name, rows) => `
<div class="mw-heading mw-heading3"><h3 id="${name}">${name}</h3></div>
<div class="table2 table2--generic standings-group"><div class="table2&#95;&#95;title">Standings</div>
<div class="table2&#95;&#95;container"><table class="table2&#95;&#95;table"><tbody>
<tr class="table2&#95;&#95;row--head"><th>#</th><th>Participant</th><th>Match</th><th>Game</th></tr>
${rows}
</tbody></table></div></div>`;

test('lê os grupos no formato novo (standings-group)', () => {
  const html = `<div class="mw-heading mw-heading2"><h2>Results</h2></div>` +
    group('Group A', row(1, 'Froglings', 'up', '2 - 0', '4 - 2') +
      row(2, 'CyberHero', 'down', '1 - 1', '3 - 3', '<img src="/commons/images/thumb/1/11/CyberHero_2025_darkmode.png/44px-CyberHero_2025_darkmode.png">')) +
    group('Group B', row(1, 'LEGION', 'up', '2 - 0', '4 - 1'));

  const tables = parseLiquipediaStandings(html);
  assert.equal(tables.length, 2);
  assert.deepEqual(tables.map((t) => [t.stage, t.group, t.title]), [['Results', 'Group A', 'Standings'], ['Results', 'Group B', 'Standings']]);
  const [first, second] = tables[0].rows;
  assert.deepEqual(
    { position: first.position, team: first.team, record: first.record, games: first.games, status: first.status },
    { position: 1, team: 'Froglings', record: '2-0', games: '4-2', status: 'up' }
  );
  assert.equal(second.status, 'down');
  assert.match(second.logo.dark, /^https:\/\/liquipedia\.net\/commons\/.*CyberHero/);
});
