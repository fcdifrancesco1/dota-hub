import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  UserCheck,
  Trophy,
  Swords,
  TrendingUp,
  Sparkles,
  Calendar,
  Zap
} from 'lucide-react';
import { getHeroImg, getHeroName } from '../services/api';
import { getTeamLogo } from '../utils/teamLogos';
import PlayerAvatar from '../components/PlayerAvatar';
import { useApp } from '../context/AppContext';

export default function PlayerDetailPage() {
  const { id } = useParams();
  const { constants } = useApp();

  // Mock de atleta detalhado
  const player = {
    id,
    name: id === '152962063' || id === '1' ? 'skiter' : 'Nisha',
    personaname: id === '152962063' || id === '1' ? 'Oliver Lepko' : 'Michał Jankowski',
    team: id === '152962063' || id === '1' ? 'Team Falcons' : 'Team Liquid',
    role: id === '152962063' || id === '1' ? 'Posição 1 (Hard Carry)' : 'Posição 2 (Midlaner)',
    country: id === '152962063' || id === '1' ? 'Eslováquia' : 'Polônia',
    // Um ID numérico longo na URL é o account_id Steam do jogador
    accountId: /^\d{4,}$/.test(id) ? Number(id) : (id === '1' ? 100058342 : 201358612),
    stats: {
      kda: 6.8,
      gpm: 785,
      xpm: 812,
      lastHits: 415,
      killParticipation: '76.4%',
      winrate: '71.2%'
    },
    topHeroes: [
      { id: 48, name: 'Luna', matches: 28, winrate: 75.0 },
      { id: 18, name: 'Sven', matches: 22, winrate: 68.2 },
      { id: 54, name: 'Lifestealer', matches: 19, winrate: 73.7 },
      { id: 114, name: 'Monkey King', matches: 16, winrate: 62.5 }
    ]
  };

  return (
    <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      {/* VOLTAR */}
      <Link
        to="/jogadores"
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-amber-400 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar para Jogadores</span>
      </Link>

      {/* HERO DO JOGADOR */}
      <div className="rounded-2xl bg-gradient-to-r from-surface-2 via-surface to-surface-2 border border-line p-6 sm:p-8 mb-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <PlayerAvatar
            accountId={player.accountId}
            name={player.name}
            className="w-24 h-24 rounded-2xl border-2 border-amber-500/40 shadow-xl text-2xl"
          />
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500 text-black px-2 py-0.5 rounded">
                Atleta Profissional
              </span>
              <span className="text-xs text-amber-400 font-bold">{player.team}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white font-serif uppercase tracking-tight">
              {player.name}
            </h1>
            <span className="text-xs text-gray-400 block mt-0.5">{player.personaname} • {player.country}</span>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-gray-400 mt-3 font-mono">
              <span>Função: <strong className="text-white">{player.role}</strong></span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">{player.stats.winrate} Winrate em Torneios</span>
            </div>
          </div>
        </div>
      </div>

      {/* MÉDIAS ESTATÍSTICAS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-10">
        <div className="bg-surface border border-line rounded-xl p-4 text-center">
          <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">KDA Médio</span>
          <div className="text-xl font-black text-amber-400 font-mono">{player.stats.kda}</div>
        </div>
        <div className="bg-surface border border-line rounded-xl p-4 text-center">
          <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">GPM Médio</span>
          <div className="text-xl font-black text-white font-mono">{player.stats.gpm}</div>
        </div>
        <div className="bg-surface border border-line rounded-xl p-4 text-center">
          <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">XPM Médio</span>
          <div className="text-xl font-black text-white font-mono">{player.stats.xpm}</div>
        </div>
        <div className="bg-surface border border-line rounded-xl p-4 text-center">
          <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Last Hits / min</span>
          <div className="text-xl font-black text-white font-mono">{player.stats.lastHits}</div>
        </div>
        <div className="bg-surface border border-line rounded-xl p-4 text-center">
          <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Part. em Kills</span>
          <div className="text-xl font-black text-emerald-400 font-mono">{player.stats.killParticipation}</div>
        </div>
        <div className="bg-surface border border-line rounded-xl p-4 text-center">
          <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Taxa de Vitória</span>
          <div className="text-xl font-black text-emerald-400 font-mono">{player.stats.winrate}</div>
        </div>
      </div>

      {/* HERÓIS MAIS JOGADOS */}
      <div className="bg-surface border border-line rounded-2xl p-6 shadow-xl mb-10">
        <h3 className="text-sm font-black uppercase text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Heróis Mais Jogados no Circuito Profissional</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {player.topHeroes.map((h) => (
            <div key={h.id} className="bg-surface-2 border border-white/5 rounded-xl p-3 text-center">
              <img
                src={getHeroImg(h.id, constants)}
                alt={h.name}
                className="w-14 h-9 object-cover rounded mx-auto mb-2 border border-white/10 shadow"
              />
              <h4 className="text-xs font-bold text-white">{h.name}</h4>
              <span className="text-[10px] text-gray-400 block">{h.matches} jogos oficiais</span>
              <span className="text-xs font-mono font-bold text-emerald-400 block mt-1">{h.winrate}% Win</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
