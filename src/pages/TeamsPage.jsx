import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Trophy,
  Search,
  ArrowUpDown,
  Flame,
  Award,
  ChevronRight,
  TrendingUp,
  Loader2,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { fetchTeamsRanking } from '../services/teamsRanking';
import TeamLogo from '../utils/teamLogos';

const fmtDate = (secs) => (secs
  ? new Date(secs * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  : '—');

export default function TeamsPage() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'top20' | 'top50' | 'min100' | 'winrate60'
  const [sortBy, setSortBy] = useState('rating'); // 'rating' | 'winRate' | 'totalGames' | 'wins'
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    document.title = 'Ranking de Times · DotaHub Brasil';
    let cancelled = false;
    setLoading(true);

    fetchTeamsRanking().then((data) => {
      if (!cancelled) {
        setTeams(data || []);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, []);

  // Filtros e busca
  const filteredTeams = useMemo(() => {
    let result = [...teams];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) => t.name.toLowerCase().includes(q) || (t.tag && t.tag.toLowerCase().includes(q))
      );
    }

    if (filterMode === 'top20') {
      result = result.slice(0, 20);
    } else if (filterMode === 'top50') {
      result = result.slice(0, 50);
    } else if (filterMode === 'min100') {
      result = result.filter((t) => t.totalGames >= 100);
    } else if (filterMode === 'winrate60') {
      result = result.filter((t) => t.winRate >= 55 && t.totalGames >= 30);
    }

    result.sort((a, b) => {
      let valA = a[sortBy] ?? 0;
      let valB = b[sortBy] ?? 0;
      return sortAsc ? valA - valB : valB - valA;
    });

    return result;
  }, [teams, search, filterMode, sortBy, sortAsc]);

  // Top 3 do pódio
  const top1 = teams[0];
  const top2 = teams[1];
  const top3 = teams[2];

  const handleTeamClick = (teamId) => {
    navigate(`/times/${teamId}`);
  };

  return (
    <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen space-y-8">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-500">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Circuito Mundial Competitivo</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mt-1">
            Ranking Mundial de Equipes
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-3xl leading-relaxed">
            Classificação Elo oficial e histórico de aproveitamento dos principais times profissionais de Dota 2,
            atualizada com base nas partidas e ligas oficiais registradas pela Valve e OpenDota.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-surface-2/80 border border-line rounded-2xl px-4 py-2.5 flex items-center gap-3">
            <Shield className="w-5 h-5 text-amber-400" />
            <div>
              <span className="text-[10px] font-bold uppercase text-gray-400 block leading-tight">Total de Equipes</span>
              <span className="font-mono font-black text-white text-sm">{teams.length.toLocaleString('pt-BR')} times</span>
            </div>
          </div>
        </div>
      </div>

      {/* PÓDIO DOS 3 PRIMEIROS COLOCADOS */}
      {!loading && top1 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* #2 SEGUNDO LUGAR */}
          {top2 && (
            <div
              onClick={() => handleTeamClick(top2.teamId)}
              className="tilt-card glass-panel rounded-3xl p-6 border border-slate-300/30 dark:border-slate-500/30 hover:border-slate-300/60 shadow-xl cursor-pointer transition-all flex flex-col justify-between group order-2 md:order-1 relative overflow-hidden"
            >
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-slate-400/10 blur-2xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-full bg-slate-300/20 text-slate-300 border border-slate-300/40 font-mono font-black text-xs uppercase flex items-center gap-1.5 shadow-sm">
                    <span>#2 Prata</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-gray-400">
                    Rating: <strong className="text-white text-sm">{top2.rating}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-4 my-2">
                  <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-line p-2 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                    <TeamLogo teamName={top2.name} teamId={top2.teamId} logoUrl={top2.logoUrl} className="w-12 h-12" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-black text-white truncate group-hover:text-amber-400 transition-colors">
                      {top2.name}
                    </h3>
                    {top2.tag && (
                      <span className="text-[11px] font-mono font-bold text-gray-400 uppercase">
                        [{top2.tag}]
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-line mt-4 flex items-center justify-between text-xs">
                <span className="text-gray-400 font-medium">
                  {top2.wins}V - {top2.losses}D ({top2.winRate}% WR)
                </span>
                <span className="text-amber-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Ver perfil</span>
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          )}

          {/* #1 CAMPEÃO / LÍDER MUNDIAL */}
          <div
            onClick={() => handleTeamClick(top1.teamId)}
            className="tilt-card glass-panel rounded-3xl p-6 sm:p-7 border border-amber-500/50 hover:border-amber-400 shadow-2xl cursor-pointer transition-all flex flex-col justify-between group order-1 md:order-2 relative overflow-hidden bg-gradient-to-b from-amber-500/10 to-transparent"
          >
            <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3.5 py-1 rounded-full bg-amber-500 text-on-accent font-mono font-black text-xs uppercase flex items-center gap-1.5 shadow-lg shadow-amber-500/25">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>#1 Líder Mundial</span>
                </span>
                <span className="text-xs font-mono font-bold text-gray-400">
                  Rating: <strong className="text-amber-400 text-base">{top1.rating}</strong>
                </span>
              </div>

              <div className="flex items-center gap-4 my-2">
                <div className="w-20 h-20 rounded-2xl bg-surface-2 border border-amber-500/40 p-2.5 flex items-center justify-center shrink-0 shadow-xl group-hover:scale-105 transition-transform">
                  <TeamLogo teamName={top1.name} teamId={top1.teamId} logoUrl={top1.logoUrl} className="w-16 h-16" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xl sm:text-2xl font-black text-white truncate group-hover:text-amber-400 transition-colors">
                    {top1.name}
                  </h3>
                  {top1.tag && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-mono font-black uppercase">
                      [{top1.tag}]
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-line mt-4 flex items-center justify-between text-xs">
              <span className="text-gray-400 font-medium">
                <strong className="text-emerald-400">{top1.wins} vitórias</strong> · {top1.losses} derrotas ({top1.winRate}%)
              </span>
              <span className="text-amber-400 font-black flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>Ver time completo</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* #3 TERCEIRO LUGAR */}
          {top3 && (
            <div
              onClick={() => handleTeamClick(top3.teamId)}
              className="tilt-card glass-panel rounded-3xl p-6 border border-amber-800/30 hover:border-amber-700/60 shadow-xl cursor-pointer transition-all flex flex-col justify-between group order-3 relative overflow-hidden"
            >
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-amber-800/10 blur-2xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-full bg-amber-800/20 text-amber-400 border border-amber-800/40 font-mono font-black text-xs uppercase flex items-center gap-1.5 shadow-sm">
                    <span>#3 Bronze</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-gray-400">
                    Rating: <strong className="text-white text-sm">{top3.rating}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-4 my-2">
                  <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-line p-2 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                    <TeamLogo teamName={top3.name} teamId={top3.teamId} logoUrl={top3.logoUrl} className="w-12 h-12" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-black text-white truncate group-hover:text-amber-400 transition-colors">
                      {top3.name}
                    </h3>
                    {top3.tag && (
                      <span className="text-[11px] font-mono font-bold text-gray-400 uppercase">
                        [{top3.tag}]
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-line mt-4 flex items-center justify-between text-xs">
                <span className="text-gray-400 font-medium">
                  {top3.wins}V - {top3.losses}D ({top3.winRate}% WR)
                </span>
                <span className="text-amber-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Ver perfil</span>
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* BARRA DE FILTROS & BUSCA */}
      <div className="glass-panel border border-line rounded-3xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        {/* Chips de Filtro */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'all', label: 'Todos os Times' },
            { id: 'top20', label: 'Top 20 Mundiais' },
            { id: 'top50', label: 'Top 50' },
            { id: 'min100', label: '+100 Partidas' },
            { id: 'winrate60', label: 'Alta Performance (≥55% WR)' }
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilterMode(btn.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                filterMode === btn.id
                  ? 'bg-amber-500 text-on-accent font-black shadow-md shadow-amber-500/20'
                  : 'bg-surface-2 border border-line text-gray-400 hover:text-white hover:border-amber-500/30'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Campo de Busca */}
        <div className="relative min-w-[260px] sm:min-w-[320px] flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome ou tag (ex: Falcons, Spirit)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-2 border border-line rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
      </div>

      {/* TABELA DE RANKING */}
      {loading ? (
        <div className="glass-panel border border-line rounded-3xl p-24 text-center shadow-xl flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          <span className="text-xs font-bold text-gray-400">Carregando classificação mundial de times...</span>
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="glass-panel border border-line rounded-3xl p-16 text-center shadow-xl">
          <Shield className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <h3 className="text-base font-black text-white uppercase">Nenhum time encontrado</h3>
          <p className="text-xs text-gray-400 mt-1">Tente ajustar os termos de busca ou mudar os filtros.</p>
        </div>
      ) : (
        <div className="glass-panel border border-line rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[900px]">
              <thead className="bg-surface-2/80 text-gray-400 font-mono text-[10px] uppercase border-b border-line">
                <tr>
                  <th className="p-4 pl-6 text-center w-16">Rank</th>
                  <th className="p-4">Time</th>
                  <th
                    onClick={() => {
                      if (sortBy === 'rating') setSortAsc(!sortAsc);
                      else { setSortBy('rating'); setSortAsc(false); }
                    }}
                    className="p-4 text-center cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Rating Elo</span>
                      {sortBy === 'rating' && <ArrowUpDown className="w-3 h-3 text-amber-400" />}
                    </div>
                  </th>
                  <th
                    onClick={() => {
                      if (sortBy === 'winRate') setSortAsc(!sortAsc);
                      else { setSortBy('winRate'); setSortAsc(false); }
                    }}
                    className="p-4 text-center cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Aproveitamento</span>
                      {sortBy === 'winRate' && <ArrowUpDown className="w-3 h-3 text-amber-400" />}
                    </div>
                  </th>
                  <th
                    onClick={() => {
                      if (sortBy === 'wins') setSortAsc(!sortAsc);
                      else { setSortBy('wins'); setSortAsc(false); }
                    }}
                    className="p-4 text-center cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Vitórias / Derrotas</span>
                      {sortBy === 'wins' && <ArrowUpDown className="w-3 h-3 text-amber-400" />}
                    </div>
                  </th>
                  <th
                    onClick={() => {
                      if (sortBy === 'totalGames') setSortAsc(!sortAsc);
                      else { setSortBy('totalGames'); setSortAsc(false); }
                    }}
                    className="p-4 text-center cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Total de Jogos</span>
                      {sortBy === 'totalGames' && <ArrowUpDown className="w-3 h-3 text-amber-400" />}
                    </div>
                  </th>
                  <th className="p-4 text-center">Último Jogo</th>
                  <th className="p-4 pr-6 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-medium text-gray-300">
                {filteredTeams.slice(0, 100).map((t) => {
                  const isTop1 = t.rank === 1;
                  const isTop3 = t.rank <= 3;
                  return (
                    <tr
                      key={t.teamId}
                      onClick={() => handleTeamClick(t.teamId)}
                      className="hover:bg-surface-2/60 transition-colors cursor-pointer group"
                    >
                      {/* Posição no Ranking */}
                      <td className="p-4 pl-6 text-center font-mono">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-xl font-black text-xs ${
                            isTop1
                              ? 'bg-amber-500 text-on-accent shadow-md shadow-amber-500/30'
                              : t.rank === 2
                              ? 'bg-slate-300 text-black'
                              : t.rank === 3
                              ? 'bg-amber-800 text-white'
                              : 'bg-surface-2 border border-line text-gray-400'
                          }`}
                        >
                          {t.rank}
                        </span>
                      </td>

                      {/* Time e Logo */}
                      <td className="p-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-surface-2 border border-line p-1.5 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                            <TeamLogo teamName={t.name} teamId={t.teamId} logoUrl={t.logoUrl} className="w-7 h-7" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm group-hover:text-amber-400 transition-colors truncate">
                                {t.name}
                              </span>
                              {t.tag && (
                                <span className="text-[10px] font-mono font-bold text-gray-400 px-1.5 py-0.5 rounded bg-surface-2 border border-line uppercase">
                                  {t.tag}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-gray-500 font-mono">ID: {t.teamId}</span>
                          </div>
                        </div>
                      </td>

                      {/* Rating Elo */}
                      <td className="p-4 text-center font-mono whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                          t.rating >= 1500
                            ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                            : 'bg-surface-2 border border-line text-white'
                        }`}>
                          {t.rating}
                        </span>
                      </td>

                      {/* Aproveitamento (Winrate) */}
                      <td className="p-4 text-center whitespace-nowrap">
                        <div className="inline-flex flex-col items-center">
                          <span className={`font-mono font-black text-xs ${
                            t.winRate >= 55 ? 'text-emerald-400' : t.winRate >= 50 ? 'text-amber-400' : 'text-rose-400'
                          }`}>
                            {t.winRate}%
                          </span>
                          <div className="w-20 h-1.5 bg-surface-2 rounded-full overflow-hidden mt-1 border border-line">
                            <div
                              className={`h-full rounded-full ${
                                t.winRate >= 55 ? 'bg-emerald-400' : t.winRate >= 50 ? 'bg-amber-400' : 'bg-rose-400'
                              }`}
                              style={{ width: `${t.winRate}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Vitórias / Derrotas */}
                      <td className="p-4 text-center font-mono whitespace-nowrap">
                        <span className="text-emerald-400 font-bold">{t.wins.toLocaleString('pt-BR')}V</span>
                        <span className="text-gray-500 mx-1">/</span>
                        <span className="text-rose-400 font-bold">{t.losses.toLocaleString('pt-BR')}D</span>
                      </td>

                      {/* Total de Jogos */}
                      <td className="p-4 text-center font-mono text-gray-300 whitespace-nowrap">
                        {t.totalGames.toLocaleString('pt-BR')}
                      </td>

                      {/* Último Jogo */}
                      <td className="p-4 text-center font-mono text-[11px] text-gray-400 whitespace-nowrap">
                        {fmtDate(t.lastMatchTime)}
                      </td>

                      {/* Ação */}
                      <td className="p-4 pr-6 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
                          <span>Ver time</span>
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
