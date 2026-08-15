import React, { useState } from 'react';
import { Calendar, Swords, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchTeam100MatchesStats } from '../services/api';

const MOCK_UPCOMING = [
  { id: 1, teamA: "Team Liquid", teamB: "Gaimin Gladiators", format: "Bo3", time: "Hoje, 16:00", teamAId: 2163, teamBId: 8599101 },
  { id: 2, teamA: "Team Falcons", teamB: "Xtreme Gaming", format: "Bo3", time: "Hoje, 19:30", teamAId: 9247354, teamBId: 8254400 },
  { id: 3, teamA: "Team Spirit", teamB: "BetBoom Team", format: "Bo3", time: "Amanhã, 14:00", teamAId: 7119388, teamBId: 8255888 },
  { id: 4, teamA: "Tundra Esports", teamB: "Heroic", format: "Bo3", time: "Amanhã, 17:00", teamAId: 8261500, teamBId: 9247354 },
];

export default function MatchesSidebar() {
  const [expandedMatchId, setExpandedMatchId] = useState(null);
  const [stats, setStats] = useState({ loading: false, dataA: [], dataB: [] });

  const handleToggle = async (match) => {
    if (expandedMatchId === match.id) {
      setExpandedMatchId(null);
      return;
    }

    setExpandedMatchId(match.id);
    setStats({ loading: true, dataA: [], dataB: [] });

    const [dataA, dataB] = await Promise.all([
      fetchTeam100MatchesStats(match.teamAId, match.teamA),
      fetchTeam100MatchesStats(match.teamBId, match.teamB)
    ]);

    setStats({ loading: false, dataA, dataB });
  };

  return (
    <aside className="w-80 bg-dota-surface border-l border-dota-border flex flex-col h-[calc(100vh-4rem)] sticky top-16">
      <div className="p-4 border-b border-dota-border flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold uppercase text-xs tracking-wider text-dota-cyan">
          <Calendar className="w-4 h-4" />
          Próximos Jogos
        </div>
        <span className="text-[10px] bg-dota-card px-2 py-0.5 rounded text-dota-dim border border-dota-border">AO VIVO / AGENDA</span>
      </div>

      <div className="overflow-y-auto flex-1 p-3 space-y-3">
        {MOCK_UPCOMING.map((m) => {
          const isExpanded = expandedMatchId === m.id;
          return (
            <div key={m.id} className="bg-dota-card rounded-lg border border-dota-border overflow-hidden transition-all">
              <button
                onClick={() => handleToggle(m)}
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-dota-border/30 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-dota-text">{m.teamA}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-dota-text">{m.teamB}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-dota-accent/20 text-dota-accent border border-dota-accent/30">
                    {m.format}
                  </span>
                  <span className="text-[11px] text-dota-dim font-mono">{m.time}</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-dota-dim mt-1" /> : <ChevronDown className="w-4 h-4 text-dota-dim mt-1" />}
                </div>
              </button>

              {/* Expansão das Estatísticas das Últimas 100 Partidas */}
              {isExpanded && (
                <div className="p-3 bg-dota-bg/80 border-t border-dota-border space-y-4">
                  {stats.loading ? (
                    <div className="text-center py-4 text-xs text-dota-dim animate-pulse">
                      Calculando médias dos últimos 100 jogos...
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <div className="text-xs font-bold text-dota-accent border-b border-dota-border/60 pb-1">{m.teamA} (100 jogos)</div>
                        {stats.dataA.map(p => (
                          <div key={p.id} className="flex items-center justify-between text-[11px] text-dota-dim">
                            <span>Pos {p.position} - <strong className="text-dota-text">{p.name}</strong></span>
                            <span className="font-mono text-dota-cyan">{Math.round(p.gpm / (p.games || 1))} GPM</span>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs font-bold text-dota-accent border-b border-dota-border/60 pb-1">{m.teamB} (100 jogos)</div>
                        {stats.dataB.map(p => (
                          <div key={p.id} className="flex items-center justify-between text-[11px] text-dota-dim">
                            <span>Pos {p.position} - <strong className="text-dota-text">{p.name}</strong></span>
                            <span className="font-mono text-dota-cyan">{Math.round(p.gpm / (p.games || 1))} GPM</span>
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
  );
}