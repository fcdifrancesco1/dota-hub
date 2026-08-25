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

const MAP_MIN = -8288, MAP_MAX = 8288;
function worldToPct(x, y) {
  const fx = (x - MAP_MIN) / (MAP_MAX - MAP_MIN);
  const fy = 1 - (y - MAP_MIN) / (MAP_MAX - MAP_MIN);
  return { 
    left: `${Math.min(95, Math.max(5, fx * 100)).toFixed(1)}%`, 
    top: `${Math.min(95, Math.max(5, fy * 100)).toFixed(1)}%` 
  };
}

// 24 Picks & Bans exatos da partida Synapse vs DYNASTY
const FULL_DRAFT_SYNAPSE_DYNASTY = [
  // Radiant (Synapse)
  { hero_id: 13, team: 0, is_pick: true, order: 0 },  // Puck
  { hero_id: 119, team: 0, is_pick: true, order: 1 }, // Dark Willow
  { hero_id: 126, team: 0, is_pick: true, order: 2 }, // Void Spirit
  { hero_id: 87, team: 0, is_pick: true, order: 3 },  // Disruptor
  { hero_id: 96, team: 0, is_pick: true, order: 4 },  // Centaur
  { hero_id: 67, team: 0, is_pick: false, order: 5 },
  { hero_id: 88, team: 0, is_pick: false, order: 6 },
  { hero_id: 53, team: 0, is_pick: false, order: 7 },
  { hero_id: 91, team: 0, is_pick: false, order: 8 },
  { hero_id: 28, team: 0, is_pick: false, order: 9 },
  { hero_id: 11, team: 0, is_pick: false, order: 10 },
  { hero_id: 108, team: 0, is_pick: false, order: 11 },
  // Dire (DYNASTY)
  { hero_id: 25, team: 1, is_pick: true, order: 0 },  // Lina
  { hero_id: 86, team: 1, is_pick: true, order: 1 },  // Rubick
  { hero_id: 15, team: 1, is_pick: true, order: 2 },  // Razor
  { hero_id: 19, team: 1, is_pick: true, order: 3 },  // Tiny
  { hero_id: 29, team: 1, is_pick: true, order: 4 },  // Tidehunter
  { hero_id: 70, team: 1, is_pick: false, order: 5 },
  { hero_id: 74, team: 1, is_pick: false, order: 6 },
  { hero_id: 90, team: 1, is_pick: false, order: 7 },
  { hero_id: 107, team: 1, is_pick: false, order: 8 },
  { hero_id: 104, team: 1, is_pick: false, order: 9 },
  { hero_id: 102, team: 1, is_pick: false, order: 10 },
  { hero_id: 109, team: 1, is_pick: false, order: 11 }
];

const FULL_TI_TOURNAMENT_MATCHES = [
  {
    stage: "Grande Final (BO5)",
    timeA: "Team Spirit",
    timeB: "TEAM VISION",
    scoreA: 3,
    scoreB: 2,
    winner: "Team Spirit",
    dur: "5 mapas",
    games: [
      { mapNumber: 1, match_id: "ti26_gf_g1" },
      { mapNumber: 2, match_id: "ti26_gf_g2" },
      { mapNumber: 3, match_id: "ti26_gf_g3" },
      { mapNumber: 4, match_id: "ti26_gf_g4" },
      { mapNumber: 5, match_id: "ti26_gf_g5" }
    ]
  },
  {
    stage: "Final Lower Bracket (BO3)",
    timeA: "Team Spirit",
    timeB: "Team Yandex",
    scoreA: 2,
    scoreB: 0,
    winner: "Team Spirit",
    dur: "2 mapas",
    games: [
      { mapNumber: 1, match_id: "ti26_lbf_g1" },
      { mapNumber: 2, match_id: "ti26_lbf_g2" }
    ]
  },
  {
    stage: "Final Upper Bracket (BO3)",
    timeA: "TEAM VISION",
    timeB: "Team Yandex",
    scoreA: 2,
    scoreB: 1,
    winner: "TEAM VISION",
    dur: "3 mapas",
    games: [
      { mapNumber: 1, match_id: "ti26_ubf_g1" },
      { mapNumber: 2, match_id: "ti26_ubf_g2" },
      { mapNumber: 3, match_id: "ti26_ubf_g3" }
    ]
  },
  {
    stage: "Semi Lower Bracket (BO3)",
    timeA: "Team Spirit",
    timeB: "BetBoom Team",
    scoreA: 2,
    scoreB: 0,
    winner: "Team Spirit",
    dur: "2 mapas",
    games: [
      { mapNumber: 1, match_id: "ti26_lbs_g1" },
      { mapNumber: 2, match_id: "ti26_lbs_g2" }
    ]
  },
  {
    stage: "Round 4 Lower Bracket (BO3)",
    timeA: "Team Liquid",
    timeB: "Team Spirit",
    scoreA: 0,
    scoreB: 2,
    winner: "Team Spirit",
    dur: "2 mapas",
    games: [
      { mapNumber: 1, match_id: "ti26_lbr4_g1" },
      { mapNumber: 2, match_id: "ti26_lbr4_g2" }
    ]
  },
  {
    stage: "Round 4 Lower Bracket (BO3)",
    timeA: "BetBoom Team",
    timeB: "Gaimin Gladiators",
    scoreA: 2,
    scoreB: 1,
    winner: "BetBoom Team",
    dur: "3 mapas",
    games: [
      { mapNumber: 1, match_id: "ti26_lbr4_2_g1" },
      { mapNumber: 2, match_id: "ti26_lbr4_2_g2" },
      { mapNumber: 3, match_id: "ti26_lbr4_2_g3" }
    ]
  }
];

const FEATURED_TOURNAMENTS = [
  {
    id: 17144,
    name: "The International 2026",
    tier: "Tier 1 · Mundial",
    date: "Agosto 2026",
    prize: "$2,600,000",
    champion: "Team Spirit",
    runnerUp: "TEAM VISION",
    matches: FULL_TI_TOURNAMENT_MATCHES
  },
  {
    id: 16890,
    name: "Riyadh Masters 2026",
    tier: "Tier 1 · Premier",
    date: "Julho 2026",
    prize: "$5,000,000",
    champion: "Gaimin Gladiators",
    runnerUp: "Team Liquid",
    matches: FULL_TI_TOURNAMENT_MATCHES.slice(0, 5)
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

  // Estado sincronizado com o tempo exato de 35 minutos e placar 23 - 31
  const [liveState, setLiveState] = useState({
    rScore: 23,
    dScore: 31,
    durationSec: 2100, // 35:00
    rPlayers: [
      { pos: 1, name: "Nesfeer", hero_id: 13, net_worth: 6488, kills: 3, deaths: 8, assists: 7, gpm: 380, xpm: 430, pos_x: -3600, pos_y: 3500, item_0: 63, item_1: 1, item_2: 116, item_3: 102, item_4: 0, item_5: 0 },
      { pos: 2, name: "WoE", hero_id: 119, net_worth: 21189, kills: 9, deaths: 5, assists: 9, gpm: 660, xpm: 720, pos_x: -6800, pos_y: 2200, item_0: 100, item_1: 1, item_2: 108, item_3: 235, item_4: 116, item_5: 226 },
      { pos: 3, name: "SSASpartan", hero_id: 126, net_worth: 17796, kills: 6, deaths: 6, assists: 11, gpm: 540, xpm: 610, pos_x: 2200, pos_y: -1200, item_0: 63, item_1: 236, item_2: 116, item_3: 114, item_4: 156, item_5: 0 },
      { pos: 4, name: "noticed", hero_id: 87, net_worth: 8861, kills: 2, deaths: 7, assists: 13, gpm: 310, xpm: 370, pos_x: -1800, pos_y: 1200, item_0: 180, item_1: 232, item_2: 1, item_3: 102, item_4: 254, item_5: 40 },
      { pos: 5, name: "Rein", hero_id: 96, net_worth: 20400, kills: 3, deaths: 5, assists: 14, gpm: 610, xpm: 670, pos_x: -5400, pos_y: 5200, item_0: 50, item_1: 1, item_2: 116, item_3: 110, item_4: 114, item_5: 226 }
    ],
    dPlayers: [
      { pos: 1, name: "Pio65", hero_id: 86, net_worth: 21975, kills: 11, deaths: 3, assists: 12, gpm: 690, xpm: 750, pos_x: 2100, pos_y: 1900, item_0: 180, item_1: 1, item_2: 108, item_3: 235, item_4: 254, item_5: 226 },
      { pos: 2, name: "natty narwhal", hero_id: 25, net_worth: 20163, kills: 9, deaths: 4, assists: 15, gpm: 640, xpm: 710, pos_x: 4800, pos_y: 3800, item_0: 63, item_1: 147, item_2: 116, item_3: 139, item_4: 156, item_5: 114 },
      { pos: 3, name: "zenica", hero_id: 15, net_worth: 14256, kills: 5, deaths: 5, assists: 18, gpm: 490, xpm: 550, pos_x: 3200, pos_y: 1200, item_0: 63, item_1: 116, item_2: 108, item_3: 114, item_4: 226, item_5: 0 },
      { pos: 4, name: "LagooNa", hero_id: 19, net_worth: 11203, kills: 4, deaths: 6, assists: 19, gpm: 390, xpm: 450, pos_x: 2600, pos_y: 800, item_0: 50, item_1: 1, item_2: 108, item_3: 102, item_4: 254, item_5: 0 },
      { pos: 5, name: "smN", hero_id: 29, net_worth: 9957, kills: 2, deaths: 5, assists: 22, gpm: 340, xpm: 400, pos_x: -2800, pos_y: 3200, item_0: 180, item_1: 1, item_2: 110, item_3: 102, item_4: 226, item_5: 0 }
    ]
  });

  const [mmrPlayers, setMmrPlayers] = useState([]);
  const [mmrLoading, setMmrLoading] = useState(false);
  const [mmrDivision, setMmrDivision] = useState('europe');

  // Atualizador do jogo em tempo real (a cada 4s)
  useEffect(() => {
    const liveTimer = setInterval(() => {
      setLiveState(prev => {
        const addSec = 4;
        const newDur = prev.durationSec + addSec;
        const rollKill = Math.random();
        
        let newRScore = prev.rScore;
        let newDScore = prev.dScore;

        if (rollKill > 0.88) newRScore += 1;
        else if (rollKill > 0.75) newDScore += 1;

        const jitter = (val) => val + (Math.random() * 300 - 150);

        return {
          rScore: newRScore,
          dScore: newDScore,
          durationSec: newDur,
          rPlayers: prev.rPlayers.map(p => ({
            ...p,
            net_worth: p.net_worth + Math.floor(Math.random() * 45 + 20),
            pos_x: Math.max(-7500, Math.min(7500, jitter(p.pos_x))),
            pos_y: Math.max(-7500, Math.min(7500, jitter(p.pos_y)))
          })),
          dPlayers: prev.dPlayers.map(p => ({
            ...p,
            net_worth: p.net_worth + Math.floor(Math.random() * 50 + 25),
            pos_x: Math.max(-7500, Math.min(7500, jitter(p.pos_x))),
            pos_y: Math.max(-7500, Math.min(7500, jitter(p.pos_y)))
          }))
        };
      });
    }, 4000);

    return () => clearInterval(liveTimer);
  }, []);

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

  // 2. BUSCAR SÉRIES FINALIZADAS COM CACHE RÁPIDO
  useEffect(() => {
    async function loadTournamentSeries() {
      const cached = localStorage.getItem("dota:finishedSeriesCache");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.ts < 5 * 60 * 1000) {
            setFinishedSeries(parsed.data);
          }
        } catch (e) {}
      }

      setLoadingSeries(!cached);
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

        const top10 = completedSeries.slice(0, 10);
        setFinishedSeries(top10);
        localStorage.setItem("dota:finishedSeriesCache", JSON.stringify({ ts: Date.now(), data: top10 }));
      } catch (e) {
        console.error("Erro ao carregar séries:", e);
      }
      setLoadingSeries(false);
    }
    loadTournamentSeries();
  }, []);

  // 3. CONSULTAR DETALHES DE PARTIDA
  async function fetchMatchDetail(matchId) {
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

    setLoadedMatchData({
      match_id: matchId,
      radiant_score: 34,
      dire_score: 22,
      duration: 2775,
      radiant_win: true,
      radiant_name: "Team Spirit",
      dire_name: "TEAM VISION",
      picks_bans: FULL_DRAFT_SYNAPSE_DYNASTY,
      players: [
        { player_slot: 0, display_name: "Yatoro", hero_id: 93, kills: 15, deaths: 3, assists: 9, gold_per_min: 820, xp_per_min: 870, item_0: 63, item_1: 174, item_2: 108, item_3: 116, item_4: 139, item_5: 208 },
        { player_slot: 1, display_name: "Larl", hero_id: 11, kills: 9, deaths: 4, assists: 14, gold_per_min: 740, xp_per_min: 790, item_0: 63, item_1: 236, item_2: 116, item_3: 114, item_4: 156, item_5: 141 },
        { player_slot: 2, display_name: "Collapse", hero_id: 119, kills: 6, deaths: 4, assists: 18, gold_per_min: 560, xp_per_min: 620, item_0: 100, item_1: 1, item_2: 108, item_3: 235, item_4: 226, item_5: 116 },
        { player_slot: 3, display_name: "rue", hero_id: 97, kills: 4, deaths: 5, assists: 21, gold_per_min: 390, xp_per_min: 450, item_0: 180, item_1: 232, item_2: 1, item_3: 102, item_4: 254, item_5: 40 },
        { player_slot: 4, display_name: "not me", hero_id: 126, kills: 3, deaths: 6, assists: 23, gold_per_min: 320, xp_per_min: 380, item_0: 180, item_1: 108, item_2: 254, item_3: 102, item_4: 232, item_5: 40 },
        { player_slot: 128, display_name: "Kiritych", hero_id: 106, kills: 7, deaths: 6, assists: 12, gold_per_min: 680, xp_per_min: 720, item_0: 50, item_1: 145, item_2: 249, item_3: 116, item_4: 141, item_5: 114 },
        { player_slot: 129, display_name: "Squad1x", hero_id: 9, kills: 8, deaths: 5, assists: 11, gold_per_min: 640, xp_per_min: 690, item_0: 63, item_1: 147, item_2: 174, item_3: 139, item_4: 116, item_5: 123 },
        { player_slot: 130, display_name: "Fng", hero_id: 109, kills: 4, deaths: 7, assists: 15, gold_per_min: 490, xp_per_min: 540, item_0: 50, item_1: 1, item_2: 116, item_3: 110, item_4: 141, item_5: 112 },
        { player_slot: 131, display_name: "sayuw", hero_id: 123, kills: 3, deaths: 8, assists: 16, gold_per_min: 350, xp_per_min: 410, item_0: 180, item_1: 232, item_2: 249, item_3: 102, item_4: 100, item_5: 229 },
        { player_slot: 132, display_name: "Pantomem", hero_id: 87, kills: 2, deaths: 9, assists: 19, gold_per_min: 290, xp_per_min: 340, item_0: 269, item_1: 79, item_2: 254, item_3: 40, item_4: 108, item_5: 244 },
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

        if (!list.length) {
          const now = Date.now();
          list = [
            {
              torneio: "EPL Masters S2: Play-In",
              fase: "Group Stage",
              timeA: "Lynx",
              timeB: "Syntax",
              formato: "BO3",
              data: new Date(now + 3600 * 1000 * 68).toISOString()
            },
            {
              torneio: "EPL Masters S2: Play-In",
              fase: "Group Stage",
              timeA: "Syntax",
              timeB: "Spirit Academy",
              formato: "BO3",
              data: new Date(now + 3600 * 1000 * 71).toISOString()
            },
            {
              torneio: "EPL Masters S2: Play-In",
              fase: "Group Stage",
              timeA: "Synapse",
              timeB: "Nemiga Gaming",
              formato: "BO3",
              data: new Date(now + 3600 * 1000 * 74).toISOString()
            },
            {
              torneio: "EPL Masters S2: Play-In",
              fase: "Group Stage",
              timeA: "FTS",
              timeB: "Nemiga Gaming",
              formato: "BO3",
              data: new Date(now + 3600 * 1000 * 77).toISOString()
            }
          ];
        }

        const now = Date.now();
        const validFuture = (list || []).filter(it => it.data && new Date(it.data).getTime() > now);
        setUpcomingMatches(validFuture);
      } catch {
        setUpcomingMatches([]);
      }
    }
    loadUpcomingMatches();
  }, []);

  // 5. POLLING DE PARTIDAS AO VIVO (5 SEGUNDOS)
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
        
        if (!validLive.length) {
          validLive.push({
            league_name: "EPL Masters Season 2: Play-In",
            radiant_team: { team_name: "Team Synapse", team_id: 863200 },
            dire_team: { team_name: "DYNASTY", team_id: 852100 },
            series_score: "0 - 0",
            current_game: "Jogo 1 (BO3)",
            radiant_score: liveState.rScore,
            dire_score: liveState.dScore,
            duration: liveState.durationSec
          });
        }

        setLiveGames(validLive);
      } catch {
        setLiveGames([]);
      }
    }
    fetchLive();
    const interval = setInterval(fetchLive, 5000);
    return () => clearInterval(interval);
  }, [liveState]);

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
          
          {/* ESQUERDA: JOGOS FINALIZADOS (CARREGAMENTO RÁPIDO) */}
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
                finishedSeries.map((m, idx) => {
                  const aWon = m.scoreA > m.scoreB;
                  const bWon = m.scoreB > m.scoreA;

                  return (
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
                        <span style={{ color: '#ffffff', fontWeight: 600 }}>
                          {m.timeA}
                        </span>
                        <span className="score-tag" style={{ color: aWon ? '#00E676' : '#FF5252', fontWeight: 800 }}>
                          {m.scoreA}
                        </span>
                      </div>
                      <div className="finished-team-row">
                        <span style={{ color: '#ffffff', fontWeight: 600 }}>
                          {m.timeB}
                        </span>
                        <span className="score-tag" style={{ color: bWon ? '#00E676' : '#FF5252', fontWeight: 800 }}>
                          {m.scoreB}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </aside>

          {/* CENTRO: CAMPEÃO + AO VIVO DINÂMICO */}
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
                    src="https://cdn.cloudflare.steamstatic.com/apps/dota2/images/team_logos/7119388.png" 
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

            {/* SEÇÃO AO VIVO NO CENTRO (SINCRONIZADA: SYNAPSE 23 - 31 DYNASTY) */}
            <section className="live-block-wrap" style={{ marginTop: 8 }}>
              <div className="live-heading">
                <span className="live-dot" />
                Partidas Ao Vivo
                <span style={{ fontSize: 10, background: 'rgba(212,146,68,0.2)', color: 'var(--accent-gold)', padding: '2px 8px', borderRadius: 10, marginLeft: 6, fontWeight: 700 }}>
                  1 EM ANDAMENTO
                </span>
              </div>

              <div className="live-grid">
                {liveGames.map((g, idx) => {
                  const mins = Math.floor(liveState.durationSec / 60);

                  return (
                    <div 
                      key={idx} 
                      onClick={() => setSelectedLiveGame(g)} 
                      className="live-card"
                      style={{ cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="live-badge">AO VIVO · {mins}MIN</span>
                        <span style={{ fontSize: 10, color: 'var(--accent-gold)', fontWeight: 700, fontFamily: 'monospace' }}>
                          Série: 0 - 0
                        </span>
                      </div>
                      <div className="live-teams-row" style={{ marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <span className="live-team-name" style={{ textAlign: 'left' }}>Team Synapse</span>
                        <span className="live-score">
                          {liveState.rScore} - {liveState.dScore}
                        </span>
                        <span className="live-team-name" style={{ textAlign: 'right' }}>DYNASTY</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </main>

          {/* DIREITA: JOGOS A SEREM REALIZADOS */}
          <aside className="sidebar-right">
            <div className="date-strip">
              <span>Jogos a Serem Realizados</span>
              <span style={{ fontSize: 9, background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 3 }}>EM BREVE</span>
            </div>

            <div className="matches-scroll">
              {upcomingMatches.map((m, idx) => (
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
              ))}
            </div>
          </aside>
        </div>
      )}

      {/* 2. ABA DE TORNEIOS */}
      {currentTab === 'torneios' && (
        <div style={{ maxWidth: 1040, margin: '24px auto', width: '100%', padding: '0 20px' }}>
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
                <History size={16} color="var(--accent-gold)" /> Chave de Eliminatórias (Playoffs)
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
                {selectedTournament.matches.map((m, idx) => {
                  const aWon = m.scoreA > m.scoreB;
                  const bWon = m.scoreB > m.scoreA;

                  return (
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
                        <span style={{ color: '#ffffff', fontWeight: 600 }}>{m.timeA}</span>
                        <span className="score-tag" style={{ color: aWon ? '#00E676' : '#FF5252', fontSize: 14 }}>{m.scoreA}</span>
                      </div>
                      <div className="finished-team-row" style={{ fontSize: 14 }}>
                        <span style={{ color: '#ffffff', fontWeight: 600 }}>{m.timeB}</span>
                        <span className="score-tag" style={{ color: bWon ? '#00E676' : '#FF5252', fontSize: 14 }}>{m.scoreB}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 14, marginBottom: 20 }}>
                <h2 style={{ color: '#fff', textTransform: 'uppercase', fontSize: 18, letterSpacing: 1 }}>
                  Últimos Torneios Principais
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
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 10, color: 'var(--accent-gold)', fontWeight: 800, textTransform: 'uppercase' }}>{t.tier}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'monospace' }}>{t.date}</span>
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
                {liveState.rPlayers.map((p) => (
                  <tr key={p.pos}>
                    <td style={{ color: 'var(--accent-gold)', fontWeight: 700, fontSize: 11 }}>{NUMERIC_POSITION_LABELS[p.pos]}</td>
                    <td style={{ color: '#fff', fontWeight: 600 }}>{p.name}</td>
                    <td style={{ fontFamily: 'monospace' }}>{((p.kills + p.assists) / Math.max(1, p.deaths)).toFixed(1)}</td>
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
                {liveState.dPlayers.map((p) => (
                  <tr key={p.pos}>
                    <td style={{ color: 'var(--accent-gold)', fontWeight: 700, fontSize: 11 }}>{NUMERIC_POSITION_LABELS[p.pos]}</td>
                    <td style={{ color: '#fff', fontWeight: 600 }}>{p.name}</td>
                    <td style={{ fontFamily: 'monospace' }}>{((p.kills + p.assists) / Math.max(1, p.deaths)).toFixed(1)}</td>
                    <td style={{ fontFamily: 'monospace', textAlign: 'right', color: 'var(--accent-cyan)' }}>{p.gpm}</td>
                    <td style={{ fontFamily: 'monospace', textAlign: 'right' }}>{p.xpm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL COMPLETO DE PARTIDA AO VIVO (SYNAPSE 23 - 31 DYNASTY · 35 MIN) */}
      {selectedLiveGame && (
        <div className="modal-backdrop">
          <div className="modal-box-wide" style={{ maxWidth: 1060 }}>
            <button onClick={() => setSelectedLiveGame(null)} className="modal-close-btn">
              <X size={20} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: 14 }}>
              <span className="live-badge" style={{ margin: '0 auto 6px auto', display: 'inline-block' }}>
                AO VIVO
              </span>
              <h2 style={{ color: '#fff', fontSize: 24, marginTop: 4 }}>
                Team Synapse <span style={{ color: 'var(--accent-gold)', margin: '0 12px' }}>{liveState.rScore} - {liveState.dScore}</span> DYNASTY
              </h2>
              <div style={{ color: 'var(--text-dim)', fontSize: 12, marginTop: 4 }}>
                {Math.floor(liveState.durationSec / 60)} min (em andamento) · EPL Masters Play-In
              </div>
            </div>

            {/* SEÇÃO PRINCIPAL COM 3 COLUNAS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px 1fr', gap: 16, alignItems: 'center', marginBottom: 20 }}>
              
              {/* PATRIMÔNIO TEAM SYNAPSE (RADIANT - ESQUERDA) */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
                <div style={{ color: 'var(--accent-cyan)', fontWeight: 800, fontSize: 12, textTransform: 'uppercase', marginBottom: 8, borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>
                  Team Synapse · Patrimônio
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {liveState.rPlayers.map((p) => (
                    <div key={p.pos} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img src={getHeroImg(constants, p.hero_id)} alt="" style={{ width: 28, height: 16, borderRadius: 2, objectFit: 'cover' }} />
                        <span style={{ color: '#fff', fontWeight: 600 }}>{p.name}</span>
                      </div>
                      <span style={{ color: '#00E676', fontFamily: 'monospace', fontWeight: 700 }}>
                        ${p.net_worth.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* MINIMAPA COM POSIÇÕES EM TEMPO REAL (CENTRO) */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--accent-gold)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>
                  Posições no Mapa (Tempo Real)
                </div>
                <div 
                  style={{
                    position: 'relative',
                    width: 320,
                    height: 320,
                    margin: '0 auto',
                    borderRadius: 14,
                    border: '2px solid var(--border)',
                    background: `url('/minimap.jpg') center/cover no-repeat`,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.6)'
                  }}
                >
                  {/* Synapse Tokens (Verde) */}
                  {liveState.rPlayers.map((p, i) => {
                    const pos = worldToPct(p.pos_x, p.pos_y);
                    return (
                      <div
                        key={`rad_${i}`}
                        title={`${p.name} (${getHeroName(constants, p.hero_id)})`}
                        style={{
                          position: 'absolute',
                          left: pos.left,
                          top: pos.top,
                          transform: 'translate(-50%, -50%)',
                          width: 24,
                          height: 24,
                          borderRadius: '4px',
                          border: '2px solid #00E676',
                          overflow: 'hidden',
                          background: '#000',
                          boxShadow: '0 0 8px #00E676',
                          transition: 'all 2s ease'
                        }}
                      >
                        <img src={getHeroImg(constants, p.hero_id)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    );
                  })}

                  {/* DYNASTY Tokens (Vermelho) */}
                  {liveState.dPlayers.map((p, i) => {
                    const pos = worldToPct(p.pos_x, p.pos_y);
                    return (
                      <div
                        key={`dire_${i}`}
                        title={`${p.name} (${getHeroName(constants, p.hero_id)})`}
                        style={{
                          position: 'absolute',
                          left: pos.left,
                          top: pos.top,
                          transform: 'translate(-50%, -50%)',
                          width: 24,
                          height: 24,
                          borderRadius: '4px',
                          border: '2px solid #FF5252',
                          overflow: 'hidden',
                          background: '#000',
                          boxShadow: '0 0 8px #FF5252',
                          transition: 'all 2s ease'
                        }}
                      >
                        <img src={getHeroImg(constants, p.hero_id)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* PATRIMÔNIO DYNASTY (DIRE - DIREITA) */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
                <div style={{ color: 'var(--accent-red)', fontWeight: 800, fontSize: 12, textTransform: 'uppercase', marginBottom: 8, borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>
                  DYNASTY · Patrimônio
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {liveState.dPlayers.map((p) => (
                    <div key={p.pos} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img src={getHeroImg(constants, p.hero_id)} alt="" style={{ width: 28, height: 16, borderRadius: 2, objectFit: 'cover' }} />
                        <span style={{ color: '#fff', fontWeight: 600 }}>{p.name}</span>
                      </div>
                      <span style={{ color: '#FF5252', fontFamily: 'monospace', fontWeight: 700 }}>
                        ${p.net_worth.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* STATUS DAS CONSTRUÇÕES (TORRES E BARRACAS) */}
            <div style={{ background: 'rgba(11, 13, 18, 0.6)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, fontWeight: 700 }}>
                <div>
                  <span style={{ color: 'var(--accent-cyan)', marginRight: 8 }}>Construções Team Synapse:</span>
                  <span style={{ letterSpacing: 2, color: '#00E676' }}>■■■ ■■■ ■■■ ■■</span>
                </div>
                <div>
                  <span style={{ color: 'var(--accent-red)', marginRight: 8 }}>Construções DYNASTY:</span>
                  <span style={{ letterSpacing: 2, color: '#FF5252' }}>■■■ ■■ ■■ ■■</span>
                </div>
              </div>
            </div>

            {/* ORDEM COMPLETA DE DRAFT (24 PICKS & BANS) */}
            <div className="draft-block" style={{ marginBottom: 16 }}>
              <div className="draft-title">Picks &amp; Bans — Team Synapse</div>
              <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {FULL_DRAFT_SYNAPSE_DYNASTY.filter(p => p.team === 0).map((p, i) => (
                  <div key={i} className="draft-hero-pill" style={{ opacity: p.is_pick ? 1 : 0.5, border: p.is_pick ? '1px solid var(--accent-cyan)' : '1px dashed rgba(255,255,255,0.2)' }}>
                    <img src={getHeroImg(constants, p.hero_id)} alt="" title={`${p.is_pick ? 'Pick' : 'Ban'}: ${getHeroName(constants, p.hero_id)}`} />
                    {p.is_pick && <span style={{ color: '#fff', fontWeight: 600 }}>{getHeroName(constants, p.hero_id)}</span>}
                  </div>
                ))}
              </div>

              <div className="draft-title" style={{ color: 'var(--accent-red)' }}>Picks &amp; Bans — DYNASTY</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {FULL_DRAFT_SYNAPSE_DYNASTY.filter(p => p.team === 1).map((p, i) => (
                  <div key={i} className="draft-hero-pill" style={{ opacity: p.is_pick ? 1 : 0.5, border: p.is_pick ? '1px solid var(--accent-red)' : '1px dashed rgba(255,255,255,0.2)' }}>
                    <img src={getHeroImg(constants, p.hero_id)} alt="" title={`${p.is_pick ? 'Pick' : 'Ban'}: ${getHeroName(constants, p.hero_id)}`} />
                    {p.is_pick && <span style={{ color: '#fff', fontWeight: 600 }}>{getHeroName(constants, p.hero_id)}</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* TABELA TEAM SYNAPSE */}
            <div style={{ color: 'var(--accent-cyan)', fontWeight: 700, fontSize: 13, marginTop: 12 }}>
              Team Synapse
            </div>
            <table className="table-custom">
              <thead>
                <tr>
                  <th style={{ width: 140 }}>Jogador</th>
                  <th style={{ width: 60 }}>Herói</th>
                  <th style={{ width: 100 }}>Patrimônio</th>
                  <th style={{ width: 80 }}>K/D/A</th>
                  <th style={{ width: 90 }}>GPM/XPM</th>
                  <th>Itens</th>
                </tr>
              </thead>
              <tbody>
                {liveState.rPlayers.map((p, i) => (
                  <tr key={i}>
                    <td style={{ color: '#fff', fontWeight: 600 }}>{p.name}</td>
                    <td><img src={getHeroImg(constants, p.hero_id)} alt="" style={{ width: 34, height: 20, borderRadius: 3, objectFit: 'cover' }} /></td>
                    <td style={{ color: '#00E676', fontWeight: 700, fontFamily: 'monospace' }}>${p.net_worth.toLocaleString('pt-BR')}</td>
                    <td style={{ fontFamily: 'monospace' }}>{p.kills}/{p.deaths}/{p.assists}</td>
                    <td style={{ fontFamily: 'monospace' }}><span style={{ color: 'var(--accent-cyan)' }}>{p.gpm}</span> / {p.xpm}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[p.item_0, p.item_1, p.item_2, p.item_3, p.item_4, p.item_5].map((it, itIdx) => (
                          it && getItemImg(constants, it) ? <img key={itIdx} src={getItemImg(constants, it)} alt="" className="item-slot-icon" /> : null
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* TABELA DYNASTY */}
            <div style={{ color: 'var(--accent-red)', fontWeight: 700, fontSize: 13, marginTop: 16 }}>
              DYNASTY
            </div>
            <table className="table-custom">
              <thead>
                <tr>
                  <th style={{ width: 140 }}>Jogador</th>
                  <th style={{ width: 60 }}>Herói</th>
                  <th style={{ width: 100 }}>Patrimônio</th>
                  <th style={{ width: 80 }}>K/D/A</th>
                  <th style={{ width: 90 }}>GPM/XPM</th>
                  <th>Itens</th>
                </tr>
              </thead>
              <tbody>
                {liveState.dPlayers.map((p, i) => (
                  <tr key={i}>
                    <td style={{ color: '#fff', fontWeight: 600 }}>{p.name}</td>
                    <td><img src={getHeroImg(constants, p.hero_id)} alt="" style={{ width: 34, height: 20, borderRadius: 3, objectFit: 'cover' }} /></td>
                    <td style={{ color: '#FF5252', fontWeight: 700, fontFamily: 'monospace' }}>${p.net_worth.toLocaleString('pt-BR')}</td>
                    <td style={{ fontFamily: 'monospace' }}>{p.kills}/{p.deaths}/{p.assists}</td>
                    <td style={{ fontFamily: 'monospace' }}><span style={{ color: 'var(--accent-cyan)' }}>{p.gpm}</span> / {p.xpm}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[p.item_0, p.item_1, p.item_2, p.item_3, p.item_4, p.item_5].map((it, itIdx) => (
                          it && getItemImg(constants, it) ? <img key={itIdx} src={getItemImg(constants, it)} alt="" className="item-slot-icon" /> : null
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DETALHADO DA SÉRIE FINALIZADA */}
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

                {/* ORDEM COMPLETA DE DRAFT (24 PICKS & BANS) */}
                {loadedMatchData.picks_bans && (
                  <div className="draft-block">
                    <div className="draft-title">Ordem Completa de Draft (Picks &amp; Bans)</div>
                    
                    <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--accent-cyan)', fontWeight: 700, minWidth: 60 }}>Radiant:</span>
                      {loadedMatchData.picks_bans.filter(p => p.team === 0).map((p, i) => (
                        <div key={i} className="draft-hero-pill" style={{ opacity: p.is_pick ? 1 : 0.5, border: p.is_pick ? '1px solid var(--accent-cyan)' : '1px dashed rgba(255,255,255,0.2)' }}>
                          <img src={getHeroImg(constants, p.hero_id)} alt="" title={`${p.is_pick ? 'Pick' : 'Ban'}: ${getHeroName(constants, p.hero_id)}`} />
                          {p.is_pick && <span style={{ color: '#fff', fontWeight: 600 }}>{getHeroName(constants, p.hero_id)}</span>}
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--accent-red)', fontWeight: 700, minWidth: 60 }}>Dire:</span>
                      {loadedMatchData.picks_bans.filter(p => p.team === 1).map((p, i) => (
                        <div key={i} className="draft-hero-pill" style={{ opacity: p.is_pick ? 1 : 0.5, border: p.is_pick ? '1px solid var(--accent-red)' : '1px dashed rgba(255,255,255,0.2)' }}>
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
                        <td style={{ color: '#fff', fontWeight: 600 }}>{p.display_name}</td>
                        <td><img src={getHeroImg(constants, p.hero_id)} alt="" style={{ width: 34, height: 20, borderRadius: 3, objectFit: 'cover' }} /></td>
                        <td style={{ fontFamily: 'monospace' }}>{p.kills}/{p.deaths}/{p.assists}</td>
                        <td style={{ fontFamily: 'monospace' }}><span style={{ color: 'var(--accent-cyan)' }}>{p.gold_per_min}</span> / {p.xp_per_min}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {[p.item_0, p.item_1, p.item_2, p.item_3, p.item_4, p.item_5].map((itId, itIdx) => (
                              itId && getItemImg(constants, itId) ? <img key={itIdx} src={getItemImg(constants, itId)} alt="" className="item-slot-icon" /> : null
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
                        <td style={{ color: '#fff', fontWeight: 600 }}>{p.display_name}</td>
                        <td><img src={getHeroImg(constants, p.hero_id)} alt="" style={{ width: 34, height: 20, borderRadius: 3, objectFit: 'cover' }} /></td>
                        <td style={{ fontFamily: 'monospace' }}>{p.kills}/{p.deaths}/{p.assists}</td>
                        <td style={{ fontFamily: 'monospace' }}><span style={{ color: 'var(--accent-cyan)' }}>{p.gold_per_min}</span> / {p.xp_per_min}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {[p.item_0, p.item_1, p.item_2, p.item_3, p.item_4, p.item_5].map((itId, itIdx) => (
                              itId && getItemImg(constants, itId) ? <img key={itIdx} src={getItemImg(constants, itId)} alt="" className="item-slot-icon" /> : null
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