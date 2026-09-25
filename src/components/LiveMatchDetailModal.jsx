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
  Radio,
  Eye
} from 'lucide-react';
import {
  getHeroImg,
  getHeroName,
  getItemImg,
  findLiveMatchDetails,
  fetchMatchDetails
} from '../services/api';
import TeamLogo from '../utils/teamLogos';

// Lê o primeiro valor definido entre possíveis nomes de campo da API (sem inventar números)
function pick(obj, keys) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return null;
}

// Status real das Torres/Barracas a partir das bitmasks oficiais da Valve / OpenDota.
// Quando a partida está em draft ou pré-jogo (duration <= 0), todas as 11 torres e 6 barracas estão 100% de pé.
function parseStructures(towerMask, barracksMask, gameDuration = null) {
  let tMask = towerMask;
  let bMask = barracksMask;

  // Se a partida está em draft ou antes do cronômetro oficial (game_time <= 0), todas as estruturas estão de pé
  if (gameDuration !== null && Number(gameDuration) <= 0) {
    tMask = 2047;
    bMask = 63;
  }

  const hasTowerData = tMask !== undefined && tMask !== null;
  const hasBarracksData = bMask !== undefined && bMask !== null;

  const tower = (bit) => (hasTowerData ? Boolean(tMask & (1 << bit)) : null);
  const rax = (bit) => (hasBarracksData ? Boolean(bMask & (1 << bit)) : null);

  // Trono (Ancient): No Dota 2 a bitmask oficial de torres possui 11 bits (0 a 10 = 2047).
  // O Trono só cai quando a partida é derrotada e as T4 caíram. Enquanto a partida está ativa, o Trono está de pé.
  const throneAlive = hasTowerData
    ? (Boolean(tMask & (1 << 9)) || Boolean(tMask & (1 << 10)) || tMask > 0)
    : null;

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
      { name: "Trono", alive: throneAlive }
    ]
  };
}

export default function LiveMatchDetailModal({
  game,
  constants,
  onClose,
  onOpenTeamProfile,
  onSelectHero
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
      if (result?.matchData) {
        setMatchData({ ...result.matchData, _syncTimestamp: Date.now() });
      } else {
        setMatchData(null);
      }
      setMapsList(result?.maps || []);
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

  const radiantStructures = parseStructures(matchData?.tower_status_radiant, matchData?.barracks_status_radiant, durationSec);
  const direStructures = parseStructures(matchData?.tower_status_dire, matchData?.barracks_status_dire, durationSec);

  const countAlive = (structs) =>
    [...structs.top, ...structs.mid, ...structs.bot, ...structs.base].filter((s) => s.alive === true).length;

  const radiantAliveCount = countAlive(radiantStructures);
  const direAliveCount = countAlive(direStructures);

  const buildPlayer = (p, idx, isRadiant) => {
    const teamName = isRadiant ? teamAName : teamBName;
    const heroId = pick(p, ['hero_id']);
    const rawItems = [
      p.item_0, p.item_1, p.item_2, p.item_3, p.item_4, p.item_5,
      p.item0, p.item1, p.item2, p.item3, p.item4, p.item5,
      ...(Array.isArray(p.items) ? p.items : [])
    ].filter((v) => v !== undefined && v !== null && v !== 0 && v !== "");
    const items = rawItems.slice(0, 6);
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
      gpm: pick(p, ['gold_per_min', 'gpm']),
      xpm: pick(p, ['xp_per_min', 'xpm']),
      net_worth: pick(p, ['net_worth', 'gold']),
      buybackCount,
      items,
      neutralItem: pick(p, ['item_neutral', 'neutral_item']),
      isRadiant
    };
  };

  const radiantPlayers = rawRadiant.map((p, idx) => buildPlayer(p, idx, true));
  const direPlayers = rawDire.map((p, idx) => buildPlayer(p, idx, false));
  const hasPlayerData = radiantPlayers.length > 0 || direPlayers.length > 0;
  const hasDetailedStats = radiantPlayers.some((p) => p.kills !== null && p.kills !== undefined) || direPlayers.some((p) => p.kills !== null && p.kills !== undefined);

  // Picks & Bans em formato Captain's Mode
  const picksBans = matchData?.picks_bans || [];

  const renderCaptainsModeDraft = () => {
    if (!picksBans || picksBans.length === 0) return null;

    const sortedDraft = [...picksBans].sort((a, b) => (a.order || 0) - (b.order || 0));

    const phase1 = sortedDraft.filter((d) => d.phase === 1 || (d.order && d.order <= 11));
    const phase2 = sortedDraft.filter((d) => d.phase === 2 || (d.order && d.order > 11 && d.order <= 19));
    const phase3 = sortedDraft.filter((d) => d.phase === 3 || (d.order && d.order > 19));

    const phases = [
      { num: 1, title: 'Fase 1: Abertura', subtitle: '7 Bans · 4 Picks', items: phase1 },
      { num: 2, title: 'Fase 2: Mid Draft', subtitle: '4 Bans · 4 Picks', items: phase2 },
      { num: 3, title: 'Fase 3: Decisão & Last Pick', subtitle: '3 Bans · 2 Picks', items: phase3 }
    ];

    const renderDraftItem = (item, idx) => {
      const isPick = item.is_pick;
      const isRadiant = item.team === 0;
      const teamName = isRadiant ? teamAName : teamBName;
      const hImg = item.hero_id ? getHeroImg(constants, item.hero_id) : '';
      const hName = item.hero_id ? getHeroName(constants, item.hero_id) : `Herói ${item.hero_id}`;
      const orderNum = item.order || (idx + 1);

      return (
        <div
          key={`${item.order || idx}-${item.hero_id}`}
          onClick={() => {
            if (onSelectHero && constants?.heroes?.[item.hero_id]) {
              onSelectHero(constants.heroes[item.hero_id]);
            }
          }}
          className={`flex flex-col items-center p-1.5 rounded-xl border transition-all cursor-pointer group shrink-0 ${
            isPick
              ? isRadiant
                ? 'bg-emerald-950/30 border-emerald-500/40 hover:border-emerald-400 hover:scale-105 shadow-sm shadow-emerald-500/10'
                : 'bg-rose-950/30 border-rose-500/40 hover:border-rose-400 hover:scale-105 shadow-sm shadow-rose-500/10'
              : 'bg-[#0E1118] border-white/10 hover:border-rose-500/40 hover:scale-105 opacity-80 hover:opacity-100'
          }`}
          title={`${orderNum}. ${isPick ? 'PICK' : 'BAN'}: ${hName} (${teamName})`}
        >
          <div className="flex items-center justify-between w-full gap-1 mb-1 px-0.5">
            <span className="text-[8px] font-mono font-black text-gray-400">#{orderNum}</span>
            <span
              className={`text-[8px] font-mono font-black px-1 rounded uppercase ${
                isPick
                  ? isRadiant
                    ? 'bg-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/30 text-rose-300'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {isPick ? 'PICK' : 'BAN'}
            </span>
          </div>

          <div className="relative w-11 h-7 rounded overflow-hidden border border-white/10 flex items-center justify-center bg-black">
            {hImg ? (
              <img
                src={hImg}
                alt={hName}
                className={`w-full h-full object-cover transition-all ${
                  !isPick ? 'grayscale contrast-125 opacity-60 group-hover:grayscale-0' : ''
                }`}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <span className="text-[9px] text-gray-500 font-mono">?</span>
            )}

            {!isPick && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="w-full h-0.5 bg-rose-500/80 -rotate-45 block" />
              </div>
            )}
          </div>

          <span className="text-[9px] font-bold text-gray-200 truncate max-w-[64px] mt-1 text-center group-hover:text-amber-400 transition-colors">
            {hName}
          </span>
          <span
            className={`text-[8px] font-mono truncate max-w-[64px] text-center ${
              isRadiant ? 'text-emerald-400/90' : 'text-rose-400/90'
            }`}
          >
            {teamName}
          </span>
        </div>
      );
    };

    return (
      <div className="bg-[#11141D] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              Ordem do Draft (Captain's Mode: Picks & Bans)
            </h3>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> {teamAName} (Radiant)
            </span>
            <span className="text-gray-500">·</span>
            <span className="flex items-center gap-1 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-400" /> {teamBName} (Dire)
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {phases.map((ph) => {
            if (!ph.items || ph.items.length === 0) return null;
            return (
              <div key={ph.num} className="bg-black/30 border border-white/5 rounded-xl p-2.5 space-y-2">
                <div className="flex items-center justify-between px-1 text-[10px] font-mono">
                  <span className="font-extrabold text-amber-400 uppercase tracking-wider">{ph.title}</span>
                  <span className="text-gray-500">{ph.subtitle}</span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                  {ph.items.map(renderDraftItem)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

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
            {aliveCount}/18 em pé
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1 sm:gap-1.5 text-[8px] sm:text-[9px] font-mono">
          {columns.map((col) => (
            <div key={col.key} className="flex flex-col gap-1">
              <div className="text-center text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider text-gray-400 bg-white/5 py-0.5 rounded">
                {col.label}
              </div>
              <div className="flex flex-col gap-1">
                {col.items.map((item, itIdx) => {
                  const unknown = item.alive === null;
                  return (
                    <div
                      key={itIdx}
                      title={`${col.label} - ${item.name}: ${unknown ? 'Status desconhecido' : item.alive ? 'Em pé (Intacta)' : 'Derrubada (Destruída)'}`}
                      className={`flex items-center justify-between px-1 sm:px-1.5 py-0.5 sm:py-1 rounded border transition-all ${
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
                        <span className="text-[7px] sm:text-[8px] text-gray-600 shrink-0">?</span>
                      ) : item.alive ? (
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isRadiant ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      ) : (
                        <span className="text-[7px] sm:text-[8px] text-rose-500 font-bold shrink-0">✕</span>
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
          <TeamLogo teamName={teamName} className="w-5 h-5 rounded shrink-0" />
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

      {/* TABELA PARA TELAS MÉDIAS E GRANDES (DESKTOP) */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-white/10 bg-[#0E1118]/80">
        <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
          <thead className="bg-[#161A24]/90 text-gray-400 font-mono text-[10px] uppercase border-b border-white/10">
            <tr>
              <th className="p-3 pl-4 whitespace-nowrap min-w-[170px]">Jogador / Herói</th>
              <th className="p-3 text-center whitespace-nowrap min-w-[60px]">Nível</th>
              <th className="p-3 text-center min-w-[110px] whitespace-nowrap">K / D / A</th>
              <th className="p-3 text-right whitespace-nowrap min-w-[130px]">Patrimônio Líquido</th>
              <th className="p-3 text-right whitespace-nowrap min-w-[110px]">CS (LH / DN)</th>
              <th className="p-3 text-center min-w-[130px] whitespace-nowrap">Buybacks Usados</th>
              <th className="p-3 text-right min-w-[110px] whitespace-nowrap">GPM / XPM</th>
              <th className="p-3 pr-4 whitespace-nowrap min-w-[190px]">Inventário Atual</th>
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
                  <td className="p-3 pl-4 whitespace-nowrap">
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
                      {hImg && (
                        <img
                          src={hImg}
                          alt={hName}
                          className={`w-9 h-6 object-cover rounded border ${
                            isRadiant ? 'border-emerald-400' : 'border-rose-400'
                          } group-hover:ring-2 group-hover:ring-amber-400/50 transition-all`}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      )}
                      <div className="min-w-0">
                        <span className="text-white font-bold truncate max-w-[130px] block">{p.name}</span>
                        <span className="text-[10px] text-gray-400 truncate group-hover:text-amber-400 transition-colors">{hName}</span>
                      </div>
                    </button>
                  </td>

                  {/* Nível */}
                  <td className="p-3 text-center font-mono font-bold whitespace-nowrap">
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
                  <td className="p-3 text-right font-mono font-black text-amber-400 whitespace-nowrap">
                    {p.net_worth != null ? p.net_worth.toLocaleString() : '—'}
                  </td>

                  {/* CS */}
                  <td className="p-3 text-right font-mono text-gray-300 whitespace-nowrap">
                    <span className="font-semibold text-white">{p.last_hits ?? '—'}</span>
                    <span className="text-gray-500 mx-1">/</span>
                    <span className="text-gray-400">{p.denies ?? '—'}</span>
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
                    <span className="text-gray-500 mx-1">/</span>
                    <span className="text-cyan-400 font-bold">{p.xpm ?? '—'}</span>
                  </td>

                  {/* Itens */}
                  <td className="p-3 pr-4 whitespace-nowrap">
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

      {/* CARDS RESPONSIVOS PARA MOBILE (DISPOSITIVOS MÓVEIS) */}
      <div className="block md:hidden space-y-2">
        {players.map((p, i) => {
          const hImg = p.hero_id ? getHeroImg(constants, p.hero_id) : "";
          const hName = p.hero_id ? getHeroName(constants, p.hero_id) : "Herói desconhecido";
          const neutralImg = p.neutralItem ? getItemImg(constants, p.neutralItem) : null;
          const hasStats = p.kills !== null || p.net_worth !== null || p.last_hits !== null;

          return (
            <div
              key={i}
              className={`p-2.5 rounded-xl border bg-[#0E1118]/90 transition-all ${
                isRadiant ? 'border-emerald-500/25' : 'border-rose-500/25'
              }`}
            >
              {/* Topo do card: Herói, Jogador e KDA */}
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectHero && constants?.heroes?.[p.hero_id]) {
                      onSelectHero(constants.heroes[p.hero_id]);
                    }
                  }}
                  className="flex items-center gap-2 min-w-0 text-left group"
                >
                  <div className="relative shrink-0">
                    {hImg ? (
                      <img
                        src={hImg}
                        alt={hName}
                        className={`w-11 h-7 object-cover rounded border ${
                          isRadiant ? 'border-emerald-400' : 'border-rose-400'
                        } group-hover:ring-2 group-hover:ring-amber-400/50 transition-all`}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-11 h-7 rounded bg-white/5 border border-white/10 flex items-center justify-center text-[9px] text-gray-500 font-mono">
                        ?
                      </div>
                    )}
                    {p.level != null && (
                      <span className="absolute -bottom-1 -right-1 bg-black/90 border border-white/20 text-[9px] font-mono font-bold text-amber-300 px-1 rounded leading-tight">
                        L{p.level}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-white font-bold text-xs truncate block">{p.name}</span>
                    <span className="text-[10px] text-gray-400 truncate block group-hover:text-amber-400 transition-colors">{hName}</span>
                  </div>
                </button>

                {/* K / D / A */}
                <div className="flex flex-col items-end shrink-0">
                  <div className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded bg-black/60 border border-white/10">
                    <span className="font-bold text-white min-w-[14px] text-right">{p.kills ?? '—'}</span>
                    <span className="text-gray-500">/</span>
                    <span className="font-bold text-rose-400 min-w-[14px] text-center">{p.deaths ?? '—'}</span>
                    <span className="text-gray-500">/</span>
                    <span className="font-bold text-cyan-400 min-w-[14px] text-left">{p.assists ?? '—'}</span>
                  </div>
                  <span className="text-[8px] font-mono text-gray-500 uppercase mt-0.5">K / D / A</span>
                </div>
              </div>

              {/* Estatísticas secundárias: Patrimônio Líquido, CS, GPM/XPM */}
              {hasStats && (
                <div className="grid grid-cols-3 gap-1 pt-2 mt-2 border-t border-white/5 text-[10px] font-mono text-center">
                  <div className="bg-white/[0.02] p-1 rounded">
                    <div className="text-gray-500 text-[8px] uppercase">Patrimônio</div>
                    <div className="text-amber-400 font-bold truncate">
                      {p.net_worth != null
                        ? p.net_worth >= 1000
                          ? `${(p.net_worth / 1000).toFixed(1)}k`
                          : p.net_worth.toLocaleString()
                        : '—'}
                    </div>
                  </div>
                  <div className="bg-white/[0.02] p-1 rounded">
                    <div className="text-gray-500 text-[8px] uppercase">CS (LH/DN)</div>
                    <div className="text-gray-300 font-semibold truncate">
                      {p.last_hits ?? '—'} <span className="text-gray-600">/</span> {p.denies ?? '—'}
                    </div>
                  </div>
                  <div className="bg-white/[0.02] p-1 rounded">
                    <div className="text-gray-500 text-[8px] uppercase">GPM / XPM</div>
                    <div className="text-gray-300 font-semibold truncate">
                      <span className="text-amber-300">{p.gpm ?? '—'}</span>{' '}
                      <span className="text-gray-600">/</span>{' '}
                      <span className="text-cyan-300">{p.xpm ?? '—'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Itens do Inventário se disponíveis */}
              {p.items && p.items.length > 0 && (
                <div className="flex items-center gap-1.5 pt-1.5 mt-1.5 border-t border-white/5">
                  <span className="text-[8px] font-mono text-gray-500 uppercase shrink-0">Itens:</span>
                  <div className="flex items-center gap-1 overflow-x-auto">
                    {Array.from({ length: 6 }).map((_, itIdx) => {
                      const itId = p.items[itIdx];
                      const itImg = itId ? getItemImg(constants, itId) : null;
                      return (
                        <div
                          key={itIdx}
                          className="w-5 h-4 rounded bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0"
                        >
                          {itImg ? (
                            <img src={itImg} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="w-1 h-1 rounded-full bg-white/10" />
                          )}
                        </div>
                      );
                    })}
                    {neutralImg && (
                      <div
                        title="Item Neutro"
                        className="w-5 h-4 rounded bg-amber-500/20 border border-amber-400/60 flex items-center justify-center overflow-hidden shrink-0 ml-1"
                      >
                        <img src={neutralImg} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#0C0F16] border border-rose-500/40 rounded-2xl p-3 sm:p-7 shadow-2xl overflow-hidden my-auto max-h-[96vh] sm:max-h-[92vh] flex flex-col">
        {/* BOTÃO FECHAR */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 sm:p-2 rounded-xl bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-all z-20"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* CABEÇALHO DO AO VIVO */}
        <div className="text-center border-b border-white/10 pb-3 sm:pb-4 mb-3 sm:mb-4 relative z-10 shrink-0">
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap text-[10px] sm:text-[11px]">
            <span className="flex items-center gap-1.5 font-extrabold uppercase tracking-widest text-rose-400 bg-rose-500/20 border border-rose-500/30 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full animate-pulse">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-rose-500 animate-ping" />
              Partida Ao Vivo {timeFormatted ? `· ${timeFormatted}` : ''}
            </span>
            <span className="text-gray-400 font-bold uppercase tracking-wider bg-white/5 border border-white/10 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
              {leagueName} ({formatStr})
            </span>
            <button
              type="button"
              onClick={syncMatchData}
              title="Clique para sincronizar telemetria da Valve agora"
              className="text-emerald-400/90 hover:text-emerald-300 font-mono bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 px-2 sm:px-2.5 py-0.5 rounded-full flex items-center gap-1 cursor-pointer transition-all"
            >
              <RefreshCw className="w-2.5 h-2.5 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} /> A cada 20s ({lastSync})
            </button>
            {matchData?.spectators > 0 && (
              <span className="text-cyan-400 font-mono bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Eye className="w-2.5 h-2.5" /> {matchData.spectators.toLocaleString()} GOTV
              </span>
            )}
            {matchData?.roshan_respawn_timer !== undefined && matchData?.roshan_respawn_timer !== null && (
              matchData.roshan_respawn_timer > 0 ? (
                <span className="text-amber-400 font-mono bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                  Roshan ({Math.floor(matchData.roshan_respawn_timer / 60)}m {matchData.roshan_respawn_timer % 60}s)
                </span>
              ) : (
                <span className="text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  Roshan no Pit
                </span>
              )
            )}
            {matchData?.is_live_telemetry && (
              <span className="text-purple-400 font-mono bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
                Valve GOTV Oficial
              </span>
            )}
          </div>

          {/* Placar Principal do Jogo (Abates) */}
          <div className="flex items-center justify-between sm:justify-center gap-2 sm:gap-8 mt-3 px-1">
            <div
              onClick={() => onOpenTeamProfile && onOpenTeamProfile(null, teamAName)}
              className="text-right flex-1 truncate flex items-center justify-end gap-1.5 sm:gap-3 cursor-pointer group"
              title={`Ver Perfil de ${teamAName}`}
            >
              <span className="text-xs sm:text-xl font-black text-white truncate block group-hover:text-amber-400 transition-colors">{teamAName}</span>
              <TeamLogo
                teamName={teamAName}
                logoUrl={logoA}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-black/40 border border-white/10 p-0.5 shrink-0 group-hover:scale-105 transition-transform"
              />
            </div>

            <div className="flex flex-col items-center shrink-0">
              {hasScore ? (
                <div className="px-3.5 py-1 sm:px-5 sm:py-2 rounded-xl bg-black/80 border border-rose-500/40 font-mono text-lg sm:text-3xl font-black text-amber-400 shadow-lg shadow-rose-500/10">
                  {scoreA} <span className="text-gray-500 mx-0.5 sm:mx-1">:</span> {scoreB}
                </div>
              ) : (
                <div className="px-3 py-1 sm:px-5 sm:py-2 rounded-xl bg-black/60 border border-white/10 font-mono text-xs sm:text-sm font-bold text-gray-400">
                  Aguardando dados
                </div>
              )}
              <span className="text-[8px] sm:text-[9px] text-gray-400 font-mono mt-0.5 sm:mt-1 uppercase tracking-wider">
                Placar de Abates
              </span>

              {/* Vantagem de Ouro da Equipe */}
              {matchData?.radiant_lead !== undefined && matchData?.radiant_lead !== null && matchData?.radiant_lead !== 0 && (
                <div className={`mt-1 text-[9px] sm:text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                  matchData.radiant_lead > 0
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  {matchData.radiant_lead > 0
                    ? `${teamAName} +${(Math.abs(matchData.radiant_lead) / 1000).toFixed(1)}k ouro`
                    : `${teamBName} +${(Math.abs(matchData.radiant_lead) / 1000).toFixed(1)}k ouro`}
                </div>
              )}
            </div>

            <div
              onClick={() => onOpenTeamProfile && onOpenTeamProfile(null, teamBName)}
              className="text-left flex-1 truncate flex items-center justify-start gap-1.5 sm:gap-3 cursor-pointer group"
              title={`Ver Perfil de ${teamBName}`}
            >
              <TeamLogo
                teamName={teamBName}
                logoUrl={logoB}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-black/40 border border-white/10 p-0.5 shrink-0 group-hover:scale-105 transition-transform"
              />
              <span className="text-xs sm:text-xl font-black text-white truncate block group-hover:text-amber-400 transition-colors">{teamBName}</span>
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
              {/* ORDEM DO DRAFT (CAPTAIN'S MODE: PICKS & BANS) */}
              {renderCaptainsModeDraft()}

              {/* STATUS DAS TORRES E BARRACAS (SOMENTE QUANDO A API FORNECE OS DADOS) */}
              {(radiantStructures.hasData || direStructures.hasData) && (
                <div className="bg-[#141824]/80 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      <Castle className="w-3.5 h-3.5 text-amber-400" /> Torres & Barracas (Top / Mid / Bot / Base)
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-mono">
                      <span className="text-emerald-400 font-bold">{teamAName}: {radiantAliveCount}/18</span>
                      <span className="text-gray-500">·</span>
                      <span className="text-rose-400 font-bold">{teamBName}: {direAliveCount}/18</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                    {renderStructureColumns(radiantStructures, teamAName, true, radiantAliveCount)}
                    {renderStructureColumns(direStructures, teamBName, false, direAliveCount)}
                  </div>
                </div>
              )}

              {/* TABELAS DE JOGADORES (SOMENTE QUANDO A API RETORNA JOGADORES) */}
              {hasPlayerData ? (
                <>
                  {!hasDetailedStats && (
                    <div className="flex items-center gap-2 p-2.5 sm:p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 text-[10px] sm:text-xs text-purple-200 font-mono">
                      <Radio className="w-3.5 h-3.5 text-purple-400 shrink-0 animate-pulse" />
                      <span>
                        Transmissão ao vivo oficial do Dota Coordinator. Placar, torres, vantagem de ouro e draft em tempo real. K/D/A e inventário individual consolidados no relatório pós-jogo.
                      </span>
                    </div>
                  )}
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
