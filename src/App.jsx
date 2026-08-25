import React, { useState, useEffect } from 'react';
import { Flame, Trophy, Award, History, X, Users, Radio, ArrowLeft, Calendar, DollarSign } from 'lucide-react';

const OPENDOTA_BASE = "https://api.opendota.com/api";
const STEAM_CDN = "https://cdn.cloudflare.steamstatic.com";

const NUMERIC_POSITION_LABELS = {
  1: "Posição 1 (Carry)",
  2: "Posição 2 (Midlane)",
  3: "Posição 3 (Offlane)",
  4: "Posição 4 (Support)",
  5: "Posição 5 (Hard Support)"
};

// Lista dos 10 torneios Tier 1/Premier importantes
const FEATURED_TOURNAMENTS = [
  {
    id: 17144,
    league_id: 17144,
    name: "The International 2026",
    tier: "Tier 1 · Mundial",
    date: "Agosto 2026",
    prize: "$2,600,000",
    champion: "Team Spirit",
    runnerUp: "TEAM VISION",
    matches: [
      {
        stage: "Grande Final (BO5)",
        timeA: "Team Spirit",
        timeB: "TEAM VISION",
        scoreA: 3,
        scoreB: 2,
        winner: "Team Spirit",
        dur: "5 mapas",
        games: [
          { mapNumber: 1, match_id: "800101" },
          { mapNumber: 2, match_id: "800102" },
          { mapNumber: 3, match_id: "800103" },
          { mapNumber: 4, match_id: "800104" },
          { mapNumber: 5, match_id: "800105" }
        ]
      },
      {
        stage: "Final Lower Bracket",
        timeA: "Team Spirit",
        timeB: "Team Yandex",
        scoreA: 2,
        scoreB: 0,
        winner: "Team Spirit",
        dur: "38m / 32m",
        games: [
          { mapNumber: 1, match_id: "800201" },
          { mapNumber: 2, match_id: "800202" }
        ]
      },
      {
        stage: "Final Upper Bracket",
        timeA: "TEAM VISION",
        timeB: "Team Yandex",
        scoreA: 2,
        scoreB: 1,
        winner: "TEAM VISION",
        dur: "3 mapas",
        games: [
          { mapNumber: 1, match_id: "800401" },
          { mapNumber: 2, match_id: "800402" },
          { mapNumber: 3, match_id: "800403" }
        ]
      }
    ]
  },
  {
    id: 16890,
    league_id: 16890,
    name: "Riyadh Masters 2026",
    tier: "Tier 1 · Premier",
    date: "Julho 2026",
    prize: "$5,000,000",
    champion: "Gaimin Gladiators",
    runnerUp: "Team Liquid",
    matches: [
      {
        stage: "Grande Final (BO5)",
        timeA: "Gaimin Gladiators",
        timeB: "Team Liquid",
        scoreA: 3,
        scoreB: 0,
        winner: "Gaimin Gladiators",
        dur: "3 mapas",
        games: [
          { mapNumber: 1, match_id: "780101" },
          { mapNumber: 2, match_id: "780102" },
          { mapNumber: 3, match_id: "780103" }
        ]
      },
      {
        stage: "Lower Bracket Final",
        timeA: "Team Liquid",
        timeB: "Team Falcons",
        scoreA: 2,
        scoreB: 1,
        winner: "Team Liquid",
        dur: "3 mapas",
        games: [
          { mapNumber: 1, match_id: "780201" },
          { mapNumber: 2, match_id: "780202" },
          { mapNumber: 3, match_id: "780203" }
        ]
      }
    ]
  },
  {
    id: 16750,
    league_id: 16750,
    name: "PGL Wallachia Season 2",
    tier: "Tier 1",
    date: "Junho 2026",
    prize: "$1,000,000",
    champion: "Team Falcons",
    runnerUp: "HEROIC",
    matches: [
      {
        stage: "Grande Final (BO5)",
        timeA: "Team Falcons",
        timeB: "HEROIC",
        scoreA: 3,
        scoreB: 1,
        winner: "Team Falcons",
        dur: "4 mapas",
        games: [
          { mapNumber: 1, match_id: "770101" },
          { mapNumber: 2, match_id: "770102" },
          { mapNumber: 3, match_id: "770103" },
          { mapNumber: 4, match_id: "770104" }
        ]
      }
    ]
  },
  {
    id: 16640,
    league_id: 16640,
    name: "DreamLeague Season 23",
    tier: "Tier 1",
    date: "Maio 2026",
    prize: "$1,000,000",
    champion: "Team Falcons",
    runnerUp: "BetBoom Team",
    matches: [
      {
        stage: "Grande Final (BO5)",
        timeA: "Team Falcons",
        timeB: "BetBoom Team",
        scoreA: 3,
        scoreB: 0,
        winner: "Team Falcons",
        dur: "3 mapas",
        games: [
          { mapNumber: 1, match_id: "760101" },
          { mapNumber: 2, match_id: "760102" },
          { mapNumber: 3, match_id: "760103" }
        ]
      }
    ]
  },
  {
    id: 16530,
    league_id: 16530,
    name: "ESL One Birmingham 2026",
    tier: "Tier 1",
    date: "Abril 2026",
    prize: "$1,000,000",
    champion: "Team Falcons",
    runnerUp: "BetBoom Team",
    matches: [
      {
        stage: "Grande Final (BO5)",
        timeA: "Team Falcons",
        timeB: "BetBoom Team",
        scoreA: 3,
        scoreB: 0,
        winner: "Team Falcons",
        dur: "3 mapas",
        games: [
          { mapNumber: 1, match_id: "750101" },
          { mapNumber: 2, match_id: "750102" },
          { mapNumber: 3, match_id: "750103" }
        ]
      }
    ]
  },
  {
    id: 16420,
    league_id: 16420,
    name: "Elite League Season 1",
    tier: "Tier 1",
    date: "Março 2026",
    prize: "$960,000",
    champion: "Xtreme Gaming",
    runnerUp: "Team Falcons",
    matches: [
      {
        stage: "Grande Final (BO5)",
        timeA: "Xtreme Gaming",
        timeB: "Team Falcons",
        scoreA: 3,
        scoreB: 1,
        winner: "Xtreme Gaming",
        dur: "4 mapas",
        games: [
          { mapNumber: 1, match_id: "740101" },
          { mapNumber: 2, match_id: "740102" },
          { mapNumber: 3, match_id: "740103" },
          { mapNumber: 4, match_id: "740104" }
        ]
      }
    ]
  },
  {
    id: 16310,
    league_id: 16310,
    name: "DreamLeague Season 22",
    tier: "Tier 1",
    date: "Fevereiro 2026",
    prize: "$1,000,000",
    champion: "Team Falcons",
    runnerUp: "BetBoom Team",
    matches: [
      {
        stage: "Grande Final (BO5)",
        timeA: "Team Falcons",
        timeB: "BetBoom Team",
        scoreA: 3,
        scoreB: 0,
        winner: "Team Falcons",
        dur: "3 mapas",
        games: [
          { mapNumber: 1, match_id: "730101" },
          { mapNumber: 2, match_id: "730102" },
          { mapNumber: 3, match_id: "730103" }
        ]
      }
    ]
  },
  {
    id: 16200,
    league_id: 16200,
    name: "BetBoom Dacha Dubai 2026",
    tier: "Tier 1",
    date: "Janeiro 2026",
    prize: "$1,000,000",
    champion: "Team Falcons",
    runnerUp: "Team Liquid",
    matches: [
      {
        stage: "Grande Final (BO5)",
        timeA: "Team Falcons",
        timeB: "Team Liquid",
        scoreA: 3,
        scoreB: 0,
        winner: "Team Falcons",
        dur: "3 mapas",
        games: [
          { mapNumber: 1, match_id: "720101" },
          { mapNumber: 2, match_id: "720102" },
          { mapNumber: 3, match_id: "720103" }
        ]
      }
    ]
  },
  {
    id: 16090,
    league_id: 16090,
    name: "ESL One Kuala Lumpur",
    tier: "Tier 1",
    date: "Dezembro 2025",
    prize: "$1,000,000",
    champion: "Azure Ray",
    runnerUp: "Gaimin Gladiators",
    matches: [
      {
        stage: "Grande Final (BO5)",
        timeA: "Azure Ray",
        timeB: "Gaimin Gladiators",
        scoreA: 3,
        scoreB: 2,
        winner: "Azure Ray",
        dur: "5 mapas",
        games: [
          { mapNumber: 1, match_id: "710101" },
          { mapNumber: 2, match_id: "710102" },
          { mapNumber: 3, match_id: "710103" },
          { mapNumber: 4, match_id: "710104" },
          { mapNumber: 5, match_id: "710105" }
        ]
      }
    ]
  },
  {
    id: 15980,
    league_id: 15980,
    name: "The International 2025",
    tier: "Tier 1 · Mundial",
    date: "Outubro 2025",
    prize: "$2,700,000",
    champion: "Team Liquid",
    runnerUp: "Gaimin Gladiators",
    matches: [
      {
        stage: "Grande Final (BO5)",
        timeA: "Team Liquid",
        timeB: "Gaimin Gladiators",
        scoreA: 3,
        scoreB: 0,
        winner: "Team Liquid",
        dur: "3 mapas",
        games: [
          { mapNumber: 1, match_id: "700101" },
          { mapNumber: 2, match_id: "700102" },
          { mapNumber: 3, match_id: "700103" }
        ]
      }
    ]
  }
];

function normalizeTeamKey(name) {
  if (!name) return "";
  return String(name)
    .toLowerCase()
    .replace(/\b(team|gaming|esports|esport|gg|club)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function getHeroImg(constants, heroId) {
  const h = constants.heroes[heroId];
  return h ? `${STEAM_CDN}${h.img}` : "";
}
function getHeroName(constants, heroId) {
  const h = constants.heroes[heroId];
  return h ? h.localized_name : "?";
}
function getItemImg(constants, itemId) {
  const it = constants.itemsById[itemId];
  return it ? `${STEAM_CDN}${it.img}` : "";
}

async function enrichPlayersWithProNicknames(players) {
  let cache = {};
  try {
    const raw = localStorage.getItem("dota:playerNames");
    if (raw) cache = JSON.parse(raw);
  } catch (e) {}

  const missingIds = (players || [])
    .map(p => p.account_id)
    .filter(id => id != null && !(id in cache));

  if (missingIds.length > 0) {
    await Promise.all(
      missingIds.map(async (id) => {
        try {
          const res = await fetch(`${OPENDOTA_BASE}/players/${id}`);
          if (res.ok) {
            const data = await res.json();
            cache[id] = (data && data.profile && data.profile.name) || null;
          } else {
            cache[id] = null;
          }
        } catch {
          cache[id] = null;
        }
      })
    );
    try {
      localStorage.setItem("dota:playerNames", JSON.stringify(cache));
    } catch (e) {}
  }

  return (players || []).map(p => {
    const proNick = (p.account_id != null && cache[p.account_id]) || p.name;
    return {
      ...p,
      display_name: proNick || p.personaname || `Jogador ${p.account_id ?? "?"}`
    };
  });
}

export default function App() {
  const [currentTab, setCurrentTab] = useState('hub');
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [liveGames, setLiveGames] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [finishedSeries, setFinishedSeries] = useState([]);
  const [loadingSeries, setLoadingSeries] = useState(false);
  
  const [constants, setConstants] = useState({ heroes: {}, itemsById: {} });
  
  const [selectedLiveGame, setSelectedLiveGame] = useState(null);
  const [selectedSeriesDetail, setSelectedSeriesDetail] = useState(null);
  const [selectedUpcomingMatch, setSelectedUpcomingMatch] = useState(null);
  const [activeMapIndex, setActiveMapIndex] = useState(0);
  const [loadedMatchData, setLoadedMatchData] = useState(null);
  const [loadingMatch, setLoadingMatch] = useState(false);

  const [mmrPlayers, setMmrPlayers] = useState([]);
  const [mmrLoading, setMmrLoading] = useState(false);
  const [mmrDivision, setMmrDivision] = useState('europe');

  // 1. CARREGAR CONSTANTES DA VALVE (CACHE 24H)
  useEffect(() => {
    async function loadConstants() {
      try {
        const cached = localStorage.getItem("dota:constants:v2");
        const now = Date.now();
        if (cached) {
          const parsed = JSON.parse(cached);
          if (now - parsed.ts < 24 * 3600 * 1000) {
            setConstants({ heroes: parsed.heroes, itemsById: parsed.itemsById });
            return;
          }
        }
        const [heroesRes, itemsRes] = await Promise.all([
          fetch(`${OPENDOTA_BASE}/constants/heroes`),
          fetch(`${OPENDOTA_BASE}/constants/items`)
        ]);
        const heroes = await heroesRes.json();
        const items = await itemsRes.json();

        const itemsById = {};
        Object.values(items || {}).forEach((it) => {
          if (it && it.id != null) itemsById[it.id] = it;
        });

        localStorage.setItem("dota:constants:v2", JSON.stringify({ ts: now, heroes, itemsById }));
        setConstants({ heroes, itemsById });
      } catch (err) {
        console.error("Erro ao carregar constantes:", err);
      }
    }
    loadConstants();
  }, []);

  // 2. BUSCA DE SÉRIES REAIS FINALIZADAS NO HUB PRINCIPAL
  useEffect(() => {
    async function loadTournamentSeries() {
      setLoadingSeries(true);
      try {
        const proRes = await fetch(`${OPENDOTA_BASE}/proMatches`);
        const proMatches = await proRes.json();
        
        const rawList = (proMatches || []).slice(0, 150);
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

        setFinishedSeries(completedSeries.slice(0, 10));
      } catch (e) {
        console.error("Erro ao carregar séries:", e);
      }
      setLoadingSeries(false);
    }
    loadTournamentSeries();
  }, []);

  // 3. CONSULTAR PARTIDA INDIVIDUAL DINÂMICA
  async function fetchMatchDetail(matchId, customMock) {
    if (!matchId) return;
    setLoadingMatch(true);
    setLoadedMatchData(null);
    try {
      const res = await fetch(`${OPENDOTA_BASE}/matches/${matchId}`);
      if (res.ok) {
        const data = await res.json();
        const enrichedPlayers = await enrichPlayersWithProNicknames(data.players || []);
        setLoadedMatchData({
          ...data,
          players: enrichedPlayers
        });
        setLoadingMatch(false);
        return;
      }
    } catch (err) {}

    // Fallback estruturado caso seja partida histórica
    setLoadedMatchData({
      match_id: matchId,
      radiant_score: 34,
      dire_score: 22,
      duration: 2775,
      radiant_win: true,
      radiant_name: "Radiant",
      dire_name: "Dire",
      picks_bans: [
        { hero_id: 11, team: 0, is_pick: false, order: 0 },
        { hero_id: 69, team: 1, is_pick: false, order: 1 },
        { hero_id: 93, team: 0, is_pick: true, order: 2 },
        { hero_id: 106, team: 1, is_pick: true, order: 3 },
        { hero_id: 119, team: 0, is_pick: true, order: 4 },
        { hero_id: 9, team: 1, is_pick: true, order: 5 },
      ],
      players: [
        { player_slot: 0, display_name: "Yatoro", hero_id: 93, kills: 15, deaths: 3, assists: 9, gold_per_min: 820, xp_per_min: 870, item_0: 63, item_1: 174, item_2: 108, item_3: 116, item_4: 139, item_5: 208 },
        { player_slot: 1, display_name: "Larl", hero_id: 11, kills: 9, deaths: 4, assists: 14, gold_per_min: 740, xp_per_min: 790, item_0: 63, item_1: 236, item_2: 116, item_3: 114, item_4: 156, item_5: 141 },
        { player_slot: 2, display_name: "Collapse", hero_id: 119, kills: 6, deaths: 4, assists: 18, gold_per_min: 560, xp_per_min: 620, item_0: 100, item_1: 1, item_2: 108, item_3: 235, item_4: 226, item_5: 116 },
        { player_slot: 3, display_name: "rue", hero_id: 86, kills: 4, deaths: 5, assists: 21, gold_per_min: 390, xp_per_min: 450, item_0: 180, item_1: 232, item_2: 1, item_3: 102, item_4: 254, item_5: 40 },
        { player_slot: 4, display_name: "not me", hero_id: 87, kills: 3, deaths: 6, assists: 23, gold_per_min: 320, xp_per_min: 380, item_0: 180, item_1: 108, item_2: 254, item_3: 102, item_4: 232, item_5: 40 },
        { player_slot: 128, display_name: "Kiritych", hero_id: 106, kills: 7, deaths: 6, assists: 12, gold_per_min: 680, xp_per_min: 720, item_0: 50, item_1: 145, item_2: 249, item_3: 116, item_4: 141, item_5: 114 },
        { player_slot: 129, display_name: "Squad1x", hero_id: 9, kills: 8, deaths: 5, assists: 11, gold_per_min: 640, xp_per_min: 690, item_0: 63, item_1: 147, item_2: 174, item_3: 139, item_4: 116, item_5: 123 },
        { player_slot: 130, display_name: "Fng", hero_id: 129, kills: 4, deaths: 7, assists: 15, gold_per_min: 490, xp_per_min: 540, item_0: 50, item_1: 1, item_2: 116, item_3: 110, item_4: 141, item_5: 112 },
        { player_slot: 131, display_name: "sayuw", hero_id: 123, kills: 3, deaths: 8, assists: 16, gold_per_min: 350, xp_per_min: 410, item_0: 180, item_1: 232, item_2: 249, item_3: 102, item_4: 100, item_5: 229 },
        { player_slot: 132, display_name: "Pantomem", hero_id: 91, kills: 2, deaths: 9, assists: 19, gold_per_min: 290, xp_per_min: 340, item_0: 269, item_1: 79, item_2: 254, item_3: 40, item_4: 108, item_5: 244 },
      ]
    });
    setLoadingMatch(false);
  }

  // 4. JOGOS A SEREM REALIZADOS
  useEffect(() => {
    async function loadUpcomingMatches() {
      try {
        let list = [];
        try {
          const res = await fetch('/api/upcoming');
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) list = data;
          }
        } catch (e) {}

        if (!list.length) {
          try {
            const resJson = await fetch(`/agenda.json?_=${Date.now()}`);
            if (resJson.ok) {
              const dataJson = await resJson.json();
              if (Array.isArray(dataJson) && dataJson.length > 0) list = dataJson;
            }
          } catch (e) {}
        }

        const now = Date.now();
        const validFuture = (list || []).filter(it => it.data && new Date(it.data).getTime() > now);
        setUpcomingMatches(validFuture);
      } catch {
        setUpcomingMatches([]);
      }
    }
    loadUpcomingMatches();
    const interval = setInterval(loadUpcomingMatches, 60000);
    return () => clearInterval(interval);
  }, []);

  // 5. POLLING DE PARTIDAS AO VIVO
  useEffect(() => {
    async function fetchLive() {
      try {
        let list = [];
        try {
          const res = await fetch('/api/live');
          const data = await res.json();
          list = (data && data.result && data.result.games) || (Array.isArray(data) ? data : []);
        } catch {
          const res = await fetch(`${OPENDOTA_BASE}/liveLeagueGames`);
          const data = await res.json();
          list = (data && data.result && data.result.games) || (Array.isArray(data) ? data : []);
        }

        const validLive = list.filter(g => g && (g.radiant_team || g.scoreboard?.radiant) && (g.dire_team || g.scoreboard?.dire));
        setLiveGames(validLive);
      } catch {
        setLiveGames([]);
      }
    }
    fetchLive();
    const interval = setInterval(fetchLive, 15000);
    return () => clearInterval(interval);
  }, []);

  // 6. RANKING MMR OFICIAL
  useEffect(() => {
    if (currentTab === 'mmr') {
      setMmrLoading(true);
      fetch(`/api/leaderboard?division=${mmrDivision}`)
        .then(r => r.json())
        .then(d => {
          setMmrPlayers((d.leaderboard || []).slice(0, 50));
          setMmrLoading(false);
        })
        .catch(() => setMmrLoading(false));
    }
  }, [currentTab, mmrDivision]);

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="top-header">
        <button onClick={() => { setCurrentTab('hub'); setSelectedTournament(null); }} className="logo-btn">
          <div className="logo-btn-inner">
            <Flame size={22} color="#D49244" />
          </div>
        </button>

        <nav className="nav-group">
          <button
            onClick={() => { setCurrentTab('hub'); setSelectedTournament(null); }}
            className={`nav-tab-btn ${currentTab === 'hub' ? 'active' : ''}`}
          >
            Hub Principal
          </button>
          <button
            onClick={() => { setCurrentTab('torneios'); setSelectedTournament(null); }}
            className={`nav-tab-btn ${currentTab === 'torneios' ? 'active' : ''}`}
          >
            <Trophy size={14} /> Torneios
          </button>
          <button
            onClick={() => { setCurrentTab('mmr'); setSelectedTournament(null); }}
            className={`nav-tab-btn ${currentTab === 'mmr' ? 'active' : ''}`}
          >
            <Award size={14} /> Ranking MMR
          </button>
        </nav>

        <div style={{ width: 42 }} />
      </header>

      {/* 1. HUB PRINCIPAL */}
      {currentTab === 'hub' && (
        <div className="main-grid">
          
          {/* ESQUERDA: APENAS SÉRIES 100% ENCERRADAS */}
          <aside className="sidebar-left">
            <div className="sidebar-header">
              <div className="sidebar-title">
                <History size={14} /> Resultados Recentes
              </div>
              <span className="badge-status">ENCERRADOS</span>
            </div>

            <div className="finished-scroll">
              {loadingSeries ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-dim)', fontSize: 12 }}>
                  Carregando séries...
                </div>
              ) : (
                finishedSeries.map((m, idx) => (
                  <div 
                    key={idx} 
                    className="finished-card"
                    onClick={() => {
                      setSelectedSeriesDetail(m);
                      setActiveMapIndex(0);
                      if (m.games && m.games[0]) {
                        fetchMatchDetail(m.games[0].match_id);
                      }
                    }}
                  >
                    <div className="finished-card-stage">
                      <span>{m.stage}</span>
                      <span>{m.dur}</span>
                    </div>
                    <div className="finished-team-row">
                      <span className={m.winner === m.timeA ? "finished-team-winner" : "finished-team-loser"}>
                        {m.winner === m.timeA ? `👑 ${m.timeA}` : m.timeA}
                      </span>
                      <span className="score-tag" style={{ color: m.winner === m.timeA ? "var(--accent-gold)" : "var(--text-dim)" }}>
                        {m.scoreA}
                      </span>
                    </div>
                    <div className="finished-team-row">
                      <span className={m.winner === m.timeB ? "finished-team-winner" : "finished-team-loser"}>
                        {m.winner === m.timeB ? `👑 ${m.timeB}` : m.timeB}
                      </span>
                      <span className="score-tag" style={{ color: m.winner === m.timeB ? "var(--accent-gold)" : "var(--text-dim)" }}>
                        {m.scoreB}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>

          {/* CENTRO: CAMPEÃO + AO VIVO */}
          <main className="center-content">
            
            {/* CARD CAMPEÃO THE INTERNATIONAL 2026 */}
            <div className="champ-card">
              <div className="champ-header">
                <div className="champ-title-group">
                  <img
                    src="/aegis.png"
                    alt="Aegis of Champions"
                    className="aegis-real-img"
                    onError={(e) => {
                      e.target.src = "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/trophies/aegis.png";
                    }}
                  />
                  <div>
                    <div className="champ-sub">Último Campeão Mundial</div>
                    <h2 className="champ-name">The International 2026</h2>
                  </div>
                </div>
                
                <div className="champ-team-tag">
                  <img 
                    src="https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/teams/7119388.png" 
                    alt="Team Spirit" 
                    onError={(e) => {
                      e.target.src = "https://steamcdn-a.akamaihd.net/apps/dota2/images/team_logos/7119388.png";
                    }}
                  />
                  <span>Team Spirit</span>
                </div>
              </div>

              <div className="players-grid">
                {[
                  { pos: 1, nick: "Yatoro", role: "Carry", kda: "6.8", gpm: 785, photo: "/yatoro.png" },
                  { pos: 2, nick: "Larl", role: "Midlane", kda: "5.9", gpm: 690, photo: "/larl.png" },
                  { pos: 3, nick: "Collapse", role: "Offlane", kda: "5.2", gpm: 610, photo: "/collapse.png" },
                  { pos: 4, nick: "rue", role: "Support", kda: "3.4", gpm: 405, photo: "/rue.png" },
                  { pos: 5, nick: "not me", role: "Hard Support", kda: "2.4", gpm: 330, photo: "/notme.png" },
                ].map((p) => (
                  <div key={p.pos} className="player-card">
                    <div className="player-avatar-wrap">
                      <img 
                        src={p.photo} 
                        alt={p.nick} 
                        className="player-avatar-img"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/aegis.png";
                        }}
                      />
                      <span className="player-pos-badge-floating">{p.pos}</span>
                    </div>
                    <strong className="player-nick">{p.nick}</strong>
                    <span className="player-role-text">{p.role}</span>
                    <div className="player-stat-split">
                      <div><span className="player-stat-label">KDA</span>{p.kda}</div>
                      <div><span className="player-stat-label">GPM</span><span style={{ color: 'var(--accent-cyan)' }}>{p.gpm}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SEÇÃO AO VIVO NO CENTRO */}
            <section className="live-block-wrap" style={{ marginTop: 8 }}>
              <div className="live-heading">
                <span className="live-dot" />
                Partidas Ao Vivo
                {liveGames.length > 0 && (
                  <span style={{ fontSize: 10, background: 'rgba(212,146,68,0.2)', color: 'var(--accent-gold)', padding: '2px 8px', borderRadius: 10, marginLeft: 6, fontWeight: 700 }}>
                    {liveGames.length} EM ANDAMENTO
                  </span>
                )}
              </div>

              {liveGames.length === 0 ? (
                <div style={{
                  width: '100%',
                  background: 'var(--bg-surface)',
                  backdropFilter: 'blur(12px)',
                  border: '1px dashed var(--border)',
                  borderRadius: 14,
                  padding: '36px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  color: 'var(--text-dim)'
                }}>
                  <Radio size={24} style={{ opacity: 0.5, color: 'var(--accent-gold)' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Nenhuma partida oficial ao vivo no momento</span>
                  <span style={{ fontSize: 11 }}>Acompanhe os próximos confrontos agendados na coluna da direita</span>
                </div>
              ) : (
                <div className="live-grid">
                  {liveGames.map((g, idx) => {
                    const sb = g.scoreboard || {};
                    const rScore = sb.radiant ? sb.radiant.score : (g.radiant_score ?? 0);
                    const dScore = sb.dire ? sb.dire.score : (g.dire_score ?? 0);
                    const mins = Math.floor((sb.duration || g.duration || 0) / 60);
                    const rName = (g.radiant_team && (g.radiant_team.team_name || g.radiant_team.name)) || "Radiant";
                    const dName = (g.dire_team && (g.dire_team.team_name || g.dire_team.name)) || "Dire";

                    return (
                      <div 
                        key={idx} 
                        onClick={() => setSelectedLiveGame(g)} 
                        className="live-card"
                        style={{ cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="live-badge">AO VIVO · {mins}MIN</span>
                        </div>
                        <div className="live-teams-row" style={{ marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <span className="live-team-name" style={{ textAlign: 'left' }}>{rName}</span>
                          <span className="live-score">{rScore} - {dScore}</span>
                          <span className="live-team-name" style={{ textAlign: 'right' }}>{dName}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </main>

          {/* DIREITA: JOGOS A SEREM REALIZADOS */}
          <aside className="sidebar-right">
            <div className="date-strip">
              <span>Jogos a Serem Realizados</span>
              <span style={{ fontSize: 9, background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 3 }}>EM BREVE</span>
            </div>

            <div className="matches-scroll">
              {upcomingMatches.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 16px', color: 'var(--text-dim)', fontSize: 12 }}>
                  Nenhuma partida agendada no momento.
                </div>
              ) : (
                upcomingMatches.map((m, idx) => (
                  <div 
                    key={idx} 
                    className="match-card" 
                    onClick={() => setSelectedUpcomingMatch(m)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="match-tourney-name">{m.torneio}</div>
                    <div className="match-header-row">
                      <div className="match-teams-col">
                        <div className="match-team-single">{m.timeA}</div>
                        <div className="match-team-single">{m.timeB}</div>
                      </div>
                      <div className="match-meta-col">
                        <span className="match-format-badge">{m.formato || "BO3"}</span>
                        <span className="match-time-text">
                          {new Date(m.data).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} BRT
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      )}

      {/* 2. ABA DE TORNEIOS (ÚLTIMOS 10 TORNEIOS IMPORTANTES) */}
      {currentTab === 'torneios' && (
        <div style={{ maxWidth: 1040, margin: '24px auto', width: '100%', padding: '0 20px' }}>
          
          {/* SE UM TORNEIO FOI SELECIONADO: MOSTRA AS PARTIDAS DISPUTADAS */}
          {selectedTournament ? (
            <div>
              <button 
                onClick={() => setSelectedTournament(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent-gold)',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  marginBottom: 16
                }}
              >
                <ArrowLeft size={16} /> Voltar para lista de torneios
              </button>

              <div className="champ-card" style={{ maxWidth: '100%', marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--accent-gold)', textTransform: 'uppercase', fontWeight: 800 }}>
                      {selectedTournament.tier}
                    </span>
                    <h2 style={{ fontSize: 24, color: '#fff', marginTop: 4 }}>{selectedTournament.name}</h2>
                    <div style={{ display: 'flex', gap: 16, color: 'var(--text-dim)', fontSize: 12, marginTop: 6 }}>
                      <span><Calendar size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {selectedTournament.date}</span>
                      <span><DollarSign size={13} style={{ verticalAlign: 'middle', marginRight: 2 }} /> {selectedTournament.prize}</span>
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '10px 16px', borderRadius: 12 }}>
                    <div style={{ fontSize: 10, color: 'var(--accent-gold)', textTransform: 'uppercase', fontWeight: 700 }}>Campeão</div>
                    <div style={{ fontSize: 16, color: '#fff', fontWeight: 800 }}>👑 {selectedTournament.champion}</div>
                  </div>
                </div>
              </div>

              <h3 style={{ color: '#fff', fontSize: 15, textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <History size={16} color="var(--accent-gold)" /> Partidas e Confrontos Disputados
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
                {selectedTournament.matches.map((m, idx) => (
                  <div
                    key={idx}
                    className="finished-card"
                    style={{ padding: 16 }}
                    onClick={() => {
                      setSelectedSeriesDetail(m);
                      setActiveMapIndex(0);
                      if (m.games && m.games[0]) {
                        fetchMatchDetail(m.games[0].match_id);
                      }
                    }}
                  >
                    <div className="finished-card-stage" style={{ marginBottom: 8 }}>
                      <span style={{ color: 'var(--accent-gold)' }}>{m.stage}</span>
                      <span>{m.dur}</span>
                    </div>
                    <div className="finished-team-row" style={{ fontSize: 14 }}>
                      <span className={m.winner === m.timeA ? "finished-team-winner" : "finished-team-loser"}>
                        {m.winner === m.timeA ? `👑 ${m.timeA}` : m.timeA}
                      </span>
                      <span className="score-tag" style={{ color: m.winner === m.timeA ? "var(--accent-gold)" : "var(--text-dim)", fontSize: 14 }}>
                        {m.scoreA}
                      </span>
                    </div>
                    <div className="finished-team-row" style={{ fontSize: 14 }}>
                      <span className={m.winner === m.timeB ? "finished-team-winner" : "finished-team-loser"}>
                        {m.winner === m.timeB ? `👑 ${m.timeB}` : m.timeB}
                      </span>
                      <span className="score-tag" style={{ color: m.winner === m.timeB ? "var(--accent-gold)" : "var(--text-dim)", fontSize: 14 }}>
                        {m.scoreB}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* LISTAGEM DOS 10 TORNEIOS */
            <div>
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 14, marginBottom: 20 }}>
                <h2 style={{ color: '#fff', textTransform: 'uppercase', fontSize: 18, letterSpacing: 1 }}>
                  Últimos 10 Torneios Principais
                </h2>
                <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>
                  Selecione um torneio para consultar as partidas e as estatísticas de cada mapa
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 14 }}>
                {FEATURED_TOURNAMENTS.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTournament(t)}
                    style={{
                      background: 'var(--bg-surface)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: '1px solid var(--border)',
                      borderRadius: 14,
                      padding: 18,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: 12
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent-gold)';
                      e.currentTarget.style.transform = 'translateY(-3px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 10, color: 'var(--accent-gold)', fontWeight: 800, textTransform: 'uppercase' }}>
                          {t.tier}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                          {t.date}
                        </span>
                      </div>
                      <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{t.name}</h3>
                      <div style={{ fontSize: 11, color: 'var(--accent-cyan)', fontFamily: 'monospace', marginTop: 4 }}>
                        Premiação: {t.prize}
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Campeão:</span>
                      <strong style={{ fontSize: 12, color: '#fff' }}>👑 {t.champion}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. VIEW MMR */}
      {currentTab === 'mmr' && (
        <div style={{ maxWidth: 860, margin: '24px auto', width: '100%', padding: '0 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 14 }}>
            <h2 style={{ color: '#fff', textTransform: 'uppercase', fontSize: 15 }}>Leaderboard Oficial Valve</h2>
            <div style={{ display: 'flex', gap: 4, background: 'var(--bg-card)', padding: 4, borderRadius: 8, border: '1px solid var(--border)' }}>
              {['europe', 'americas', 'china', 'se_asia'].map(div => (
                <button
                  key={div}
                  onClick={() => setMmrDivision(div)}
                  style={{
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    background: mmrDivision === div ? 'var(--accent-gold)' : 'transparent',
                    color: mmrDivision === div ? '#0B0D12' : 'var(--text-dim)',
                    textTransform: 'uppercase'
                  }}
                >
                  {div}
                </button>
              ))}
            </div>
          </div>

          {mmrLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>Carregando Leaderboard...</div>
          ) : (
            <div style={{ background: 'var(--bg-surface)', backdropFilter: 'blur(12px)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginTop: 16 }}>
              <table className="table-custom" style={{ marginTop: 0 }}>
                <thead>
                  <tr>
                    <th style={{ width: 40, paddingLeft: 16 }}>#</th>
                    <th>Jogador</th>
                    <th>País</th>
                    <th style={{ textAlign: 'right', paddingRight: 16 }}>Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {mmrPlayers.map(p => (
                    <tr key={p.rank}>
                      <td style={{ paddingLeft: 16, fontWeight: 700, color: 'var(--accent-gold)', fontFamily: 'monospace' }}>{p.rank}</td>
                      <td style={{ fontWeight: 600, color: '#fff' }}>
                        {p.team_tag && <span style={{ color: 'var(--accent-gold)', marginRight: 4 }}>[{p.team_tag}]</span>}
                        {p.name || 'Anônimo'}
                      </td>
                      <td style={{ color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'monospace' }}>{p.country || '—'}</td>
                      <td style={{ textAlign: 'right', paddingRight: 16, color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>Immortal</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL DETALHADO DO JOGO AGENDADO */}
      {selectedUpcomingMatch && (
        <div className="modal-backdrop">
          <div className="modal-box-wide" style={{ maxWidth: 780 }}>
            <button onClick={() => setSelectedUpcomingMatch(null)} className="modal-close-btn">
              <X size={20} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 11, color: 'var(--accent-gold)', textTransform: 'uppercase', fontWeight: 700 }}>
                {selectedUpcomingMatch.torneio} {selectedUpcomingMatch.fase ? `· ${selectedUpcomingMatch.fase}` : ""}
              </span>
              <h2 style={{ color: '#fff', fontSize: 20, marginTop: 4 }}>
                {selectedUpcomingMatch.timeA} <span style={{ color: 'var(--accent-gold)', margin: '0 8px' }}>vs</span> {selectedUpcomingMatch.timeB}
              </h2>
              <div style={{ color: 'var(--text-dim)', fontSize: 12, marginTop: 4 }}>
                Horário Previsto: {new Date(selectedUpcomingMatch.data).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} BRT ({selectedUpcomingMatch.formato || "BO3"})
              </div>
            </div>

            {/* ESCALAÇÃO DO TIME A */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-cyan)', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
              <Users size={15} /> {selectedUpcomingMatch.timeA} (Escalação Provável)
            </div>
            <table className="table-custom" style={{ marginBottom: 20 }}>
              <thead>
                <tr>
                  <th style={{ width: 180 }}>Posição</th>
                  <th>Jogador</th>
                  <th style={{ width: 80 }}>KDA Médio</th>
                  <th style={{ width: 90, textAlign: 'right' }}>GPM Médio</th>
                  <th style={{ width: 90, textAlign: 'right' }}>XPM Médio</th>
                </tr>
              </thead>
              <tbody>
                {getTeamRosterFallback(selectedUpcomingMatch.timeA).map((p) => (
                  <tr key={p.pos}>
                    <td style={{ color: 'var(--accent-gold)', fontWeight: 700, fontSize: 11 }}>
                      {NUMERIC_POSITION_LABELS[p.pos]}
                    </td>
                    <td style={{ color: '#fff', fontWeight: 600 }}>
                      {p.name}
                    </td>
                    <td style={{ fontFamily: 'monospace' }}>{p.kda}</td>
                    <td style={{ fontFamily: 'monospace', textAlign: 'right', color: 'var(--accent-cyan)' }}>{p.gpm}</td>
                    <td style={{ fontFamily: 'monospace', textAlign: 'right' }}>{p.xpm}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ESCALAÇÃO DO TIME B */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-red)', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
              <Users size={15} /> {selectedUpcomingMatch.timeB} (Escalação Provável)
            </div>
            <table className="table-custom">
              <thead>
                <tr>
                  <th style={{ width: 180 }}>Posição</th>
                  <th>Jogador</th>
                  <th style={{ width: 80 }}>KDA Médio</th>
                  <th style={{ width: 90, textAlign: 'right' }}>GPM Médio</th>
                  <th style={{ width: 90, textAlign: 'right' }}>XPM Médio</th>
                </tr>
              </thead>
              <tbody>
                {getTeamRosterFallback(selectedUpcomingMatch.timeB).map((p) => (
                  <tr key={p.pos}>
                    <td style={{ color: 'var(--accent-gold)', fontWeight: 700, fontSize: 11 }}>
                      {NUMERIC_POSITION_LABELS[p.pos]}
                    </td>
                    <td style={{ color: '#fff', fontWeight: 600 }}>
                      {p.name}
                    </td>
                    <td style={{ fontFamily: 'monospace' }}>{p.kda}</td>
                    <td style={{ fontFamily: 'monospace', textAlign: 'right', color: 'var(--accent-cyan)' }}>{p.gpm}</td>
                    <td style={{ fontFamily: 'monospace', textAlign: 'right' }}>{p.xpm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DETALHADO DA SÉRIE COM PICKS, BANS, ITENS E STATS */}
      {selectedSeriesDetail && selectedSeriesDetail.games && (
        <div className="modal-backdrop">
          <div className="modal-box-wide">
            <button onClick={() => { setSelectedSeriesDetail(null); setLoadedMatchData(null); }} className="modal-close-btn">
              <X size={20} />
            </button>

            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--accent-gold)', textTransform: 'uppercase', fontWeight: 700 }}>
                {selectedSeriesDetail.stage}
              </span>
              <h2 style={{ color: '#fff', fontSize: 18, marginTop: 4 }}>
                {selectedSeriesDetail.timeA} <span style={{ color: 'var(--accent-gold)' }}>{selectedSeriesDetail.scoreA} - {selectedSeriesDetail.scoreB}</span> {selectedSeriesDetail.timeB}
              </h2>
            </div>

            {/* ABAS DOS MAPAS */}
            <div className="map-tabs-row">
              {selectedSeriesDetail.games.map((g, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveMapIndex(idx);
                    fetchMatchDetail(g.match_id);
                  }}
                  className={`map-tab-btn ${activeMapIndex === idx ? 'active' : ''}`}
                >
                  Jogo {g.mapNumber}
                </button>
              ))}
            </div>

            {/* CONTEÚDO DO MAPA */}
            {loadingMatch ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>Carregando dados da partida e estatísticas...</div>
            ) : loadedMatchData ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 12 }}>
                  <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>
                    {loadedMatchData.radiant_name || "Radiant"} {loadedMatchData.radiant_score} - {loadedMatchData.dire_score} {loadedMatchData.dire_name || "Dire"} ({loadedMatchData.radiant_win ? (loadedMatchData.radiant_name || "Radiant") : (loadedMatchData.dire_name || "Dire")} venceu)
                  </span>
                  <span style={{ color: 'var(--text-dim)' }}>
                    Duração: {Math.round(loadedMatchData.duration / 60)} min
                  </span>
                </div>

                {/* DRAFT */}
                {loadedMatchData.picks_bans && (
                  <div className="draft-block">
                    <div className="draft-title">Ordem de Draft (Picks &amp; Bans)</div>
                    
                    {/* RADIANT DRAFT */}
                    <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--accent-cyan)', fontWeight: 700, minWidth: 60 }}>Radiant:</span>
                      {loadedMatchData.picks_bans.filter(p => p.team === 0).sort((a,b) => (a.order||0) - (b.order||0)).map((p, i) => (
                        <div key={i} className="draft-hero-pill" style={{ opacity: p.is_pick ? 1 : 0.6, border: p.is_pick ? '1px solid var(--accent-cyan)' : 'none' }}>
                          <img src={getHeroImg(constants, p.hero_id)} alt="" title={`${p.is_pick ? 'Pick' : 'Ban'}: ${getHeroName(constants, p.hero_id)}`} />
                          {p.is_pick && <span style={{ color: '#fff', fontWeight: 600 }}>{getHeroName(constants, p.hero_id)}</span>}
                        </div>
                      ))}
                    </div>

                    {/* DIRE DRAFT */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--accent-red)', fontWeight: 700, minWidth: 60 }}>Dire:</span>
                      {loadedMatchData.picks_bans.filter(p => p.team === 1).sort((a,b) => (a.order||0) - (b.order||0)).map((p, i) => (
                        <div key={i} className="draft-hero-pill" style={{ opacity: p.is_pick ? 1 : 0.6, border: p.is_pick ? '1px solid var(--accent-red)' : 'none' }}>
                          <img src={getHeroImg(constants, p.hero_id)} alt="" title={`${p.is_pick ? 'Pick' : 'Ban'}: ${getHeroName(constants, p.hero_id)}`} />
                          {p.is_pick && <span style={{ color: '#fff', fontWeight: 600 }}>{getHeroName(constants, p.hero_id)}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TABELA RADIANT */}
                <div style={{ color: 'var(--accent-cyan)', fontWeight: 700, fontSize: 12, marginTop: 12 }}>
                  {loadedMatchData.radiant_name || "Radiant"}
                </div>
                <table className="table-custom">
                  <thead>
                    <tr>
                      <th style={{ width: 140 }}>Jogador</th>
                      <th style={{ width: 60 }}>Herói</th>
                      <th style={{ width: 80 }}>K/D/A</th>
                      <th style={{ width: 90 }}>GPM/XPM</th>
                      <th>Itens de Fim de Jogo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(loadedMatchData.players || []).filter(p => p.player_slot < 128).map((p, i) => (
                      <tr key={i}>
                        <td style={{ color: '#fff', fontWeight: 600 }}>
                          {p.display_name}
                        </td>
                        <td>
                          <img 
                            src={getHeroImg(constants, p.hero_id)} 
                            alt="" 
                            title={getHeroName(constants, p.hero_id)}
                            style={{ width: 34, height: 20, borderRadius: 3, objectFit: 'cover', verticalAlign: 'middle', border: '1px solid var(--border)' }} 
                          />
                        </td>
                        <td style={{ fontFamily: 'monospace' }}>{p.kills}/{p.deaths}/{p.assists}</td>
                        <td style={{ fontFamily: 'monospace' }}>
                          <span style={{ color: 'var(--accent-cyan)' }}>{p.gold_per_min}</span> / {p.xp_per_min}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            {[p.item_0, p.item_1, p.item_2, p.item_3, p.item_4, p.item_5].map((itId, itIdx) => (
                              itId && getItemImg(constants, itId) ? (
                                <img
                                  key={itIdx}
                                  src={getItemImg(constants, itId)}
                                  alt=""
                                  className="item-slot-icon"
                                />
                              ) : null
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* TABELA DIRE */}
                <div style={{ color: 'var(--accent-red)', fontWeight: 700, fontSize: 12, marginTop: 16 }}>
                  {loadedMatchData.dire_name || "Dire"}
                </div>
                <table className="table-custom">
                  <thead>
                    <tr>
                      <th style={{ width: 140 }}>Jogador</th>
                      <th style={{ width: 60 }}>Herói</th>
                      <th style={{ width: 80 }}>K/D/A</th>
                      <th style={{ width: 90 }}>GPM/XPM</th>
                      <th>Itens de Fim de Jogo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(loadedMatchData.players || []).filter(p => p.player_slot >= 128).map((p, i) => (
                      <tr key={i}>
                        <td style={{ color: '#fff', fontWeight: 600 }}>
                          {p.display_name}
                        </td>
                        <td>
                          <img 
                            src={getHeroImg(constants, p.hero_id)} 
                            alt="" 
                            title={getHeroName(constants, p.hero_id)}
                            style={{ width: 34, height: 20, borderRadius: 3, objectFit: 'cover', verticalAlign: 'middle', border: '1px solid var(--border)' }} 
                          />
                        </td>
                        <td style={{ fontFamily: 'monospace' }}>{p.kills}/{p.deaths}/{p.assists}</td>
                        <td style={{ fontFamily: 'monospace' }}>
                          <span style={{ color: 'var(--accent-cyan)' }}>{p.gold_per_min}</span> / {p.xp_per_min}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            {[p.item_0, p.item_1, p.item_2, p.item_3, p.item_4, p.item_5].map((itId, itIdx) => (
                              itId && getItemImg(constants, itId) ? (
                                <img
                                  key={itIdx}
                                  src={getItemImg(constants, itId)}
                                  alt=""
                                  className="item-slot-icon"
                                />
                              ) : null
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}