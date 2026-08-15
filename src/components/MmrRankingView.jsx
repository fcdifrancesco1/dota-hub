import React, { useState, useEffect } from 'react';
import { fetchOfficialLeaderboard } from '../services/api';
import { Globe } from 'lucide-react';

const REGIONS = [
  { id: 'americas', label: 'Américas' },
  { id: 'europe', label: 'Europa' },
  { id: 'china', label: 'China' },
  { id: 'se_asia', label: 'Sudeste Asiático' }
];

export default function MmrRankingView() {
  const [division, setDivision] = useState('europe');
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchOfficialLeaderboard(division).then((data) => {
      setPlayers(data.slice(0, 100));
      setLoading(false);
    });
  }, [division]);

  return (
    <div className="flex-1 p-8 overflow-y-auto max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-dota-border pb-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-dota-accent" />
          <h2 className="text-lg font-bold uppercase tracking-wider text-white">Leaderboard Oficial Immortal</h2>
        </div>

        <div className="flex gap-1 bg-dota-card p-1 rounded-lg border border-dota-border">
          {REGIONS.map((r) => (
            <button
              key={r.id}
              onClick={() => setDivision(r.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                division === r.id ? 'bg-dota-accent text-dota-bg' : 'text-dota-dim hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-dota-dim animate-pulse">Carregando Leaderboard Oficial da Valve...</div>
      ) : (
        <div className="bg-dota-surface border border-dota-border rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-dota-card/50 text-dota-dim text-xs font-mono border-b border-dota-border">
              <tr>
                <th className="p-3.5 pl-6 w-16">#</th>
                <th className="p-3.5">Jogador</th>
                <th className="p-3.5">País</th>
                <th className="p-3.5 pr-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dota-border/40 font-medium">
              {players.map((p) => (
                <tr key={p.rank} className="hover:bg-dota-card/30 transition-colors">
                  <td className="p-3.5 pl-6 font-bold text-dota-accent font-mono">{p.rank}</td>
                  <td className="p-3.5 font-bold text-white">
                    {p.team_tag && <span className="text-dota-accent mr-1.5">[{p.team_tag}]</span>}
                    {p.name || 'Anônimo'}
                  </td>
                  <td className="p-3.5 text-xs text-dota-dim uppercase font-mono">{p.country || '—'}</td>
                  <td className="p-3.5 pr-6 text-right text-xs text-dota-cyan font-mono">Immortal</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}