import { createClient } from '@supabase/supabase-js';
import { SITE_CONFIG } from '../config/siteConfig';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('sua-url-supabase')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ============================================================================
// DUAL-MODE SERVICE LAYER
// When Supabase is configured, fetches from PostgreSQL / Views.
// When not configured, provides realistic seed data so local dev works seamlessly.
// ============================================================================

// Fallback seed data in memory for instant local development
const LOCAL_LEAGUES = [
  {
    id: 16890,
    name: 'ESL One Bangkok 2026',
    tier: 'tier_1',
    prize_pool: '$1,000,000',
    start_date: new Date(Date.now() - 3 * 86400000).toISOString(),
    end_date: new Date(Date.now() + 4 * 86400000).toISOString(),
    banner_url: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/leagues/esl_banner.jpg',
    logo_url: 'https://eslgaming.com/wp-content/uploads/2021/04/esl-logo-small.png',
    status: 'ongoing',
    location: 'Bangkok, Tailândia'
  },
  {
    id: 17200,
    name: 'The International 2026',
    tier: 'tier_1',
    prize_pool: '$3,500,000',
    start_date: new Date(Date.now() + 20 * 86400000).toISOString(),
    end_date: new Date(Date.now() + 32 * 86400000).toISOString(),
    banner_url: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/blog/ti_banner.jpg',
    logo_url: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/icons/aegis.png',
    status: 'upcoming',
    location: 'Copenhague, Dinamarca'
  }
];

const LOCAL_TEAMS = [
  {
    id: 8255888,
    name: 'Team Falcons',
    tag: 'Falcons',
    logo_url: 'https://steamusercontent-a.akamaihd.net/ugc/2349354060855799757/7A831E0D1C8C85786CF4DFB3BECA07D6D8E2D642/',
    rating: 1680.5,
    wins: 342,
    losses: 110,
    region: 'MENA / WEU'
  },
  {
    id: 2163,
    name: 'Team Liquid',
    tag: 'Liquid',
    logo_url: 'https://steamusercontent-a.akamaihd.net/ugc/2027229562725807908/33C788A58529CF34A1B2961CE9E546C9E42C2DE4/',
    rating: 1640.2,
    wins: 850,
    losses: 420,
    region: 'WEU'
  },
  {
    id: 8599101,
    name: 'Gaimin Gladiators',
    tag: 'GG',
    logo_url: 'https://steamusercontent-a.akamaihd.net/ugc/2028348873491959739/BEB53243FDB737EE8D0A144EC1DA98DBF25F6564/',
    rating: 1615.0,
    wins: 420,
    losses: 195,
    region: 'WEU'
  },
  {
    id: 7119388,
    name: 'Team Spirit',
    tag: 'Spirit',
    logo_url: 'https://steamusercontent-a.akamaihd.net/ugc/1858293739775368595/A4EE82FEA58F54BA79667794DF2803BFDE23B2F7/',
    rating: 1605.8,
    wins: 620,
    losses: 280,
    region: 'EEU'
  },
  {
    id: 8254400,
    name: 'BetBoom Team',
    tag: 'BB',
    logo_url: 'https://steamusercontent-a.akamaihd.net/ugc/1838042459424874984/2E5DDCF95D21FE7EBDE6ED3FDC4C697B9C7A1489/',
    rating: 1585.0,
    wins: 310,
    losses: 155,
    region: 'EEU'
  },
  {
    id: 8291895,
    name: 'Tundra Esports',
    tag: 'Tundra',
    logo_url: 'https://steamusercontent-a.akamaihd.net/ugc/1858293739783935293/5CA4DC23A8C5BD67A32F52909C2B7E1B73F3DE7C/',
    rating: 1572.4,
    wins: 380,
    losses: 210,
    region: 'WEU'
  }
];

const LOCAL_SCHEDULE = [
  {
    id: 1,
    league_name: 'ESL One Bangkok 2026',
    team1_name: 'Team Falcons',
    team2_name: 'Gaimin Gladiators',
    team1_id: 8255888,
    team2_id: 8599101,
    team1_logo: 'https://steamusercontent-a.akamaihd.net/ugc/2349354060855799757/7A831E0D1C8C85786CF4DFB3BECA07D6D8E2D642/',
    team2_logo: 'https://steamusercontent-a.akamaihd.net/ugc/2028348873491959739/BEB53243FDB737EE8D0A144EC1DA98DBF25F6564/',
    scheduled_time: new Date(Date.now() + 2 * 3600000).toISOString(),
    series_type: 3,
    stage: 'Semifinal Upper Bracket',
    stream_url: 'https://twitch.tv/esl_dota2br',
    stream_channel: 'ESL Dota 2 Brasil',
    status: 'scheduled'
  },
  {
    id: 2,
    league_name: 'ESL One Bangkok 2026',
    team1_name: 'Team Liquid',
    team2_name: 'Team Spirit',
    team1_id: 2163,
    team2_id: 7119388,
    team1_logo: 'https://steamusercontent-a.akamaihd.net/ugc/2027229562725807908/33C788A58529CF34A1B2961CE9E546C9E42C2DE4/',
    team2_logo: 'https://steamusercontent-a.akamaihd.net/ugc/1858293739775368595/A4EE82FEA58F54BA79667794DF2803BFDE23B2F7/',
    scheduled_time: new Date(Date.now() + 5.5 * 3600000).toISOString(),
    series_type: 3,
    stage: 'Lower Bracket Round 3',
    stream_url: 'https://twitch.tv/esl_dota2br',
    stream_channel: 'ESL Dota 2 Brasil',
    status: 'scheduled'
  },
  {
    id: 3,
    league_name: 'ESL One Bangkok 2026',
    team1_name: 'BetBoom Team',
    team2_name: 'Tundra Esports',
    team1_id: 8254400,
    team2_id: 8291895,
    team1_logo: 'https://steamusercontent-a.akamaihd.net/ugc/1838042459424874984/2E5DDCF95D21FE7EBDE6ED3FDC4C697B9C7A1489/',
    team2_logo: 'https://steamusercontent-a.akamaihd.net/ugc/1858293739783935293/5CA4DC23A8C5BD67A32F52909C2B7E1B73F3DE7C/',
    scheduled_time: new Date(Date.now() + 9 * 3600000).toISOString(),
    series_type: 3,
    stage: 'Lower Bracket Round 3',
    stream_url: 'https://twitch.tv/esl_dota2br',
    stream_channel: 'ESL Dota 2 Brasil',
    status: 'scheduled'
  }
];

const LOCAL_SERIES = [
  {
    series_id: 9001001,
    league_name: 'ESL One Bangkok 2026',
    team1_name: 'Team Falcons',
    team2_name: 'Team Liquid',
    team1_id: 8255888,
    team2_id: 2163,
    team1_logo: 'https://steamusercontent-a.akamaihd.net/ugc/2349354060855799757/7A831E0D1C8C85786CF4DFB3BECA07D6D8E2D642/',
    team2_logo: 'https://steamusercontent-a.akamaihd.net/ugc/2027229562725807908/33C788A58529CF34A1B2961CE9E546C9E42C2DE4/',
    score_team1: 3,
    score_team2: 2,
    series_type: 5,
    stage: 'Grande Final',
    status: 'finished',
    winner_team_id: 8255888,
    start_time: new Date(Date.now() - 28 * 3600000).toISOString(),
    match_ids: [7920001, 7920002, 7920003, 7920004, 7920005]
  },
  {
    series_id: 9001002,
    league_name: 'ESL One Bangkok 2026',
    team1_name: 'Gaimin Gladiators',
    team2_name: 'Team Spirit',
    team1_id: 8599101,
    team2_id: 7119388,
    team1_logo: 'https://steamusercontent-a.akamaihd.net/ugc/2028348873491959739/BEB53243FDB737EE8D0A144EC1DA98DBF25F6564/',
    team2_logo: 'https://steamusercontent-a.akamaihd.net/ugc/1858293739775368595/A4EE82FEA58F54BA79667794DF2803BFDE23B2F7/',
    score_team1: 2,
    score_team2: 0,
    series_type: 3,
    stage: 'Semifinal Upper Bracket',
    status: 'finished',
    winner_team_id: 8599101,
    start_time: new Date(Date.now() - 50 * 3600000).toISOString(),
    match_ids: [7920006, 7920007]
  },
  {
    series_id: 9001003,
    league_name: 'ESL One Bangkok 2026',
    team1_name: 'BetBoom Team',
    team2_name: 'Tundra Esports',
    team1_id: 8254400,
    team2_id: 8291895,
    team1_logo: 'https://steamusercontent-a.akamaihd.net/ugc/1838042459424874984/2E5DDCF95D21FE7EBDE6ED3FDC4C697B9C7A1489/',
    team2_logo: 'https://steamusercontent-a.akamaihd.net/ugc/1858293739783935293/5CA4DC23A8C5BD67A32F52909C2B7E1B73F3DE7C/',
    score_team1: 2,
    score_team2: 1,
    series_type: 3,
    stage: 'Quartas de Final',
    status: 'finished',
    winner_team_id: 8254400,
    start_time: new Date(Date.now() - 74 * 3600000).toISOString(),
    match_ids: [7920008, 7920009, 7920010]
  }
];

const LOCAL_ANALYSES = [
  {
    id: 1,
    title: 'Raio-X do Patch 7.37: O domínio da Luna e dos heróis Universais no competitivo',
    slug: 'raio-x-patch-7-37-luna-meta',
    summary: 'Entenda por que a Luna se tornou a carry mais prioritária dos torneios tier 1 e como as mudanças de mapa impactaram as rotações de suporte.',
    content: `# O Retorno Triunfante da Luna no Cenário Profissional\n\nO patch 7.37 trouxe alterações sutis porém decisivas nas rotas e nos itens de agilidade, transformando heróis de farming rápido como a **Luna** e o **Sven** nas escolhas principais das potências mundiais.\n\n---\n\n## 1. Por que a Luna está tão forte?\n- **Lucent Beam e Eclipse com scaling mágico:** O dano inicial garante presença em lutas rápidas antes dos 20 minutos.\n- **Moon Glaives:** Limpeza instantânea de campos de neutros e pressão contínua nas rotas laterais.\n- **Build otimizada:** *Manta Style* + *Dragon Lance* + *Black King Bar* fornecem sobrevivência e alcance para lutar com segurança.\n\n\`\`\`markdown\nEstatísticas da Luna no ESL One:\n- Taxa de Pick: 42.5%\n- Taxa de Ban: 38.0%\n- Winrate: 68.4% em 38 jogos\n\`\`\`\n\n---\n\n## 2. A força dos Heróis Universais na rota do meio\nHeróis como **Invoker**, **Timbersaw** e **Abaddon** continuam ditando o ritmo devido ao ganho linear de dano proporcionado por qualquer atributo secundário.\n\n> "A versatilidade dos heróis universais permite flexibilizar a rotação de draft sem entregar as intenções do time no primeiro estágio." — *Análise Técnica DotaHub*\n\n---\n\n## 3. O que esperar dos próximos confrontos?\nEspere ver mais contramedidas focadas em controle de área (*Hoodwink*, *Disruptor*) e drafts com iniciação de longa distância para neutralizar as carries vulneráveis a burst.`,
    cover_image: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/blog/patch737_banner.jpg',
    author: 'Felipe Di Francesco',
    tags: ['Patch 7.37', 'Meta', 'Análise Tática', 'Luna', 'ESL One'],
    is_featured: true,
    published_at: new Date(Date.now() - 6 * 3600000).toISOString()
  },
  {
    id: 2,
    title: 'Team Falcons vs Team Liquid: A rivalidade que define a temporada 2026',
    slug: 'falcons-vs-liquid-rivalidade-2026',
    summary: 'Uma análise detalhada da grande final do ESL One Bangkok, onde o controle de mapa de Sneyking enfrentou o ritmo implacável de Nisha.',
    content: `# Falcons x Liquid: O Clássico Moderno do Dota 2\n\nNos últimos meses, **Team Falcons** e **Team Liquid** protagonizaram as finais mais eletrizantes do circuito profissional. A final em MD5 do ESL One Bangkok não foi exceção.\n\n## O Choque de Estilos\n1. **O Estilo Opressor da Falcons:**\n   - Prioridade de farm para Ammar (**ATF**) no offlane.\n   - Malr1ne com picks agressivos no mid criando espaço.\n   - Sneyking coordenando stacks e wards profundas.\n\n2. **A Resposta Estratégica da Liquid:**\n   - Nisha como motor principal das team fights.\n   - Boxi e Insania garantindo saves cruciais com *Rubick* e *Lich*.\n\nO placar de 3x2 coroou a Falcons, mas deixou claro que o The International 2026 terá uma das disputas mais equilibradas de todos os tempos.`,
    cover_image: 'https://steamusercontent-a.akamaihd.net/ugc/2349354060855799757/7A831E0D1C8C85786CF4DFB3BECA07D6D8E2D642/',
    author: 'Redação DotaHub',
    tags: ['Falcons', 'Liquid', 'ESL One', 'Playoffs', 'Recap'],
    is_featured: false,
    published_at: new Date(Date.now() - 24 * 3600000).toISOString()
  }
];

// Funções de acesso a dados públicas (Dual-Mode)

export async function fetchLeagues(status = 'all') {
  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('leagues').select('*').order('start_date', { ascending: false });
      if (status !== 'all') query = query.eq('status', status);
      const { data, error } = await query;
      if (!error && data?.length) return data;
    } catch (e) {
      console.warn('Erro ao consultar Supabase (leagues), usando dados locais:', e);
    }
  }
  if (status === 'all') return LOCAL_LEAGUES;
  return LOCAL_LEAGUES.filter(l => l.status === status);
}

export async function fetchLeagueById(id) {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('leagues').select('*').eq('id', id).single();
      if (!error && data) return data;
    } catch (e) {
      console.warn('Erro ao consultar Supabase (league id), usando fallback:', e);
    }
  }
  return LOCAL_LEAGUES.find(l => String(l.id) === String(id)) || null;
}

export async function fetchTeams() {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('v_team_rankings').select('*');
      if (!error && data?.length) return data;
    } catch (e) {
      console.warn('Erro ao consultar Supabase (teams), usando dados locais:', e);
    }
  }
  return LOCAL_TEAMS;
}

export async function fetchTeamById(id) {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('teams').select('*').eq('id', id).single();
      if (!error && data) return data;
    } catch (e) {
      console.warn('Erro ao consultar Supabase (team id), usando fallback:', e);
    }
  }
  return LOCAL_TEAMS.find(t => String(t.id) === String(id)) || null;
}

export async function fetchSchedule() {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('schedule')
        .select('*')
        .order('scheduled_time', { ascending: true });
      if (!error && data?.length) return data;
    } catch (e) {
      console.warn('Erro ao consultar Supabase (schedule), usando dados locais:', e);
    }
  }
  return LOCAL_SCHEDULE;
}

export async function fetchRecentSeries(limit = 10) {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('series')
        .select('*, leagues(name), team1:team1_id(name, logo_url), team2:team2_id(name, logo_url)')
        .order('start_time', { ascending: false })
        .limit(limit);
      if (!error && data?.length) return data;
    } catch (e) {
      console.warn('Erro ao consultar Supabase (series), usando dados locais:', e);
    }
  }
  return LOCAL_SERIES.slice(0, limit);
}

export async function fetchAnalyses(limit = 10) {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(limit);
      if (!error && data?.length) return data;
    } catch (e) {
      console.warn('Erro ao consultar Supabase (analyses), usando dados locais:', e);
    }
  }
  return LOCAL_ANALYSES.slice(0, limit);
}

export async function fetchAnalysisBySlug(slug) {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('slug', slug)
        .single();
      if (!error && data) return data;
    } catch (e) {
      console.warn('Erro ao consultar Supabase (analysis slug), usando fallback:', e);
    }
  }
  return LOCAL_ANALYSES.find(a => a.slug === slug) || null;
}

// Estatísticas globais do dia/semana para a Home
export function getHomeStats() {
  return {
    matchesToday: 18,
    avgDurationMin: 39,
    mostPickedHero: { name: 'Luna', count: 24, winrate: 68.4, img: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/luna.png' },
    mostBannedHero: { name: 'Io', count: 31, img: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/wisp.png' },
    highestWinrateHero: { name: 'Timbersaw', winrate: 73.3, matches: 15, img: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/shredder.png' }
  };
}
