/**
 * Comparação com os profissionais da mesma posição (médias dos últimos 90 dias,
 * ver /api/results?proBenchmarks=1). Cada linha: { position, account_id, games,
 * kills, deaths, assists, gpm, xpm, lh10, dmg_min, tower_min, wards, kp }.
 */

export const METRICS = {
  kills: { label: 'Abates', fmt: (v) => v.toFixed(1) },
  deaths: { label: 'Mortes', fmt: (v) => v.toFixed(1), lowerIsBetter: true },
  assists: { label: 'Assistências', fmt: (v) => v.toFixed(1) },
  kp: { label: 'Participação em abates', fmt: (v) => `${Math.round(v)}%` },
  gpm: { label: 'GPM', fmt: (v) => Math.round(v) },
  xpm: { label: 'XPM', fmt: (v) => Math.round(v) },
  lh10: { label: 'Last hits / 10 min', fmt: (v) => v.toFixed(1) },
  dmg_min: { label: 'Dano em heróis / min', fmt: (v) => Math.round(v) },
  tower_min: { label: 'Dano em torres / min', fmt: (v) => Math.round(v) },
  wards: { label: 'Wards por jogo', fmt: (v) => v.toFixed(1) }
};

// Sub-notas da nota de desempenho e o peso de cada uma por posição (1 a 5)
export const AREAS = [
  { id: 'farm', label: 'Farm', metrics: ['gpm', 'xpm', 'lh10'], weight: [3, 3, 2.5, 1, 0.5] },
  { id: 'fight', label: 'Luta', metrics: ['kp', 'dmg_min', 'kills', 'assists'], weight: [2, 2.5, 2.5, 3, 3] },
  { id: 'survival', label: 'Sobrevivência', metrics: ['deaths'], weight: [1.5, 1.5, 1.5, 1, 1] },
  { id: 'objectives', label: 'Objetivos', metrics: ['tower_min'], weight: [1.5, 1, 1, 0.5, 0.5] },
  { id: 'vision', label: 'Visão', metrics: ['wards'], weight: [0, 0, 0.5, 2.5, 3] }
];

const rowsAt = (rows, position) => (rows || []).filter((r) => r.position === position);

/** Percentil 0–100 do valor entre os profissionais da posição (100 = melhor). */
export function percentile(rows, position, metric, value) {
  const list = rowsAt(rows, position).map((r) => r[metric]);
  if (!list.length || value == null || Number.isNaN(value)) return null;
  const lower = !!METRICS[metric]?.lowerIsBetter;
  const beaten = list.filter((v) => (lower ? v > value : v < value)).length;
  const ties = list.filter((v) => v === value).length;
  return Math.round(((beaten + ties / 2) / list.length) * 100);
}

/** Média da posição na métrica. */
export function positionAverage(rows, position, metric) {
  const list = rowsAt(rows, position);
  return list.length ? list.reduce((s, r) => s + r[metric], 0) / list.length : null;
}

/** "Top 12%" a partir do percentil (melhor = número menor). */
export const topLabel = (pct) => (pct == null ? null : `Top ${Math.max(1, 100 - pct)}%`);

/**
 * Nota 0–100 do jogador (médias de uma série ou de um período) contra os
 * profissionais da posição, com as sub-notas de cada área.
 */
export function performanceRating(rows, position, stats) {
  if (!position || !rowsAt(rows, position).length) return null;
  const areas = AREAS.map((a) => {
    const pcts = a.metrics.map((m) => percentile(rows, position, m, stats[m])).filter((p) => p != null);
    return { ...a, weight: a.weight[position - 1], score: pcts.length ? Math.round(pcts.reduce((s, p) => s + p, 0) / pcts.length) : null };
  }).filter((a) => a.score != null && a.weight > 0);
  const total = areas.reduce((s, a) => s + a.weight, 0);
  if (!total) return null;
  const overall = Math.round(areas.reduce((s, a) => s + a.score * a.weight, 0) / total);
  return { overall, label: ratingLabel(overall), areas };
}

export function ratingLabel(score) {
  if (score >= 75) return 'Excelente';
  if (score >= 58) return 'Acima da média';
  if (score >= 42) return 'Na média';
  return 'Abaixo da média';
}

/** Linha do jogador na posição em que mais jogou (ou na posição pedida). */
export function playerRow(rows, accountId, position) {
  const mine = (rows || []).filter((r) => String(r.account_id) === String(accountId));
  if (position) return mine.find((r) => r.position === position) || null;
  return mine.sort((a, b) => b.games - a.games)[0] || null;
}

/**
 * Médias por jogo no formato das métricas a partir de jogadores de partidas da
 * OpenDota (/matches/:id). `teamKills(p)` devolve os abates do time do jogador.
 */
export function statsFromMatchPlayers(list, teamKills) {
  const n = list.length;
  if (!n) return null;
  const avg = (fn) => list.reduce((s, p) => s + fn(p), 0) / n;
  const perMin = (p, v) => (p.duration || 0) > 0 ? (v * 60) / p.duration : 0;
  return {
    kills: avg((p) => p.kills || 0),
    deaths: avg((p) => p.deaths || 0),
    assists: avg((p) => p.assists || 0),
    gpm: avg((p) => p.gold_per_min || 0),
    xpm: avg((p) => p.xp_per_min || 0),
    lh10: avg((p) => perMin(p, p.last_hits || 0) * 10),
    dmg_min: avg((p) => perMin(p, p.hero_damage || 0)),
    tower_min: avg((p) => perMin(p, p.tower_damage || 0)),
    wards: avg((p) => (p.obs_placed || 0) + (p.sen_placed || 0)),
    kp: avg((p) => { const tk = teamKills(p); return tk > 0 ? ((p.kills || 0) + (p.assists || 0)) * 100 / tk : 0; })
  };
}
