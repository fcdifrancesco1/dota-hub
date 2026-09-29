import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Shield,
  Trophy,
  Users
} from 'lucide-react';
import TeamLogo from '../utils/teamLogos';
import { useApp } from '../context/AppContext';
import { getHeroImg, getHeroName } from '../services/api';
import { fetchPlayerStats, fetchTeamPage, resolveTeamId } from '../services/teamPage';
import { useOpenSeries } from '../utils/matchRoute';

const MEDALS = ['', 'Arauto', 'Guardião', 'Cruzado', 'Arconte', 'Lenda', 'Ancestral', 'Divino', 'Imortal'];

function medalLabel(rankTier, leaderboardRank) {
  if (!rankTier) return null;
  const medal = MEDALS[Math.floor(rankTier / 10)];
  if (!medal) return null;
  if (leaderboardRank) return `${medal} #${leaderboardRank}`;
  const stars = rankTier % 10;
  return stars && medal !== 'Imortal' ? `${medal} ${stars}` : medal;
}

const fmtDate = (secs) => (secs
  ? new Date(secs * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo' })
  : '—');
const pct = (w, total) => (total ? Math.round((w / total) * 100) : 0);

export default function TeamPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { constants } = useApp();
  const openSeries = useOpenSeries();

  const [state, setState] = useState({ status: 'loading', data: null });
  const [playerStats, setPlayerStats] = useState({});

  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading', data: null });
    setPlayerStats({});

    (async () => {
      const teamId = await resolveTeamId(id);
      if (cancelled) return;
      if (!teamId) { setState({ status: 'notfound', data: null }); return; }
      // Link por nome: troca a URL para o ID, que é estável
      if (String(teamId) !== String(id)) navigate(`/times/${teamId}`, { replace: true });

      const data = await fetchTeamPage(teamId).catch(() => null);
      if (cancelled) return;
      if (!data) { setState({ status: 'error', data: null }); return; }
      setState({ status: 'ok', data });

      // Estatísticas de cada jogador chegam de forma independente
      data.roster.forEach((p) => {
        fetchPlayerStats(p.accountId).then((stats) => {
          if (!cancelled) setPlayerStats((prev) => ({ ...prev, [p.accountId]: stats || { stats: null } }));
        });
      });
    })();

    return () => { cancelled = true; };
  }, [id, navigate]);

  const teamName = state.data?.team?.name;
  useEffect(() => {
    const previous = document.title;
    if (teamName) document.title = `${teamName} · Times · DotaHub Brasil`;
    return () => { document.title = previous; };
  }, [teamName]);

  const back = (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
      className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-amber-400 transition-colors mb-5"
    >
      <ArrowLeft className="w-4 h-4" />
      <span>Voltar</span>
    </button>
  );

  if (state.status === 'loading') {
    return (
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-6 min-h-screen">
        {back}
        <div className="py-24 flex flex-col items-center gap-3 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          <span className="text-xs font-semibold">Carregando time...</span>
        </div>
      </div>
    );
  }

  if (state.status !== 'ok') {
    return (
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-6 min-h-screen">
        {back}
        <div className="rounded-2xl bg-surface border border-line p-10 text-center max-w-xl mx-auto">
          <AlertTriangle className="w-10 h-10 text-gray-500 mx-auto mb-3" />
          <h1 className="text-lg font-black text-white uppercase mb-2">
            {state.status === 'notfound' ? 'Time não encontrado' : 'Não foi possível carregar o time'}
          </h1>
          <p className="text-xs text-gray-400 mb-5">
            {state.status === 'notfound'
              ? 'Não encontramos este time na base da OpenDota.'
              : 'A OpenDota não respondeu agora. Tente novamente em instantes.'}
          </p>
          <Link to="/" className="inline-flex px-4 py-2 rounded-xl bg-amber-500 text-on-accent text-xs font-black uppercase">
            Ir para o início
          </Link>
        </div>
      </div>
    );
  }

  const { team, roster, series } = state.data;
  const totalGames = team.wins + team.losses;
  const seriesWins = series.filter((s) => s.scoreA > s.scoreB).length;

  return (
    <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-6 min-h-screen space-y-6">
      <div>{back}</div>

      {/* CABEÇALHO DO TIME */}
      <section className="rounded-2xl bg-surface border border-line p-5 sm:p-7 shadow-xl -mt-5">
        <div className="flex flex-col md:flex-row md:items-center gap-5">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-20 h-20 rounded-2xl bg-surface-2 border border-line p-2 flex items-center justify-center shrink-0">
              <TeamLogo teamName={team.name} teamId={team.id} logoUrl={team.logo} className="w-16 h-16" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-black text-white truncate">{team.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                {team.tag && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-black uppercase">
                    {team.tag}
                  </span>
                )}
                <span className="text-gray-400">Última partida: <strong className="text-gray-300">{fmtDate(team.lastMatchTime)}</strong></span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBox label="Rating" value={team.rating ?? '—'} />
            <StatBox label="Vitórias" value={team.wins.toLocaleString('pt-BR')} tone="text-emerald-400" />
            <StatBox label="Derrotas" value={team.losses.toLocaleString('pt-BR')} tone="text-rose-400" />
            <StatBox label="Aproveitamento" value={`${pct(team.wins, totalGames)}%`} tone="text-amber-400" />
          </div>
        </div>
      </section>

      {/* ELENCO E ESTATÍSTICAS */}
      <section className="bg-surface border border-line rounded-2xl shadow-xl overflow-hidden">
        <div className="p-5 border-b border-line flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <span>Elenco e Estatísticas</span>
          </h2>
          <span className="text-[11px] text-gray-500">
            Médias das últimas 20 partidas de campeonato de cada jogador
          </span>
        </div>

        {roster.length === 0 ? (
          <p className="p-5 text-xs text-gray-400">A OpenDota não lista o elenco atual deste time.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[980px]">
              <thead className="bg-surface-2 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3 pl-5">Jogador</th>
                  <th className="p-3 text-center whitespace-nowrap">Pelo time</th>
                  <th className="p-3 text-center">Partidas</th>
                  <th className="p-3 text-center">Vitórias</th>
                  <th className="p-3 text-center whitespace-nowrap">K / D / A</th>
                  <th className="p-3 text-center">KDA</th>
                  <th className="p-3 text-center whitespace-nowrap">GPM / XPM</th>
                  <th className="p-3 text-center">LH</th>
                  <th className="p-3 pr-5">Heróis mais jogados</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-gray-300">
                {roster.map((p) => (
                  <PlayerRow key={p.accountId} player={p} info={playerStats[p.accountId]} constants={constants} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ÚLTIMAS 10 SÉRIES */}
      <section className="bg-surface border border-line rounded-2xl shadow-xl overflow-hidden">
        <div className="p-5 border-b border-line flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Últimas {series.length} Séries</span>
          </h2>
          {series.length > 0 && (
            <span className="text-[11px] font-bold text-gray-400">
              <span className="text-emerald-400">{seriesWins} vitórias</span>
              <span className="mx-1.5 text-gray-500">•</span>
              <span className="text-rose-400">{series.length - seriesWins} derrotas</span>
            </span>
          )}
        </div>

        {series.length === 0 ? (
          <p className="p-5 text-xs text-gray-400">Nenhuma série registrada para este time.</p>
        ) : (
          <ul className="divide-y divide-line">
            {series.map((s) => {
              const won = s.scoreA > s.scoreB;
              const draw = s.scoreA === s.scoreB;
              return (
                <li key={s.games[0].match_id}>
                  <button
                    type="button"
                    onClick={() => openSeries(s)}
                    className="w-full text-left px-5 py-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-5 hover:bg-surface-2/70 transition-colors group"
                  >
                    <div className="flex items-center gap-3 md:w-64 shrink-0">
                      <span className={`w-16 text-center py-1 rounded-lg text-[10px] font-black uppercase border ${
                        draw
                          ? 'bg-surface-2 border-line text-gray-400'
                          : won
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      }`}>
                        {draw ? 'Empate' : won ? 'Vitória' : 'Derrota'}
                      </span>
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-gray-300 truncate">{s.stage}</div>
                        <div className="text-[10px] text-gray-500">{s.dateStr}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="font-mono font-black text-base px-3 py-1 rounded-lg bg-surface-2 border border-line shrink-0">
                        <span className={won ? 'text-emerald-400' : 'text-gray-300'}>{s.scoreA}</span>
                        <span className="text-gray-500 mx-1">:</span>
                        <span className={!won && !draw ? 'text-rose-400' : 'text-gray-300'}>{s.scoreB}</span>
                      </span>
                      <span className="text-xs text-gray-500">vs</span>
                      <TeamLogo teamName={s.timeB} teamId={s.preferredIdB} logoUrl={s.logoB} className="w-7 h-7 shrink-0" />
                      <span className="text-sm font-bold text-white truncate">{s.timeB}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {s.games.map((g) => (
                        <span
                          key={g.match_id}
                          title={`Jogo ${g.mapNumber}: ${g.teamWon ? 'vitória' : 'derrota'}`}
                          className={`w-6 h-6 rounded-md text-[10px] font-black flex items-center justify-center border ${
                            g.teamWon
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                          }`}
                        >
                          {g.teamWon ? 'V' : 'D'}
                        </span>
                      ))}
                      <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all ml-1" />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <a
          href={`https://www.opendota.com/teams/${team.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-line hover:border-amber-500/40 text-gray-300 hover:text-white text-xs font-bold transition-all"
        >
          <ExternalLink className="w-4 h-4 text-amber-400" />
          <span>Ver no OpenDota</span>
        </a>
      </div>
    </div>
  );
}

function StatBox({ label, value, tone = 'text-white' }) {
  return (
    <div className="bg-surface-2 border border-line rounded-xl px-4 py-3 text-center min-w-[110px]">
      <div className="text-[10px] uppercase font-bold text-gray-400">{label}</div>
      <div className={`text-lg font-black font-mono ${tone}`}>{value}</div>
    </div>
  );
}

function PlayerRow({ player, info, constants }) {
  const stats = info?.stats;
  const loading = info === undefined;
  const medal = medalLabel(info?.rankTier, info?.leaderboardRank);
  const dash = loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500 mx-auto" /> : '—';

  return (
    <tr className="hover:bg-surface-2/60 transition-colors">
      <td className="p-3 pl-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-2 border border-line overflow-hidden flex items-center justify-center shrink-0">
            {info?.avatar ? (
              <img src={info.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="text-xs font-black text-gray-400">{player.name.slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-white truncate max-w-[160px]">{player.name}</div>
            <div className="text-[10px] text-gray-400 flex items-center gap-1">
              {medal ? (<><Shield className="w-3 h-3 text-amber-400" /> {medal}</>) : ' '}
            </div>
          </div>
        </div>
      </td>
      <td className="p-3 text-center font-mono whitespace-nowrap">
        <span className="text-white font-bold">{player.gamesWithTeam}</span>
        <span className="text-gray-500"> jogos · </span>
        <span className="text-amber-400 font-bold">{pct(player.winsWithTeam, player.gamesWithTeam)}%</span>
      </td>
      <td className="p-3 text-center font-mono">{stats ? stats.matches : dash}</td>
      <td className="p-3 text-center font-mono font-bold">
        {stats ? <span className={stats.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}>{stats.winRate}%</span> : dash}
      </td>
      <td className="p-3 text-center font-mono whitespace-nowrap">
        {stats ? (
          <>
            <span className="text-white font-bold">{stats.avgKills.toFixed(1)}</span>
            <span className="text-gray-500"> / </span>
            <span className="text-rose-400 font-bold">{stats.avgDeaths.toFixed(1)}</span>
            <span className="text-gray-500"> / </span>
            <span className="text-cyan-400 font-bold">{stats.avgAssists.toFixed(1)}</span>
          </>
        ) : dash}
      </td>
      <td className="p-3 text-center font-mono font-black text-amber-400">{stats ? stats.kda.toFixed(2) : dash}</td>
      <td className="p-3 text-center font-mono whitespace-nowrap">
        {stats ? (
          <>
            <span className="text-amber-400 font-bold">{stats.gpm}</span>
            <span className="text-gray-500"> / </span>
            <span className="text-cyan-400 font-bold">{stats.xpm}</span>
          </>
        ) : dash}
      </td>
      <td className="p-3 text-center font-mono">{stats ? stats.lastHits : dash}</td>
      <td className="p-3 pr-5">
        {stats?.topHeroes?.length ? (
          <div className="flex items-center gap-1.5">
            {stats.topHeroes.map((h) => (
              <div
                key={h.hero_id}
                title={`${getHeroName(constants, h.hero_id)}: ${h.games} jogos, ${h.wins} vitórias`}
                className="relative w-12 h-7 rounded overflow-hidden border border-line bg-surface-2"
              >
                <img src={getHeroImg(constants, h.hero_id)} alt="" className="w-full h-full object-cover" />
                <span className="absolute bottom-0 right-0 px-1 text-[9px] font-mono font-black bg-black/70 text-white rounded-tl">
                  {h.games}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-gray-500 text-[11px]">{loading ? '' : 'Sem partidas recentes'}</span>
        )}
      </td>
    </tr>
  );
}
