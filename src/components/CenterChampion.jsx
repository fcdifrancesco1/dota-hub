import React from 'react';
import { Trophy, Crown, Zap } from 'lucide-react';

export default function CenterChampion() {
  const champion = {
    tournamentName: "The International 2025",
    tournamentLogo: "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/trophies/aegis.png",
    teamName: "Team Liquid",
    teamLogo: "https://steamcdn-a.akamaihd.net/apps/dota2/images/team_logos/2163.png",
    roster: [
      { pos: 1, nick: "miCKe", role: "Carry", kda: "5.8", gpm: 742 },
      { pos: 2, nick: "Nisha", role: "Midlane", kda: "6.2", gpm: 698 },
      { pos: 3, nick: "SabeRLighT-", role: "Offlane", kda: "4.1", gpm: 580 },
      { pos: 4, nick: "Boxi", role: "Support", kda: "3.9", gpm: 390 },
      { pos: 5, nick: "Insania", role: "Hard Support", kda: "3.2", gpm: 330 },
    ]
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Banner Central de Destaque */}
        <div className="relative rounded-2xl bg-gradient-to-b from-dota-card to-dota-surface border border-dota-border p-8 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-dota-accent/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-dota-cyan/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between border-b border-dota-border/80 pb-6 mb-6">
            <div className="flex items-center gap-4">
              <img src={champion.tournamentLogo} alt="Torneio" className="w-16 h-16 object-contain filter drop-shadow-[0_0_12px_rgba(229,169,60,0.4)]" />
              <div>
                <div className="flex items-center gap-2 text-dota-accent font-bold text-xs uppercase tracking-wider">
                  <Crown className="w-4 h-4" /> Campeão Atual
                </div>
                <h1 className="text-2xl font-black text-white">{champion.tournamentName}</h1>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-dota-bg/60 border border-dota-border px-4 py-2 rounded-xl">
              <img src={champion.teamLogo} alt={champion.teamName} className="w-10 h-10 object-contain" />
              <span className="text-lg font-bold text-white">{champion.teamName}</span>
            </div>
          </div>

          {/* Grid dos 5 Jogadores Campeões */}
          <div className="grid grid-cols-5 gap-3">
            {champion.roster.map((player) => (
              <div key={player.pos} className="bg-dota-bg/80 border border-dota-border/80 rounded-xl p-4 flex flex-col items-center text-center group hover:border-dota-accent/50 transition-all">
                <div className="w-7 h-7 rounded-full bg-dota-card border border-dota-border flex items-center justify-center text-xs font-mono font-bold text-dota-accent mb-2">
                  {player.pos}
                </div>
                <div className="font-bold text-sm text-white group-hover:text-dota-accent transition-colors">{player.nick}</div>
                <div className="text-[10px] text-dota-dim uppercase tracking-wider mb-3">{player.role}</div>

                <div className="w-full border-t border-dota-border/40 pt-2 grid grid-cols-2 gap-1 text-[10px] font-mono">
                  <div>
                    <span className="text-dota-dim block">KDA</span>
                    <strong className="text-dota-text">{player.kda}</strong>
                  </div>
                  <div>
                    <span className="text-dota-dim block">GPM</span>
                    <strong className="text-dota-cyan">{player.gpm}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}