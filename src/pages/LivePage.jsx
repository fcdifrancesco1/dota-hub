import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Radio,
  RefreshCw,
  Tv,
  Maximize2,
  Minimize2,
  Calendar,
  Clock,
  ExternalLink,
  Shield,
  Swords,
  ChevronRight,
  LayoutGrid
} from 'lucide-react';
import { useApp, findLiveGameFor } from '../context/AppContext';
import { useOpenLiveMatch } from '../utils/liveMatchRoute';
import TeamLogo, { getTeamLogo } from '../utils/teamLogos';
import BetweenMapsCard from '../components/BetweenMapsCard';
import { seriesTypeLabel } from '../utils/seriesStatus';
import { getHeroImg, getHeroName } from '../services/api';
import { matchForTitle } from '../../api/_lib/matchStreams.js';

// Player embutido e página de cada plataforma (embed = canal ou, no YouTube, o vídeo ao vivo)
const PLATFORMS = {
  twitch: {
    label: 'Twitch',
    player: (s) => `https://player.twitch.tv/?channel=${s.embed}&parent=${window.location.hostname}&autoplay=false`,
    page: (s) => `https://www.twitch.tv/${s.embed}`
  },
  youtube: {
    label: 'YouTube',
    player: (s) => `https://www.youtube.com/embed/${s.embed}`,
    page: (s) => `https://www.youtube.com/watch?v=${s.embed}`
  },
  kick: {
    label: 'Kick',
    player: (s) => `https://player.kick.com/${s.embed}?autoplay=false`,
    page: (s) => `https://kick.com/${s.embed}`
  }
};

// Quantos canais cabem lado a lado sem cada player ficar pequeno demais
const MAX_SIDE_BY_SIDE = 4;

export default function LivePage() {
  const {
    liveGames,
    betweenMaps,
    loadingRefresh,
    refreshData,
    upcomingMatches,
    constants
  } = useApp();

  const openLiveMatch = useOpenLiveMatch();
  // Mapas ao vivo + séries em andamento esperando o próximo mapa
  const liveTotal = (liveGames?.length || 0) + (betweenMaps?.length || 0);
  const [activeStream, setActiveStream] = useState(null);
  const [showStream, setShowStream] = useState(true);
  const [theaterMode, setTheaterMode] = useState(false);
  // Lado a lado: vários canais ao mesmo tempo (clicar num canal põe ou tira da tela)
  const [multi, setMulti] = useState(false);
  const [grid, setGrid] = useState([]);

  // Só os canais (Twitch, YouTube, Kick) que estão transmitindo uma partida agora (/api/live?streams=1);
  // null enquanto carrega
  const [matchStreams, setMatchStreams] = useState(null);
  const userPicked = useRef(false);
  useEffect(() => {
    let cancelled = false;
    const load = () => fetch('/api/live?streams=1')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        // Canais sem partida identificada ficam: o título ainda pode apontar um jogo ao vivo (ver streams)
        const found = (data?.streams || []).map((s) => ({
          id: `${s.platform || 'twitch'}:${s.embed || s.channel}`,
          key: `live-${s.platform || 'twitch'}-${s.embed || s.channel}`,
          platform: s.platform || 'twitch',
          embed: s.embed || s.channel,
          name: s.channel,
          lang: s.lang,
          title: s.title,
          timeA: s.timeA,
          timeB: s.timeB
        }));
        setMatchStreams(found);
        // Lado a lado: tira da tela os canais que saíram do ar
        setGrid((cur) => cur.map((g) => found.find((s) => s.id === g.id)).filter(Boolean));
        // Até a pessoa escolher, fica no primeiro canal; se o escolhido saiu do ar, troca também
        setActiveStream((cur) => {
          const still = cur && found.find((s) => s.id === cur.id);
          if (still && userPicked.current) return still;
          userPicked.current = false;
          return still || found.find((s) => s.timeA) || null;
        });
      })
      .catch(() => { if (!cancelled) setMatchStreams((prev) => prev || []); });
    load();
    const timer = setInterval(load, 120000);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  const pickStream = (s) => {
    if (multi) {
      setGrid((cur) => (cur.some((g) => g.id === s.id) ? cur.filter((g) => g.id !== s.id) : [...cur, s].slice(-MAX_SIDE_BY_SIDE)));
      return;
    }
    userPicked.current = true;
    setActiveStream(s);
  };
  const toggleMulti = () => {
    if (multi) {
      if (grid[0]) { userPicked.current = true; setActiveStream(grid[0]); }
    } else {
      setGrid(activeStream ? [activeStream] : []);
    }
    setMulti(!multi);
  };
  const isOnScreen = (s) => (multi ? grid.some((g) => g.id === s.id) : activeStream?.key === s.key);
  const playerFor = (s) => (
    <iframe
      key={s.id}
      src={PLATFORMS[s.platform].player(s)}
      height="100%"
      width="100%"
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      allowFullScreen
      title={`${s.timeA} x ${s.timeB} · ${s.name}`}
      className="w-full h-full border-0"
    />
  );
  // A Liquipedia põe o link só na 1ª partida de cada stream, e o título cita várias
  // ("Aurora vs Astra, Yandex vs NAVI"): se a partida ligada ao canal não está ao vivo,
  // fica a do título que a Valve mostra ao vivo agora.
  const streams = useMemo(() => {
    if (!matchStreams) return matchStreams;
    const live = (liveGames || []).map((g) => ({ timeA: g.radiant_name || g.team1, timeB: g.dire_name || g.team2 }));
    return matchStreams.map((s) => {
      if (s.timeA && findLiveGameFor({ timeA: s.timeA, timeB: s.timeB }, liveGames)) return s;
      const now = matchForTitle(s.title, live);
      return now ? { ...s, timeA: now.timeA, timeB: now.timeB } : s;
    }).filter((s) => s.timeA && s.timeB);
  }, [matchStreams, liveGames]);
  const current = (s) => (s && streams?.find((x) => x.id === s.id)) || s;
  // Sem canal escolhido (todos chegaram sem partida e só o título os identificou): abre o primeiro
  useEffect(() => {
    if (!activeStream && streams?.length) setActiveStream(streams[0]);
  }, [activeStream, streams]);
  const streamsForGame = (game) => (streams || []).filter((s) => findLiveGameFor({ timeA: s.timeA, timeB: s.timeB }, [game]));

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      refreshData();
    }, 30000);
    return () => clearInterval(timer);
  }, [refreshData]);

  return (
    <div className={`mx-auto px-4 sm:px-6 lg:px-8 py-6 min-h-screen ${theaterMode ? 'max-w-full' : 'max-w-[1680px]'}`}>
      
      {/* HEADER DA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-line">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white font-serif tracking-tight">
              Central ao vivo
            </h1>
          </div>
          <p className="text-gray-400 text-xs sm:text-sm">
            Partidas profissionais em andamento, atualizadas a cada 30 segundos, com os canais da Twitch, do YouTube e da Kick que estão transmitindo cada partida.
          </p>
        </div>

        {/* CONTROLES DO TOPO */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowStream(!showStream)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-medium transition-[color,background-color,border-color,opacity,transform] ${
              showStream
                ? 'bg-purple-950/60 border-purple-800/60 text-purple-300'
                : 'bg-surface-2 border-line text-gray-400 hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>{showStream ? 'Ocultar transmissão' : 'Abrir transmissão'}</span>
          </button>

          <button
            onClick={refreshData}
            disabled={loadingRefresh}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-2 border border-line hover:border-amber-500/40 text-xs font-medium text-gray-300 hover:text-white transition-[color,background-color,border-color,opacity,transform] disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingRefresh ? 'animate-spin text-amber-400' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* REPRODUTOR DE STREAM INTEGRADO (TWITCH / EMBED) */}
      {showStream && (
        <div className="mb-8 rounded-3xl overflow-hidden glass-panel border border-line shadow-2xl transition-[color,background-color,border-color,opacity,transform]">
          {/* BARRA DE CANAIS DA TRANSMISSÃO */}
          <div className="p-3.5 bg-surface-2/80 border-b border-line flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full animate-pulse bg-purple-500"></span>
              <span className="font-medium text-white">{multi ? 'Lado a lado:' : 'Canal ativo:'}</span>
              {multi ? (
                <span className="text-gray-300">
                  {grid.length} de {MAX_SIDE_BY_SIDE} canais · clique num canal para pôr ou tirar da tela
                </span>
              ) : activeStream ? (
                <>
                  <span className="text-purple-400 font-mono font-medium">{activeStream.name}</span>
                  {activeStream.lang && (
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {activeStream.lang}
                    </span>
                  )}
                  <span className="text-gray-300">· {current(activeStream).timeA} x {current(activeStream).timeB}</span>
                  <a
                    href={PLATFORMS[activeStream.platform].page(activeStream)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-amber-400 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir no {PLATFORMS[activeStream.platform].label}</span>
                  </a>
                </>
              ) : (
                <span className="text-gray-400">nenhum</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {streams?.map((s) => (
                <button
                  key={s.key}
                  onClick={() => pickStream(s)}
                  aria-pressed={isOnScreen(s)}
                  title={s.title || s.name}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium transition-[color,background-color,border-color,opacity,transform] ${
                    isOnScreen(s)
                      ? 'bg-purple-600 text-on-accent'
                      : 'bg-surface-2 border border-line text-gray-400 hover:text-white hover:border-amber-500/30'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" title="Ao vivo agora" />
                  {s.timeA} x {s.timeB}
                  <span className="text-[11px] opacity-70">{PLATFORMS[s.platform].label}</span>
                  {s.lang && <span className="text-[11px] uppercase opacity-70">{s.lang}</span>}
                </button>
              ))}

              <button
                onClick={toggleMulti}
                aria-pressed={multi}
                title={multi ? 'Voltar para um canal' : 'Ver vários canais lado a lado'}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-medium ml-2 ${
                  multi ? 'bg-purple-950/60 border-purple-700/60 text-purple-300' : 'bg-surface-2 border-line text-gray-400 hover:text-white hover:border-amber-500/30'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Lado a lado</span>
              </button>

              <button
                onClick={() => setTheaterMode(!theaterMode)}
                title={theaterMode ? 'Modo normal' : 'Modo teatro'}
                className="p-1.5 rounded-xl bg-surface-2 border border-line text-gray-400 hover:text-white hover:border-amber-500/30 ml-2"
              >
                {theaterMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* PLAYER RESPONSIVO */}
          {multi && grid.length > 0 ? (
            <div className={`grid gap-1 bg-black ${grid.length > 1 ? 'md:grid-cols-2' : ''}`}>
              {grid.map((s) => (
                <div key={s.id} className="relative aspect-video bg-black">
                  {playerFor(s)}
                  <button
                    onClick={() => pickStream(s)}
                    className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/70 text-[11px] text-gray-200 hover:text-white"
                    title="Tirar da tela"
                  >
                    {current(s).timeA} x {current(s).timeB} · {PLATFORMS[s.platform].label} ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
          <div className={`w-full bg-black ${theaterMode ? 'aspect-[21/9] max-h-[70vh]' : 'aspect-video max-h-[580px]'}`}>
            {!multi && activeStream ? playerFor(activeStream) : multi ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-center px-6">
                <LayoutGrid className="w-10 h-10 text-gray-600" />
                <p className="text-sm font-medium text-gray-200">Escolha os canais acima</p>
                <p className="text-xs text-gray-500">Cada canal que você clicar abre ao lado dos outros, até {MAX_SIDE_BY_SIDE}.</p>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-center px-6">
                {matchStreams === null ? (
                  <RefreshCw className="w-6 h-6 text-gray-500 animate-spin" />
                ) : (
                  <>
                    <Tv className="w-10 h-10 text-gray-600" />
                    <p className="text-sm font-medium text-gray-200">Nenhuma partida sendo transmitida agora</p>
                    <p className="text-xs text-gray-500">Assim que um jogo começar, o canal dele aparece aqui.</p>
                  </>
                )}
              </div>
            )}
          </div>
          )}
        </div>
      )}

      {/* SEÇÃO DE PARTIDAS AO VIVO */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="dota-heading text-xs flex items-center gap-2.5">
            <span>Partidas ao vivo</span>
            <span className="font-mono tracking-normal text-[11px] text-white bg-red-500/15 border border-red-500/30 px-2 py-0.5 rounded-full">{liveTotal}</span>
          </h2>
          <span className="text-[11px] text-gray-400">
            Atualiza a cada 30 segundos
          </span>
        </div>

        {liveTotal > 0 ? (
          <div className="flex flex-col gap-4">
            {/* Um jogo por linha: a barra do jogo na largura toda, como a transmissão acima */}
            {liveGames.map((game, idx) => (
              <LiveHudCard
                key={game.match_id || idx}
                game={game}
                constants={constants}
                streams={streamsForGame(game)}
                onOpen={() => openLiveMatch(game)}
                onWatch={(st) => {
                  pickStream(st);
                  setShowStream(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            ))}
            {(betweenMaps || []).length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {betweenMaps.map((item) => (
                  <BetweenMapsCard key={item.key} item={item} large />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ESTADO VAZIO AMIGÁVEL */
          <div className="rounded-3xl glass-panel p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-xl border border-line">
            <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-line flex items-center justify-center mx-auto mb-4">
              <Radio className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-white tracking-tight mb-2">
              Nenhuma partida ao vivo no momento
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed max-w-md mx-auto mb-6">
              Assim que a próxima partida profissional começar, o placar, o draft e as estatísticas aparecerão aqui automaticamente.
            </p>

            {/* PRÓXIMAS PARTIDAS IMEDIATAS */}
            {upcomingMatches && upcomingMatches.length > 0 && (
              <div className="bg-surface-2 border border-line rounded-2xl p-4 text-left">
                <span className="text-[11px] font-semibold text-amber-400 block mb-2">
                  Próxima partida agendada:
                </span>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{upcomingMatches[0].timeA}</span>
                    <span className="text-gray-400 font-mono">vs</span>
                    <span className="font-medium text-white">{upcomingMatches[0].timeB}</span>
                  </div>
                  <span className="font-mono text-amber-400 font-medium">
                    {upcomingMatches[0].startTime || 'Em breve'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


const fmtClock = (secs) => {
  const s = Math.max(0, Math.floor(secs || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

// Os 5 heróis de um lado, na ordem do placar da Valve; sem jogadores, cai para os picks
function sideHeroes(players, picks) {
  const list = (players || []).filter((p) => p?.hero_id).slice(0, 5);
  const heroes = list.length ? list : (picks || []).slice(0, 5).map((hero_id) => ({ hero_id }));
  return [...heroes, ...Array(Math.max(0, 5 - heroes.length)).fill(null)];
}

/** Retrato do herói como na barra do topo do jogo: cinza com a contagem quando morto, nível e ultimate pronta. */
function HeroSlot({ p, constants }) {
  const img = p?.hero_id ? getHeroImg(p.hero_id, constants) : '';
  const name = p?.hero_id ? getHeroName(p.hero_id, constants) : 'Aguardando escolha';
  const dead = (p?.respawn_timer || 0) > 0;
  const label = dead ? `${name} · renasce em ${Math.ceil(p.respawn_timer)}s` : p?.level ? `${name} · nível ${p.level}` : name;
  return (
    <div className="relative aspect-[16/9] max-w-full overflow-hidden rounded-[3px] bg-black border border-black ring-1 ring-white/10" title={label}>
      {img ? (
        <img src={img} alt={label} loading="lazy"
          className={`w-full h-full object-cover transition-[filter] duration-300 ${dead ? 'grayscale brightness-[0.4]' : ''}`} />
      ) : null}
      {dead && (
        <span className="absolute inset-0 grid place-items-center font-mono text-sm lg:text-lg font-semibold text-white [text-shadow:0_1px_3px_#000]">
          {Math.ceil(p.respawn_timer)}
        </span>
      )}
      {!dead && p?.level ? (
        <span className="absolute left-0 bottom-0 px-1 font-mono text-[11px] font-semibold leading-[14px] text-white bg-black/75 rounded-tr-[3px]">
          {p.level}
        </span>
      ) : null}
      {!dead && p?.ultimate_state === 3 && (
        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400 ring-1 ring-black" title="Ultimate pronta" />
      )}
    </div>
  );
}

/**
 * Jogo ao vivo no formato da barra do topo do cliente: heróis do Radiant à esquerda,
 * abates e relógio no centro, heróis do Dire à direita.
 */
function LiveHudCard({ game, constants, streams, onOpen, onWatch }) {
  const radName = game.radiant_name || game.team1 || 'Radiant';
  const direName = game.dire_name || game.team2 || 'Dire';
  const radKills = game.radiant_score ?? game.score1 ?? 0;
  const direKills = game.dire_score ?? game.score2 ?? 0;
  const goldLead = game.radiant_lead || game.gold_lead || 0;
  const goldText = goldLead > 0 ? <><span className="text-emerald-400">+{(goldLead / 1000).toFixed(1)}k</span> ouro</>
    : goldLead < 0 ? <><span className="text-rose-400">+{(Math.abs(goldLead) / 1000).toFixed(1)}k</span> ouro</>
    : 'Ouro igual';
  const hasSeries = Number.isFinite(game.radiant_series_wins) && Number.isFinite(game.dire_series_wins) &&
    game.radiant_series_wins + game.dire_series_wins > 0;
  const radiant = sideHeroes(game.radiant_players, game.radiant_picks || game.picks?.radiant);
  const dire = sideHeroes(game.dire_players, game.dire_picks || game.picks?.dire);

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter') onOpen(); }}
      aria-label={`${radName} ${radKills} x ${direKills} ${direName}, ver partida`}
      className="tilt-card glass-panel rounded-2xl p-4 sm:p-5 cursor-pointer group flex flex-col gap-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
    >
      {/* Campeonato, formato e série */}
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 shrink-0 rounded-full bg-red-500 animate-pulse" aria-hidden="true" />
          <span className="font-semibold text-amber-400 truncate">{game.league_name || 'Torneio oficial'}</span>
        </span>
        <span className="shrink-0 font-mono text-[11px] text-gray-400 bg-surface-2 border border-line px-2 py-0.5 rounded-full">
          {seriesTypeLabel(game.series_type)}
          {hasSeries && ` · Série ${game.radiant_series_wins}:${game.dire_series_wins}`}
        </span>
      </div>

      {/* Barra do jogo */}
      <div className="grid grid-cols-2 sm:grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="col-span-2 sm:col-span-1 sm:order-1 grid grid-cols-5 gap-1 p-1 rounded-md bg-gradient-to-r from-transparent to-emerald-500/10">
          {radiant.map((p, i) => <HeroSlot key={`r${i}`} p={p} constants={constants} />)}
        </div>
        <div className="col-span-2 sm:col-span-1 order-first sm:order-2 flex flex-col items-center justify-center px-4 lg:px-8 py-2 lg:py-3 rounded-xl bg-surface-2 border border-line">
          <div className="flex items-baseline gap-3 font-mono font-semibold text-4xl lg:text-5xl leading-none">
            <span className="text-emerald-400">{radKills}</span>
            <span className="text-xl text-gray-500">:</span>
            <span className="text-rose-400">{direKills}</span>
          </div>
          <time className="mt-1.5 font-mono text-sm font-medium text-white">{fmtClock(game.duration)}</time>
          <span className="sm:hidden mt-0.5 font-mono text-[11px] text-gray-400">{goldText}</span>
        </div>
        <div className="col-span-2 sm:col-span-1 sm:order-3 grid grid-cols-5 gap-1 p-1 rounded-md bg-gradient-to-l from-transparent to-rose-500/10">
          {dire.map((p, i) => <HeroSlot key={`d${i}`} p={p} constants={constants} />)}
        </div>
      </div>

      {/* Times */}
      <div className="grid grid-cols-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <TeamLogo teamName={radName} teamId={game.team_id_radiant || game.radiant_team_id || game.radiant_team?.team_id}
            logoUrl={game.radiant_logo || game.logoA} className="w-8 h-8 lg:w-10 lg:h-10 shrink-0" />
          <div className="min-w-0">
            <div className="text-sm lg:text-base font-semibold text-white leading-tight line-clamp-2 break-words">{radName}</div>
            <div className="text-[11px] font-medium text-emerald-400">Radiant</div>
          </div>
        </div>
        <span className="hidden sm:block font-mono text-[11px] text-gray-400 text-center whitespace-nowrap">{goldText}</span>
        <div className="flex items-center gap-2.5 min-w-0 flex-row-reverse text-right">
          <TeamLogo teamName={direName} teamId={game.team_id_dire || game.dire_team_id || game.dire_team?.team_id}
            logoUrl={game.dire_logo || game.logoB} className="w-8 h-8 lg:w-10 lg:h-10 shrink-0" />
          <div className="min-w-0">
            <div className="text-sm lg:text-base font-semibold text-white leading-tight line-clamp-2 break-words">{direName}</div>
            <div className="text-[11px] font-medium text-rose-400">Dire</div>
          </div>
        </div>
      </div>

      {/* Onde assistir e abrir a partida */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-line">
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          {streams.length > 0 ? streams.map((st) => (
            <button
              key={st.key}
              type="button"
              onClick={(e) => { e.stopPropagation(); onWatch(st); }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600 hover:text-on-accent transition-colors"
            >
              <Tv className="w-3 h-3" aria-hidden="true" />
              {PLATFORMS[st.platform].label}{st.lang ? ` ${st.lang.toUpperCase()}` : ''}
            </button>
          )) : (
            <span className="text-[11px] text-gray-500">Sem transmissão encontrada</span>
          )}
        </div>
        <span className="shrink-0 flex items-center gap-1 text-xs font-semibold text-amber-400">
          Ver partida
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}
