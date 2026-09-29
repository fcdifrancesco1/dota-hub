import React from 'react';
import { Calendar, Clock, ChevronRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import TeamLogo from '../../utils/teamLogos';

export default function Upcoming24h() {
  const { upcomingMatches, loading } = useApp();

  // Filtra jogos para as próximas 24 horas
  const now = Date.now();
  const next24hMatches = (upcomingMatches || []).filter((m) => {
    if (!m.timestamp) return true;
    const matchTime = m.timestamp * 1000;
    return matchTime >= now - 1800000 && matchTime <= now + 24 * 3600000;
  }).slice(0, 6);

  if (loading) {
    return (
      <div className="bg-surface border border-line rounded-2xl p-5 shadow-xl">
        <div className="h-6 w-40 bg-white/5 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-line rounded-2xl p-5 shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/5 mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <Calendar className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-black uppercase tracking-wider text-white whitespace-nowrap">
              Próximas 24h <span className="hidden sm:inline">(Brasília)</span>
            </h3>
          </div>
          <Link
            to="/partidas?aba=agenda"
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 uppercase tracking-wider whitespace-nowrap shrink-0"
          >
            <span>Ver Agenda</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {next24hMatches.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-xs">
            Nenhuma partida oficial agendada para as próximas 24 horas.
          </div>
        ) : (
          <div className="space-y-2.5">
            {next24hMatches.map((m, idx) => {
              // Formata horário no fuso America/Sao_Paulo
              let formattedTime = m.startTime || '--:--';
              if (m.timestamp) {
                formattedTime = new Date(m.timestamp * 1000).toLocaleTimeString('pt-BR', {
                  timeZone: 'America/Sao_Paulo',
                  hour: '2-digit',
                  minute: '2-digit'
                });
              }

              return (
                <div
                  key={`${m.timeA}-${m.timeB}-${m.timestamp || idx}`}
                  className="bg-surface-2 hover:bg-surface-2 border border-surface-3 hover:border-amber-500/30 rounded-xl p-3 transition-all"
                >
                  <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1.5">
                    <span className="font-semibold truncate max-w-[180px] text-amber-400/80">
                      {m.tourneyName || 'Torneio'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded text-[9px] font-bold">
                        {m.formato}
                      </span>
                      <span className="font-mono text-gray-300 bg-white/5 px-1.5 py-0.5 rounded font-bold">
                        {formattedTime} BRT
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    {/* Time 1 */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <TeamLogo teamName={m.timeA} logoUrl={m.logoA} className="w-5 h-5 shrink-0" />
                      <span className="text-xs font-bold text-white leading-tight break-words line-clamp-2">{m.timeA}</span>
                    </div>

                    <span className="text-[10px] font-black text-gray-500 uppercase px-1">vs</span>

                    {/* Time 2 */}
                    <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                      <span className="text-xs font-bold text-white leading-tight break-words line-clamp-2 text-right">{m.timeB}</span>
                      <TeamLogo teamName={m.timeB} logoUrl={m.logoB} className="w-5 h-5 shrink-0" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-gray-500 text-center">
        Horários sincronizados automaticamente com os servidores de torneios.
      </div>
    </div>
  );
}
