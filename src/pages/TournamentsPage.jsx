import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, MapPin, DollarSign, Filter, Search, ChevronRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchLeagues } from '../services/supabase';
import { useApp } from '../context/AppContext';

export default function TournamentsPage() {
  const [leagues, setLeagues] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'ongoing' | 'upcoming' | 'finished'
  const [tierFilter, setTierFilter] = useState('all');     // 'all' | 'tier_1' | 'tier_2' | 'qualifier'
  const [search, setSearch] = useState('');
  const { tournamentsList } = useApp();

  useEffect(() => {
    fetchLeagues().then(data => {
      if (data && data.length > 0) {
        setLeagues(data);
      }
    });
  }, []);

  // Une ligas do Supabase com os torneios parseados dinamicamente
  const combinedLeagues = [...leagues];
  if (tournamentsList && tournamentsList.length > 0) {
    tournamentsList.forEach((t) => {
      if (!combinedLeagues.some(l => l.name?.toLowerCase() === t.name?.toLowerCase())) {
        combinedLeagues.push({
          id: t.id || Math.floor(Math.random() * 100000),
          name: t.name,
          tier: 'tier_1',
          prize_pool: t.prizePool || '$1,000,000',
          status: 'ongoing',
          location: t.location || 'Internacional',
          banner_url: t.banner || null
        });
      }
    });
  }

  const filtered = combinedLeagues.filter((l) => {
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    const matchesTier = tierFilter === 'all' || l.tier === tierFilter;
    const matchesSearch = l.name.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesTier && matchesSearch;
  });

  return (
    <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      
      {/* HEADER DA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#212838]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase font-serif tracking-tight flex items-center gap-2.5">
            <Trophy className="w-7 h-7 text-amber-500" />
            <span>Campeonatos & Majors Oficiais</span>
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            Acompanhe o circuito competitivo internacional de Dota 2, fases de grupos, chaveamentos de playoffs e premiações.
          </p>
        </div>

        {/* FILTROS & BUSCA */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Tab */}
          <div className="flex bg-[#11141E] p-1 rounded-xl border border-[#212838]">
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

          {/* Busca */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar campeonato..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#11141E] border border-[#212838] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 w-full sm:w-56"
            />
          </div>
        </div>
      </div>

      {/* GRID DE CAMPEONATOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((league) => {
          const isOngoing = league.status === 'ongoing';
          const isUpcoming = league.status === 'upcoming';

          return (
            <Link
              key={league.id}
              to={`/campeonatos/${league.id}`}
              className="group rounded-2xl bg-[#0C0E14] hover:bg-[#11141E] border border-[#212838] hover:border-amber-500/50 overflow-hidden shadow-xl transition-all flex flex-col justify-between"
            >
              <div>
                {/* BANNER OU HERO PLACEHOLDER */}
                <div className="h-40 w-full bg-gradient-to-r from-red-950 via-[#181116] to-[#121622] relative overflow-hidden flex items-center justify-center p-6">
                  {league.banner_url ? (
                    <img
                      src={league.banner_url}
                      alt={league.name}
                      className="w-full h-full object-cover absolute inset-0 opacity-40 group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : null}

                  <div className="relative z-10 text-center">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 p-2 mx-auto flex items-center justify-center mb-2 shadow-lg">
                      <Trophy className="w-6 h-6 text-amber-400" />
                    </div>
                  </div>

                  {/* BADGE DE STATUS */}
                  <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                    isOngoing
                      ? 'bg-red-600 text-white shadow-md animate-pulse'
                      : isUpcoming
                      ? 'bg-amber-500 text-black font-black'
                      : 'bg-white/10 text-gray-400'
                  }`}>
                    {isOngoing ? '● Em Andamento' : isUpcoming ? 'Em Breve' : 'Encerrado'}
                  </span>
                </div>

                {/* CONTEÚDO */}
                <div className="p-6">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 block mb-1">
                    {league.tier ? league.tier.replace('_', ' ') : 'Tier 1'}
                  </span>

                  <h3 className="text-lg font-black text-white group-hover:text-amber-400 transition-colors leading-snug mb-3">
                    {league.name}
                  </h3>

                  <div className="space-y-2 text-xs text-gray-400">
                    {league.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                        <span>{league.location}</span>
                      </div>
                    )}

                    {league.prize_pool && (
                      <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono">
                        <DollarSign className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Premiação: {league.prize_pool}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RODAPÉ DO CARD */}
              <div className="px-6 py-3.5 border-t border-white/5 bg-[#090B0F] flex items-center justify-between text-xs">
                <span className="text-gray-400 text-[11px]">Ver Chaveamento & Estatísticas</span>
                <span className="font-bold text-amber-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  <span>Acessar</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
