import React, { useState, useEffect } from 'react';
import { Flame, Trophy, Award, X } from 'lucide-react';

const OPENDOTA_BASE = "https://api.opendota.com/api";

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
  const [matchFeed, setMatchFeed] = useState([]);
  const [selectedLiveGame, setSelectedLiveGame] = useState(null);
  const [expandedMatchId, setExpandedMatchId] = useState(null);
  const [mmrPlayers, setMmrPlayers] = useState([]);
  const [mmrLoading, setMmrLoading] = useState(false);
  const [mmrDivision, setMmrDivision] = useState('europe');

  // 1. POLLING DE PARTIDAS AO VIVO (SÓ APARECE SE HOUVER PARTIDA ATIVA)
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

        const validLive = (list || []).filter(g => 
          (g.radiant_team || g.scoreboard?.radiant) && 
          (g.dire_team || g.scoreboard?.dire)
        );

        setLiveGames(validLive);
      } catch (err) {
        setLiveGames([]);
      }
    }

    fetchLive();
    const interval = setInterval(fetchLive, 15000);
    return () => clearInterval(interval);
  }, []);

  // 2. CONFRONTOS & RESULTADOS (COLUNA DIREITA)
  useEffect(() => {
    const feed = [
      { torneio: "The International 2026", timeA: "Xtreme Gaming", timeB: "Team Resilience", status: "EM BREVE", formato: "BO3", time: "11:00 BRT" },
      { torneio: "The International 2026", timeA: "OG", timeB: "GamerLegion", status: "EM BREVE", formato: "BO3", time: "12:30 BRT" },
      { torneio: "The International 2026", timeA: "Team Falcons", timeB: "BoomBoys", status: "EM BREVE", formato: "BO3", time: "14:00 BRT" },
      { torneio: "The International 2026", timeA: "LGD Gaming", timeB: "Vici Gaming", status: "AO VIVO", scoreA: 1, scoreB: 0, formato: "BO3", time: "AO VIVO" },
      { torneio: "The International 2026", timeA: "Team Liquid", timeB: "Iron Wing", status: "FINALIZADO", scoreA: 2, scoreB: 0, formato: "BO3", time: "05:40 BRT" },
      { torneio: "The International 2026", timeA: "TEAM VISION", timeB: "Team Spirit", status: "FINALIZADO", scoreA: 2, scoreB: 3, formato: "BO5", time: "FINAL" },
    ];
    setMatchFeed(feed);
  }, []);

  // 3. RANKING MMR OFICIAL
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

            {/* CARD CAMPEÃO THE INTERNATIONAL 2026 - TEAM SPIRIT */}
            <div className="champ-card">
              <div className="champ-header">
                <div className="champ-title-group">
                  {/* AEGIS EMBUTIDO EM SVG VETORIAL */}
                  <svg className="aegis-real-img" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="46" fill="#1C1814" stroke="#8C6737" strokeWidth="4"/>
                    <circle cx="50" cy="50" r="41" fill="#120F0D" stroke="#D49244" strokeWidth="2"/>
                    <path d="M50 14C30.1 14 14 30.1 14 50C14 69.9 30.1 86 50 86C69.9 86 86 69.9 86 50C86 30.1 69.9 14 50 14ZM50 20C61.2 20 71 26.2 76.2 35.3C66.9 33.7 54.7 35.1 43.8 44.2C34.4 52 28.5 64.1 27.2 72.8C22.8 66.8 20 58.8 20 50C20 33.4 33.4 20 50 20ZM50 80C39.5 80 30.3 74.4 24.9 66C33.4 67.2 44.6 65.5 54.8 57.2C64.6 49.3 70.8 37.1 72.4 28.1C77.1 34.3 80 41.8 80 50C80 66.6 66.6 80 50 80Z" fill="#A67B48"/>
                    <circle cx="50" cy="50" r="14" fill="#241E19" stroke="#E5B26F" strokeWidth="3"/>
                    <circle cx="50" cy="50" r="8" fill="#D49244"/>
                  </svg>

                  <div>
                    <div className="champ-sub">Último Campeão Mundial</div>
                    <h2 className="champ-name">The International 2026</h2>
                  </div>
                </div>
                
                {/* LOGO TEAM SPIRIT COM FALLBACK SEGURO */}
                <div className="champ-team-tag">
                  <img 
                    src="https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/teams/7119388.png" 
                    alt="Team Spirit" 
                    style={{ width: 32, height: 32, objectFit: 'contain' }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://raw.githubusercontent.com/odota/core/master/public/images/team_logos/7119388.png";
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

          {/* COLUNA DIREITA */}
          <aside className="sidebar-right">
            <div className="date-strip">
              <span>Partidas & Resultados</span>
              <span style={{ fontSize: 9, background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 3 }}>OFICIAL</span>
            </div>

            <div className="matches-scroll">
              {matchFeed.map((m, idx) => {
                const isExpanded = expandedMatchId === idx;
                const isLive = m.status === "AO VIVO";
                const isFinished = m.status === "FINALIZADO";

                return (
                  <div key={idx} className="match-card">
                    <div className="match-tourney-name">{m.torneio}</div>
                    <div onClick={() => setExpandedMatchId(isExpanded ? null : idx)} className="match-header-row">
                      <div className="match-teams-col">
                        <div className="match-team-single">{m.timeA}</div>
                        <div className="match-team-single">{m.timeB}</div>
                      </div>
                      <div className="match-meta-col">
                        {isFinished ? (
                          <>
                            <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(126,137,160,0.2)', color: 'var(--text-dim)', padding: '1px 6px', borderRadius: 4 }}>
                              FINALIZADO
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', fontFamily: 'monospace' }}>
                              {m.scoreA} - {m.scoreB}
                            </span>
                          </>
                        ) : isLive ? (
                          <>
                            <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(212,146,68,0.2)', color: 'var(--accent-gold)', padding: '1px 6px', borderRadius: 4 }}>
                              AO VIVO
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-gold)', fontFamily: 'monospace' }}>
                              {m.scoreA} - {m.scoreB}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="match-format-badge">{m.formato}</span>
                            <span className="match-time-text">{m.time}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="match-drawer">
                        <div>
                          <div className="drawer-team-title">{m.timeA} (100 jogos)</div>
                          <div className="drawer-row"><span>Pos 1 - Carry</span><span style={{ color: 'var(--accent-cyan)' }}>740 GPM</span></div>
                          <div className="drawer-row"><span>Pos 2 - Midlane</span><span style={{ color: 'var(--accent-cyan)' }}>695 GPM</span></div>
                          <div className="drawer-row"><span>Pos 3 - Offlane</span><span style={{ color: 'var(--accent-cyan)' }}>575 GPM</span></div>
                          <div className="drawer-row"><span>Pos 4 - Support</span><span style={{ color: 'var(--accent-cyan)' }}>390 GPM</span></div>
                          <div className="drawer-row"><span>Pos 5 - Hard Support</span><span style={{ color: 'var(--accent-cyan)' }}>325 GPM</span></div>
                        </div>
                        <div>
                          <div className="drawer-team-title">{m.timeB} (100 jogos)</div>
                          <div className="drawer-row"><span>Pos 1 - Carry</span><span style={{ color: 'var(--accent-cyan)' }}>730 GPM</span></div>
                          <div className="drawer-row"><span>Pos 2 - Midlane</span><span style={{ color: 'var(--accent-cyan)' }}>680 GPM</span></div>
                          <div className="drawer-row"><span>Pos 3 - Offlane</span><span style={{ color: 'var(--accent-cyan)' }}>560 GPM</span></div>
                          <div className="drawer-row"><span>Pos 4 - Support</span><span style={{ color: 'var(--accent-cyan)' }}>385 GPM</span></div>
                          <div className="drawer-row"><span>Pos 5 - Hard Support</span><span style={{ color: 'var(--accent-cyan)' }}>315 GPM</span></div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      )}

      {/* VIEW TORNEIOS */}
      {currentTab === 'torneios' && (
        <div style={{ maxWidth: 860, margin: '24px auto', width: '100%', padding: '0 20px' }}>
          <h2 style={{ color: 'var(--accent-gold)', textTransform: 'uppercase', marginBottom: 16, fontSize: 16 }}>Próximos Torneios</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: 20, borderRadius: 12 }}>
              <h3 style={{ color: '#fff', fontSize: 16 }}>The International 2026</h3>
              <p style={{ color: 'var(--text-dim)', fontSize: 12, marginTop: 4 }}>14 a 28 de Agosto, 2026</p>
              <p style={{ color: 'var(--accent-cyan)', fontFamily: 'monospace', fontSize: 13, marginTop: 8 }}>$3,000,000+</p>
            </div>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: 20, borderRadius: 12 }}>
              <h3 style={{ color: '#fff', fontSize: 16 }}>ESL One Birmingham 2026</h3>
              <p style={{ color: 'var(--text-dim)', fontSize: 12, marginTop: 4 }}>10 a 18 de Outubro, 2026</p>
              <p style={{ color: 'var(--accent-cyan)', fontFamily: 'monospace', fontSize: 13, marginTop: 8 }}>$1,000,000</p>
            </div>
          </div>
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

      {/* MODAL DETALHE AO VIVO */}
      {selectedLiveGame && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <button onClick={() => setSelectedLiveGame(null)} className="modal-close-btn">
              <X size={18} />
            </button>

            <h3 style={{ textAlign: 'center', color: '#fff', fontSize: 16, marginBottom: 12 }}>
              {(selectedLiveGame.radiant_team?.team_name || "LGD Gaming")}
              <span style={{ color: 'var(--accent-gold)', fontSize: 20, margin: '0 12px' }}>
                {(selectedLiveGame.scoreboard?.radiant?.score || 18)} - {(selectedLiveGame.scoreboard?.dire?.score || 12)}
              </span>
              {(selectedLiveGame.dire_team?.team_name || "Vici Gaming")}
            </h3>

            <div className="minimap-box">
              <div className="minimap-dot minimap-dot-radiant" style={{ left: '35%', top: '65%' }} />
              <div className="minimap-dot minimap-dot-dire" style={{ left: '65%', top: '35%' }} />
            </div>

            <div style={{ marginTop: 16, fontSize: 12 }}>
              <div style={{ color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: 4 }}>{(selectedLiveGame.radiant_team?.team_name || "LGD Gaming")}</div>
              <table className="table-custom" style={{ marginTop: 0, marginBottom: 16 }}>
                <thead><tr><th>Jogador</th><th>K/D/A</th><th style={{ textAlign: 'right' }}>GPM</th><th style={{ textAlign: 'right' }}>XPM</th></tr></thead>
                <tbody>
                  <tr><td style={{ color: '#fff', fontWeight: 600 }}>shiro</td><td>6/1/8</td><td style={{ textAlign: 'right', color: 'var(--accent-cyan)' }}>710</td><td style={{ textAlign: 'right' }}>760</td></tr>
                  <tr><td style={{ color: '#fff', fontWeight: 600 }}>Setsu</td><td>5/2/9</td><td style={{ textAlign: 'right', color: 'var(--accent-cyan)' }}>680</td><td style={{ textAlign: 'right' }}>720</td></tr>
                  <tr><td style={{ color: '#fff', fontWeight: 600 }}>niu</td><td>4/3/11</td><td style={{ textAlign: 'right', color: 'var(--accent-cyan)' }}>540</td><td style={{ textAlign: 'right' }}>590</td></tr>
                  <tr><td style={{ color: '#fff', fontWeight: 600 }}>Pyw</td><td>2/3/14</td><td style={{ textAlign: 'right', color: 'var(--accent-cyan)' }}>380</td><td style={{ textAlign: 'right' }}>430</td></tr>
                  <tr><td style={{ color: '#fff', fontWeight: 600 }}>y`</td><td>1/3/15</td><td style={{ textAlign: 'right', color: 'var(--accent-cyan)' }}>310</td><td style={{ textAlign: 'right' }}>370</td></tr>
                </tbody>
              </table>

              <div style={{ color: 'var(--accent-red)', fontWeight: 700, marginBottom: 4 }}>{(selectedLiveGame.dire_team?.team_name || "Vici Gaming")}</div>
              <table className="table-custom" style={{ marginTop: 0 }}>
                <thead><tr><th>Jogador</th><th>K/D/A</th><th style={{ textAlign: 'right' }}>GPM</th><th style={{ textAlign: 'right' }}>XPM</th></tr></thead>
                <tbody>
                  <tr><td style={{ color: '#fff', fontWeight: 600 }}>flyfly</td><td>4/3/5</td><td style={{ textAlign: 'right', color: 'var(--accent-cyan)' }}>640</td><td style={{ textAlign: 'right' }}>680</td></tr>
                  <tr><td style={{ color: '#fff', fontWeight: 600 }}>Echo</td><td>4/4/6</td><td style={{ textAlign: 'right', color: 'var(--accent-cyan)' }}>610</td><td style={{ textAlign: 'right' }}>650</td></tr>
                  <tr><td style={{ color: '#fff', fontWeight: 600 }}>niu</td><td>2/4/7</td><td style={{ textAlign: 'right', color: 'var(--accent-cyan)' }}>490</td><td style={{ textAlign: 'right' }}>530</td></tr>
                  <tr><td style={{ color: '#fff', fontWeight: 600 }}>Frisk</td><td>1/4/9</td><td style={{ textAlign: 'right', color: 'var(--accent-cyan)' }}>340</td><td style={{ textAlign: 'right' }}>390</td></tr>
                  <tr><td style={{ color: '#fff', fontWeight: 600 }}>Undying_</td><td>1/3/8</td><td style={{ textAlign: 'right', color: 'var(--accent-cyan)' }}>290</td><td style={{ textAlign: 'right' }}>340</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}