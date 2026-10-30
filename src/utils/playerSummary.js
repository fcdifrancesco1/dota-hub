const POSITION_NAMES = { 1: 'carry', 2: 'mid', 3: 'offlaner', 4: 'suporte (Pos 4)', 5: 'suporte (Pos 5)' };

const list = (items) => (items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`);

/**
 * Parágrafo curto sobre o jogador, montado só com dados que o perfil já tem:
 * { name, position, team, country, titles, tier1, prizeUsd, heroes: [nomes], rating }.
 */
export function playerSummary({ name, position, team, country, titles = 0, tier1 = 0, prizeUsd = 0, heroes = [], rating }) {
  if (!name) return '';
  const role = POSITION_NAMES[position];
  const where = [team && `na ${team}`, country && `(${country})`].filter(Boolean).join(' ');
  const parts = [role || team
    ? `${name} joga${role ? ` de ${role}` : ''}${where ? ` ${where}` : ''}.`
    : `${name} é jogador profissional de Dota 2${country ? ` (${country})` : ''}.`];
  if (titles > 0) {
    const t1 = tier1 > 0 ? ` (${tier1} de Tier 1)` : '';
    const prize = prizeUsd ? ` e US$ ${prizeUsd.toLocaleString('pt-BR')} em premiação` : '';
    parts.push(`Soma ${titles} ${titles === 1 ? 'título' : 'títulos'}${t1}${prize}.`);
  }
  if (heroes.length) parts.push(`Na carreira, os heróis mais jogados são ${list(heroes.slice(0, 3))}.`);
  if (rating) parts.push(`Nos jogos oficiais dos últimos 90 dias, a nota é ${rating.overall} (${rating.label.toLowerCase()} entre os profissionais da posição).`);
  return parts.join(' ');
}
