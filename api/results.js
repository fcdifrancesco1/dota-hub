import { SITE_NAME, SITE_URL, routeMeta } from '../src/utils/routeMeta.js';
import { saveSnapshot, respondWithSnapshot } from './_lib/snapshot.js';

function normalizeTeamKey(name) {
  if (!name) return "";
  return String(name)
    .toLowerCase()
    .replace(/\b(team|gaming|esports|esport|gg|club)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * GET /api/results?heroStats=1
 * Estatísticas de heróis da OpenDota com cache na CDN da Vercel: a resposta vale
 * 30 min e continua sendo servida por até 7 dias enquanto revalida, então a
 * página de heróis segue funcionando quando a OpenDota fica fora do ar.
 * Sem cópia na CDN (ex.: logo após um deploy), usa a última resposta salva no
 * Supabase; sem ela, responde 503 para não substituir a cópia boa em cache.
 */
async function handleHeroStats(res) {
  try {
    const r = await fetch('https://api.opendota.com/api/heroStats', {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(9000)
    });
    const list = r.ok ? await r.json() : null;
    if (!Array.isArray(list) || list.length === 0) throw new Error(`HTTP ${r.status}`);
    await saveSnapshot('heroStats', list);
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=604800');
    return res.status(200).json(list);
  } catch (err) {
    return respondWithSnapshot(res, 'heroStats', 'heroStats', err);
  }
}

// Posição de cada jogador nas partidas das ligas profissionais/premium dos últimos 30 dias: entre os 3 que mais
// farmaram no time, quem jogou na safe lane é pos 1, na mid pos 2 e na offlane
// pos 3; entre os 2 que menos farmaram, quem jogou na offlane é pos 4 e na safe
// lane pos 5. Jogos sem rota definida (jungle, roam) ficam de fora.
const HERO_POSITIONS_SQL = `
WITH p AS (
  SELECT pm.hero_id, pm.lane_role,
    RANK() OVER (PARTITION BY pm.match_id, (pm.player_slot < 128) ORDER BY pm.gold_per_min DESC) AS farm
  FROM matches m
  JOIN leagues l ON l.leagueid = m.leagueid AND l.tier IN ('premium', 'professional')
  JOIN player_matches pm ON pm.match_id = m.match_id
  WHERE m.start_time > extract(epoch from now()) - 30 * 86400
    AND pm.lane_role IN (1, 2, 3)
), pos AS (
  SELECT hero_id, CASE
    WHEN farm <= 3 AND lane_role = 1 THEN 1
    WHEN farm <= 3 AND lane_role = 2 THEN 2
    WHEN farm <= 3 AND lane_role = 3 THEN 3
    WHEN farm > 3 AND lane_role = 3 THEN 4
    WHEN farm > 3 AND lane_role = 1 THEN 5
  END AS position
  FROM p
)
SELECT hero_id, position, COUNT(*) AS games
FROM pos
WHERE position IS NOT NULL
GROUP BY hero_id, position`;

/**
 * GET /api/results?heroPositions=1
 * Em quais posições cada herói foi jogado nas partidas profissionais dos
 * últimos 30 dias (OpenDota Explorer). Cache de 12 h na CDN, servido por até
 * 7 dias enquanto revalida.
 */
async function handleHeroPositions(res) {
  try {
    const r = await fetch(`https://api.opendota.com/api/explorer?sql=${encodeURIComponent(HERO_POSITIONS_SQL)}`, {
      headers: { Accept: 'application/json' },
      // A consulta leva ~5 s, mas o Explorer pode demorar mais quando está carregado
      signal: AbortSignal.timeout(25000)
    });
    const data = r.ok ? await r.json() : null;
    const rows = Array.isArray(data?.rows) ? data.rows : [];
    if (!rows.length) throw new Error(data?.err || `HTTP ${r.status}`);
    const positions = rows.map((x) => ({ hero_id: Number(x.hero_id), position: Number(x.position), games: Number(x.games) }));
    await saveSnapshot('heroPositions', positions);
    res.setHeader('Cache-Control', 's-maxage=43200, stale-while-revalidate=604800');
    return res.status(200).json(positions);
  } catch (err) {
    return respondWithSnapshot(res, 'heroPositions', 'heroPositions', err);
  }
}

// Médias de cada profissional por posição nos últimos 90 dias (mín. 8 jogos):
// base do "Top X%", da nota de desempenho e da comparação entre jogadores.
// Posição pela rota + rank de farm no time, como em HERO_POSITIONS_SQL.
const PRO_BENCHMARKS_SQL = `
WITH p AS (
  SELECT pm.account_id, pm.lane_role, pm.kills, pm.deaths, pm.assists, pm.gold_per_min, pm.xp_per_min,
    pm.last_hits, pm.hero_damage, pm.tower_damage, pm.obs_placed, pm.sen_placed, m.duration,
    RANK() OVER (PARTITION BY pm.match_id, (pm.player_slot < 128) ORDER BY pm.gold_per_min DESC) AS farm,
    SUM(pm.kills) OVER (PARTITION BY pm.match_id, (pm.player_slot < 128)) AS team_kills
  FROM matches m
  JOIN leagues l ON l.leagueid = m.leagueid AND l.tier IN ('premium', 'professional')
  JOIN player_matches pm ON pm.match_id = m.match_id
  WHERE m.start_time > extract(epoch from now()) - 90 * 86400 AND pm.lane_role IN (1, 2, 3)
), pos AS (
  SELECT *, CASE
    WHEN farm <= 3 AND lane_role = 1 THEN 1 WHEN farm <= 3 AND lane_role = 2 THEN 2
    WHEN farm <= 3 AND lane_role = 3 THEN 3 WHEN farm > 3 AND lane_role = 3 THEN 4
    WHEN farm > 3 AND lane_role = 1 THEN 5 END AS position
  FROM p
)
SELECT position, account_id, COUNT(*) AS games,
  AVG(kills) AS kills, AVG(deaths) AS deaths, AVG(assists) AS assists,
  AVG(gold_per_min) AS gpm, AVG(xp_per_min) AS xpm,
  AVG(last_hits * 600.0 / NULLIF(duration, 0)) AS lh10,
  AVG(hero_damage * 60.0 / NULLIF(duration, 0)) AS dmg_min,
  AVG(tower_damage * 60.0 / NULLIF(duration, 0)) AS tower_min,
  AVG(COALESCE(obs_placed, 0) + COALESCE(sen_placed, 0)) AS wards,
  AVG((kills + assists) * 100.0 / NULLIF(team_kills, 0)) AS kp
FROM pos WHERE position IS NOT NULL AND account_id IS NOT NULL
GROUP BY position, account_id HAVING COUNT(*) >= 8`;

const BENCH_FIELDS = ['kills', 'deaths', 'assists', 'gpm', 'xpm', 'lh10', 'dmg_min', 'tower_min', 'wards', 'kp'];

/** GET /api/results?proBenchmarks=1 — ver PRO_BENCHMARKS_SQL. Cache de 12 h na CDN. */
async function handleProBenchmarks(res) {
  try {
    const rows = (await explorer(PRO_BENCHMARKS_SQL)).map((r) => {
      const row = { position: Number(r.position), account_id: Number(r.account_id), games: Number(r.games) };
      for (const k of BENCH_FIELDS) row[k] = Math.round(Number(r[k] || 0) * 10) / 10;
      return row;
    });
    if (!rows.length) throw new Error('sem linhas');
    await saveSnapshot('proBenchmarks', rows);
    res.setHeader('Cache-Control', 's-maxage=43200, stale-while-revalidate=604800');
    return res.status(200).json(rows);
  } catch (err) {
    return respondWithSnapshot(res, 'proBenchmarks', 'proBenchmarks', err);
  }
}

const explorer = async (sql) => {
  const r = await fetch(`https://api.opendota.com/api/explorer?sql=${encodeURIComponent(sql)}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(20000)
  });
  const data = r.ok ? await r.json() : null;
  if (!Array.isArray(data?.rows)) throw new Error(data?.err || `HTTP ${r.status}`);
  return data.rows;
};

const PRO_MATCHES = `FROM matches m
  JOIN leagues l ON l.leagueid = m.leagueid AND l.tier IN ('premium', 'professional')
  JOIN player_matches pm ON pm.match_id = m.match_id`;

/**
 * GET /api/results?heroDetail=<hero_id>
 * Itens e jogadores do herói nas partidas das ligas profissionais/premium:
 * - itens: 1ª compra de cada item nos últimos 180 dias (partidas analisadas,
 *   que têm o registro de compras), com vitórias e minuto médio da compra;
 * - jogadores: quem mais jogou o herói nos últimos 365 dias.
 * Só entram itens montados (com receita), sem consumíveis e sem os que são
 * peça de outro item (ex.: Yasha), exceto os caros (BKB, Butterfly…).
 */
async function handleHeroDetail(heroId, res) {
  try {
    const [itemRows, playerRows, itemsConst] = await Promise.all([
      explorer(`WITH b AS (
  SELECT pm.match_id, pm.player_slot, ((pm.player_slot < 128) = m.radiant_win) AS win,
    e->>'key' AS item, MIN((e->>'time')::int) AS t
  ${PRO_MATCHES}
  CROSS JOIN LATERAL unnest(pm.purchase_log) e
  WHERE pm.hero_id = ${heroId} AND m.start_time > extract(epoch from now()) - 180 * 86400
  GROUP BY 1, 2, 3, 4
)
SELECT item, COUNT(*) AS games, SUM(CASE WHEN win THEN 1 ELSE 0 END) AS wins, ROUND(AVG(t)) AS t,
  (SELECT COUNT(DISTINCT (match_id, player_slot)) FROM b) AS total
FROM b GROUP BY item ORDER BY games DESC LIMIT 80`),
      explorer(`SELECT pm.account_id, np.name, np.team_name, COUNT(*) AS games,
  SUM(CASE WHEN (pm.player_slot < 128) = m.radiant_win THEN 1 ELSE 0 END) AS wins
${PRO_MATCHES}
LEFT JOIN notable_players np ON np.account_id = pm.account_id
WHERE pm.hero_id = ${heroId} AND m.start_time > extract(epoch from now()) - 365 * 86400
GROUP BY 1, 2, 3 ORDER BY games DESC, wins DESC LIMIT 5`),
      fetch('https://api.opendota.com/api/constants/items', { signal: AbortSignal.timeout(9000) }).then((r) => (r.ok ? r.json() : {}))
    ]);

    const componentOf = new Set();
    Object.values(itemsConst || {}).forEach((it) => (it?.components || []).forEach((c) => componentOf.add(c)));
    const isCore = (key) => {
      const it = itemsConst?.[key];
      if (!it || !it.components?.length || it.qual === 'consumable') return false;
      if ((it.cost || 0) < 1200) return false;
      return !componentOf.has(key) || it.cost >= 3000;
    };

    const totalGames = Number(itemRows[0]?.total || 0);
    const items = itemRows
      .filter((x) => isCore(x.item))
      .slice(0, 6)
      .map((x) => ({
        key: x.item,
        name: itemsConst[x.item]?.dname || x.item,
        img: itemsConst[x.item]?.img ? `https://cdn.cloudflare.steamstatic.com${itemsConst[x.item].img}` : null,
        games: Number(x.games),
        wins: Number(x.wins),
        avgTime: Number(x.t)
      }));

    const players = playerRows.map((x) => ({
      account_id: Number(x.account_id),
      name: x.name || null,
      team_name: x.team_name || null,
      games: Number(x.games),
      wins: Number(x.wins)
    }));

    const detail = { totalGames, items, players };
    await saveSnapshot(`heroDetail:${heroId}`, detail);
    res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=604800');
    return res.status(200).json(detail);
  } catch (err) {
    return respondWithSnapshot(res, `heroDetail:${heroId}`, 'heroDetail', err);
  }
}

const OPENDOTA = 'https://api.opendota.com/api';
const STEAM_CDN = 'https://cdn.cloudflare.steamstatic.com';
const getJson = (url, ms = 3500) =>
  fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(ms) })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);

const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Nome do campeonato pelo endereço: ?p=PGL/Wallachia/9 ou o próprio slug (pgl-wallachia-9)
function tournamentNameFromUrl(slug, page) {
  const raw = page ? decodeURIComponent(page).replace(/[/_]/g, ' ') : decodeURIComponent(slug || '').replace(/-/g, ' ');
  return raw.replace(/\s+/g, ' ').trim().replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

/** Título, descrição e imagem de uma página do site, com o nome real do item quando dá. */
async function pageInfo(path, query) {
  const base = routeMeta(path);
  const [, section, rawId] = path.split('/');
  const id = rawId ? decodeURIComponent(rawId) : '';
  let { title, description } = base;
  let image = null;

  if (section === 'partidas' && /^\d+$/.test(id)) {
    const m = await getJson(`${OPENDOTA}/matches/${id}`);
    const a = m?.radiant_team?.name || m?.radiant_name;
    const b = m?.dire_team?.name || m?.dire_name;
    if (a && b) {
      title = `${a} vs ${b} · Resultado`;
      description = `Resultado, mapas, heróis e estatísticas de ${a} vs ${b}${m.league?.name?.trim() ? ` no ${m.league.name.trim()}` : ''}.`;
    }
  } else if (section === 'times' && id) {
    const t = /^\d+$/.test(id) ? await getJson(`${OPENDOTA}/teams/${id}`) : { name: id };
    if (t?.name) {
      title = t.name;
      description = `Elenco, resultados recentes e estatísticas do ${t.name} no Dota 2 profissional.`;
      image = t.logo_url || null;
    }
  } else if ((section === 'jogadores' || section === 'players') && /^\d+$/.test(id)) {
    const p = await getJson(`${OPENDOTA}/players/${id}`);
    const name = p?.profile?.name || p?.profile?.personaname;
    if (name) {
      title = name;
      description = `Títulos, heróis mais jogados e partidas recentes de ${name} no Dota 2 profissional.`;
      image = p.profile.avatarfull || null;
    }
  } else if (section === 'herois' && /^\d+$/.test(id)) {
    const heroes = await getJson(`${OPENDOTA}/constants/heroes`);
    const h = heroes?.[id];
    if (h?.localized_name) {
      title = h.localized_name;
      description = `Habilidades, itens mais comprados e especialistas de ${h.localized_name} nas partidas profissionais de Dota 2.`;
      image = h.img ? `${STEAM_CDN}${h.img.split('?')[0]}` : null;
    }
  } else if (section === 'campeonatos' && id) {
    const name = tournamentNameFromUrl(id, query.p);
    if (name) {
      title = name;
      description = `Partidas, chaveamento, equipes, jogadores e heróis do ${name}.`;
    }
  }
  return { title, description, image };
}

/**
 * GET /api/results?og=1&path=/partidas/123
 * Página só com as tags de prévia (título, descrição e imagem) para os robôs do
 * WhatsApp, Discord, Telegram, Facebook etc., que não executam JavaScript. O
 * vercel.json manda para cá apenas esses robôs; pessoas e buscadores recebem o site.
 */
async function handleOpenGraph(req, res) {
  const path = String(req.query.path || '/').split('?')[0] || '/';
  const { title, description, image } = await pageInfo(path, req.query);
  const fullTitle = title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} - Portal Competitivo de Dota 2`;
  const qs = req.query.p ? `?p=${encodeURIComponent(req.query.p)}` : '';
  const url = `${SITE_URL}${path}${qs}`;
  const img = image || `${SITE_URL}/aegis.png`;
  const html = `<!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="UTF-8" />
<title>${escapeHtml(fullTitle)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<link rel="canonical" href="${escapeHtml(url)}" />
<meta property="og:site_name" content="${SITE_NAME}" />
<meta property="og:locale" content="pt_BR" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${escapeHtml(fullTitle)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:url" content="${escapeHtml(url)}" />
<meta property="og:image" content="${escapeHtml(img)}" />
<meta name="twitter:card" content="${image ? 'summary' : 'summary_large_image'}" />
</head><body><h1>${escapeHtml(fullTitle)}</h1><p>${escapeHtml(description)}</p><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></body></html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).send(html);
}

/**
 * GET /sitemap.xml (reescrito para /api/results?sitemap=1)
 * Seções do site, todos os heróis e os times com melhor rating na OpenDota.
 */
async function handleSitemap(res) {
  const [heroes, teams] = await Promise.all([
    getJson(`${OPENDOTA}/constants/heroes`, 8000),
    getJson(`${OPENDOTA}/teams`, 8000)
  ]);
  const urls = [
    ['/', 'hourly', '1.0'],
    ['/ao-vivo', 'always', '0.9'],
    ['/partidas', 'hourly', '0.9'],
    ['/campeonatos', 'daily', '0.9'],
    ['/times', 'daily', '0.8'],
    ['/herois', 'daily', '0.8'],
    ...Object.keys(heroes || {}).map((hid) => [`/herois/${hid}`, 'weekly', '0.6']),
    ...(Array.isArray(teams) ? teams : []).slice(0, 100).map((t) => [`/times/${t.team_id}`, 'weekly', '0.6'])
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([loc, freq, prio]) => `  <url><loc>${SITE_URL}${loc}</loc><changefreq>${freq}</changefreq><priority>${prio}</priority></url>`).join('\n')}
</urlset>`;
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
  return res.status(200).send(xml);
}

export default async function handler(req, res) {
  if (req.query?.og) return handleOpenGraph(req, res);
  if (req.query?.sitemap) return handleSitemap(res);
  if (req.query?.heroStats) return handleHeroStats(res);
  if (req.query?.heroPositions) return handleHeroPositions(res);
  if (req.query?.proBenchmarks) return handleProBenchmarks(res);
  if (req.query?.heroDetail) {
    const heroId = parseInt(req.query.heroDetail, 10);
    if (!Number.isInteger(heroId) || heroId <= 0 || heroId > 1000) return res.status(400).json({ error: 'hero inválido' });
    return handleHeroDetail(heroId, res);
  }
  try {
    const proRes = await fetch("https://api.opendota.com/api/proMatches", {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(4000)
    });
    
    if (!proRes.ok) {
      return res.status(200).json({ series: [] });
    }

    const proMatches = await proRes.json();
    const rawList = (proMatches || []).slice(0, 120);
    const seriesClusters = [];

    rawList.forEach((m) => {
      const tA = normalizeTeamKey(m.radiant_name || m.radiant_team_id);
      const tB = normalizeTeamKey(m.dire_name || m.dire_team_id);
      const leagueId = m.leagueid;
      const matchTime = m.start_time;

      let cluster = seriesClusters.find(c => {
        const hasSameTeams = (c.teamAKey === tA && c.teamBKey === tB) || (c.teamAKey === tB && c.teamBKey === tA);
        const isSameLeague = !leagueId || !c.leagueId || leagueId === c.leagueId;
        const isNearInTime = Math.abs(c.baseTime - matchTime) < (8 * 3600);
        return hasSameTeams && isSameLeague && isNearInTime;
      });

      if (!cluster) {
        cluster = {
          teamAKey: tA,
          teamBKey: tB,
          leagueId,
          leagueName: m.league_name,
          baseTime: matchTime,
          preferredNameA: m.radiant_name || "Time A",
          preferredNameB: m.dire_name || "Time B",
          preferredIdA: m.radiant_team_id,
          preferredIdB: m.dire_team_id,
          games: []
        };
        seriesClusters.push(cluster);
      }

      cluster.games.push(m);
    });

    const completedSeries = [];

    seriesClusters.forEach((cluster) => {
      const games = cluster.games;
      games.sort((a, b) => a.start_time - b.start_time);
      
      const teamAName = cluster.preferredNameA;
      const teamBName = cluster.preferredNameB;
      const teamAId = cluster.preferredIdA;
      const teamAKey = cluster.teamAKey;

      let scoreA = 0;
      let scoreB = 0;

      games.forEach((g) => {
        const radWon = g.radiant_win;
        const radKey = normalizeTeamKey(g.radiant_name || g.radiant_team_id);
        const isRadTeamA = (g.radiant_team_id && g.radiant_team_id === teamAId) || (radKey === teamAKey);

        if (isRadTeamA) {
          if (radWon) scoreA++; else scoreB++;
        } else {
          if (radWon) scoreB++; else scoreA++;
        }
      });

      const isFinished = (scoreA >= 2 || scoreB >= 2) || (games.length >= 2 && scoreA !== scoreB);
      if (!isFinished) return;

      const winner = scoreA > scoreB ? teamAName : teamBName;

      completedSeries.push({
        stage: cluster.leagueName || "Torneio Profissional",
        timeA: teamAName,
        timeB: teamBName,
        scoreA,
        scoreB,
        winner,
        dur: `${games.length} mapa${games.length > 1 ? 's' : ''}`,
        games: games.map((g, idx) => ({
          mapNumber: idx + 1,
          match_id: String(g.match_id)
        }))
      });
    });

    // Cache de 2 minutos na CDN da Vercel
    res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");
    return res.status(200).json({ series: completedSeries.slice(0, 10) });
  } catch (error) {
    return res.status(500).json({ error: error.message, series: [] });
  }
}