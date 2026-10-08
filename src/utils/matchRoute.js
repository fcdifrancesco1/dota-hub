import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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

// Nome da página de origem, para o botão "Voltar" da série
function backLabelFor(pathname) {
  if (pathname.startsWith('/campeonatos/')) return 'Campeonato';
  if (pathname.startsWith('/times/')) return 'Time';
  if (pathname.startsWith('/partidas')) return 'Partidas';
  if (pathname === '/') return 'Início';
  return null;
}

/**
 * Abre a página da série, levando o objeto para exibir sem esperar a API e a
 * página de origem para o botão "Voltar" (ex.: o campeonato de onde veio).
 * `label` opcional substitui o nome padrão da origem (ex.: nome do campeonato).
 */
export function useOpenSeries() {
  const navigate = useNavigate();
  const location = useLocation();
  return useCallback((series, label) => {
    const path = seriesPath(series);
    if (!path) return;
    const from = {
      path: `${location.pathname}${location.search}`,
      label: label || backLabelFor(location.pathname) || 'Partidas'
    };
    navigate(path, { state: { series, from } });
  }, [navigate, location.pathname, location.search]);
}
