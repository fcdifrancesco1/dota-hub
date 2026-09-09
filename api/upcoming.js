import { parseLiquipediaMatches } from './_lib/parseLiquipediaMatches.js';
import { fetchLiquipediaApi } from './_lib/liquipediaClient.js';

export default async function handler(req, res) {
  try {
    const result = await fetchLiquipediaApi('Liquipedia:Matches', {
      ttlMs: 5 * 60 * 1000 // 5 minutos de cache em memória
    });

    if (result?.html) {
      const parsedMatches = parseLiquipediaMatches(result.html);
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
      return res.status(200).json(parsedMatches);
    }

    return res.status(200).json([]);
  } catch (error) {
    console.error('[Upcoming API] Erro ao processar:', error.message);
    return res.status(200).json([]);
  }
}