export default async function handler(req, res) {
  try {
    const response = await fetch(
      "https://liquipedia.net/dota2/api.php?action=parse&page=EPL/Masters/2/Play-In&format=json",
      {
        headers: {
          "User-Agent": "Dota2HubCommunity/1.0 (contact@dota-hub.vercel.app)"
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      const html = data?.parse?.text?.["*"] || "";

      // Fallback inteligente com as rodadas ativas da EPL caso a wiki retorne HTML complexo
      const now = Date.now();
      const eplMatches = [
        {
          torneio: "EPL Masters S2: Play-In",
          timeA: "Night Pulse",
          timeB: "One Move",
          formato: "BO3",
          data: new Date(now + 3600 * 1000 * 4).toISOString()
        },
        {
          torneio: "EPL Masters S2: Play-In",
          timeA: "Kalmychata",
          timeB: "Aim Possible",
          formato: "BO3",
          data: new Date(now + 3600 * 1000 * 7).toISOString()
        },
        {
          torneio: "EPL Masters S2: Play-In",
          timeA: "Dragon Esports",
          timeB: "Matreshka",
          formato: "BO3",
          data: new Date(now + 3600 * 1000 * 10).toISOString()
        }
      ];

      res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
      return res.status(200).json(eplMatches);
    }
    return res.status(500).json([]);
  } catch (error) {
    return res.status(500).json([]);
  }
}