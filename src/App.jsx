import React, { useState, useEffect } from 'react';
import { Flame, Trophy, Award, History, X, Radio, ArrowLeft, Calendar, Loader2, RefreshCw } from 'lucide-react';

const OPENDOTA_BASE = "https://api.opendota.com/api";
const STEAM_CDN = "https://cdn.cloudflare.steamstatic.com";

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
  return h ? h.localized_name : `Herói ${heroId}`;
}
function getItemImg(constants, itemId) {
  const it = constants.itemsById[itemId];
  return it ? `${STEAM_CDN}${it.img}` : "";
}

// Algoritmo sequencial de agrupamento de séries
function clusterMatchesIntoSeries(rawMatches) {
  const list = [...rawMatches].sort((a, b) => a.start_time - b.start_time);
  const seriesList = [];

  list.forEach((m) => {
    const tA = normalizeTeamKey(m.radiant_name || m.radiant_team_id);
    const tB = normalizeTeamKey(m.dire_name || m.dire_team_id);
    const matchTime = m.start_time;

    // Busca série existente aberta para esses mesmos dois times
    let targetSeries = seriesList.find((s) => {
      const sameTeams = (s.teamAKey === tA && s.teamBKey === tB) || (s.teamAKey === tB && s.teamBKey === tA);
      const sameLeague = !m.leagueid || !s.leagueId || m.leagueid === s.leagueId;
      
      // Intervalo entre o último mapa da série e o mapa atual (máximo 3.5 horas)
      const lastGameTime = s.games[s.games.length - 1].start_time;
      const withinTime = (matchTime - lastGameTime) <= (3.5 * 3600) && (matchTime >= lastGameTime);

      // Série já concluída não recebe novos mapas (BO3 atinge 2 vitórias, BO5 atinge 3 vitórias)
      const isAlreadyClosed = (s.scoreA >= 2 && s.scoreB < s.scoreA && s.games.length <= 3) || 
                              (s.scoreB >= 2 && s.scoreA < s.scoreB && s.games.length <= 3) || 
                              (s.scoreA >= 3 || s.scoreB >= 3);

      return sameTeams && sameLeague && withinTime && !isAlreadyClosed;
    });

    if (!targetSeries) {
      targetSeries = {
        leagueId: m.leagueid,
        leagueName: m.league_name || "Torneio Profissional",
        teamAKey: tA,
        teamBKey: tB,
        timeA: m.radiant_name || "Radiant",
        timeB: m.dire_name || "Dire",
        preferredIdA: m.radiant_team_id,
        scoreA: 0,
        scoreB: 0,
        games: []
      };
      seriesList.push(targetSeries);
    }

    // Adiciona o mapa à série correspondente
    targetSeries.games.push(m);
    const radWon = m.radiant_win;
    const isRadTeamA = (m.radiant_team_id === targetSeries.preferredIdA);

    if (isRadTeamA) {
      if (radWon) targetSeries.scoreA++; else targetSeries.scoreB++;
    } else {
      if (radWon) targetSeries.scoreB++; else targetSeries.scoreA++;
    }
  });

  return seriesList.map((s) => ({
    stage: s.leagueName,
    timeA: s.timeA,
    timeB: s.timeB,
    scoreA: s.scoreA,
    scoreB: s.scoreB,
    winner: s.scoreA > s.scoreB ? s.timeA : (s.scoreB > s.scoreA ? s.timeB : "Empate"),
    dur: `${s.games.length} mapa${s.games.length > 1 ? 's' : ''}`,
    games: s.games.map((g, idx) => ({
      mapNumber: idx + 1,
      match_id: String(g.match_id),
      start_time: g.start_time
    }))
  }));
}

export default function App() {
  const [currentTab, setCurrentTab] = useState('hub');
  const [finishedSeries, setFinishedSeries] = useState([]);
  const [tournamentsList, setTournamentsList] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  const [liveGames, setLiveGames] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  
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

  // 1. CARREGAR CONSTANTES DA VALVE
  useEffect(() => {
    async function loadConstants() {
      try {
        const cached = localStorage.getItem("dota:constants:v5");
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

        localStorage.setItem("dota:constants:v5", JSON.stringify({ ts: now, heroes, itemsById }));
        setConstants({ heroes, itemsById });
      } catch (err) {
        console.error("Erro ao carregar constantes:", err);
      }
    }
    loadConstants();
  }, []);

  // 2. BUSCA DE PARTIDAS COM SEPARAÇÃO TEMPORAL DE SÉRIES
  async function fetchProMatchesData() {
    setLoadingData(true);
    try {
      const res = await fetch(`${OPENDOTA_BASE}/proMatches`);
      if (res.ok) {
        const matches = await res.json();
        const list = Array.isArray(matches) ? matches : [];

        // Agrupamento temporal estrito
        const allClusteredSeries = clusterMatchesIntoSeries(list);

        // Apenas séries que tiveram 2 ou mais mapas (ou 1 mapa finalizado com vencedor claro)
        const validRecentSeries = allClusteredSeries
          .filter(s => s.games.length >= 2 || (s.scoreA + s.scoreB === 1))
          .reverse();

        setFinishedSeries(validRecentSeries.slice(0, 10));

        // Agrupamento por Liga/Torneio
        const leaguesMap = {};
        list.forEach((m) => {
          const lId = m.leagueid || m.league_name;
          if (!lId) return;
          if (!leaguesMap[lId]) {
            leaguesMap[lId] = {
              id: lId,
              league_id: m.leagueid,
              name: m.league_name || "Torneio Dota 2",
              recentDate: new Date(m.start_time * 1000).toLocaleDateString("pt-BR", { month: "short", year: "numeric" }),
              rawMatches: []
            };
          }
          leaguesMap[lId].rawMatches.push(m);
        });

        const tournaments = Object.values(leaguesMap).map((l) => ({
          ...l,
          seriesList: clusterMatchesIntoSeries(l.rawMatches).reverse()
        }));

        setTournamentsList(tournaments.slice(0, 10));
      }
    } catch (e) {
      console.error("Erro ao carregar proMatches:", e);
    }
    setLoadingData(false);
  }

  useEffect(() => {
    fetchProMatchesData();
  }, []);

  // 3. CONSULTA DINÂMICA DE MAPA ESPECÍFICO NA OPENDOTA
  async function fetchMatchDetail(matchId) {
    if (!matchId) return;
    setLoadingMatch(true);
    setLoadedMatchData(null);
    try {
      const res = await fetch(`${OPENDOTA_BASE}/matches/${matchId}`);
      if (res.ok) {
        const data = await res.json();
        setLoadedMatchData(data);
      }
    } catch (err) {
      console.error("Erro ao carregar detalhes da partida:", err);
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
    const interval = setInterval(fetchLive, 12000);
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
          
          {/* ESQUERDA: RESULTADOS REAIS */}
          <aside className="sidebar-left">
            <div className="sidebar-header">
              <div className="sidebar-title">
                <History size={14} /> Resultados Recentes
              </div>
              <button 
                onClick={fetchProMatchesData}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                title="Atualizar resultados"
              >
                <RefreshCw size={12} />
              </button>
            </div>

            <div className="finished-scroll">
              {loadingData ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-dim)', fontSize: 12 }}>
                  <Loader2 size={16} className="animate-spin" style={{ margin: '0 auto 6px auto' }} />
                  Carregando séries...
                </div>
              ) : finishedSeries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-dim)', fontSize: 12 }}>
                  Nenhuma série recente encontrada.
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
                    src="https://cdn.cloudflare.steamstatic.com/apps/dota2/images/team_logos/7119388.png" 
                    alt="Team Spirit" 
                    onError={(e) => {
                      e.target.src = "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/teams/7119388.png";
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

            {/* SEÇÃO AO VIVO REAL */}
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
                          <span className="live-score">
                            {rScore} - {dScore}
                          </span>
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

      {/* 2. ABA DE TORNEIOS (COM SÉRIES INDIVIDUAIS E MAPAS SEPARADOS) */}
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
                      Torneio Profissional
                    </span>
                    <h2 style={{ fontSize: 24, color: '#fff', marginTop: 4 }}>{selectedTournament.name}</h2>
                    <div style={{ display: 'flex', gap: 16, color: 'var(--text-dim)', fontSize: 12, marginTop: 6 }}>
                      <span><Calendar size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {selectedTournament.recentDate}</span>
                      <span><Trophy size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {selectedTournament.seriesList?.length || 0} Séries Disputadas</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
                {(selectedTournament.seriesList || []).map((m, idx) => {
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
                        <span className="score-tag" style={{ color: aWon ? '#00E676' : (m.scoreA === m.scoreB ? '#fff' : '#FF5252'), fontSize: 14 }}>{m.scoreA}</span>
                      </div>
                      <div className="finished-team-row" style={{ fontSize: 14 }}>
                        <span style={{ color: '#ffffff', fontWeight: 600 }}>{m.timeB}</span>
                        <span className="score-tag" style={{ color: bWon ? '#00E676' : (m.scoreA === m.scoreB ? '#fff' : '#FF5252'), fontSize: 14 }}>{m.scoreB}</span>
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
                  Torneios Profissionais Recentes
                </h2>
                <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>
                  Selecione um torneio para consultar todas as séries e as estatísticas oficiais de cada partida
                </span>
              </div>

              {loadingData ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-dim)' }}>
                  <Loader2 size={22} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
                  Carregando lista de torneios da API...
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 14 }}>
                  {tournamentsList.map((t) => (
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
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.transform = 'none';
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: 10, color: 'var(--accent-gold)', fontWeight: 800, textTransform: 'uppercase' }}>
                            Oficial
                          </span>
                          <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                            {t.recentDate}
                          </span>
                        </div>
                        <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{t.name}</h3>
                      </div>
                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Séries Registradas:</span>
                        <strong style={{ fontSize: 12, color: 'var(--accent-cyan)' }}>{t.seriesList?.length || 0}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

      {/* MODAL DETALHADO DA PARTIDA COM DADOS REAIS DO REPLAY */}
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
              <h2 style={{ color: '#fff', fontSize: 20, marginTop: 4 }}>
                {selectedSeriesDetail.timeA} <span style={{ color: 'var(--accent-gold)', margin: '0 8px' }}>{selectedSeriesDetail.scoreA} - {selectedSeriesDetail.scoreB}</span> {selectedSeriesDetail.timeB}
              </h2>
            </div>

            {/* ABAS DOS MAPAS DAQUELA SÉRIE ESPECÍFICA */}
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

            {/* CONTEÚDO DO MAPA SELECIONADO */}
            {loadingMatch ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Loader2 className="animate-spin" size={18} /> Carregando estatísticas e ordem de draft da partida...
              </div>
            ) : loadedMatchData ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 12 }}>
                  <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>
                    {loadedMatchData.radiant_name || "Radiant"} {loadedMatchData.radiant_score} - {loadedMatchData.dire_score} {loadedMatchData.dire_name || "Dire"} ({loadedMatchData.radiant_win ? (loadedMatchData.radiant_name || "Radiant") : (loadedMatchData.dire_name || "Dire")} venceu)
                  </span>
                  <span style={{ color: 'var(--text-dim)' }}>
                    Duração: {Math.round((loadedMatchData.duration || 0) / 60)} min
                  </span>
                </div>

                {/* ORDEM COMPLETA DE PICKS & BANS */}
                {loadedMatchData.picks_bans && loadedMatchData.picks_bans.length > 0 && (
                  <div className="draft-block">
                    <div className="draft-title">Ordem Completa de Draft (Picks &amp; Bans)</div>
                    
                    <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--accent-cyan)', fontWeight: 700, minWidth: 60 }}>{loadedMatchData.radiant_name || "Radiant"}:</span>
                      {loadedMatchData.picks_bans.filter(p => p.team === 0).sort((a,b) => (a.order||0) - (b.order||0)).map((p, i) => (
                        <div key={i} className="draft-hero-pill" style={{ opacity: p.is_pick ? 1 : 0.5, border: p.is_pick ? '1px solid var(--accent-cyan)' : '1px dashed rgba(255,255,255,0.2)' }}>
                          <img src={getHeroImg(constants, p.hero_id)} alt="" title={`${p.is_pick ? 'Pick' : 'Ban'}: ${getHeroName(constants, p.hero_id)}`} />
                          {p.is_pick && <span style={{ color: '#fff', fontWeight: 600 }}>{getHeroName(constants, p.hero_id)}</span>}
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--accent-red)', fontWeight: 700, minWidth: 60 }}>{loadedMatchData.dire_name || "Dire"}:</span>
                      {loadedMatchData.picks_bans.filter(p => p.team === 1).sort((a,b) => (a.order||0) - (b.order||0)).map((p, i) => (
                        <div key={i} className="draft-hero-pill" style={{ opacity: p.is_pick ? 1 : 0.5, border: p.is_pick ? '1px solid var(--accent-red)' : '1px dashed rgba(255,255,255,0.2)' }}>
                          <img src={getHeroImg(constants, p.hero_id)} alt="" title={`${p.is_pick ? 'Pick' : 'Ban'}: ${getHeroName(constants, p.hero_id)}`} />
                          {p.is_pick && <span style={{ color: '#fff', fontWeight: 600 }}>{getHeroName(constants, p.hero_id)}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TABELA RADIANT */}
                <div style={{ color: 'var(--accent-cyan)', fontWeight: 700, fontSize: 13, marginTop: 12 }}>
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
                          {p.name || p.personaname || `Jogador ${i + 1}`}
                        </td>
                        <td>
                          <img src={getHeroImg(constants, p.hero_id)} alt="" style={{ width: 34, height: 20, borderRadius: 3, objectFit: 'cover' }} />
                        </td>
                        <td style={{ fontFamily: 'monospace' }}>{p.kills}/{p.deaths}/{p.assists}</td>
                        <td style={{ fontFamily: 'monospace' }}><span style={{ color: 'var(--accent-cyan)' }}>{p.gold_per_min}</span> / {p.xp_per_min}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {[p.item_0, p.item_1, p.item_2, p.item_3, p.item_4, p.item_5].map((itId, itIdx) => (
                              itId && getItemImg(constants, itId) ? (
                                <img key={itIdx} src={getItemImg(constants, itId)} alt="" className="item-slot-icon" />
                              ) : null
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* TABELA DIRE */}
                <div style={{ color: 'var(--accent-red)', fontWeight: 700, fontSize: 13, marginTop: 16 }}>
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
                          {p.name || p.personaname || `Jogador ${i + 1}`}
                        </td>
                        <td>
                          <img src={getHeroImg(constants, p.hero_id)} alt="" style={{ width: 34, height: 20, borderRadius: 3, objectFit: 'cover' }} />
                        </td>
                        <td style={{ fontFamily: 'monospace' }}>{p.kills}/{p.deaths}/{p.assists}</td>
                        <td style={{ fontFamily: 'monospace' }}><span style={{ color: 'var(--accent-cyan)' }}>{p.gold_per_min}</span> / {p.xp_per_min}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {[p.item_0, p.item_1, p.item_2, p.item_3, p.item_4, p.item_5].map((itId, itIdx) => (
                              itId && getItemImg(constants, itId) ? (
                                <img key={itIdx} src={getItemImg(constants, itId)} alt="" className="item-slot-icon" />
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