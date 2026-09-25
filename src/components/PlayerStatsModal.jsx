import React from 'react';
import { X, Shield } from 'lucide-react';
import TeamLogo from '../utils/teamLogos';

export default function PlayerStatsModal({ team, stats, loading, onClose }) {
  if (!team) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-dota-surface border border-dota-border rounded-2xl p-6 shadow-2xl overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 text-dota-dim hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <TeamLogo teamName={team.name} teamId={team.team_id} logoUrl={team.logo_url} className="w-10 h-10 shrink-0" />
          <div>
            <h3 className="text-xl font-bold text-white">{team.name}</h3>
            <span className="text-xs text-dota-accent font-mono">Estatísticas das Últimas 100 Partidas Oficiais</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-dota-dim animate-pulse">Calculando médias competitivas...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[500px]">
              <thead className="bg-dota-card text-dota-dim text-xs font-mono border-b border-dota-border">
                <tr>
                  <th className="p-3 whitespace-nowrap">Posição</th>
                  <th className="p-3 whitespace-nowrap">Jogador</th>
                  <th className="p-3 text-center whitespace-nowrap">Jogos</th>
                  <th className="p-3 text-center whitespace-nowrap">KDA</th>
                  <th className="p-3 text-right whitespace-nowrap">GPM</th>
                  <th className="p-3 text-right whitespace-nowrap">XPM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dota-border/40 font-medium">
                {stats.map((p) => {
                  const k = p.games ? (p.kills / p.games).toFixed(1) : 0;
                  const d = p.games ? (p.deaths / p.games).toFixed(1) : 0;
                  const a = p.games ? (p.assists / p.games).toFixed(1) : 0;
                  return (
                    <tr key={p.id} className="hover:bg-dota-card/30">
                      <td className="p-3 font-mono text-dota-accent whitespace-nowrap">Pos {p.position}</td>
                      <td className="p-3 font-bold text-white whitespace-nowrap">{p.name}</td>
                      <td className="p-3 text-center font-mono text-dota-dim whitespace-nowrap">{p.games}</td>
                      <td className="p-3 text-center font-mono whitespace-nowrap">{k}/{d}/{a}</td>
                      <td className="p-3 text-right font-mono text-dota-cyan whitespace-nowrap">{Math.round(p.gpm / (p.games || 1))}</td>
                      <td className="p-3 text-right font-mono text-dota-text whitespace-nowrap">{Math.round(p.xpm / (p.games || 1))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}