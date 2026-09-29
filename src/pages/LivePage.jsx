import React, { useState } from 'react';
import { Radio, RefreshCw, Tv, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getTeamLogo } from '../utils/teamLogos';

export default function LivePage() {
  const { liveGames, setSelectedLiveGame, loadingRefresh, refreshData } = useApp();
  const [selectedStream, setSelectedStream] = useState('twitch'); // 'twitch' | null
  const [streamChannel, setStreamChannel] = useState('esl_dota2br');

  return (
    <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      {/* Header da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#212838]">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase font-serif tracking-tight">
              Central Ao Vivo & Telemetria
            </h1>
          </div>
          <p className="text-gray-400 text-xs sm:text-sm">
            Acompanhe partidas profissionais em tempo real com placar de kills, vantagem de ouro e streams oficiais integradas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refreshData}
            disabled={loadingRefresh}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#131722] border border-[#212838] hover:border-amber-500/40 text-xs font-bold text-gray-300 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingRefresh ? 'animate-spin text-amber-400' : ''}`} />
            <span>Atualizar Agora</span>
          </button>
        </div>
      </div>

      {/* Stream Embed Opcional */}
      {selectedStream && (
        <div className="mb-10 bg-[#0C0E14] border border-[#262F44] rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-3 bg-[#11141E] border-b border-[#212838] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-white font-bold">
              <Tv className="w-4 h-4 text-purple-400" />
              <span>Transmissão Oficial: {streamChannel}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStreamChannel('esl_dota2br')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold ${streamChannel === 'esl_dota2br' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400'}`}
              >
                Português (BR)
              </button>
              <button
                onClick={() => setStreamChannel('esl_dota2')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold ${streamChannel === 'esl_dota2' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400'}`}
              >
                Inglês (EN)
              </button>
              <button
                onClick={() => setSelectedStream(null)}
                className="text-gray-400 hover:text-white ml-2 text-xs"
              >
                Fechar Stream ✕
              </button>
            </div>
          </div>
          <div className="aspect-video w-full bg-black">
            <iframe
              src={`https://player.twitch.tv/?channel=${streamChannel}&parent=${window.location.hostname}&autoplay=false`}
              height="100%"
              width="100%"
              allowFullScreen
              title="Dota 2 Live Stream"
              className="w-full h-full border-0"
            />
          </div>
        </div>
      )}

      {/* Grid de Partidas Ao Vivo */}
      {liveGames && liveGames.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {liveGames.map((game, idx) => {
            const radName = game.radiant_name || game.team1 || 'Radiant';
            const direName = game.dire_name || game.team2 || 'Dire';
            const radScore = game.radiant_score ?? game.score1 ?? 0;
            const direScore = game.dire_score ?? game.score2 ?? 0;
            const durationMin = Math.floor((game.duration || 0) / 60);
            const durationSec = String((game.duration || 0) % 60).padStart(2, '0');
            const goldLead = game.radiant_lead || game.gold_lead || 0;

            return (
              <div
                key={game.match_id || idx}
                onClick={() => setSelectedLiveGame(game)}
                className="bg-[#0C0E14] hover:bg-[#111520] border border-[#212838] hover:border-amber-500/50 rounded-2xl p-5 shadow-xl transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs text-gray-400 pb-3 border-b border-white/5 mb-4">
                  <span className="font-bold text-amber-400 truncate max-w-[200px]">
                    {game.league_name || 'Partida Oficial'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    <span className="font-mono text-white font-bold">{durationMin}:{durationSec}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 py-2">
                  <div className="flex flex-col items-center flex-1 text-center">
                    <img
                      src={getTeamLogo(radName, game.radiant_logo)}
                      alt={radName}
                      className="w-12 h-12 object-contain rounded-xl mb-2"
                      onError={(e) => { e.target.src = '/placeholder-team.png'; }}
                    />
                    <span className="text-xs font-bold text-emerald-400 truncate max-w-[120px]">{radName}</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 font-mono text-xl font-black px-3 py-1 rounded-xl bg-black/60 border border-white/10">
                      <span className="text-emerald-400">{radScore}</span>
                      <span className="text-gray-500">:</span>
                      <span className="text-red-400">{direScore}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase mt-2">
                      {goldLead > 0
                        ? `Rad +${(goldLead / 1000).toFixed(1)}k`
                        : goldLead < 0
                        ? `Dire +${(Math.abs(goldLead) / 1000).toFixed(1)}k`
                        : 'Equilibrado'}
                    </span>
                  </div>

                  <div className="flex flex-col items-center flex-1 text-center">
                    <img
                      src={getTeamLogo(direName, game.dire_logo)}
                      alt={direName}
                      className="w-12 h-12 object-contain rounded-xl mb-2"
                      onError={(e) => { e.target.src = '/placeholder-team.png'; }}
                    />
                    <span className="text-xs font-bold text-red-400 truncate max-w-[120px]">{direName}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-gray-400 group-hover:text-amber-400 font-bold transition-colors">
                    Ver Telemetria Completa & Picks →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#0C0E14] border border-[#212838] rounded-2xl p-12 text-center max-w-xl mx-auto shadow-xl">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
            <Radio className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Nenhuma Partida Ao Vivo no Momento</h3>
          <p className="text-xs text-gray-400 leading-relaxed mb-6">
            Nenhum torneio oficial está em andamento nesta janela de horário. O sistema monitora a Valve GOTV e atualiza automaticamente a cada 30 segundos.
          </p>
          <a
            href="/partidas"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider text-xs transition-all"
          >
            <span>Ver Resultados Recentes & Agenda</span>
          </a>
        </div>
      )}
    </div>
  );
}
