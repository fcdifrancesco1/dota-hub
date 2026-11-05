import React from 'react';
import { Crown, Sparkles, ExternalLink, Shield } from 'lucide-react';
import { liquipediaImage } from '../utils/liquipediaImage';

export default function CenterChampion({ onOpenTeamProfile }) {
  const champion = {
    tournament: "The International",
    year: "2025/2026",
    teamId: 7119388,
    teamName: "Team Spirit",
    teamLogo: "/team-logos/spirit.png",
    roster: [
      { pos: 1, nick: "Yatoro", role: "Carry", kda: "6.8", gpm: 785, photo: "/yatoro.png" },
      { pos: 2, nick: "Larl", role: "Midlane", kda: "5.9", gpm: 690, photo: "/larl.png" },
      { pos: 3, nick: "Collapse", role: "Offlane", kda: "5.2", gpm: 610, photo: "/collapse.png" },
      { pos: 4, nick: "rue", role: "Support", kda: "3.4", gpm: 405, photo: "/rue.png" },
      { pos: 5, nick: "not me", role: "Hard Support", kda: "2.4", gpm: 330, photo: "/notme.png" },
    ]
  };

  return (
    <div className="w-full max-w-4xl bg-surface-2 border border-amber-500/30 rounded-2xl p-6 relative overflow-hidden">
      {/* Luz ambiente dourada de fundo */}

      {/* HEADER DO CAMPEÃO */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5 mb-5 relative z-10">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <img
              src="/aegis.png"
              alt="Aegis of Champions"
              className="w-16 h-16 object-contain filter drop-shadow-[0_0_16px_rgba(229,169,60,0.5)] transition-transform"
              onError={(e) => {
                e.target.src = "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/trophies/aegis.png";
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
              <Crown className="w-3.5 h-3.5 text-amber-400" /> Atual Campeão Mundial
            </div>
            <h1 className="text-2xl font-semibold text-white">
              {champion.tournament} <span className="text-amber-400 font-semibold">{champion.year}</span>
            </h1>
          </div>
        </div>

        {/* TIME CAMPEÃO COM BOTÃO PARA VER PERFIL */}
        <button
          onClick={() => onOpenTeamProfile && onOpenTeamProfile(champion.teamId, champion.teamName)}
          className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/50 px-4 py-2 rounded-xl transition-[color,background-color,border-color,opacity,transform] group"
        >
          <img
            src={liquipediaImage(champion.teamLogo)}
            alt={champion.teamName}
            className="w-8 h-8 object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div className="text-left">
            <div className="text-[11px] text-gray-400 font-semibold">Equipe campeã</div>
            <div className="text-sm font-medium text-white group-hover:text-amber-400 transition-colors flex items-center gap-1">
              {champion.teamName}
              <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 group-focus-visible:opacity-100" />
            </div>
          </div>
        </button>
      </div>

      {/* GRID DOS 5 JOGADORES CAMPEÕES */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 relative z-10">
        {champion.roster.map((player) => (
          <div
            key={player.pos}
            className="bg-surface-2/70 hover:bg-surface-3/90 border border-white/10 hover:border-amber-500/40 rounded-xl p-3.5 flex flex-col items-center text-center transition-[color,background-color,border-color,opacity,transform] duration-200 group shadow-sm"
          >
            {/* Foto com Posição Flutuante */}
            <div className="relative w-14 h-14 mb-2.5">
              <img
                src={liquipediaImage(player.photo)}
                alt={player.nick}
                className="w-full h-full rounded-full object-cover border-2 border-amber-400/80 bg-black/50 group-hover:border-amber-300 transition-colors"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/aegis.png";
                }}
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-canvas border border-amber-400 text-amber-400 font-mono text-[11px] font-semibold flex items-center justify-center">
                {player.pos}
              </span>
            </div>

            <div className="w-full truncate">
              <div className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors truncate">
                {player.nick}
              </div>
              <div className="text-[11px] font-medium text-gray-400 mb-2">
                {player.role}
              </div>
            </div>

            {/* Split KDA / GPM */}
            <div className="w-full border-t border-white/10 pt-2 grid grid-cols-2 gap-1 text-[11px] font-mono">
              <div>
                <span className="text-[11px] text-gray-500 block">KDA</span>
                <strong className="text-white">{player.kda}</strong>
              </div>
              <div>
                <span className="text-[11px] text-gray-500 block">GPM</span>
                <strong className="text-cyan-400">{player.gpm}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}