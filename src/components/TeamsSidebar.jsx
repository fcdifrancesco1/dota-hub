import React from 'react';
import { Shield, TrendingUp } from 'lucide-react';

export default function TeamsSidebar({ teams, onSelectTeam, selectedTeam }) {
  return (
    <aside className="w-72 bg-dota-surface border-r border-dota-border flex flex-col h-[calc(100vh-4rem)] sticky top-16">
      <div className="p-4 border-b border-dota-border flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold uppercase text-xs tracking-wider text-dota-accent">
          <TrendingUp className="w-4 h-4" />
          Ranking de Times
        </div>
        <span className="text-[10px] bg-dota-card px-2 py-0.5 rounded text-dota-dim border border-dota-border">TOP 16</span>
      </div>

      <div className="overflow-y-auto flex-1 p-2 space-y-1">
        {teams.map((team, idx) => {
          const isSelected = selectedTeam?.team_id === team.team_id;
          return (
            <button
              key={team.team_id}
              onClick={() => onSelectTeam(team)}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all text-left ${
                isSelected
                  ? 'bg-dota-accent/10 border-dota-accent text-dota-accent'
                  : 'bg-dota-card/40 border-dota-border/50 text-dota-text hover:bg-dota-card hover:border-dota-border'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-dota-dim w-4">{idx + 1}</span>
                {team.logo_url ? (
                  <img src={team.logo_url} alt={team.name} className="w-6 h-6 object-contain rounded" />
                ) : (
                  <Shield className="w-6 h-6 text-dota-dim" />
                )}
                <span className="text-sm font-semibold truncate max-w-[130px]">{team.name}</span>
              </div>
              <span className="text-xs font-mono text-dota-dim font-bold">{Math.round(team.rating)}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}