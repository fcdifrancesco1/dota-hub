import React, { useState, useEffect } from 'react';
import { BarChart3, Trophy, Flame, Shield, Swords, Sparkles, Filter, Search, ArrowUpDown, ChevronDown } from 'lucide-react';
import { fetchHeroStats, fetchHeroPositions } from '../services/api';
import { SkeletonTable } from './SkeletonLoader';

export default function HeroMetaView({ searchQuery = "", onSelectHero }) {
  const [heroes, setHeroes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedAttr, setSelectedAttr] = useState('all');
  const [sortBy, setSortBy] = useState('tier'); // 'tier' | 'proWinRate' | 'proPick' | 'proBan' | 'pub8WinRate'
  const [sortAsc, setSortAsc] = useState(false);

  const [attempt, setAttempt] = useState(0);
  // Posições jogadas nas partidas profissionais (null = ainda não carregou ou indisponível)
  const [positions, setPositions] = useState(null);
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchHeroStats(), fetchHeroPositions()]).then(([data, pos]) => {
      setHeroes(data || []);
      setPositions(pos);
      setLoading(false);
    });
  }, [attempt]);

  // Herói conta numa posição quando foi jogado nela em pelo menos 15% dos seus
  // jogos profissionais recentes (e no mínimo 3 vezes)
  const MIN_SHARE = 0.15;
  const MIN_GAMES = 3;
  const heroPositions = (hero) => {
    const p = positions?.[hero.id];
    if (!p?.total) return [];
    return [1, 2, 3, 4, 5]
      .map((n) => ({ n, games: p[n], share: p[n] / p.total }))
      .filter((x) => x.games >= MIN_GAMES && x.share >= MIN_SHARE)
      .sort((x, y) => y.share - x.share);
  };

  const matchesRole = (hero, role) => {
    if (!role || role === 'all') return true;
    const pos = role.match(/^pos(\d)$/);
    if (pos) return heroPositions(hero).some((x) => x.n === Number(pos[1]));
    return hero.roles?.includes(role);
  };
  const positionFilter = /^pos\d$/.test(selectedRole);

  const rolesList = [
    { id: 'all', label: 'Todas as Funções' },
    { id: 'pos1', label: 'Carry (Pos 1)' },
    { id: 'pos2', label: 'Midlane (Pos 2)' },
    { id: 'pos3', label: 'Offlane (Pos 3)' },
    { id: 'pos4', label: 'Suporte (Pos 4)' },
    { id: 'pos5', label: 'Suporte (Pos 5)' },
    { id: 'Nuker', label: 'Nuker' },
    { id: 'Disabler', label: 'Disabler' },
    { id: 'Initiator', label: 'Iniciador' }
  ];

  const attrList = [
    { id: 'all', label: 'Todos Atributos' },
    { id: 'Força', label: 'Força' },
    { id: 'Agilidade', label: 'Agilidade' },
    { id: 'Inteligência', label: 'Inteligência' },
    { id: 'Universal', label: 'Universal' }
  ];

  const tierWeight = { 'S+': 5, 'S': 4, 'A': 3, 'B': 2, 'C': 1 };

  // Filtragem e Ordenação
  const filteredHeroes = heroes
    .filter((h) => {
      // Busca por texto
      if (searchQuery && !h.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Filtro de Função
      if (!matchesRole(h, selectedRole)) {
        return false;
      }
      // Filtro de Atributo
      if (selectedAttr !== 'all' && h.primaryAttr !== selectedAttr) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      let valA, valB;
      if (sortBy === 'tier') {
        valA = tierWeight[a.tier] || 0;
        valB = tierWeight[b.tier] || 0;
      } else {
        valA = a[sortBy] ?? 0;
        valB = b[sortBy] ?? 0;
      }
      return sortAsc ? valA - valB : valB - valA;
    });

  // Top destaques
  const topWinRate = [...heroes].sort((a, b) => b.proWinRate - a.proWinRate).find(h => h.proPick >= 5);
  const mostPicked = [...heroes].sort((a, b) => b.proPick - a.proPick)[0];
  const mostBanned = [...heroes].sort((a, b) => b.proBan - a.proBan)[0];
  const topImmortalPub = [...heroes].sort((a, b) => b.pub8WinRate - a.pub8WinRate).find(h => h.pub8Pick >= 500);

  return (
    <div className="max-w-6xl mx-auto w-full p-4 sm:p-6 space-y-6">
      {/* HEADER DA ABA */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-600 dark:text-amber-500">
            <BarChart3 className="w-4 h-4" />
            Meta &amp; Tier List Competitiva
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            Estatísticas do Patch Atual
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Dados combinados de partidas profissionais e partidas no rank Immortal do Dota 2
          </p>
        </div>
      </div>

      {/* CARDS DE DESTAQUE DO META */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {topWinRate && (
          <div className="tilt-card glass-panel border border-line rounded-2xl p-4 flex items-center gap-3.5 shadow-md">
            <img src={topWinRate.img} alt={topWinRate.name} className="w-12 h-12 rounded-xl object-cover border border-emerald-500/40 shadow-sm" />
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-emerald-500 block">Maior Winrate Pro</span>
              <strong className="text-sm font-black text-white truncate block">{topWinRate.name}</strong>
              <span className="text-xs font-mono text-emerald-500 font-bold">{topWinRate.proWinRate}% WR</span>
            </div>
          </div>
        )}

        {mostPicked && (
          <div className="tilt-card glass-panel border border-line rounded-2xl p-4 flex items-center gap-3.5 shadow-md">
            <img src={mostPicked.img} alt={mostPicked.name} className="w-12 h-12 rounded-xl object-cover border border-blue-500/40 shadow-sm" />
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-amber-500 block">Mais Escolhido Pro</span>
              <strong className="text-sm font-black text-white truncate block">{mostPicked.name}</strong>
              <span className="text-xs font-mono text-blue-600 dark:text-amber-400 font-bold">{mostPicked.proPick} Picks</span>
            </div>
          </div>
        )}

        {mostBanned && (
          <div className="tilt-card glass-panel border border-line rounded-2xl p-4 flex items-center gap-3.5 shadow-md">
            <img src={mostBanned.img} alt={mostBanned.name} className="w-12 h-12 rounded-xl object-cover border border-rose-500/40 shadow-sm" />
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-rose-500 block">Mais Banido Pro</span>
              <strong className="text-sm font-black text-white truncate block">{mostBanned.name}</strong>
              <span className="text-xs font-mono text-rose-500 font-bold">{mostBanned.proBan} Bans</span>
            </div>
          </div>
        )}

        {topImmortalPub && (
          <div className="tilt-card glass-panel border border-line rounded-2xl p-4 flex items-center gap-3.5 shadow-md">
            <img src={topImmortalPub.img} alt={topImmortalPub.name} className="w-12 h-12 rounded-xl object-cover border border-cyan-500/40 shadow-sm" />
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-cyan-600 dark:text-cyan-400 block">Destaque Immortal</span>
              <strong className="text-sm font-black text-white truncate block">{topImmortalPub.name}</strong>
              <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 font-bold">{topImmortalPub.pub8WinRate}% WR</span>
            </div>
          </div>
        )}
      </div>

      {/* BARRA DE FILTROS E FUNÇÕES */}
      <div className="glass-panel border border-line rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
        {/* Filtros de Posição / Função */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {rolesList.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRole(r.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedRole === r.id
                  ? 'bg-blue-600 text-on-accent dark:bg-amber-500 dark:text-black shadow-md'
                  : 'bg-surface-2 text-gray-400 hover:text-white hover:bg-surface-3 border border-line'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Filtro de Atributos */}
        <div className="flex items-center gap-1.5 bg-surface-2 p-1 rounded-xl border border-line">
          {attrList.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelectedAttr(a.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                selectedAttr === a.id
                  ? 'bg-blue-600 text-on-accent dark:bg-white/20 dark:text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* DICA DE INTERATIVIDADE */}
      <div className="flex items-center justify-between text-xs text-blue-600 dark:text-amber-300 font-mono bg-blue-500/10 dark:bg-amber-500/10 border border-blue-500/30 dark:border-amber-500/30 px-4 py-2.5 rounded-2xl shadow-sm">
        <span className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-amber-400 shrink-0" />
          <span>Clique em qualquer herói para abrir a <strong>Enciclopédia Completa</strong>: Habilidades em PT-BR, Upgrades de Cetro/Shard, Talentos e Counters!</span>
        </span>
      </div>

      {/* TABELA GERAL DO META */}
      {loading ? (
        <SkeletonTable rows={10} cols={6} />
      ) : positionFilter && !positions ? (
        <div className="rounded-2xl border border-line glass-panel p-10 text-center">
          <p className="text-sm font-bold text-white">As posições dos heróis não estão disponíveis agora.</p>
          <p className="text-xs text-gray-400 mt-1.5">Elas são calculadas com as partidas profissionais da OpenDota, que não está respondendo. Tente de novo em alguns minutos.</p>
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-on-accent dark:bg-amber-500 dark:text-black text-xs font-black uppercase tracking-wider hover:opacity-90 shadow-md"
          >
            Tentar novamente
          </button>
        </div>
      ) : heroes.length === 0 ? (
        <div className="rounded-2xl border border-line glass-panel p-10 text-center">
          <p className="text-sm font-bold text-white">Não foi possível carregar as estatísticas dos heróis agora.</p>
          <p className="text-xs text-gray-400 mt-1.5">A OpenDota, fonte desses dados, não está respondendo. Tente de novo em alguns minutos.</p>
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-on-accent dark:bg-amber-500 dark:text-black text-xs font-black uppercase tracking-wider hover:opacity-90 shadow-md"
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-line glass-panel shadow-xl">
          <table className="w-full text-left text-xs border-collapse min-w-[840px]">
            <thead className="bg-surface-2 text-gray-400 font-mono text-[10px] uppercase border-b border-line">
              <tr>
                <th
                  onClick={() => {
                    if (sortBy === 'tier') setSortAsc(!sortAsc);
                    else { setSortBy('tier'); setSortAsc(false); }
                  }}
                  className="p-3.5 pl-5 cursor-pointer hover:text-white whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    Tier {sortBy === 'tier' && <ArrowUpDown className="w-3 h-3 text-blue-600 dark:text-amber-400" />}
                  </div>
                </th>
                <th className="p-3.5 whitespace-nowrap">Herói</th>
                <th className="p-3.5 whitespace-nowrap">Atributo / Função</th>
                <th
                  onClick={() => {
                    if (sortBy === 'proWinRate') setSortAsc(!sortAsc);
                    else { setSortBy('proWinRate'); setSortAsc(false); }
                  }}
                  className="p-3.5 text-center cursor-pointer hover:text-white whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-1">
                    Winrate Pro {sortBy === 'proWinRate' && <ArrowUpDown className="w-3 h-3 text-blue-600 dark:text-amber-400" />}
                  </div>
                </th>
                <th
                  onClick={() => {
                    if (sortBy === 'proPick') setSortAsc(!sortAsc);
                    else { setSortBy('proPick'); setSortAsc(false); }
                  }}
                  className="p-3.5 text-center cursor-pointer hover:text-white whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-1">
                    Picks / Bans {sortBy === 'proPick' && <ArrowUpDown className="w-3 h-3 text-blue-600 dark:text-amber-400" />}
                  </div>
                </th>
                <th
                  onClick={() => {
                    if (sortBy === 'pub8WinRate') setSortAsc(!sortAsc);
                    else { setSortBy('pub8WinRate'); setSortAsc(false); }
                  }}
                  className="p-3.5 pr-5 text-right cursor-pointer hover:text-white whitespace-nowrap"
                >
                  <div className="flex items-center justify-end gap-1">
                    Immortal Pub WR {sortBy === 'pub8WinRate' && <ArrowUpDown className="w-3 h-3 text-blue-600 dark:text-amber-400" />}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line font-medium">
              {filteredHeroes.map((h) => {
                const tierStyles = {
                  'S+': 'bg-amber-500/20 text-amber-500 border-amber-500/40 shadow-sm',
                  'S': 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/40',
                  'A': 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/40',
                  'B': 'bg-surface-2 text-gray-400 border-line',
                  'C': 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                };

                return (
                  <tr
                    key={h.id}
                    onClick={() => onSelectHero && onSelectHero(h)}
                    className="hover:bg-surface-2/70 transition-colors cursor-pointer group"
                    title={`Clique para ver detalhes completos de ${h.name}`}
                  >
                    {/* Badge do Tier */}
                    <td className="p-3.5 pl-5 whitespace-nowrap">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl font-black text-xs font-mono border ${tierStyles[h.tier] || tierStyles['B']}`}>
                        {h.tier}
                      </span>
                    </td>

                    {/* Herói */}
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <img
                          src={h.img}
                          alt={h.name}
                          className="w-11 h-7 object-cover rounded-lg border border-line shrink-0 group-hover:border-blue-500 dark:group-hover:border-amber-400 transition-colors shadow-sm"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <strong className="text-white text-xs block group-hover:text-blue-600 dark:group-hover:text-amber-400 transition-colors">{h.name}</strong>
                            <span className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-600 dark:text-amber-400 font-mono transition-opacity">→</span>
                          </div>
                          <span className="text-[10px] text-gray-400">{h.attackType}</span>
                        </div>
                      </div>
                    </td>

                    {/* Atributo e Funções */}
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-surface-2 px-2 py-0.5 rounded-lg border border-line">
                          {h.primaryAttr}
                        </span>
                        {heroPositions(h).length > 0 ? (
                          <div className="flex items-center gap-1" title="Posições nas partidas profissionais dos últimos 30 dias">
                            {heroPositions(h).map((x) => (
                              <span
                                key={x.n}
                                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                                  selectedRole === `pos${x.n}` ? 'bg-blue-500/20 text-blue-600 dark:text-amber-400' : 'bg-surface-2 text-gray-400 border border-line'
                                }`}
                              >
                                Pos {x.n} · {Math.round(x.share * 100)}%
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[10px] text-gray-400 truncate max-w-[220px]">
                            {h.roles.slice(0, 3).join(', ')}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Winrate Pro */}
                    <td className="p-3.5 text-center font-mono whitespace-nowrap">
                      <span className={`font-black text-xs ${h.proWinRate >= 52 ? 'text-emerald-500' : h.proWinRate >= 48 ? 'text-amber-500' : 'text-rose-500'}`}>
                        {h.proPick > 0 ? `${h.proWinRate}%` : '—'}
                      </span>
                    </td>

                    {/* Picks / Bans */}
                    <td className="p-3.5 text-center font-mono text-gray-400 whitespace-nowrap">
                      <span className="text-white font-bold">{h.proPick}</span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className="text-rose-500 font-bold">{h.proBan}</span>
                    </td>

                    {/* Immortal Pub WR */}
                    <td className="p-3.5 pr-5 text-right font-mono whitespace-nowrap">
                      <span className={`font-black ${h.pub8WinRate >= 52 ? 'text-emerald-500' : h.pub8WinRate >= 48 ? 'text-white' : 'text-rose-500'}`}>
                        {h.pub8WinRate}%
                      </span>
                      <span className="text-[10px] text-gray-400 block">({h.pub8Pick} jogos)</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
