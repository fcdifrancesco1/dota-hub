// Parser único de partidas da Liquipedia, usado por todas as rotas serverless
// que precisam ler a página "Liquipedia:Matches". Mantido em um só lugar para
// não haver cópias divergentes do mesmo regex em vários arquivos.
export function parseLiquipediaMatches(html, options = {}) {
  const matches = [];
  if (!html) return matches;

  let targetHtml = html;
  // Se solicitado apenas jogos agendados/futuros, foca na seção data-toggle-area-content="1"
  if (options.onlyUpcoming) {
    const area1Match = html.match(/data-toggle-area-content="1"[\s\S]*?(?:data-toggle-area-content="2"|$)/);
    if (area1Match) {
      targetHtml = area1Match[0];
    }
  }

  const matchBlocks = targetHtml.split('<div class="match-info">').slice(1);

  matchBlocks.forEach((block) => {
    try {
      // 1. Timestamp
      const tsMatch = block.match(/data-timestamp="(\d+)"/);
      const timestamp = tsMatch ? parseInt(tsMatch[1], 10) * 1000 : null;

      // 2. Divisão estrita e limpa dos dois times pelo scoreholder intermediário
      const scoreHolderSplit = block.split(/<div class="match-info-header-scoreholder"/);
      const leftPart = scoreHolderSplit[0] || "";
      const rightAndRest = scoreHolderSplit[1] || "";
      const rightPart = rightAndRest.split(/<div class="match-info-tournament"/)[0] || "";

      const cleanTeamText = (s) => String(s || '')
        .replace(/\(page does not exist\)/gi, '')
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
        .trim();

      // Nome completo vem do title do link em <span class="name"> ("Team Spirit"),
      // e o texto do link é a abreviação exibida pela Liquipedia ("TSpirit").
      const getTeam = (chunk) => {
        const nameMatch = chunk.match(/<span class="name"[^>]*><a[^>]*?title="([^"]+)"[^>]*>([^<]+)<\/a>/);
        const plainNameMatch = chunk.match(/<span class="name"[^>]*>([^<]+)<\/span>/);
        let full = nameMatch ? cleanTeamText(nameMatch[1]) : "";
        const short = nameMatch ? cleanTeamText(nameMatch[2]) : cleanTeamText(plainNameMatch?.[1]);
        if (!full || full.includes('/') || full.includes('#')) full = short;
        return { name: full || "TBD", short: short || full || "TBD" };
      };

      const absoluteUrl = (src) => (src.startsWith('http') ? src : `https://liquipedia.net${src}`);

      // A Liquipedia envia duas versões do logo: "lightmode" (para fundo claro) e
      // "darkmode" (para fundo escuro). O site é escuro, então preferimos darkmode;
      // times com logo único usam "allmode". O logo genérico do Dota 2 é ignorado
      // para que o componente mostre as iniciais do time.
      const getLogo = (chunk, mode) => {
        const pickImg = (html) => {
          const img = html.match(/<img[^>]*>/);
          if (!img) return "";
          const srcset2x = img[0].match(/srcset="[^"]*?,\s*([^\s"]+)\s+2x"/);
          const src = img[0].match(/src="([^"]+)"/);
          return srcset2x ? srcset2x[1] : (src ? src[1] : "");
        };
        const modeSpan = chunk.match(new RegExp(`team-template-${mode}"[\\s\\S]*?<\\/span>`));
        let src = modeSpan ? pickImg(modeSpan[0]) : "";
        if (!src) src = pickImg(chunk);
        if (!src || /Dota_2_default/i.test(src)) return "";
        return absoluteUrl(src);
      };

      const teamA = getTeam(leftPart);
      const teamB = getTeam(rightPart);
      const timeA = teamA.name;
      const timeB = teamB.name;
      // logoA/logoB: versão para fundo escuro; *Light: versão para fundo claro
      const logoA = getLogo(leftPart, 'darkmode');
      const logoB = getLogo(rightPart, 'darkmode');
      const logoALight = getLogo(leftPart, 'lightmode');
      const logoBLight = getLogo(rightPart, 'lightmode');

      // 3. Formato
      const formatMatch = block.match(/\((Bo\d+)\)/i);
      const formato = formatMatch ? formatMatch[1].toUpperCase() : "BO3";

      // 4. Placar (suporta match-info-header-score e match-info-header-scoreholder-score)
      const scoreMatch = block.match(/class="match-info-header-(?:scoreholder-)?score">(\d+)<\/span><span class="match-info-header-scoreholder-divider">:<\/span><span class="match-info-header-(?:scoreholder-)?score">(\d+)<\/span>/);
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

      // 7. Detecção se a série já encerrou (Vencedor marcado ou placar final)
      const hasWinnerLeft = /match-info-header-opponent-left[^"]*match-info-header-winner/.test(block);
      const hasWinnerRight = !hasWinnerLeft && /match-info-header-winner/.test(rightPart);
      const hasLoser = block.includes('match-info-header-loser');

      const fmt = formato.toUpperCase();
      const isScoreFinished = (fmt === "BO1" && (scoreA >= 1 || scoreB >= 1)) ||
                              (fmt === "BO3" && (scoreA >= 2 || scoreB >= 2)) ||
                              (fmt === "BO5" && (scoreA >= 3 || scoreB >= 3)) ||
                              (fmt === "BO2" && (scoreA + scoreB >= 2));

      const isCompleted = hasWinnerLeft || hasWinnerRight || hasLoser || isScoreFinished;
      let winner = null;
      if (hasWinnerLeft || (isScoreFinished && scoreA > scoreB)) winner = timeA;
      else if (hasWinnerRight || (isScoreFinished && scoreB > scoreA)) winner = timeB;

      if (timeA && timeB && (timeA !== "TBD" || timeB !== "TBD")) {
        matches.push({
          timeA,
          timeB,
          shortA: teamA.short,
          shortB: teamB.short,
          logoA,
          logoB,
          logoALight,
          logoBLight,
          formato,
          scoreA,
          scoreB,
          torneio,
          streamUrl,
          data: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
          timestamp,
          isCompleted,
          winner
        });
      }
    } catch (err) {
      // Ignora erro de parsing isolado de um bloco de partida
    }
  });

  return matches;
}
