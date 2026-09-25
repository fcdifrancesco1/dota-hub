import { parseLiquipediaMatches } from './_lib/parseLiquipediaMatches.js';
import { fetchLiquipediaApi } from './_lib/liquipediaClient.js';

export default async function handler(req, res) {
  try {
    const result = await fetchLiquipediaApi('Liquipedia:Matches', {
      ttlMs: 3 * 60 * 1000 // 3 minutos de cache em memória
    });

    if (result?.html) {
      // 1. Extrai exclusivamente da seção de jogos futuros/agendados da Liquipedia
      const parsedMatches = parseLiquipediaMatches(result.html, { onlyUpcoming: true });

      const now = Date.now();
      // 2. Filtra estritamente apenas jogos que NÃO foram finalizados
      const strictlyUpcoming = parsedMatches.filter((m) => {
        // Ignora jogos com vencedor declarado ou bandeira de concluído
        if (m.isCompleted || m.winner) return false;

        // Ignora jogos cujo placar já atinge o critério de vitória do formato
        const sA = Number(m.scoreA) || 0;
        const sB = Number(m.scoreB) || 0;
        const fmt = (m.formato || "BO3").toUpperCase();
        if (fmt === "BO1" && (sA >= 1 || sB >= 1)) return false;
        if (fmt === "BO3" && (sA >= 2 || sB >= 2)) return false;
        if (fmt === "BO5" && (sA >= 3 || sB >= 3)) return false;
        if (fmt === "BO2" && (sA + sB >= 2)) return false;

        // Se o horário agendado já passou há mais de 3 horas, a série já encerrou
        if (m.timestamp && (now - m.timestamp > 3 * 3600 * 1000)) {
          return false;
        }

        return true;
      });

      res.setHeader('Cache-Control', 's-maxage=180, stale-while-revalidate=360');
      return res.status(200).json(strictlyUpcoming);
    }

    return res.status(200).json([]);
  } catch (error) {
    console.error('[Upcoming API] Erro ao processar:', error.message);
    return res.status(200).json([]);
  }
}