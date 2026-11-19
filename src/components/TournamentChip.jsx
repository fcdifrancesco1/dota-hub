import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { fetchTournaments, getCachedTournaments } from '../services/api';
import { liquipediaImage } from '../utils/liquipediaImage';
import { findTournamentForMatch, tournamentPath } from '../utils/tournamentFormat';

const CHIP = 'inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-amber-400 bg-surface-2 border border-line px-3 py-1 rounded-full shadow-sm';

/**
 * Selo do campeonato de uma partida: acha o campeonato na lista da Liquipedia
 * (pela liga da Valve ou pelo nome), mostra a logo oficial e leva à página dele.
 * Sem campeonato conhecido, mostra só o nome.
 */
export default function TournamentChip({ leagueId, name, suffix, className = '' }) {
  const { theme } = useTheme();
  const [tournaments, setTournaments] = useState(getCachedTournaments);
  useEffect(() => {
    let active = true;
    fetchTournaments().then((list) => { if (active && list?.length) setTournaments(list); });
    return () => { active = false; };
  }, []);

  const tournament = (leagueId && tournaments.find((t) => String(t.leagueId) === String(leagueId)))
    || findTournamentForMatch({ torneio: name }, tournaments);
  const logo = tournament?.icon?.[theme] || tournament?.image?.[theme] || null;
  const [logoFailed, setLogoFailed] = useState(false);
  useEffect(() => { setLogoFailed(false); }, [logo]);

  const content = (
    <>
      {logo && !logoFailed && (
        <img src={liquipediaImage(logo)} alt="" referrerPolicy="no-referrer"
          className="h-4 w-auto max-w-[48px] object-contain" onError={() => setLogoFailed(true)} />
      )}
      {tournament?.name || name || 'Torneio profissional'}
      {suffix}
    </>
  );

  return tournament ? (
    <Link to={tournamentPath(tournament)} className={`${CHIP} hover:border-amber-500/60 transition-colors ${className}`} title={`Ver campeonato ${tournament.name}`}>
      {content}
    </Link>
  ) : (
    <span className={`${CHIP} ${className}`}>{content}</span>
  );
}
