import React, { useState } from 'react';
import { Trophy, CheckCircle, Clock } from 'lucide-react';

const MOCK_TOURNAMENTS = {
  upcoming: [
    { id: 1, name: "The International 2026", dates: "14 - 28 Ago, 2026", prizepool: "$3,000,000+", tier: "Tier 1" },
    { id: 2, name: "ESL One Birmingham 2026", dates: "10 - 18 Out, 2026", prizepool: "$1,000,000", tier: "Tier 1" }
  ],
  finished: [
    { id: 3, name: "The International 2025", winner: "Team Liquid", dates: "Finalizado", tier: "Tier 1" },
    { id: 4, name: "Riyadh Masters 2025", winner: "Gaimin Gladiators", dates: "Finalizado", tier: "Tier 1" }
  ]
};

export default function TournamentsView() {
  return (
    <div className="flex-1 p-8 overflow-y-auto max-w-6xl mx-auto space-y-8">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2 text-dota-accent uppercase tracking-wider mb-4">
          <Clock className="w-5 h-5" /> Próximos Torneios
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {MOCK_TOURNAMENTS.upcoming.map((t) => (
            <div key={t.id} className="bg-dota-surface border border-dota-border p-5 rounded-xl hover:border-dota-accent transition-all cursor-pointer">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-white">{t.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-dota-card border border-dota-border text-dota-accent">{t.tier}</span>
              </div>
              <p className="text-xs text-dota-dim">Período: {t.dates}</p>
              <p className="text-xs text-dota-cyan font-mono mt-1">Premiação: {t.prizepool}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold flex items-center gap-2 text-dota-dim uppercase tracking-wider mb-4">
          <CheckCircle className="w-5 h-5" /> Torneios Encerrados
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {MOCK_TOURNAMENTS.finished.map((t) => (
            <div key={t.id} className="bg-dota-surface border border-dota-border p-5 rounded-xl hover:border-dota-border/80 transition-all cursor-pointer">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-white">{t.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-dota-card text-dota-dim">{t.tier}</span>
              </div>
              <p className="text-xs text-dota-accent">Campeão: <strong>{t.winner}</strong></p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}