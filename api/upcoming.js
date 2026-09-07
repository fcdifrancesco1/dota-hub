import { parseLiquipediaMatches } from './_lib/parseLiquipediaMatches.js';

export default async function handler(req, res) {
  try {
    const response = await fetch(
      "https://liquipedia.net/dota2/api.php?action=parse&page=Liquipedia:Matches&format=json",
      {
        headers: {
          "User-Agent": "DotaHubCommunity/2.0 (contact@dota-hub.vercel.app)",
          "Accept": "application/json"
        },
        signal: AbortSignal.timeout(5000)
      }
    );

    if (response.ok) {
      const data = await response.json();
      const html = data?.parse?.text?.["*"] || "";
      const parsedMatches = parseLiquipediaMatches(html);

      res.setHeader("Cache-Control", "s-maxage=180, stale-while-revalidate=600");
      return res.status(200).json(parsedMatches);
    }
    return res.status(200).json([]);
  } catch (error) {
    return res.status(200).json([]);
  }
}