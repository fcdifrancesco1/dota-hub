import { OPENDOTA_BASE, getCached, setCache, fetchWithTimeout } from './api';

const PLAYER_TTL = 30 * 60 * 1000; // 30 min
const PRO_PLAYERS_CACHE_KEY = 'dotahub_pro_players_list';
const PRO_PLAYERS_TTL = 24 * 3600 * 1000; // 24h

async function getJson(url, timeoutMs = 8000) {
  const res = await fetchWithTimeout(url, {}, timeoutMs);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** Busca lista de Pro Players para cruzar informações de time, role e país */
export async function getProPlayerInfo(accountId) {
  try {
    let list = getCached(PRO_PLAYERS_CACHE_KEY, PRO_PLAYERS_TTL);
    if (!list) {
      list = await getJson(`${OPENDOTA_BASE}/proPlayers`).catch(() => []);
      if (Array.isArray(list) && list.length > 0) {
        setCache(PRO_PLAYERS_CACHE_KEY, list);
      }
    }
    if (Array.isArray(list)) {
      return list.find((p) => String(p.account_id) === String(accountId)) || null;
    }
  } catch (e) {
    console.warn('Erro ao verificar pro player:', e);
  }
  return null;
}

export async function fetchPlayerComprehensiveData(accountId) {
  if (!accountId) return null;
  const key = `player_full_profile_v2_${accountId}`;
  const cached = getCached(key, PLAYER_TTL);
  if (cached) return cached;

  const [playerRaw, wlRaw, totalsRaw, heroesRaw, matchesRaw, proInfo] = await Promise.all([
    getJson(`${OPENDOTA_BASE}/players/${accountId}`).catch(() => null),
    getJson(`${OPENDOTA_BASE}/players/${accountId}/wl`).catch(() => ({ win: 0, lose: 0 })),
    getJson(`${OPENDOTA_BASE}/players/${accountId}/totals`).catch(() => []),
    getJson(`${OPENDOTA_BASE}/players/${accountId}/heroes`).catch(() => []),
    getJson(`${OPENDOTA_BASE}/players/${accountId}/matches?limit=25`).catch(() => []),
    getProPlayerInfo(accountId)
  ]);

  if (!playerRaw || (!playerRaw.profile && !proInfo)) {
    return null;
  }

  const profile = playerRaw.profile || {};
  const wins = wlRaw?.win || 0;
  const losses = wlRaw?.lose || 0;
  const totalMatches = wins + losses;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

  // Extrai médias de Totais
  const totalsMap = {};
  if (Array.isArray(totalsRaw)) {
    totalsRaw.forEach((t) => {
      totalsMap[t.field] = {
        total: t.sum,
        games: t.n,
        avg: t.n > 0 ? (t.sum / t.n) : 0
      };
    });
  }

  const avgKills = totalsMap.kills?.avg || 0;
  const avgDeaths = totalsMap.deaths?.avg || 0;
  const avgAssists = totalsMap.assists?.avg || 0;
  const avgGpm = Math.round(totalsMap.gold_per_min?.avg || 0);
  const avgXpm = Math.round(totalsMap.xp_per_min?.avg || 0);
  const avgLastHits = Math.round(totalsMap.last_hits?.avg || 0);
  const avgDenies = Math.round(totalsMap.denies?.avg || 0);
  const kda = avgDeaths > 0 ? (avgKills + avgAssists) / avgDeaths : (avgKills + avgAssists);

  // Top Heróis
  const sortedHeroes = Array.isArray(heroesRaw)
    ? [...heroesRaw]
        .filter((h) => h.games > 0)
        .sort((a, b) => b.games - a.games)
        .slice(0, 15)
        .map((h) => ({
          heroId: Number(h.hero_id),
          games: h.games,
          wins: h.win,
          winRate: h.games > 0 ? Math.round((h.win / h.games) * 100) : 0,
          lastPlayed: h.last_played
        }))
    : [];

  // Partidas recentes formatadas
  const formattedMatches = Array.isArray(matchesRaw)
    ? matchesRaw.map((m) => {
        const isRadiant = m.player_slot < 128;
        const won = (isRadiant && m.radiant_win) || (!isRadiant && !m.radiant_win);
        return {
          matchId: m.match_id,
          heroId: m.hero_id,
          won,
          kills: m.kills ?? 0,
          deaths: m.deaths ?? 0,
          assists: m.assists ?? 0,
          duration: m.duration,
          gameMode: m.game_mode,
          startTime: m.start_time
        };
      })
    : [];

  // Badges & Conquistas dinâmicas
  const badges = [
    {
      id: 'pro_verified',
      title: 'Pro Player Oficial',
      description: 'Jogador profissional cadastrado e registrado na Valve',
      unlocked: Boolean(proInfo?.is_pro || proInfo?.team_name)
    },
    {
      id: 'immortal_top',
      title: 'Elite Imortal',
      description: 'Membro do Rank Imortal do Dota 2',
      unlocked: (playerRaw.rank_tier >= 80) || Boolean(playerRaw.leaderboard_rank)
    },
    {
      id: 'top100_world',
      title: 'Top 100 Mundial',
      description: 'Posição no Ranking Oficial da Valve entre os 100 melhores',
      unlocked: Boolean(playerRaw.leaderboard_rank && playerRaw.leaderboard_rank <= 100)
    },
    {
      id: 'veteran_1k',
      title: 'Veterano de Batalha',
      description: 'Mais de 1.000 partidas públicas e profissionais registradas',
      unlocked: totalMatches >= 1000
    },
    {
      id: 'legend_5k',
      title: 'Lenda do Dota 2',
      description: 'Mais de 5.000 partidas oficiais disputadas',
      unlocked: totalMatches >= 5000
    },
    {
      id: 'winrate_vitorioso',
      title: 'Aproveitamento Superior',
      description: 'Taxa de vitórias na carreira de 55% ou mais',
      unlocked: winRate >= 55 && totalMatches >= 50
    },
    {
      id: 'high_gpm',
      title: 'Mestre da Economia',
      description: 'Média de ouro por minuto (GPM) superior a 600',
      unlocked: avgGpm >= 600
    },
    {
      id: 'high_kda',
      title: 'Impacto Estratégico',
      description: 'KDA médio de carreira acima de 3.5',
      unlocked: kda >= 3.5
    },
    {
      id: 'versatile',
      title: 'Mestre da Versatilidade',
      description: 'Já jogou com mais de 80 heróis diferentes',
      unlocked: (heroesRaw?.filter(h => h.games > 0)?.length || 0) >= 80
    }
  ];

  const result = {
    accountId,
    name: proInfo?.name || profile.personaname || `Jogador ${accountId}`,
    personaname: profile.personaname,
    realName: proInfo?.name || null,
    avatar: profile.avatarfull || profile.avatarmedium || proInfo?.avatarfull || null,
    countryCode: proInfo?.country_code || profile.loccountrycode || null,
    profileUrl: profile.profileurl,
    rankTier: playerRaw.rank_tier || null,
    leaderboardRank: playerRaw.leaderboard_rank || null,
    team: proInfo?.team_name ? {
      teamId: proInfo.team_id,
      name: proInfo.team_name,
      tag: proInfo.team_tag
    } : null,
    fantasyRole: proInfo?.fantasy_role || null,
    stats: {
      wins,
      losses,
      totalMatches,
      winRate,
      avgKills,
      avgDeaths,
      avgAssists,
      kda,
      avgGpm,
      avgXpm,
      avgLastHits,
      avgDenies
    },
    topHeroes: sortedHeroes,
    recentMatches: formattedMatches,
    badges
  };

  setCache(key, result);
  return result;
}
