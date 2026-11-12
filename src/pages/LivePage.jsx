import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  RefreshCw,
  Tv,
  Maximize2,
  Minimize2,
  Calendar,
  Clock,
  Zap,
  ExternalLink,
  Shield,
  Flame,
  Swords,
  ChevronRight
} from 'lucide-react';
import { useApp, findLiveGameFor } from '../context/AppContext';
import { useOpenLiveMatch } from '../utils/liveMatchRoute';
import TeamLogo, { getTeamLogo } from '../utils/teamLogos';
import BetweenMapsCard from '../components/BetweenMapsCard';
import { getHeroImg, getHeroName } from '../services/api';

// Canais oficiais das organizadoras. No YouTube, o vídeo ao vivo de cada canal é
// descoberto por /api/live?youtube=1 (o embed "live_stream?channel=" não é confiável).
const DEFAULT_STREAMS = [
  { id: 'esl_dota2br', key: 'tw-esl-br', name: 'ESL Dota 2 Brasil', platform: 'twitch', lang: 'pt-BR' },
  { id: 'esl_dota2', key: 'tw-esl', name: 'ESL Dota 2', platform: 'twitch', lang: 'en' },
  { id: 'blastdota', key: 'tw-blast', name: 'BLAST Dota', platform: 'twitch', lang: 'en' },
  { id: 'pgl_dota2', key: 'tw-pgl', name: 'PGL Dota 2', platform: 'twitch', lang: 'en' },
  { id: 'UCAvIC2XmBLLXFPdveirTrmw', key: 'yt-blast', name: 'BLAST SLAM Dota 2', platform: 'youtube', lang: 'en' },
  { id: 'UCaYLBJfw6d8XqmNlL204lNg', key: 'yt-esl', name: 'ESL Dota 2', platform: 'youtube', lang: 'en' },
  { id: 'UC7VWLs_Ivccq22rM2_xo0Rg', key: 'yt-pgl', name: 'PGL Dota 2', platform: 'youtube', lang: 'en' }
];

const PLATFORMS = [
  { id: 'twitch', label: 'Twitch' },
  { id: 'youtube', label: 'YouTube' }
];

function streamEmbedUrl(stream, youtubeLive) {
  if (stream.platform === 'youtube') {
    const videoId = youtubeLive?.[stream.id]?.videoId;
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=0` : null;
  }
  return `https://player.twitch.tv/?channel=${stream.id}&parent=${window.location.hostname}&autoplay=false`;
}

function streamPageUrl(stream) {
  return stream.platform === 'youtube'
    ? `https://www.youtube.com/channel/${stream.id}/live`
    : `https://www.twitch.tv/${stream.id}`;
}

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
  const [activeStream, setActiveStream] = useState(DEFAULT_STREAMS[0]);
  const [showStream, setShowStream] = useState(true);
  const [theaterMode, setTheaterMode] = useState(false);
  // { [channelId]: { live, videoId, title } } — null enquanto carrega
  const [youtubeLive, setYoutubeLive] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => fetch('/api/live?youtube=1')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.channels) return;
        setYoutubeLive(Object.fromEntries(data.channels.map((c) => [c.channelId, c])));
      })
      .catch(() => { if (!cancelled) setYoutubeLive((prev) => prev || {}); });
    load();
    const timer = setInterval(load, 120000);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  // Canais da Twitch transmitindo agora, com a partida de cada um (/api/live?streams=1)
  const [matchStreams, setMatchStreams] = useState([]);
  const userPicked = useRef(false);
  useEffect(() => {
    let cancelled = false;
    const load = () => fetch('/api/live?streams=1')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !Array.isArray(data?.streams)) return;
        const found = data.streams.map((s) => ({
          id: s.channel,
          key: `tw-live-${s.channel}`,
          name: s.channel,
          platform: 'twitch',
          lang: s.lang,
          live: true,
          title: s.title,
          timeA: s.timeA,
          timeB: s.timeB,
          tournament: s.tournament
        }));
        setMatchStreams(found);
        // Até a pessoa escolher um canal, abre o primeiro que está passando uma partida
        if (!userPicked.current && found.length) setActiveStream(found[0]);
      })
      .catch(() => {});
    load();
    const timer = setInterval(load, 120000);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  // Canais das partidas primeiro; os oficiais das organizadoras continuam como opção
  const streams = [...matchStreams, ...DEFAULT_STREAMS.filter((d) => !matchStreams.some((m) => m.id === d.id))];
  const pickStream = (s) => { userPicked.current = true; setActiveStream(s); };
  const streamLabel = (s) => (s.timeA && s.timeB ? `${s.timeA} x ${s.timeB}` : s.name);
  const streamsForGame = (game) => matchStreams.filter((s) => s.timeA && findLiveGameFor({ timeA: s.timeA, timeB: s.timeB }, [game]));

  const isChannelLive = (s) => Boolean(s.live) || (s.platform === 'youtube' && Boolean(youtubeLive?.[s.id]?.live));
  const embedUrl = streamEmbedUrl(activeStream, youtubeLive);

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
            Partidas profissionais em andamento, atualizadas a cada 30 segundos, com o canal da Twitch que está transmitindo cada partida.
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
              <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${activeStream.platform === 'youtube' ? 'bg-red-500' : 'bg-purple-500'}`}></span>
              <span className="font-medium text-white">Canal ativo:</span>
              <span className="text-purple-400 font-mono font-medium">{activeStream.name}</span>
              {activeStream.lang && (
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {activeStream.lang}
                </span>
              )}
              {activeStream.timeA && (
                <span className="text-gray-300">· {activeStream.timeA} x {activeStream.timeB}</span>
              )}
              <a
                href={streamPageUrl(activeStream)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-amber-400 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir no {activeStream.platform === 'youtube' ? 'YouTube' : 'Twitch'}</span>
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Alternância de plataforma */}
              <div className="flex items-center rounded-xl bg-surface border border-line p-0.5">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      if (activeStream.platform === p.id) return;
                      const options = streams.filter((s) => s.platform === p.id);
                      pickStream(options.find(isChannelLive) || options[0]);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-[color,background-color,border-color,opacity,transform] ${
                      activeStream.platform === p.id
                        ? (p.id === 'youtube' ? 'bg-red-600 text-on-accent' : 'bg-purple-600 text-on-accent')
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {streams.filter((s) => s.platform === activeStream.platform).map((s) => (
                <button
                  key={s.key}
                  onClick={() => pickStream(s)}
                  title={s.title || s.name}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium transition-[color,background-color,border-color,opacity,transform] ${
                    activeStream.key === s.key
                      ? 'bg-purple-600 text-on-accent'
                      : 'bg-surface-2 border border-line text-gray-400 hover:text-white hover:border-amber-500/30'
                  }`}
                >
                  {isChannelLive(s) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" title="Ao vivo agora" />
                  )}
                  {streamLabel(s)}
                  {s.live && s.lang && <span className="text-[11px] uppercase opacity-70">{s.lang}</span>}
                </button>
              ))}

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
          <div className={`w-full bg-black ${theaterMode ? 'aspect-[21/9] max-h-[70vh]' : 'aspect-video max-h-[580px]'}`}>
            {embedUrl ? (
              <iframe
                key={embedUrl}
                src={embedUrl}
                height="100%"
                width="100%"
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                title="Dota 2 live stream"
                className="w-full h-full border-0"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-center px-6">
                {youtubeLive === null ? (
                  <RefreshCw className="w-6 h-6 text-gray-500 animate-spin" />
                ) : (
                  <>
                    <Tv className="w-10 h-10 text-gray-600" />
                    <p className="text-sm font-medium text-gray-200">{activeStream.name} não está ao vivo no YouTube agora</p>
                    <p className="text-xs text-gray-500">
                      Escolha outro canal ou veja a programação no canal oficial.
                    </p>
                    <a
                      href={`https://www.youtube.com/channel/${activeStream.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Abrir canal no YouTube
                    </a>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SEÇÃO DE PARTIDAS AO VIVO */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-red-500" />
            <span>Partidas em Andamento ({liveTotal})</span>
          </h2>
          <span className="text-xs text-gray-500 font-mono">
            Auto-atualização: a cada 30 segundos
          </span>
        </div>

        {liveTotal > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {liveGames.map((game, idx) => {
              const radName = game.radiant_name || game.team1 || 'Radiant';
              const direName = game.dire_name || game.team2 || 'Dire';
              const radScore = game.radiant_score ?? game.score1 ?? 0;
              const direScore = game.dire_score ?? game.score2 ?? 0;
              const durationMin = Math.floor(Math.floor(game.duration || 0) / 60);
              const durationSec = String(Math.floor(game.duration || 0) % 60).padStart(2, '0');
              const goldLead = game.radiant_lead || game.gold_lead || 0;

              // Picks de heróis (se disponíveis na telemetria GOTV)
              const radPicks = game.radiant_picks || game.picks?.radiant || [];
              const direPicks = game.dire_picks || game.picks?.dire || [];

              return (
                <div
                  key={game.match_id || idx}
                  onClick={() => openLiveMatch(game)}
                  className="tilt-card glass-panel rounded-3xl p-6 sm:p-7 shadow-xl hover:shadow-2xl border border-line hover:border-amber-500/50 transition-[color,background-color,border-color,opacity,transform] cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    {/* TOPO: TORNEIO & SÉRIE */}
                    <div className="flex items-center justify-between pb-3 border-b border-line mb-4 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                        <span className="font-medium text-amber-500 truncate max-w-[220px]">
                          {game.league_name || 'Torneio oficial'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 font-mono text-xs bg-surface-2 px-2.5 py-0.5 rounded-lg border border-line">
                          {game.series_type ? `MD${game.series_type}` : 'MD3'}
                        </span>
                        <span className="font-mono text-white font-semibold bg-surface-2 px-3 py-0.5 rounded-lg border border-line">
                          {durationMin}:{durationSec}
                        </span>
                      </div>
                    </div>

                    {/* ONDE ASSISTIR: canais que estão transmitindo esta partida */}
                    {streamsForGame(game).length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 -mt-2 mb-3 text-[11px]">
                        <Tv className="w-3.5 h-3.5 text-purple-400" />
                        {streamsForGame(game).map((s) => (
                          <button
                            key={s.key}
                            onClick={(e) => {
                              e.stopPropagation();
                              pickStream(s);
                              setShowStream(true);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="px-2 py-0.5 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600 hover:text-on-accent font-medium transition-[color,background-color,border-color,opacity,transform]"
                          >
                            Assistir · {s.name}{s.lang ? ` (${s.lang})` : ''}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* CONFRONTO PRINCIPAL & PLACAR */}
                    <div className="flex items-center justify-between gap-4 py-2">
                      {/* RADIANT */}
                      <div className="flex flex-col items-center flex-1 basis-0 min-w-0 text-center">
                        <TeamLogo
                          teamName={radName}
                          teamId={game.team_id_radiant || game.radiant_team_id || game.radiant_team?.team_id}
                          logoUrl={game.radiant_logo || game.logoA}
                          className="w-14 h-14 rounded-2xl mb-2 bg-surface-2 border border-line p-1.5 shadow-sm"
                        />
                        <span className="text-xs font-medium text-emerald-500 leading-tight break-words line-clamp-2 block">
                          {radName}
                        </span>
                        <span className="text-[11px] text-gray-400 font-semibold">
                          Radiante
                        </span>
                      </div>

                      {/* PLACAR DE KILLS */}
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-3 font-mono text-2xl sm:text-3xl font-semibold px-4 py-1.5 rounded-2xl bg-surface-2 border border-line shadow-inner">
                          <span className="text-emerald-500">{radScore}</span>
                          <span className="text-gray-400 text-lg">:</span>
                          <span className="text-red-500">{direScore}</span>
                        </div>
                        <span className="text-xs font-medium font-mono mt-2 text-gray-400 flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                          <span>
                            {goldLead > 0
                              ? `Radiant +${(goldLead / 1000).toFixed(1)}k ouro`
                              : goldLead < 0
                              ? `Dire +${(Math.abs(goldLead) / 1000).toFixed(1)}k ouro`
                              : 'Ouro equilibrado'}
                          </span>
                        </span>
                      </div>

                      {/* DIRE */}
                      <div className="flex flex-col items-center flex-1 basis-0 min-w-0 text-center">
                        <TeamLogo
                          teamName={direName}
                          teamId={game.team_id_dire || game.dire_team_id || game.dire_team?.team_id}
                          logoUrl={game.dire_logo || game.logoB}
                          className="w-14 h-14 rounded-2xl mb-2 bg-surface-2 border border-line p-1.5 shadow-sm"
                        />
                        <span className="text-xs font-medium text-red-500 leading-tight break-words line-clamp-2 block">
                          {direName}
                        </span>
                        <span className="text-[11px] text-gray-400 font-semibold">
                          Dire
                        </span>
                      </div>
                    </div>

                    {/* PICKS DOS TIMES (PREVIEW VISUAL COM HERÓIS DA VALVE CDN) */}
                    {(radPicks.length > 0 || direPicks.length > 0) && (
                      <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-2 gap-4">
                        {/* Radiant Picks */}
                        <div>
                          <span className="text-[11px] font-medium text-emerald-400 block mb-1.5">
                            Picks Radiante
                          </span>
                          <div className="flex items-center gap-1.5">
                            {radPicks.map((heroId, pIdx) => (
                              <img
                                key={pIdx}
                                src={getHeroImg(heroId, constants)}
                                alt={getHeroName(heroId, constants)}
                                title={getHeroName(heroId, constants)}
                                className="w-7 h-5 sm:w-8 sm:h-6 object-cover rounded border border-emerald-500/40 shadow"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Dire Picks */}
                        <div className="text-right">
                          <span className="text-[11px] font-medium text-red-400 block mb-1.5">
                            Picks Dire
                          </span>
                          <div className="flex items-center justify-end gap-1.5">
                            {direPicks.map((heroId, pIdx) => (
                              <img
                                key={pIdx}
                                src={getHeroImg(heroId, constants)}
                                alt={getHeroName(heroId, constants)}
                                title={getHeroName(heroId, constants)}
                                className="w-7 h-5 sm:w-8 sm:h-6 object-cover rounded border border-red-500/40 shadow"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* RODAPÉ DO CARD */}
                  <div className="mt-5 pt-3 border-t border-line flex items-center justify-between text-xs">
                    <span className="text-gray-400 text-xs">
                      Clique para ver tabela de jogadores, itens e construções
                    </span>
                    <span className="font-medium text-amber-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      <span>Ver partida</span>
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              );
            })}
            {(betweenMaps || []).map((item) => (
              <BetweenMapsCard key={item.key} item={item} large />
            ))}
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
