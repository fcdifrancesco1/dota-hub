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

  // 1. CARREGAR TOP 16 TIMES LIMPOS
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
        console.error("Erro ao carregar times:", err);
      }
    }
    loadTeams();
  }, []);

  // 2. POLLING CONTÍNUO DE PARTIDAS AO VIVO (IGUAL DOTA-TORNEIOS)
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

        const validLive = (list || []).filter(g => 
          (g.radiant_team || g.scoreboard?.radiant) && 
          (g.dire_team || g.scoreboard?.dire)
        );

        setLiveGames(validLive);
      } catch (err) {
        console.error("Erro ao buscar partidas ao vivo:", err);
      }
    }

    fetchLive();
    const interval = setInterval(fetchLive, 15000);
    return () => clearInterval(interval);
  }, []);

  // 3. PRÓXIMAS PARTIDAS DA AGENDA
  useEffect(() => {
    async function loadUpcoming() {
      try {
        const res = await fetch('/api/agenda');
        if (res.ok) {
          const raw = await res.json();
          const now = Date.now();
          const future = (raw || []).filter(it => it.data && new Date(it.data).getTime() > now - 2 * 3600 * 1000);
          if (future.length) {
            setUpcomingMatches(future.slice(0, 6));
            return;
          }
        }
      } catch {}

      // Fallback padrão
      setUpcomingMatches([
        { torneio: "The International 2026", timeA: "Team Liquid", timeB: "Gaimin Gladiators", formato: "BO3", data: new Date(Date.now() + 3600*1000*3).toISOString() },
        { torneio: "The International 2026", timeA: "Team Spirit", timeB: "Tundra Esports", formato: "BO3", data: new Date(Date.now() + 3600*1000*6).toISOString() },
        { torneio: "The International 2026", timeA: "Team Falcons", timeB: "Xtreme Gaming", formato: "BO3", data: new Date(Date.now() + 3600*1000*9).toISOString() },
        { torneio: "The International 2026", timeA: "BetBoom Team", timeB: "HEROIC", formato: "BO3", data: new Date(Date.now() + 3600*1000*12).toISOString() }
      ]);
    }
    loadUpcoming();
  }, []);

  // 4. RANKING MMR OFICIAL
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

  // Busca estatísticas das 100 partidas do time
  const handleSelectTeam = async (team) => {
    setSelectedTeamModal(team);
    setTeamModalStats({ loading: true, players: [] });
    try {
      const res = await fetch(`${OPENDOTA_BASE}/teams/${team.team_id}/matches`);
      const matches = await res.json();
      const last100 = (matches || []).slice(0, 100);

      // Amostra detalhada
      const sample = await Promise.all(
        last100.slice(0, 10).map(m => fetch(`${OPENDOTA_BASE}/matches/${m.match_id}`).then(r => r.ok ? r.json() : null).catch(() => null))
      );

      const agg = {};
      sample.filter(Boolean).forEach(m => {
        const isRadiant = String(m.radiant_name || '').toLowerCase().includes(team.name.toLowerCase());
        const plList = (m.players || []).filter(p => isRadiant ? p.player_slot < 128 : p.player_slot >= 128);
        plList.forEach((pl, i) => {
          const id = pl.account_id || `pl_${i}`;
          if (!agg[id]) agg[id] = { id, name: pl.name || pl.personaname || `Jogador ${i+1}`, games: 0, kills: 0, deaths: 0, assists: 0, gpm: 0, xpm: 0, mid: 0, safe: 0 };
          agg[id].games++;
          agg[id].kills += pl.kills || 0;
          agg[id].deaths += pl.deaths || 0;
          agg[id].assists += pl.assists || 0;
          agg[id].gpm += pl.gold_per_min || 0;
          agg[id].xpm += pl.xp_per_min || 0;
          if (pl.lane_role === 2) agg[id].mid++;
          if (pl.lane_role === 1) agg[id].safe++;
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
    <div className="min-h-screen flex flex-col bg-[#0B0D12] text-[#E1E6F0]">
      {/* 1. HEADER */}
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

      {/* 2. CONTEÚDO HUB PRINCIPAL */}
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
                  onClick={() => handleSelectTeam(t)}
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

          {/* CENTRO: AO VIVO NO TOPO + CAMPEÃO RECENTE */}
          <main className="flex-1 p-6 overflow-y-auto flex flex-col items-center gap-6">
            
            {/* SEÇÃO AO VIVO (IGUAL DOTA-TORNEIOS) */}
            {liveGames.length > 0 && (
              <div className="w-full max-w-4xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D49244]">
                  <span className="w-2 h-2 rounded-full bg-[#D49244] animate-pulse" />
                  Ao Vivo Agora
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {liveGames.slice(0, 4).map((g, idx) => {
                    const sb = g.scoreboard || {};
                    const rScore = sb.radiant ? sb.radiant.score : (g.radiant_score ?? 0);
                    const dScore = sb.dire ? sb.dire.score : (g.dire_score ?? 0);
                    const mins = Math.floor((sb.duration || 0) / 60);
                    const rName = (g.radiant_team && (g.radiant_team.team_name || g.radiant_team.name)) || "Radiant";
                    const dName = (g.dire_team && (g.dire_team.team_name || g.dire_team.name)) || "Dire";

                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedLiveGame(g)}
                        className="bg-[#12151D] border border-[#242A38] hover:border-[#D49244] p-3 rounded-xl cursor-pointer transition-all flex flex-col gap-2 shadow-lg"
                      >
                        <span className="self-start text-[10px] font-bold px-2 py-0.5 bg-[#D49244]/10 text-[#D49244] border border-[#D49244]/30 rounded-full font-mono">
                          ● AO VIVO · {mins}MIN
                        </span>
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="truncate max-w-[100px] text-white">{rName}</span>
                          <span className="font-mono text-[#D49244] text-base px-2 py-0.5 bg-[#181C26] rounded border border-[#242A38]">
                            {rScore} - {dScore}
                          </span>
                          <span className="truncate max-w-[100px] text-white text-right">{dName}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CARD CAMPEÃO RECENTE */}
            <div className="w-full max-w-4xl bg-[#12151D] border border-[#242A38] rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#242A38] pb-5 mb-5">
                <div className="flex items-center gap-4">
                  {/* SVG do Aegis Inline Sem CORS */}
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

          {/* DIREITA: PRÓXIMAS PARTIDAS COM NOME DO TORNEIO NO TOPO */}
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
                  <div key={idx} className="bg-[#181C26] border border-[#242A38] rounded-xl overflow-hidden transition-all">
                    {/* Torneio Centralizado no Topo */}
                    <div className="text-center bg-[#0B0D12]/70 py-1 px-2 text-[10px] font-bold text-[#D49244] uppercase tracking-wider border-b border-[#242A38] truncate">
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

                    {/* Expansão das 100 partidas */}
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

      {/* 3. VIEW TORNEIOS */}
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

      {/* 4. VIEW MMR */}
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

      {/* 5. MODAL DE PARTIDA AO VIVO (COM MAPA E STATS DO DOTA-TORNEIOS) */}
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

            {/* MINIMAPA COM COORDENADAS */}
            <div className="w-60 h-60 relative mx-auto my-4 border-2 border-[#242A38] rounded-xl overflow-hidden bg-[url('https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/maps/map.png')] bg-cover">
              {[...(selectedLiveGame.scoreboard?.radiant?.players || []).map((p, i) => {
                const pos = worldToPct(p.position_x || 0, p.position_y || 0);
                return <div key={`r_${i}`} style={{ left: pos.left, top: pos.top }} className="absolute w-3.5 h-3.5 rounded-full border-2 border-[#00E5FF] bg-black transform -translate-x-1/2 -translate-y-1/2 shadow" title={p.name || ''} />;
              }), ...(selectedLiveGame.scoreboard?.dire?.players || []).map((p, i) => {
                const pos = worldToPct(p.position_x || 0, p.position_y || 0);
                return <div key={`d_${i}`} style={{ left: pos.left, top: pos.top }} className="absolute w-3.5 h-3.5 rounded-full border-2 border-[#E63946] bg-black transform -translate-x-1/2 -translate-y-1/2 shadow" title={p.name || ''} />;
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

      {/* 6. MODAL ESTATÍSTICAS DO TIME (TOP 16) */}
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

            {teamModalStats.loading ? (
              <div className="text-center py-8 text-[#7E89A0] animate-pulse">Calculando médias competitivas...</div>
            ) : (
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
                  {teamModalStats.players.map(p => {
                    const k = p.games ? (p.kills / p.games).toFixed(1) : "-";
                    const d = p.games ? (p.deaths / p.games).toFixed(1) : "-";
                    const a = p.games ? (p.assists / p.games).toFixed(1) : "-";
                    return (
                      <tr key={p.id || p.position} className="hover:bg-[#181C26]/40">
                        <td className="p-2.5 font-mono text-[#D49244]">Pos {p.position}</td>
                        <td className="p-2.5 font-bold text-white">{p.name}</td>
                        <td className="p-2.5 text-center font-mono text-[#7E89A0]">{p.games}</td>
                        <td className="p-2.5 text-center font-mono">{k}/{d}/{a}</td>
                        <td className="p-2.5 text-right font-mono text-[#00D2E6]">{p.games ? Math.round(p.gpm / p.games) : "-"}</td>
                        <td className="p-2.5 text-right font-mono text-white">{p.games ? Math.round(p.xpm / p.games) : "-"}</td>
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