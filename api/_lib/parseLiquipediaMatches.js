import { cleanTeamName } from './teamName.js';

// Parser único de partidas da Liquipedia, usado por todas as rotas serverless
// que precisam ler a página "Liquipedia:Matches". Mantido em um só lugar para
// não haver cópias divergentes do mesmo regex em vários arquivos.
//
// Formato desde nov/2026: cada partida é um cartão "match-ticker-card" com o
// horário no cabeçalho, os dois "match-ticker-card__opponent" (o vencedor ganha
// a classe "winner", o placar vem num <div> logo depois do time), o campeonato
// e os links de transmissão ("Special:Stream/...").
export function parseLiquipediaMatches(html, options = {}) {
  const matches = [];
  if (!html) return matches;

  let targetHtml = html;
  // Se solicitado apenas jogos agendados/futuros, foca na seção data-toggle-area-content="1"
  if (options.onlyUpcoming) {
    const area1Match = html.match(/data-toggle-area-content="1"[\s\S]*?(?:data-toggle-area-content="2"|$)/);
    if (area1Match) targetHtml = area1Match[0];
  }

  const cards = targetHtml.replace(/&#95;/g, '_').split('<div class="match-ticker-card">').slice(1);

  for (const card of cards) {
    try {
      // 1. Horário e formato ("November 19 - Playoffs - Bo3"; sem "Bo" fica MD3)
      const tsMatch = card.match(/data-timestamp="(\d+)"/);
      const timestamp = tsMatch ? parseInt(tsMatch[1], 10) * 1000 : null;
      const header = card.split('match-ticker-card__opponents')[0];
      const fmtMatch = header.match(/\bBo(\d+)\b/i);
      const formato = fmtMatch ? `BO${fmtMatch[1]}` : 'BO3';

      // 2. Os dois times (o lookahead evita casar "match-ticker-card__opponents")
      const [leftPart = '', rightPart = ''] = card.split(/<div class="match-ticker-card__opponent(?=[ "])/).slice(1, 3);

      const cleanTeamText = (s) => String(s || '')
        .replace(/\(page does not exist\)/gi, '')
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
        .trim();

      // Nome completo em <div class="team-name"> ("Team Spirit"), abreviação em "team-shortname" ("TSpirit")
      const getTeam = (chunk) => {
        let full = cleanTeamName(cleanTeamText(chunk.match(/<div class="team-name">([^<]*)<\/div>/)?.[1]));
        const short = cleanTeamText(chunk.match(/<div class="team-shortname">([^<]*)<\/div>/)?.[1]);
        if (!full || full.includes('/') || full.includes('#')) full = short;
        return { name: full || 'TBD', short: short || full || 'TBD' };
      };

      const absoluteUrl = (src) => (src.startsWith('http') ? src : `https://liquipedia.net${src}`);

      // A Liquipedia envia duas versões do logo: "lightmode" (para fundo claro) e
      // "darkmode" (para fundo escuro). O site é escuro, então preferimos darkmode;
      // times com logo único têm só uma imagem. O logo genérico do Dota 2 é ignorado
      // para que o componente mostre as iniciais do time.
      const getLogo = (chunk, mode) => {
        const pickImg = (part) => {
          const img = part.match(/<img[^>]*>/);
          if (!img) return '';
          const srcset2x = img[0].match(/srcset="[^"]*?,\s*([^\s"]+)\s+2x"/);
          const src = img[0].match(/src="([^"]+)"/);
          return srcset2x ? srcset2x[1] : (src ? src[1] : '');
        };
        const modeSpan = chunk.match(new RegExp(`team-template-${mode}"[\\s\\S]*?<\\/span>`));
        let src = modeSpan ? pickImg(modeSpan[0]) : '';
        if (!src) src = pickImg(chunk.split('team-name-dynamic')[0]);
        if (!src || /Dota_2_default/i.test(src)) return '';
        return absoluteUrl(src);
      };

      // Placar: o <div> logo depois do bloco do time ("2", "W", "FF" ou vazio)
      const getScore = (chunk) => chunk.match(/<\/span><\/div><div>([^<]*)<\/div>/)?.[1]?.trim() || '';

      const teamA = getTeam(leftPart);
      const teamB = getTeam(rightPart);
      const timeA = teamA.name;
      const timeB = teamB.name;
      // logoA/logoB: versão para fundo escuro; *Light: versão para fundo claro
      const logoA = getLogo(leftPart, 'darkmode');
      const logoB = getLogo(rightPart, 'darkmode');
      const logoALight = getLogo(leftPart, 'lightmode');
      const logoBLight = getLogo(rightPart, 'lightmode');

      // 3. Placar ("W"/"FF" de W.O. contam como 0; o vencedor vem da classe "winner")
      const scoreA = parseInt(getScore(leftPart), 10) || 0;
      const scoreB = parseInt(getScore(rightPart), 10) || 0;

      // 4. Torneio: nome exibido e página do campeonato (ex.: "BLAST/SLAM/8"), a
      //    mesma usada em /api/tournaments — liga a partida ao tier do campeonato
      let torneio = 'Torneio Profissional';
      let tournamentPage = null;
      const tourney = card.match(/match-ticker-card-tournament-name"[^>]*><a href="\/dota2\/([^"#]+)[^"]*"[^>]*>([^<]+)<\/a>/);
      if (tourney) {
        torneio = cleanTeamText(tourney[2]).replace(/ - [A-Za-z]+ \d+$/i, '').trim() || torneio;
        try { tournamentPage = decodeURIComponent(tourney[1]); } catch { tournamentPage = tourney[1]; }
      }

      // 5. Transmissões: todos os canais da partida (Twitch, YouTube, Kick)
      const streamUrls = [...new Set([...card.matchAll(/href="([^"]*Special:Stream\/[^"]+)"/g)].map((x) => `https://liquipedia.net${x[1]}`))];
      const streamUrl = streamUrls[0] || '';

      // 6. Série encerrada: vencedor marcado, horário marcado como "finished" ou placar final
      const hasWinnerLeft = /^[^>]*\bwinner\b/.test(leftPart);
      const hasWinnerRight = !hasWinnerLeft && /^[^>]*\bwinner\b/.test(rightPart);
      const finishedFlag = /data-finished="finished"/.test(header);

      const isScoreFinished = (formato === 'BO1' && (scoreA >= 1 || scoreB >= 1)) ||
                              (formato === 'BO3' && (scoreA >= 2 || scoreB >= 2)) ||
                              (formato === 'BO5' && (scoreA >= 3 || scoreB >= 3)) ||
                              (formato === 'BO2' && (scoreA + scoreB >= 2));

      const isCompleted = hasWinnerLeft || hasWinnerRight || finishedFlag || isScoreFinished;
      let winner = null;
      if (hasWinnerLeft || (isScoreFinished && scoreA > scoreB)) winner = timeA;
      else if (hasWinnerRight || (isScoreFinished && scoreB > scoreA)) winner = timeB;

      if (timeA !== 'TBD' || timeB !== 'TBD') {
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
          tournamentPage,
          streamUrl,
          streamUrls,
          data: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
          timestamp,
          isCompleted,
          winner
        });
      }
    } catch {
      // Ignora erro de parsing isolado de um cartão de partida
    }
  }

  return matches;
}
