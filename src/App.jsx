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

  // 1. POLLING DE PARTIDAS AO VIVO (SÓ EXIBE SE HOUVER PARTIDA REAL EM ANDAMENTO)
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

  // 2. FEED DE CONFRONTOS E RESULTADOS (COLUNA DIREITA)
  useEffect(() => {
    const feed = [
      { torneio: "The International 2026", timeA: "Xtreme Gaming", timeB: "Team Resilience", status: "EM BREVE", formato: "BO3", time: "11:00 BRT" },
      { torneio: "The International 2026", timeA: "OG", timeB: "GamerLegion", status: "EM BREVE", formato: "BO3", time: "12:30 BRT" },
      { torneio: "The International 2026", timeA: "Team Falcons", timeB: "BoomBoys", status: "EM BREVE", formato: "BO3", time: "14:00 BRT" },
      { torneio: "The International 2026", timeA: "LGD Gaming", timeB: "Vici Gaming", status: "AO VIVO", scoreA: 1, scoreB: 0, formato: "BO3", time: "AO VIVO" },
      { torneio: "The International 2026", timeA: "Team Liquid", timeB: "Iron Wing", status: "FINALIZADO", scoreA: 2, scoreB: 0, formato: "BO3", time: "05:40 BRT" },
      { torneio: "The International 2026", timeA: "TEAM VISION", timeB: "Team Spirit", status: "FINALIZADO", scoreA: 2, scoreB: 1, formato: "BO3", time: "04:38 BRT" },
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

      {/* HUB PRINCIPAL (LAYOUT CENTRALIZADO + COLUNA DIREITA) */}
      {currentTab === 'hub' && (
        <div className="main-grid">
          {/* CENTRO: AO VIVO (SÓ SE HOUVER) + CAMPEÃO THE INTERNATIONAL 2026 */}
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
                  {/* Aegis Oficial */}
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
                  <img src="https://steamcdn-a.akamaihd.net/apps/dota2/images/team_logos/2163.png" alt="" />
                  <span>Team Liquid</span>
                </div>
              </div>

              <div className="players-grid">
                {[
                  { pos: 1, nick: "miCKe", role: "Carry", kda: "5.8", gpm: 742 },
                  { pos: 2, nick: "Nisha", role: "Midlane", kda: "6.2", gpm: 698 },
                  { pos: 3, nick: "SabeRLighT-", role: "Offlane", kda: "4.1", gpm: 580 },
                  { pos: 4, nick: "Boxi", role: "Support", kda: "3.9", gpm: 390 },
                  { pos: 5, nick: "Insania", role: "Hard Support", kda: "3.2", gpm: 330 },
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

          {/* DIREITA: PRÓXIMAS PARTIDAS COM STATUS E PLACARES DOS JOGOS FINALIZADOS */}
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
              {(selectedLiveGame.radiant_team?.team_name || "Radiant")}
              <span style={{ color: 'var(--accent-gold)', fontSize: 20, margin: '0 12px' }}>
                {(selectedLiveGame.scoreboard?.radiant?.score || 0)} - {(selectedLiveGame.scoreboard?.dire?.score || 0)}
              </span>
              {(selectedLiveGame.dire_team?.team_name || "Dire")}
            </h3>

            <div className="minimap-box">
              {[...(selectedLiveGame.scoreboard?.radiant?.players || []).map((p, i) => {
                const pos = worldToPct(p.position_x || 0, p.position_y || 0);
                return <div key={`r_${i}`} style={{ left: pos.left, top: pos.top }} className="minimap-dot minimap-dot-radiant" title={p.name || ''} />;
              }), ...(selectedLiveGame.scoreboard?.dire?.players || []).map((p, i) => {
                const pos = worldToPct(p.position_x || 0, p.position_y || 0);
                return <div key={`d_${i}`} style={{ left: pos.left, top: pos.top }} className="minimap-dot minimap-dot-dire" title={p.name || ''} />;
              })]}
            </div>

            <div style={{ marginTop: 16, fontSize: 12 }}>
              <div style={{ color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: 4 }}>{(selectedLiveGame.radiant_team?.team_name || "Radiant")}</div>
              <table className="table-custom" style={{ marginTop: 0, marginBottom: 16 }}>
                <thead><tr><th>Jogador</th><th>K/D/A</th><th style={{ textAlign: 'right' }}>GPM</th><th style={{ textAlign: 'right' }}>XPM</th></tr></thead>
                <tbody>
                  {(selectedLiveGame.scoreboard?.radiant?.players || []).map((p, i) => (
                    <tr key={i}>
                      <td style={{ color: '#fff', fontWeight: 600 }}>{p.name || `Jogador ${i + 1}`}</td>
                      <td>{p.kills || 0}/{p.death || 0}/{p.assists || 0}</td>
                      <td style={{ textAlign: 'right', color: 'var(--accent-cyan)' }}>{p.gold_per_min || '-'}</td>
                      <td style={{ textAlign: 'right' }}>{p.xp_per_min || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ color: 'var(--accent-red)', fontWeight: 700, marginBottom: 4 }}>{(selectedLiveGame.dire_team?.team_name || "Dire")}</div>
              <table className="table-custom" style={{ marginTop: 0 }}>
                <thead><tr><th>Jogador</th><th>K/D/A</th><th style={{ textAlign: 'right' }}>GPM</th><th style={{ textAlign: 'right' }}>XPM</th></tr></thead>
                <tbody>
                  {(selectedLiveGame.scoreboard?.dire?.players || []).map((p, i) => (
                    <tr key={i}>
                      <td style={{ color: '#fff', fontWeight: 600 }}>{p.name || `Jogador ${i + 1}`}</td>
                      <td>{p.kills || 0}/{p.death || 0}/{p.assists || 0}</td>
                      <td style={{ textAlign: 'right', color: 'var(--accent-cyan)' }}>{p.gold_per_min || '-'}</td>
                      <td style={{ textAlign: 'right' }}>{p.xp_per_min || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}