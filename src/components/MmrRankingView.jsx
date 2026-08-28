import React, { useState, useEffect } from 'react';
import { Award, Globe, Search, Shield, Trophy } from 'lucide-react';
import { fetchOfficialLeaderboard } from '../services/api';
import { SkeletonTable } from './SkeletonLoader';

export default function MmrRankingView({ searchQuery = "" }) {
  const [division, setDivision] = useState('europe');
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  const divisions = [
    { id: 'europe', label: 'Europa' },
    { id: 'americas', label: 'Américas' },
    { id: 'china', label: 'China' },
    { id: 'se_asia', label: 'Sudeste Asiático' }
  ];

  useEffect(() => {
    setLoading(true);
    fetchOfficialLeaderboard(division).then((data) => {
      setPlayers(data.slice(0, 100));
      setLoading(false);
    });
  }, [division]);

  const filteredPlayers = players.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.team_tag && p.team_tag.toLowerCase().includes(q)) ||
      (p.country && p.country.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-5xl mx-auto w-full p-4 sm:p-6 space-y-6">
      {/* HEADER DA ABA */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-amber-400">
            <Award className="w-4 h-4" />
            Leaderboard Oficial da Valve
          </div>
          <h1 className="text-2xl font-black text-white tracking-wide mt-1">
            Ranking Immortal Global
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Top 100 jogadores profissionais e de elite em cada servidor competitivo
          </p>
        </div>

        {/* SELETOR DE DIVISÕES */}
        <div className="flex items-center gap-1.5 bg-[#141824]/90 p-1.5 rounded-xl border border-white/10">
          {divisions.map((d) => (
            <button
              key={d.id}
              onClick={() => setDivision(d.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all ${
                division === d.id
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* TABELA DO LEADERBOARD */}
      {loading ? (
        <SkeletonTable rows={12} cols={4} />
      ) : filteredPlayers.length === 0 ? (
        <div className="text-center py-16 text-xs text-gray-400">
          Nenhum jogador encontrado {searchQuery ? `para "${searchQuery}"` : "nesta divisão"}.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0E1118]/80 backdrop-blur-xl shadow-xl">
          <table className="w-full text-left text-xs border-collapse min-w-[600px]">
            <thead className="bg-[#161A24]/90 text-gray-400 font-mono text-[10px] uppercase border-b border-white/10">
              <tr>
                <th className="p-3.5 pl-6 w-16"># Rank</th>
                <th className="p-3.5">Jogador</th>
                <th className="p-3.5">País</th>
                <th className="p-3.5 pr-6 text-right">Patente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {filteredPlayers.map((p) => {
                const isTop3 = p.rank <= 3;
                return (
                  <tr key={p.rank} className="hover:bg-white/[0.03] transition-colors">
                    {/* Rank */}
                    <td className="p-3.5 pl-6 font-mono font-black text-sm">
                      <span
                        className={
                          p.rank === 1
                            ? 'text-amber-400 font-black'
                            : p.rank === 2
                            ? 'text-slate-300 font-bold'
                            : p.rank === 3
                            ? 'text-amber-600 font-bold'
                            : 'text-gray-400'
                        }
                      >
                        {p.rank}
                      </span>
                    </td>

                    {/* Jogador */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        {p.team_tag && (
                          <span className="text-[10px] font-bold font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded">
                            [{p.team_tag}]
                          </span>
                        )}
                        <strong className="text-white text-xs">{p.name || 'Anônimo'}</strong>
                      </div>
                    </td>

                    {/* País */}
                    <td className="p-3.5 text-xs text-gray-400 uppercase font-mono">
                      {p.country ? (
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5">
                          {p.country}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* Patente */}
                    <td className="p-3.5 pr-6 text-right">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold font-mono">
                        <Shield className="w-3 h-3 text-cyan-400" />
                        Immortal
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}