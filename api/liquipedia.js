export default async function handler(req, res) {
  const { tournament } = req.query;
  const page = tournament || "The_International/2026/Main_Event";
  
  try {
    const response = await fetch(
      `https://liquipedia.net/dota2/api.php?action=parse&page=${encodeURIComponent(page)}&format=json`,
      {
        headers: {
          "User-Agent": "Dota2HubCommunity/1.0 (contact@dota-hub.vercel.app)"
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
      return res.status(200).json(data);
    }
    return res.status(500).json({ error: "Falha ao consultar Liquipedia" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}