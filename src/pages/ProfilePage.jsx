import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, Loader2, RefreshCw, LogOut, ExternalLink, ShieldAlert, ChevronRight, Swords, Trophy, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getHeroImg, getHeroName } from '../services/api';
import {
  MODES, steamLoginUrl, hasSteamReturn, completeSteamLogin, getProfileLink, unlinkProfile,
  fetchProfileSummary, fetchModeMatches, refreshProfile, medalOf
} from '../services/profile';

const GAME_MODES = {
  1: 'All Pick', 2: 'Captains Mode', 3: 'Random Draft', 4: 'Single Draft', 5: 'All Random',
  16: 'Captains Draft', 18: 'Ability Draft', 22: 'All Pick', 23: 'Turbo'
};

const fmtDuration = (secs) => `${Math.floor((secs || 0) / 60)}:${String((secs || 0) % 60).padStart(2, '0')}`;
const fmtWhen = (secs) => new Date(secs * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
const winRate = (wl) => (wl && wl.win + wl.lose > 0 ? (wl.win / (wl.win + wl.lose)) * 100 : null);

function SteamButton() {
  return (
    <a
      href={steamLoginUrl()}
      className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl bg-[#171a21] hover:bg-[#2a475e] text-white text-sm font-bold shadow-lg transition-colors"
    >
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
        <path d="M11.98 0C5.67 0 .5 4.86 0 11.04l6.44 2.66a3.4 3.4 0 0 1 1.92-.59h.19l2.87-4.15v-.06a4.53 4.53 0 1 1 4.53 4.53h-.1l-4.08 2.92v.16a3.4 3.4 0 0 1-6.75.6L.4 15.16A12 12 0 1 0 11.98 0Zm-4.45 18.2-1.48-.61a2.55 2.55 0 1 0 1.4-3.5l1.53.63a1.88 1.88 0 1 1-1.45 3.48Zm11.4-9.3a3.02 3.02 0 1 0-6.04 0 3.02 3.02 0 0 0 6.04 0Zm-5.28 0a2.27 2.27 0 1 1 4.53 0 2.27 2.27 0 0 1-4.53 0Z" />
      </svg>
      Entrar com a Steam
    </a>
  );
}

function PrivateDataNotice() {
  return (
    <div className="flex gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-200">
      <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
      <div>
        <strong className="text-amber-300">Nenhuma partida encontrada.</strong> Para suas partidas aparecerem, ative
        <strong> Expor dados públicos de partidas</strong> no Dota 2 (Configurações → Opções → Social). Depois, jogue uma
        partida e clique em <strong>Atualizar</strong> aqui no perfil.
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { constants } = useApp();
  const [link, setLink] = useState(() => getProfileLink());
  const [linking, setLinking] = useState(() => hasSteamReturn(location.search));
  const [linkError, setLinkError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [summaryError, setSummaryError] = useState(false);
  const [mode, setMode] = useState('ranked');
  const [modeData, setModeData] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Volta da Steam: confirma o login no servidor e limpa a URL
  useEffect(() => {
    if (!hasSteamReturn(location.search)) return;
    let active = true;
    setLinking(true);
    completeSteamLogin(location.search)
      .then((l) => { if (active) { setLink(l); setLinkError(null); } })
      .catch((err) => { if (active) setLinkError(err.message); })
      .finally(() => {
        if (!active) return;
        setLinking(false);
        navigate('/perfil', { replace: true });
      });
    return () => { active = false; };
  }, [location.search, navigate]);

  const accountId = link?.accountId;

  useEffect(() => {
    if (!accountId) return;
    let active = true;
    setSummary(null);
    setSummaryError(false);
    fetchProfileSummary(accountId)
      .then((s) => { if (active) setSummary(s); })
      .catch(() => { if (active) setSummaryError(true); });
    return () => { active = false; };
  }, [accountId, reloadKey]);

  useEffect(() => {
    if (!accountId || modeData[mode]) return;
    let active = true;
    fetchModeMatches(accountId, mode)
      .then((d) => { if (active) setModeData((prev) => ({ ...prev, [mode]: d })); })
      .catch(() => { if (active) setModeData((prev) => ({ ...prev, [mode]: { error: true } })); });
    return () => { active = false; };
  }, [accountId, mode, modeData]);

  const handleRefresh = useCallback(async () => {
    if (!accountId) return;
    setRefreshing(true);
    await refreshProfile(accountId);
    setModeData({});
    setReloadKey((k) => k + 1);
    setRefreshing(false);
  }, [accountId]);

  const handleUnlink = () => {
    unlinkProfile();
    setLink(null);
    setSummary(null);
    setModeData({});
  };

  const openMatch = (matchId) => navigate(`/partidas/${matchId}`, { state: { from: { path: '/perfil', label: 'Perfil' } } });

  // ---- Estados sem perfil ----
  if (linking) {
    return (
      <div className="py-32 flex flex-col items-center gap-3 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        <span className="text-xs font-semibold">Confirmando seu login com a Steam...</span>
      </div>
    );
  }

  if (!link) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 min-h-screen">
        <div className="bg-surface border border-line rounded-2xl p-6 sm:p-10 shadow-xl text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 flex items-center justify-center mb-4">
            <User className="w-7 h-7 text-amber-400" />
          </div>
          <h1 className="text-2xl font-black text-white">Seu perfil de Dota 2</h1>
          <p className="text-sm text-gray-400 mt-2 max-w-lg mx-auto">
            Vincule sua conta Steam para ver suas estatísticas de <strong className="text-gray-200">Ranked</strong>,{' '}
            <strong className="text-gray-200">Casual</strong> e <strong className="text-gray-200">Turbo</strong>: medalha,
            vitórias, heróis mais jogados e últimas partidas.
          </p>
          <div className="mt-6"><SteamButton /></div>
          {linkError && <p className="mt-4 text-xs text-rose-400">{linkError}. Tente novamente.</p>}
          <p className="mt-6 text-[11px] text-gray-500 max-w-lg mx-auto">
            O login acontece na página oficial da Steam; o DotaHub não vê sua senha, só recebe o ID público da conta.
            As partidas vêm da OpenDota e só aparecem se a opção “Expor dados públicos de partidas” estiver ativa no Dota 2.
          </p>
        </div>
      </div>
    );
  }

  // ---- Perfil vinculado ----
  const profile = summary?.profile;
  const medal = medalOf(summary?.rankTier, summary?.leaderboardRank);
  const data = modeData[mode];
  const noMatchesAnywhere = summary && ['ranked', 'casual', 'turbo'].every((m) => !summary.totals[m] || summary.totals[m].win + summary.totals[m].lose === 0);

  return (
    <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen space-y-6">
      {/* CABEÇALHO */}
      <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4 min-w-0">
          {profile?.avatarfull
            ? <img src={profile.avatarfull} alt="" className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border border-line shrink-0" />
            : <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-surface-2 border border-line flex items-center justify-center shrink-0"><User className="w-8 h-8 text-gray-500" /></div>}
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-white break-words">
              {profile?.personaname || (summary ? 'Conta sem nome' : 'Carregando...')}
            </h1>
            <div className="text-xs text-gray-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>ID da conta: <span className="font-mono text-gray-300">{accountId}</span></span>
              {profile?.profileurl && (
                <a href={profile.profileurl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-amber-400">
                  Perfil Steam <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <a href={`https://www.opendota.com/players/${accountId}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-amber-400">
                OpenDota <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {medal && (
            <div className="flex items-center gap-2.5">
              <div className="relative w-14 h-14 shrink-0">
                <img src={medal.icon} alt="" className="absolute inset-0 w-full h-full" />
                {medal.star && <img src={medal.star} alt="" className="absolute inset-0 w-full h-full" />}
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Medalha</div>
                <div className="text-sm font-black text-white">{medal.name}</div>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-2 border border-line text-xs font-bold text-gray-300 hover:text-amber-400 disabled:opacity-50"
              title="Pede para a OpenDota buscar suas partidas mais recentes"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Atualizar
            </button>
            <button
              type="button"
              onClick={handleUnlink}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-2 border border-line text-xs font-bold text-gray-400 hover:text-rose-400"
            >
              <LogOut className="w-3.5 h-3.5" /> Desvincular
            </button>
          </div>
        </div>
      </div>

      {summaryError && (
        <div className="bg-surface border border-line rounded-xl p-6 text-center text-xs text-gray-400">
          Não foi possível carregar o perfil na OpenDota agora.{' '}
          <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="font-bold text-amber-400 hover:text-amber-300">Tentar novamente</button>
        </div>
      )}

      {noMatchesAnywhere && <PrivateDataNotice />}

      {/* TOTAIS POR MODO (também servem de abas) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Object.entries(MODES).map(([id, cfg]) => {
          const wl = summary?.totals?.[id];
          const wr = winRate(wl);
          const active = mode === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              className={`text-left rounded-xl border p-4 transition-all ${
                active ? 'bg-amber-500/10 border-amber-500/50 shadow-lg' : 'bg-surface border-line hover:border-amber-500/30'
              }`}
            >
              <div className={`text-[11px] font-black uppercase tracking-wider ${active ? 'text-amber-400' : 'text-gray-400'}`}>{cfg.label}</div>
              {wl ? (
                <div className="mt-1.5 flex items-baseline gap-3">
                  <span className="text-2xl font-black text-white font-mono">{(wl.win + wl.lose).toLocaleString('pt-BR')}</span>
                  <span className="text-xs text-gray-400">partidas</span>
                  {wr !== null && (
                    <span className={`ml-auto text-sm font-black font-mono ${wr >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>{wr.toFixed(1)}%</span>
                  )}
                </div>
              ) : (
                <div className="mt-1.5 text-xs text-gray-500">{summary ? '—' : 'Carregando...'}</div>
              )}
              {wl && <div className="text-[11px] text-gray-500 mt-0.5">{wl.win.toLocaleString('pt-BR')} V · {wl.lose.toLocaleString('pt-BR')} D (total na OpenDota)</div>}
            </button>
          );
        })}
      </div>

      {/* DETALHE DO MODO */}
      {!data ? (
        <div className="py-12 flex flex-col items-center gap-3 text-gray-400">
          <Loader2 className="w-7 h-7 animate-spin text-amber-400" />
          <span className="text-xs">Carregando partidas de {MODES[mode].label}...</span>
        </div>
      ) : data.error ? (
        <div className="bg-surface border border-line rounded-xl p-6 text-center text-xs text-gray-400">
          Não foi possível carregar as partidas agora.{' '}
          <button type="button" onClick={() => setModeData((p) => { const n = { ...p }; delete n[mode]; return n; })} className="font-bold text-amber-400">Tentar novamente</button>
        </div>
      ) : data.matches.length === 0 ? (
        <div className="bg-surface border border-line rounded-xl p-8 text-center text-xs text-gray-400">
          Nenhuma partida de {MODES[mode].label} encontrada.
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* MÉDIAS + HERÓIS */}
          <div className="space-y-6">
            <section className="bg-surface border border-line rounded-2xl p-5 shadow-lg">
              <h2 className="text-xs font-black uppercase tracking-wider text-white mb-3 flex items-center gap-2">
                <Swords className="w-4 h-4 text-amber-400" /> Últimas {data.matches.length} partidas
              </h2>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  ['Vitórias', `${data.averages.winRate.toFixed(0)}%`, data.averages.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'],
                  ['K / D / A', `${data.averages.kills.toFixed(1)} / ${data.averages.deaths.toFixed(1)} / ${data.averages.assists.toFixed(1)}`, 'text-white'],
                  ['Duração', fmtDuration(data.averages.duration), 'text-white'],
                  ['GPM', data.averages.gpm, 'text-amber-400'],
                  ['XPM', data.averages.xpm, 'text-cyan-400'],
                  ['Last hits', data.averages.lastHits, 'text-white']
                ].map(([label, value, color]) => (
                  <div key={label} className="bg-surface-2 rounded-xl p-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</div>
                    <div className={`mt-0.5 text-sm font-black font-mono ${color}`}>{value}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-surface border border-line rounded-2xl p-5 shadow-lg">
              <h2 className="text-xs font-black uppercase tracking-wider text-white mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" /> Heróis mais jogados
              </h2>
              <ul className="space-y-2">
                {data.heroes.slice(0, 10).map((h) => {
                  const wr = (h.wins / h.games) * 100;
                  return (
                    <li key={h.heroId} className="flex items-center gap-3">
                      <img src={getHeroImg(constants, h.heroId)} alt="" className="w-12 h-7 rounded object-cover border border-line shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate">{getHeroName(constants, h.heroId)}</div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          KDA {((h.kills + h.assists) / Math.max(h.deaths, 1)).toFixed(2)}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-black font-mono text-white">{h.games}</div>
                        <div className={`text-[10px] font-bold font-mono ${wr >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>{wr.toFixed(0)}%</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>

          {/* ÚLTIMAS PARTIDAS */}
          <section className="xl:col-span-2 bg-surface border border-line rounded-2xl p-5 shadow-lg">
            <h2 className="text-xs font-black uppercase tracking-wider text-white mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" /> Partidas recentes
            </h2>
            <div className="space-y-1.5">
              {data.matches.slice(0, 20).map((m) => (
                <button
                  key={m.match_id}
                  type="button"
                  onClick={() => openMatch(m.match_id)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-surface-2/60 hover:bg-surface-2 border border-transparent hover:border-amber-500/30 text-left transition-all group"
                >
                  <span className={`w-1 self-stretch rounded-full shrink-0 ${m.won ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <img src={getHeroImg(constants, m.hero_id)} alt="" className="w-12 h-7 rounded object-cover border border-line shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate">{getHeroName(constants, m.hero_id)}</div>
                    <div className="text-[10px] text-gray-500">{GAME_MODES[m.game_mode] || 'Partida'} · {fmtWhen(m.start_time)}<span className="sm:hidden"> · {m.kills}/{m.deaths}/{m.assists}</span></div>
                  </div>
                  <span className={`text-[10px] font-black uppercase w-14 text-center shrink-0 ${m.won ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {m.won ? 'Vitória' : 'Derrota'}
                  </span>
                  <span className="hidden sm:inline text-xs font-mono text-gray-300 w-24 text-center shrink-0">
                    {m.kills}/{m.deaths}/{m.assists}
                  </span>
                  <span className="hidden sm:inline text-xs font-mono text-gray-500 w-12 text-right shrink-0">{fmtDuration(m.duration)}</span>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-amber-400 shrink-0" />
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
