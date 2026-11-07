import React from 'react';

// Funções com os nomes do cliente do Dota em português (dota_brazilian.txt)
export const ROLE_LABELS = {
  Carry: 'Carregador', Support: 'Suporte', Nuker: 'Bombardeador', Disabler: 'Desativador', Jungler: 'Caçador',
  Durable: 'Resistente', Escape: 'Escapista', Pusher: 'Empurrador', Initiator: 'Iniciador'
};

export const ATTACK_LABELS = { Melee: 'Corpo a corpo', Ranged: 'Longo alcance' };

/** Losangos de complexidade (1 a 3), como no cliente. */
export function Diamonds({ value, size = 'w-2.5 h-2.5' }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`Complexidade ${value} de 3`}>
      {[1, 2, 3].map((n) => (
        <span key={n} className={`${size} rotate-45 border border-gray-300 ${n <= value ? 'bg-gray-200' : 'bg-transparent'}`} />
      ))}
    </span>
  );
}
