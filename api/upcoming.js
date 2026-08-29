import { parseLiquipediaMatches } from './_lib/parseLiquipediaMatches.js';

export default async function handler(req, res) {
  try {
    const response = await fetch(
      "https://liquipedia.net/dota2/api.php?action=parse&page=Liquipedia:Matches&format=json",
      {
        headers: {
          "User-Agent": "DotaHubCommunity/2.0 (contact@dota-hub.vercel.app)",
          "Accept": "application/json"
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      const html = data?.parse?.text?.["*"] || "";
      const parsedMatches = parseLiquipediaMatches(html);

      res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");
      return res.status(200).json(parsedMatches);
    }
    return res.status(500).json([]);
  } catch (error) {
    return res.status(500).json([]);
  }
}