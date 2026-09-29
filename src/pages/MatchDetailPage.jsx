import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  Clock,
  Coins,
  Crosshair,
  ExternalLink,
  HeartPulse,
  Loader2,
  Sparkles,
  Swords,
  Trophy,
  Zap
} from 'lucide-react';
import { fetchMatchDetails, getHeroImg, getHeroName, getItemImg } from '../services/api';
import TeamLogo from '../utils/teamLogos';
import AdvantageGraph from '../components/AdvantageGraph';
import { useApp } from '../context/AppContext';
import { seriesKey } from '../utils/matchRoute';

const fmtNumber = (n) => (n || n === 0 ? Number(n).toLocaleString('pt-BR') : '—');
const fmtDuration = (secs) => {
  if (!secs && secs !== 0) return '—';
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
};
const radiantNameOf = (m) => m?.radiant_team?.name || m?.radiant_name || 'Radiant';
const direNameOf = (m) => m?.dire_team?.name || m?.dire_name || 'Dire';

/** Série montada a partir de um único replay (link direto de uma série fora da lista). */
function seriesFromMatch(match) {
  const radiant = radiantNameOf(match);
  const dire = direNameOf(match);
  return {
    series_id: match.series_id || null,
    stage: match.league?.name || 'Torneio Profissional',
    leagueId: match.leagueid,
    timeA: radiant,
    timeB: dire,
    preferredIdA: match.radiant_team_id || match.radiant_team?.team_id,
    preferredIdB: match.dire_team_id || match.dire_team?.team_id,
    scoreA: match.radiant_win ? 1 : 0,
    scoreB: match.radiant_win ? 0 : 1,
    winner: match.radiant_win ? radiant : dire,
    startTime: match.start_time,
    games: [{
      mapNumber: 1,
      match_id: String(match.match_id),
      start_time: match.start_time,
      radiant_score: match.radiant_score,
      dire_score: match.dire_score,
      radiant_win: match.radiant_win,
      duration: match.duration
    }]
  };
}

function findSeries(id, lists) {
  for (const list of lists) {
    const found = (list || []).find((s) => (s?.games || []).some((g) => String(g.match_id) === String(id)));
    if (found) return found;
  }
  return null;
}

export default function MatchDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { finishedSeries, tournamentsList, constants, setSelectedTeam, setSelectedHero } = useApp();

  // Série: a que veio no clique, a da lista em memória ou, no link direto,
  // montada a partir do próprio replay.
  const knownSeries = useMemo(() => {
    const fromState = location.state?.series;
    if (fromState && seriesKey(fromState) === String(id)) return fromState;
    const tournamentSeries = (tournamentsList || []).map((t) => t.seriesList || []);
    return findSeries(id, [finishedSeries, ...tournamentSeries]);
  }, [id, location.state, finishedSeries, tournamentsList]);

  const [fallbackSeries, setFallbackSeries] = useState(null);
  const [seriesError, setSeriesError] = useState(false);
  const series = knownSeries || fallbackSeries;
  const games = series?.games || [];

  // Sem ?jogo=, abre o mapa do próprio match_id da URL (links de mapas avulsos)
  const requestedMap = Number(searchParams.get('jogo'))
    || games.findIndex((g) => String(g.match_id) === String(id)) + 1
    || 1;
  const activeIndex = Math.min(Math.max(requestedMap - 1, 0), Math.max(games.length - 1, 0));
  const currentMap = games[activeIndex];

  // Replays já carregados, por match_id (null = OpenDota não entregou)
  const [matchData, setMatchData] = useState({});

  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  // Link direto sem a série em memória: busca o replay e monta a série de 1 mapa
  useEffect(() => {
    if (knownSeries) return;
    let cancelled = false;
    setSeriesError(false);
    fetchMatchDetails(id).then((data) => {
      if (cancelled) return;
      if (data) {
        setFallbackSeries(seriesFromMatch(data));
        setMatchData((prev) => ({ ...prev, [String(data.match_id)]: data }));
      } else {
        setSeriesError(true);
      }
    });
    return () => { cancelled = true; };
  }, [id, knownSeries]);

  const activeMatchId = currentMap?.match_id ? String(currentMap.match_id) : null;
  const activeLoaded = activeMatchId ? matchData[activeMatchId] !== undefined : true;
  useEffect(() => {
    if (!activeMatchId || activeLoaded) return;
    let cancelled = false;
    fetchMatchDetails(activeMatchId).then((data) => {
      if (!cancelled) setMatchData((prev) => ({ ...prev, [activeMatchId]: data || null }));
    });
    return () => { cancelled = true; };
  }, [activeMatchId, activeLoaded]);

  const teamA = series?.timeA;
  const teamB = series?.timeB;
  useEffect(() => {
    const previous = document.title;
    if (teamA && teamB) document.title = `${teamA} vs ${teamB} · Resultado · DotaHub Brasil`;
    return () => { document.title = previous; };
  }, [teamA, teamB]);

  const selectMap = (idx) => {
    const next = new URLSearchParams(searchParams);
    next.set('jogo', String(idx + 1));
    setSearchParams(next, { replace: true, state: location.state });
  };

  const openTeam = (teamId, name) => setSelectedTeam({ id: teamId || null, name });
  const match = activeMatchId ? matchData[activeMatchId] : undefined;

  return (
    <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-6 min-h-screen">
      <Link
        to="/partidas"
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-amber-400 transition-colors mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar para Partidas</span>
      </Link>

      {!series ? (
        seriesError ? (
          <div className="rounded-2xl bg-surface border border-line p-10 text-center max-w-xl mx-auto">
            <AlertTriangle className="w-10 h-10 text-gray-500 mx-auto mb-3" />
            <h1 className="text-lg font-black text-white uppercase mb-2">Partida não encontrada</h1>
            <p className="text-xs text-gray-400 mb-5">
              Não foi possível carregar a partida #{id}. A OpenDota pode estar instável ou o replay ainda não foi processado.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to="/partidas" className="inline-flex px-4 py-2 rounded-xl bg-amber-500 text-on-accent text-xs font-black uppercase">
                Ver resultados
              </Link>
              <a
                href={`https://www.opendota.com/matches/${id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-2 border border-line text-gray-300 text-xs font-bold"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Abrir no OpenDota
              </a>
            </div>
          </div>
        ) : (
          <div className="py-24 flex flex-col items-center gap-3 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            <span className="text-xs font-semibold">Carregando partida #{id}...</span>
          </div>
        )
      ) : (
        <div className="space-y-6">
          <SeriesHeader series={series} currentMap={currentMap} onOpenTeam={openTeam} />

          {games.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {games.map((g, idx) => {
                const active = idx === activeIndex;
                const loaded = matchData[g.match_id];
                const winnerName = loaded
                  ? (loaded.radiant_win ? radiantNameOf(loaded) : direNameOf(loaded))
                  : null;
                return (
                  <button
                    key={g.match_id || idx}
                    type="button"
                    onClick={() => selectMap(idx)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider whitespace-nowrap transition-all border ${
                      active
                        ? 'bg-amber-500 text-on-accent border-amber-500 shadow-lg shadow-amber-500/20'
                        : 'bg-surface border-line text-gray-400 hover:text-white hover:border-line-strong'
                    }`}
                  >
                    <Swords className="w-3.5 h-3.5" />
                    <span>Jogo {g.mapNumber || idx + 1}</span>
                    {g.duration ? (
                      <span className={`font-mono normal-case ${active ? 'opacity-80' : 'text-gray-500'}`}>
                        {fmtDuration(g.duration)}
                      </span>
                    ) : null}
                    {winnerName && (
                      <span className={`hidden sm:inline normal-case font-bold ${active ? 'opacity-80' : 'text-gray-500'}`}>
                        · {winnerName}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {match === undefined ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              <span className="text-xs font-semibold">Carregando replay, draft e estatísticas...</span>
            </div>
          ) : match ? (
            <MapDetail
              match={match}
              mapNumber={currentMap?.mapNumber || activeIndex + 1}
              constants={constants}
              onSelectHero={setSelectedHero}
            />
          ) : (
            <MapUnavailable matchId={activeMatchId} map={currentMap} />
          )}
        </div>
      )}
    </div>
  );
}

function SeriesHeader({ series, currentMap, onOpenTeam }) {
  const aWon = series.scoreA > series.scoreB;
  const bWon = series.scoreB > series.scoreA;
  const when = series.startTime || currentMap?.start_time;
  const dateLabel = when
    ? new Date(when * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' })
    : series.dateStr;

  const team = (name, teamId, won, align) => (
    <button
      type="button"
      onClick={() => onOpenTeam(teamId, name)}
      className={`flex-1 min-w-0 flex items-center gap-3 sm:gap-4 group ${align === 'right' ? 'flex-row-reverse text-right' : 'text-left'}`}
      title={`Ver perfil de ${name}`}
    >
      <TeamLogo teamName={name} teamId={teamId} className="w-12 h-12 sm:w-16 sm:h-16 shrink-0" />
      <div className="min-w-0">
        {won && (
          <span className="inline-block mb-1 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-black uppercase border border-emerald-500/30">
            Vencedor
          </span>
        )}
        <h1 className={`text-lg sm:text-2xl font-black truncate group-hover:text-amber-400 transition-colors ${won ? 'text-white' : 'text-gray-400'}`}>
          {name}
        </h1>
      </div>
    </button>
  );

  return (
    <section className="rounded-2xl bg-surface border border-line p-5 sm:p-7 shadow-xl">
      <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
          {series.stage || 'Torneio Profissional'}
        </span>
        {series.formato && (
          <span className="text-[11px] font-mono font-black text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-full">
            {series.formato}
          </span>
        )}
        {dateLabel && (
          <span className="text-[11px] font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-full">
            {dateLabel}
          </span>
        )}
        <span className="text-[11px] font-black uppercase text-gray-400 bg-surface-2 border border-line px-2.5 py-1 rounded-full">
          Finalizado
        </span>
      </div>

      <div className="flex items-center gap-3 sm:gap-8">
        {team(series.timeA, series.preferredIdA, aWon, 'left')}
        <div className="shrink-0 px-4 sm:px-6 py-2 rounded-2xl bg-surface-2 border border-line font-mono text-2xl sm:text-4xl font-black">
          <span className={aWon ? 'text-amber-400' : 'text-gray-400'}>{series.scoreA}</span>
          <span className="text-gray-500 mx-2">:</span>
          <span className={bWon ? 'text-amber-400' : 'text-gray-400'}>{series.scoreB}</span>
        </div>
        {team(series.timeB, series.preferredIdB, bWon, 'right')}
      </div>
    </section>
  );
}

function MapDetail({ match, mapNumber, constants, onSelectHero }) {
  const radiant = radiantNameOf(match);
  const dire = direNameOf(match);
  const players = match.players || [];
  const radiantPlayers = players.filter((p) => p.player_slot < 128);
  const direPlayers = players.filter((p) => p.player_slot >= 128);
  const winner = match.radiant_win ? radiant : dire;
  const hasGraph = (match.radiant_gold_adv || []).length > 0;

  return (
    <div className="space-y-6">
      {/* RESUMO DO MAPA */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface border border-line p-4 rounded-2xl text-xs">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="text-gray-400">Vencedor do Jogo {mapNumber}:</span>
          <strong className={match.radiant_win ? 'text-emerald-400' : 'text-rose-400'}>{winner}</strong>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-gray-400 font-mono text-[11px]">
          <span className="flex items-center gap-1.5">
            <Swords className="w-3.5 h-3.5 text-amber-400" />
            Abates: <strong className="text-emerald-400">{match.radiant_score ?? '—'}</strong>
            <span className="text-gray-500">:</span>
            <strong className="text-rose-400">{match.dire_score ?? '—'}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            Duração: <strong className="text-white">{fmtDuration(match.duration)}</strong>
          </span>
          <span>Match ID: <strong className="text-gray-300">{match.match_id}</strong></span>
        </div>
      </div>

      <DraftPanel picksBans={match.picks_bans || []} radiant={radiant} dire={dire} constants={constants} />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className={hasGraph ? 'xl:col-span-8' : 'xl:col-span-12'}>
          {hasGraph ? (
            <div className="bg-surface border border-line rounded-2xl p-5 shadow-xl h-full">
              <h3 className="text-xs font-black uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Vantagem de Ouro e Experiência</span>
              </h3>
              <AdvantageGraph
                goldAdv={match.radiant_gold_adv}
                xpAdv={match.radiant_xp_adv || []}
                radiantName={radiant}
                direName={dire}
              />
            </div>
          ) : (
            <div className="bg-surface border border-line rounded-2xl p-5 text-xs text-gray-400">
              O gráfico de vantagem aparece quando a OpenDota termina de analisar o replay desta partida.
            </div>
          )}
        </div>
        {hasGraph && (
          <aside className="xl:col-span-4">
            <Highlights players={players} constants={constants} />
          </aside>
        )}
      </div>

      {!hasGraph && <Highlights players={players} constants={constants} />}

      <PlayerTable
        players={radiantPlayers}
        teamName={radiant}
        isRadiant
        kills={match.radiant_score}
        won={match.radiant_win}
        constants={constants}
        onSelectHero={onSelectHero}
      />
      <PlayerTable
        players={direPlayers}
        teamName={dire}
        isRadiant={false}
        kills={match.dire_score}
        won={!match.radiant_win}
        constants={constants}
        onSelectHero={onSelectHero}
      />

      <ExternalLinks matchId={match.match_id} />
    </div>
  );
}

function DraftPanel({ picksBans, radiant, dire, constants }) {
  if (!picksBans.length) return null;
  const ordered = [...picksBans].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const row = (team, name, color) => {
    const entries = ordered.filter((pb) => pb.team === team);
    const picks = entries.filter((pb) => pb.is_pick);
    const bans = entries.filter((pb) => !pb.is_pick);
    return (
      <div className="space-y-2">
        <div className={`text-[11px] font-black uppercase tracking-wider ${color}`}>{name}</div>
        <div className="flex flex-wrap items-center gap-2">
          {picks.map((pb) => (
            <HeroChip key={`p${pb.order}`} pb={pb} constants={constants} />
          ))}
        </div>
        {bans.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {bans.map((pb) => (
              <HeroChip key={`b${pb.order}`} pb={pb} constants={constants} small />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="bg-surface border border-line rounded-2xl p-5 shadow-xl">
      <h3 className="text-xs font-black uppercase tracking-wider text-white mb-4 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-400" />
        <span>Draft</span>
        <span className="text-[10px] font-normal normal-case text-gray-500">número = ordem da escolha</span>
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {row(0, radiant, 'text-emerald-400')}
        {row(1, dire, 'text-rose-400')}
      </div>
    </section>
  );
}

function HeroChip({ pb, constants, small = false }) {
  const name = getHeroName(constants, pb.hero_id);
  const img = getHeroImg(constants, pb.hero_id);
  return (
    <div
      title={`${pb.is_pick ? 'Pick' : 'Ban'} #${(pb.order ?? 0) + 1}: ${name}`}
      className={`relative rounded-lg overflow-hidden border ${
        pb.is_pick ? 'border-line-strong' : 'border-line opacity-80 grayscale-[60%]'
      } ${small ? 'w-12 h-7' : 'w-20 h-11 sm:w-24 sm:h-[54px]'} bg-surface-2`}
    >
      {img && <img src={img} alt={name} className="w-full h-full object-cover" />}
      {!pb.is_pick && (
        <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
          <Ban className="w-3.5 h-3.5 text-red-400" />
        </div>
      )}
      <span className="absolute top-0 left-0 px-1 text-[9px] font-mono font-black bg-black/70 text-white rounded-br">
        {(pb.order ?? 0) + 1}
      </span>
    </div>
  );
}

function Highlights({ players, constants }) {
  const top = (field) => players.reduce((best, p) => ((p[field] || 0) > (best?.[field] || 0) ? p : best), null);
  const items = [
    { label: 'Mais abates', icon: Crosshair, field: 'kills', color: 'text-rose-400' },
    { label: 'Maior patrimônio', icon: Coins, field: 'net_worth', color: 'text-amber-400' },
    { label: 'Mais dano a heróis', icon: Swords, field: 'hero_damage', color: 'text-purple-400' },
    { label: 'Mais cura', icon: HeartPulse, field: 'hero_healing', color: 'text-emerald-400' }
  ]
    .map((it) => ({ ...it, player: top(it.field) }))
    .filter((it) => it.player && it.player[it.field] > 0);

  if (!items.length) return null;

  return (
    <div className="bg-surface border border-line rounded-2xl p-5 shadow-xl h-full">
      <h3 className="text-xs font-black uppercase tracking-wider text-white mb-4 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-amber-400" />
        <span>Destaques do Jogo</span>
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
        {items.map(({ label, icon: Icon, field, color, player }) => (
          <div key={field} className="flex items-center gap-3 bg-surface-2 border border-line rounded-xl p-3">
            <img
              src={getHeroImg(constants, player.hero_id)}
              alt=""
              className="w-12 h-7 object-cover rounded border border-line shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
                <Icon className={`w-3 h-3 ${color}`} /> {label}
              </div>
              <div className="text-xs font-bold text-white truncate">
                {player.name || player.personaname || getHeroName(constants, player.hero_id)}
              </div>
            </div>
            <span className={`font-mono font-black text-sm ${color}`}>{fmtNumber(player[field])}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ItemSlot({ id, constants, className }) {
  const img = id ? getItemImg(constants, id) : null;
  const name = id ? constants?.itemsById?.[id]?.dname : null;
  return (
    <div title={name || undefined} className={`rounded bg-surface-2 border border-line flex items-center justify-center overflow-hidden ${className}`}>
      {img ? <img src={img} alt={name || ''} className="w-full h-full object-cover" /> : null}
    </div>
  );
}

function PlayerTable({ players, teamName, isRadiant, kills, won, constants, onSelectHero }) {
  const accent = isRadiant ? 'text-emerald-400' : 'text-rose-400';
  return (
    <section className="bg-surface border border-line rounded-2xl overflow-hidden shadow-xl">
      <div className="p-4 border-b border-line flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <TeamLogo teamName={teamName} className="w-6 h-6 shrink-0" />
          <h3 className={`text-sm font-black uppercase tracking-wider truncate ${accent}`}>{teamName}</h3>
          <span className="text-[10px] font-bold uppercase text-gray-500">{isRadiant ? 'Radiant' : 'Dire'}</span>
          {won && (
            <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-black uppercase">
              Vitória
            </span>
          )}
        </div>
        <span className="text-xs font-mono text-gray-400 shrink-0">Abates: <strong className="text-white">{kills ?? '—'}</strong></span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[1080px]">
          <thead className="bg-surface-2 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-3 pl-4">Jogador / Herói</th>
              <th className="p-3 text-center">Nível</th>
              <th className="p-3 text-center whitespace-nowrap">K / D / A</th>
              <th className="p-3 text-right">Patrimônio</th>
              <th className="p-3 text-right whitespace-nowrap">LH / DN</th>
              <th className="p-3 text-right whitespace-nowrap">GPM / XPM</th>
              <th className="p-3 text-right whitespace-nowrap">Dano heróis</th>
              <th className="p-3 text-right whitespace-nowrap">Dano torres</th>
              <th className="p-3 text-right">Cura</th>
              <th className="p-3 pr-4">Itens</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line text-gray-300">
            {players.map((p, idx) => {
              const heroName = getHeroName(constants, p.hero_id);
              const hero = constants?.heroes?.[p.hero_id];
              return (
                <tr key={p.player_slot ?? idx} className="hover:bg-surface-2/60 transition-colors">
                  <td className="p-3 pl-4">
                    <button
                      type="button"
                      onClick={() => hero && onSelectHero?.(hero)}
                      className="flex items-center gap-3 text-left group"
                      title={hero ? 'Ver herói' : undefined}
                    >
                      <img
                        src={getHeroImg(constants, p.hero_id)}
                        alt={heroName}
                        className="w-12 h-7 object-cover rounded border border-line shrink-0"
                        onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate max-w-[170px]">
                          {p.name || p.personaname || `Jogador ${idx + 1}`}
                        </div>
                        <div className="text-[10px] text-gray-400 truncate group-hover:text-amber-400 transition-colors">{heroName}</div>
                      </div>
                    </button>
                  </td>
                  <td className="p-3 text-center font-mono font-bold">{p.level ?? '—'}</td>
                  <td className="p-3 text-center font-mono whitespace-nowrap">
                    <span className="inline-grid grid-cols-[2ch_auto_2ch_auto_2ch] items-center gap-1">
                      <span className="text-right font-bold text-white">{p.kills ?? 0}</span>
                      <span className="text-gray-500">/</span>
                      <span className="text-center font-bold text-rose-400">{p.deaths ?? 0}</span>
                      <span className="text-gray-500">/</span>
                      <span className="text-left font-bold text-cyan-400">{p.assists ?? 0}</span>
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-amber-400">{fmtNumber(p.net_worth)}</td>
                  <td className="p-3 text-right font-mono whitespace-nowrap">
                    <span className="text-white font-semibold">{p.last_hits ?? 0}</span>
                    <span className="text-gray-500 mx-1">/</span>
                    <span className="text-gray-400">{p.denies ?? 0}</span>
                  </td>
                  <td className="p-3 text-right font-mono whitespace-nowrap">
                    <span className="text-amber-400 font-bold">{p.gold_per_min ?? '—'}</span>
                    <span className="text-gray-500 mx-1">/</span>
                    <span className="text-cyan-400 font-bold">{p.xp_per_min ?? '—'}</span>
                  </td>
                  <td className="p-3 text-right font-mono">{fmtNumber(p.hero_damage)}</td>
                  <td className="p-3 text-right font-mono">{fmtNumber(p.tower_damage)}</td>
                  <td className="p-3 text-right font-mono">{fmtNumber(p.hero_healing)}</td>
                  <td className="p-3 pr-4">
                    <div className="flex items-center gap-1.5">
                      <div className="grid grid-cols-6 gap-1">
                        {[p.item_0, p.item_1, p.item_2, p.item_3, p.item_4, p.item_5].map((it, i) => (
                          <ItemSlot key={i} id={it} constants={constants} className="w-8 h-6" />
                        ))}
                      </div>
                      <ItemSlot id={p.item_neutral} constants={constants} className="w-6 h-6 rounded-full border-amber-500/40" />
                      <div className="hidden lg:flex gap-0.5 opacity-70" title="Mochila">
                        {[p.backpack_0, p.backpack_1, p.backpack_2].map((it, i) => (
                          <ItemSlot key={i} id={it} constants={constants} className="w-5 h-4" />
                        ))}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ExternalLinks({ matchId }) {
  if (!matchId) return null;
  const links = [
    { href: `https://www.opendota.com/matches/${matchId}`, label: 'OpenDota' },
    { href: `https://www.dotabuff.com/matches/${matchId}`, label: 'Dotabuff' },
    { href: `https://stratz.com/matches/${matchId}`, label: 'Stratz' }
  ];
  return (
    <div className="flex flex-wrap items-center gap-3">
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-line hover:border-amber-500/40 text-gray-300 hover:text-white text-xs font-bold transition-all"
        >
          <ExternalLink className="w-4 h-4 text-amber-400" />
          <span>Ver no {l.label}</span>
        </a>
      ))}
    </div>
  );
}

function MapUnavailable({ matchId, map }) {
  return (
    <div className="space-y-4">
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wide">Estatísticas indisponíveis no momento</h4>
          <p className="text-xs text-gray-300 leading-relaxed">
            A OpenDota não respondeu ou ainda não processou o replay deste jogo. Draft, itens e gráficos aparecem assim
            que os dados estiverem disponíveis.
          </p>
        </div>
      </div>
      {map && (
        <div className="bg-surface border border-line rounded-2xl p-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-400 font-mono">
          {map.radiant_score != null && (
            <span>Abates: <strong className="text-white">{map.radiant_score} : {map.dire_score}</strong></span>
          )}
          {map.duration ? <span>Duração: <strong className="text-white">{fmtDuration(map.duration)}</strong></span> : null}
          <span>Match ID: <strong className="text-amber-400">{matchId}</strong></span>
        </div>
      )}
      <ExternalLinks matchId={matchId} />
    </div>
  );
}
