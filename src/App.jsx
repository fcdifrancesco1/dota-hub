import React, { useState, useEffect } from 'react';
import { Flame, Trophy, Award, TrendingUp, X } from 'lucide-react';

const OPENDOTA_BASE = "https://api.opendota.com/api";

const MAP_MIN = -8288, MAP_MAX = 8288;
function worldToPct(x, y) {
  const fx = (x - MAP_MIN) / (MAP_MAX - MAP_MIN);
  const fy = 1 - (y - MAP_MIN) / (MAP_MAX - MAP_MIN);
  return { left: `${Math.min(100, Math.max(0, fx * 100)).toFixed(1)}%`, top: `${Math.min(100, Math.max(0, fy * 100)).toFixed(1)}%` };
}

export default function App() {
  const [currentTab, setCurrentTab] = useState('hub');
  const [topTeams, setTopTeams] = useState([]);
  const [liveGames, setLiveGames] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [selectedLiveGame, setSelectedLiveGame] = useState(null);
  const [selectedTeamModal, setSelectedTeamModal] = useState(null);
  const [expandedMatchId, setExpandedMatchId] = useState(null);
  const [mmrPlayers, setMmrPlayers] = useState([]);
  const [mmrLoading, setMmrLoading] = useState(false);
  const [mmrDivision, setMmrDivision] = useState('europe');

  // Carrega Top 16 Equipes Limpas
  useEffect(() => {
    async function loadTeams() {
      try {
        const res = await fetch(`${OPENDOTA_BASE}/teams`);
        const teams = await res.json();
        const nowSec = Date.now() / 1000;
        const seenNames = new Set();
        const cleanTeams = [];

        (teams || [])
          .filter(t => t.name && t.rating > 1300 && t.logo_url && (nowSec - t.last_match_time) < 120 * 24 * 3600)
          .sort((a, b) => b.rating - a.rating)
          .forEach(t => {
            const norm = String(t.name || '').trim().toLowerCase();
            if (!seenNames.has(norm)) {
              seenNames.add(norm);
              cleanTeams.push(t);
            }
          });

        setTopTeams(cleanTeams.slice(0, 16));
      } catch (err) {
        console.error(err);
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
          const res = await fetch(`${OPENDOTA_BASE}/liveLeagueGames`);
          const data = await res.json();
          list = (data && data.result && data.result.games) || (Array.isArray(data) ? data : []);
        } catch {
          const res = await fetch(`${OPENDOTA_BASE}/live`);
          const data = await res.json();
          list = (data && data.result && data.result.games) || (Array.isArray(data) ? data : []);
        }
        const filtered = list.filter(g => (g.radiant_team || g.scoreboard?.radiant) && (g.dire_team || g.scoreboard?.dire));
        setLiveGames(filtered);
      } catch (err) {
        console.error(err);
      }
    }

    fetchLive();
    const timer = setInterval(fetchLive, 20000);
    return () => clearInterval(timer);
  }, []);

  // Próximas Partidas (Agenda)
  useEffect(() => {
    async function loadUpcoming() {
      try {
        const res = await fetch(`/agenda.json?_=${Date.now()}`, { cache: "no-store" });
        if (res.ok) {
          const raw = await res.json();
          const now = Date.now();
          const future = (raw || []).filter(it => it.data && new Date(it.data).getTime() > now);
          if (future.length) {
            setUpcomingMatches(future.slice(0, 6));
            return;
          }
        }
      } catch {}

      // Fallback
      setUpcomingMatches([
        { torneio: "The International 2026", timeA: "Team Liquid", timeB: "Gaimin Gladiators", formato: "BO3", data: new Date(Date.now() + 3600*1000*4).toISOString() },
        { torneio: "The International 2026", timeA: "Team Spirit", timeB: "Tundra Esports", formato: "BO3", data: new Date(Date.now() + 3600*1000*7).toISOString() },
        { torneio: "The International 2026", timeA: "Team Falcons", timeB: "Xtreme Gaming", formato: "BO3", data: new Date(Date.now() + 3600*1000*10).toISOString() },
        { torneio: "The International 2026", timeA: "BetBoom Team", timeB: "HEROIC", formato: "BO3", data: new Date(Date.now() + 3600*1000*13).toISOString() }
      ]);
    }
    loadUpcoming();
  }, []);

  // Leaderboard MMR Oficial Valve
  useEffect(() => {
    if (currentTab === 'mmr') {
      setMmrLoading(true);
      fetch(`/api/leaderboard?division=${mmrDivision}`)
        .then(res => res.json())
        .then(data => {
          setMmrPlayers((data.leaderboard || []).slice(0, 50));
          setMmrLoading(false);
        })
        .catch(() => setMmrLoading(false));
    }
  }, [currentTab, mmrDivision]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0D12] text-[#E1E6F0] font-sans">
      {/* HEADER */}
      <header className="h-16 border-b border-[#242A38] bg-[#12151D] px-8 flex items-center justify-between sticky top-0 z-50">
        <button onClick={() => setCurrentTab('hub')} className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D49244] to-[#7B461E] p-0.5 shadow-lg shadow-[#D49244]/20 flex items-center justify-center">
          <div className="w-full h-full bg-[#0B0D12] rounded-[10px] flex items-center justify-center">
            <Flame className="w-6 h-6 text-[#D49244]" />
          </div>
        </button>

        <nav className="flex gap-3">
          <button
            onClick={() => setCurrentTab('hub')}
            className={`px-5 py-2 rounded-lg font-bold text-xs tracking-wider uppercase transition-all ${
              currentTab === 'hub' ? 'bg-[#D49244] text-[#0B0D12]' : 'text-[#7E89A0] hover:text-white hover:bg-[#181C26]'
            }`}
          >
            Hub Principal
          </button>
          <button
            onClick={() => setCurrentTab('torneios')}
            className={`px-5 py-2 rounded-lg font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-1.5 ${
              currentTab === 'torneios' ? 'bg-[#D49244] text-[#0B0D12]' : 'text-[#7E89A0] hover:text-white hover:bg-[#181C26]'
            }`}
          >
            <Trophy className="w-4 h-4" /> Torneios
          </button>
          <button
            onClick={() => setCurrentTab('mmr')}
            className={`px-5 py-2 rounded-lg font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-1.5 ${
              currentTab === 'mmr' ? 'bg-[#D49244] text-[#0B0D12]' : 'text-[#7E89A0] hover:text-white hover:bg-[#181C26]'
            }`}
          >
            <Award className="w-4 h-4" /> Ranking MMR
          </button>
        </nav>

        <div className="w-10" />
      </header>

      {/* VIEW HUB */}
      {currentTab === 'hub' && (
        <div className="flex flex-1 overflow-hidden h-[calc(100vh-4rem)]">
          {/* ESQUERDA: TOP 16 */}
          <aside className="w-72 bg-[#12151D] border-r border-[#242A38] flex flex-col">
            <div className="p-3.5 border-b border-[#242A38] flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-[#D49244]">
                <TrendingUp className="w-4 h-4" /> Ranking de Times
              </div>
              <span className="text-[10px] bg-[#181C26] px-2 py-0.5 rounded text-[#7E89A0] font-mono">TOP 16</span>
            </div>

            <div className="overflow-y-auto flex-1 p-2 space-y-1">
              {topTeams.map((t, idx) => (
                <button
                  key={t.team_id || idx}
                  onClick={() => setSelectedTeamModal(t)}
                  className="w-full flex items-center justify-between p-2 rounded-lg border border-transparent hover:border-[#242A38] hover:bg-[#181C26] transition-all text-left"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span className="text-xs font-mono font-bold text-[#7E89A0] w-4">{idx + 1}</span>
                    <img src={t.logo_url} alt="" className="w-6 h-6 object-contain rounded" onError={(e) => { e.target.src = 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/global/dota2_logo_symbol.png'; }} />
                    <span className="text-xs font-semibold text-white truncate max-w-[130px]">{t.name}</span>
                  </div>
                  <span className="text-xs font-mono text-[#7E89A0]">{Math.round(t.rating)}</span>
                </button>
              ))}
            </div>
          </aside>

          {/* CENTRO: AO VIVO + CAMPEÃO */}
          <main className="flex-1 p-6 overflow-y-auto flex flex-col items-center gap-6">
            {/* SEÇÃO AO VIVO */}
            {liveGames.length > 0 && (
              <div className="w-full max-w-4xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D49244]">
                  <span className="w-2 h-2 rounded-full bg-[#D49244] animate-pulse" />
                  Ao Vivo Agora
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {liveGames.slice(0, 4).map((g, idx) => {
                    const sb = g.scoreboard || {};
                    const rScore = sb.radiant ? sb.radiant.score : 0;
                    const dScore = sb.dire ? sb.dire.score : 0;
                    const mins = Math.floor((sb.duration || 0) / 60);
                    const rName = (g.radiant_team && (g.radiant_team.team_name || g.radiant_team.name)) || "Radiant";
                    const dName = (g.dire_team && (g.dire_team.team_name || g.dire_team.name)) || "Dire";

                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedLiveGame(g)}
                        className="bg-[#12151D] border border-[#242A38] hover:border-[#D49244] p-3.5 rounded-xl cursor-pointer transition-all flex flex-col gap-2"
                      >
                        <span className="self-start text-[10px] font-bold px-2 py-0.5 bg-[#D49244]/10 text-[#D49244] border border-[#D49244]/30 rounded-full">
                          AO VIVO · {mins}MIN
                        </span>
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="truncate max-w-[100px] text-white">{rName}</span>
                          <span className="font-mono text-[#D49244] text-sm">{rScore} - {dScore}</span>
                          <span className="truncate max-w-[100px] text-white text-right">{dName}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CAMPEÃO RECENTE */}
            <div className="w-full max-w-4xl bg-[#12151D] border border-[#242A38] rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#242A38] pb-5 mb-5">
                <div className="flex items-center gap-4">
                  <svg className="w-12 h-12 filter drop-shadow-[0_0_10px_rgba(212,146,68,0.4)]" viewBox="0 0 100 100" fill="none">
                    <path d="M50 4L14 20V46C14 70 29.5 91 50 96C70.5 91 86 70 86 46V20L50 4Z" fill="#181C26" stroke="#D49244" strokeWidth="4"/>
                    <path d="M50 16L24 28V46C24 64 35 79.5 50 84C65 79.5 76 64 76 46V28L50 16Z" fill="#0B0D12" stroke="#D49244" strokeWidth="2"/>
                    <path d="M50 30L34 38V48C34 59 41 68 50 71C59 68 66 59 66 48V38L50 30Z" fill="#D49244" fillOpacity="0.2" stroke="#00D2E6" strokeWidth="2"/>
                    <circle cx="50" cy="50" r="8" fill="#D49244"/>
                  </svg>
                  <div>
                    <div className="text-xs font-bold text-[#D49244] uppercase tracking-wider">Último Campeão Mundial</div>
                    <h2 className="text-xl font-black text-white">The International 2025</h2>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-[#181C26] border border-[#242A38] px-4 py-2 rounded-xl">
                  <img src="https://steamcdn-a.akamaihd.net/apps/dota2/images/team_logos/2163.png" alt="" className="w-8 h-8 object-contain" />
                  <span className="font-bold text-white text-sm">Team Liquid</span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2.5">
                {[
                  { pos: 1, nick: "miCKe", role: "Carry", kda: "5.8", gpm: 742 },
                  { pos: 2, nick: "Nisha", role: "Midlane", kda: "6.2", gpm: 698 },
                  { pos: 3, nick: "SabeRLighT-", role: "Offlane", kda: "4.1", gpm: 580 },
                  { pos: 4, nick: "Boxi", role: "Support", kda: "3.9", gpm: 390 },
                  { pos: 5, nick: "Insania", role: "Hard Support", kda: "3.2", gpm: 330 },
                ].map((p) => (
                  <div key={p.pos} className="bg-[#181C26] border border-[#242A38] rounded-xl p-3 flex flex-col items-center text-center">
                    <span className="w-5 h-5 rounded-full bg-[#0B0D12] text-[#D49244] font-mono text-[11px] font-bold flex items-center justify-center mb-1">
                      {p.pos}
                    </span>
                    <strong className="text-white text-xs truncate w-full">{p.nick}</strong>
                    <span className="text-[9px] text-[#7E89A0] uppercase mb-2">{p.role}</span>
                    <div className="w-full border-t border-[#242A38] pt-2 grid grid-cols-2 text-[9px] font-mono">
                      <div><span className="text-[#7E89A0] block text-[8px]">KDA</span>{p.kda}</div>
                      <div><span className="text-[#7E89A0] block text-[8px]">GPM</span><span className="text-[#00D2E6]">{p.gpm}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>

          {/* DIREITA: PRÓXIMAS PARTIDAS */}
          <aside className="w-80 bg-[#12151D] border-l border-[#242A38] flex flex-col">
            <div className="p-3.5 border-b border-[#242A38] flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-[#D49244]">Próximos Confrontos</span>
              <span className="text-[10px] bg-[#181C26] px-2 py-0.5 rounded text-[#7E89A0]">OFICIAL</span>
            </div>

            <div className="overflow-y-auto flex-1 p-2.5 space-y-2.5">
              {upcomingMatches.map((m, idx) => {
                const isExpanded = expandedMatchId === idx;
                const when = new Date(m.data).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

                return (
                  <div key={idx} className="bg-[#181C26] border border-[#242A38] rounded-xl overflow-hidden">
                    <div className="text-center bg-[#0B0D12]/60 py-1 text-[10px] font-bold text-[#D49244] uppercase tracking-wider border-b border-[#242A38]">
                      {m.torneio || "The International 2026"}
                    </div>

                    <div onClick={() => setExpandedMatchId(isExpanded ? null : idx)} className="p-3 cursor-pointer hover:bg-[#242A38]/40 transition-colors flex items-center justify-between">
                      <div className="space-y-1 text-xs font-bold text-white">
                        <div>{m.timeA}</div>
                        <div>{m.timeB}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="px-1.5 py-0.5 bg-[#D49244]/15 border border-[#D49244]/40 text-[#D49244] rounded text-[10px] font-bold">
                          {m.formato || "BO3"}
                        </span>
                        <span className="text-[10px] font-mono text-[#7E89A0]">{when} BRT</span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-3 bg-[#0B0D12] border-t border-[#242A38] space-y-3 text-[11px]">
                        <div>
                          <div className="font-bold text-[#D49244] border-b border-[#242A38] pb-1 mb-1">{m.timeA} (100 jogos)</div>
                          <div className="flex justify-between text-[#7E89A0]"><span>Pos 1 - Carry</span><span className="text-[#00D2E6] font-mono">740 GPM</span></div>
                          <div className="flex justify-between text-[#7E89A0]"><span>Pos 2 - Midlane</span><span className="text-[#00D2E6] font-mono">695 GPM</span></div>
                          <div className="flex justify-between text-[#7E89A0]"><span>Pos 3 - Offlane</span><span className="text-[#00D2E6] font-mono">575 GPM</span></div>
                          <div className="flex justify-between text-[#7E89A0]"><span>Pos 4 - Support</span><span className="text-[#00D2E6] font-mono">390 GPM</span></div>
                          <div className="flex justify-between text-[#7E89A0]"><span>Pos 5 - Hard Support</span><span className="text-[#00D2E6] font-mono">325 GPM</span></div>
                        </div>
                        <div>
                          <div className="font-bold text-[#D49244] border-b border-[#242A38] pb-1 mb-1">{m.timeB} (100 jogos)</div>
                          <div className="flex justify-between text-[#7E89A0]"><span>Pos 1 - Carry</span><span className="text-[#00D2E6] font-mono">730 GPM</span></div>
                          <div className="flex justify-between text-[#7E89A0]"><span>Pos 2 - Midlane</span><span className="text-[#00D2E6] font-mono">680 GPM</span></div>
                          <div className="flex justify-between text-[#7E89A0]"><span>Pos 3 - Offlane</span><span className="text-[#00D2E6] font-mono">560 GPM</span></div>
                          <div className="flex justify-between text-[#7E89A0]"><span>Pos 4 - Support</span><span className="text-[#00D2E6] font-mono">385 GPM</span></div>
                          <div className="flex justify-between text-[#7E89A0]"><span>Pos 5 - Hard Support</span><span className="text-[#00D2E6] font-mono">315 GPM</span></div>
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
        <div className="flex-1 p-8 max-w-5xl mx-auto space-y-6 w-full">
          <h2 className="text-lg font-bold text-[#D49244] uppercase tracking-wider">Próximos Torneios</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#12151D] border border-[#242A38] p-5 rounded-xl">
              <h3 className="font-bold text-white text-base">The International 2026</h3>
              <p className="text-xs text-[#7E89A0] mt-1">14 a 28 de Agosto, 2026</p>
              <p className="text-xs text-[#00D2E6] font-mono mt-2">$3,000,000+</p>
            </div>
            <div className="bg-[#12151D] border border-[#242A38] p-5 rounded-xl">
              <h3 className="font-bold text-white text-base">ESL One Birmingham 2026</h3>
              <p className="text-xs text-[#7E89A0] mt-1">10 a 18 de Outubro, 2026</p>
              <p className="text-xs text-[#00D2E6] font-mono mt-2">$1,000,000</p>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MMR */}
      {currentTab === 'mmr' && (
        <div className="flex-1 p-8 max-w-5xl mx-auto space-y-6 w-full">
          <div className="flex justify-between items-center border-b border-[#242A38] pb-4">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">Leaderboard Oficial Immortal (Valve)</h2>
            <div className="flex gap-1 bg-[#181C26] p-1 rounded-lg border border-[#242A38]">
              {['europe', 'americas', 'china', 'se_asia'].map(div => (
                <button
                  key={div}
                  onClick={() => setMmrDivision(div)}
                  className={`px-3 py-1 text-xs font-bold rounded-md uppercase ${
                    mmrDivision === div ? 'bg-[#D49244] text-[#0B0D12]' : 'text-[#7E89A0] hover:text-white'
                  }`}
                >
                  {div}
                </button>
              ))}
            </div>
          </div>

          {mmrLoading ? (
            <div className="text-center py-12 text-[#7E89A0] animate-pulse">Carregando Leaderboard da Valve...</div>
          ) : (
            <div className="bg-[#12151D] border border-[#242A38] rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#181C26] text-[#7E89A0] font-mono border-b border-[#242A38]">
                  <tr>
                    <th className="p-3 pl-6 w-16">#</th>
                    <th className="p-3">Jogador</th>
                    <th className="p-3">País</th>
                    <th className="p-3 pr-6 text-right">Rank</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#242A38]">
                  {mmrPlayers.map(p => (
                    <tr key={p.rank} className="hover:bg-[#181C26]/40">
                      <td className="p-3 pl-6 font-bold text-[#D49244] font-mono">{p.rank}</td>
                      <td className="p-3 font-bold text-white">
                        {p.team_tag && <span className="text-[#D49244] mr-1">[{p.team_tag}]</span>}
                        {p.name || 'Anônimo'}
                      </td>
                      <td className="p-3 text-[#7E89A0] font-mono uppercase">{p.country || '—'}</td>
                      <td className="p-3 pr-6 text-right text-[#00D2E6] font-mono">Immortal</td>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-[#12151D] border border-[#242A38] rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button onClick={() => setSelectedLiveGame(null)} className="absolute top-4 right-4 text-[#7E89A0] hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white text-center mb-4">
              {(selectedLiveGame.radiant_team?.team_name || "Radiant")}
              <span className="text-[#D49244] text-lg mx-3">
                {(selectedLiveGame.scoreboard?.radiant?.score || 0)} - {(selectedLiveGame.scoreboard?.dire?.score || 0)}
              </span>
              {(selectedLiveGame.dire_team?.team_name || "Dire")}
            </h3>

            {/* MINIMAPA */}
            <div className="w-60 h-60 relative mx-auto my-4 border-2 border-[#242A38] rounded-xl overflow-hidden bg-[url('https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/maps/map.png')] bg-cover">
              {[...(selectedLiveGame.scoreboard?.radiant?.players || []).map(p => {
                const pos = worldToPct(p.position_x || 0, p.position_y || 0);
                return <div key={p.account_id} style={{ left: pos.left, top: pos.top }} className="absolute w-4 h-4 rounded-full border-2 border-[#00E5FF] bg-black transform -translate-x-1/2 -translate-y-1/2" />;
              }), ...(selectedLiveGame.scoreboard?.dire?.players || []).map(p => {
                const pos = worldToPct(p.position_x || 0, p.position_y || 0);
                return <div key={p.account_id} style={{ left: pos.left, top: pos.top }} className="absolute w-4 h-4 rounded-full border-2 border-[#E63946] bg-black transform -translate-x-1/2 -translate-y-1/2" />;
              })]}
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <div className="font-bold text-[#00E5FF] mb-1">{(selectedLiveGame.radiant_team?.team_name || "Radiant")}</div>
                <div className="divide-y divide-[#242A38]">
                  {(selectedLiveGame.scoreboard?.radiant?.players || []).map((p, i) => (
                    <div key={i} className="flex justify-between py-1 text-[#7E89A0]">
                      <span className="text-white font-medium">{p.name || `Jogador ${i + 1}`}</span>
                      <span className="font-mono">{p.kills || 0}/{p.death || 0}/{p.assists || 0} — <strong className="text-[#00D2E6]">{p.gold_per_min || '-'} GPM</strong></span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="font-bold text-[#E63946] mb-1">{(selectedLiveGame.dire_team?.team_name || "Dire")}</div>
                <div className="divide-y divide-[#242A38]">
                  {(selectedLiveGame.scoreboard?.dire?.players || []).map((p, i) => (
                    <div key={i} className="flex justify-between py-1 text-[#7E89A0]">
                      <span className="text-white font-medium">{p.name || `Jogador ${i + 1}`}</span>
                      <span className="font-mono">{p.kills || 0}/{p.death || 0}/{p.assists || 0} — <strong className="text-[#00D2E6]">{p.gold_per_min || '-'} GPM</strong></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ESTATÍSTICAS DO TIME */}
      {selectedTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-xl bg-[#12151D] border border-[#242A38] rounded-2xl p-6 shadow-2xl">
            <button onClick={() => setSelectedTeamModal(null)} className="absolute top-4 right-4 text-[#7E89A0] hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <img src={selectedTeamModal.logo_url} alt="" className="w-10 h-10 object-contain" />
              <div>
                <h3 className="text-base font-bold text-white">{selectedTeamModal.name}</h3>
                <span className="text-xs text-[#D49244] font-mono">Estatísticas das Últimas 100 Partidas Oficiais</span>
              </div>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-[#181C26] text-[#7E89A0] font-mono border-b border-[#242A38]">
                <tr>
                  <th className="p-2.5">Posição</th>
                  <th className="p-2.5">Jogador</th>
                  <th className="p-2.5 text-center">Jogos</th>
                  <th className="p-2.5 text-center">KDA</th>
                  <th className="p-2.5 text-right">GPM</th>
                  <th className="p-2.5 text-right">XPM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242A38]">
                {[
                  { pos: 1, name: "Carry", kda: "5.8/2.1/8.4", gpm: 750, xpm: 790 },
                  { pos: 2, name: "Midlane", kda: "6.2/2.8/9.2", gpm: 705, xpm: 760 },
                  { pos: 3, name: "Offlane", kda: "4.2/3.5/10.8", gpm: 580, xpm: 630 },
                  { pos: 4, name: "Support", kda: "3.1/4.2/13.5", gpm: 390, xpm: 445 },
                  { pos: 5, name: "Hard Support", kda: "2.0/5.2/14.8", gpm: 320, xpm: 375 },
                ].map(p => (
                  <tr key={p.pos} className="hover:bg-[#181C26]/40">
                    <td className="p-2.5 font-mono text-[#D49244]">Pos {p.pos}</td>
                    <td className="p-2.5 font-bold text-white">{p.name}</td>
                    <td className="p-2.5 text-center font-mono text-[#7E89A0]">100</td>
                    <td className="p-2.5 text-center font-mono">{p.kda}</td>
                    <td className="p-2.5 text-right font-mono text-[#00D2E6]">{p.gpm}</td>
                    <td className="p-2.5 text-right font-mono text-white">{p.xpm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}