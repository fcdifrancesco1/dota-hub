import { fetchLiquipediaApi } from './_lib/liquipediaClient.js';

function cleanText(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, '').replace(/&#160;/g, ' ').replace(/&#58;/g, ':').trim();
}

export function parsePlayerAchievements(html) {
  if (!html) return [];
  const rows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
  const achievements = [];

  for (const row of rows) {
    if (!row.includes('placement-box') && !row.includes('placement-cell')) continue;

    const tds = row.match(/<td[^>]*>[\s\S]*?<\/td>/gi) || [];
    if (tds.length < 5) continue;

    // 1. Data (geralmente TD 0)
    const dateMatch = tds[0].match(/(\d{4}-\d{2}-\d{2})/);
    const date = dateMatch ? dateMatch[1] : '';

    // 2. Colocação (geralmente TD 1)
    const placeMatch = tds[1].match(/class="placement-text">([^<]+)<\/span>/i) ||
                       tds[1].match(/data-sort-value="(\d+)"/i) ||
                       tds[1].match(/<b>([^<]+)<\/b>/i);
    const placement = placeMatch ? placeMatch[1].trim() : '';
    if (!placement) continue;

    // 3. Tier (geralmente TD 2)
    const tierMatch = tds[2].match(/>(Tier\s+\d+|Tier\s+[A-Z0-9]+|Tier\s+1|Tier\s+2|Tier\s+3|Qualifier|Weekly|Monthly)[^<]*</i) ||
                      tds[2].match(/title="([^"]*Tournaments)"/i);
    let tier = 'Torneio';
    if (tierMatch) {
      tier = cleanText(tierMatch[1]).replace(/Tournaments/i, '').trim() || 'Tier 1';
    }

    // 4. Nome do Campeonato (geralmente TD 4 ou TD 3)
    let tournament = '';
    let tourneySlug = '';
    for (let i = 3; i <= Math.min(4, tds.length - 1); i++) {
      const tourneyLink = tds[i].match(/<a href="\/dota2\/([^"]+)"[^>]*>([^<]+)<\/a>/i);
      if (tourneyLink && !tourneyLink[1].includes('Tier_') && !tourneyLink[1].includes('Tournaments')) {
        tournament = cleanText(tourneyLink[2]);
        tourneySlug = tourneyLink[1];
        break;
      }
    }
    if (!tournament) {
      const fallbackM = row.match(/data-sort-value="([^"]+)"[^>]*><a href="\/dota2\/([^"]+)"/i);
      if (fallbackM && !fallbackM[1].startsWith('A') && !fallbackM[1].startsWith('Tier')) {
        tournament = fallbackM[1];
        tourneySlug = fallbackM[2];
      }
    }

    // 5. Time pelo qual disputou e venceu (geralmente TD 5 ou com classe 'flipped')
    let teamName = '';
    let teamLogo = null;
    const teamTd = tds.find(td => td.includes('block-team flipped')) || tds[5] || '';
    if (teamTd) {
      const nameM = teamTd.match(/title="([^"]+)"/i);
      teamName = nameM ? nameM[1] : cleanText(teamTd);
      const logoM = teamTd.match(/<img[^>]*src="([^"]+)"/i);
      if (logoM) {
        teamLogo = logoM[1].startsWith('http') ? logoM[1] : `https://liquipedia.net${logoM[1]}`;
      }
    }

    // 6. Placar e Adversário da Final
    let score = '';
    let opponent = '';
    if (tds.length >= 7) {
      const scoreTd = tds.find(td => td.includes('&#58;') || /data-align="center"[^>]*>[0-9\s:a-zA-Z\/-]+<\/td>/i.test(td));
      if (scoreTd) {
        score = cleanText(scoreTd);
      }
      const oppTd = tds.find((td, idx) => idx >= 6 && td.includes('block-team') && !td.includes('flipped'));
      if (oppTd) {
        const oppM = oppTd.match(/title="([^"]+)"/i);
        opponent = oppM ? oppM[1] : cleanText(oppTd);
      }
    }

    // 7. Premiação (USD)
    let prize = '';
    const prizeTd = tds.find(td => td.includes('$'));
    if (prizeTd) {
      const prizeM = prizeTd.match(/(\$[\d,]+)/);
      prize = prizeM ? prizeM[1] : cleanText(prizeTd);
    }

    const isChampion = /^1(?:st)?$/i.test(placement) || placement === '1';
    const isPodium = /^(1(?:st)?|2(?:nd)?|3(?:rd)?)$/i.test(placement);

    if (tournament) {
      achievements.push({
        date,
        placement,
        isChampion,
        isPodium,
        tier,
        tournament,
        tourneySlug,
        teamName: teamName || 'Equipe Profissional',
        teamLogo,
        score,
        opponent,
        prize
      });
    }
  }

  return achievements;
}

// Apelidos e mapeamento para páginas corretas na Liquipedia
const PLAYER_WIKI_MAP = {
  'raddan': 'Yatoro',
  'yatoro': 'Yatoro',
  'watson': 'Watson',
  'skiter': 'Skiter',
  'collapse': 'Collapse',
  'micke': 'MiCKe',
  'nightfall': 'Nightfall',
  'ame': 'Ame',
  'topson': 'Topson',
  'torontotokyo': 'TORONTOTOKYO',
  'pure': 'Pure~',
  'gpk': 'Gpk~',
  'save': 'Save-',
  'mira': 'Mira',
  'miposhka': 'Miposhka',
  'xinq': 'XinQ',
  'faith_bian': 'Bach',
  'bach': 'Bach',
  'dy': 'Dy',
  'bzm': 'Bzm',
  'ceb': 'Ceb',
  'notail': 'N0tail',
  'ana': 'Ana',
  'jerax': 'JerAx'
};

// Nome comparável: só letras latinas e números ("医者watson`" → "watson")
const norm = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g, '');

/**
 * Página do jogador na Liquipedia. O nome profissional da OpenDota é o que o
 * jogador escolheu (ex.: "医者watson`"), e a Liquipedia usa outro ("Watson").
 * Procura o jogador no elenco do time na Liquipedia (links para as páginas dos
 * jogadores, que também resolvem homônimos); sem time, usa o nome limpo.
 */
async function resolveWikiTitle(rawPlayer, teamName) {
  const known = PLAYER_WIKI_MAP[rawPlayer.toLowerCase()];
  if (known) return known;
  const key = norm(rawPlayer);
  if (teamName && key) {
    const page = await fetchLiquipediaApi(teamName.replace(/ /g, '_'), { ttlMs: 6 * 60 * 60 * 1000 }).catch(() => null);
    const html = page?.html || '';
    const links = [...html.matchAll(/<a href="\/dota2\/([^"#?]+)" title="([^"]+)">([^<]+)<\/a>/g)];
    // Mesmo nome exibido ou título da página; depois, nome da OpenDota que contém o da Liquipedia
    const exact = links.find(([, , title, text]) => norm(text) === key || norm(title) === key);
    const partial = exact || links.find(([, , , text]) => norm(text).length >= 3 && key.includes(norm(text)));
    if (partial) return decodeURIComponent(partial[1]).replace(/_/g, ' ');
  }
  // Sem elenco: o trecho latino do nome (a Liquipedia põe a 1ª letra em maiúscula sozinha)
  const latin = rawPlayer.normalize('NFKD').replace(/[^A-Za-z0-9_.-]/g, '');
  return latin || rawPlayer;
}

export default async function handler(req, res) {
  const rawPlayer = String(req.query.player || req.query.name || '').trim();
  const accountId = req.query.account_id;
  const teamName = String(req.query.team || '').trim();

  if (!rawPlayer) {
    return res.status(400).json({ error: 'Parâmetro "player" é obrigatório' });
  }

  const wikiTitle = await resolveWikiTitle(rawPlayer, teamName);

  try {
    // 1. Tentar buscar em Player/Results
    let liquiRes = await fetchLiquipediaApi(`${wikiTitle}/Results`, { ttlMs: 2 * 60 * 60 * 1000 });
    
    // 2. Fallback para a página principal do jogador se a /Results não existir
    if (!liquiRes?.html || liquiRes.html.length < 500) {
      liquiRes = await fetchLiquipediaApi(wikiTitle, { ttlMs: 2 * 60 * 60 * 1000 });
    }

    let achievements = [];
    if (liquiRes?.html) {
      achievements = parsePlayerAchievements(liquiRes.html);
    }

    // Métricas resumidas
    const championships = achievements.filter(a => a.isChampion);
    const podiums = achievements.filter(a => a.isPodium);
    const tier1Titles = championships.filter(a => /tier\s*1/i.test(a.tier) || /major|international|blast|riyadh/i.test(a.tournament));

    // Times distintos pelos quais conquistou títulos
    const teamsWithTitles = [...new Set(championships.map(c => c.teamName).filter(Boolean))];

    // Total de premiação acumulada em prêmios
    let totalPrizeUsd = 0;
    achievements.forEach(a => {
      if (a.prize) {
        const val = Number(a.prize.replace(/[^0-9]/g, ''));
        if (!isNaN(val)) totalPrizeUsd += val;
      }
    });

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');
    return res.status(200).json({
      player: wikiTitle,
      accountId,
      summary: {
        totalChampionships: championships.length,
        totalPodiums: podiums.length,
        tier1Titles: tier1Titles.length,
        totalPrizeUsd,
        teamsWithTitles
      },
      titles: championships,
      allAchievements: achievements
    });
  } catch (err) {
    console.error(`[Player Achievements] Erro ao buscar títulos para "${rawPlayer}":`, err.message);
    return res.status(500).json({
      error: 'Erro ao processar conquistas do jogador',
      titles: [],
      allAchievements: []
    });
  }
}
