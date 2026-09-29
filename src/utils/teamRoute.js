import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Caminho da página do time: usa o ID da OpenDota quando conhecido; senão o
 * nome, que a página resolve pela lista de times da OpenDota.
 */
export function teamPath(teamId, teamName) {
  const id = teamId && /^\d+$/.test(String(teamId)) ? String(teamId) : null;
  const ref = id || (teamName ? encodeURIComponent(teamName) : null);
  return ref ? `/times/${ref}` : null;
}

export function useOpenTeam() {
  const navigate = useNavigate();
  return useCallback((teamId, teamName) => {
    const path = teamPath(teamId, teamName);
    if (path) navigate(path);
  }, [navigate]);
}
