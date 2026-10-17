// Nomes da Liquipedia para times que a Valve/OpenDota conhecem por outro nome
// (ex.: o time "Skyreavers" está registrado como "The Bot^$"). A equivalência é
// guardada pelo ID do time na OpenDota e aplicada em todas as telas.
import { isSameTeamMatch } from '../services/api';

const KEY = 'dotahub_team_aliases_v3';
const MAX_AGE_MS = 30 * 24 * 3600 * 1000;
const WINDOW_SECS = 3 * 3600; // série da OpenDota e da Liquipedia começam com até 3 h de diferença

let aliases = null;

function load() {
  if (aliases) return aliases;
  aliases = {};
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    const now = Date.now();
    for (const [id, v] of Object.entries(saved)) if (v?.name && now - v.at < MAX_AGE_MS) aliases[id] = v;
  } catch { /* navegador sem armazenamento */ }
  return aliases;
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(aliases)); } catch { /* ignore */ }
}

/** Nome da Liquipedia para um ID de time da OpenDota (ou undefined). */
export function aliasFor(teamId) {
  return teamId ? load()[teamId]?.name : undefined;
}

/** { idDoTime: nome } com todas as equivalências conhecidas. */
export function aliasMap() {
  return Object.fromEntries(Object.entries(load()).map(([id, v]) => [id, v.name]));
}

/** Registra equivalências já confirmadas (ex.: pelo chaveamento de um campeonato). */
export function rememberAliases(idToName) {
  load();
  let changed = false;
  for (const [id, name] of Object.entries(idToName || {})) {
    if (!id || !name || aliases[id]?.name === name) continue;
    aliases[id] = { name, at: Date.now() };
    changed = true;
  }
  if (changed) save();
}

/**
 * Descobre equivalências comparando séries da OpenDota com as da agenda da
 * Liquipedia: mesmo horário (±3 h), um dos times com o mesmo nome e o mesmo
 * placar — então o outro time é o da Liquipedia. Por segurança:
 *  - só troca um nome que não aparece em nenhuma partida da Liquipedia (um time
 *    conhecido lá, como "Zero Tenacity", nunca vira outro);
 *  - se duas séries da Liquipedia servirem com nomes diferentes, não troca.
 */
export function learnAliases(seriesList, wikiMatches) {
  const wikiAll = wikiMatches || [];
  const knownNames = [...new Set(wikiAll.flatMap((m) => [m.timeA, m.timeB]).filter((n) => n && n !== 'TBD'))];
  const isKnown = (name) => knownNames.some((n) => isSameTeamMatch(name, n));
  const wiki = wikiAll.filter((m) => m.timestamp && (m.scoreA || 0) + (m.scoreB || 0) > 0);

  const candidates = {}; // idDoTime -> Set de nomes possíveis
  const add = (id, name) => { (candidates[id] ||= new Set()).add(name); };
  for (const s of seriesList || []) {
    if (!s?.startTime || !s.preferredIdA || !s.preferredIdB) continue;
    for (const m of wiki) {
      if (Math.abs(m.timestamp - s.startTime) > WINDOW_SECS) continue;
      // Mesma ordem dos times ou invertida
      for (const [wa, wb, sa, sb] of [[m.timeA, m.timeB, m.scoreA, m.scoreB], [m.timeB, m.timeA, m.scoreB, m.scoreA]]) {
        if (sa !== s.scoreA || sb !== s.scoreB || !wa || !wb || wa === 'TBD' || wb === 'TBD') continue;
        const aOk = isSameTeamMatch(s.timeA, wa);
        const bOk = isSameTeamMatch(s.timeB, wb);
        if (aOk && !bOk && !isKnown(s.timeB)) add(s.preferredIdB, wb);
        else if (bOk && !aOk && !isKnown(s.timeA)) add(s.preferredIdA, wa);
      }
    }
  }
  const found = {};
  for (const [id, names] of Object.entries(candidates)) if (names.size === 1) found[id] = [...names][0];
  rememberAliases(found);
}

/** Série com os nomes da Liquipedia e o mapa usado pela página da partida. */
export function applyAliasesToSeries(s) {
  if (!s) return s;
  const a = aliasFor(s.preferredIdA);
  const b = aliasFor(s.preferredIdB);
  const map = aliasMap();
  const teamNames = Object.keys(map).length ? { ...map, ...(s.teamNames || {}) } : s.teamNames;
  if (!a && !b) return teamNames ? { ...s, teamNames } : s;
  return { ...s, timeA: a || s.timeA, timeB: b || s.timeB, teamNames };
}

/** Jogo ao vivo com os nomes da Liquipedia. */
export function applyAliasesToLiveGame(g) {
  const r = aliasFor(g?.radiant_team?.team_id);
  const d = aliasFor(g?.dire_team?.team_id);
  if (!r && !d) return g;
  return {
    ...g,
    radiant_name: r || g.radiant_name,
    dire_name: d || g.dire_name,
    timeA: r || g.timeA,
    timeB: d || g.timeB,
    radiant_team: r ? { ...g.radiant_team, team_name: r, name: r } : g.radiant_team,
    dire_team: d ? { ...g.dire_team, team_name: d, name: d } : g.dire_team
  };
}
