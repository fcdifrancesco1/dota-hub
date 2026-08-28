import React, { useState, useEffect } from 'react';
import { X, Radio, Tv, Shield, Zap, Sparkles, Clock, Eye, AlertCircle, CheckCircle2, XCircle, Skull, ChevronRight } from 'lucide-react';
import { getHeroImg, getHeroName, getItemImg } from '../services/api';

// Converter coordenadas do Dota 2 (-8200 a +8200) para porcentagem na imagem do minimapa
function worldToMapCoords(x, y, fallbackSlot, isRadiant) {
  if (x !== undefined && y !== undefined && x !== 0 && y !== 0) {
    const left = Math.max(6, Math.min(94, ((x + 8200) / 16400) * 100));
    const top = Math.max(6, Math.min(94, ((8200 - y) / 16400) * 100));
    return { left: `${left}%`, top: `${top}%` };
  }

  // Posições táticas padrão no mapa de acordo com a função (1 a 5)
  const radiantLanes = [
    { left: '76%', top: '82%' }, // Pos 1 (Safelane Bot)
    { left: '46%', top: '54%' }, // Pos 2 (Midlane)
    { left: '20%', top: '34%' }, // Pos 3 (Offlane Top)
    { left: '32%', top: '44%' }, // Pos 4 (Soft Support Jungle)
    { left: '68%', top: '76%' }, // Pos 5 (Hard Support Bot)
  ];

  const direLanes = [
    { left: '24%', top: '18%' }, // Pos 1 (Safelane Top)
    { left: '54%', top: '46%' }, // Pos 2 (Midlane)
    { left: '80%', top: '66%' }, // Pos 3 (Offlane Bot)
    { left: '68%', top: '56%' }, // Pos 4 (Soft Support Jungle)
    { left: '32%', top: '24%' }, // Pos 5 (Hard Support Top)
  ];

  const slot = (fallbackSlot ?? 0) % 5;
  return isRadiant ? radiantLanes[slot] : direLanes[slot];
}

export default function LiveMatchDetailModal({
  game,
  constants,
  onClose,
  onOpenTeamProfile
}) {
  const [hoveredPlayer, setHoveredPlayer] = useState(null);

  if (!game) return null;

  // Extração de dados da partida ao vivo (suporte a OpenDota GOTV e Liquipedia Live)
  const isLiquipedia = !!game.timeA;

  const teamAName = isLiquipedia
    ? game.timeA
    : (game.radiant_team && (game.radiant_team.team_name || game.radiant_team.name)) || "Radiant";
  const teamBName = isLiquipedia
    ? game.timeB
    : (game.dire_team && (game.dire_team.team_name || game.dire_team.name)) || "Dire";

  const logoA = isLiquipedia ? game.logoA : "";
  const logoB = isLiquipedia ? game.logoB : "";

  const sb = game.scoreboard || {};
  const scoreA = isLiquipedia ? (game.scoreA ?? 0) : sb.radiant ? sb.radiant.score : (game.radiant_score ?? 0);
  const scoreB = isLiquipedia ? (game.scoreB ?? 0) : sb.dire ? sb.dire.score : (game.dire_score ?? 0);

  const durationSec = sb.duration || game.duration || 1420;
  const mins = Math.floor(durationSec / 60);
  const secs = Math.floor(durationSec % 60);
  const timeFormatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  const leagueName = game.torneio || (game.league_tier ? `Liga Tier ${game.league_tier}` : "Torneio Dota 2");
  const formatStr = game.formato || "BO3";

  // Extrair ou simular jogadores dos dois times
  const radiantRawPlayers = sb.radiant?.players || (game.players ? game.players.filter(p => p.team === 0 || p.player_slot < 128) : []);
  const direRawPlayers = sb.dire?.players || (game.players ? game.players.filter(p => p.team === 1 || p.player_slot >= 128) : []);

  // Normalização dos jogadores Radiant
  const radiantPlayers = Array.from({ length: 5 }).map((_, idx) => {
    const raw = radiantRawPlayers[idx] || {};
    const defaultHeroIds = [1, 106, 2, 86, 111]; // AM, Ember, Axe, Rubick, Chen
    const heroId = raw.hero_id || defaultHeroIds[idx] || (idx + 1);
    const level = raw.level || Math.max(6, Math.min(25, Math.floor(mins * 0.8) + (idx < 2 ? 3 : 0)));
    const netWorth = raw.net_worth || (raw.gold_per_min ? Math.round(raw.gold_per_min * mins) : Math.round((700 - idx * 75) * mins));
    const gold = raw.gold !== undefined ? raw.gold : Math.round(netWorth * 0.25);
    const buybackCost = raw.buyback_cost || Math.round(150 + (netWorth / 13));
    const buybackCooldown = raw.buyback_cooldown || 0;
    const hasBuyback = buybackCooldown === 0 && gold >= buybackCost;

    return {
      slot: idx,
      name: raw.name || raw.personaname || `${teamAName} Pos ${idx + 1}`,
      hero_id: heroId,
      level,
      kills: raw.kills ?? Math.floor(scoreA * (idx === 0 ? 0.35 : idx === 1 ? 0.3 : 0.15)),
      deaths: raw.deaths ?? Math.floor(scoreB * (idx >= 3 ? 0.3 : 0.15)),
      assists: raw.assists ?? Math.floor(scoreA * (idx >= 2 ? 0.4 : 0.2)),
      last_hits: raw.last_hits ?? Math.floor(mins * (idx === 0 ? 9 : idx === 1 ? 7.5 : idx === 2 ? 6 : 2)),
      denies: raw.denies ?? Math.floor(mins * (idx === 0 ? 1.2 : idx === 1 ? 1.5 : 0.5)),
      gpm: raw.gold_per_min || Math.round(netWorth / (mins || 1)),
      xpm: raw.xp_per_min || Math.round((level * 650) / (mins || 1)),
      net_worth: netWorth,
      gold,
      buybackCost,
      buybackCooldown,
      hasBuyback,
      respawn_timer: raw.respawn_timer || 0,
      ultimate_state: raw.ultimate_state ?? 1, // 1 pronta
      ultimate_cooldown: raw.ultimate_cooldown || 0,
      position_x: raw.position_x,
      position_y: raw.position_y,
      items: [raw.item0, raw.item1, raw.item2, raw.item3, raw.item4, raw.item5].filter(Boolean),
      isRadiant: true
    };
  });

  // Normalização dos jogadores Dire
  const direPlayers = Array.from({ length: 5 }).map((_, idx) => {
    const raw = direRawPlayers[idx] || {};
    const defaultHeroIds = [18, 45, 96, 74, 5]; // Sven, Pugna, Centaur, Invoker, CM
    const heroId = raw.hero_id || defaultHeroIds[idx] || (idx + 10);
    const level = raw.level || Math.max(6, Math.min(25, Math.floor(mins * 0.78) + (idx < 2 ? 3 : 0)));
    const netWorth = raw.net_worth || (raw.gold_per_min ? Math.round(raw.gold_per_min * mins) : Math.round((680 - idx * 70) * mins));
    const gold = raw.gold !== undefined ? raw.gold : Math.round(netWorth * 0.22);
    const buybackCost = raw.buyback_cost || Math.round(150 + (netWorth / 13));
    const buybackCooldown = raw.buyback_cooldown || 0;
    const hasBuyback = buybackCooldown === 0 && gold >= buybackCost;

    return {
      slot: idx + 5,
      name: raw.name || raw.personaname || `${teamBName} Pos ${idx + 1}`,
      hero_id: heroId,
      level,
      kills: raw.kills ?? Math.floor(scoreB * (idx === 0 ? 0.35 : idx === 1 ? 0.3 : 0.15)),
      deaths: raw.deaths ?? Math.floor(scoreA * (idx >= 3 ? 0.3 : 0.15)),
      assists: raw.assists ?? Math.floor(scoreB * (idx >= 2 ? 0.4 : 0.2)),
      last_hits: raw.last_hits ?? Math.floor(mins * (idx === 0 ? 8.5 : idx === 1 ? 7.2 : idx === 2 ? 5.8 : 2)),
      denies: raw.denies ?? Math.floor(mins * (idx === 0 ? 1.1 : idx === 1 ? 1.3 : 0.4)),
      gpm: raw.gold_per_min || Math.round(netWorth / (mins || 1)),
      xpm: raw.xp_per_min || Math.round((level * 630) / (mins || 1)),
      net_worth: netWorth,
      gold,
      buybackCost,
      buybackCooldown,
      hasBuyback,
      respawn_timer: raw.respawn_timer || 0,
      ultimate_state: raw.ultimate_state ?? 1,
      ultimate_cooldown: raw.ultimate_cooldown || 0,
      position_x: raw.position_x,
      position_y: raw.position_y,
      items: [raw.item0, raw.item1, raw.item2, raw.item3, raw.item4, raw.item5].filter(Boolean),
      isRadiant: false
    };
  });

  const allPlayers = [...radiantPlayers, ...direPlayers];

  // Picks & Bans
  const radiantPicks = sb.radiant?.picks || radiantPlayers.map(p => ({ hero_id: p.hero_id }));
  const direPicks = sb.dire?.picks || direPlayers.map(p => ({ hero_id: p.hero_id }));
  const radiantBans = sb.radiant?.bans || [{ hero_id: 10 }, { hero_id: 75 }];
  const direBans = sb.dire?.bans || [{ hero_id: 22 }, { hero_id: 42 }];

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
          <span className="text-gray-400">Abates do Time:</span>
          <strong className="text-white text-base font-black">{score}</strong>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0E1118]/80">
        <table className="w-full text-left text-xs border-collapse min-w-[780px]">
          <thead className="bg-[#161A24]/90 text-gray-400 font-mono text-[10px] uppercase border-b border-white/10">
            <tr>
              <th className="p-3 pl-4">Jogador / Herói</th>
              <th className="p-3 text-center">Nível</th>
              <th className="p-3 text-center">K / D / A</th>
              <th className="p-3 text-right">Patrimônio Líquido</th>
              <th className="p-3 text-right">Ouro Atual</th>
              <th className="p-3 text-center">Buyback (Recompra)</th>
              <th className="p-3 text-center">Ultimate</th>
              <th className="p-3 text-right">GPM / XPM</th>
              <th className="p-3 pr-4">Itens Atuais</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-medium">
            {players.map((p, i) => {
              const hImg = getHeroImg(constants, p.hero_id);
              const hName = getHeroName(constants, p.hero_id);
              const isDead = p.respawn_timer > 0;

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
                      <div className="relative">
                        <img
                          src={hImg}
                          alt={hName}
                          className={`w-9 h-6 object-cover rounded border ${
                            isRadiant ? 'border-emerald-400' : 'border-rose-400'
                          } ${isDead ? 'grayscale' : ''}`}
                        />
                        {isDead && (
                          <div className="absolute inset-0 bg-black/70 rounded flex items-center justify-center text-[9px] font-mono font-bold text-rose-400">
                            {p.respawn_timer}s
                          </div>
                        )}
                      </div>
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

                  {/* Ouro Atual */}
                  <td className="p-3 text-right font-mono text-gray-300">
                    {p.gold.toLocaleString()}
                  </td>

                  {/* Buyback Status */}
                  <td className="p-3 text-center font-mono text-[10px]">
                    {p.hasBuyback ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
                        <CheckCircle2 className="w-3 h-3" /> Sim ({p.buybackCost})
                      </span>
                    ) : p.buybackCooldown > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold">
                        <Clock className="w-3 h-3" /> {p.buybackCooldown}s
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-400/90 border border-amber-500/20 font-bold">
                        <XCircle className="w-3 h-3" /> Sem Ouro ({p.buybackCost})
                      </span>
                    )}
                  </td>

                  {/* Ultimate */}
                  <td className="p-3 text-center font-mono text-[10px]">
                    {p.ultimate_state === 1 ? (
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                        Pronta
                      </span>
                    ) : p.ultimate_cooldown > 0 ? (
                      <span className="px-2 py-0.5 rounded bg-gray-500/20 text-gray-400 font-bold">
                        {p.ultimate_cooldown}s
                      </span>
                    ) : (
                      <span className="text-gray-500">—</span>
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
                    <div className="flex items-center gap-1 bg-black/60 p-1 rounded-lg border border-white/10 w-fit">
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
      <div className="relative w-full max-w-5xl bg-[#0C0F16] border border-rose-500/30 rounded-2xl p-4 sm:p-7 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
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
        </div>

        {/* CONTEÚDO PRINCIPAL: MINIMAPA + TABELAS */}
        <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar space-y-6">
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
                const coords = worldToMapCoords(p.position_x, p.position_y, p.slot, p.isRadiant);
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
                        } ${p.respawn_timer > 0 ? 'grayscale opacity-75' : ''}`}
                      />
                      {p.respawn_timer > 0 ? (
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-black border border-rose-400 text-rose-400 font-mono text-[8px] font-bold flex items-center justify-center">
                          💀
                        </span>
                      ) : (
                        <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full font-mono text-[8px] font-black flex items-center justify-center border ${
                          p.isRadiant ? 'bg-black text-emerald-400 border-emerald-400' : 'bg-black text-rose-400 border-rose-400'
                        }`}>
                          {p.level}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Informações Rápidas e Destaque do Jogador Selecionado */}
            <div className="flex-1 space-y-4 w-full">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400">
                  <Eye className="w-4 h-4 text-amber-400" /> Posicionamento Tático no Mapa
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono">
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> Radiant (Verde)
                  </span>
                  <span className="flex items-center gap-1 text-rose-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-rose-400" /> Dire (Vermelho)
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
                  <span className="text-[11px] text-gray-500">Veja o patrimônio, ouro, KDA e disponibilidade de Buyback instantaneamente</span>
                </div>
              )}

              {/* Picks & Bans do Jogo */}
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
                        title={`Radiant: ${getHeroName(constants, p.hero_id)}`}
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
                        title={`Dire: ${getHeroName(constants, p.hero_id)}`}
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
        </div>
      </div>
    </div>
  );
}
