import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Trophy,
  Search,
  ArrowUpDown,
  ChevronRight,
  Loader2,
  Globe,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { fetchTeamsRanking } from '../services/teamsRanking';
import TeamLogo from '../utils/teamLogos';
import { medalStyle } from '../utils/medals';

export default function TeamsPage() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rank'); // 'rank' | 'points'
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    document.title = 'Ranking Mundial de Times · Liquipedia & SAP · DotaHub Brasil';
    let cancelled = false;
    setLoading(true);

    fetchTeamsRanking()
      .then((data) => {
        if (!cancelled) {
          setTeams(data || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn('Erro ao carregar ranking:', err);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, []);

  // Lista de regiões únicas
  const regions = useMemo(() => {
    const set = new Set();
    teams.forEach((t) => { if (t.region) set.add(t.region); });
    return Array.from(set);
  }, [teams]);

  // Filtros e busca
  const filteredTeams = useMemo(() => {
    let result = [...teams];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) => t.name.toLowerCase().includes(q) || (t.tag && t.tag.toLowerCase().includes(q))
      );
    }

    if (regionFilter !== 'all') {
      result = result.filter((t) => t.region && t.region.toLowerCase() === regionFilter.toLowerCase());
    }

    result.sort((a, b) => {
      let valA = a[sortBy] ?? 0;
      let valB = b[sortBy] ?? 0;
      return sortAsc ? valA - valB : valB - valA;
    });

    return result;
  }, [teams, search, regionFilter, sortBy, sortAsc]);

  // Top 3 do pódio
  const top1 = teams[0];
  const top2 = teams[1];
  const top3 = teams[2];

  // Pelo ID da OpenDota quando conhecido; senão pelo nome (a página do time resolve o ID)
  const handleTeamClick = (team) => {
    if (team?.teamId) navigate(`/times/${team.teamId}`);
    else if (team?.name) navigate(`/times/${encodeURIComponent(team.name)}`);
  };

  const renderMovement = (change) => {
    if (!change || change === '-') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-gray-400">
          <Minus className="w-3 h-3 text-gray-400" />
          <span>-</span>
        </span>
      );
    }
    if (change.startsWith('+')) {
      return (
        <span className="inline-flex items-center gap-0.5 text-[11px] font-mono font-black text-emerald-500">
          <ArrowUp className="w-3 h-3 text-emerald-500 stroke-[3]" />
          <span>{change}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-mono font-black text-rose-500">
        <ArrowDown className="w-3 h-3 text-rose-500 stroke-[3]" />
        <span>{change}</span>
      </span>
    );
  };

  return (
    <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen space-y-8">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-500">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Circuito Mundial Competitivo · Liquipedia & SAP</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mt-1">
            Ranking Oficial de Equipes
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-3xl leading-relaxed">
            Classificação mundial oficial de Dota 2 com dados da <strong>Liquipedia</strong> em parceria com a <strong>SAP</strong>.
            Mostra o ranking ativo e pontuação em tempo real dos times profissionais nos principais campeonatos do circuito.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-surface-2/80 border border-line rounded-2xl px-4 py-2.5 flex items-center gap-3">
            <Shield className="w-5 h-5 text-amber-400" />
            <div>
              <span className="text-[10px] font-bold uppercase text-gray-400 block leading-tight">Total Ativo</span>
              <span className="font-mono font-black text-white text-sm">{teams.length} equipes</span>
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
              onClick={() => handleTeamClick(top2)}
              className="tilt-card glass-panel rounded-3xl p-6 border border-slate-300/30 dark:border-slate-500/30 hover:border-slate-300/60 shadow-xl cursor-pointer transition-all flex flex-col justify-between group order-2 md:order-1 relative overflow-hidden"
            >
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-slate-400/10 blur-2xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border font-mono font-black text-sm" style={medalStyle(2)} aria-label="2º lugar">
                    <span>2</span>
                  </span>
                  <div className="flex items-center gap-2">
                    {renderMovement(top2.change)}
                    <span className="text-xs font-mono font-bold text-gray-400">
                      Pontos: <strong className="text-white text-sm">{top2.points}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 my-2">
                  <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-line p-2 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                    <TeamLogo teamName={top2.name} teamId={top2.teamId} logoUrl={top2.logo} className="w-12 h-12" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-black text-white truncate group-hover:text-amber-400 transition-colors">
                      {top2.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {top2.tag && (
                        <span className="text-[11px] font-mono font-bold text-gray-400 uppercase">
                          [{top2.tag}]
                        </span>
                      )}
                      {top2.region && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-surface-3 border border-line text-blue-500 dark:text-cyan-400 font-bold uppercase">
                          {top2.region}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-line mt-4 flex items-center justify-between text-xs">
                <span className="text-gray-400 font-medium font-mono">
                  {top2.points} Pontos SAP
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
            onClick={() => handleTeamClick(top1)}
            className="tilt-card glass-panel rounded-3xl p-6 sm:p-7 border border-amber-500/50 hover:border-amber-400 shadow-2xl cursor-pointer transition-all flex flex-col justify-between group order-1 md:order-2 relative overflow-hidden bg-gradient-to-b from-amber-500/10 to-transparent"
          >
            <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border font-mono font-black text-sm" style={medalStyle(1)} aria-label="1º lugar">
                  <span>1</span>
                </span>
                <div className="flex items-center gap-2">
                  {renderMovement(top1.change)}
                  <span className="text-xs font-mono font-bold text-amber-500">
                    Pontos: <strong className="text-white text-base">{top1.points}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-5 my-3">
                <div className="w-20 h-20 rounded-2xl bg-surface-2 border-2 border-amber-500/50 p-2.5 flex items-center justify-center shrink-0 shadow-xl group-hover:scale-105 transition-transform">
                  <TeamLogo teamName={top1.name} teamId={top1.teamId} logoUrl={top1.logo} className="w-14 h-14" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 block">
                    Melhor Equipe do Mundo
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white truncate group-hover:text-amber-400 transition-colors">
                    {top1.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {top1.tag && (
                      <span className="text-xs font-mono font-bold text-gray-400 uppercase">
                        [{top1.tag}]
                      </span>
                    )}
                    {top1.region && (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-400 font-black uppercase">
                        {top1.region}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-line mt-4 flex items-center justify-between text-xs">
              <span className="text-amber-500 font-bold font-mono">
                {top1.points} Pontos SAP
              </span>
              <span className="text-amber-400 font-black flex items-center gap-1 group-hover:translate-x-1 transition-transform uppercase tracking-wider text-[11px]">
                <span>Ver Elenco & Estatísticas</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* #3 TERCEIRO LUGAR */}
          {top3 && (
            <div
              onClick={() => handleTeamClick(top3)}
              className="tilt-card glass-panel rounded-3xl p-6 border border-amber-700/30 dark:border-amber-600/30 hover:border-amber-600/60 shadow-xl cursor-pointer transition-all flex flex-col justify-between group order-3 relative overflow-hidden"
            >
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-amber-700/10 blur-2xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border font-mono font-black text-sm" style={medalStyle(3)} aria-label="3º lugar">
                    <span>3</span>
                  </span>
                  <div className="flex items-center gap-2">
                    {renderMovement(top3.change)}
                    <span className="text-xs font-mono font-bold text-gray-400">
                      Pontos: <strong className="text-white text-sm">{top3.points}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 my-2">
                  <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-line p-2 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                    <TeamLogo teamName={top3.name} teamId={top3.teamId} logoUrl={top3.logo} className="w-12 h-12" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-black text-white truncate group-hover:text-amber-400 transition-colors">
                      {top3.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {top3.tag && (
                        <span className="text-[11px] font-mono font-bold text-gray-400 uppercase">
                          [{top3.tag}]
                        </span>
                      )}
                      {top3.region && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-surface-3 border border-line text-blue-500 dark:text-cyan-400 font-bold uppercase">
                          {top3.region}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-line mt-4 flex items-center justify-between text-xs">
                <span className="text-gray-400 font-medium font-mono">
                  {top3.points} Pontos SAP
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
        {/* Chips de Região */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setRegionFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              regionFilter === 'all'
                ? 'bg-amber-500 text-on-accent font-black shadow-md shadow-amber-500/20'
                : 'bg-surface-2 border border-line text-gray-400 hover:text-white hover:border-amber-500/30'
            }`}
          >
            Todas as Regiões
          </button>
          {regions.map((reg) => (
            <button
              key={reg}
              onClick={() => setRegionFilter(reg)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                regionFilter.toLowerCase() === reg.toLowerCase()
                  ? 'bg-amber-500 text-on-accent font-black shadow-md shadow-amber-500/20'
                  : 'bg-surface-2 border border-line text-gray-400 hover:text-white hover:border-amber-500/30'
              }`}
            >
              {reg}
            </button>
          ))}
        </div>

        {/* Campo de Busca */}
        <div className="relative min-w-[260px] sm:min-w-[320px] flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar time ou tag (ex: Yandex, Spirit, Falcons)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-2 border border-line rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
      </div>

      {/* TABELA DE RANKING LIQUIPEDIA */}
      {loading ? (
        <div className="glass-panel border border-line rounded-3xl p-24 text-center shadow-xl flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          <span className="text-xs font-bold text-gray-400">Carregando classificação mundial oficial da Liquipedia...</span>
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="glass-panel border border-line rounded-3xl p-16 text-center shadow-xl">
          <Shield className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <h3 className="text-base font-black text-white uppercase">Nenhum time encontrado</h3>
          <p className="text-xs text-gray-400 mt-1">Tente ajustar os termos de busca ou mudar a região selecionada.</p>
        </div>
      ) : (
        <div className="glass-panel border border-line rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead className="bg-surface-2/80 text-gray-400 font-mono text-[10px] uppercase border-b border-line">
                <tr>
                  <th className="p-4 pl-6 text-center w-16">Rank</th>
                  <th className="p-4 text-center w-16">+/-</th>
                  <th className="p-4">Equipe</th>
                  <th className="p-4 text-center">Região</th>
                  <th
                    onClick={() => {
                      if (sortBy === 'points') setSortAsc(!sortAsc);
                      else { setSortBy('points'); setSortAsc(false); }
                    }}
                    className="p-4 text-right cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Pontos SAP</span>
                      {sortBy === 'points' && <ArrowUpDown className="w-3 h-3 text-amber-400" />}
                    </div>
                  </th>
                  <th className="p-4 pr-6 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-medium text-gray-300">
                {filteredTeams.map((t) => {
                  const isTop1 = t.rank === 1;
                  const isTop2 = t.rank === 2;
                  const isTop3 = t.rank === 3;
                  return (
                    <tr
                      key={t.name}
                      onClick={() => handleTeamClick(t)}
                      className="hover:bg-surface-2/60 transition-colors cursor-pointer group"
                    >
                      {/* Posição no Ranking */}
                      <td className="p-4 pl-6 text-center font-mono">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-xl font-black text-xs ${
                            isTop1 || isTop2 || isTop3 ? 'border' : 'text-gray-400 bg-surface-2'
                          }`}
                          style={medalStyle(t.rank) || undefined}
                        >
                          {t.rank}
                        </span>
                      </td>

                      {/* Variação */}
                      <td className="p-4 text-center">
                        {renderMovement(t.change)}
                      </td>

                      {/* Time */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-surface-2 border border-line p-1.5 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                            <TeamLogo teamName={t.name} teamId={t.teamId} logoUrl={t.logo} className="w-7 h-7" />
                          </div>
                          <div>
                            <span className="font-bold text-white text-sm group-hover:text-amber-400 transition-colors block">
                              {t.name}
                            </span>
                            {t.tag && (
                              <span className="text-[10px] font-mono text-gray-400">
                                [{t.tag}]
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Região */}
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-surface-2 border border-line text-xs font-semibold text-gray-300">
                          <Globe className="w-3.5 h-3.5 text-blue-500 dark:text-cyan-400" />
                          <span>{t.region || 'Mundial'}</span>
                        </span>
                      </td>

                      {/* Pontuação */}
                      <td className="p-4 text-right font-mono">
                        <span className="px-3 py-1 rounded-xl bg-surface-2 border border-line text-white font-black text-sm">
                          {t.points}
                        </span>
                      </td>

                      {/* Ação */}
                      <td className="p-4 pr-6 text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-400 group-hover:text-amber-400 transition-colors">
                          <span>Ver time</span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
