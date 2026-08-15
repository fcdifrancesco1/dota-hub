import React from 'react';
import { X, Shield } from 'lucide-react';

export default function PlayerStatsModal({ team, stats, loading, onClose }) {
  if (!team) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-dota-surface border border-dota-border rounded-2xl p-6 shadow-2xl overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 text-dota-dim hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          {team.logo_url ? (
            <img src={team.logo_url} alt={team.name} className="w-10 h-10 object-contain" />
          ) : (
            <Shield className="w-10 h-10 text-dota-accent" />
          )}
          <div>
            <h3 className="text-xl font-bold text-white">{team.name}</h3>
            <span className="text-xs text-dota-accent font-mono">Estatísticas das Últimas 100 Partidas Oficiais</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-dota-dim animate-pulse">Calculando médias competitivas...</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-dota-card text-dota-dim text-xs font-mono border-b border-dota-border">
              <tr>
                <th className="p-3">Posição</th>
                <th className="p-3">Jogador</th>
                <th className="p-3 text-center">Jogos</th>
                <th className="p-3 text-center">KDA</th>
                <th className="p-3 text-right">GPM</th>
                <th className="p-3 text-right">XPM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dota-border/40 font-medium">
              {stats.map((p) => {
                const k = p.games ? (p.kills / p.games).toFixed(1) : 0;
                const d = p.games ? (p.deaths / p.games).toFixed(1) : 0;
                const a = p.games ? (p.assists / p.games).toFixed(1) : 0;
                return (
                  <tr key={p.id} className="hover:bg-dota-card/30">
                    <td className="p-3 font-mono text-dota-accent">Pos {p.position}</td>
                    <td className="p-3 font-bold text-white">{p.name}</td>
                    <td className="p-3 text-center font-mono text-dota-dim">{p.games}</td>
                    <td className="p-3 text-center font-mono">{k}/{d}/{a}</td>
                    <td className="p-3 text-right font-mono text-dota-cyan">{Math.round(p.gpm / (p.games || 1))}</td>
                    <td className="p-3 text-right font-mono text-dota-text">{Math.round(p.xpm / (p.games || 1))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}