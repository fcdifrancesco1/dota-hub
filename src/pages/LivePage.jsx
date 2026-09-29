import React, { useState, useEffect } from 'react';
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
import { useApp } from '../context/AppContext';
import TeamLogo, { getTeamLogo } from '../utils/teamLogos';
import { getHeroImg, getHeroName } from '../services/api';

const DEFAULT_STREAMS = [
  { id: 'btsbrasiltv', name: 'BTS Brasil TV', platform: 'twitch', lang: 'pt-BR' },
  { id: 'esl_dota2br', name: 'ESL Dota 2 Brasil', platform: 'twitch', lang: 'pt-BR' },
  { id: 'esl_dota2', name: 'ESL Dota 2 Official', platform: 'twitch', lang: 'en' },
  { id: 'pgl_dota2', name: 'PGL Dota 2', platform: 'twitch', lang: 'en' }
];

export default function LivePage() {
  const {
    liveGames,
    setSelectedLiveGame,
    loadingRefresh,
    refreshData,
    upcomingMatches,
    constants
  } = useApp();

  const [activeStream, setActiveStream] = useState(DEFAULT_STREAMS[0]);
  const [showStream, setShowStream] = useState(true);
  const [theaterMode, setTheaterMode] = useState(false);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#212838]">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase font-serif tracking-tight">
              Central Ao Vivo & Telemetria
            </h1>
          </div>
          <p className="text-gray-400 text-xs sm:text-sm">
            Telemetria direta da Valve GOTV com atualização automática a cada 30 segundos, picks em tempo real e streams oficiais integradas.
          </p>
        </div>

        {/* CONTROLES DO TOPO */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowStream(!showStream)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold uppercase transition-all ${
              showStream
                ? 'bg-purple-950/60 border-purple-800/60 text-purple-300'
                : 'bg-[#131722] border-[#212838] text-gray-400 hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>{showStream ? 'Ocultar Transmissão' : 'Abrir Transmissão'}</span>
          </button>

          <button
            onClick={refreshData}
            disabled={loadingRefresh}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#131722] border border-[#212838] hover:border-amber-500/40 text-xs font-bold text-gray-300 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingRefresh ? 'animate-spin text-amber-400' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* REPRODUTOR DE STREAM INTEGRADO (TWITCH / EMBED) */}
      {showStream && (
        <div className="mb-8 rounded-2xl overflow-hidden bg-[#0C0E14] border border-[#262F44] shadow-2xl transition-all">
          {/* BARRA DE CANAIS DA TRANSMISSÃO */}
          <div className="p-3 bg-[#11141E] border-b border-[#212838] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
              <span className="font-bold text-white">Canal Ativo:</span>
              <span className="text-purple-400 font-mono font-bold">{activeStream.name}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {activeStream.lang}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {DEFAULT_STREAMS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveStream(s)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeStream.id === s.id
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {s.name}
                </button>
              ))}

              <button
                onClick={() => setTheaterMode(!theaterMode)}
                title={theaterMode ? 'Modo Normal' : 'Modo Teatro'}
                className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 ml-2"
              >
                {theaterMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* PLAYER RESPONSIVO */}
          <div className={`w-full bg-black ${theaterMode ? 'aspect-[21/9] max-h-[70vh]' : 'aspect-video max-h-[580px]'}`}>
            <iframe
              src={`https://player.twitch.tv/?channel=${activeStream.id}&parent=${window.location.hostname}&autoplay=false`}
              height="100%"
              width="100%"
              allowFullScreen
              title="Dota 2 Live Stream"
              className="w-full h-full border-0"
            />
          </div>
        </div>
      )}

      {/* SEÇÃO DE PARTIDAS AO VIVO */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-red-500" />
            <span>Partidas no Servidor Valve GOTV ({liveGames?.length || 0})</span>
          </h2>
          <span className="text-[11px] text-gray-500 font-mono">
            Auto-atualização: a cada 30 segundos
          </span>
        </div>

        {liveGames && liveGames.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {liveGames.map((game, idx) => {
              const radName = game.radiant_name || game.team1 || 'Radiant';
              const direName = game.dire_name || game.team2 || 'Dire';
              const radScore = game.radiant_score ?? game.score1 ?? 0;
              const direScore = game.dire_score ?? game.score2 ?? 0;
              const durationMin = Math.floor((game.duration || 0) / 60);
              const durationSec = String((game.duration || 0) % 60).padStart(2, '0');
              const goldLead = game.radiant_lead || game.gold_lead || 0;

              // Picks de heróis (se disponíveis na telemetria GOTV)
              const radPicks = game.radiant_picks || game.picks?.radiant || [];
              const direPicks = game.dire_picks || game.picks?.dire || [];

              return (
                <div
                  key={game.match_id || idx}
                  onClick={() => setSelectedLiveGame(game)}
                  className="bg-[#0C0E14] hover:bg-[#111520] border border-[#212838] hover:border-amber-500/50 rounded-2xl p-6 shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    {/* TOPO: TORNEIO & SÉRIE */}
                    <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                        <span className="font-bold text-amber-400 truncate max-w-[220px]">
                          {game.league_name || 'Torneio Oficial'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 font-mono text-[11px] bg-white/5 px-2 py-0.5 rounded">
                          {game.series_type ? `MD${game.series_type}` : 'MD3'}
                        </span>
                        <span className="font-mono text-white font-black bg-black/60 px-2.5 py-0.5 rounded border border-white/10">
                          {durationMin}:{durationSec}
                        </span>
                      </div>
                    </div>

                    {/* CONFRONTO PRINCIPAL & PLACAR */}
                    <div className="flex items-center justify-between gap-4 py-2">
                      {/* RADIANT */}
                      <div className="flex flex-col items-center flex-1 text-center">
                        <TeamLogo
                          teamName={radName}
                          teamId={game.team_id_radiant || game.radiant_team_id || game.radiant_team?.team_id}
                          logoUrl={game.radiant_logo || game.logoA}
                          className="w-14 h-14 rounded-xl mb-2 bg-black/40 border border-white/10 p-1"
                        />
                        <span className="text-xs font-bold text-emerald-400 truncate max-w-[130px] block">
                          {radName}
                        </span>
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
                          Radiante
                        </span>
                      </div>

                      {/* PLACAR DE KILLS */}
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-3 font-mono text-2xl sm:text-3xl font-black px-4 py-1.5 rounded-2xl bg-black/70 border border-white/10 shadow-inner">
                          <span className="text-emerald-400">{radScore}</span>
                          <span className="text-gray-500 text-lg">:</span>
                          <span className="text-red-400">{direScore}</span>
                        </div>
                        <span className="text-[11px] font-bold font-mono mt-2 text-gray-300 flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
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
                      <div className="flex flex-col items-center flex-1 text-center">
                        <TeamLogo
                          teamName={direName}
                          teamId={game.team_id_dire || game.dire_team_id || game.dire_team?.team_id}
                          logoUrl={game.dire_logo || game.logoB}
                          className="w-14 h-14 rounded-xl mb-2 bg-black/40 border border-white/10 p-1"
                        />
                        <span className="text-xs font-bold text-red-400 truncate max-w-[130px] block">
                          {direName}
                        </span>
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
                          Dire
                        </span>
                      </div>
                    </div>

                    {/* PICKS DOS TIMES (PREVIEW VISUAL COM HERÓIS DA VALVE CDN) */}
                    {(radPicks.length > 0 || direPicks.length > 0) && (
                      <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-2 gap-4">
                        {/* Radiant Picks */}
                        <div>
                          <span className="text-[10px] font-bold uppercase text-emerald-400 block mb-1.5">
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
                          <span className="text-[10px] font-bold uppercase text-red-400 block mb-1.5">
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
                  <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                    <span className="text-gray-400 text-[11px]">
                      Clique para ver tabela de jogadores, itens e construções
                    </span>
                    <span className="font-bold text-amber-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      <span>Abrir Telemetria</span>
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ESTADO VAZIO AMIGÁVEL */
          <div className="rounded-2xl bg-[#0C0E14] border border-[#212838] p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
              <Radio className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">
              Nenhuma Partida Ao Vivo no Momento
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed max-w-md mx-auto mb-6">
              Os servidores da Valve GOTV estão sendo monitorados continuamente. Assim que a próxima partida oficial iniciar o draft, o placar e a telemetria aparecerão aqui automaticamente.
            </p>

            {/* PRÓXIMAS PARTIDAS IMEDIATAS */}
            {upcomingMatches && upcomingMatches.length > 0 && (
              <div className="bg-[#11141E] border border-white/5 rounded-xl p-4 text-left">
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block mb-2">
                  Próxima partida agendada:
                </span>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{upcomingMatches[0].timeA}</span>
                    <span className="text-gray-500 font-mono">vs</span>
                    <span className="font-bold text-white">{upcomingMatches[0].timeB}</span>
                  </div>
                  <span className="font-mono text-amber-400 font-bold">
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
