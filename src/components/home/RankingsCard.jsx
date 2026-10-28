import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, User, ChevronRight, Loader2 } from 'lucide-react';
import TeamLogo from '../../utils/teamLogos';
import { fetchTeamsRanking } from '../../services/teamsRanking';
import { fetchOfficialLeaderboard } from '../../services/api';
import { medalStyle } from '../../utils/medals';

const ROTATE_MS = 30000;
const VIEWS = [
  { id: 'teams', label: 'Times', icon: Shield },
  { id: 'players', label: 'Jogadores', icon: User }
];
// Regiões do ranking oficial da Valve (jogadores Imortais)
const DIVISIONS = [
  { id: 'europe', label: 'Europa' },
  { id: 'americas', label: 'Américas' },
  { id: 'se_asia', label: 'SE Ásia' },
  { id: 'china', label: 'China' }
];
const LIMIT = 10;

function RankBadge({ rank }) {
  const style = medalStyle(rank);
  return (
    <span
      className={`w-6 h-6 shrink-0 rounded-lg flex items-center justify-center text-[11px] font-black font-mono ${style ? 'border' : 'bg-surface-2 text-gray-400'}`}
      style={style || undefined}
    >
      {rank}
    </span>
  );
}

/**
 * Ranking mundial de times (Liquipedia) e ranking oficial de jogadores da Valve
 * no mesmo card, alternando a cada 30 s. Clicar numa aba troca na hora e
 * reinicia a contagem; passar o mouse ou focar no card pausa a troca.
 */
export default function RankingsCard() {
  const [view, setView] = useState('teams');
  const [paused, setPaused] = useState(false);
  const [cycle, setCycle] = useState(0); // reinicia a barra de progresso
  const [teams, setTeams] = useState(null);
  const [division, setDivision] = useState('europe');
  const [players, setPlayers] = useState({});

  useEffect(() => {
    let active = true;
    fetchTeamsRanking().then((list) => { if (active) setTeams(Array.isArray(list) ? list : []); }).catch(() => active && setTeams([]));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (players[division]) return undefined;
    let active = true;
    fetchOfficialLeaderboard(division)
      .then((list) => { if (active) setPlayers((p) => ({ ...p, [division]: Array.isArray(list) ? list : [] })); })
      .catch(() => active && setPlayers((p) => ({ ...p, [division]: [] })));
    return () => { active = false; };
  }, [division, players]);

  useEffect(() => {
    if (paused) return undefined;
    const timer = setTimeout(() => {
      setView((v) => (v === 'teams' ? 'players' : 'teams'));
      setCycle((c) => c + 1);
    }, ROTATE_MS);
    return () => clearTimeout(timer);
  }, [view, paused, cycle]);

  const choose = (id) => {
    setView(id);
    setCycle((c) => c + 1);
  };

  const playerList = players[division];

  return (
    <section
      className="overflow-hidden"
      aria-label="Rankings de times e jogadores"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="p-4 pb-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-white">Rankings</h2>
          <span className="text-[10px] text-gray-400">{paused ? 'Pausado' : 'Troca a cada 30 s'}</span>
        </div>
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-surface-2/80" role="tablist">
          {VIEWS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={view === id}
              onClick={() => choose(id)}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                view === id ? 'bg-blue-600 text-on-accent shadow-sm' : 'text-gray-400 hover:text-white hover:bg-surface-3'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Barra de progresso até a próxima troca */}
      <div className="h-0.5 mx-4 rounded-full bg-surface-2 overflow-hidden">
        <div
          key={`${view}-${cycle}`}
          className="h-full bg-blue-600 dark:bg-amber-500 rankings-progress"
          style={{ animationDuration: `${ROTATE_MS}ms`, animationPlayState: paused ? 'paused' : 'running' }}
        />
      </div>

      <div className="p-3 animate-fade-in" key={view}>
        {view === 'teams' ? (
          !teams ? (
            <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
          ) : !teams.length ? (
            <p className="text-xs text-gray-400 text-center py-8">Ranking de times indisponível no momento.</p>
          ) : (
            <>
              <ol className="space-y-1">
                {teams.slice(0, LIMIT).map((t) => (
                  <li key={t.name}>
                    <Link
                      to={t.teamId ? `/times/${t.teamId}` : `/times/${encodeURIComponent(t.name)}`}
                      className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-surface-2 transition-colors"
                    >
                      <RankBadge rank={t.rank} />
                      <TeamLogo teamName={t.name} teamId={t.teamId} logoUrl={t.logo} className="w-6 h-6 shrink-0" />
                      <span className="text-xs font-bold text-white truncate flex-1">{t.name}</span>
                      {t.points != null && <span className="text-[10px] font-mono font-bold text-gray-400">{t.points} pts</span>}
                    </Link>
                  </li>
                ))}
              </ol>
              <Link to="/times" className="mt-2 flex items-center justify-center gap-1 text-[11px] font-bold text-blue-600 dark:text-amber-500 hover:underline py-1.5">
                Ranking completo <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <p className="text-[10px] text-gray-500 text-center">Fonte: Liquipedia</p>
            </>
          )
        ) : (
          <>
            <div className="flex flex-wrap gap-1 mb-2">
              {DIVISIONS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => { setDivision(d.id); setCycle((c) => c + 1); }}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors ${
                    division === d.id ? 'bg-surface-3 text-white border-line' : 'text-gray-400 border-transparent hover:text-white'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            {!playerList ? (
              <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
            ) : !playerList.length ? (
              <p className="text-xs text-gray-400 text-center py-8">Ranking de jogadores indisponível no momento.</p>
            ) : (
              <>
                <ol className="space-y-1">
                  {playerList.slice(0, LIMIT).map((p) => (
                    <li key={`${p.rank}-${p.name}`} className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl">
                      <RankBadge rank={p.rank} />
                      <span className="text-xs font-bold text-white truncate flex-1">
                        {p.team_tag && <span className="text-gray-400 font-semibold">{p.team_tag}.</span>}
                        {p.name}
                      </span>
                      {p.country && <span className="text-[10px] font-mono font-bold uppercase text-gray-400">{p.country}</span>}
                    </li>
                  ))}
                </ol>
                <p className="mt-2 text-[10px] text-gray-500 text-center">Fonte: ranking oficial da Valve (Imortais)</p>
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}
