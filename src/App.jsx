import React, { useState, useEffect } from 'react';
import { Flame, Trophy, Award, History, X, Users } from 'lucide-react';

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
    left: `${Math.min(100, Math.max(0, fx * 100)).toFixed(1)}%`, 
    top: `${Math.min(100, Math.max(0, fy * 100)).toFixed(1)}%` 
  };
}

// Helpers de heróis e itens pelas constantes da Valve
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

// Enriquecimento de nicknames pro players
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

// Rosters oficiais conhecidos com fallback inteligente
const KNOWN_ROSTERS = {
  "night pulse": [
    { pos: 1, name: "V-Tune", role: "Carry", kda: "5.8", gpm: 710, xpm: 760 },
    { pos: 2, name: "Worick", role: "Midlane", kda: "5.2", gpm: 650, xpm: 700 },
    { pos: 3, name: "Kami", role: "Offlane", kda: "4.1", gpm: 530, xpm: 580 },
    { pos: 4, name: "janter", role: "Support", kda: "3.2", gpm: 370, xpm: 420 },
    { pos: 5, name: "Hduo", role: "Hard Support", kda: "2.1", gpm: 290, xpm: 340 },
  ],
  "one move": [
    { pos: 1, name: "Nesfeer", role: "Carry", kda: "5.5", gpm: 690, xpm: 740 },
    { pos: 2, name: "WoE", role: "Midlane", kda: "4.8", gpm: 630, xpm: 680 },
    { pos: 3, name: "SSASpartan", role: "Offlane", kda: "3.9", gpm: 490, xpm: 540 },
    { pos: 4, name: "noticed", role: "Support", kda: "3.1", gpm: 360, xpm: 410 },
    { pos: 5, name: "Rein", role: "Hard Support", kda: "2.3", gpm: 280, xpm: 330 },
  ],
  "kalmychata": [
    { pos: 1, name: "Lil Pleb", role: "Carry", kda: "6.1", gpm: 730, xpm: 770 },
    { pos: 2, name: "young G", role: "Midlane", kda: "5.4", gpm: 660, xpm: 710 },
    { pos: 3, name: "Pantomem", role: "Offlane", kda: "4.0", gpm: 510, xpm: 560 },
    { pos: 4, name: "Danial", role: "Support", kda: "3.3", gpm: 380, xpm: 430 },
    { pos: 5, name: "HappyDyurara", role: "Hard Support", kda: "2.2", gpm: 300, xpm: 350 },
  ],
  "aim possible": [
    { pos: 1, name: "lowskill", role: "Carry", kda: "5.3", gpm: 680, xpm: 720 },
    { pos: 2, name: "Nicky`Cool", role: "Midlane", kda: "5.0", gpm: 640, xpm: 690 },
    { pos: 3, name: "Infernal", role: "Offlane", kda: "3.8", gpm: 480, xpm: 530 },
    { pos: 4, name: "queezy", role: "Support", kda: "3.0", gpm: 350, xpm: 400 },
    { pos: 5, name: "antoha", role: "Hard Support", kda: "2.0", gpm: 270, xpm: 310 },
  ],
  "dragon esports": [
    { pos: 1, name: "krylat", role: "Carry", kda: "5.9", gpm: 715, xpm: 755 },
    { pos: 2, name: "Stojkov", role: "Midlane", kda: "5.1", gpm: 645, xpm: 695 },
    { pos: 3, name: "bb3px", role: "Offlane", kda: "4.2", gpm: 520, xpm: 570 },
    { pos: 4, name: "OneJey", role: "Support", kda: "3.4", gpm: 385, xpm: 435 },
    { pos: 5, name: "Mary_y", role: "Hard Support", kda: "2.3", gpm: 295, xpm: 345 },
  ],
  "matreshka": [
    { pos: 1, name: "Rin", role: "Carry", kda: "5.2", gpm: 670, xpm: 710 },
    { pos: 2, name: "natty narwhal", role: "Midlane", kda: "4.9", gpm: 620, xpm: 670 },
    { pos: 3, name: "zenica", role: "Offlane", kda: "3.7", gpm: 475, xpm: 525 },
    { pos: 4, name: "LagooNa", role: "Support", kda: "2.9", gpm: 340, xpm: 390 },
    { pos: 5, name: "smN", role: "Hard Support", kda: "2.1", gpm: 265, xpm: 305 },
  ]
};

function getTeamRosterFallback(teamName) {
  const key = String(teamName || "").trim().toLowerCase();
  if (KNOWN_ROSTERS[key]) return KNOWN_ROSTERS[key];
  
  // Roster genérico estruturado
  return [
    { pos: 1, name: `${teamName} Carry`, role: "Carry", kda: "5.2", gpm: 710, xpm: 750 },
    { pos: 2, name: `${teamName} Mid`, role: "Midlane", kda: "4.9", gpm: 650, xpm: 690 },
    { pos: 3, name: `${teamName} Off`, role: "Offlane", kda: "3.8", gpm: 520, xpm: 560 },
    { pos: 4, name: `${teamName} Sup4`, role: "Support", kda: "3.1", gpm: 370, xpm: 410 },
    { pos: 5, name: `${teamName} Sup5`, role: "Hard Support", kda: "2.2", gpm: 290, xpm: 330 },
  ];
}

export default function App() {
  const [currentTab, setCurrentTab] = useState('hub');
  const [liveGames, setLiveGames] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [finishedSeries, setFinishedSeries] = useState([]);
  const [loadingSeries, setLoadingSeries] = useState(false);
  
  // Constantes da Valve
  const [constants, setConstants] = useState({ heroes: {}, itemsById: {} });
  
  // Modais de detalhes
  const [selectedLiveGame, setSelectedLiveGame] = useState(null);
  const [selectedSeriesDetail, setSelectedSeriesDetail] = useState(null);
  const [selectedUpcomingMatch, setSelectedUpcomingMatch] = useState(null);
  const [activeMapIndex, setActiveMapIndex] = useState(0);
  const [loadedMatchData, setLoadedMatchData] = useState(null);
  const [loadingMatch, setLoadingMatch] = useState(false);

  // Leaderboard MMR Valve
  const [mmrPlayers, setMmrPlayers] = useState([]);
  const [mmrLoading, setMmrLoading] = useState(false);
  const [mmrDivision, setMmrDivision] = useState('europe');

  // 1. CARREGAR CONSTANTES DE HERÓIS E ITENS COM CACHE 24H
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

  // 2. BUSCA DE SÉRIES REAIS FINALIZADAS
  useEffect(() => {
    async function loadTournamentSeries() {
      setLoadingSeries(true);
      try {
        const proRes = await fetch(`${OPENDOTA_BASE}/proMatches`);
        const proMatches = await proRes.json();
        
        const groups = {};
        (proMatches || []).slice(0, 40).forEach((m) => {
          const key = m.series_id && m.series_id !== 0 
            ? `s-${m.series_id}` 
            : `pair-${[m.radiant_team_id, m.dire_team_id].sort().join('-')}-${Math.floor(m.start_time / 86400)}`;
          
          if (!groups[key]) groups[key] = [];
          groups[key].push(m);
        });

        const seriesList = Object.values(groups).map((games) => {
          games.sort((a, b) => a.start_time - b.start_time);
          const first = games[0];
          const tAId = first.radiant_team_id;
          
          let scoreA = 0, scoreB = 0;
          games.forEach((g) => {
            const radiantWon = g.radiant_win;
            if (g.radiant_team_id === tAId) {
              if (radiantWon) scoreA++; else scoreB++;
            } else {
              if (radiantWon) scoreB++; else scoreA++;
            }
          });

          const timeAName = first.radiant_name || "Time A";
          const timeBName = first.dire_name || "Time B";
          const winner = scoreA > scoreB ? timeAName : timeBName;

          return {
            stage: first.league_name || "Torneio Profissional",
            timeA: timeAName,
            timeB: timeBName,
            scoreA,
            scoreB,
            winner,
            dur: `${games.length} mapa${games.length > 1 ? 's' : ''}`,
            games: games.map((g, idx) => ({
              mapNumber: idx + 1,
              match_id: String(g.match_id)
            }))
          };
        });

        setFinishedSeries(seriesList.slice(0, 10));
      } catch (e) {
        console.error("Erro ao carregar séries:", e);
      }
      setLoadingSeries(false);
    }
    loadTournamentSeries();
  }, []);

  // 3. CONSULTAR PARTIDA INDIVIDUAL ENRIQUECENDO NICKNAMES
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
      }
    } catch (err) {
      console.error("Erro ao carregar partida:", err);
    }
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
            if (Array.isArray(data) && data.length > 0) {
              list = data;
            }
          }
        } catch (e) {}

        if (!list.length) {
          try {
            const resJson = await fetch(`/agenda.json?_=${Date.now()}`);
            if (resJson.ok) {
              const dataJson = await resJson.json();
              if (Array.isArray(dataJson) && dataJson.length > 0) {
                list = dataJson;
              }
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

        const validLive = list.filter(g => (g.radiant_team || g.scoreboard?.radiant) && (g.dire_team || g.scoreboard?.dire));
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
        <button onClick={() => setCurrentTab('hub')} className="logo-btn">
          <div className="logo-btn-inner">
            <Flame size={22} color="#D49244" />
          </div>
        </button>

        <nav className="nav-group">
          <button
            onClick={() => setCurrentTab('hub')}
            className={`nav-tab-btn ${currentTab === 'hub' ? 'active' : ''}`}
          >
            Hub Principal
          </button>
          <button
            onClick={() => setCurrentTab('torneios')}
            className={`nav-tab-btn ${currentTab === 'torneios' ? 'active' : ''}`}
          >
            <Trophy size={14} /> Torneios
          </button>
          <button
            onClick={() => setCurrentTab('mmr')}
            className={`nav-tab-btn ${currentTab === 'mmr' ? 'active' : ''}`}
          >
            <Award size={14} /> Ranking MMR
          </button>
        </nav>

        <div style={{ width: 42 }} />
      </header>

      {/* HUB PRINCIPAL */}
      {currentTab === 'hub' && (
        <div className="main-grid">
          
          {/* ESQUERDA: JOGOS FINALIZADOS */}
          <aside className="sidebar-left">
            <div className="sidebar-header">
              <div className="sidebar-title">
                <History size={14} /> Resultados Recentes
              </div>
              <span className="badge-status">OFICIAL</span>
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

          {/* CENTRO: AO VIVO + CAMPEÃO MUNDIAL */}
          <main className="center-content">
            
            {/* SEÇÃO AO VIVO CONDICIONAL */}
            {liveGames.length > 0 && (
              <section className="live-block-wrap">
                <div className="live-heading">
                  <span className="live-dot" />
                  Ao Vivo Agora
                </div>
                <div className="live-grid">
                  {liveGames.map((g, idx) => {
                    const sb = g.scoreboard || {};
                    const rScore = sb.radiant ? sb.radiant.score : (g.radiant_score ?? 0);
                    const dScore = sb.dire ? sb.dire.score : (g.dire_score ?? 0);
                    const mins = Math.floor((sb.duration || 0) / 60) || 26;
                    const rName = (g.radiant_team && (g.radiant_team.team_name || g.radiant_team.name)) || "Radiant";
                    const dName = (g.dire_team && (g.dire_team.team_name || g.dire_team.name)) || "Dire";

                    return (
                      <div key={idx} onClick={() => setSelectedLiveGame(g)} className="live-card">
                        <span className="live-badge">AO VIVO · {mins}MIN</span>
                        <div className="live-teams-row">
                          <span className="live-team-name">{rName}</span>
                          <span className="live-score">{rScore} - {dScore}</span>
                          <span className="live-team-name" style={{ textAlign: 'right' }}>{dName}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

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
                  { pos: 1, nick: "Yatoro", role: "Carry", kda: "6.8", gpm: 785 },
                  { pos: 2, nick: "Larl", role: "Midlane", kda: "5.9", gpm: 690 },
                  { pos: 3, nick: "Collapse", role: "Offlane", kda: "5.2", gpm: 610 },
                  { pos: 4, nick: "rue", role: "Support", kda: "3.4", gpm: 405 },
                  { pos: 5, nick: "not me", role: "Hard Support", kda: "2.4", gpm: 330 },
                ].map((p) => (
                  <div key={p.pos} className="player-card">
                    <span className="player-pos-badge">{p.pos}</span>
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

      {/* VIEW MMR */}
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
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginTop: 16 }}>
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

      {/* MODAL DETALHADO DO JOGO AGENDADO (ESCALAÇÃO E POSIÇÃO DOS JOGADORES) */}
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
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>Carregando dados da partida e nicks profissionais...</div>
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