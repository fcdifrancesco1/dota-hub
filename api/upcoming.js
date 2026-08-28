function parseLiquipediaMatches(html) {
  const matches = [];
  const matchBlocks = html.split('<div class="match-info">').slice(1);

  matchBlocks.forEach((block) => {
    try {
      // 1. Timestamp
      const tsMatch = block.match(/data-timestamp="(\d+)"/);
      const timestamp = tsMatch ? parseInt(tsMatch[1], 10) * 1000 : null;

      // 2. Times (Left e Right)
      const leftBlockMatch = block.match(/class="match-info-header-opponent[^"]*match-info-header-opponent-left"([\s\S]*?)<div class="match-info-header-scoreholder"/);
      const rightBlockMatch = block.match(/class="match-info-header-opponent"[^>]*>([\s\S]*?)<\/div><\/div><div class="match-info-tournament"/);

      let timeA = "TBD";
      let logoA = "";
      if (leftBlockMatch) {
        const leftBlock = leftBlockMatch[1];
        const titleMatch = leftBlock.match(/class="team-template-image-icon[^"]*"[^>]*><a[^>]*title="([^"]+)"/);
        const nameMatch = leftBlock.match(/<span class="name"[^>]*><a[^>]*>([^<]+)<\/a>/);
        timeA = (titleMatch ? titleMatch[1] : (nameMatch ? nameMatch[1] : "TBD")).trim();
        timeA = timeA.replace(/\(page does not exist\)/gi, '').trim();

        const imgMatch = leftBlock.match(/<img[^>]*src="([^"]+)"/);
        if (imgMatch) {
          logoA = imgMatch[1].startsWith('http') ? imgMatch[1] : `https://liquipedia.net${imgMatch[1]}`;
        }
      }

      let timeB = "TBD";
      let logoB = "";
      if (rightBlockMatch) {
        const rightBlock = rightBlockMatch[1];
        const titleMatch = rightBlock.match(/class="team-template-image-icon[^"]*"[^>]*><a[^>]*title="([^"]+)"/);
        const nameMatch = rightBlock.match(/<span class="name"[^>]*><a[^>]*>([^<]+)<\/a>/);
        timeB = (titleMatch ? titleMatch[1] : (nameMatch ? nameMatch[1] : "TBD")).trim();
        timeB = timeB.replace(/\(page does not exist\)/gi, '').trim();

        const imgMatch = rightBlock.match(/<img[^>]*src="([^"]+)"/);
        if (imgMatch) {
          logoB = imgMatch[1].startsWith('http') ? imgMatch[1] : `https://liquipedia.net${imgMatch[1]}`;
        }
      }

      // 3. Formato
      const formatMatch = block.match(/\((Bo\d+)\)/i);
      const formato = formatMatch ? formatMatch[1].toUpperCase() : "BO3";

      // 4. Placar
      const scoreMatch = block.match(/class="match-info-header-score">(\d+)<\/span><span class="match-info-header-scoreholder-divider">:<\/span><span class="match-info-header-score">(\d+)<\/span>/);
      const scoreA = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;
      const scoreB = scoreMatch ? parseInt(scoreMatch[2], 10) : 0;

      // 5. Torneio
      let torneio = "Torneio Profissional";
      const tourneyNameMatch = block.match(/class="match-info-tournament-name"[^>]*>[\s\S]*?<span>([^<]+)<\/span>/);
      if (tourneyNameMatch) {
        torneio = tourneyNameMatch[1].replace(/ - [A-Za-z]+ \d+$/i, '').trim();
      } else {
        const tourneyBlock = block.match(/class="match-info-tournament"[\s\S]*?<\/div>/);
        if (tourneyBlock) {
          const tTitle = tourneyBlock[0].match(/title="([^"#]+)/);
          if (tTitle) {
            torneio = tTitle[1].replace(/_/g, ' ').replace(/\//g, ' ').trim();
          }
        }
      }

      // 6. Stream link
      let streamUrl = "";
      const streamMatch = block.match(/href="([^"]*Special:Stream\/[^"]+)"/);
      if (streamMatch) {
        streamUrl = `https://liquipedia.net${streamMatch[1]}`;
      }

      if (timeA && timeB && (timeA !== "TBD" || timeB !== "TBD")) {
        matches.push({
          timeA,
          timeB,
          logoA,
          logoB,
          formato,
          scoreA,
          scoreB,
          torneio,
          streamUrl,
          data: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
          timestamp
        });
      }
    } catch (err) {
      // Ignora erro de parsing isolado
    }
  });

  return matches;
}

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