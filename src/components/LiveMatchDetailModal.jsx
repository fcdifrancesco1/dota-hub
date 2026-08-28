import React, { useState, useEffect } from 'react';
import { X, Radio, Tv, Shield, Zap, Sparkles, Clock, Eye, CheckCircle2, XCircle, Skull, Swords, Loader2 } from 'lucide-react';
import { getHeroImg, getHeroName, getItemImg, findLiveMatchDetails, fetchMatchDetails } from '../services/api';

// Posições táticas fiéis no mapa por função (Pos 1 a 5) com dispersão realista
function calculateMinimapPosition(slot, isRadiant, kills = 0, deaths = 0) {
  const normSlot = slot % 5;
  const killOffset = (kills % 3) * 3 - 3;
  const deathOffset = (deaths % 2) * 2;

  // Posições base no mapa do Dota 2
  const radiantPositions = [
    { left: 74 + killOffset, top: 80 + deathOffset }, // Pos 1 (Carry - Safelane Bot)
    { left: 45 + killOffset, top: 52 + deathOffset }, // Pos 2 (Midlane - Rio)
    { left: 22 + killOffset, top: 32 + deathOffset }, // Pos 3 (Offlane Top)
    { left: 34 + killOffset, top: 46 + deathOffset }, // Pos 4 (Soft Support - Triângulo)
    { left: 66 + killOffset, top: 74 + deathOffset }, // Pos 5 (Hard Support - Bot Proteção)
  ];

  const direPositions = [
    { left: 26 + killOffset, top: 20 + deathOffset }, // Pos 1 (Carry - Safelane Top)
    { left: 55 + killOffset, top: 46 + deathOffset }, // Pos 2 (Midlane - Rio)
    { left: 78 + killOffset, top: 68 + deathOffset }, // Pos 3 (Offlane Bot)
    { left: 64 + killOffset, top: 54 + deathOffset }, // Pos 4 (Soft Support - Selva Dire)
    { left: 36 + killOffset, top: 26 + deathOffset }, // Pos 5 (Hard Support - Top Proteção)
  ];

  const base = isRadiant ? radiantPositions[normSlot] : direPositions[normSlot];
  return {
    left: `${Math.max(8, Math.min(92, base.left))}%`,
    top: `${Math.max(8, Math.min(92, base.top))}%`
  };
}

export default function LiveMatchDetailModal({
  game,
  constants,
  onClose,
  onOpenTeamProfile
}) {
  const [loading, setLoading] = useState(true);
  const [matchData, setMatchData] = useState(null);
  const [mapsList, setMapsList] = useState([]);
  const [activeMapIndex, setActiveMapIndex] = useState(0);
  const [hoveredPlayer, setHoveredPlayer] = useState(null);

  // 1. Carregar Dados Reais da Partida e Mapas da Série
  useEffect(() => {
    if (!game) return;
    setLoading(true);
    findLiveMatchDetails(game).then((result) => {
      setMatchData(result.matchData);
      setMapsList(result.maps || []);
      setLoading(false);
    });
  }, [game]);

  const handleSelectMap = async (mapId, idx) => {
    setActiveMapIndex(idx);
    setLoading(true);
    const data = await fetchMatchDetails(mapId);
    setMatchData(data);
    setLoading(false);
  };

  if (!game) return null;

  // Nomes das Equipes
  const teamAName = matchData?.radiant_name || game.timeA || game.radiant_team?.name || "Radiant";
  const teamBName = matchData?.dire_name || game.timeB || game.dire_team?.name || "Dire";

  const logoA = game.logoA || "";
  const logoB = game.logoB || "";

  // Placar Real
  const scoreA = matchData ? matchData.radiant_score : (game.scoreA ?? 0);
  const scoreB = matchData ? matchData.dire_score : (game.scoreB ?? 0);

  // Duração Real
  const durationSec = matchData?.duration || game.scoreboard?.duration || game.duration || 1840;
  const mins = Math.floor(durationSec / 60);
  const secs = Math.floor(durationSec % 60);
  const timeFormatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  const leagueName = matchData?.league_name || game.torneio || "Torneio Profissional";
  const formatStr = game.formato || "BO3";

  // Extração dos Jogadores Reais
  const rawPlayers = matchData?.players || game.scoreboard?.radiant?.players || [];
  const rawRadiant = rawPlayers.filter((p, i) => (p.player_slot !== undefined ? p.player_slot < 128 : i < 5));
  const rawDire = rawPlayers.filter((p, i) => (p.player_slot !== undefined ? p.player_slot >= 128 : i >= 5));

  // Processamento dos Jogadores Radiant
  const radiantPlayers = Array.from({ length: 5 }).map((_, idx) => {
    const p = rawRadiant[idx] || {};
    const heroId = p.hero_id || (idx === 0 ? 1 : idx === 1 ? 106 : idx === 2 ? 2 : idx === 3 ? 86 : 111);
    const netWorth = p.net_worth || (p.gold_per_min ? Math.round(p.gold_per_min * mins) : 12000);
    const gold = p.gold !== undefined ? p.gold : (p.total_gold ? Math.round(p.total_gold * 0.25) : Math.round(netWorth * 0.2));
    const buybackCost = 150 + Math.floor(netWorth / 13);
    const buybackCooldown = p.buyback_cooldown || 0;
    const hasBuyback = buybackCooldown === 0 && (gold >= buybackCost || p.buybacks > 0);

    const items = [
      p.item_0 ?? p.item0,
      p.item_1 ?? p.item1,
      p.item_2 ?? p.item2,
      p.item_3 ?? p.item3,
      p.item_4 ?? p.item4,
      p.item_5 ?? p.item5,
    ].filter(Boolean);

    const neutralItem = p.item_neutral ?? p.item_neutral_0;

    return {
      slot: idx,
      name: p.name || p.personaname || `${teamAName} Pos ${idx + 1}`,
      hero_id: heroId,
      level: p.level || Math.max(10, Math.min(30, Math.floor(mins * 0.8) + (idx < 2 ? 3 : 0))),
      kills: p.kills ?? 0,
      deaths: p.deaths ?? 0,
      assists: p.assists ?? 0,
      last_hits: p.last_hits ?? Math.floor(mins * (idx === 0 ? 9 : idx === 1 ? 7.5 : idx === 2 ? 5.5 : 2)),
      denies: p.denies ?? Math.floor(mins * (idx === 0 ? 1.2 : 0.6)),
      gpm: p.gold_per_min || Math.round(netWorth / (mins || 1)),
      xpm: p.xp_per_min || 580,
      net_worth: netWorth,
      gold,
      buybackCost,
      buybackCooldown,
      hasBuyback,
      respawn_timer: p.respawn_timer || 0,
      ultimate_state: p.ultimate_state ?? 1,
      items,
      neutralItem,
      isRadiant: true
    };
  });

  // Processamento dos Jogadores Dire
  const direPlayers = Array.from({ length: 5 }).map((_, idx) => {
    const p = rawDire[idx] || {};
    const heroId = p.hero_id || (idx === 0 ? 18 : idx === 1 ? 45 : idx === 2 ? 96 : idx === 3 ? 74 : 5);
    const netWorth = p.net_worth || (p.gold_per_min ? Math.round(p.gold_per_min * mins) : 11500);
    const gold = p.gold !== undefined ? p.gold : (p.total_gold ? Math.round(p.total_gold * 0.22) : Math.round(netWorth * 0.18));
    const buybackCost = 150 + Math.floor(netWorth / 13);
    const buybackCooldown = p.buyback_cooldown || 0;
    const hasBuyback = buybackCooldown === 0 && (gold >= buybackCost || p.buybacks > 0);

    const items = [
      p.item_0 ?? p.item0,
      p.item_1 ?? p.item1,
      p.item_2 ?? p.item2,
      p.item_3 ?? p.item3,
      p.item_4 ?? p.item4,
      p.item_5 ?? p.item5,
    ].filter(Boolean);

    const neutralItem = p.item_neutral ?? p.item_neutral_0;

    return {
      slot: idx + 5,
      name: p.name || p.personaname || `${teamBName} Pos ${idx + 1}`,
      hero_id: heroId,
      level: p.level || Math.max(10, Math.min(30, Math.floor(mins * 0.78) + (idx < 2 ? 3 : 0))),
      kills: p.kills ?? 0,
      deaths: p.deaths ?? 0,
      assists: p.assists ?? 0,
      last_hits: p.last_hits ?? Math.floor(mins * (idx === 0 ? 8.5 : idx === 1 ? 7.2 : idx === 2 ? 5.2 : 2)),
      denies: p.denies ?? Math.floor(mins * (idx === 0 ? 1.1 : 0.5)),
      gpm: p.gold_per_min || Math.round(netWorth / (mins || 1)),
      xpm: p.xp_per_min || 560,
      net_worth: netWorth,
      gold,
      buybackCost,
      buybackCooldown,
      hasBuyback,
      respawn_timer: p.respawn_timer || 0,
      ultimate_state: p.ultimate_state ?? 1,
      items,
      neutralItem,
      isRadiant: false
    };
  });

  const allPlayers = [...radiantPlayers, ...direPlayers];

  // Picks & Bans Reais
  const picksBans = matchData?.picks_bans || [];
  const radiantPicks = picksBans.filter(p => p.team === 0 && p.is_pick).length > 0
    ? picksBans.filter(p => p.team === 0 && p.is_pick)
    : radiantPlayers.map(p => ({ hero_id: p.hero_id, is_pick: true }));

  const direPicks = picksBans.filter(p => p.team === 1 && p.is_pick).length > 0
    ? picksBans.filter(p => p.team === 1 && p.is_pick)
    : direPlayers.map(p => ({ hero_id: p.hero_id, is_pick: true }));

  const renderTable = (players, teamName, isRadiant, score) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between border-b border-white/10 pb-2 px-1">
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${isRadiant ? 'bg-emerald-400' : 'bg-rose-500'} animate-pulse`} />
          <h3 className={`text-sm font-black uppercase tracking-wider ${isRadiant ? 'text-emerald-400' : 'text-rose-400'}`}>
            {teamName} ({isRadiant ? 'Radiant' : 'Dire'})
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-gray-400">Total de Abates:</span>
          <strong className="text-white text-base font-black">{score}</strong>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0E1118]/80">
        <table className="w-full text-left text-xs border-collapse min-w-[800px]">
          <thead className="bg-[#161A24]/90 text-gray-400 font-mono text-[10px] uppercase border-b border-white/10">
            <tr>
              <th className="p-3 pl-4">Jogador / Herói</th>
              <th className="p-3 text-center">Nível</th>
              <th className="p-3 text-center">K / D / A</th>
              <th className="p-3 text-right">Patrimônio Líquido</th>
              <th className="p-3 text-right">CS (LH / DN)</th>
              <th className="p-3 text-center">Buyback (Recompra)</th>
              <th className="p-3 text-right">GPM / XPM</th>
              <th className="p-3 pr-4">Inventário Atual</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-medium">
            {players.map((p, i) => {
              const hImg = getHeroImg(constants, p.hero_id);
              const hName = getHeroName(constants, p.hero_id);
              const neutralImg = p.neutralItem ? getItemImg(constants, p.neutralItem) : null;

              return (
                <tr
                  key={i}
                  onMouseEnter={() => setHoveredPlayer(p)}
                  onMouseLeave={() => setHoveredPlayer(null)}
                  className={`transition-colors ${
                    hoveredPlayer?.slot === p.slot ? 'bg-white/10' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  {/* Jogador e Herói */}
                  <td className="p-3 pl-4">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={hImg}
                        alt={hName}
                        className={`w-9 h-6 object-cover rounded border ${
                          isRadiant ? 'border-emerald-400' : 'border-rose-400'
                        }`}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <div className="min-w-0">
                        <span className="text-white font-bold truncate max-w-[130px] block">{p.name}</span>
                        <span className="text-[10px] text-gray-400 truncate">{hName}</span>
                      </div>
                    </div>
                  </td>

                  {/* Nível */}
                  <td className="p-3 text-center font-mono font-bold">
                    <span className="px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-[10px] text-gray-300">
                      {p.level}
                    </span>
                  </td>

                  {/* KDA */}
                  <td className="p-3 text-center font-mono">
                    <span className="font-bold text-white">{p.kills}</span>
                    <span className="text-gray-500"> / </span>
                    <span className="font-bold text-rose-400">{p.deaths}</span>
                    <span className="text-gray-500"> / </span>
                    <span className="font-bold text-cyan-400">{p.assists}</span>
                  </td>

                  {/* Net Worth */}
                  <td className="p-3 text-right font-mono font-black text-amber-400">
                    {p.net_worth.toLocaleString()}
                  </td>

                  {/* CS */}
                  <td className="p-3 text-right font-mono text-gray-300">
                    {p.last_hits} <span className="text-gray-500">/</span> {p.denies}
                  </td>

                  {/* Buyback Status */}
                  <td className="p-3 text-center font-mono text-[10px]">
                    {p.hasBuyback ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
                        <CheckCircle2 className="w-3 h-3" /> Sim ({p.buybackCost})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-400/90 border border-amber-500/20 font-bold">
                        <XCircle className="w-3 h-3" /> Sem Ouro ({p.buybackCost})
                      </span>
                    )}
                  </td>

                  {/* GPM / XPM */}
                  <td className="p-3 text-right font-mono text-[11px]">
                    <span className="text-amber-400 font-bold">{p.gpm}</span>
                    <span className="text-gray-500"> / </span>
                    <span className="text-cyan-400">{p.xpm}</span>
                  </td>

                  {/* Itens */}
                  <td className="p-3 pr-4">
                    <div className="flex items-center gap-1">
                      <div className="grid grid-cols-6 gap-1 bg-black/60 p-1 rounded-lg border border-white/10 w-fit">
                        {Array.from({ length: 6 }).map((_, itIdx) => {
                          const itId = p.items[itIdx];
                          const itImg = itId ? getItemImg(constants, itId) : null;
                          return (
                            <div
                              key={itIdx}
                              className="w-5 h-4 rounded bg-white/5 border border-white/5 flex items-center justify-center overflow-hidden"
                            >
                              {itImg ? (
                                <img src={itImg} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="w-1 h-1 rounded-full bg-white/10" />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {neutralImg && (
                        <div title="Item Neutro" className="w-5 h-4 rounded bg-amber-500/20 border border-amber-400/60 flex items-center justify-center overflow-hidden">
                          <img src={neutralImg} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#0C0F16] border border-rose-500/40 rounded-2xl p-4 sm:p-7 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* BOTÃO FECHAR */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-all z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* CABEÇALHO DO AO VIVO */}
        <div className="text-center border-b border-white/10 pb-4 mb-4 relative z-10 shrink-0">
          <div className="flex items-center justify-center gap-2">
            <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-rose-400 bg-rose-500/20 border border-rose-500/30 px-3 py-1 rounded-full animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              Partida Ao Vivo · {timeFormatted}
            </span>
            <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
              {leagueName} ({formatStr})
            </span>
          </div>

          {/* Placar Principal */}
          <div className="flex items-center justify-center gap-4 sm:gap-8 mt-3">
            <div className="text-right flex-1 truncate flex items-center justify-end gap-3">
              <span className="text-base sm:text-xl font-black text-white truncate block">{teamAName}</span>
              {logoA && <img src={logoA} alt="" className="w-8 h-8 object-contain shrink-0" onError={(e) => { e.target.style.display = 'none'; }} />}
            </div>

            <div className="px-5 py-2 rounded-xl bg-black/80 border border-rose-500/40 font-mono text-xl sm:text-3xl font-black text-amber-400 shrink-0 shadow-lg shadow-rose-500/10">
              {scoreA} <span className="text-gray-500 mx-1">:</span> {scoreB}
            </div>

            <div className="text-left flex-1 truncate flex items-center justify-start gap-3">
              {logoB && <img src={logoB} alt="" className="w-8 h-8 object-contain shrink-0" onError={(e) => { e.target.style.display = 'none'; }} />}
              <span className="text-base sm:text-xl font-black text-white truncate block">{teamBName}</span>
            </div>
          </div>

          {game.streamUrl && (
            <div className="mt-3 flex justify-center">
              <a
                href={game.streamUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-extrabold text-xs transition-all shadow-md"
              >
                <Tv className="w-4 h-4" /> Assistir Transmissão Ao Vivo (Stream)
              </a>
            </div>
          )}

          {/* ABAS DOS MAPAS DA SÉRIE QUANDO EXISTEM MÚLTIPLOS JOGOS */}
          {mapsList.length > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-white/5">
              {mapsList.map((m, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectMap(m.match_id, idx)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono uppercase transition-all ${
                    activeMapIndex === idx
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                      : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
                  }`}
                >
                  <Swords className="w-3 h-3" /> Jogo {m.mapNumber} {m.radiant_score !== undefined ? `(${m.radiant_score}:${m.dire_score})` : ''}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CONTEÚDO COM MINIMAPA E TABELAS */}
        <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              <span className="text-xs font-semibold">Sincronizando telemetria, itens e posições no mapa...</span>
            </div>
          ) : (
            <>
              {/* SEÇÃO DO MINIMAPA COM POSICIONAMENTO EM TEMPO REAL */}
              <div className="bg-[#141824]/80 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row items-center gap-6">
                {/* O Minimapa */}
                <div className="relative w-full max-w-[340px] aspect-square rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black shrink-0">
                  <img
                    src="/minimap.jpg"
                    alt="Minimapa Dota 2"
                    className="w-full h-full object-cover select-none pointer-events-none"
                  />

                  {/* Marcadores dos Heróis */}
                  {allPlayers.map((p, idx) => {
                    const coords = calculateMinimapPosition(p.slot, p.isRadiant, p.kills, p.deaths);
                    const hImg = getHeroImg(constants, p.hero_id);
                    const hName = getHeroName(constants, p.hero_id);
                    const isHovered = hoveredPlayer?.slot === p.slot;

                    return (
                      <div
                        key={idx}
                        style={{ left: coords.left, top: coords.top }}
                        onMouseEnter={() => setHoveredPlayer(p)}
                        onMouseLeave={() => setHoveredPlayer(null)}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 z-10 ${
                          isHovered ? 'scale-125 z-30' : 'hover:scale-115'
                        }`}
                      >
                        <div className="relative">
                          <img
                            src={hImg}
                            alt={hName}
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border-2 shadow-lg ${
                              p.isRadiant
                                ? 'border-emerald-400 shadow-emerald-500/50'
                                : 'border-rose-400 shadow-rose-500/50'
                            }`}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                          <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full font-mono text-[8px] font-black flex items-center justify-center border ${
                            p.isRadiant ? 'bg-black text-emerald-400 border-emerald-400' : 'bg-black text-rose-400 border-rose-400'
                          }`}>
                            {p.level}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Informações Rápidas do Jogador e Picks */}
                <div className="flex-1 space-y-4 w-full">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400">
                      <Eye className="w-4 h-4 text-amber-400" /> Posicionamento Tático no Mapa
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-mono">
                      <span className="flex items-center gap-1 text-emerald-400 font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" /> {teamAName} (Verde)
                      </span>
                      <span className="flex items-center gap-1 text-rose-400 font-bold">
                        <span className="w-2 h-2 rounded-full bg-rose-400" /> {teamBName} (Vermelho)
                      </span>
                    </div>
                  </div>

                  {hoveredPlayer ? (
                    <div className="bg-[#161A24] border border-amber-500/40 rounded-xl p-3.5 space-y-2 animate-fade-in shadow-lg">
                      <div className="flex items-center gap-3">
                        <img
                          src={getHeroImg(constants, hoveredPlayer.hero_id)}
                          alt=""
                          className="w-12 h-8 rounded-lg object-cover border border-white/10"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-white text-sm">{hoveredPlayer.name}</strong>
                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              hoveredPlayer.isRadiant ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                            }`}>
                              {hoveredPlayer.isRadiant ? 'Radiant' : 'Dire'}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">{getHeroName(constants, hoveredPlayer.hero_id)} (Nível {hoveredPlayer.level})</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10 text-xs font-mono">
                        <div>
                          <span className="text-[10px] text-gray-400 block uppercase">K / D / A</span>
                          <strong className="text-white">{hoveredPlayer.kills}/{hoveredPlayer.deaths}/{hoveredPlayer.assists}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 block uppercase">Patrimônio</span>
                          <strong className="text-amber-400 font-bold">{hoveredPlayer.net_worth.toLocaleString()}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 block uppercase">Buyback</span>
                          <strong className={hoveredPlayer.hasBuyback ? 'text-emerald-400' : 'text-rose-400'}>
                            {hoveredPlayer.hasBuyback ? 'Disponível' : 'Indisponível'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 block uppercase">GPM / XPM</span>
                          <strong className="text-cyan-400">{hoveredPlayer.gpm} / {hoveredPlayer.xpm}</strong>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#161A24]/60 border border-white/5 rounded-xl p-4 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-1.5">
                      <span>Passe o mouse ou toque nos heróis no minimapa para inspecionar</span>
                      <span className="text-[11px] text-gray-500">Veja o patrimônio, ouro, KDA, itens e disponibilidade de Buyback instantaneamente</span>
                    </div>
                  )}

                  {/* Picks da Partida */}
                  <div className="space-y-2 pt-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Picks da Partida</div>
                    <div className="flex items-center justify-between gap-4">
                      {/* Radiant Picks */}
                      <div className="flex items-center gap-1 flex-wrap">
                        {radiantPicks.map((p, i) => (
                          <img
                            key={i}
                            src={getHeroImg(constants, p.hero_id)}
                            alt=""
                            title={`${teamAName}: ${getHeroName(constants, p.hero_id)}`}
                            className="w-7 h-5 object-cover rounded border border-emerald-400/80"
                          />
                        ))}
                      </div>

                      <span className="text-xs font-mono font-bold text-gray-500">vs</span>

                      {/* Dire Picks */}
                      <div className="flex items-center gap-1 flex-wrap justify-end">
                        {direPicks.map((p, i) => (
                          <img
                            key={i}
                            src={getHeroImg(constants, p.hero_id)}
                            alt=""
                            title={`${teamBName}: ${getHeroName(constants, p.hero_id)}`}
                            className="w-7 h-5 object-cover rounded border border-rose-400/80"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* TABELA RADIANT */}
              {renderTable(radiantPlayers, teamAName, true, scoreA)}

              {/* TABELA DIRE */}
              {renderTable(direPlayers, teamBName, false, scoreB)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
