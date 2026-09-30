import React from 'react';
import { ExternalLink } from 'lucide-react';
import TeamLogo from '../utils/teamLogos';
import { useTheme } from '../context/ThemeContext';
import { useOpenTeam } from '../utils/teamRoute';

// Nomes das fases/grupos vêm em inglês da Liquipedia
const translate = (s) => String(s || '')
  .replace(/^Group Stage$/i, 'Fase de Grupos')
  .replace(/^Group\s+/i, 'Grupo ')
  .replace(/^Playoffs$/i, 'Playoffs')
  .replace(/^Standings$/i, 'Classificação');

const STATUS_STYLE = {
  up: 'bg-emerald-500',
  stay: 'bg-amber-500',
  down: 'bg-rose-500'
};

/** Tabelas de classificação (fase de grupos) de um campeonato. */
export default function TournamentStandings({ tables, liquipediaUrl }) {
  const { theme } = useTheme();
  const openTeam = useOpenTeam();
  const hasGames = tables.some((t) => t.rows.some((r) => r.games));

  // Agrupa por fase (ex.: "Fase de Grupos") mantendo a ordem da página
  const stages = [];
  for (const t of tables) {
    const name = translate(t.stage) || 'Classificação';
    let stage = stages.find((s) => s.name === name);
    if (!stage) { stage = { name, tables: [] }; stages.push(stage); }
    stage.tables.push(t);
  }

  return (
    <div className="space-y-8">
      {stages.map((stage) => (
        <section key={stage.name}>
          <h2 className="text-xs font-black uppercase tracking-wider text-white mb-3">{stage.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4">
            {stage.tables.map((table, idx) => (
              <div key={`${table.group}-${idx}`} className="bg-surface border border-line rounded-2xl overflow-hidden shadow-xl">
                <div className="px-4 py-3 border-b border-line bg-surface-2 flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    {translate(table.group) || translate(table.title) || `Tabela ${idx + 1}`}
                  </h3>
                </div>
                <table className="w-full text-xs">
                  <thead className="text-[10px] uppercase tracking-wider text-gray-400">
                    <tr className="border-b border-line">
                      <th className="py-2 pl-4 text-left w-10">#</th>
                      <th className="py-2 text-left">Time</th>
                      <th className="py-2 text-center w-16" title="Séries (vitórias-derrotas)">Séries</th>
                      {hasGames && <th className="py-2 pr-4 text-center w-16" title="Mapas (vitórias-derrotas)">Mapas</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {table.rows.map((row) => (
                      <tr key={row.team} className="hover:bg-surface-2/60 transition-colors">
                        <td className="py-2.5 pl-4">
                          <div className="flex items-center gap-2">
                            <span className={`w-1 h-6 rounded-full ${STATUS_STYLE[row.status] || 'bg-transparent'}`} />
                            <span className="font-mono font-black text-gray-300">{row.position}</span>
                          </div>
                        </td>
                        <td className="py-2.5 pr-2">
                          <button
                            type="button"
                            onClick={() => openTeam(null, row.team)}
                            className="flex items-center gap-2 min-w-0 text-left group"
                            title={`Ver perfil de ${row.team}`}
                          >
                            <TeamLogo
                              teamName={row.team}
                              logoUrl={(theme === 'light' ? row.logo?.light : row.logo?.dark) || row.logo?.dark || undefined}
                              className="w-6 h-6 shrink-0"
                            />
                            <span className="font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                              {row.team}
                            </span>
                          </button>
                        </td>
                        <td className="py-2.5 text-center font-mono font-black text-white">{row.record || '—'}</td>
                        {hasGames && <td className="py-2.5 pr-4 text-center font-mono text-gray-400">{row.games || '—'}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </section>
      ))}

      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-gray-400">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5"><span className="w-1 h-3.5 rounded-full bg-emerald-500" /> Zona de classificação</span>
          <span className="flex items-center gap-1.5"><span className="w-1 h-3.5 rounded-full bg-amber-500" /> Zona intermediária</span>
          <span className="flex items-center gap-1.5"><span className="w-1 h-3.5 rounded-full bg-rose-500" /> Zona de risco</span>
        </div>
        {liquipediaUrl && (
          <a
            href={liquipediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-bold text-amber-400 hover:text-amber-300"
          >
            Critérios de desempate e chaveamento na Liquipedia
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
