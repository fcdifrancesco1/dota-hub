import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
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

// Conteúdo completo de uma partida ao vivo, exibido em página própria
// (rota /ao-vivo/:matchKey — ver pages/LiveMatchPage.jsx).
export default function LiveMatchDetail({
  game,
  constants,
  onOpenTeamProfile,
  onSelectHero
}) {
  const [loading, setLoading] = useState(!game?.players?.length);
  const [matchData, setMatchData] = useState(game || null);
  const [mapsList, setMapsList] = useState([]);
  const [activeMapIndex, setActiveMapIndex] = useState(0);
  const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString('pt-BR'));
  const [syncing, setSyncing] = useState(false);
  const selectedMapIdRef = useRef(game?.match_id ? String(game.match_id) : null);

  // 1. Sincronização e Busca da Telemetria Oficial
  const syncMatchData = useCallback(async (forceReplay = false) => {
    if (!game) return;
    setSyncing(true);
    try {
      const targetMatchId = selectedMapIdRef.current || game.match_id;

      if (forceReplay && targetMatchId) {
        const fullData = await fetchMatchDetails(targetMatchId);
        if (fullData && fullData.players?.some(p => p.kills !== null && p.kills !== undefined)) {
          setMatchData({ ...fullData, _syncTimestamp: Date.now() });
          setLastSync(new Date().toLocaleTimeString('pt-BR'));
          return;
        }
      }

      const result = await findLiveMatchDetails({ ...game, match_id: targetMatchId });
      const maps = result?.maps || [];
      setMapsList(maps);

      if (result?.matchData) {
        setMatchData({ ...result.matchData, _syncTimestamp: Date.now() });

        // Identifica e marca o índice do mapa correspondente na barra de abas
        const curId = String(result.matchData.match_id || targetMatchId || '');
        const matchedIdx = maps.findIndex(m => String(m.match_id) === curId);
        if (matchedIdx !== -1) {
          setActiveMapIndex(matchedIdx);
        } else if (!selectedMapIdRef.current && maps.length > 0) {
          setActiveMapIndex(maps.length - 1);
        }
      } else {
        setMatchData(null);
      }
      setLastSync(new Date().toLocaleTimeString('pt-BR'));
    } catch (e) {
      console.warn("Aviso ao sincronizar telemetria:", e);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [game]);

  // 2. Sincronização a cada 20 segundos com dados reais da API
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
    selectedMapIdRef.current = String(mapId);
    setLoading(true);
    try {
      // 1. Tenta carregar os detalhes completos do replay (OpenDota /matches/:id)
      const fullData = await fetchMatchDetails(mapId);
      if (fullData && Array.isArray(fullData.players) && fullData.players.length === 10 && fullData.players.some(p => p.kills !== null && p.kills !== undefined)) {
        setMatchData({ ...fullData, _syncTimestamp: Date.now() });
        setLoading(false);
        return;
      }
      // 2. Se for um mapa ainda ao vivo, busca telemetria ao vivo da Valve
      const liveRes = await findLiveMatchDetails({ ...game, match_id: mapId });
      if (liveRes?.matchData) {
        setMatchData({ ...liveRes.matchData, _syncTimestamp: Date.now() });
      }
    } catch (e) {
      console.warn("Erro ao trocar mapa:", e);
    } finally {
      setLoading(false);
    }
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
    const heroId = pick(p, ['hero_id']) || 0;
    const rawItems = [
      p.item_0, p.item_1, p.item_2, p.item_3, p.item_4, p.item_5,
      p.item0, p.item1, p.item2, p.item3, p.item4, p.item5,
      ...(Array.isArray(p.items) ? p.items : [])
    ].filter((v) => v !== undefined && v !== null && v !== 0 && v !== "");
    const items = rawItems.slice(0, 6);
    const buybackCount = pick(p, ['buyback_count']);

    const killsVal = pick(p, ['kills']);
    const deathsVal = pick(p, ['deaths', 'death']);
    const assistsVal = pick(p, ['assists']);
    const levelVal = pick(p, ['level', 'lvl']);
    const netWorthVal = pick(p, ['net_worth', 'gold', 'total_gold']);
    const lhVal = pick(p, ['last_hits', 'lh']);
    const dnVal = pick(p, ['denies', 'dn']);
    const gpmVal = pick(p, ['gold_per_min', 'gpm']);
    const xpmVal = pick(p, ['xp_per_min', 'xpm']);

    // Só dados publicados pela API; campos ausentes aparecem como "—" na tabela
    const slotNum = p.team_slot || (idx + 1);

    return {
      slot: isRadiant ? idx : idx + 5,
      team_slot: slotNum,
      name: pick(p, ['name', 'personaname']) || `${teamName} Pos ${slotNum}`,
      hero_id: heroId,
      level: levelVal,
      kills: killsVal,
      deaths: deathsVal,
      assists: assistsVal,
      last_hits: lhVal,
      denies: dnVal,
      gpm: gpmVal,
      xpm: xpmVal,
      net_worth: netWorthVal,
      buybackCount,
      items,
      neutralItem: pick(p, ['item_neutral', 'neutral_item']),
      isRadiant
    };
  };

  const radiantPlayers = rawRadiant.map((p, idx) => buildPlayer(p, idx, true));
  const direPlayers = rawDire.map((p, idx) => buildPlayer(p, idx, false));
  const hasPlayerData = radiantPlayers.length > 0 || direPlayers.length > 0;

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
              : 'bg-surface border-white/10 hover:border-rose-500/40 hover:scale-105 opacity-80 hover:opacity-100'
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
      <div className="bg-surface-2 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              Ordem do Draft (Captain&apos;s Mode: Picks & Bans)
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
      <div className={`bg-surface border ${isRadiant ? 'border-emerald-500/20' : 'border-rose-500/20'} rounded-xl p-2.5 space-y-2`}>
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
          <TeamLogo
            teamName={teamName}
            teamId={isRadiant ? (matchData?.radiant_team?.team_id || game.team_id_radiant || game.radiant_team_id) : (matchData?.dire_team?.team_id || game.team_id_dire || game.dire_team_id)}
            logoUrl={isRadiant ? (matchData?.logoA || logoA) : (matchData?.logoB || logoB)}
            className="w-5 h-5 rounded shrink-0"
          />
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
      <div className="hidden md:block overflow-x-auto rounded-xl border border-white/10 bg-surface/80">
        <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
          <thead className="bg-surface-2/90 text-gray-400 font-mono text-[10px] uppercase border-b border-white/10">
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
                        <span className="text-white font-bold truncate max-w-[150px] sm:max-w-[200px] block">{p.name}</span>
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
              className={`p-2.5 rounded-xl border bg-surface/90 transition-all ${
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



  const scoreboardTeam = (side) => {
    const isRadiant = side === 'radiant';
    const name = isRadiant ? teamAName : teamBName;
    return (
      <button
        type="button"
        onClick={() => onOpenTeamProfile && onOpenTeamProfile(name)}
        className={`flex flex-col items-center text-center gap-2 lg:gap-4 flex-1 min-w-0 group ${isRadiant ? 'lg:flex-row lg:justify-end lg:text-right' : 'lg:flex-row-reverse lg:justify-end lg:text-left'}`}
        title={`Ver perfil de ${name}`}
      >
        <div className="min-w-0 max-w-full order-2 lg:order-1">
          <span className="block text-sm sm:text-xl lg:text-3xl font-black text-white leading-tight break-words line-clamp-2 group-hover:text-amber-400 transition-colors">{name}</span>
          <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest ${isRadiant ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isRadiant ? 'Radiant' : 'Dire'}
          </span>
        </div>
        <TeamLogo
          teamName={name}
          teamId={isRadiant
            ? (matchData?.radiant_team?.team_id || game.team_id_radiant || game.radiant_team_id)
            : (matchData?.dire_team?.team_id || game.team_id_dire || game.dire_team_id)}
          logoUrl={isRadiant ? (matchData?.logoA || logoA) : (matchData?.logoB || logoB)}
          className="order-1 lg:order-2 w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-black/40 border border-white/10 p-2 shrink-0 group-hover:scale-105 transition-transform"
        />
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* CABEÇALHO: STATUS, PLACAR E MAPAS DA SÉRIE */}
      <section className="relative overflow-hidden rounded-2xl border border-rose-500/30 bg-gradient-to-br from-surface-2 via-surface to-surface-2 p-4 sm:p-8 shadow-2xl">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[480px] h-[240px] rounded-full bg-rose-600/10 blur-3xl pointer-events-none" />

        <div className="relative flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap text-[10px] sm:text-[11px]">
          <span className="flex items-center gap-1.5 font-extrabold uppercase tracking-widest text-rose-400 bg-rose-500/20 border border-rose-500/30 px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            Ao Vivo {timeFormatted ? `· ${timeFormatted}` : ''}
          </span>
          <span className="text-gray-300 font-bold uppercase tracking-wider bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
            {leagueName} ({formatStr})
          </span>
          {matchData?.spectators > 0 && (
            <span className="text-cyan-400 font-mono bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Eye className="w-3 h-3" /> {matchData.spectators.toLocaleString()} assistindo na GOTV
            </span>
          )}
          {matchData?.roshan_respawn_timer !== undefined && matchData?.roshan_respawn_timer !== null && (
            matchData.roshan_respawn_timer > 0 ? (
              <span className="text-amber-400 font-mono bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                Roshan volta em {Math.floor(matchData.roshan_respawn_timer / 60)}m {matchData.roshan_respawn_timer % 60}s
              </span>
            ) : (
              <span className="text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                Roshan no Pit
              </span>
            )
          )}
          <button
            type="button"
            onClick={() => syncMatchData(true)}
            title="Sincronizar telemetria agora"
            className="text-emerald-400/90 hover:text-emerald-300 font-mono bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1 transition-all"
          >
            <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} /> {syncing ? 'Sincronizando...' : `Atualizado às ${lastSync}`}
          </button>
        </div>

        {/* Placar principal */}
        <div className="relative flex items-center justify-between gap-3 sm:gap-10 mt-6 sm:mt-8">
          {scoreboardTeam('radiant')}

          <div className="flex flex-col items-center shrink-0">
            {hasScore ? (
              <div className="flex items-center gap-2 sm:gap-4 px-4 sm:px-7 py-2 sm:py-3 rounded-2xl bg-black/70 border border-rose-500/40 font-mono text-3xl sm:text-6xl font-black shadow-lg shadow-rose-500/10">
                <span className="text-emerald-400">{scoreA}</span>
                <span className="text-gray-600 text-2xl sm:text-4xl">:</span>
                <span className="text-rose-400">{scoreB}</span>
              </div>
            ) : (
              <div className="px-4 py-2 rounded-xl bg-black/60 border border-white/10 font-mono text-sm font-bold text-gray-400">
                Aguardando dados
              </div>
            )}
            <span className="text-[9px] sm:text-[10px] text-gray-400 font-mono mt-1.5 uppercase tracking-wider">Placar de abates</span>

            {matchData?.radiant_lead !== undefined && matchData?.radiant_lead !== null && matchData?.radiant_lead !== 0 && (
              <div className={`mt-2 text-[10px] sm:text-xs font-mono font-bold px-3 py-1 rounded-full flex items-center gap-1.5 border ${
                matchData.radiant_lead > 0
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                {matchData.radiant_lead > 0 ? teamAName : teamBName} +{(Math.abs(matchData.radiant_lead) / 1000).toFixed(1)}k de ouro
              </div>
            )}
          </div>

          {scoreboardTeam('dire')}
        </div>

        {game.streamUrl && (
          <div className="relative mt-6 flex justify-center">
            <a
              href={game.streamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-extrabold text-xs transition-all shadow-md"
            >
              <Tv className="w-4 h-4" /> Assistir transmissão ao vivo
            </a>
          </div>
        )}

        {/* Mapas da série */}
        {mapsList.length > 1 && (
          <div className="relative flex items-center justify-center gap-2 mt-6 pt-4 border-t border-white/5 flex-wrap">
            {mapsList.map((m, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectMap(m.match_id, idx)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono uppercase transition-all ${
                  activeMapIndex === idx
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/25 font-black'
                    : 'bg-white/5 text-gray-300 hover:text-white border border-white/10 hover:bg-white/10'
                }`}
              >
                <Swords className="w-3.5 h-3.5" />
                <span className="font-extrabold">Jogo {m.mapNumber}</span>
                {m.radiant_score !== undefined && m.dire_score !== undefined && (
                  <span className="font-black">({m.radiant_score} : {m.dire_score})</span>
                )}
                {m.is_live ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-500/30 text-rose-300 text-[9px] font-black border border-rose-500/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" /> AO VIVO
                  </span>
                ) : m.is_finished ? (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                    activeMapIndex === idx
                      ? 'bg-black/20 text-black border-black/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}>
                    FINALIZADO
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        )}
      </section>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-gray-400 rounded-2xl border border-line bg-surface">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          <span className="text-xs font-semibold">Sincronizando dados oficiais da partida...</span>
        </div>
      ) : !matchData ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-center text-gray-400 rounded-2xl border border-line bg-surface">
          <Radio className="w-10 h-10 text-amber-500/40" />
          <span className="text-sm font-bold text-white">Ainda não há telemetria oficial publicada para esta partida</span>
          <span className="text-xs text-gray-500 max-w-md">
            Assim que a OpenDota ou a Valve publicarem placar, torres e jogadores, eles aparecem aqui automaticamente (nova checagem a cada 20s).
          </span>
        </div>
      ) : (
        <>
          {/* DRAFT EM LARGURA TOTAL */}
          {renderCaptainsModeDraft()}

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* JOGADORES */}
            <div className="xl:col-span-8 space-y-6 min-w-0">
              {hasPlayerData ? (
                <>
                  {renderTable(radiantPlayers, teamAName, true, scoreA)}
                  {renderTable(direPlayers, teamBName, false, scoreB)}
                </>
              ) : (
                <div className="text-center py-10 text-gray-500 text-xs rounded-2xl border border-line bg-surface">
                  Estatísticas individuais dos jogadores ainda não foram publicadas pela API para esta partida.
                </div>
              )}
            </div>

            {/* COLUNA LATERAL: OBJETIVOS */}
            <aside className="xl:col-span-4 space-y-4 xl:sticky xl:top-24">
              {(radiantStructures.hasData || direStructures.hasData) ? (
                <div className="bg-surface-2/80 border border-white/10 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-amber-400">
                      <Castle className="w-4 h-4 text-amber-400" /> Torres & Barracas
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono">
                      <span className="text-emerald-400 font-bold">{radiantAliveCount}/18</span>
                      <span className="text-gray-500">·</span>
                      <span className="text-rose-400 font-bold">{direAliveCount}/18</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2 text-[10px]">
                    {renderStructureColumns(radiantStructures, teamAName, true, radiantAliveCount)}
                    {renderStructureColumns(direStructures, teamBName, false, direAliveCount)}
                  </div>
                </div>
              ) : (
                <div className="bg-surface-2/80 border border-white/10 rounded-2xl p-4 text-xs text-gray-500 text-center">
                  Status de torres e barracas ainda não disponível.
                </div>
              )}
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
