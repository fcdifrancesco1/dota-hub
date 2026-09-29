// Formatação dos dados de campeonatos vindos da Liquipedia (api/tournaments.js)

const parseDate = (iso) => (iso ? new Date(`${iso}T12:00:00`) : null);

/** "29/09 – 11/10/2026" ou "29/12/2026 – 04/01/2027" quando muda o ano. */
export function formatDateRange(startDate, endDate) {
  const s = parseDate(startDate);
  const e = parseDate(endDate);
  const dm = (d) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const dmy = (d) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  if (s && e) {
    if (startDate === endDate) return dmy(s);
    return s.getFullYear() === e.getFullYear() ? `${dm(s)} – ${dmy(e)}` : `${dmy(s)} – ${dmy(e)}`;
  }
  if (s) return `A partir de ${dmy(s)}`;
  if (e) return `Até ${dmy(e)}`;
  return null;
}

/** "US$ 750.000" ou "4.000.000 RUB"; null se a premiação não foi divulgada. */
export function formatPrize(t) {
  if (t?.prizePoolUsd) return `US$ ${t.prizePoolUsd.toLocaleString('pt-BR')}`;
  if (t?.prizePoolLocal?.amount) {
    return `${t.prizePoolLocal.amount.toLocaleString('pt-BR')}${t.prizePoolLocal.currency ? ` ${t.prizePoolLocal.currency}` : ''}`;
  }
  return null;
}

const TIER_TYPE_LABEL = { qualifier: 'Qualificatória', showmatch: 'Showmatch', monthly: 'Mensal', weekly: 'Semanal', misc: 'Diversos' };

/** "Tier 1", "Tier 1 · Qualificatória", "Tier 3 · Showmatch". */
export function tierLabel(t) {
  const base = t?.tier ? `Tier ${t.tier}` : 'Tier —';
  const type = t?.tierType ? TIER_TYPE_LABEL[t.tierType.toLowerCase()] || t.tierType : null;
  return type ? `${base} · ${type}` : base;
}

/** Dias até o início (0 = hoje), ou null. */
export function daysUntil(startDate) {
  const s = parseDate(startDate);
  if (!s) return null;
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.round((s - today) / 86400000);
}

/** Texto do selo de status do campeonato. */
export function statusLabel(t) {
  if (t?.status === 'ongoing') return '● Em andamento';
  if (t?.status === 'finished') return 'Encerrado';
  const d = daysUntil(t?.startDate);
  if (d === null) return 'Em breve';
  if (d <= 0) return 'Começa hoje';
  if (d === 1) return 'Começa amanhã';
  return `Começa em ${d} dias`;
}

const STATUS_ORDER = { ongoing: 0, upcoming: 1, finished: 2 };

/** Em andamento primeiro, depois próximos (mais cedo primeiro), depois encerrados (mais recentes primeiro). */
export function sortTournaments(list) {
  return [...list].sort((a, b) => {
    const s = (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3);
    if (s !== 0) return s;
    if (a.status === 'finished') return (b.endDate || '').localeCompare(a.endDate || '');
    // Tier mais alto primeiro entre os que começam no mesmo dia
    return (a.startDate || '').localeCompare(b.startDate || '') || (a.tier || 9) - (b.tier || 9);
  });
}

// Converte uma liga cadastrada no Supabase para o formato da Liquipedia
export function leagueFromDatabase(l) {
  const tier = parseInt(String(l.tier || '').replace(/\D/g, ''), 10);
  const prize = Number(String(l.prize_pool || '').replace(/[^0-9.]/g, ''));
  return {
    id: String(l.id),
    name: l.name,
    status: l.status === 'finished' ? 'finished' : l.status === 'upcoming' ? 'upcoming' : 'ongoing',
    startDate: l.start_date ? String(l.start_date).slice(0, 10) : null,
    endDate: l.end_date ? String(l.end_date).slice(0, 10) : null,
    tier: Number.isFinite(tier) ? tier : null,
    prizePoolUsd: prize > 0 ? prize : null,
    location: l.location || null,
    image: l.banner_url || l.logo_url ? { light: l.banner_url || l.logo_url, dark: l.banner_url || l.logo_url } : null
  };
}
