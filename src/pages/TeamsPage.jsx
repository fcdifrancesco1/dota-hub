import React, { useState, useEffect } from 'react';
import { Users, Search, TrendingUp, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchTeams } from '../services/supabase';
import TeamLogo from '../utils/teamLogos';
import { useApp } from '../context/AppContext';

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState('');
  const { setSelectedTeam } = useApp();

  useEffect(() => {
    fetchTeams().then(data => {
      if (data) setTeams(data);
    });
  }, []);

  const filtered = teams.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    (t.tag && t.tag.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-line">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase font-serif tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-amber-500" />
            <span>Ranking & Times Profissionais</span>
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            Classificação mundial baseada em rating, histórico de vitórias e desempenhos recentes.
          </p>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome ou tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-surface-2 border border-line rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 w-full sm:w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((t, idx) => {
          const totalGames = (t.wins || 0) + (t.losses || 0);
          const winrate = totalGames > 0 ? ((t.wins / totalGames) * 100).toFixed(1) : 0;

          return (
            <div
              key={t.id || idx}
              onClick={() => setSelectedTeam({ id: t.id, name: t.name })}
              className="bg-surface hover:bg-surface-2 border border-line hover:border-amber-500/40 rounded-2xl p-5 shadow-xl transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
                <span className="font-mono text-xs font-bold text-amber-500">
                  #{idx + 1} Ranking Mundial
                </span>
                <span className="text-[11px] text-gray-400 font-medium">
                  {t.region || 'Internacional'}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 p-2 flex items-center justify-center">
                  <TeamLogo teamName={t.name} logoUrl={t.logo_url} className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white group-hover:text-amber-400 transition-colors">
                    {t.name}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                    <span>{t.wins}V - {t.losses}D</span>
                    <span className="text-emerald-400 font-bold font-mono">{winrate}% win</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-gray-500">Rating: {Math.round(t.rating || 1500)}</span>
                <span className="text-amber-400 font-bold group-hover:underline">Ver Elenco & Estatísticas →</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
