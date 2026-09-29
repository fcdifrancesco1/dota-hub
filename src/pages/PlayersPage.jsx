import React, { useState } from 'react';
import { UserCheck, Search, Scale, Trophy, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend
} from 'recharts';
import PlayerAvatar from '../components/PlayerAvatar';
import { useTheme } from '../context/ThemeContext';

// Cores do radar por tema (Recharts desenha em SVG, fora das classes do Tailwind)
const RADAR_COLORS = {
  dark: { grid: '#262F44', axis: '#94A3B8', tick: '#cbd5e1', radius: '#334155', playerA: '#10B981', playerB: '#F59E0B', legend: '#ffffff' },
  light: { grid: '#CDD3DB', axis: '#8A929C', tick: '#3B4450', radius: '#B4BAC2', playerA: '#0A7F58', playerB: '#023266', legend: '#18202B' }
};

// Lista de jogadores profissionais de referência
const PRO_PLAYERS_SAMPLE = [
  {
    id: 1,
    name: 'skiter',
    team: 'Team Falcons',
    role: 1,
    roleName: 'Posição 1 (Hard Carry)',
    country: 'Eslováquia',
    accountId: 100058342,
    stats: { kda: 6.8, gpm: 780, xpm: 810, lastHits: 410, killPart: 74 }
  },
  {
    id: 2,
    name: 'miCKe',
    team: 'Team Liquid',
    role: 1,
    roleName: 'Posição 1 (Hard Carry)',
    country: 'Suécia',
    accountId: 152962063,
    stats: { kda: 5.9, gpm: 740, xpm: 770, lastHits: 390, killPart: 68 }
  },
  {
    id: 3,
    name: 'Malr1ne',
    team: 'Team Falcons',
    role: 2,
    roleName: 'Posição 2 (Midlaner)',
    country: 'Rússia',
    accountId: 898455820,
    stats: { kda: 5.4, gpm: 690, xpm: 750, lastHits: 310, killPart: 82 }
  },
  {
    id: 4,
    name: 'Nisha',
    team: 'Team Liquid',
    role: 2,
    roleName: 'Posição 2 (Midlaner)',
    country: 'Polônia',
    accountId: 201358612,
    stats: { kda: 6.2, gpm: 710, xpm: 780, lastHits: 330, killPart: 80 }
  },
  {
    id: 5,
    name: 'ATF',
    team: 'Team Falcons',
    role: 3,
    roleName: 'Posição 3 (Offlaner)',
    country: 'Jordânia',
    accountId: 183719386,
    stats: { kda: 4.8, gpm: 640, xpm: 680, lastHits: 290, killPart: 75 }
  },
  {
    id: 6,
    name: 'SabeRLighT-',
    team: 'Team Liquid',
    role: 3,
    roleName: 'Posição 3 (Offlaner)',
    country: 'República Tcheca',
    accountId: 126212866,
    stats: { kda: 4.2, gpm: 580, xpm: 630, lastHits: 260, killPart: 70 }
  },
  {
    id: 7,
    name: 'Cr1t-',
    team: 'Team Falcons',
    role: 4,
    roleName: 'Posição 4 (Soft Support)',
    country: 'Dinamarca',
    accountId: 25907144,
    stats: { kda: 3.8, gpm: 410, xpm: 520, lastHits: 110, killPart: 86 }
  },
  {
    id: 8,
    name: 'Boxi',
    team: 'Team Liquid',
    role: 4,
    roleName: 'Posição 4 (Soft Support)',
    country: 'Suécia',
    accountId: 77490514,
    stats: { kda: 3.5, gpm: 390, xpm: 490, lastHits: 95, killPart: 83 }
  },
  {
    id: 9,
    name: 'Sneyking',
    team: 'Team Falcons',
    role: 5,
    roleName: 'Posição 5 (Hard Support / Capitão)',
    country: 'EUA',
    accountId: 10366616,
    stats: { kda: 3.2, gpm: 340, xpm: 440, lastHits: 65, killPart: 81 }
  },
  {
    id: 10,
    name: 'Insania',
    team: 'Team Liquid',
    role: 5,
    roleName: 'Posição 5 (Hard Support / Capitão)',
    country: 'Suécia',
    accountId: 54580962,
    stats: { kda: 3.1, gpm: 320, xpm: 420, lastHits: 58, killPart: 79 }
  }
];

export default function PlayersPage() {
  const [selectedRole, setSelectedRole] = useState('all');
  const { theme } = useTheme();
  const R = RADAR_COLORS[theme];
  const [search, setSearch] = useState('');
  
  // Comparador de 2 Jogadores
  const [playerA, setPlayerA] = useState(PRO_PLAYERS_SAMPLE[0]); // skiter
  const [playerB, setPlayerB] = useState(PRO_PLAYERS_SAMPLE[1]); // miCKe

  const filteredPlayers = PRO_PLAYERS_SAMPLE.filter(p => {
    const matchesRole = selectedRole === 'all' || String(p.role) === String(selectedRole);
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.team.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  // Dados normalizados para o Gráfico Radar (0-100)
  const radarData = [
    {
      metric: 'KDA',
      [playerA.name]: (playerA.stats.kda / 8) * 100,
      [playerB.name]: (playerB.stats.kda / 8) * 100,
      fullMark: 100
    },
    {
      metric: 'GPM (Farm)',
      [playerA.name]: (playerA.stats.gpm / 850) * 100,
      [playerB.name]: (playerB.stats.gpm / 850) * 100,
      fullMark: 100
    },
    {
      metric: 'XPM (Experiência)',
      [playerA.name]: (playerA.stats.xpm / 850) * 100,
      [playerB.name]: (playerB.stats.xpm / 850) * 100,
      fullMark: 100
    },
    {
      metric: 'Last Hits / min',
      [playerA.name]: (playerA.stats.lastHits / 450) * 100,
      [playerB.name]: (playerB.stats.lastHits / 450) * 100,
      fullMark: 100
    },
    {
      metric: 'Part. em Kills (%)',
      [playerA.name]: playerA.stats.killPart,
      [playerB.name]: playerB.stats.killPart,
      fullMark: 100
    }
  ];

  return (
    <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-line">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase font-serif tracking-tight flex items-center gap-2.5">
            <UserCheck className="w-7 h-7 text-amber-500" />
            <span>Jogadores Profissionais & Comparador</span>
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            Estatísticas detalhadas de cada posição (1 a 5) e gráfico radar comparativo lado a lado.
          </p>
        </div>

        {/* Filtro de Posição */}
        <div className="flex items-center gap-2 overflow-x-auto bg-surface-2 p-1 rounded-xl border border-line">
          {[
            { id: 'all', label: 'Todos' },
            { id: '1', label: 'Pos 1 (Carry)' },
            { id: '2', label: 'Pos 2 (Mid)' },
            { id: '3', label: 'Pos 3 (Off)' },
            { id: '4', label: 'Pos 4 (Sup)' },
            { id: '5', label: 'Pos 5 (Hard)' }
          ].map(r => (
            <button
              key={r.id}
              onClick={() => setSelectedRole(r.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap ${
                selectedRole === r.id ? 'bg-amber-500 text-black font-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* COMPARADOR RADAR LADO A LADO */}
      <div className="mb-12 bg-gradient-to-br from-surface-2 via-surface to-surface-2 border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                Ferramenta Exclusiva
              </span>
              <h2 className="text-lg font-black text-white uppercase tracking-tight">
                Comparador Direto de Desempenho (Radar Chart)
              </h2>
            </div>
          </div>

          {/* Seletores de Jogadores A e B */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-400">Jogador A:</span>
              <select
                value={playerA.id}
                onChange={(e) => setPlayerA(PRO_PLAYERS_SAMPLE.find(p => p.id === Number(e.target.value)))}
                className="bg-surface border border-emerald-500/40 text-emerald-400 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none"
              >
                {PRO_PLAYERS_SAMPLE.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.team})</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400">Jogador B:</span>
              <select
                value={playerB.id}
                onChange={(e) => setPlayerB(PRO_PLAYERS_SAMPLE.find(p => p.id === Number(e.target.value)))}
                className="bg-surface border border-amber-500/40 text-amber-400 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none"
              >
                {PRO_PLAYERS_SAMPLE.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.team})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Gráfico Radar & Detalhes */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Card Jogador A */}
          <div className="lg:col-span-3 bg-surface border border-emerald-500/30 rounded-2xl p-5 shadow-xl text-center">
            <PlayerAvatar accountId={playerA.accountId} name={playerA.name} className="w-20 h-20 rounded-2xl mx-auto mb-3 border-2 border-emerald-500/50 shadow-lg" />
            <h3 className="text-lg font-black text-white">{playerA.name}</h3>
            <span className="text-xs text-emerald-400 font-bold block">{playerA.team}</span>
            <span className="text-[11px] text-gray-500 block mb-4">{playerA.roleName}</span>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">KDA:</span>
                <span className="text-white font-bold">{playerA.stats.kda}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">GPM Médio:</span>
                <span className="text-white font-bold">{playerA.stats.gpm}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">XPM Médio:</span>
                <span className="text-white font-bold">{playerA.stats.xpm}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Kill Part.:</span>
                <span className="text-white font-bold">{playerA.stats.killPart}%</span>
              </div>
            </div>
          </div>

          {/* Gráfico Recharts Radar */}
          <div className="lg:col-span-6 h-[340px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke={R.grid} />
                <PolarAngleAxis dataKey="metric" stroke={R.axis} tick={{ fill: R.tick, fontSize: 11 }} />
                <PolarRadiusAxis stroke={R.radius} domain={[0, 100]} />
                <Radar
                  name={playerA.name}
                  dataKey={playerA.name}
                  stroke={R.playerA}
                  fill={R.playerA}
                  fillOpacity={0.4}
                />
                <Radar
                  name={playerB.name}
                  dataKey={playerB.name}
                  stroke={R.playerB}
                  fill={R.playerB}
                  fillOpacity={0.4}
                />
                <Legend wrapperStyle={{ color: R.legend, fontSize: '12px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Card Jogador B */}
          <div className="lg:col-span-3 bg-surface border border-amber-500/30 rounded-2xl p-5 shadow-xl text-center">
            <PlayerAvatar accountId={playerB.accountId} name={playerB.name} className="w-20 h-20 rounded-2xl mx-auto mb-3 border-2 border-amber-500/50 shadow-lg" />
            <h3 className="text-lg font-black text-white">{playerB.name}</h3>
            <span className="text-xs text-amber-400 font-bold block">{playerB.team}</span>
            <span className="text-[11px] text-gray-500 block mb-4">{playerB.roleName}</span>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">KDA:</span>
                <span className="text-white font-bold">{playerB.stats.kda}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">GPM Médio:</span>
                <span className="text-white font-bold">{playerB.stats.gpm}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">XPM Médio:</span>
                <span className="text-white font-bold">{playerB.stats.xpm}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Kill Part.:</span>
                <span className="text-white font-bold">{playerB.stats.killPart}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Jogadores */}
      <h3 className="text-sm font-black uppercase text-white mb-4">Diretório de Atletas Profissionais</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {filteredPlayers.map((p) => (
          <div
            key={p.id}
            className="bg-surface hover:bg-surface-2 border border-line hover:border-amber-500/40 rounded-2xl p-4 shadow-xl transition-all"
          >
            <PlayerAvatar accountId={p.accountId} name={p.name} className="w-14 h-14 rounded-xl mb-3 border border-white/10" />
            <h4 className="text-base font-black text-white truncate">{p.name}</h4>
            <span className="text-xs text-amber-400 font-bold block truncate">{p.team}</span>
            <span className="text-[10px] text-gray-500 block mb-3">{p.roleName}</span>

            <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-white/5">
              <span className="text-gray-400">KDA: <strong className="text-white">{p.stats.kda}</strong></span>
              <span className="text-gray-400">GPM: <strong className="text-white">{p.stats.gpm}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
