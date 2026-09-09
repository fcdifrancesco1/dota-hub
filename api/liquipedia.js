import { fetchLiquipediaApi } from './_lib/liquipediaClient.js';

export default async function handler(req, res) {
  const { tournament } = req.query;
  const page = tournament || "The_International/2026/Main_Event";
  
  try {
    const result = await fetchLiquipediaApi(page, {
      ttlMs: 30 * 60 * 1000 // 30 minutos de cache em memória
    });

    if (result?.raw) {
      res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=1800");
      return res.status(200).json(result.raw);
    }

    return res.status(500).json({ error: "Falha ao consultar Liquipedia" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}