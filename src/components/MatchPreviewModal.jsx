import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Loader2, Trophy, ChevronRight } from 'lucide-react';
import TeamLogo from '../utils/teamLogos';
import { useApp } from '../context/AppContext';
import { fetchTournaments, fetchTournamentPlayerStats, getHeroImg, getHeroName } from '../services/api';
import { resolveTeamId, fetchTeamPage } from '../services/teamPage';
import { findTournamentForMatch, tournamentPath } from '../utils/tournamentFormat';
import { teamPath } from '../utils/teamRoute';

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const DASH = '-';

/**
 * Jogadores de um time com as estatísticas no campeonato. A escalação vem do
 * time na OpenDota; sem ela, usa quem jogou pelo time no campeonato.
 */
async function loadTeamSide(name, statsByAccount, tournamentPlayers) {
  const teamId = await resolveTeamId(name).catch(() => null);
  const page = teamId ? await fetchTeamPage(teamId).catch(() => null) : null;
  let roster = (page?.roster || []).map((p) => ({ accountId: p.accountId, name: p.name }));
  if (!roster.length) {
    roster = tournamentPlayers
      .filter((p) => (teamId && p.teamId === teamId) || norm(p.teamName) === norm(name))
      .sort((a, b) => b.games - a.games)
      .slice(0, 5)
      .map((p) => ({ accountId: p.accountId, name: p.name }));
  }
  return {
    teamId,
    players: roster.map((p) => ({ ...p, stats: statsByAccount.get(p.accountId) || null }))
  };
}

/** Janela com as estatísticas dos jogadores das duas equipes no campeonato até agora. */
export default function MatchPreviewModal({ match, onClose }) {
  const { constants } = useApp();
  const [data, setData] = useState(null);

  // Fecha com Esc e trava a rolagem da página por trás
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setData(null);
    (async () => {
      const tournament = findTournamentForMatch(match, await fetchTournaments());
      // A OpenDota limita requisições por minuto: tenta de novo uma vez antes de desistir
      let stats = null;
      if (tournament?.leagueId) {
        stats = await fetchTournamentPlayerStats(tournament.leagueId);
        if (!stats) {
          await new Promise((r) => setTimeout(r, 2500));
          stats = await fetchTournamentPlayerStats(tournament.leagueId);
        }
      }
      const players = stats?.players || [];
      const byAccount = new Map(players.map((p) => [p.accountId, p]));
      const [a, b] = await Promise.all([
        loadTeamSide(match.timeA, byAccount, players),
        loadTeamSide(match.timeB, byAccount, players)
      ]);
      // statsFailed: a consulta falhou (diferente de "ninguém jogou ainda")
      if (active) setData({ tournament, a, b, statsFailed: Boolean(tournament?.leagueId) && !stats });
    })();
    return () => { active = false; };
  }, [match, attempt]);

  const sides = data ? [
    { name: match.timeA, logo: match.logoA, ...data.a },
    { name: match.timeB, logo: match.logoB, ...data.b }
  ] : [];

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${match.timeA} vs ${match.timeB}`}
    >
      <div
        className="bg-surface border border-line rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CABEÇALHO */}
        <div className="flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-line">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 truncate">
              {match.tourneyName || 'Torneio'} · {match.formato}
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm sm:text-lg font-black text-white">
              <TeamLogo teamName={match.timeA} logoUrl={match.logoA} className="w-6 h-6 shrink-0" />
              <span className="break-words">{match.timeA}</span>
              <span className="text-[10px] text-gray-500 font-black px-1">VS</span>
              <span className="break-words">{match.timeB}</span>
              <TeamLogo teamName={match.timeB} logoUrl={match.logoB} className="w-6 h-6 shrink-0" />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTEÚDO */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-6">
          {!data ? (
            <div className="py-12 flex flex-col items-center gap-3 text-gray-400">
              <Loader2 className="w-7 h-7 animate-spin text-amber-400" />
              <span className="text-xs">Buscando estatísticas dos jogadores no torneio...</span>
            </div>
          ) : (
            <>
              <p className="text-[11px] text-gray-400">
                {data.tournament
                  ? <>Médias por partida no <strong className="text-gray-200">{data.tournament.name}</strong> até agora. {DASH} = ainda não jogou no campeonato.</>
                  : 'Campeonato não identificado; sem estatísticas do torneio.'}
              </p>

              {data.statsFailed && (
                <div className="flex flex-wrap items-center justify-between gap-2 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300">
                  <span>Não foi possível carregar as estatísticas do torneio agora (OpenDota).</span>
                  <button
                    type="button"
                    onClick={() => setAttempt((n) => n + 1)}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 font-bold uppercase tracking-wider text-[10px]"
                  >
                    Tentar novamente
                  </button>
                </div>
              )}

              {sides.map((side) => (
                <section key={side.name}>
                  <h3 className="flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-wider text-white">
                    <TeamLogo teamName={side.name} teamId={side.teamId} logoUrl={side.logo} className="w-5 h-5" />
                    {side.teamId
                      ? <Link to={teamPath(side.teamId, side.name)} onClick={onClose} className="hover:text-amber-400">{side.name}</Link>
                      : side.name}
                  </h3>
                  {side.players.length === 0 ? (
                    <div className="bg-surface-2 border border-line rounded-xl p-4 text-center text-xs text-gray-400">
                      Escalação não encontrada.
                    </div>
                  ) : (
                    <div className="bg-surface-2 border border-line rounded-xl overflow-x-auto">
                      <table className="w-full text-left text-xs min-w-[600px]">
                        <thead className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          <tr className="border-b border-line">
                            <th className="p-2.5 pl-3">Jogador</th>
                            <th className="p-2.5 text-center">Jogos</th>
                            <th className="p-2.5 text-center">Vitórias</th>
                            <th className="p-2.5 text-center">KDA</th>
                            <th className="p-2.5 text-center">K / D / A</th>
                            <th className="p-2.5 text-center">GPM / XPM</th>
                            <th className="p-2.5 pr-3">Heróis</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line text-gray-300">
                          {side.players.map(({ accountId, name, stats: s }) => (
                            <tr key={accountId}>
                              <td className="p-2.5 pl-3 font-bold text-white whitespace-nowrap">{name}</td>
                              <td className="p-2.5 text-center font-mono">{s ? s.games : DASH}</td>
                              <td className="p-2.5 text-center font-mono font-bold">
                                {s ? <span className={s.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}>{Math.round(s.winRate)}%</span> : DASH}
                              </td>
                              <td className="p-2.5 text-center font-mono font-black text-amber-400">{s ? s.kda.toFixed(2) : DASH}</td>
                              <td className="p-2.5 text-center font-mono whitespace-nowrap">
                                {s ? `${s.kills.toFixed(1)} / ${s.deaths.toFixed(1)} / ${s.assists.toFixed(1)}` : DASH}
                              </td>
                              <td className="p-2.5 text-center font-mono whitespace-nowrap">{s ? `${s.gpm} / ${s.xpm}` : DASH}</td>
                              <td className="p-2.5 pr-3">
                                {s ? (
                                  <div className="flex items-center gap-1">
                                    {s.topHeroes.map((h) => (
                                      <img
                                        key={h.heroId}
                                        src={getHeroImg(constants, h.heroId)}
                                        alt={getHeroName(constants, h.heroId)}
                                        title={`${getHeroName(constants, h.heroId)}: ${h.count} ${h.count === 1 ? 'jogo' : 'jogos'}`}
                                        className="w-9 h-5 rounded object-cover border border-line"
                                      />
                                    ))}
                                  </div>
                                ) : DASH}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              ))}

              {data.tournament && (
                <Link
                  to={tournamentPath(data.tournament)}
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 hover:text-amber-300"
                >
                  <Trophy className="w-3.5 h-3.5" /> Ver todos os jogadores do campeonato <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
