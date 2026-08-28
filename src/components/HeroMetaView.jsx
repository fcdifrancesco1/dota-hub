import React, { useState, useEffect } from 'react';
import { BarChart3, Trophy, Flame, Shield, Swords, Sparkles, Filter, Search, ArrowUpDown, ChevronDown } from 'lucide-react';
import { fetchHeroStats } from '../services/api';
import { SkeletonTable } from './SkeletonLoader';

export default function HeroMetaView({ searchQuery = "" }) {
  const [heroes, setHeroes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedAttr, setSelectedAttr] = useState('all');
  const [sortBy, setSortBy] = useState('tier'); // 'tier' | 'proWinRate' | 'proPick' | 'proBan' | 'pub8WinRate'
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchHeroStats().then((data) => {
      setHeroes(data);
      setLoading(false);
    });
  }, []);

  const rolesList = [
    { id: 'all', label: 'Todas as Funções' },
    { id: 'Carry', label: 'Carry (Pos 1)' },
    { id: 'Mid', label: 'Midlane (Pos 2)' },
    { id: 'Offlane', label: 'Offlane (Pos 3)' },
    { id: 'Support', label: 'Suporte (Pos 4/5)' },
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
      if (selectedRole !== 'all' && !h.roles.includes(selectedRole)) {
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
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-amber-400">
            <BarChart3 className="w-4 h-4" />
            Meta &amp; Tier List Competitiva
          </div>
          <h1 className="text-2xl font-black text-white tracking-wide mt-1">
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
          <div className="bg-gradient-to-br from-[#161A24]/90 to-[#10131C]/90 border border-emerald-500/30 rounded-xl p-3.5 flex items-center gap-3 shadow-lg">
            <img src={topWinRate.img} alt={topWinRate.name} className="w-12 h-12 rounded-lg object-cover border border-emerald-400/50" />
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">Maior Winrate Pro</span>
              <strong className="text-sm text-white truncate block">{topWinRate.name}</strong>
              <span className="text-xs font-mono text-emerald-300 font-bold">{topWinRate.proWinRate}% WR</span>
            </div>
          </div>
        )}

        {mostPicked && (
          <div className="bg-gradient-to-br from-[#161A24]/90 to-[#10131C]/90 border border-amber-500/30 rounded-xl p-3.5 flex items-center gap-3 shadow-lg">
            <img src={mostPicked.img} alt={mostPicked.name} className="w-12 h-12 rounded-lg object-cover border border-amber-400/50" />
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-amber-400 block">Mais Escolhido Pro</span>
              <strong className="text-sm text-white truncate block">{mostPicked.name}</strong>
              <span className="text-xs font-mono text-amber-300 font-bold">{mostPicked.proPick} Picks</span>
            </div>
          </div>
        )}

        {mostBanned && (
          <div className="bg-gradient-to-br from-[#161A24]/90 to-[#10131C]/90 border border-rose-500/30 rounded-xl p-3.5 flex items-center gap-3 shadow-lg">
            <img src={mostBanned.img} alt={mostBanned.name} className="w-12 h-12 rounded-lg object-cover border border-rose-400/50" />
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-rose-400 block">Mais Banido Pro</span>
              <strong className="text-sm text-white truncate block">{mostBanned.name}</strong>
              <span className="text-xs font-mono text-rose-300 font-bold">{mostBanned.proBan} Bans</span>
            </div>
          </div>
        )}

        {topImmortalPub && (
          <div className="bg-gradient-to-br from-[#161A24]/90 to-[#10131C]/90 border border-cyan-500/30 rounded-xl p-3.5 flex items-center gap-3 shadow-lg">
            <img src={topImmortalPub.img} alt={topImmortalPub.name} className="w-12 h-12 rounded-lg object-cover border border-cyan-400/50" />
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-cyan-400 block">Destaque Immortal Pub</span>
              <strong className="text-sm text-white truncate block">{topImmortalPub.name}</strong>
              <span className="text-xs font-mono text-cyan-300 font-bold">{topImmortalPub.pub8WinRate}% WR</span>
            </div>
          </div>
        )}
      </div>

      {/* BARRA DE FILTROS E FUNÇÕES */}
      <div className="bg-[#141824]/70 border border-white/10 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        {/* Filtros de Posição / Função */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {rolesList.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRole(r.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedRole === r.id
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Filtro de Atributos */}
        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-lg border border-white/10">
          {attrList.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelectedAttr(a.id)}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                selectedAttr === a.id
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* TABELA GERAL DO META */}
      {loading ? (
        <SkeletonTable rows={10} cols={6} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0E1118]/80 backdrop-blur-xl">
          <table className="w-full text-left text-xs border-collapse min-w-[760px]">
            <thead className="bg-[#161A24]/90 text-gray-400 font-mono text-[10px] uppercase border-b border-white/10">
              <tr>
                <th
                  onClick={() => {
                    if (sortBy === 'tier') setSortAsc(!sortAsc);
                    else { setSortBy('tier'); setSortAsc(false); }
                  }}
                  className="p-3 pl-4 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    Tier {sortBy === 'tier' && <ArrowUpDown className="w-3 h-3 text-amber-400" />}
                  </div>
                </th>
                <th className="p-3">Herói</th>
                <th className="p-3">Atributo / Função</th>
                <th
                  onClick={() => {
                    if (sortBy === 'proWinRate') setSortAsc(!sortAsc);
                    else { setSortBy('proWinRate'); setSortAsc(false); }
                  }}
                  className="p-3 text-center cursor-pointer hover:text-white"
                >
                  <div className="flex items-center justify-center gap-1">
                    Winrate Pro {sortBy === 'proWinRate' && <ArrowUpDown className="w-3 h-3 text-amber-400" />}
                  </div>
                </th>
                <th
                  onClick={() => {
                    if (sortBy === 'proPick') setSortAsc(!sortAsc);
                    else { setSortBy('proPick'); setSortAsc(false); }
                  }}
                  className="p-3 text-center cursor-pointer hover:text-white"
                >
                  <div className="flex items-center justify-center gap-1">
                    Picks / Bans {sortBy === 'proPick' && <ArrowUpDown className="w-3 h-3 text-amber-400" />}
                  </div>
                </th>
                <th
                  onClick={() => {
                    if (sortBy === 'pub8WinRate') setSortAsc(!sortAsc);
                    else { setSortBy('pub8WinRate'); setSortAsc(false); }
                  }}
                  className="p-3 pr-4 text-right cursor-pointer hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    Immortal Pub WR {sortBy === 'pub8WinRate' && <ArrowUpDown className="w-3 h-3 text-amber-400" />}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {filteredHeroes.map((h) => {
                const tierStyles = {
                  'S+': 'bg-amber-500/20 text-amber-300 border-amber-400 shadow-amber-500/20',
                  'S': 'bg-emerald-500/20 text-emerald-300 border-emerald-400',
                  'A': 'bg-cyan-500/20 text-cyan-300 border-cyan-400',
                  'B': 'bg-white/10 text-gray-300 border-white/20',
                  'C': 'bg-rose-500/10 text-rose-300 border-rose-400/40'
                };

                return (
                  <tr key={h.id} className="hover:bg-white/[0.03] transition-colors">
                    {/* Badge do Tier */}
                    <td className="p-3 pl-4">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-black text-xs font-mono border ${tierStyles[h.tier] || tierStyles['B']}`}>
                        {h.tier}
                      </span>
                    </td>

                    {/* Herói */}
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={h.img}
                          alt={h.name}
                          className="w-10 h-6 object-cover rounded border border-white/10 shrink-0"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <div>
                          <strong className="text-white text-xs block">{h.name}</strong>
                          <span className="text-[10px] text-gray-400">{h.attackType}</span>
                        </div>
                      </div>
                    </td>

                    {/* Atributo e Funções */}
                    <td className="p-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                          {h.primaryAttr}
                        </span>
                        <div className="text-[10px] text-gray-500 truncate max-w-[220px]">
                          {h.roles.slice(0, 3).join(', ')}
                        </div>
                      </div>
                    </td>

                    {/* Winrate Pro */}
                    <td className="p-3 text-center font-mono">
                      <span className={`font-bold text-xs ${h.proWinRate >= 52 ? 'text-emerald-400' : h.proWinRate >= 48 ? 'text-amber-400' : 'text-rose-400'}`}>
                        {h.proPick > 0 ? `${h.proWinRate}%` : '—'}
                      </span>
                    </td>

                    {/* Picks / Bans */}
                    <td className="p-3 text-center font-mono text-gray-300">
                      <span className="text-white font-bold">{h.proPick}</span>
                      <span className="text-gray-500"> / </span>
                      <span className="text-rose-400">{h.proBan}</span>
                    </td>

                    {/* Immortal Pub WR */}
                    <td className="p-3 pr-4 text-right font-mono">
                      <span className={`font-bold ${h.pub8WinRate >= 52 ? 'text-emerald-400' : h.pub8WinRate >= 48 ? 'text-gray-300' : 'text-rose-400'}`}>
                        {h.pub8WinRate}%
                      </span>
                      <span className="text-[10px] text-gray-500 block">({h.pub8Pick} jogos)</span>
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
