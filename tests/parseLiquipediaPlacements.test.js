import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLiquipediaPlacements } from '../api/_lib/parseLiquipediaStandings.js';

// Trecho da tabela "Prize Pool" no formato da Liquipedia (só o que o parser lê)
const team = (name, short) => `<td class="prizepooltable-col-team"><div class="block-team"><span class="team-template-image-icon"><img src="/commons/images/${short}.png"></span><span class="name"><a href="/dota2/${name}" title="${name}">${short}</a></span></div></td>`;
const tbd = '<td class="prizepooltable-col-team"><div class="block-team"><span class="name">TBD</span></div></td>';
const html = `<table class="table2&#95;&#95;table prizepooltable prizepooltable-placement"><tbody>
<tr class="table2&#95;&#95;row--head"><th>Place</th><th>Participant</th></tr>
<tr class="table2&#95;&#95;row--body"><td class="prizepooltable-place" rowspan="1"><span class="prizepooltable-badge placement-1">1</span></td>${team('Team Yandex', 'Yandex')}<td data-align="right">$270,000</td></tr>
<tr class="table2&#95;&#95;row--body"><td class="prizepooltable-place" rowspan="2">5&#45;6</td>${team('LGD Gaming', 'LGD')}<td data-align="right" rowspan="2">$35,500</td></tr>
<tr class="table2&#95;&#95;row--body">${team('1w Team', '1w')}</tr>
<tr class="table2&#95;&#95;row--body"><td class="prizepooltable-place" rowspan="1">7</td>${tbd}<td data-align="right">&#45;</td></tr>
</tbody></table>`;

test('colocação final com empates, premiação e sem vagas TBD', () => {
  const list = parseLiquipediaPlacements(html);
  assert.deepEqual(list.map((p) => [p.place, p.placeStart, p.name, p.prize]), [
    ['1', 1, 'Team Yandex', '$270,000'],
    ['5-6', 5, 'LGD Gaming', '$35,500'],
    ['5-6', 5, '1w Team', '$35,500']
  ]);
  assert.ok(list[0].logo.dark.endsWith('/commons/images/Yandex.png'));
  assert.deepEqual(parseLiquipediaPlacements('<div>sem tabela</div>'), []);
});
