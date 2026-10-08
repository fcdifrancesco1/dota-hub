import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, MapPin, DollarSign, Search, ChevronRight, Users, Wifi, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchTournaments, fetchTournamentArchive } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { formatDateRange, formatPrize, tierLabel, statusLabel, sortTournaments, leagueFromDatabase, tournamentPath } from '../utils/tournamentFormat';

const CURRENT_YEAR = new Date().getFullYear();
const FIRST_YEAR = 2011; // primeiro ano com campeonatos no histórico da Liquipedia
const YEARS = Array.from({ length: CURRENT_YEAR - FIRST_YEAR + 1 }, (_, i) => CURRENT_YEAR - i);
import { fetchLeagues, isSupabaseConfigured } from '../services/supabase';

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'ongoing' | 'upcoming' | 'finished'
  const [search, setSearch] = useState('');
  // Histórico de encerrados (Tier 1 e 2) por ano
  const [archiveYear, setArchiveYear] = useState(CURRENT_YEAR);
  const [archive, setArchive] = useState({});
  const { theme } = useTheme();

  useEffect(() => {
    // Campeonatos da Liquipedia + os cadastrados no Admin (somente se o Supabase
    // estiver configurado; sem ele, fetchLeagues devolveria dados de exemplo)
    Promise.all([
      fetchTournaments(),
      isSupabaseConfigured ? fetchLeagues() : Promise.resolve([])
    ]).then(([liquipedia, db]) => {
      const list = [...(liquipedia || [])];
      for (const l of db || []) {
        if (list.some((t) => t.name.toLowerCase() === String(l.name).toLowerCase())) continue;
        list.push(leagueFromDatabase(l));
      }
      setTournaments(sortTournaments(list));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (statusFilter !== 'finished' || archive[archiveYear]) return;
    let active = true;
    fetchTournamentArchive(archiveYear).then((list) => {
      if (active) setArchive((prev) => ({ ...prev, [archiveYear]: list || [] }));
    });
    return () => { active = false; };
  }, [statusFilter, archiveYear, archive]);

  // Encerrados: os recentes da lista atual + o histórico do ano escolhido
  const archiveLoading = statusFilter === 'finished' && !archive[archiveYear];
  const finishedOfYear = () => {
    const byId = new Map();
    for (const t of archive[archiveYear] || []) byId.set(t.id, t);
    for (const t of tournaments) {
      if (t.status !== 'finished' || !String(t.endDate || '').startsWith(String(archiveYear))) continue;
      const old = byId.get(t.id);
      byId.set(t.id, old ? { ...old, ...t, winner: old.winner, runnerUp: old.runnerUp, prizePoolUsd: old.prizePoolUsd || t.prizePoolUsd } : t);
    }
    return sortTournaments([...byId.values()]);
  };
  const source = statusFilter === 'finished' ? finishedOfYear() : tournaments;

  const filtered = source.filter((t) => {
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const term = search.toLowerCase();
    const matchesSearch = !term || t.name.toLowerCase().includes(term) || (t.organizer || '').toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">

      {/* HEADER DA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-line">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase font-serif tracking-tight flex items-center gap-2.5">
            <Trophy className="w-7 h-7 text-amber-500" />
            <span>Campeonatos & Majors Oficiais</span>
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            Circuito competitivo de Dota 2: campeonatos em andamento, próximos e o histórico de encerrados. Dados da Liquipedia.
          </p>
        </div>

        {/* FILTROS & BUSCA */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-surface-2 p-1 rounded-xl border border-line">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'ongoing', label: 'Em Andamento' },
              { id: 'upcoming', label: 'Próximos' },
              { id: 'finished', label: 'Encerrados' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap ${
                  statusFilter === tab.id ? 'bg-amber-500 text-black font-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar campeonato ou organizador..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-surface-2 border border-line rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 w-full sm:w-64"
            />
          </div>

          {statusFilter === 'finished' && (
            <select
              value={archiveYear}
              onChange={(e) => setArchiveYear(Number(e.target.value))}
              aria-label="Ano"
              className="bg-surface-2 border border-line rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500/50"
            >
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* GRID DE CAMPEONATOS */}
      {loading || archiveLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[380px] rounded-2xl bg-surface border border-line animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface border border-line rounded-2xl p-12 text-center text-gray-400 text-xs">
          {statusFilter === 'finished'
            ? `Nenhum campeonato Tier 1 ou Tier 2 encerrado em ${archiveYear}${search ? ' com essa busca' : ''}.`
            : tournaments.length === 0
            ? 'Não foi possível carregar os campeonatos agora. Tente novamente em alguns instantes.'
            : 'Nenhum campeonato encontrado para os filtros selecionados.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((t) => {
            const isOngoing = t.status === 'ongoing';
            const isUpcoming = t.status === 'upcoming';
            const image = t.image?.[theme] || t.icon?.[theme];
            const dates = formatDateRange(t.startDate, t.endDate);
            const prize = formatPrize(t);
            const where = [t.location, t.type].filter(Boolean).join(' · ');

            return (
              <Link
                key={t.id}
                to={tournamentPath(t)}
                className="group rounded-2xl bg-surface hover:bg-surface-2 border border-line hover:border-amber-500/50 overflow-hidden shadow-xl transition-all flex flex-col justify-between"
              >
                <div>
                  {/* BANNER (logo oficial do campeonato) */}
                  <div className={`h-40 w-full relative overflow-hidden flex items-center justify-center p-6 ${
                    isOngoing
                      ? 'bg-gradient-to-br from-red-950 via-surface-2 to-surface-2'
                      : 'bg-gradient-to-br from-amber-950 via-surface-2 to-surface-2'
                  }`}>
                    {image ? (
                      <img
                        src={image}
                        alt={t.name}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        className="max-h-24 max-w-[75%] object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-amber-400" />
                      </div>
                    )}

                    <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                      isOngoing
                        ? 'bg-red-600 text-on-accent shadow-md'
                        : isUpcoming
                        ? 'bg-amber-500 text-black'
                        : 'bg-white/10 text-gray-400'
                    }`}>
                      {statusLabel(t)}
                    </span>
                  </div>

                  {/* CONTEÚDO */}
                  <div className="p-6">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                        {tierLabel(t)}
                      </span>
                      {t.organizer && (
                        <span className="text-[10px] text-gray-500 truncate max-w-[50%]">{t.organizer}</span>
                      )}
                    </div>

                    <h3 className="text-lg font-black text-white group-hover:text-amber-400 transition-colors leading-snug mb-3">
                      {t.name}
                    </h3>

                    <div className="space-y-2 text-xs text-gray-400">
                      {dates && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                          <span className="font-semibold text-gray-300">{dates}</span>
                        </div>
                      )}
                      {where && (
                        <div className="flex items-center gap-2">
                          {t.type === 'Online' ? (
                            <Wifi className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                          ) : (
                            <MapPin className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                          )}
                          <span className="truncate">{where}</span>
                        </div>
                      )}
                      {t.teamCount && (
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                          <span>{t.teamCount} times</span>
                        </div>
                      )}
                      {t.winner && (
                        <div className="flex items-center gap-2">
                          <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                          <span className="truncate">
                            Campeão: <strong className="text-amber-400">{t.winner.name}</strong>
                            {t.runnerUp && <span className="text-gray-500"> · vice {t.runnerUp.name}</span>}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono">
                        <DollarSign className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{prize ? `Premiação: ${prize}` : 'Premiação não divulgada'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RODAPÉ DO CARD */}
                <div className="px-6 py-3.5 border-t border-white/5 bg-canvas flex items-center justify-between text-xs">
                  <span className="text-gray-400 text-[11px]">Partidas, heróis e chaveamento</span>
                  <span className="font-bold text-amber-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    <span>Acessar</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
