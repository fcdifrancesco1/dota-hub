import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Identificador da série finalizada usado na URL: o match_id do primeiro mapa.
 * Existe em toda série (mesmo sem series_id da Valve) e permite abrir o link
 * direto — a página busca o replay na OpenDota quando a série não está em memória.
 */
export function seriesKey(series) {
  const first = series?.games?.[0]?.match_id || series?.match_id;
  return first ? String(first) : null;
}

export function seriesPath(series, mapIndex = 0) {
  const key = seriesKey(series);
  if (!key) return null;
  return mapIndex > 0 ? `/partidas/${key}?jogo=${mapIndex + 1}` : `/partidas/${key}`;
}

/** Abre a página da série, levando o objeto para exibir sem esperar a API. */
export function useOpenSeries() {
  const navigate = useNavigate();
  return useCallback((series) => {
    const path = seriesPath(series);
    if (path) navigate(path, { state: { series } });
  }, [navigate]);
}
