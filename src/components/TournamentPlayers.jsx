import React, { useMemo, useState } from 'react';
import { ArrowDown, Coins, Crosshair, Swords, Trophy } from 'lucide-react';
import TeamLogo from '../utils/teamLogos';
import { getHeroImg, getHeroName } from '../services/api';
import { useOpenTeam } from '../utils/teamRoute';

// Colunas ordenáveis da tabela
const COLUMNS = [
  { id: 'games', label: 'Jogos', title: 'Partidas no torneio' },
  { id: 'winRate', label: 'Vitórias', title: 'Aproveitamento' },
  { id: 'kda', label: 'KDA', title: '(Abates + Assistências) / Mortes' },
  { id: 'kills', label: 'K / D / A', title: 'Média por partida' },
  { id: 'gpm', label: 'GPM / XPM', title: 'Ouro e experiência por minuto' },
  { id: 'lastHits', label: 'LH', title: 'Last hits por partida' },
  { id: 'heroDamage', label: 'Dano', title: 'Dano em heróis por partida' },
  { id: 'healing', label: 'Cura', title: 'Cura em heróis por partida' }
];

const fmt = (n) => Number(n || 0).toLocaleString('pt-BR');

/** Estatísticas dos jogadores no campeonato (dados da OpenDota). */
export default function TournamentPlayers({ data, constants }) {
  const openTeam = useOpenTeam();
  const [sortBy, setSortBy] = useState('kda');
  const [team, setTeam] = useState('all');

  const players = data?.players || [];
  const teams = useMemo(
    () => [...new Set(players.map((p) => p.teamName).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [players]
  );

  // Destaques só entre quem jogou um número razoável de partidas
  const maxGames = Math.max(0, ...players.map((p) => p.games));
  const minGames = Math.max(1, Math.ceil(maxGames * 0.4));
  const eligible = players.filter((p) => p.games >= minGames);
  const best = (field) => [...eligible].sort((a, b) => b[field] - a[field])[0];
  const highlights = [
    { label: 'Maior KDA', icon: Trophy, player: best('kda'), value: (p) => p.kda.toFixed(2), color: 'text-amber-400' },
    { label: 'Mais abates / jogo', icon: Crosshair, player: best('kills'), value: (p) => p.kills.toFixed(1), color: 'text-rose-400' },
    { label: 'Maior GPM', icon: Coins, player: best('gpm'), value: (p) => fmt(p.gpm), color: 'text-amber-400' },
    { label: 'Mais dano / jogo', icon: Swords, player: best('heroDamage'), value: (p) => fmt(p.heroDamage), color: 'text-purple-400' }
  ].filter((h) => h.player);

  const list = players
    .filter((p) => team === 'all' || p.teamName === team)
    .sort((a, b) => (b[sortBy] - a[sortBy]) || (b.games - a.games));

  return (
    <div className="space-y-6">
      {/* DESTAQUES */}
      {highlights.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {highlights.map(({ label, icon: Icon, player, value, color }) => (
            <div key={label} className="bg-surface border border-line rounded-xl p-3 sm:p-4 shadow-lg">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                <Icon className={`w-3.5 h-3.5 ${color}`} /> {label}
              </div>
              <div className={`text-xl font-black font-mono ${color}`}>{value(player)}</div>
              <div className="mt-1 flex items-center gap-1.5 min-w-0">
                <TeamLogo teamName={player.teamName} teamId={player.teamId} logoUrl={player.teamLogo} className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bold text-white leading-tight break-words line-clamp-2">{player.name}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FILTROS */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-gray-400">
          <strong className="text-white">{players.length}</strong> jogadores · destaques com no mínimo {minGames} {minGames === 1 ? 'partida' : 'partidas'}.
        </p>
        <select
          value={team}
          onChange={(e) => setTeam(e.target.value)}
          className="bg-surface-2 border border-line rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
        >
          <option value="all">Todos os times</option>
          {teams.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* TABELA */}
      <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[920px]">
            <thead className="bg-surface-2 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3 pl-4">Jogador</th>
                {COLUMNS.map((c) => (
                  <th key={c.id} className="p-3 text-center whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setSortBy(c.id)}
                      title={`${c.title} — ordenar`}
                      className={`inline-flex items-center gap-1 uppercase ${sortBy === c.id ? 'text-amber-400' : 'hover:text-white'}`}
                    >
                      {c.label}
                      {sortBy === c.id && <ArrowDown className="w-3 h-3" />}
                    </button>
                  </th>
                ))}
                <th className="p-3 pr-4">Heróis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-gray-300">
              {list.map((p, idx) => (
                <tr key={p.accountId} className="hover:bg-surface-2/60 transition-colors">
                  <td className="p-3 pl-4">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 text-right font-mono text-[10px] text-gray-500">{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => p.teamId && openTeam(p.teamId, p.teamName)}
                        title={p.teamName ? `Ver ${p.teamName}` : undefined}
                        className="shrink-0"
                      >
                        <TeamLogo teamName={p.teamName} teamId={p.teamId} logoUrl={p.teamLogo} className="w-6 h-6" />
                      </button>
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate max-w-[150px]">{p.name}</div>
                        <div className="text-[10px] text-gray-500 truncate max-w-[150px]">{p.teamName || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-center font-mono">{p.games}</td>
                  <td className="p-3 text-center font-mono font-bold">
                    <span className={p.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}>{Math.round(p.winRate)}%</span>
                  </td>
                  <td className="p-3 text-center font-mono font-black text-amber-400">{p.kda.toFixed(2)}</td>
                  <td className="p-3 text-center font-mono whitespace-nowrap">
                    <span className="text-white font-bold">{p.kills.toFixed(1)}</span>
                    <span className="text-gray-500"> / </span>
                    <span className="text-rose-400 font-bold">{p.deaths.toFixed(1)}</span>
                    <span className="text-gray-500"> / </span>
                    <span className="text-cyan-400 font-bold">{p.assists.toFixed(1)}</span>
                  </td>
                  <td className="p-3 text-center font-mono whitespace-nowrap">
                    <span className="text-amber-400 font-bold">{p.gpm}</span>
                    <span className="text-gray-500"> / </span>
                    <span className="text-cyan-400 font-bold">{p.xpm}</span>
                  </td>
                  <td className="p-3 text-center font-mono">{p.lastHits}</td>
                  <td className="p-3 text-center font-mono">{fmt(p.heroDamage)}</td>
                  <td className="p-3 text-center font-mono">{fmt(p.healing)}</td>
                  <td className="p-3 pr-4">
                    <div className="flex items-center gap-1">
                      {p.topHeroes.map((h) => (
                        <div
                          key={h.heroId}
                          title={`${getHeroName(constants, h.heroId)}: ${h.count} ${h.count === 1 ? 'jogo' : 'jogos'}`}
                          className="relative w-10 h-6 rounded overflow-hidden border border-line bg-surface-2"
                        >
                          <img src={getHeroImg(constants, h.heroId)} alt="" className="w-full h-full object-cover" />
                          <span className="absolute bottom-0 right-0 px-0.5 text-[8px] font-mono font-black bg-black/70 text-white rounded-tl">
                            {h.count}
                          </span>
                        </div>
                      ))}
                      {p.heroCount > 3 && <span className="text-[10px] text-gray-500 ml-0.5">+{p.heroCount - 3}</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-[11px] text-gray-500">
        Médias por partida, com dados da OpenDota. Clique no título de uma coluna para ordenar; no logo, para ver o time.
      </p>
    </div>
  );
}
