import React, { useState, useEffect } from 'react';
import { X, Trophy, Clock, Swords, Shield, ExternalLink, Loader2, Award, Zap, Package, Sparkles, AlertTriangle } from 'lucide-react';
import AdvantageGraph from './AdvantageGraph';
import { getHeroImg, getHeroName, getItemImg, fetchMatchDetails } from '../services/api';
import TeamLogo from '../utils/teamLogos';

export default function MatchDetailModal({
  series,
  constants,
  onClose,
  onOpenTeamProfile,
  onSelectHero
}) {
  const [activeMapIndex, setActiveMapIndex] = useState(0);
  const [loadedMatchData, setLoadedMatchData] = useState(null);
  const [loading, setLoading] = useState(false);

  const games = series?.games || [];
  const currentMap = games[activeMapIndex] || games[0];

  useEffect(() => {
    if (currentMap?.match_id) {
      setLoading(true);
      setLoadedMatchData(null);
      fetchMatchDetails(currentMap.match_id).then((data) => {
        setLoadedMatchData(data);
        setLoading(false);
      });
    }
  }, [currentMap?.match_id]);

  if (!series) return null;

  const aWonSeries = series.scoreA > series.scoreB;
  const bWonSeries = series.scoreB > series.scoreA;

  const renderPlayerTable = (players, teamName, isRadiant, teamScore, win) => {
    return (
      <div className="space-y-2 mt-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-2 px-1">
          <div className="flex items-center gap-2">
            <TeamLogo teamName={teamName} className="w-5 h-5 rounded shrink-0" />
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isRadiant ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-rose-500 shadow-sm shadow-rose-500/50'
              }`}
            />
            <h3 className={`text-sm font-black uppercase tracking-wider ${isRadiant ? 'text-emerald-400' : 'text-rose-400'}`}>
              {teamName} {win ? '(Vencedor)' : ''}
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-gray-400">Total de Abates:</span>
            <strong className="text-white text-sm font-black">{teamScore}</strong>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0E1118]/70">
          <table className="w-full text-left text-xs border-collapse min-w-[840px]">
            <thead className="bg-[#161A24]/90 text-gray-400 font-mono text-[10px] uppercase border-b border-white/10">
              <tr>
                <th className="p-3 pl-4">Jogador / Herói</th>
                <th className="p-3 text-center">Nível</th>
                <th className="p-3 text-center">K / D / A</th>
                <th className="p-3 text-right">Patrimônio (NW)</th>
                <th className="p-3 text-right">CS (LH / DN)</th>
                <th className="p-3 text-right">Dano a Heróis</th>
                <th className="p-3 text-right">Dano Torres</th>
                <th className="p-3 text-right">GPM / XPM</th>
                <th className="p-3 pr-4">Inventário Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {players.map((p, idx) => {
                const heroImg = getHeroImg(constants, p.hero_id);
                const heroName = getHeroName(constants, p.hero_id);
                const playerName = p.name || p.personaname || `Jogador ${idx + 1}`;
                const neutralImg = p.item_neutral ? getItemImg(constants, p.item_neutral) : null;

                const mainItems = [p.item_0, p.item_1, p.item_2, p.item_3, p.item_4, p.item_5];
                const backpackItems = [p.backpack_0, p.backpack_1, p.backpack_2];

                return (
                  <tr key={idx} className="hover:bg-white/[0.03] transition-colors">
                    {/* Jogador e Herói */}
                    <td className="p-3 pl-4">
                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectHero && constants?.heroes?.[p.hero_id]) {
                            onSelectHero(constants.heroes[p.hero_id]);
                          }
                        }}
                        className="flex items-center gap-2.5 text-left group hover:opacity-85 transition-opacity"
                        title={constants?.heroes?.[p.hero_id] ? "Ver enciclopédia do herói" : undefined}
                      >
                        <img
                          src={heroImg}
                          alt={heroName}
                          className="w-10 h-6 object-cover rounded border border-white/10 shrink-0 group-hover:border-amber-400/60 transition-colors"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <div className="min-w-0">
                          <div className="text-white font-bold truncate max-w-[130px]">{playerName}</div>
                          <div className="text-[10px] text-gray-400 truncate group-hover:text-amber-400 transition-colors">{heroName}</div>
                        </div>
                      </button>
                    </td>

                    {/* Nível */}
                    <td className="p-3 text-center font-mono font-bold text-gray-300">
                      <span className="px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-[10px]">
                        {p.level || "—"}
                      </span>
                    </td>

                    {/* KDA */}
                    <td className="p-3 text-center font-mono whitespace-nowrap">
                      <div className="inline-flex items-center justify-center gap-1 font-mono text-xs">
                        <span className="font-bold text-white min-w-[18px] text-right">{p.kills}</span>
                        <span className="text-gray-500 font-normal">/</span>
                        <span className="font-bold text-rose-400 min-w-[18px] text-center">{p.deaths}</span>
                        <span className="text-gray-500 font-normal">/</span>
                        <span className="font-bold text-cyan-400 min-w-[18px] text-left">{p.assists}</span>
                      </div>
                    </td>

                    {/* Net Worth */}
                    <td className="p-3 text-right font-mono font-bold text-amber-400">
                      {p.net_worth ? p.net_worth.toLocaleString() : (p.gold_per_min && loadedMatchData.duration ? Math.round((p.gold_per_min * loadedMatchData.duration) / 60).toLocaleString() : "—")}
                    </td>

                    {/* Last Hits / Denies */}
                    <td className="p-3 text-right font-mono text-gray-300">
                      {p.last_hits ?? 0} <span className="text-gray-500">/</span> {p.denies ?? 0}
                    </td>

                    {/* Dano a Heróis */}
                    <td className="p-3 text-right font-mono font-bold text-rose-300">
                      {p.hero_damage ? p.hero_damage.toLocaleString() : "—"}
                    </td>

                    {/* Dano a Torres */}
                    <td className="p-3 text-right font-mono font-bold text-amber-200">
                      {p.tower_damage ? p.tower_damage.toLocaleString() : "—"}
                    </td>

                    {/* GPM / XPM */}
                    <td className="p-3 text-right font-mono text-[11px]">
                      <span className="text-amber-400 font-bold">{p.gold_per_min}</span>
                      <span className="text-gray-500"> / </span>
                      <span className="text-cyan-400 font-bold">{p.xp_per_min}</span>
                    </td>

                    {/* Inventário Final */}
                    <td className="p-3 pr-4">
                      <div className="flex items-center gap-1.5">
                        {/* 6 Slots Principais */}
                        <div className="grid grid-cols-6 gap-1 bg-black/60 p-1 rounded-lg border border-white/10">
                          {mainItems.map((itId, itIdx) => {
                            const itImg = itId ? getItemImg(constants, itId) : null;
                            return (
                              <div
                                key={itIdx}
                                className="w-6 h-5 rounded bg-white/5 border border-white/5 flex items-center justify-center overflow-hidden"
                              >
                                {itImg ? (
                                  <img src={itImg} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Item Neutro */}
                        <div
                          title="Item Neutro"
                          className="w-6 h-5 rounded bg-amber-500/10 border border-amber-400/40 flex items-center justify-center overflow-hidden"
                        >
                          {neutralImg ? (
                            <img src={neutralImg} alt="Neutro" className="w-full h-full object-cover" />
                          ) : (
                            <Sparkles className="w-3 h-3 text-amber-400/30" />
                          )}
                        </div>

                        {/* Mochila (Backpack) */}
                        <div
                          title="Mochila (Backpack)"
                          className="hidden sm:flex gap-0.5 bg-black/40 p-1 rounded border border-white/5 opacity-80"
                        >
                          {backpackItems.map((itId, itIdx) => {
                            const itImg = itId ? getItemImg(constants, itId) : null;
                            return (
                              <div
                                key={itIdx}
                                className="w-4 h-3.5 rounded bg-white/5 flex items-center justify-center overflow-hidden"
                              >
                                {itImg && <img src={itImg} alt="" className="w-full h-full object-cover" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#0C0F16] border border-white/15 rounded-2xl p-4 sm:p-7 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* BOTÃO FECHAR */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-all z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* CABEÇALHO DA SÉRIE */}
        <div className="text-center border-b border-white/10 pb-4 mb-4 relative z-10 shrink-0">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
              {series.stage || "Torneio Profissional"}
            </span>
            {(series.dateStr || (currentMap?.start_time ? new Date(currentMap.start_time * 1000).toLocaleDateString('pt-BR') : null)) && (
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold">
                {series.dateStr || new Date(currentMap.start_time * 1000).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>

          <div className="flex items-center justify-center gap-4 sm:gap-8 mt-3">
            <div
              onClick={() => onOpenTeamProfile && onOpenTeamProfile(series.preferredIdA, series.timeA)}
              className="text-right flex-1 truncate cursor-pointer group flex items-center justify-end gap-2.5 sm:gap-3"
              title={`Ver Perfil de ${series.timeA}`}
            >
              <span className={`text-base sm:text-xl font-black truncate block group-hover:text-amber-400 transition-colors ${aWonSeries ? 'text-white' : 'text-gray-400'}`}>
                {series.timeA}
              </span>
              <TeamLogo
                teamName={series.timeA}
                teamId={series.preferredIdA}
                className="w-7 h-7 sm:w-8 h-8 rounded-lg bg-black/40 border border-white/10 p-0.5 shrink-0"
              />
            </div>

            <div className="px-4 py-1.5 rounded-xl bg-white/5 border border-white/10 font-mono text-lg sm:text-2xl font-black text-amber-400 shrink-0">
              {series.scoreA} <span className="text-gray-500 mx-1">:</span> {series.scoreB}
            </div>

            <div
              onClick={() => onOpenTeamProfile && onOpenTeamProfile(series.preferredIdB, series.timeB)}
              className="text-left flex-1 truncate cursor-pointer group flex items-center justify-start gap-2.5 sm:gap-3"
              title={`Ver Perfil de ${series.timeB}`}
            >
              <TeamLogo
                teamName={series.timeB}
                teamId={series.preferredIdB}
                className="w-7 h-7 sm:w-8 h-8 rounded-lg bg-black/40 border border-white/10 p-0.5 shrink-0"
              />
              <span className={`text-base sm:text-xl font-black truncate block group-hover:text-amber-400 transition-colors ${bWonSeries ? 'text-white' : 'text-gray-400'}`}>
                {series.timeB}
              </span>
            </div>
          </div>
        </div>

        {/* ABAS DOS MAPAS DA SÉRIE */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-4 shrink-0 overflow-x-auto">
          {games.map((g, idx) => (
            <button
              key={idx}
              onClick={() => setActiveMapIndex(idx)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all ${
                activeMapIndex === idx
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
              }`}
            >
              <Swords className="w-3.5 h-3.5" />
              Jogo {g.mapNumber || idx + 1}
            </button>
          ))}
        </div>

        {/* CONTEÚDO PRINCIPAL COM SCROLL */}
        <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar space-y-5">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              <span className="text-xs font-semibold">Carregando replay detalhado e ordem de draft...</span>
            </div>
          ) : loadedMatchData ? (
            <>
              {/* STATUS DO MAPA ATUAL */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#161A24]/60 p-3.5 rounded-xl border border-white/10 text-xs">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span className="text-gray-300">Vencedor do Jogo {activeMapIndex + 1}:</span>
                  <strong className={loadedMatchData.radiant_win ? 'text-emerald-400' : 'text-rose-400'}>
                    {loadedMatchData.radiant_win
                      ? (loadedMatchData.radiant_name || "Radiant")
                      : (loadedMatchData.dire_name || "Dire")}
                  </strong>
                </div>

                <div className="flex items-center gap-4 text-gray-400 font-mono text-[11px]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    Duração: <strong className="text-white">{Math.round((loadedMatchData.duration || 0) / 60)} min</strong>
                  </span>
                  <span>
                    Match ID: <strong className="text-gray-300">{loadedMatchData.match_id}</strong>
                  </span>
                </div>
              </div>

              {/* GRÁFICO INTERATIVO DE OURO E XP */}
              <AdvantageGraph
                goldAdv={loadedMatchData.radiant_gold_adv || []}
                xpAdv={loadedMatchData.radiant_xp_adv || []}
                radiantName={loadedMatchData.radiant_name || "Radiant"}
                direName={loadedMatchData.dire_name || "Dire"}
              />

              {/* ORDEM COMPLETA DE DRAFT (PICKS & BANS) */}
              {loadedMatchData.picks_bans && loadedMatchData.picks_bans.length > 0 && (
                <div className="bg-[#141824]/80 border border-white/10 rounded-xl p-4 space-y-3">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center justify-between">
                    <span>Fase de Draft (Picks &amp; Bans na Ordem)</span>
                    <span className="text-[10px] text-gray-400 font-normal">Picks destacados com borda sólida</span>
                  </div>

                  {/* Radiant Picks & Bans */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-emerald-400 uppercase">
                      {loadedMatchData.radiant_name || "Radiant"}:
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {loadedMatchData.picks_bans
                        .filter((p) => p.team === 0)
                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                        .map((p, i) => {
                          const hImg = getHeroImg(constants, p.hero_id);
                          const hName = getHeroName(constants, p.hero_id);
                          return (
                            <div
                              key={i}
                              title={`${p.is_pick ? 'Pick' : 'Ban'} #${(p.order || 0) + 1}: ${hName}`}
                              className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] ${
                                p.is_pick
                                  ? 'bg-emerald-500/20 border border-emerald-400/80 text-white font-bold'
                                  : 'bg-black/40 border border-dashed border-white/20 text-gray-500 opacity-60'
                              }`}
                            >
                              <img src={hImg} alt="" className="w-5 h-3.5 object-cover rounded" />
                              <span>{hName}</span>
                              <span className="text-[8px] opacity-60">({p.is_pick ? 'P' : 'B'})</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Dire Picks & Bans */}
                  <div className="space-y-1 pt-1 border-t border-white/5">
                    <div className="text-[10px] font-bold text-rose-400 uppercase">
                      {loadedMatchData.dire_name || "Dire"}:
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {loadedMatchData.picks_bans
                        .filter((p) => p.team === 1)
                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                        .map((p, i) => {
                          const hImg = getHeroImg(constants, p.hero_id);
                          const hName = getHeroName(constants, p.hero_id);
                          return (
                            <div
                              key={i}
                              title={`${p.is_pick ? 'Pick' : 'Ban'} #${(p.order || 0) + 1}: ${hName}`}
                              className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] ${
                                p.is_pick
                                  ? 'bg-rose-500/20 border border-rose-400/80 text-white font-bold'
                                  : 'bg-black/40 border border-dashed border-white/20 text-gray-500 opacity-60'
                              }`}
                            >
                              <img src={hImg} alt="" className="w-5 h-3.5 object-cover rounded" />
                              <span>{hName}</span>
                              <span className="text-[8px] opacity-60">({p.is_pick ? 'P' : 'B'})</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}

              {/* TABELA RADIANT */}
              {renderPlayerTable(
                (loadedMatchData.players || []).filter((p) => p.player_slot < 128),
                loadedMatchData.radiant_name || "Radiant",
                true,
                loadedMatchData.radiant_score ?? 0,
                loadedMatchData.radiant_win
              )}

              {/* TABELA DIRE */}
              {renderPlayerTable(
                (loadedMatchData.players || []).filter((p) => p.player_slot >= 128),
                loadedMatchData.dire_name || "Dire",
                false,
                loadedMatchData.dire_score ?? 0,
                !loadedMatchData.radiant_win
              )}
            </>
          ) : (
            <div className="space-y-4 py-2">
              {/* ALERTA DE INSTABILIDADE DA OPENDOTA */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
                <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-bold text-amber-300 uppercase tracking-wide">
                    Servidores da OpenDota Temporariamente Indisponíveis
                  </h4>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    A API pública da OpenDota (responsável pelo processamento e leitura aprofundada dos replays da Valve) está temporariamente inacessível ou passando por instabilidade. As tabelas detalhadas dos 10 jogadores, inventários de itens e gráficos de ouro/XP serão reativados assim que a OpenDota normalizar seus servidores.
                  </p>
                </div>
              </div>

              {/* CARD DE DADOS CONSOLIDADOS DO MAPA E SÉRIE */}
              <div className="bg-[#141824]/80 border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Dados Consolidados da Série
                  </span>
                  <span className="text-[11px] font-mono text-gray-400">
                    {series.stage || "Torneio Profissional"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-gray-400 uppercase font-mono block mb-1">Confronto</span>
                    <div className="flex items-center justify-center gap-2">
                      <TeamLogo teamName={series.timeA} teamId={series.preferredIdA} className="w-5 h-5 shrink-0" />
                      <span className="text-xs sm:text-sm font-black text-white">{series.timeA}</span>
                      <span className="text-amber-400 text-xs font-bold">vs</span>
                      <span className="text-xs sm:text-sm font-black text-white">{series.timeB}</span>
                      <TeamLogo teamName={series.timeB} teamId={series.preferredIdB} className="w-5 h-5 shrink-0" />
                    </div>
                  </div>

                  <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
                    <span className="text-[10px] text-gray-400 uppercase font-mono block">Placar da Série</span>
                    <span className="text-lg font-black font-mono text-amber-400 mt-0.5 block">
                      {series.scoreA} : {series.scoreB}
                    </span>
                  </div>

                  <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
                    <span className="text-[10px] text-gray-400 uppercase font-mono block">Vencedor da Série</span>
                    <span className="text-sm font-black text-emerald-400 mt-1 block">
                      {series.winner || (series.scoreA > series.scoreB ? series.timeA : series.timeB)}
                    </span>
                  </div>
                </div>

                {/* DETALHES DO MAPA SELECIONADO */}
                <div className="bg-black/30 border border-white/5 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Swords className="w-4 h-4 text-amber-400" />
                    <span className="text-white font-bold">
                      Jogo {currentMap?.mapNumber || activeMapIndex + 1}
                    </span>
                    {currentMap?.radiant_score != null && currentMap?.dire_score != null && (
                      <span className="font-mono text-gray-300 ml-2 bg-white/5 px-2 py-0.5 rounded">
                        Abates: <strong className="text-white">{currentMap.radiant_score}</strong> : <strong className="text-white">{currentMap.dire_score}</strong>
                      </span>
                    )}
                  </div>

                  {currentMap?.duration ? (
                    <div className="flex items-center gap-1.5 text-gray-400 font-mono text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      Duração: <strong className="text-white">{Math.round(currentMap.duration / 60)} min</strong>
                    </div>
                  ) : null}

                  {currentMap?.match_id && (
                    <div className="font-mono text-[11px] text-gray-400">
                      Match ID: <strong className="text-amber-400">{currentMap.match_id}</strong>
                    </div>
                  )}
                </div>

                {/* BOTÕES DE LINKS EXTERNOS PARA CONSULTA ALTERNATIVA */}
                {currentMap?.match_id && (
                  <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-center gap-3">
                    <a
                      href={`https://www.dotabuff.com/matches/${currentMap.match_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Ver Partida no Dotabuff
                    </a>
                    <a
                      href={`https://stratz.com/matches/${currentMap.match_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Ver Partida no Stratz
                    </a>
                    <a
                      href={`https://www.opendota.com/matches/${currentMap.match_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Abrir no OpenDota
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
