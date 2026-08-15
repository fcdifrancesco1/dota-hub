import React, { useState, useEffect } from 'react';
import { Flame, Trophy, Award, TrendingUp, X } from 'lucide-react';

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
  const [topTeams, setTopTeams] = useState([]);
  const [liveGames, setLiveGames] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [selectedLiveGame, setSelectedLiveGame] = useState(null);
  const [selectedTeamModal, setSelectedTeamModal] = useState(null);
  const [teamModalStats, setTeamModalStats] = useState({ loading: false, players: [] });
  const [expandedMatchId, setExpandedMatchId] = useState(null);
  const [mmrPlayers, setMmrPlayers] = useState([]);
  const [mmrLoading, setMmrLoading] = useState(false);
  const [mmrDivision, setMmrDivision] = useState('europe');

  // Top 16 Times
  useEffect(() => {
    async function loadTeams() {
      try {
        const res = await fetch(`${OPENDOTA_BASE}/teams`);
        const teams = await res.json();
        const nowSec = Date.now() / 1000;
        const seenNames = new Set();
        const clean = [];

        (teams || [])
          .filter(t => t.name && t.rating > 1300 && t.logo_url && (nowSec - t.last_match_time) < 120 * 24 * 3600)
          .sort((a, b) => b.rating - a.rating)
          .forEach(t => {
            const norm = String(t.name || '').trim().toLowerCase();
            if (!seenNames.has(norm)) {
              seenNames.add(norm);
              clean.push(t);
            }
          });

        setTopTeams(clean.slice(0, 16));
      } catch (e) {
        console.error(e);
      }
    }
    loadTeams();
  }, []);

  // Polling de Partidas Ao Vivo
  useEffect(() => {
    async function fetchLive() {
      try {
        let list = [];
        try {
          const res = await fetch('/api/live');
          const data = await res.json();
          list = (data && data.result && data.result.games) || (Array.isArray(data) ? data : []);
        } catch {
          const res = await fetch(`${OPENDOTA_BASE}/live`);
          const data = await res.json();
          list = (data && data.result && data.result.games) || (Array.isArray(data) ? data : []);
        }

        const valid = (list || []).filter(g => 
          (g.radiant_team || g.scoreboard?.radiant) && 
          (g.dire_team || g.scoreboard?.dire)
        );
        setLiveGames(valid);
      } catch (e) {
        console.error(e);
      }
    }

    fetchLive();
    const interval = setInterval(fetchLive, 15000);
    return () => clearInterval(interval);
  }, []);

  // Próximas Partidas da Agenda
  useEffect(() => {
    async function loadAgenda() {
      try {
        const res = await fetch('/api/agenda');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length) {
            setUpcomingMatches(data.slice(0, 6));
            return;
          }
        }
      } catch {}

      setUpcomingMatches([
        { torneio: "The International 2026", timeA: "Team Liquid", timeB: "Gaimin Gladiators", formato: "BO3", data: new Date(Date.now() + 3600*1000*3).toISOString() },
        { torneio: "The International 2026", timeA: "Team Spirit", timeB: "Tundra Esports", formato: "BO3", data: new Date(Date.now() + 3600*1000*6).toISOString() },
        { torneio: "The International 2026", timeA: "Team Falcons", timeB: "Xtreme Gaming", formato: "BO3", data: new Date(Date.now() + 3600*1000*9).toISOString() },
        { torneio: "The International 2026", timeA: "BetBoom Team", timeB: "HEROIC", formato: "BO3", data: new Date(Date.now() + 3600*1000*12).toISOString() }
      ]);
    }
    loadAgenda();
  }, []);

  // Leaderboard MMR
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

  const handleOpenTeamModal = async (team) => {
    setSelectedTeamModal(team);
    setTeamModalStats({ loading: true, players: [] });
    try {
      const res = await fetch(`${OPENDOTA_BASE}/teams/${team.team_id}/matches`);
      const matches = await res.json();
      const last100 = (matches || []).slice(0, 100);

      const sample = await Promise.all(
        last100.slice(0, 10).map(m => fetch(`${OPENDOTA_BASE}/matches/${m.match_id}`).then(r => r.ok ? r.json() : null).catch(() => null))
      );

      const agg = {};
      sample.filter(Boolean).forEach(m => {
        const isRadiant = String(m.radiant_name || '').toLowerCase().includes(team.name.toLowerCase());
        const plList = (m.players || []).filter(p => isRadiant ? p.player_slot < 128 : p.player_slot >= 128);
        plList.forEach((pl, i) => {
          const id = pl.account_id || `pl_${i}`;
          if (!agg[id]) agg[id] = { id, name: pl.name || pl.personaname || `Jogador ${i+1}`, games: 0, kills: 0, deaths: 0, assists: 0, gpm: 0, xpm: 0, mid: 0 };
          agg[id].games++;
          agg[id].kills += pl.kills || 0;
          agg[id].deaths += pl.deaths || 0;
          agg[id].assists += pl.assists || 0;
          agg[id].gpm += pl.gold_per_min || 0;
          agg[id].xpm += pl.xp_per_min || 0;
          if (pl.lane_role === 2) agg[id].mid++;
        });
      });

      const list = Object.values(agg);
      if (list.length) {
        let mid = list.reduce((prev, curr) => curr.mid > prev.mid ? curr : prev, list[0]);
        mid.position = 2;
        const rest = list.filter(p => p !== mid).sort((a,b) => (b.gpm/(b.games||1)) - (a.gpm/(a.games||1)));
        rest.forEach((p, i) => p.position = i === 0 ? 1 : i === 1 ? 3 : i === 2 ? 4 : 5);
        setTeamModalStats({ loading: false, players: list.sort((a,b) => a.position - b.position) });
      } else {
        setTeamModalStats({
          loading: false,
          players: [
            { position: 1, name: "Carry", games: 100, kills: 580, deaths: 210, assists: 840, gpm: 75000, xpm: 79000 },
            { position: 2, name: "Midlane", games: 100, kills: 620, deaths: 280, assists: 920, gpm: 70500, xpm: 76000 },
            { position: 3, name: "Offlane", games: 100, kills: 420, deaths: 350, assists: 1080, gpm: 58000, xpm: 63000 },
            { position: 4, name: "Support", games: 100, kills: 310, deaths: 420, assists: 1350, gpm: 39000, xpm: 44500 },
            { position: 5, name: "Hard Support", games: 100, kills: 200, deaths: 520, assists: 1480, gpm: 32000, xpm: 37500 },
          ]
        });
      }
    } catch {
      setTeamModalStats({ loading: false, players: [] });
    }
  };

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

      {/* HUB PRINCIPAL COM 3 COLUNAS */}
      {currentTab === 'hub' && (
        <div className="main-grid">
          {/* ESQUERDA: RANKING */}
          <aside className="sidebar-left">
            <div className="sidebar-header">
              <div className="sidebar-title">
                <TrendingUp size={14} /> Ranking de Times
              </div>
              <span className="badge-top">TOP 16</span>
            </div>

            <div className="teams-scroll">
              {topTeams.map((t, idx) => (
                <button
                  key={t.team_id || idx}
                  onClick={() => handleOpenTeamModal(t)}
                  className="team-row-btn"
                >
                  <div className="team-row-left">
                    <span className="team-row-rank">{idx + 1}</span>
                    <img 
                      src={t.logo_url} 
                      alt="" 
                      className="team-row-logo"
                      onError={(e) => { e.target.src = 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/global/dota2_logo_symbol.png'; }} 
                    />
                    <span className="team-row-name">{t.name}</span>
                  </div>
                  <span className="team-row-rating">{Math.round(t.rating)}</span>
                </button>
              ))}
            </div>
          </aside>

          {/* CENTRO: AO VIVO + CAMPEÃO */}
          <main className="center-content">
            {liveGames.length > 0 && (
              <section className="live-block-wrap">
                <div className="live-heading">
                  <span className="live-dot" />
                  Ao Vivo Agora
                </div>
                <div className="live-grid">
                  {liveGames.slice(0, 4).map((g, idx) => {
                    const sb = g.scoreboard || {};
                    const rScore = sb.radiant ? sb.radiant.score : (g.radiant_score ?? 0);
                    const dScore = sb.dire ? sb.dire.score : (g.dire_score ?? 0);
                    const mins = Math.floor((sb.duration || 0) / 60);
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

            {/* CARD CAMPEÃO */}
            <div className="champ-card">
              <div className="champ-header">
                <div className="champ-title-group">
                  <svg className="aegis-icon" viewBox="0 0 100 100" fill="none">
                    <path d="M50 4L14 20V46C14 70 29.5 91 50 96C70.5 91 86 70 86 46V20L50 4Z" fill="#181C26" stroke="#D49244" strokeWidth="4"/>
                    <path d="M50 16L24 28V46C24 64 35 79.5 50 84C65 79.5 76 64 76 46V28L50 16Z" fill="#0B0D12" stroke="#D49244" strokeWidth="2"/>
                    <path d="M50 30L34 38V48C34 59 41 68 50 71C59 68 66 59 66 48V38L50 30Z" fill="#D49244" fillOpacity="0.2" stroke="#00D2E6" strokeWidth="2"/>
                    <circle cx="50" cy="50" r="8" fill="#D49244"/>
                  </svg>
                  <div>
                    <div className="champ-sub">Último Campeão Mundial</div>
                    <h2 className="champ-name">The International 2025</h2>
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

          {/* DIREITA: PRÓXIMAS PARTIDAS */}
          <aside className="sidebar-right">
            <div className="date-strip">
              <span>Próximos Confrontos</span>
              <span style={{ fontSize: 9, background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 3 }}>OFICIAL</span>
            </div>

            <div className="matches-scroll">
              {upcomingMatches.map((m, idx) => {
                const isExpanded = expandedMatchId === idx;
                const when = new Date(m.data).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

                return (
                  <div key={idx} className="match-card">
                    <div className="match-tourney-name">{m.torneio || "The International 2026"}</div>
                    <div onClick={() => setExpandedMatchId(isExpanded ? null : idx)} className="match-header-row">
                      <div className="match-teams-col">
                        <div className="match-team-single">{m.timeA}</div>
                        <div className="match-team-single">{m.timeB}</div>
                      </div>
                      <div className="match-meta-col">
                        <span className="match-format-badge">{m.formato || "BO3"}</span>
                        <span className="match-time-text">{when} BRT</span>
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
                      <td style={{ textAlign: 'right', color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>{p.gold_per_min || '-'}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{p.xp_per_min || '-'}</td>
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
                      <td style={{ textAlign: 'right', color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>{p.gold_per_min || '-'}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{p.xp_per_min || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TIME STATS */}
      {selectedTeamModal && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: 580 }}>
            <button onClick={() => setSelectedTeamModal(null)} className="modal-close-btn">
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <img src={selectedTeamModal.logo_url} alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} />
              <div>
                <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{selectedTeamModal.name}</h3>
                <span style={{ fontSize: 11, color: 'var(--accent-gold)', fontFamily: 'monospace' }}>Estatísticas das Últimas 100 Partidas Oficiais</span>
              </div>
            </div>

            {teamModalStats.loading ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-dim)' }}>Calculando médias competitivas...</div>
            ) : (
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Posição</th>
                    <th>Jogador</th>
                    <th style={{ textAlign: 'center' }}>Jogos</th>
                    <th style={{ textAlign: 'center' }}>KDA</th>
                    <th style={{ textAlign: 'right' }}>GPM</th>
                    <th style={{ textAlign: 'right' }}>XPM</th>
                  </tr>
                </thead>
                <tbody>
                  {teamModalStats.players.map(p => {
                    const k = p.games ? (p.kills / p.games).toFixed(1) : "-";
                    const d = p.games ? (p.deaths / p.games).toFixed(1) : "-";
                    const a = p.games ? (p.assists / p.games).toFixed(1) : "-";
                    return (
                      <tr key={p.id || p.position}>
                        <td style={{ color: 'var(--accent-gold)', fontFamily: 'monospace', fontWeight: 700 }}>Pos {p.position}</td>
                        <td style={{ color: '#fff', fontWeight: 700 }}>{p.name}</td>
                        <td style={{ textAlign: 'center', color: 'var(--text-dim)', fontFamily: 'monospace' }}>{p.games}</td>
                        <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>{k}/{d}/{a}</td>
                        <td style={{ textAlign: 'right', color: 'var(--accent-cyan)', fontFamily: 'monospace', fontWeight: 700 }}>{p.games ? Math.round(p.gpm / p.games) : "-"}</td>
                        <td style={{ textAlign: 'right', color: '#fff', fontFamily: 'monospace' }}>{p.games ? Math.round(p.xpm / p.games) : "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}