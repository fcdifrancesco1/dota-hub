/**
 * IDs de liga (OpenDota/Valve) dos campeonatos que a Liquipedia acompanha
 * (Tier 1 a 3, em andamento, próximos e encerrados há pouco). Só partidas
 * dessas ligas aparecem no site: a OpenDota marca como "professional" também
 * ligas amadoras (ex.: 护鼠宝, com partidas "Radiant" vs "Dire" sem times).
 *
 * Lê a nossa própria rota /api/tournaments, que fica no cache da Vercel, em vez
 * de consultar a Liquipedia de novo. Guarda o resultado por 30 minutos.
 * Retorna null quando a lista não está disponível (quem chama decide o plano B).
 */
let cache = { ids: null, expiresAt: 0 };

export async function getTournamentLeagueIds(req) {
  if (cache.ids && Date.now() < cache.expiresAt) return cache.ids;
  try {
    const host = req?.headers?.['x-forwarded-host'] || req?.headers?.host;
    if (!host) return cache.ids;
    const proto = req.headers['x-forwarded-proto'] || (/^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? 'http' : 'https');
    const r = await fetch(`${proto}://${host}/api/tournaments`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000)
    });
    const list = r.ok ? await r.json() : null;
    const ids = new Set((Array.isArray(list) ? list : []).map((t) => Number(t.leagueId)).filter(Boolean));
    if (ids.size > 0) cache = { ids, expiresAt: Date.now() + 30 * 60 * 1000 };
  } catch (err) {
    console.warn('[Ligas] Falha ao carregar os campeonatos da Liquipedia:', err.message);
  }
  return cache.ids; // pode ser a lista anterior (expirada) ou null
}
