// Teste da API GraphQL da STRATZ: mostra o que a chave consegue buscar.
// Uso: node scripts/stratz-test.mjs   (lê STRATZ_API_KEY do .env.local; a chave nunca é impressa)
import fs from 'node:fs';

function readKey() {
  if (process.env.STRATZ_API_KEY) return process.env.STRATZ_API_KEY.trim();
  for (const file of ['.env.local', '.env']) {
    if (!fs.existsSync(file)) continue;
    const line = fs.readFileSync(file, 'utf8').split(/\r?\n/).find((l) => l.startsWith('STRATZ_API_KEY='));
    if (line) return line.slice('STRATZ_API_KEY='.length).trim().replace(/^["']|["']$/g, '');
  }
  return null;
}

const KEY = readKey();
if (!KEY) {
  console.error('STRATZ_API_KEY não encontrada no .env.local');
  process.exit(1);
}

let lastLimits = {};
async function gql(label, query, variables = {}) {
  const started = Date.now();
  try {
    const res = await fetch('https://api.stratz.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'STRATZ_API'
      },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(20000)
    });
    lastLimits = Object.fromEntries([...res.headers].filter(([k]) => /ratelimit/i.test(k)));
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* resposta não-JSON */ }
    const ms = Date.now() - started;
    if (!res.ok || !json) {
      console.log(`\n### ${label} — HTTP ${res.status} (${ms} ms)\n${text.slice(0, 300)}`);
      return null;
    }
    if (json.errors?.length) console.log(`\n### ${label} — erros: ${json.errors.map((e) => e.message).join(' | ').slice(0, 400)}`);
    else console.log(`\n### ${label} — OK (${ms} ms)`);
    return json.data;
  } catch (err) {
    console.log(`\n### ${label} — falha: ${err.message}`);
    return null;
  }
}

const show = (obj) => console.log(JSON.stringify(obj, null, 1).slice(0, 2500));

// IDs reais já usados no site
const LEAGUE_ID = 19102; // BLAST SLAM VIII
const MATCH_ID = 9040578015; // final BLAST SLAM VIII, mapa 4
const TEAM_ID = 8291895; // Tundra Esports
const PLAYER_ID = 321580662; // Yatoro

// 1. Partidas ao vivo
const live = await gql('Partidas ao vivo', `{
  live { matches(request: { take: 10 }) {
    matchId gameTime delay leagueId radiantScore direScore
    radiantTeam { name } direTeam { name } league { displayName }
  } }
}`);
if (live) show(live.live?.matches);

// 2. Partida finalizada com posições, rede e impacto
const match = await gql('Detalhe de partida (final do BLAST)', `query ($id: Long!) {
  match(id: $id) {
    id didRadiantWin durationSeconds seriesId
    radiantTeam { name } direTeam { name }
    players { isRadiant position lane imp networth kills deaths assists
      steamAccount { name } hero { displayName } }
  }
}`, { id: MATCH_ID });
if (match) show(match.match);

// 3. Liga: dados e partidas
const league = await gql('Liga (BLAST SLAM VIII)', `query ($id: Int!) {
  league(id: $id) {
    id displayName tier prizePool startDateTime endDateTime
    matches(request: { take: 5, skip: 0 }) { id seriesId didRadiantWin radiantTeam { name } direTeam { name } }
  }
}`, { id: LEAGUE_ID });
if (league) show(league.league);

// 4. Time: elenco atual
const team = await gql('Time (Tundra)', `query ($id: Int!) {
  team(teamId: $id) {
    id name tag winCount lossCount
    members { player { steamAccount { name } } }
  }
}`, { id: TEAM_ID });
if (team) show(team.team);

// 5. Jogador: perfil e heróis mais jogados
const player = await gql('Jogador (Yatoro)', `query ($id: Long!) {
  player(steamAccountId: $id) {
    steamAccount { name proSteamAccount { name position } }
    matchCount winCount
    heroesPerformance(request: { take: 5 }) { heroId matchCount winCount imp }
  }
}`, { id: PLAYER_ID });
if (player) show(player.player);

console.log('\n### Limites informados pela API (última resposta):');
show(lastLimits);
