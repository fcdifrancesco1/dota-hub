import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Calendar,
  Swords,
  ArrowLeft,
  ChevronRight,
  Shield,
  Flame,
  BarChart3,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  Loader2,
  Ban,
  Slash,
  Crown
} from 'lucide-react';
import { SkeletonGrid } from './SkeletonLoader';
import { fetchTournamentHeroStats, getHeroImg, getHeroName } from '../services/api';

export default function TournamentsView({
  tournaments = [],
  loading = false,
  onSelectSeries,
  searchQuery = "",
  constants = {},
  onSelectHero
}) {
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ongoing'); // 'ongoing' | 'finalized'
  const [activeSubTab, setActiveSubTab] = useState('series'); // 'series' | 'heroes'
  const [heroFilterTab, setHeroFilterTab] = useState('picked'); // 'picked' | 'banned' | 'contested' | 'winrate' | 'uncontested'
  const [heroSearch, setHeroSearch] = useState('');

  // Estados das estatísticas de heróis do torneio selecionado
  const [heroStats, setHeroStats] = useState(null);
  const [loadingHeroStats, setLoadingHeroStats] = useState(false);

  // Carrega estatísticas de heróis do torneio ao selecionar
  useEffect(() => {
    if (!selectedTournament) {
      setHeroStats(null);
      return;
    }

    const leagueId = selectedTournament.league_id || selectedTournament.id;
    setLoadingHeroStats(true);
    fetchTournamentHeroStats(leagueId).then((data) => {
      setHeroStats(data);
      setLoadingHeroStats(false);
    });
  }, [selectedTournament]);

  // Separação entre torneios em andamento e finalizados
  const ongoingTournaments = tournaments.filter(
    (t) => t.status === 'em_andamento'
  );
  const finalizedTournaments = tournaments.filter(
    (t) => t.status === 'finalizado' || (!t.status && t.status !== 'em_andamento')
  );

  // Lista atual conforme aba selecionada e busca
  const currentList = statusFilter === 'ongoing' ? ongoingTournaments : finalizedTournaments;

  const filteredTournaments = currentList.filter((t) => {
    if (!searchQuery) return true;
    return t.name && t.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Cálculo dos heróis disputados e não-disputados (Liquipedia Style)
  const allConstantsHeroes = Object.values(constants?.heroes || {});
  const totalDotaHeroes = allConstantsHeroes.length || 124;

  const heroesData = heroStats?.heroes || [];
  const contestedHeroIds = new Set(heroesData.map((h) => Number(h.hero_id)));

  // Heróis nem escolhidos e nem banidos
  const uncontestedHeroes = allConstantsHeroes.filter(
    (h) => !contestedHeroIds.has(Number(h.id))
  );

  // Filtros internos da aba de Heróis
  const getFilteredHeroList = () => {
    let list = [...heroesData];

    if (heroSearch.trim()) {
      const q = heroSearch.toLowerCase();
      list = list.filter((h) => {
        const name = getHeroName(constants, h.hero_id).toLowerCase();
        return name.includes(q);
      });
    }

    if (heroFilterTab === 'picked') {
      return list.filter((h) => h.picks > 0).sort((a, b) => b.picks - a.picks);
    }
    if (heroFilterTab === 'banned') {
      return list.filter((h) => h.bans > 0).sort((a, b) => b.bans - a.bans);
    }
    if (heroFilterTab === 'contested') {
      return list.sort((a, b) => (b.picks + b.bans) - (a.picks + a.bans));
    }
    if (heroFilterTab === 'winrate') {
      return list
        .filter((h) => h.picks >= 2)
        .sort((a, b) => b.winRate - a.winRate || b.picks - a.picks);
    }
    return list;
  };

  const displayedHeroes = getFilteredHeroList();
  const totalMatchesCount = heroStats?.totalMatches || selectedTournament?.seriesList?.reduce((acc, s) => acc + (s.games?.length || 1), 0) || 0;
  const pickedHeroesCount = heroesData.filter((h) => h.picks > 0).length;
  const bannedHeroesCount = heroesData.filter((h) => h.bans > 0).length;
  const contestedCount = heroesData.length;
  const uncontestedCount = Math.max(0, totalDotaHeroes - contestedCount);
  const contestedPercent = totalDotaHeroes > 0 ? Math.round((contestedCount / totalDotaHeroes) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto w-full p-4 sm:p-6 space-y-6">
      {selectedTournament ? (
        <div className="space-y-6">
          <button
            onClick={() => {
              setSelectedTournament(null);
              setActiveSubTab('series');
            }}
            className="flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors uppercase tracking-wider cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar para lista de torneios
          </button>

          {/* Banner do Torneio Selecionado */}
          <div className="bg-gradient-to-r from-[#161A24]/90 via-[#10131C]/90 to-[#0C0E14]/90 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedTournament.status === 'em_andamento' ? (
                    <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Torneio em Andamento
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Torneio Finalizado
                    </span>
                  )}

                  {selectedTournament.champion && (
                    <span className="flex items-center gap-1 text-[10px] font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
                      <Crown className="w-3.5 h-3.5" /> Campeão: {selectedTournament.champion}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl font-black text-white mt-2.5">
                  {selectedTournament.name}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 mt-2 font-mono">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" /> {selectedTournament.recentDate}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" /> {selectedTournament.seriesList?.length || 0} Séries Registradas
                  </span>
                  {selectedTournament.location && (
                    <span className="text-gray-400">
                      · {selectedTournament.location}
                    </span>
                  )}
                  {selectedTournament.prizePool && (
                    <span className="text-emerald-400 font-bold">
                      · {selectedTournament.prizePool}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Abas Internas: Confrontos vs Heróis */}
            <div className="flex items-center gap-2 mt-6 pt-5 border-t border-white/10">
              <button
                onClick={() => setActiveSubTab('series')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeSubTab === 'series'
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Swords className="w-4 h-4" /> Confrontos & Séries
              </button>

              <button
                onClick={() => setActiveSubTab('heroes')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeSubTab === 'heroes'
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Flame className="w-4 h-4" /> Estatísticas de Heróis (Liquipedia)
              </button>
            </div>
          </div>

          {/* CONTEÚDO DA SUB-ABA 1: CONFRONTOS E SÉRIES */}
          {activeSubTab === 'series' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
                  Séries e Partidas ({selectedTournament.seriesList?.length || 0})
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {(selectedTournament.seriesList || []).map((s, idx) => {
                  const aWon = s.scoreA > s.scoreB;
                  const bWon = s.scoreB > s.scoreA;

                  return (
                    <div
                      key={idx}
                      onClick={() => onSelectSeries && onSelectSeries(s)}
                      className="group bg-[#161A24]/80 hover:bg-[#1C2230] border border-white/10 hover:border-amber-500/60 rounded-xl p-4 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-amber-500/5 hover:-translate-y-1"
                    >
                      <div className="flex items-center justify-between gap-2 text-[10px] text-gray-400 border-b border-white/5 pb-2 mb-2.5">
                        <span className="font-bold text-amber-400 uppercase tracking-wider truncate flex-1 min-w-0 pr-1">
                          {s.stage || 'Série Profissional'}
                        </span>
                        <span className="font-mono bg-black/40 px-2 py-0.5 rounded border border-white/5 shrink-0 whitespace-nowrap text-[9px]">
                          {s.dur}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 py-1">
                        <span className={`text-xs font-bold truncate flex-1 min-w-0 ${aWon ? 'text-white font-extrabold' : 'text-gray-400'}`}>
                          {s.timeA}
                        </span>
                        <span className={`font-mono text-xs font-black min-w-[26px] h-6 px-1.5 flex items-center justify-center rounded shrink-0 ${aWon ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 text-rose-400/80'}`}>
                          {s.scoreA}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 py-1">
                        <span className={`text-xs font-bold truncate flex-1 min-w-0 ${bWon ? 'text-white font-extrabold' : 'text-gray-400'}`}>
                          {s.timeB}
                        </span>
                        <span className={`font-mono text-xs font-black min-w-[26px] h-6 px-1.5 flex items-center justify-center rounded shrink-0 ${bWon ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 text-rose-400/80'}`}>
                          {s.scoreB}
                        </span>
                      </div>

                      <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-400 group-hover:text-amber-400 transition-colors">
                        <span>Ver Estatísticas e Replay</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CONTEÚDO DA SUB-ABA 2: ESTATÍSTICAS DE HERÓIS (LIQUIPEDIA STYLE) */}
          {activeSubTab === 'heroes' && (
            <div className="space-y-6">
              {loadingHeroStats ? (
                <div className="py-24 flex flex-col items-center justify-center gap-3 text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                  <span className="text-xs font-semibold">
                    Compilando picks, bans e taxas de vitória de cada herói...
                  </span>
                </div>
              ) : heroesData.length === 0 ? (
                <div className="bg-[#161A24]/60 border border-white/10 rounded-2xl p-8 text-center space-y-3">
                  <BarChart3 className="w-10 h-10 text-gray-500 mx-auto" />
                  <h3 className="text-sm font-bold text-white">Estatísticas detalhadas em processamento</h3>
                  <p className="text-xs text-gray-400 max-w-md mx-auto">
                    Os dados completos de picks e bans deste torneio estão sendo sincronizados da OpenDota. Você pode visualizar os confrontos na aba acima.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* CARDS DE RESUMO DO TORNEIO (LIQUIPEDIA STYLE) */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="bg-[#161A24]/90 border border-white/10 rounded-xl p-3.5 text-center">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Jogos Disputados
                      </span>
                      <span className="text-2xl font-black text-white font-mono mt-1 block">
                        {totalMatchesCount}
                      </span>
                      <span className="text-[10px] text-cyan-400 font-mono">Partidas Oficiais</span>
                    </div>

                    <div className="bg-[#161A24]/90 border border-white/10 rounded-xl p-3.5 text-center">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Heróis Escolhidos
                      </span>
                      <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">
                        {pickedHeroesCount}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">Picks realizados</span>
                    </div>

                    <div className="bg-[#161A24]/90 border border-white/10 rounded-xl p-3.5 text-center">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Heróis Banidos
                      </span>
                      <span className="text-2xl font-black text-rose-400 font-mono mt-1 block">
                        {bannedHeroesCount}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">Bans efetuados</span>
                    </div>

                    <div className="bg-[#161A24]/90 border border-white/10 rounded-xl p-3.5 text-center">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Disputados (P+B)
                      </span>
                      <span className="text-2xl font-black text-amber-400 font-mono mt-1 block">
                        {contestedCount}
                      </span>
                      <span className="text-[10px] text-amber-400/80 font-mono">{contestedPercent}% do elenco</span>
                    </div>

                    <div className="bg-[#161A24]/90 border border-white/10 rounded-xl p-3.5 text-center col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Não Escolhidos
                      </span>
                      <span className="text-2xl font-black text-gray-400 font-mono mt-1 block">
                        {uncontestedCount}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">0 Picks e 0 Bans</span>
                    </div>
                  </div>

                  {/* FILTROS E BUSCA DE HERÓIS */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                      <button
                        onClick={() => setHeroFilterTab('picked')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                          heroFilterTab === 'picked'
                            ? 'bg-emerald-500 text-black font-extrabold shadow'
                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        Mais Escolhidos ({pickedHeroesCount})
                      </button>

                      <button
                        onClick={() => setHeroFilterTab('banned')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                          heroFilterTab === 'banned'
                            ? 'bg-rose-500 text-black font-extrabold shadow'
                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        Mais Banidos ({bannedHeroesCount})
                      </button>

                      <button
                        onClick={() => setHeroFilterTab('contested')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                          heroFilterTab === 'contested'
                            ? 'bg-amber-500 text-black font-extrabold shadow'
                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        Mais Disputados ({contestedCount})
                      </button>

                      <button
                        onClick={() => setHeroFilterTab('winrate')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                          heroFilterTab === 'winrate'
                            ? 'bg-cyan-500 text-black font-extrabold shadow'
                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        Maior Win Rate
                      </button>

                      <button
                        onClick={() => setHeroFilterTab('uncontested')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                          heroFilterTab === 'uncontested'
                            ? 'bg-purple-500 text-black font-extrabold shadow'
                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        Não Escolhidos ({uncontestedCount})
                      </button>
                    </div>

                    {heroFilterTab !== 'uncontested' && (
                      <div className="relative min-w-[200px]">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={heroSearch}
                          onChange={(e) => setHeroSearch(e.target.value)}
                          placeholder="Buscar herói no torneio..."
                          className="w-full bg-[#161A24]/90 border border-white/10 focus:border-amber-400/60 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none transition-all"
                        />
                      </div>
                    )}
                  </div>

                  {/* VISUALIZAÇÃO 1: TABELA DE HERÓIS ESCOLHIDOS / BANIDOS / DISPUTADOS */}
                  {heroFilterTab !== 'uncontested' && (
                    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0E1118]/80 backdrop-blur-xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-[#161A24]/90 text-gray-400 font-mono text-[10px] uppercase border-b border-white/10">
                          <tr>
                            <th className="p-3.5 pl-5 w-16 text-center">#</th>
                            <th className="p-3.5">Herói</th>
                            <th className="p-3.5 text-center font-bold">Picks</th>
                            <th className="p-3.5 text-center font-bold">Bans</th>
                            <th className="p-3.5 text-center">V - D</th>
                            <th className="p-3.5 text-right font-bold">Win Rate %</th>
                            <th className="p-3.5 pr-5 text-right font-bold">Taxa Disputa</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-medium">
                          {displayedHeroes.length === 0 ? (
                            <tr>
                              <td colSpan="7" className="p-8 text-center text-gray-400 text-xs">
                                Nenhum herói encontrado com os filtros atuais.
                              </td>
                            </tr>
                          ) : (
                            displayedHeroes.map((h, idx) => {
                              const heroName = getHeroName(constants, h.hero_id);
                              const heroImg = getHeroImg(constants, h.hero_id);
                              const wr = Math.round(h.winRate);

                              return (
                                <tr key={h.hero_id} className="hover:bg-white/[0.03] transition-colors">
                                  <td className="p-3.5 pl-5 text-center font-mono font-bold text-gray-400">
                                    #{idx + 1}
                                  </td>

                                  <td className="p-3.5">
                                    <div className="flex items-center gap-3">
                                      <img
                                        src={heroImg}
                                        alt={heroName}
                                        className="w-10 h-6 object-cover rounded border border-white/10 cursor-pointer hover:border-amber-400 transition-colors"
                                        onClick={() => onSelectHero && onSelectHero({ id: h.hero_id, name: heroName })}
                                        title="Ver Detalhes do Herói"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                      />
                                      <span
                                        className="text-white font-bold cursor-pointer hover:text-amber-400 transition-colors"
                                        onClick={() => onSelectHero && onSelectHero({ id: h.hero_id, name: heroName })}
                                      >
                                        {heroName}
                                      </span>
                                    </div>
                                  </td>

                                  <td className="p-3.5 text-center font-mono font-bold text-emerald-400">
                                    {h.picks}
                                    <span className="text-[10px] text-gray-500 font-normal ml-1">
                                      ({Math.round(h.pickRate)}%)
                                    </span>
                                  </td>

                                  <td className="p-3.5 text-center font-mono font-bold text-rose-400">
                                    {h.bans}
                                    <span className="text-[10px] text-gray-500 font-normal ml-1">
                                      ({Math.round(h.banRate)}%)
                                    </span>
                                  </td>

                                  <td className="p-3.5 text-center font-mono text-gray-300">
                                    <span className="text-emerald-400 font-bold">{h.wins}</span>
                                    <span className="text-gray-500 mx-1">-</span>
                                    <span className="text-rose-400 font-bold">{h.losses}</span>
                                  </td>

                                  <td className="p-3.5 text-right font-mono font-black">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[11px] ${
                                        wr >= 60
                                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                          : wr >= 48
                                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                      }`}
                                    >
                                      {h.picks > 0 ? `${wr}%` : '—'}
                                    </span>
                                  </td>

                                  <td className="p-3.5 pr-5 text-right font-mono font-bold text-amber-400">
                                    {Math.round(h.contestRate)}%
                                    <span className="text-[10px] text-gray-500 font-normal ml-1">
                                      ({h.picks + h.bans})
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* VISUALIZAÇÃO 2: HERÓIS NÃO ESCOLHIDOS NEM BANIDOS (GRID LIQUIPEDIA) */}
                  {heroFilterTab === 'uncontested' && (
                    <div className="space-y-4">
                      <div className="bg-[#161A24]/60 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
                        <Ban className="w-5 h-5 text-purple-400 shrink-0" />
                        <div className="text-xs text-gray-300">
                          <strong className="text-white">Nem Escolhidos e Nem Banidos:</strong> Estes heróis não foram disputados em nenhuma partida oficial deste torneio (0 picks e 0 bans).
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                        {uncontestedHeroes.map((h) => {
                          const heroName = h.localized_name || h.name;
                          const heroImg = getHeroImg(constants, h.id);

                          return (
                            <div
                              key={h.id}
                              onClick={() => onSelectHero && onSelectHero({ id: h.id, name: heroName })}
                              className="group bg-[#161A24]/80 hover:bg-[#1E2333] border border-white/10 hover:border-purple-500/50 rounded-xl p-2.5 text-center cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-sm"
                            >
                              <div className="relative mx-auto w-14 h-9 rounded-lg overflow-hidden border border-white/10 group-hover:border-purple-400 transition-colors">
                                <img
                                  src={heroImg}
                                  alt={heroName}
                                  className="w-full h-full object-cover filter grayscale contrast-125 opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                                <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent transition-colors"></div>
                              </div>
                              <span className="text-[11px] font-bold text-gray-400 group-hover:text-white transition-colors block mt-2 truncate">
                                {heroName}
                              </span>
                              <span className="text-[9px] font-mono text-purple-400/80 block mt-0.5">
                                0 P / 0 B
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* LISTAGEM DE TORNEIOS COM SEPARAÇÃO: EM ANDAMENTO VS FINALIZADOS */
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-amber-400">
                <Trophy className="w-4 h-4 text-amber-400" /> Torneios Oficiais do Dota 2
              </div>
              <h1 className="text-2xl font-black text-white tracking-wide mt-1">
                Ligas e Campeonatos Oficiais
              </h1>
              <p className="text-xs text-gray-400 mt-1">
                Acompanhe torneios em andamento ou explore o acervo completo de torneios já finalizados com histórico mantido.
              </p>
            </div>

            {/* SELETOR DE STATUS: EM ANDAMENTO VS FINALIZADOS */}
            <div className="flex items-center gap-2 bg-[#161A24]/90 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setStatusFilter('ongoing')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  statusFilter === 'ongoing'
                    ? 'bg-emerald-500 text-black shadow font-extrabold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Em Andamento ({ongoingTournaments.length})
              </button>

              <button
                onClick={() => setStatusFilter('finalized')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  statusFilter === 'finalized'
                    ? 'bg-amber-500 text-black shadow font-extrabold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                Finalizados ({finalizedTournaments.length})
              </button>
            </div>
          </div>

          {loading ? (
            <SkeletonGrid count={6} />
          ) : filteredTournaments.length === 0 ? (
            <div className="text-center py-20 text-xs text-gray-400 bg-[#161A24]/40 rounded-2xl border border-white/5 p-8">
              Nenhum torneio {statusFilter === 'ongoing' ? 'em andamento' : 'finalizado'} encontrado {searchQuery ? `para "${searchQuery}"` : ""}.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTournaments.map((t) => {
                const isOngoing = t.status === 'em_andamento';

                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      setSelectedTournament(t);
                      setActiveSubTab('series');
                    }}
                    className="group bg-[#161A24]/70 hover:bg-[#1C2230]/90 border border-white/10 hover:border-amber-500/60 rounded-2xl p-5 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-1 flex flex-col justify-between gap-4 backdrop-blur-xl"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2 text-[10px]">
                        {isOngoing ? (
                          <span className="font-extrabold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Em Andamento
                          </span>
                        ) : (
                          <span className="font-extrabold text-cyan-400 uppercase tracking-widest bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Finalizado
                          </span>
                        )}
                        <span className="font-mono text-gray-400">{t.recentDate}</span>
                      </div>

                      <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2 mt-1">
                        {t.name}
                      </h3>

                      {t.champion && (
                        <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold mt-2">
                          <Crown className="w-3.5 h-3.5 text-amber-400" />
                          <span>Campeão: {t.champion}</span>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-white/10 pt-3 flex items-center justify-between text-xs">
                      <span className="text-gray-400">Séries Disputadas:</span>
                      <strong className="text-cyan-400 font-mono font-black">
                        {t.seriesList?.length || 0}
                      </strong>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}