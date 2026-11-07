import { getCached, setCache, fetchWithTimeout } from './api';

// Feeds da Valve em português, via /api/valve (a Valve não libera CORS)
const DAY = 24 * 3600 * 1000;

async function cachedFeed(key, query) {
  const cached = getCached(key, DAY);
  if (cached) return cached;
  // A Valve às vezes recusa ou demora um pedido isolado: tenta mais uma vez antes de desistir
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetchWithTimeout(`/api/valve?${query}`, {}, 12000).catch(() => null);
    const data = res?.ok ? await res.json().catch(() => null) : null;
    if (data?.result?.data) {
      setCache(key, data.result.data);
      return data.result.data;
    }
  }
  return null;
}

/** Heróis da Valve por id: { complexity, name_loc, primary_attr }. */
export async function fetchValveHeroList() {
  const data = await cachedFeed('valve_herolist_v1', 'type=herolist');
  return Object.fromEntries((data?.heroes || []).map((h) => [h.id, h]));
}

/** Todos os itens da Valve: [{ id, name: 'item_blink', name_loc, neutral_item_tier }]. */
export async function fetchValveItemList() {
  const data = await cachedFeed('valve_itemlist_v1', 'type=itemlist');
  return data?.itemabilities || [];
}

/** Ficha completa de um item (descrição, bônus, custo, recarga, lore). */
export async function fetchValveItem(itemId) {
  const data = await cachedFeed(`valve_item_v1_${itemId}`, `type=itemdata&item_id=${encodeURIComponent(itemId)}`);
  return data?.items?.[0] || null;
}

const CDN = 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react';
/** Ícone do item pelo nome interno, com ou sem o prefixo "item_". */
export const itemImg = (name) => `${CDN}/items/${String(name).replace(/^item_/, '')}.png`;
/** Retrato vertical do herói (o da tela de heróis do cliente), pelo nome curto ("antimage"). */
export const heroVertImg = (short) => `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/heroes/${short}_vert.jpg`;
/** Ícone do atributo principal: str | agi | int | all. */
export const attrIcon = (attr) => `${CDN}/icons/hero_${{ str: 'strength', agi: 'agility', int: 'intelligence', all: 'universal' }[attr]}.png`;
