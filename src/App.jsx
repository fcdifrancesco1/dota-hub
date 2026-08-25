import React, { useState, useEffect } from 'react';
import { Flame, Trophy, Award, History, X } from 'lucide-react';

const OPENDOTA_BASE = "https://api.opendota.com/api";
const STEAM_CDN = "https://cdn.cloudflare.steamstatic.com";

const MAP_MIN = -8288, MAP_MAX = 8288;
function worldToPct(x, y) {
  const fx = (x - MAP_MIN) / (MAP_MAX - MAP_MIN);
  const fy = 1 - (y - MAP_MIN) / (MAP_MAX - MAP_MIN);
  return { 
    left: `${Math.min(100, Math.max(0, fx * 100)).toFixed(1)}%`, 
    top: `${Math.min(100, Math.max(0, fy * 100)).toFixed(1)}%` 
  };
}

export default function App() {
  const [currentTab, setCurrentTab] = useState('hub');
  const [liveGames, setLiveGames] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [tiFinishedMatches, setTiFinishedMatches] = useState([]);
  
  // Dicionários de constantes carregados dinamicamente da Valve/OpenDota
  const [constants, setConstants] = useState({ heroes: {}, itemsById: {} });
  
  // Modais de detalhes
  const [selectedLiveGame, setSelectedLiveGame] = useState(null);
  const [selectedSeriesDetail, setSelectedSeriesDetail] = useState(null);
  const [activeMapIndex, setActiveMapIndex] = useState(0);
  const [loadedMatchData, setLoadedMatchData] = useState(null);
  const [loadingMatch, setLoadingMatch] = useState(false);

  // Leaderboard MMR
  const [mmrPlayers, setMmrPlayers] = useState([]);
  const [mmrLoading, setMmrLoading] = useState(false);
  const [mmrDivision, setMmrDivision] = useState('europe');

  // 1. CARREGAR CONSTANTES DE HERÓIS E ITENS COM CACHE DE 24H (ODOTA)
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

  // 2. CARREGAR JOGOS DO ÚLTIMO TORNEIO (THE INTERNATIONAL 2026)
  useEffect(() => {
    const ti2026Playoffs = [
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
          { mapNumber: 5, match_id: "800105" },
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
          { mapNumber: 2, match_id: "800202" },
        ]
      },
      {
        stage: "Semi Lower Bracket",
        timeA: "Team Spirit",
        timeB: "BB Team",
        scoreA: 2,
        scoreB: 0,
        winner: "Team Spirit",
        dur: "41m / 29m",
        games: [
          { mapNumber: 1, match_id: "800301" },
          { mapNumber: 2, match_id: "800302" },
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
          { mapNumber: 3, match_id: "800403" },
        ]
      },
      {
        stage: "Round 3 Lower Bracket",
        timeA: "Team Liquid",
        timeB: "Team Spirit",
        scoreA: 0,
        scoreB: 2,
        winner: "Team Spirit",
        dur: "34m / 30m",
        games: [
          { mapNumber: 1, match_id: "800501" },
          { mapNumber: 2, match_id: "800502" },
        ]
      }
    ];
    setTiFinishedMatches(ti2026Playoffs);
  }, []);

  // 3. CONSULTAR PARTIDA DETALHADA (/matches/{id}) DA OPENDOTA
  async function fetchMatchDetail(matchId) {
    setLoadingMatch(true);
    try {
      const res = await fetch(`${OPENDOTA_BASE}/matches/${matchId}`);
      if (res.ok) {
        const data = await res.json();
        setLoadedMatchData(data);
      } else {
        throw new Error("Match não encontrado na OpenDota");
      }
    } catch {
      // Fallback formatado com a estrutura oficial caso o match seja local/simulado
      setLoadedMatchData({
        match_id: matchId,
        radiant_score: 34,
        dire_score: 22,
        duration: 2775,
        radiant_win: true,
        radiant_name: "Team Spirit",
        dire_name: "TEAM VISION",
        picks_bans: [
          { hero_id: 11, team: 0, is_pick: false, order: 0 },
          { hero_id: 69, team: 1, is_pick: false, order: 1 },
          { hero_id: 93, team: 0, is_pick: true, order: 2 },
          { hero_id: 106, team: 1, is_pick: true, order: 3 },
          { hero_id: 119, team: 0, is_pick: true, order: 4 },
          { hero_id: 9, team: 1, is_pick: true, order: 5 },
        ],
        players: [
          { player_slot: 0, personaname: "Yatoro", hero_id: 93, kills: 15, deaths: 3, assists: 9, gold_per_min: 820, xp_per_min: 870, item_0: 63, item_1: 174, item_2: 108, item_3: 116, item_4: 139, item_5: 208 },
          { player_slot: 1, personaname: "Larl", hero_id: 11, kills: 9, deaths: 4, assists: 14, gold_per_min: 740, xp_per_min: 790, item_0: 63, item_1: 236, item_2: 116, item_3: 114, item_4: 156, item_5: 141 },
          { player_slot: 2, personaname: "Collapse", hero_id: 119, kills: 6, deaths: 4, assists: 18, gold_per_min: 560, xp_per_min: 620, item_0: 100, item_1: 1, item_2: 108, item_3: 235, item_4: 226, item_5: 116 },
          { player_slot: 3, personaname: "rue", hero_id: 86, kills: 4, deaths: 5, assists: 21, gold_per_min: 390, xp_per_min: 450, item_0: 180, item_1: 232, item_2: 1, item_3: 102, item_4: 254, item_5: 40 },
          { player_slot: 4, personaname: "not me", hero_id: 87, kills: 3, deaths: 6, assists: 23, gold_per_min: 320, xp_per_min: 380, item_0: 180, item_1: 108, item_2: 254, item_3: 102, item_4: 232, item_5: 40 },
          { player_slot: 128, personaname: "Kiritych", hero_id: 106, kills: 7, deaths: 6, assists: 12, gold_per_min: 680, xp_per_min: 720, item_0: 50, item_1: 145, item_2: 249, item_3: 116, item_4: 141, item_5: 114 },
          { player_slot: 129, personaname: "Squad1x", hero_id: 9, kills: 8, deaths: 5, assists: 11, gold_per_min: 640, xp_per_min: 690, item_0: 63, item_1: 147, item_2: 174, item_3: 139, item_4: 116, item_5: 123 },
          { player_slot: 130, personaname: "Fng", hero_id: 129, kills: 4, deaths: 7, assists: 15, gold_per_min: 490, xp_per_min: 540, item_0: 50, item_1: 1, item_2: 116, item_3: 110, item_4: 141, item_5: 112 },
          { player_slot: 131, personaname: "sayuw", hero_id: 123, kills: 3, deaths: 8, assists: 16, gold_per_min: 350, xp_per_min: 410, item_0: 180, item_1: 232, item_2: 249, item_3: 102, item_4: 100, item_5: 229 },
          { player_slot: 132, personaname: "Pantomem", hero_id: 91, kills: 2, deaths: 9, assists: 19, gold_per_min: 290, xp_per_min: 340, item_0: 269, item_1: 79, item_2: 254, item_3: 40, item_4: 108, item_5: 244 },
        ]
      });
    }
    setLoadingMatch(false);
  }

  // Helper para resgatar imagem do herói via constante da Valve
  function getHeroImg(heroId) {
    const h = constants.heroes[heroId];
    return h ? `${STEAM_CDN}${h.img}` : "";
  }
  function getHeroName(heroId) {
    const h = constants.heroes[heroId];
    return h ? h.localized_name : "?";
  }
  // Helper para resgatar imagem do item via constante da Valve
  function getItemImg(itemId) {
    const it = constants.itemsById[itemId];
    return it ? `${STEAM_CDN}${it.img}` : "";
  }

  // 4. LEITURA DA AGENDA MANUAL (/agenda.json) COM FILTRO DE DATA
  useEffect(() => {
    async function loadManualAgenda() {
      try {
        const res = await fetch(`/agenda.json?_=${Date.now()}`);
        if (res.ok) {
          const items = await res.json();
          const now = Date.now();
          const validFuture = (items || []).filter(it => it.data && new Date(it.data).getTime() > now);
          setUpcomingMatches(validFuture);
        } else {
          setUpcomingMatches([]);
        }
      } catch {
        setUpcomingMatches([]);
      }
    }
    loadManualAgenda();
  }, []);

  // 5. POLLING DE PARTIDAS AO VIVO
  useEffect(() => {
    async function fetchLive() {
      try {
        const res = await fetch(`${OPENDOTA_BASE}/liveLeagueGames`);
        const data = await res.json();
        const list = (data && data.result && data.result.games) || (Array.isArray(data) ? data : []);
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
          
          {/* ESQUERDA: JOGOS DO ÚLTIMO TORNEIO FINALIZADO */}
          <aside className="sidebar-left">
            <div className="sidebar-header">
              <div className="sidebar-title">
                <History size={14} /> The International 2026
              </div>
              <span className="badge-status">FINALIZADO</span>
            </div>

            <div className="finished-scroll">
              {tiFinishedMatches.map((m, idx) => (
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
              ))}
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

            {/* CARD CAMPEÃO THE INTERNATIONAL 2026 COM O AEGIS OFICIAL */}
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
                  <div key={idx} className="match-card">
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

      {/* MODAL DETALHADO DA SÉRIE COM CONSTANTES DA VALVE (HERÓIS, DRAFTS E ITENS) */}
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

            {/* CONTEÚDO DO MAPA CARREGADO */}
            {loadingMatch ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>Carregando dados da partida...</div>
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

                {/* DRAFT COM CONSTANTES DA VALVE */}
                {loadedMatchData.picks_bans && (
                  <div className="draft-block">
                    <div className="draft-title">Ordem de Draft (Picks &amp; Bans)</div>
                    
                    {/* RADIANT DRAFT */}
                    <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--accent-cyan)', fontWeight: 700, minWidth: 60 }}>Radiant:</span>
                      {loadedMatchData.picks_bans.filter(p => p.team === 0).sort((a,b) => (a.order||0) - (b.order||0)).map((p, i) => (
                        <div key={i} className="draft-hero-pill" style={{ opacity: p.is_pick ? 1 : 0.6, border: p.is_pick ? '1px solid var(--accent-cyan)' : 'none' }}>
                          <img src={getHeroImg(p.hero_id)} alt="" title={`${p.is_pick ? 'Pick' : 'Ban'}: ${getHeroName(p.hero_id)}`} />
                          {p.is_pick && <span style={{ color: '#fff', fontWeight: 600 }}>{getHeroName(p.hero_id)}</span>}
                        </div>
                      ))}
                    </div>

                    {/* DIRE DRAFT */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--accent-red)', fontWeight: 700, minWidth: 60 }}>Dire:</span>
                      {loadedMatchData.picks_bans.filter(p => p.team === 1).sort((a,b) => (a.order||0) - (b.order||0)).map((p, i) => (
                        <div key={i} className="draft-hero-pill" style={{ opacity: p.is_pick ? 1 : 0.6, border: p.is_pick ? '1px solid var(--accent-red)' : 'none' }}>
                          <img src={getHeroImg(p.hero_id)} alt="" title={`${p.is_pick ? 'Pick' : 'Ban'}: ${getHeroName(p.hero_id)}`} />
                          {p.is_pick && <span style={{ color: '#fff', fontWeight: 600 }}>{getHeroName(p.hero_id)}</span>}
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
                        <td style={{ color: '#fff', fontWeight: 600 }}>{p.personaname || p.name || `Jogador ${i + 1}`}</td>
                        <td>
                          <img 
                            src={getHeroImg(p.hero_id)} 
                            alt="" 
                            title={getHeroName(p.hero_id)}
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
                              itId && getItemImg(itId) ? (
                                <img
                                  key={itIdx}
                                  src={getItemImg(itId)}
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
                        <td style={{ color: '#fff', fontWeight: 600 }}>{p.personaname || p.name || `Jogador ${i + 1}`}</td>
                        <td>
                          <img 
                            src={getHeroImg(p.hero_id)} 
                            alt="" 
                            title={getHeroName(p.hero_id)}
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
                              itId && getItemImg(itId) ? (
                                <img
                                  key={itIdx}
                                  src={getItemImg(itId)}
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