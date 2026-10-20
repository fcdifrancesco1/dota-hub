import React from 'react';
import { Link } from 'react-router-dom';
import { X, Shield, ExternalLink, ChevronRight } from 'lucide-react';
import TeamLogo from '../utils/teamLogos';

export default function PlayerStatsModal({ team, stats, loading, onClose }) {
  if (!team) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl glass-panel border border-line rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white p-2 rounded-xl bg-surface-2 border border-line transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-line p-2 flex items-center justify-center shrink-0 shadow-md">
            <TeamLogo teamName={team.name} teamId={team.team_id} logoUrl={team.logo_url} className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">{team.name}</h3>
            <span className="text-xs text-amber-400 font-mono font-bold">Médias das Últimas 100 Partidas Oficiais</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400 text-xs font-semibold animate-pulse">
            Calculando médias competitivas...
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-line bg-surface-2/40">
            <table className="w-full text-left text-xs min-w-[500px]">
              <thead className="bg-surface-2 text-gray-400 font-mono text-[10px] uppercase border-b border-line">
                <tr>
                  <th className="p-3.5 pl-4 whitespace-nowrap">Posição</th>
                  <th className="p-3.5 whitespace-nowrap">Jogador</th>
                  <th className="p-3.5 text-center whitespace-nowrap">Jogos</th>
                  <th className="p-3.5 text-center whitespace-nowrap">KDA</th>
                  <th className="p-3.5 text-right whitespace-nowrap">GPM</th>
                  <th className="p-3.5 pr-4 text-right whitespace-nowrap">XPM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-medium text-gray-300">
                {stats.map((p) => {
                  const k = p.games ? (p.kills / p.games).toFixed(1) : 0;
                  const d = p.games ? (p.deaths / p.games).toFixed(1) : 0;
                  const a = p.games ? (p.assists / p.games).toFixed(1) : 0;
                  const accountId = p.account_id || p.id;
                  return (
                    <tr key={p.id} className="hover:bg-surface-2/70 transition-colors">
                      <td className="p-3.5 pl-4 font-mono text-amber-400 font-bold whitespace-nowrap">Pos {p.position}</td>
                      <td className="p-3.5 whitespace-nowrap">
                        {accountId ? (
                          <Link
                            to={`/jogadores/${accountId}`}
                            onClick={onClose}
                            className="font-bold text-white hover:text-amber-400 flex items-center gap-1 group transition-colors"
                          >
                            <span>{p.name}</span>
                            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity" />
                          </Link>
                        ) : (
                          <span className="font-bold text-white">{p.name}</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center font-mono text-gray-400 whitespace-nowrap">{p.games}</td>
                      <td className="p-3.5 text-center font-mono whitespace-nowrap">{k}/{d}/{a}</td>
                      <td className="p-3.5 text-right font-mono text-amber-400 font-bold whitespace-nowrap">{Math.round(p.gpm / (p.games || 1))}</td>
                      <td className="p-3.5 pr-4 text-right font-mono text-cyan-400 font-bold whitespace-nowrap">{Math.round(p.xpm / (p.games || 1))}</td>
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
