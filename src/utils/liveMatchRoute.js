import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const slug = (s) => String(s || '')
  .toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

function teamNames(game) {
  return [
    game?.timeA || game?.radiant_name || game?.radiant_team?.team_name || game?.radiant_team?.name,
    game?.timeB || game?.dire_name || game?.dire_team?.team_name || game?.dire_team?.name
  ];
}

/**
 * Identificador da partida ao vivo usado na URL: o match_id da Valve quando
 * existe (permite abrir o link direto ou recarregar a página); caso contrário,
 * um slug com os nomes dos times.
 */
export function liveMatchKey(game) {
  const id = game?.match_id || game?.matchId;
  if (id && String(id) !== '0') return String(id);
  const [a, b] = teamNames(game);
  return `${slug(a) || 'radiant'}-vs-${slug(b) || 'dire'}`;
}

export function liveMatchPath(game) {
  return `/ao-vivo/${encodeURIComponent(liveMatchKey(game))}`;
}

/** Abre a página da partida, levando o objeto do jogo para exibir sem esperar a API. */
export function useOpenLiveMatch() {
  const navigate = useNavigate();
  return useCallback((game) => {
    if (!game) return;
    navigate(liveMatchPath(game), { state: { game } });
  }, [navigate]);
}
