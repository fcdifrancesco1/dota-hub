import { test } from 'node:test';
import assert from 'node:assert/strict';
import { channelFromStreamUrl, streamChannelsFromPage, parseTwitchPage, parseYoutubeLive, youtubeChannelId, parseYoutubeFeed, parseKickChannel, kickSlugCandidates, youtubePathFromName, streamLanguage, matchForTitle } from '../api/_lib/matchStreams.js';

test('nome do stream da Liquipedia vira canal', () => {
  assert.deepEqual(channelFromStreamUrl('https://liquipedia.net/dota2/Special:Stream/twitch/EPC_EN'), { platform: 'twitch', channel: 'epc_en' });
  assert.equal(channelFromStreamUrl('https://liquipedia.net/dota2/Torneio'), null);
});

test('canais da Twitch, Kick e YouTube da página do campeonato, sem repetir', () => {
  const html = '<a href="https://www.twitch.tv/1win_dota">x</a><a href="https://www.twitch.tv/1win_dota_ru">y</a><a href="https://www.twitch.tv/1win_dota">z</a><a href="https://www.twitch.tv/videos/123/">v</a>'
    + '<a href="https://kick.com/epldota_en2">k</a><a href="https://www.youtube.com/ESLDota2/streams">y1</a><a href="https://www.youtube.com/@EPLDota/live">y2</a><a href="https://www.youtube.com/watch?v=abc">w</a>';
  assert.deepEqual(streamChannelsFromPage(html), [
    { platform: 'twitch', channel: '1win_dota' },
    { platform: 'twitch', channel: '1win_dota_ru' },
    { platform: 'kick', channel: 'epldota_en2' },
    { platform: 'youtube', channel: 'ESLDota2' },
    { platform: 'youtube', channel: '@EPLDota' }
  ]);
});

test('stream do YouTube da Liquipedia com vídeo, e nomes da Kick e do YouTube', () => {
  assert.deepEqual(channelFromStreamUrl('https://liquipedia.net/dota2/Special:Stream/youtube/ESL_Dota2/nlOP63nfkFM'), { platform: 'youtube', channel: 'esl_dota2', video: 'nlOP63nfkFM' });
  assert.ok(kickSlugCandidates('EPL_Dota_EN2').includes('epldota_en2'));
  assert.equal(youtubePathFromName('esl_dota2'), '@esldota2');
});

test('YouTube e Kick: ao vivo e título', () => {
  const yt = '<link rel="canonical" href="https://www.youtube.com/watch?v=E60k_Zzs4NE"><meta name="title" content="Froglings vs Insanity - DreamLeague"><script>{"isLiveNow":true}</script>';
  assert.deepEqual(parseYoutubeLive(yt), { live: true, videoId: 'E60k_Zzs4NE', title: 'Froglings vs Insanity - DreamLeague' });
  assert.equal(parseYoutubeLive('<link rel="canonical" href="https://www.youtube.com/@x">').live, false);
  assert.deepEqual(parseKickChannel({ livestream: { is_live: true, session_title: 'EPL | A vs B' } }), { live: true, title: 'EPL | A vs B' });
  assert.equal(parseKickChannel({ livestream: null }).live, false);
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

test('ID do canal do YouTube: o do próprio canal antes dos citados na página', () => {
  const own = 'UCAvIC2XmBLLXFPdveirTrmw';
  const other = 'UC-F4GLIh32rqi2868FGqZeg';
  assert.equal(youtubeChannelId('{"channelId":"' + own + '"} {"browseId":"' + other + '"}'), own);
  assert.equal(youtubeChannelId('{"channelId":"' + other + '"} {"externalId":"' + own + '"}'), own);
  assert.equal(youtubeChannelId('<html>consent.youtube.com</html>'), null);
});

test('feed RSS do YouTube: ID, título e data de cada vídeo, lives simultâneas incluídas', () => {
  const entry = (id, t, p) => '<entry><yt:videoId>' + id + '</yt:videoId><title>' + t + '</title><published>' + p + '</published></entry>';
  const xml = '<feed>' + entry('DbB3ddYBBsU', '[B] Day 3 - LEGION vs DO KONCA', '2026-11-21T21:53:25+00:00')
    + entry('JyCfpjXEknw', '[A] Day 3 - PARIVISION vs Liquid &amp; more', '2026-11-21T23:31:52+00:00') + '</feed>';
  const feed = parseYoutubeFeed(xml);
  assert.deepEqual(feed.map((v) => v.videoId), ['DbB3ddYBBsU', 'JyCfpjXEknw']);
  assert.equal(feed[1].title, '[A] Day 3 - PARIVISION vs Liquid & more');
  assert.equal(feed[0].published, Date.parse('2026-11-21T21:53:25Z'));
  assert.deepEqual(parseYoutubeFeed('<html>erro</html>'), []);
});

test('feed do YouTube: VOD de ontem com um time só e shorts não viram a live', () => {
  const entry = (id, title, link = 'watch?v=') => `<entry><yt:videoId>${id}</yt:videoId><title>${title}</title><link rel="alternate" href="https://www.youtube.com/${link}${id}"/><published>2026-11-22T10:00:00+00:00</published></entry>`;
  const feed = parseYoutubeFeed(entry('aaaaaaaaaaa', 'LEGION got baited', 'shorts/') + entry('bbbbbbbbbbb', '[A] Day 2 - Aurora vs Astra Invicta') + entry('ccccccccccc', '[B] Day 3 - LEGION vs DO KONCA, Astra Invicta vs LGD'));
  assert.deepEqual(feed.map((v) => v.short), [true, false, false]);
  const active = [{ timeA: 'LGD Gaming', timeB: 'Astra Invicta' }];
  assert.equal(matchForTitle(feed[1].title, active, 2), null);
  assert.equal(matchForTitle(feed[2].title, active, 2), active[0]);
});
