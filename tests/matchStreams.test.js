import { test } from 'node:test';
import assert from 'node:assert/strict';
import { channelFromStreamUrl, twitchChannelsFromPage, parseTwitchPage, streamLanguage, matchForTitle } from '../api/_lib/matchStreams.js';

test('nome do stream da Liquipedia vira canal', () => {
  assert.deepEqual(channelFromStreamUrl('https://liquipedia.net/dota2/Special:Stream/twitch/EPC_EN'), { platform: 'twitch', channel: 'epc_en' });
  assert.equal(channelFromStreamUrl('https://liquipedia.net/dota2/Torneio'), null);
});

test('canais da Twitch da página do campeonato, sem repetir', () => {
  const html = '<a href="https://www.twitch.tv/1win_dota">x</a><a href="https://www.twitch.tv/1win_dota_ru">y</a><a href="https://www.twitch.tv/1win_dota">z</a><a href="https://www.twitch.tv/videos/123/">v</a>';
  assert.deepEqual(twitchChannelsFromPage(html), ['1win_dota', '1win_dota_ru']);
});

test('página da Twitch: ao vivo e título sem o rodapé', () => {
  const html = '<meta name="description" content="1win Essence III | PARIVISION [0:0] DO KONCA | Bo3 | Streaming dota 2 for 900 viewers."><script>{"isLiveBroadcast":true}</script>';
  assert.deepEqual(parseTwitchPage(html), { live: true, title: '1win Essence III | PARIVISION [0:0] DO KONCA | Bo3 |' });
  assert.equal(parseTwitchPage('<meta name="description" content="Canal offline">').live, false);
});

test('idioma pelo título ou pelo nome do canal', () => {
  assert.equal(streamLanguage('asgard_championship', '[RU] InterActive Philippines vs Team Lynx'), 'ru');
  assert.equal(streamLanguage('1win_dota_ru', 'sem tag'), 'ru');
  assert.equal(streamLanguage('esl_dota2br', ''), 'pt-BR');
  assert.equal(streamLanguage('epc_en', ''), 'en');
  assert.equal(streamLanguage('esl_dota2', ''), null);
});

test('acha a partida pelo título da transmissão', () => {
  const matches = [
    { timeA: 'PARIVISION', timeB: 'DO KONCA' },
    { timeA: 'Potn9ki', timeB: 'Team Synapse' },
    { timeA: 'InterActive Philippines', timeB: 'Team Lynx' }
  ];
  assert.equal(matchForTitle('EPC S3 | potn9ki vs Team Synapse | BO3', matches), matches[1]);
  assert.equal(matchForTitle('[RU] InterActive Philippines vs Lynx', matches), matches[2]);
  assert.equal(matchForTitle('Analysis desk', matches), null);
});
