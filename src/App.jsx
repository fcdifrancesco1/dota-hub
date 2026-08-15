import React, { useState, useEffect } from 'react';
import { Shield, TrendingUp, Trophy, Award, Flame, ChevronDown, ChevronUp, Clock, CheckCircle, Globe, X } from 'lucide-react';
import { getTop16Teams, getTeam100GamesStats, getOfficialMmr } from './services/api';

// Dados dos próximos jogos conforme o layout da imagem
const UPCOMING_MATCHES = [
  { id: 1, teamA: "Team Liquid", teamB: "Gaimin Gladiators", logoA: "https://steamcdn-a.akamaihd.net/apps/dota2/images/team_logos/2163.png", logoB: "https://steamcdn-a.akamaihd.net/apps/dota2/images/team_logos/8599101.png", format: "bo3", time: "16:00 BRT", date: "HOJE", teamAId: 2163, teamBId: 8599101 },
  { id: 2, teamA: "Team Spirit", teamB: "Tundra Esports", logoA: "https://steamcdn-a.akamaihd.net/apps/dota2/images/team_logos/7119388.png", logoB: "https://steamcdn-a.akamaihd.net/apps/dota2/images/team_logos/8261500.png", format: "bo3", time: "19:00 BRT", date: "HOJE", teamAId: 7119388, teamBId: 8261500 },
  { id: 3, teamA: "Team Falcons", teamB: "Xtreme Gaming", logoA: "https://steamcdn-a.akamaihd.net/apps/dota2/images/team_logos/9247354.png", logoB: "https://steamcdn-a.akamaihd.net/apps/dota2/images/team_logos/8254400.png", format: "bo3", time: "14:00 BRT", date: "AMANHÃ", teamAId: 9247354, teamBId: 8254400 },
  { id: 4, teamA: "BetBoom Team", teamB: "Heroic", logoA: "https://steamcdn-a.akamaihd.net/apps/dota2/images/team_logos/8255888.png", logoB: "https://steamcdn-a.akamaihd.net/apps/dota2/images/team_logos/9247354.png", format: "bo3", time: "17:30 BRT", date: "AMANHÃ", teamAId: 8255888, teamBId: 9247354 },
  { id: 5, teamA: "Nigma Galaxy", teamB: "Aurora Gaming", logoA: "https://steamcdn-a.akamaihd.net/apps/dota2/images/team_logos/7554697.png", logoB: "https://steamcdn-a.akamaihd.net/apps/dota2/images/team_logos/8255888.png", format: "bo3", time: "20:00 BRT", date: "AMANHÃ", teamAId: 7554697, teamBId: 8255888 },
];

export default function App() {
  const [currentTab, setCurrentTab] = useState('hub'); // 'hub' | 'torneios' | 'mmr'
  const [topTeams, setTopTeams] = useState([]);
  const [selectedTeamModal, setSelectedTeamModal] = useState(null);
  const [teamModalStats, setTeamModalStats] = useState({ loading: false, players: [] });
  const [expandedMatchId, setExpandedMatchId] = useState(null);
  const [matchStats, setMatchStats] = useState({ loading: false, teamA: [], teamB: [] });
  const [mmrDivision, setMmrDivision] = useState('europe');
  const [mmrPlayers, setMmrPlayers] = useState([]);
  const [mmrLoading, setMmrLoading] = useState(false);

  useEffect(() => {
    getTop16Teams().then(setTopTeams);
  }, []);

  useEffect(() => {
    if (currentTab === 'mmr') {
      setMmrLoading(true);
      getOfficialMmr(mmrDivision).then((data) => {
        setMmrPlayers(data.slice(0, 100));
        setMmrLoading(false);
      });
    }
  }, [currentTab, mmrDivision]);

  // Ao clicar no time do Ranking Top 16
  const handleOpenTeamModal = async (team) => {
    setSelectedTeamModal(team);
    setTeamModalStats({ loading: true, players: [] });
    const stats = await getTeam100GamesStats(team.team_id, team.name);
    setTeamModalStats({ loading: false, players: stats });
  };

  // Ao expandir partida da coluna da direita
  const handleToggleMatch = async (m) => {
    if (expandedMatchId === m.id) {
      setExpandedMatchId(null);
      return;
    }
    setExpandedMatchId(m.id);
    setMatchStats({ loading: true, teamA: [], teamB: [] });
    const [statsA, statsB] = await Promise.all([
      getTeam100GamesStats(m.teamAId, m.teamA),
      getTeam100GamesStats(m.teamBId, m.teamB),
    ]);
    setMatchStats({ loading: false, teamA: statsA, teamB: statsB });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0D12] text-[#E1E6F0]">
      {/* 1. TOPBAR: LOGO + APENAS "TORNEIOS" E "RANKING MMR" */}
      <header className="h-16 border-b border-[#242A38] bg-[#12151D] px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          {/* Logo estilo Aegis / Chama sem nenhum texto */}
          <button onClick={() => setCurrentTab('hub')} className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#D49244] to-[#7B461E] p-0.5 shadow-lg shadow-[#D49244]/20 flex items-center justify-center">
            <div className="w-full h-full bg-[#0B0D12] rounded-[10px] flex items-center justify-center">
              <Flame className="w-6 h-6 text-[#D49244]" />
            </div>
          </button>
        </div>

        {/* Abas Superiores Centrais */}
        <nav className="flex items-center gap-4">
          <button
            onClick={() => setCurrentTab(currentTab === 'torneios' ? 'hub' : 'torneios')}
            className={`px-6 py-2 rounded-lg font-bold text-sm tracking-widest uppercase transition-all flex items-center gap-2 ${
              currentTab === 'torneios'
                ? 'bg-[#D49244] text-[#0B0D12] shadow-md shadow-[#D49244]/30'
                : 'text-[#7E89A0] hover:text-white hover:bg-[#181C26]'
            }`}
          >
            <Trophy className="w-4 h-4" /> Torneios
          </button>

          <button
            onClick={() => setCurrentTab(currentTab === 'mmr' ? 'hub' : 'mmr')}
            className={`px-6 py-2 rounded-lg font-bold text-sm tracking-widest uppercase transition-all flex items-center gap-2 ${
              currentTab === 'mmr'
                ? 'bg-[#D49244] text-[#0B0D12] shadow-md shadow-[#D49244]/30'
                : 'text-[#7E89A0] hover:text-white hover:bg-[#181C26]'
            }`}
          >
            <Award className="w-4 h-4" /> Ranking MMR
          </button>
        </nav>

        <div className="w-11" />
      </header>

      {/* 2. CONTEÚDO PRINCIPAL */}
      {currentTab === 'hub' && (
        <div className="flex flex-1 overflow-hidden">
          {/* COLUNA ESQUERDA: RANKING DE TIMES (TOP 16) */}
          <aside className="w-64 bg-[#12151D] border-r border-[#242A38] flex flex-col h-[calc(100vh-4rem)]">
            <div className="p-3.5 border-b border-[#242A38] flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-[#D49244]">
                <TrendingUp className="w-4 h-4" /> Ranking Times
              </div>
              <span className="text-[10px] bg-[#181C26] px-2 py-0.5 rounded text-[#7E89A0] font-mono">TOP 16</span>
            </div>

            <div className="overflow-y-auto flex-1 p-2 space-y-1">
              {topTeams.map((team, idx) => (
                <button
                  key={team.team_id}
                  onClick={() => handleOpenTeamModal(team)}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg border border-transparent hover:border-[#242A38] hover:bg-[#181C26] transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-[#7E89A0] w-4">{idx + 1}</span>
                    <img src={team.logo_url} alt="" className="w-6 h-6 object-contain rounded" />
                    <span className="text-sm font-semibold text-white group-hover:text-[#D49244] transition-colors truncate max-w-[120px]">
                      {team.name}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-[#7E89A0]">{Math.round(team.rating)}</span>
                </button>
              ))}
            </div>
          </aside>

          {/* CENTRO: CAMPEÃO DO ÚLTIMO TORNEIO IMPORTANTE */}
          <main className="flex-1 p-8 overflow-y-auto flex flex-col items-center justify-center">
            <div className="w-full max-w-3xl bg-[#12151D] border border-[#242A38] rounded-2xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#D49244]/5 rounded-full blur-3xl pointer-events-none" />

              {/* Cabeçalho do Campeão */}
              <div className="flex items-center justify-between border-b border-[#242A38] pb-6 mb-6">
                <div className="flex items-center gap-4">
                  <img
                    src="https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/trophies/aegis.png"
                    alt="Aegis"
                    className="w-16 h-16 object-contain filter drop-shadow-[0_0_15px_rgba(212,146,68,0.4)]"
                  />
                  <div>
                    <div className="text-xs font-bold text-[#D49244] tracking-widest uppercase mb-1">Último Campeão Mundial</div>
                    <h2 className="text-2xl font-black text-white">The International 2025</h2>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-[#181C26] border border-[#242A38] px-4 py-2 rounded-xl">
                  <img src="https://steamcdn-a.akamaihd.net/apps/dota2/images/team_logos/2163.png" alt="Team Liquid" className="w-10 h-10 object-contain" />
                  <span className="text-lg font-bold text-white">Team Liquid</span>
                </div>
              </div>

              {/* 5 Jogadores do Campeão */}
              <div className="grid grid-cols-5 gap-3">
                {[
                  { pos: 1, nick: "miCKe", role: "Carry", kda: "5.8", gpm: 742 },
                  { pos: 2, nick: "Nisha", role: "Midlane", kda: "6.2", gpm: 698 },
                  { pos: 3, nick: "SabeRLighT-", role: "Offlane", kda: "4.1", gpm: 580 },
                  { pos: 4, nick: "Boxi", role: "Support", kda: "3.9", gpm: 390 },
                  { pos: 5, nick: "Insania", role: "Hard Support", kda: "3.2", gpm: 330 },
                ].map((p) => (
                  <div key={p.pos} className="bg-[#181C26] border border-[#242A38] rounded-xl p-3.5 flex flex-col items-center text-center">
                    <span className="w-6 h-6 rounded-full bg-[#0B0D12] text-[#D49244] font-mono text-xs font-bold flex items-center justify-center mb-1.5">
                      {p.pos}
                    </span>
                    <strong className="text-white text-sm truncate w-full">{p.nick}</strong>
                    <span className="text-[10px] text-[#7E89A0] uppercase mb-3">{p.role}</span>
                    <div className="w-full border-t border-[#242A38] pt-2 grid grid-cols-2 text-[10px] font-mono">
                      <div><span className="text-[#7E89A0] block">KDA</span>{p.kda}</div>
                      <div><span className="text-[#7E89A0] block">GPM</span><span className="text-[#00D2E6]">{p.gpm}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>

          {/* COLUNA DIREITA: PRÓXIMAS PARTIDAS */}
          <aside className="w-80 bg-[#12151D] border-l border-[#242A38] flex flex-col h-[calc(100vh-4rem)]">
            <div className="p-3.5 border-b border-[#242A38] flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-[#D49244]">Próximos Jogos</span>
            </div>

            {/* Faixa de Data estilo imagem de referência */}
            <div className="bg-[#A65A35] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white flex justify-between items-center shadow-inner">
              <span>Sexta-feira, 14 Agosto 2026</span>
              <span className="text-[10px] bg-black/30 px-2 py-0.5 rounded">AO VIVO / HOJE</span>
            </div>

            <div className="overflow-y-auto flex-1 p-3 space-y-2.5">
              {UPCOMING_MATCHES.map((m) => {
                const isExpanded = expandedMatchId === m.id;
                return (
                  <div key={m.id} className="bg-[#181C26] border border-[#242A38] rounded-xl overflow-hidden transition-all">
                    {/* Linhas da Partida no formato: Time A / Time B / BO3 / Data e Horario */}
                    <button
                      onClick={() => handleToggleMatch(m)}
                      className="w-full p-3.5 flex items-center justify-between hover:bg-[#242A38]/50 transition-colors text-left"
                    >
                      <div className="space-y-1.5 flex-1 pr-3">
                        <div className="flex items-center gap-2">
                          <img src={m.logoA} alt="" className="w-5 h-5 object-contain" />
                          <span className="font-bold text-sm text-white truncate max-w-[130px]">{m.teamA}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <img src={m.logoB} alt="" className="w-5 h-5 object-contain" />
                          <span className="font-bold text-sm text-white truncate max-w-[130px]">{m.teamB}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className="px-2 py-0.5 bg-[#D49244]/20 border border-[#D49244]/40 text-[#D49244] rounded text-[11px] font-bold uppercase">
                          {m.format}
                        </span>
                        <span className="text-[11px] font-mono text-[#7E89A0]">{m.time}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-[#7E89A0] mt-1" /> : <ChevronDown className="w-4 h-4 text-[#7E89A0] mt-1" />}
                      </div>
                    </button>

                    {/* Expansão das Estatísticas dos Últimos 100 Jogos */}
                    {isExpanded && (
                      <div className="p-3.5 bg-[#0B0D12] border-t border-[#242A38] space-y-4">
                        {matchStats.loading ? (
                          <div className="text-center py-4 text-xs text-[#7E89A0] animate-pulse">
                            Carregando médias dos últimos 100 jogos...
                          </div>
                        ) : (
                          <>
                            {/* Jogadores Time A */}
                            <div className="space-y-1.5">
                              <div className="text-xs font-bold text-[#D49244] border-b border-[#242A38] pb-1">{m.teamA}</div>
                              {matchStats.teamA.map((p) => (
                                <div key={p.id} className="flex justify-between text-[11px] text-[#7E89A0]">
                                  <span>Pos {p.position} - <strong className="text-white">{p.name}</strong></span>
                                  <span className="font-mono text-[#00D2E6]">{Math.round(p.gpm / (p.games || 1))} GPM</span>
                                </div>
                              ))}
                            </div>

                            {/* Jogadores Time B */}
                            <div className="space-y-1.5">
                              <div className="text-xs font-bold text-[#D49244] border-b border-[#242A38] pb-1">{m.teamB}</div>
                              {matchStats.teamB.map((p) => (
                                <div key={p.id} className="flex justify-between text-[11px] text-[#7E89A0]">
                                  <span>Pos {p.position} - <strong className="text-white">{p.name}</strong></span>
                                  <span className="font-mono text-[#00D2E6]">{Math.round(p.gpm / (p.games || 1))} GPM</span>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      )}

      {/* 3. TELA: TORNEIOS */}
      {currentTab === 'torneios' && (
        <div className="flex-1 p-8 overflow-y-auto max-w-6xl mx-auto space-y-8 w-full">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-[#D49244] uppercase tracking-wider mb-4">
              <Clock className="w-5 h-5" /> Próximos Torneios
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 1, name: "The International 2026", dates: "14 a 28 de Agosto, 2026", prizepool: "$3,000,000+", tier: "Tier 1" },
                { id: 2, name: "ESL One Birmingham 2026", dates: "10 a 18 de Outubro, 2026", prizepool: "$1,000,000", tier: "Tier 1" },
              ].map((t) => (
                <div key={t.id} className="bg-[#12151D] border border-[#242A38] p-5 rounded-xl hover:border-[#D49244] transition-all cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-white">{t.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-[#181C26] text-[#D49244] border border-[#242A38]">{t.tier}</span>
                  </div>
                  <p className="text-xs text-[#7E89A0]">{t.dates}</p>
                  <p className="text-xs text-[#00D2E6] font-mono mt-1">Premiação: {t.prizepool}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-[#7E89A0] uppercase tracking-wider mb-4">
              <CheckCircle className="w-5 h-5" /> Torneios Finalizados
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 3, name: "The International 2025", winner: "Team Liquid", prizepool: "$2,600,000", tier: "Tier 1" },
                { id: 4, name: "Riyadh Masters 2025", winner: "Gaimin Gladiators", prizepool: "$5,000,000", tier: "Tier 1" },
              ].map((t) => (
                <div key={t.id} className="bg-[#12151D] border border-[#242A38] p-5 rounded-xl hover:border-[#7E89A0] transition-all cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-white">{t.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-[#181C26] text-[#7E89A0]">{t.tier}</span>
                  </div>
                  <p className="text-xs text-[#D49244]">Campeão: <strong>{t.winner}</strong></p>
                  <p className="text-xs text-[#7E89A0] font-mono mt-1">Premiação: {t.prizepool}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. TELA: RANKING MMR (VALVE) */}
      {currentTab === 'mmr' && (
        <div className="flex-1 p-8 overflow-y-auto max-w-5xl mx-auto space-y-6 w-full">
          <div className="flex items-center justify-between border-b border-[#242A38] pb-4">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#D49244]" />
              <h2 className="text-lg font-bold uppercase tracking-wider text-white">Leaderboard Oficial Valve</h2>
            </div>

            <div className="flex gap-1 bg-[#12151D] p-1 rounded-lg border border-[#242A38]">
              {[
                { id: 'americas', label: 'Américas' },
                { id: 'europe', label: 'Europa' },
                { id: 'china', label: 'China' },
                { id: 'se_asia', label: 'Sudeste Asiático' },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setMmrDivision(r.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    mmrDivision === r.id ? 'bg-[#D49244] text-[#0B0D12]' : 'text-[#7E89A0] hover:text-white'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {mmrLoading ? (
            <div className="text-center py-12 text-[#7E89A0] animate-pulse">Carregando Leaderboard Oficial...</div>
          ) : (
            <div className="bg-[#12151D] border border-[#242A38] rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#181C26] text-[#7E89A0] text-xs font-mono border-b border-[#242A38]">
                  <tr>
                    <th className="p-3.5 pl-6 w-16">#</th>
                    <th className="p-3.5">Jogador</th>
                    <th className="p-3.5">País</th>
                    <th className="p-3.5 pr-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#242A38] font-medium">
                  {mmrPlayers.map((p) => (
                    <tr key={p.rank} className="hover:bg-[#181C26]/50 transition-colors">
                      <td className="p-3.5 pl-6 font-bold text-[#D49244] font-mono">{p.rank}</td>
                      <td className="p-3.5 font-bold text-white">
                        {p.team_tag && <span className="text-[#D49244] mr-1.5">[{p.team_tag}]</span>}
                        {p.name || 'Anônimo'}
                      </td>
                      <td className="p-3.5 text-xs text-[#7E89A0] uppercase font-mono">{p.country || '—'}</td>
                      <td className="p-3.5 pr-6 text-right text-xs text-[#00D2E6] font-mono">Immortal</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 5. MODAL: ESTATÍSTICAS DOS 100 JOGOS AO CLICAR EM UM TIME */}
      {selectedTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-[#12151D] border border-[#242A38] rounded-2xl p-6 shadow-2xl overflow-hidden">
            <button onClick={() => setSelectedTeamModal(null)} className="absolute top-4 right-4 text-[#7E89A0] hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <img src={selectedTeamModal.logo_url} alt="" className="w-10 h-10 object-contain" />
              <div>
                <h3 className="text-xl font-bold text-white">{selectedTeamModal.name}</h3>
                <span className="text-xs text-[#D49244] font-mono">Estatísticas das Últimas 100 Partidas Oficiais</span>
              </div>
            </div>

            {teamModalStats.loading ? (
              <div className="text-center py-10 text-[#7E89A0] animate-pulse">Calculando médias dos 5 jogadores...</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-[#181C26] text-[#7E89A0] text-xs font-mono border-b border-[#242A38]">
                  <tr>
                    <th className="p-3">Posição</th>
                    <th className="p-3">Jogador</th>
                    <th className="p-3 text-center">Jogos</th>
                    <th className="p-3 text-center">KDA</th>
                    <th className="p-3 text-right">GPM</th>
                    <th className="p-3 text-right">XPM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#242A38] font-medium">
                  {teamModalStats.players.map((p) => {
                    const k = p.games ? (p.kills / p.games).toFixed(1) : 0;
                    const d = p.games ? (p.deaths / p.games).toFixed(1) : 0;
                    const a = p.games ? (p.assists / p.games).toFixed(1) : 0;
                    return (
                      <tr key={p.id} className="hover:bg-[#181C26]/50">
                        <td className="p-3 font-mono text-[#D49244]">Pos {p.position}</td>
                        <td className="p-3 font-bold text-white">{p.name}</td>
                        <td className="p-3 text-center font-mono text-[#7E89A0]">{p.games}</td>
                        <td className="p-3 text-center font-mono">{k}/{d}/{a}</td>
                        <td className="p-3 text-right font-mono text-[#00D2E6]">{Math.round(p.gpm / (p.games || 1))}</td>
                        <td className="p-3 text-right font-mono text-white">{Math.round(p.xpm / (p.games || 1))}</td>
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