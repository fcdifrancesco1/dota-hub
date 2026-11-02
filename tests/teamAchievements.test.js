import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePlayerAchievements, parseTotalWinnings, summarizeAchievements } from '../api/player-achievements.js';

// Linhas da tabela de <Time>/Results na Liquipedia: a coluna de time é a do adversário
const opponent = '<td data-nowrap=""><div class="block-team"><span class="team-template-image-icon team-template-lightmode"><a href="/dota2/Team_Yandex" title="Team Yandex"><img alt="" src="/commons/images/thumb/9/9c/Team_Yandex_2026_lightmode.png/56px-Team_Yandex_2026_lightmode.png" /></a></span><span class="name"><a href="/dota2/Team_Yandex" title="Team Yandex">Yandex</a></span></div></td>';
const row = (date, place, n, name, slug, score, prize) => `<tr class="table2&#95;&#95;row--body"><td data-nowrap="">${date}</td><td data-align="center" data-nowrap="" data-sort-value="${n}"><span class="placement-box placement-${n}"><span class="placement-text">${place}</span></span></td><td data-nowrap="" data-sort-value="A1"><a href="/dota2/Tier_1_Tournaments" title="Tier 1 Tournaments">Tier 1</a></td><td data-nowrap="" data-sort-value="${name}"><span class="league-icon-small-image lightmode"><a href="/dota2/${slug}" title="${name}"><img alt="${name}" src="/commons/images/thumb/d/d9/${n}_allmode.png/50px-${n}_allmode.png" /></a></span></td><td data-nowrap="" data-sort-value="${name}"><a href="/dota2/${slug}" title="${slug}">${name}</a></td><td data-align="center" data-nowrap="">${score}</td>${opponent}<td data-align="right" data-nowrap="">${prize}</td></tr>`;
const html = `<table class="table2&#95;&#95;table sortable"><tbody>
<tr class="table2&#95;&#95;row--head"><th>Date</th><th>Place</th><th>Tier</th><th colspan="2">Tournament</th><th colspan="2">Result</th><th>Prize</th></tr>
${row('2026-11-01', '1st', 1, 'PARI Universe', 'PARI_Universe/1', '3&#160;&#58;&#160;0', '$125,000')}
${row('2026-10-11', '2nd', 2, 'BLAST SLAM VIII', 'BLAST/SLAM/8', '1&#160;&#58;&#160;3', '$135,000')}
</tbody></table>`;

test('lê as linhas da página de resultados do time', () => {
  const [first, second] = parsePlayerAchievements(html);
  assert.equal(first.tournament, 'PARI Universe');
  assert.equal(first.tourneySlug, 'PARI_Universe/1');
  assert.equal(first.date, '2026-11-01');
  assert.equal(first.tier, 'Tier 1');
  assert.equal(first.score, '3 : 0');
  assert.equal(first.opponent, 'Team Yandex');
  assert.equal(first.prize, '$125,000');
  assert.ok(first.isChampion);
  assert.ok(first.tournamentIcon.light.startsWith('https://liquipedia.net/'));
  assert.equal(second.isChampion, false);
  assert.ok(second.isPodium);
});

test('resumo: títulos, pódios e Tier 1', () => {
  const { totalChampionships, totalPodiums, tier1Titles, championships } = summarizeAchievements(parsePlayerAchievements(html));
  assert.deepEqual([totalChampionships, totalPodiums, tier1Titles], [1, 2, 1]);
  assert.equal(championships[0].tournament, 'PARI Universe');
});

test('premiação total: ficha do time (rótulo em <abbr>) e do jogador', () => {
  const team = '<div class="infobox-cell-2 infobox-description"><abbr title="Includes individual player winnings">Approx. Total Winnings</abbr>:</div><div>$33,439,429</div></div>';
  const player = '<div class="infobox-cell-2 infobox-description">Approx. Total Winnings:</div><div>$540,745</div>';
  assert.equal(parseTotalWinnings(team), 33439429);
  assert.equal(parseTotalWinnings(player), 540745);
  assert.equal(parseTotalWinnings(''), 0);
});
