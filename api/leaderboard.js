export default async function handler(req, res) {
  const division = req.query.division || "europe";
  const url = `https://www.dota2.com/webapi/ILeaderboard/GetDivisionLeaderboard/v0001?division=${division}&leaderboard=0`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept": "application/json",
      },
    });
    const data = await response.json();
    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=3600");
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}