// Abre uma série da agenda da Liquipedia que já teve mapas jogados, mas que a
// lista de partidas recentes da OpenDota ainda não trouxe: os números dos mapas
// vêm do chaveamento do campeonato na Liquipedia (links de replay), e a página
// da partida busca cada mapa direto na OpenDota pelo número.
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchTournamentStandings, isSeriesMatch } from '../services/api';

/** Números dos mapas jogados da série, segundo o chaveamento da Liquipedia (ou []). */
export async function findWikiSeriesMapIds(m) {
  const played = (m?.scoreA || 0) + (m?.scoreB || 0);
  if (!m?.tournamentPage || played === 0) return [];
  const { brackets = [] } = await fetchTournamentStandings(m.tournamentPage);
  let found = null;
  const walk = (node) => {
    if (!node || found) return;
    const match = node.match;
    const [a, b] = match?.opponents || [];
    if (a?.name && b?.name && isSeriesMatch(m.timeA, m.timeB, a.name, b.name) && match.matchIds?.length) {
      // Mesmo confronto pode se repetir no chaveamento: fica com o mais próximo do horário
      if (!m.timestamp || !match.timestamp || Math.abs(match.timestamp - m.timestamp) < 12 * 3600) found = match;
    }
    (node.children || []).forEach(walk);
  };
  for (const bracket of brackets) (bracket.roots || []).forEach(walk);
  // Só os mapas já decididos (o seguinte pode estar em andamento)
  return found ? found.matchIds.slice(0, played).map(String) : [];
}

/** Série no formato da página /partidas/:id, montada com os dados da Liquipedia. */
export function seriesFromWiki(m, mapIds) {
  return {
    series_id: null,
    stage: m.tourneyName || m.torneio || 'Torneio',
    formato: m.formato,
    timeA: m.timeA,
    timeB: m.timeB,
    logoA: m.logoA,
    logoB: m.logoB,
    scoreA: m.scoreA || 0,
    scoreB: m.scoreB || 0,
    startTime: m.timestamp || null,
    lastMatchTime: m.timestamp || null,
    games: mapIds.map((id, idx) => ({ mapNumber: idx + 1, match_id: id }))
  };
}

/**
 * Abre a página da série (mapas já jogados) ou, se ainda não houver mapa
 * conhecido, chama `fallback` (ex.: janela de estatísticas dos jogadores).
 */
export function useOpenWikiSeries() {
  const navigate = useNavigate();
  return useCallback(async (m, fallback) => {
    try {
      const ids = await findWikiSeriesMapIds(m);
      if (ids.length) {
        const series = seriesFromWiki(m, ids);
        const { pathname, search } = window.location;
        navigate(`/partidas/${ids[0]}`, { state: { series, from: { path: pathname + search, label: pathname === '/' ? 'Início' : 'Partidas' } } });
        return;
      }
    } catch { /* sem chaveamento: segue para o plano B */ }
    fallback?.(m);
  }, [navigate]);
}
