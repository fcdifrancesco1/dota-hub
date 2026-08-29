import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Tv,
  CheckCircle2,
  XCircle,
  Swords,
  Loader2,
  RefreshCw,
  Castle,
  Radio
} from 'lucide-react';
import {
  getHeroImg,
  getHeroName,
  getItemImg,
  findLiveMatchDetails,
  fetchMatchDetails
} from '../services/api';

// Lê o primeiro valor definido entre possíveis nomes de campo da API (sem inventar números)
function pick(obj, keys) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return null;
}

// Status real das Torres/Barracas a partir das bitmasks da OpenDota.
// Quando a bitmask não está disponível, o status fica "desconhecido" (não é adivinhado).
function parseStructures(towerMask, barracksMask) {
  const hasTowerData = towerMask !== undefined && towerMask !== null;
  const hasBarracksData = barracksMask !== undefined && barracksMask !== null;

  const tower = (bit) => (hasTowerData ? Boolean(towerMask & (1 << bit)) : null);
  const rax = (bit) => (hasBarracksData ? Boolean(barracksMask & (1 << bit)) : null);

  return {
    hasData: hasTowerData || hasBarracksData,
    top: [
      { name: "T1 Top", alive: tower(0) },
      { name: "T2 Top", alive: tower(1) },
      { name: "T3 Top", alive: tower(2) },
      { name: "Barraca M", alive: rax(0) },
      { name: "Barraca R", alive: rax(1) }
    ],
    mid: [
      { name: "T1 Mid", alive: tower(3) },
      { name: "T2 Mid", alive: tower(4) },
      { name: "T3 Mid", alive: tower(5) },
      { name: "Barraca M", alive: rax(2) },
      { name: "Barraca R", alive: rax(3) }
    ],
    bot: [
      { name: "T1 Bot", alive: tower(6) },
      { name: "T2 Bot", alive: tower(7) },
      { name: "T3 Bot", alive: tower(8) },
      { name: "Barraca M", alive: rax(4) },
      { name: "Barraca R", alive: rax(5) }
    ],
    base: [
      { name: "T4 (1)", alive: tower(9) },
      { name: "T4 (2)", alive: tower(10) },
      { name: "Trono", alive: tower(11) }
    ]
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
  const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString('pt-BR'));

  // 1. Sincronização e Busca da Telemetria Oficial
  const syncMatchData = useCallback(() => {
    if (!game) return;
    findLiveMatchDetails(game).then((result) => {
      setMatchData(result.matchData || null);
      setMapsList(result.maps || []);
      setLastSync(new Date().toLocaleTimeString('pt-BR'));
      setLoading(false);
    });
  }, [game]);

  // 2. Sincronização estritamente a cada 20 segundos com dados reais da API
  useEffect(() => {
    setLoading(true);
    syncMatchData();

    const interval20s = setInterval(() => {
      syncMatchData();
    }, 20000);

    return () => clearInterval(interval20s);
  }, [syncMatchData]);

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

  // Duração real vinda da API (não é simulada)
  const durationSec = pick(matchData, ['duration']) ?? game.gameDuration ?? null;
  const timeFormatted = durationSec != null
    ? `${Math.floor(durationSec / 60)}:${String(Math.floor(durationSec % 60)).padStart(2, '0')}`
    : null;

  // Placar real de abates (apenas quando a API fornece)
  const scoreA = pick(matchData, ['radiant_score']) ?? game.gameScoreA ?? null;
  const scoreB = pick(matchData, ['dire_score']) ?? game.gameScoreB ?? null;
  const hasScore = scoreA !== null && scoreB !== null;

  const leagueName = matchData?.league_name || game.torneio || "Torneio Profissional";
  const formatStr = game.formato || "BO3";

  // Jogadores reais (apenas o que a API retorna)
  const rawPlayers = matchData?.players || [];
  const rawRadiant = rawPlayers.filter((p, i) => (p.player_slot !== undefined ? p.player_slot < 128 : i < 5));
  const rawDire = rawPlayers.filter((p, i) => (p.player_slot !== undefined ? p.player_slot >= 128 : i >= 5));

  const radiantStructures = parseStructures(matchData?.tower_status_radiant, matchData?.barracks_status_radiant);
  const direStructures = parseStructures(matchData?.tower_status_dire, matchData?.barracks_status_dire);

  const countAlive = (structs) =>
    [...structs.top, ...structs.mid, ...structs.bot, ...structs.base].filter((s) => s.alive === true).length;

  const radiantAliveCount = countAlive(radiantStructures);
  const direAliveCount = countAlive(direStructures);

  const buildPlayer = (p, idx, isRadiant) => {
    const teamName = isRadiant ? teamAName : teamBName;
    const heroId = pick(p, ['hero_id']);
    const items = [p.item_0, p.item_1, p.item_2, p.item_3, p.item_4, p.item_5].filter((v) => v !== undefined && v !== null);
    const buybackCount = pick(p, ['buyback_count']);

    return {
      slot: isRadiant ? idx : idx + 5,
      name: pick(p, ['name', 'personaname']) || `${teamName} Pos ${idx + 1}`,
      hero_id: heroId,
      level: pick(p, ['level']),
      kills: pick(p, ['kills']),
      deaths: pick(p, ['deaths']),
      assists: pick(p, ['assists']),
      last_hits: pick(p, ['last_hits']),
      denies: pick(p, ['denies']),
      gpm: pick(p, ['gold_per_min']),
      xpm: pick(p, ['xp_per_min']),
      net_worth: pick(p, ['net_worth']),
      buybackCount,
      items,
      neutralItem: pick(p, ['item_neutral']),
      isRadiant
    };
  };

  const radiantPlayers = rawRadiant.map((p, idx) => buildPlayer(p, idx, true));
  const direPlayers = rawDire.map((p, idx) => buildPlayer(p, idx, false));
  const hasPlayerData = radiantPlayers.length > 0 || direPlayers.length > 0;

  // Picks & Bans reais
  const picksBans = matchData?.picks_bans || [];
  const radiantPicks = picksBans.filter(p => p.team === 0 && p.is_pick);
  const direPicks = picksBans.filter(p => p.team === 1 && p.is_pick);

  const renderStructureColumns = (structures, teamName, isRadiant, aliveCount) => {
    const columns = [
      { key: 'top', label: 'TOP', items: structures.top },
      { key: 'mid', label: 'MID', items: structures.mid },
      { key: 'bot', label: 'BOT', items: structures.bot },
      { key: 'base', label: 'BASE', items: structures.base }
    ];

    return (
      <div className={`bg-[#0E1118] border ${isRadiant ? 'border-emerald-500/20' : 'border-rose-500/20'} rounded-xl p-2.5 space-y-2`}>
        <div className="flex items-center justify-between border-b border-white/5 pb-1">
          <span className={`font-bold font-mono text-xs ${isRadiant ? 'text-emerald-400' : 'text-rose-400'} truncate`}>
            {teamName} ({isRadiant ? 'Radiant' : 'Dire'})
          </span>
          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
            isRadiant ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
          }`}>
            {aliveCount}/14 em pé
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5 text-[9px] font-mono">
          {columns.map((col) => (
            <div key={col.key} className="flex flex-col gap-1">
              <div className="text-center text-[9px] font-extrabold uppercase tracking-wider text-gray-400 bg-white/5 py-0.5 rounded">
                {col.label}
              </div>
              <div className="flex flex-col gap-1">
                {col.items.map((item, itIdx) => {
                  const unknown = item.alive === null;
                  return (
                    <div
                      key={itIdx}
                      title={`${col.label} - ${item.name}: ${unknown ? 'Status desconhecido' : item.alive ? 'Em pé (Intacta)' : 'Derrubada (Destruída)'}`}
                      className={`flex items-center justify-between px-1.5 py-1 rounded border transition-all ${
                        unknown
                          ? 'bg-white/[0.02] text-gray-600 border-white/5'
                          : item.alive
                            ? isRadiant
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 font-bold shadow-sm shadow-emerald-500/10'
                              : 'bg-rose-500/15 text-rose-300 border-rose-500/40 font-bold shadow-sm shadow-rose-500/10'
                            : 'bg-rose-950/30 text-gray-500 border-white/5 line-through opacity-45'
                      }`}
                    >
                      <span className="truncate">{item.name}</span>
                      {unknown ? (
                        <span className="text-[8px] text-gray-600 shrink-0">?</span>
                      ) : item.alive ? (
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isRadiant ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      ) : (
                        <span className="text-[8px] text-rose-500 font-bold shrink-0">✕</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

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
          <strong className="text-white text-base font-black">{score ?? '—'}</strong>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0E1118]/80">
        <table className="w-full text-left text-xs border-collapse min-w-[820px]">
          <thead className="bg-[#161A24]/90 text-gray-400 font-mono text-[10px] uppercase border-b border-white/10">
            <tr>
              <th className="p-3 pl-4">Jogador / Herói</th>
              <th className="p-3 text-center">Nível</th>
              <th className="p-3 text-center min-w-[110px] whitespace-nowrap">K / D / A</th>
              <th className="p-3 text-right">Patrimônio Líquido</th>
              <th className="p-3 text-right">CS (LH / DN)</th>
              <th className="p-3 text-center min-w-[140px] whitespace-nowrap">Buybacks Usados</th>
              <th className="p-3 text-right min-w-[90px] whitespace-nowrap">GPM / XPM</th>
              <th className="p-3 pr-4">Inventário Atual</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-medium">
            {players.map((p, i) => {
              const hImg = p.hero_id ? getHeroImg(constants, p.hero_id) : "";
              const hName = p.hero_id ? getHeroName(constants, p.hero_id) : "Herói desconhecido";
              const neutralImg = p.neutralItem ? getItemImg(constants, p.neutralItem) : null;

              return (
                <tr key={i} className="transition-colors hover:bg-white/[0.03]">
                  {/* Jogador e Herói */}
                  <td className="p-3 pl-4">
                    <div className="flex items-center gap-2.5">
                      {hImg && (
                        <img
                          src={hImg}
                          alt={hName}
                          className={`w-9 h-6 object-cover rounded border ${
                            isRadiant ? 'border-emerald-400' : 'border-rose-400'
                          }`}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      )}
                      <div className="min-w-0">
                        <span className="text-white font-bold truncate max-w-[130px] block">{p.name}</span>
                        <span className="text-[10px] text-gray-400 truncate">{hName}</span>
                      </div>
                    </div>
                  </td>

                  {/* Nível */}
                  <td className="p-3 text-center font-mono font-bold">
                    <span className="px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-[10px] text-gray-300">
                      {p.level ?? '—'}
                    </span>
                  </td>

                  {/* KDA */}
                  <td className="p-3 text-center font-mono whitespace-nowrap">
                    <div className="inline-flex items-center justify-center gap-1 font-mono text-xs">
                      <span className="font-bold text-white min-w-[18px] text-right">{p.kills ?? '—'}</span>
                      <span className="text-gray-500 font-normal">/</span>
                      <span className="font-bold text-rose-400 min-w-[18px] text-center">{p.deaths ?? '—'}</span>
                      <span className="text-gray-500 font-normal">/</span>
                      <span className="font-bold text-cyan-400 min-w-[18px] text-left">{p.assists ?? '—'}</span>
                    </div>
                  </td>

                  {/* Net Worth */}
                  <td className="p-3 text-right font-mono font-black text-amber-400">
                    {p.net_worth != null ? p.net_worth.toLocaleString() : '—'}
                  </td>

                  {/* CS */}
                  <td className="p-3 text-right font-mono text-gray-300">
                    {p.last_hits ?? '—'} <span className="text-gray-500">/</span> {p.denies ?? '—'}
                  </td>

                  {/* Buybacks usados (dado real, sem estimar disponibilidade de ouro) */}
                  <td className="p-3 text-center font-mono text-[10px] whitespace-nowrap">
                    {p.buybackCount != null ? (
                      p.buybackCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/50 font-extrabold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {p.buybackCount}x usado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10 font-bold">
                          <XCircle className="w-3.5 h-3.5" /> Nenhum
                        </span>
                      )
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>

                  {/* GPM / XPM */}
                  <td className="p-3 text-right font-mono text-[11px] whitespace-nowrap">
                    <span className="text-amber-400 font-bold">{p.gpm ?? '—'}</span>
                    <span className="text-gray-500"> / </span>
                    <span className="text-cyan-400">{p.xpm ?? '—'}</span>
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
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-rose-400 bg-rose-500/20 border border-rose-500/30 px-3 py-1 rounded-full animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              Partida Ao Vivo {timeFormatted ? `· ${timeFormatted}` : ''}
            </span>
            <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
              {leagueName} ({formatStr})
            </span>
            <span className="text-[10px] text-emerald-400/80 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
              <RefreshCw className="w-2.5 h-2.5 text-emerald-400 animate-spin" /> Sincronizado com a API a cada 20s ({lastSync})
            </span>
          </div>

          {/* Placar Principal do Jogo (Abates) */}
          <div className="flex items-center justify-center gap-4 sm:gap-8 mt-3">
            <div className="text-right flex-1 truncate flex items-center justify-end gap-3">
              <span className="text-base sm:text-xl font-black text-white truncate block">{teamAName}</span>
              {logoA && <img src={logoA} alt="" className="w-8 h-8 object-contain shrink-0" onError={(e) => { e.target.style.display = 'none'; }} />}
            </div>

            <div className="flex flex-col items-center shrink-0">
              {hasScore ? (
                <div className="px-5 py-2 rounded-xl bg-black/80 border border-rose-500/40 font-mono text-xl sm:text-3xl font-black text-amber-400 shadow-lg shadow-rose-500/10">
                  {scoreA} <span className="text-gray-500 mx-1">:</span> {scoreB}
                </div>
              ) : (
                <div className="px-5 py-2 rounded-xl bg-black/60 border border-white/10 font-mono text-sm font-bold text-gray-400">
                  Aguardando dados
                </div>
              )}
              <span className="text-[9px] text-gray-400 font-mono mt-1 uppercase tracking-wider">
                Placar de Abates
              </span>
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

        {/* CONTEÚDO COM OBJETIVOS E TABELAS (SOMENTE DADOS REAIS DA API) */}
        <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              <span className="text-xs font-semibold">Sincronizando dados oficiais da partida...</span>
            </div>
          ) : !matchData ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-center text-gray-400">
              <Radio className="w-10 h-10 text-amber-500/40 animate-pulse" />
              <span className="text-sm font-bold text-white">Ainda não há telemetria oficial publicada para esta partida</span>
              <span className="text-xs text-gray-500 max-w-md">
                Assim que a OpenDota ou a Liquipedia publicarem dados de placar, torres e jogadores, eles aparecem aqui automaticamente (nova checagem a cada 20s). Enquanto isso, acompanhe pela transmissão oficial.
              </span>
            </div>
          ) : (
            <>
              {/* STATUS DAS TORRES E BARRACAS (SOMENTE QUANDO A API FORNECE OS DADOS) */}
              {(radiantStructures.hasData || direStructures.hasData) && (
                <div className="bg-[#141824]/80 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      <Castle className="w-3.5 h-3.5 text-amber-400" /> Torres & Barracas (Top / Mid / Bot / Base)
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-mono">
                      <span className="text-emerald-400 font-bold">{teamAName}: {radiantAliveCount}/14</span>
                      <span className="text-gray-500">·</span>
                      <span className="text-rose-400 font-bold">{teamBName}: {direAliveCount}/14</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                    {renderStructureColumns(radiantStructures, teamAName, true, radiantAliveCount)}
                    {renderStructureColumns(direStructures, teamBName, false, direAliveCount)}
                  </div>

                  {/* Picks da Partida (apenas quando a API retorna picks_bans) */}
                  {(radiantPicks.length > 0 || direPicks.length > 0) && (
                    <div className="space-y-1.5 pt-2 border-t border-white/10">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Picks da Partida</div>
                      <div className="flex items-center justify-between gap-4">
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
                  )}
                </div>
              )}

              {/* TABELAS DE JOGADORES (SOMENTE QUANDO A API RETORNA JOGADORES) */}
              {hasPlayerData ? (
                <>
                  {renderTable(radiantPlayers, teamAName, true, scoreA)}
                  {renderTable(direPlayers, teamBName, false, scoreB)}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500 text-xs">
                  Estatísticas individuais dos jogadores ainda não foram publicadas pela API para esta partida.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
