import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Medal, Sigma, Users, MessageSquare, BarChart3, User, Loader2, RefreshCw, LogOut, ExternalLink, ShieldAlert, ChevronRight, Swords, Trophy, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getHeroImg, getHeroName } from '../services/api';
import {
  MODES, steamLoginUrl, hasSteamReturn, completeSteamLogin, fetchProfileLink, unlinkProfile,
  fetchProfileSummary, fetchModeMatches, fetchModeRecords, RECORD_FIELDS, fetchModeTotals, fetchModePeers,
  fetchModeWordcloud, fetchRankings, refreshProfile, medalOf
} from '../services/profile';

const GAME_MODES = {
  1: 'All Pick', 2: 'Captains Mode', 3: 'Random Draft', 4: 'Single Draft', 5: 'All Random',
  16: 'Captains Draft', 18: 'Ability Draft', 22: 'All Pick', 23: 'Turbo'
};

// Abas do perfil (mesmas da OpenDota); as que dependem do modo usam Normal/Turbo
const VIEWS = [
  { id: 'resumo', label: 'Resumo', icon: Swords },
  { id: 'recordes', label: 'Recordes', icon: Medal, load: fetchModeRecords },
  { id: 'totais', label: 'Totais', icon: Sigma, load: fetchModeTotals },
  { id: 'parceiros', label: 'Parceiros', icon: Users, load: fetchModePeers },
  { id: 'nuvem', label: 'Nuvem de palavras', icon: MessageSquare, load: fetchModeWordcloud },
  { id: 'classificacoes', label: 'Classificações', icon: BarChart3, load: (accountId) => fetchRankings(accountId), noMode: true }
];
const viewKey = (view, mode) => (VIEWS.find((v) => v.id === view)?.noMode ? view : `${view}:${mode}`);
const fmtBig = (n) => Math.round(n).toLocaleString('pt-BR');
const fmtAvg = (n) => n.toLocaleString('pt-BR', { maximumFractionDigits: n < 10 ? 2 : 1 });
const fmtHours = (secs) => `${Math.round(secs / 3600).toLocaleString('pt-BR')} h`;

const fmtDuration =(secs) => `${Math.floor((secs || 0) / 60)}:${String((secs || 0) % 60).padStart(2, '0')}`;
const fmtWhen = (secs) => new Date(secs * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
const winRate = (wl) => (wl && wl.win + wl.lose > 0 ? (wl.win / (wl.win + wl.lose)) * 100 : null);

function SteamButton() {
  return (
    <a
      href={steamLoginUrl()}
      className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl bg-[#171a21] hover:bg-[#2a475e] text-on-accent text-sm font-bold shadow-lg transition-colors"
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
  const [link, setLink] = useState(null);
  // Consultando o servidor sobre a sessão do perfil
  const [checking, setChecking] = useState(true);
  const [linking, setLinking] = useState(() => hasSteamReturn(location.search));
  const [linkError, setLinkError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [summaryError, setSummaryError] = useState(false);
  // Modo e aba ficam no endereço (?modo=turbo&aba=recordes): ao voltar de uma partida, o perfil reabre igual
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = MODES[searchParams.get('modo')] ? searchParams.get('modo') : 'normal';
  const setParam = (key, value, fallback) => {
    const next = new URLSearchParams(searchParams);
    if (value === fallback) next.delete(key); else next.set(key, value);
    setSearchParams(next, { replace: true });
  };
  const setMode = (m) => setParam('modo', m, 'normal');
  const [modeData, setModeData] = useState({});
  const view = VIEWS.some((v) => v.id === searchParams.get('aba')) ? searchParams.get('aba') : 'resumo';
  const setView = (v) => setParam('aba', v, 'resumo');
  // Conteúdo das abas extras, por aba e modo (ex.: "totais:turbo")
  const [extra, setExtra] = useState({});
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

  // Sessão do perfil (cookie no servidor); no retorno da Steam quem decide é o login acima
  useEffect(() => {
    if (hasSteamReturn(location.search)) { setChecking(false); return; }
    let active = true;
    fetchProfileLink().then((l) => {
      if (!active) return;
      setLink(l);
      setChecking(false);
    });
    return () => { active = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Abas extras: carregadas só quando abertas
  const currentKey = viewKey(view, mode);
  useEffect(() => {
    const cfg = VIEWS.find((v) => v.id === view);
    if (!accountId || !cfg?.load || extra[currentKey]) return;
    let active = true;
    cfg.load(accountId, mode)
      .then((r) => { if (active) setExtra((prev) => ({ ...prev, [currentKey]: Array.isArray(r) ? r : { error: true } })); })
      .catch(() => { if (active) setExtra((prev) => ({ ...prev, [currentKey]: { error: true } })); });
    return () => { active = false; };
  }, [accountId, view, mode, currentKey, extra]);

  const handleRefresh = useCallback(async () => {
    if (!accountId) return;
    setRefreshing(true);
    await refreshProfile(accountId);
    setModeData({});
    setExtra({});
    setReloadKey((k) => k + 1);
    setRefreshing(false);
  }, [accountId]);

  const handleUnlink = async () => {
    await unlinkProfile();
    setLink(null);
    setSummary(null);
    setModeData({});
  };

  const openMatch = (matchId) => navigate(`/partidas/${matchId}`, { state: { from: { path: '/perfil', label: 'Perfil' } } });

  // ---- Estados sem perfil ----
  if (linking || checking) {
    return (
      <div className="py-32 flex flex-col items-center gap-3 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        <span className="text-xs font-semibold">{linking ? 'Confirmando seu login com a Steam...' : 'Carregando perfil...'}</span>
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
            Vincule sua conta Steam para ver suas estatísticas de partidas <strong className="text-gray-200">Normais</strong>{' '}
            e de <strong className="text-gray-200">Turbo</strong>: medalha,
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
  const noMatchesAnywhere = summary && ['normal', 'turbo'].every((m) => !summary.totals[m] || summary.totals[m].win + summary.totals[m].lose === 0);

  function renderExtra() {
    const content = extra[currentKey];
    const label = VIEWS.find((v) => v.id === view)?.label || '';
    if (!content) {
      return (
        <div className="py-12 flex flex-col items-center gap-3 text-gray-400">
          <Loader2 className="w-7 h-7 animate-spin text-amber-400" />
          <span className="text-xs">Carregando {label.toLowerCase()}...</span>
        </div>
      );
    }
    if (content.error || content.length === 0) {
      return (
        <div className="bg-surface border border-line rounded-xl p-6 text-center text-xs text-gray-400">
          {content.error ? 'Não foi possível carregar agora.' : 'Nada encontrado para este modo.'}{' '}
          {content.error && (
            <button type="button" onClick={() => setExtra((p) => { const n = { ...p }; delete n[currentKey]; return n; })} className="font-bold text-amber-400">
              Tentar novamente
            </button>
          )}
        </div>
      );
    }
    const scope = `todo o histórico de ${MODES[mode].label} na OpenDota`;

    if (view === 'recordes') {
      return (
        <div className="space-y-3">
          <p className="text-[11px] text-gray-500">Sua melhor partida em cada estatística, em {scope}. Clique para abrir a partida.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {RECORD_FIELDS.map(({ field, label: name, format }) => {
              const r = content.find((x) => x.field === field);
              if (!r) return null;
              return (
                <button
                  key={field}
                  type="button"
                  onClick={() => openMatch(r.matchId)}
                  className="text-left bg-surface border border-line hover:border-amber-500/40 rounded-xl p-3.5 shadow-lg transition-all group"
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{name}</div>
                  <div className="mt-1 text-2xl font-black font-mono text-amber-400">{format(r.value)}</div>
                  <div className="mt-2 flex items-center gap-2 min-w-0">
                    <img src={getHeroImg(constants, r.heroId)} alt="" className="w-10 h-6 rounded object-cover border border-line shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-white truncate group-hover:text-amber-400">{getHeroName(constants, r.heroId)}</div>
                      <div className="text-[10px] text-gray-500">
                        {fmtWhen(r.startTime)} · <span className={r.won ? 'text-emerald-400' : 'text-rose-400'}>{r.won ? 'Vitória' : 'Derrota'}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (view === 'totais') {
      return (
        <div className="space-y-3">
          <p className="text-[11px] text-gray-500">Soma de {scope}, com a média por partida.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {content.map((t) => (
              <div key={t.field} className="bg-surface border border-line rounded-xl p-3.5 shadow-lg">
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{t.label}</div>
                <div className="mt-1 text-xl font-black font-mono text-amber-400">{t.time ? fmtHours(t.sum) : fmtBig(t.sum)}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  {t.time ? `média ${fmtDuration(Math.round(t.average))} por partida` : `média ${fmtAvg(t.average)} por partida`}
                  {' · '}{t.n.toLocaleString('pt-BR')} partidas
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (view === 'parceiros') {
      return (
        <div className="space-y-3">
          <p className="text-[11px] text-gray-500">Jogadores com quem você mais jogou junto, em {scope}. Clique para ver o perfil na OpenDota.</p>
          <div className="bg-surface border border-line rounded-2xl overflow-x-auto shadow-lg">
            <table className="w-full text-left text-xs min-w-[560px]">
              <thead className="text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-line">
                <tr>
                  <th className="p-3 pl-4">Jogador</th>
                  <th className="p-3 text-center">Juntos</th>
                  <th className="p-3 text-center">Vitórias juntos</th>
                  <th className="p-3 text-center">Contra</th>
                  <th className="p-3 pr-4 text-right">Último jogo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-gray-300">
                {content.map((p) => {
                  const wr = p.withGames ? (p.withWin / p.withGames) * 100 : 0;
                  return (
                    <tr key={p.accountId} className="hover:bg-surface-2/60">
                      <td className="p-3 pl-4">
                        <a href={`https://www.opendota.com/players/${p.accountId}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 group">
                          {p.avatar
                            ? <img src={p.avatar} alt="" referrerPolicy="no-referrer" className="w-7 h-7 rounded-md border border-line shrink-0" />
                            : <div className="w-7 h-7 rounded-md bg-surface-2 border border-line shrink-0" />}
                          <span className="font-bold text-white truncate max-w-[220px] group-hover:text-amber-400">{p.name}</span>
                        </a>
                      </td>
                      <td className="p-3 text-center font-mono font-bold">{p.withGames.toLocaleString('pt-BR')}</td>
                      <td className="p-3 text-center font-mono font-bold">
                        <span className={wr >= 50 ? 'text-emerald-400' : 'text-rose-400'}>{wr.toFixed(0)}%</span>
                      </td>
                      <td className="p-3 text-center font-mono">
                        {p.againstGames ? `${p.againstGames} (${Math.round((p.againstWin / p.againstGames) * 100)}% V)` : '—'}
                      </td>
                      <td className="p-3 pr-4 text-right text-gray-500">{p.lastPlayed ? fmtWhen(p.lastPlayed) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (view === 'nuvem') {
      const max = content[0][1];
      const min = content[content.length - 1][1];
      const size = (n) => 12 + ((n - min) / Math.max(1, max - min)) * 30;
      // Ordem alfabética, como numa nuvem: o tamanho mostra a frequência
      const words = [...content].sort((a, b) => a[0].localeCompare(b[0]));
      return (
        <div className="space-y-3">
          <p className="text-[11px] text-gray-500">Palavras que você mais escreveu no chat das partidas, em {scope}. Quanto maior, mais vezes.</p>
          <div className="bg-surface border border-line rounded-2xl p-6 shadow-lg flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            {words.map(([word, n]) => (
              <span
                key={word}
                title={`${n.toLocaleString('pt-BR')} vezes`}
                style={{ fontSize: `${size(n)}px` }}
                className={`font-black leading-none break-all ${n >= max * 0.5 ? 'text-amber-400' : n >= max * 0.2 ? 'text-white' : 'text-gray-400'}`}
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      );
    }

    // Classificações
    return (
      <div className="space-y-3">
        <p className="text-[11px] text-gray-500">
          Seu desempenho com cada herói comparado com todos os jogadores daquele herói (cálculo da OpenDota, todas as partidas).
          Ex.: 95% = melhor que 95% dos jogadores.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {content.map((r) => {
            const pct = r.percentRank * 100;
            return (
              <div key={r.heroId} className="bg-surface border border-line rounded-xl p-3 shadow-lg flex items-center gap-3">
                <img src={getHeroImg(constants, r.heroId)} alt="" className="w-14 h-8 rounded object-cover border border-line shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white truncate">{getHeroName(constants, r.heroId)}</span>
                    <span className="text-xs font-black font-mono text-amber-400 shrink-0">
                      {pct >= 99.95 ? 'Top 0,1%' : `${pct.toFixed(1).replace('.', ',')}%`}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-surface-2 overflow-hidden">
                    <div className="h-full rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen space-y-6">
      {/* CABEÇALHO */}
      <div className="glass-panel border border-line rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center gap-5 min-w-0">
          {profile?.avatarfull
            ? <img src={profile.avatarfull} alt="" className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border border-line shrink-0 shadow-lg" />
            : <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-surface-2 border border-line flex items-center justify-center shrink-0 shadow-lg"><User className="w-8 h-8 text-gray-500" /></div>}
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-black text-white break-words tracking-tight">
              {profile?.personaname || (summary ? 'Conta sem nome' : 'Carregando...')}
            </h1>
            <div className="text-xs text-gray-400 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>ID da conta: <span className="font-mono text-gray-300 font-bold">{accountId}</span></span>
              {profile?.profileurl && (
                <a href={profile.profileurl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-amber-400 transition-colors">
                  Perfil Steam <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <a href={`https://www.opendota.com/players/${accountId}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-amber-400 transition-colors">
                OpenDota <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-4 flex-wrap">
          {medal && (
            <div className="flex items-center gap-3 bg-surface-2/60 border border-line px-3.5 py-2 rounded-2xl">
              <div className="relative w-12 h-12 shrink-0">
                <img src={medal.icon} alt="" className="absolute inset-0 w-full h-full" />
                {medal.star && <img src={medal.star} alt="" className="absolute inset-0 w-full h-full" />}
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Medalha</div>
                <div className="text-sm font-black text-white">{medal.name}</div>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-2 border border-line text-xs font-bold text-gray-300 hover:text-amber-400 hover:border-amber-500/30 transition-all disabled:opacity-50"
              title="Pede para a OpenDota buscar suas partidas mais recentes"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Atualizar
            </button>
            <button
              type="button"
              onClick={handleUnlink}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-2 border border-line text-xs font-bold text-gray-400 hover:text-rose-400 hover:border-rose-500/30 transition-all"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(MODES).map(([id, cfg]) => {
          const wl = summary?.totals?.[id];
          const wr = winRate(wl);
          const active = mode === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              className={`tilt-card text-left rounded-3xl border p-5 transition-all ${
                active ? 'glass-panel border-amber-500 shadow-xl shadow-amber-500/10' : 'bg-surface-2/60 border-line hover:border-amber-500/30'
              }`}
            >
              <div className={`text-xs font-black uppercase tracking-wider ${active ? 'text-amber-400' : 'text-gray-400'}`}>{cfg.label}</div>
              <div className="text-[11px] text-gray-400">{cfg.hint}</div>
              {wl ? (
                <div className="mt-2 flex items-baseline gap-3">
                  <span className="text-3xl font-black text-white font-mono">{(wl.win + wl.lose).toLocaleString('pt-BR')}</span>
                  <span className="text-xs text-gray-400">partidas</span>
                  {wr !== null && (
                    <span className={`ml-auto text-base font-black font-mono ${wr >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>{wr.toFixed(1)}%</span>
                  )}
                </div>
              ) : (
                <div className="mt-2 text-xs text-gray-400">{summary ? '—' : 'Carregando...'}</div>
              )}
              {wl && <div className="text-xs text-gray-400 mt-1">{wl.win.toLocaleString('pt-BR')} V · {wl.lose.toLocaleString('pt-BR')} D (total na OpenDota)</div>}
            </button>
          );
        })}
      </div>

      {/* ABAS DO PERFIL */}
      <div className="flex items-center gap-2 border-b border-line pb-3 overflow-x-auto">
        {VIEWS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setView(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
              view === id ? 'bg-amber-500 text-on-accent shadow-lg shadow-amber-500/20' : 'text-gray-400 hover:text-white hover:bg-surface-2'
            }`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {view !== 'resumo' ? (
        renderExtra()
      ) : !data ? (
        <div className="py-12 flex flex-col items-center gap-3 text-gray-400">
          <Loader2 className="w-7 h-7 animate-spin text-amber-400" />
          <span className="text-xs">Carregando partidas de {MODES[mode].label}...</span>
        </div>
      ) : data.error ? (
        <div className="glass-panel border border-line rounded-2xl p-6 text-center text-xs text-gray-400">
          Não foi possível carregar as partidas agora.{' '}
          <button type="button" onClick={() => setModeData((p) => { const n = { ...p }; delete n[mode]; return n; })} className="font-bold text-amber-400">Tentar novamente</button>
        </div>
      ) : data.matches.length === 0 ? (
        <div className="glass-panel border border-line rounded-2xl p-8 text-center text-xs text-gray-400">
          Nenhuma partida de {MODES[mode].label} encontrada.
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* MÉDIAS + HERÓIS */}
          <div className="space-y-6">
            <section className="glass-panel rounded-3xl p-6 shadow-xl border border-line">
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
                  <div key={label} className="bg-surface-2/80 rounded-2xl p-3 border border-line">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</div>
                    <div className={`mt-0.5 text-sm font-black font-mono ${color}`}>{value}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="glass-panel rounded-3xl p-6 shadow-xl border border-line">
              <h2 className="text-xs font-black uppercase tracking-wider text-white mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" /> Heróis mais jogados
              </h2>
              <p className="text-xs text-gray-400 -mt-2 mb-4">Todo o histórico de {MODES[mode].label} registrado na OpenDota.</p>
              <ul className="space-y-2.5">
                {data.heroes.slice(0, 10).map((h) => {
                  const wr = (h.wins / h.games) * 100;
                  return (
                    <li key={h.heroId} className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-surface-2/60 transition-colors">
                      <img src={getHeroImg(constants, h.heroId)} alt="" className="w-12 h-7 rounded-lg object-cover border border-line shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate">{getHeroName(constants, h.heroId)}</div>
                        {h.lastPlayed && (
                          <div className="text-[10px] text-gray-400">Último jogo: {fmtWhen(h.lastPlayed)}</div>
                        )}
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
          <section className="xl:col-span-2 glass-panel rounded-3xl p-6 shadow-xl border border-line">
            <h2 className="text-xs font-black uppercase tracking-wider text-white mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" /> Partidas recentes
            </h2>
            <div className="space-y-2">
              {data.matches.slice(0, 20).map((m) => (
                <button
                  key={m.match_id}
                  type="button"
                  onClick={() => openMatch(m.match_id)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl bg-surface-2/60 hover:bg-surface-2 border border-line hover:border-amber-500/40 text-left transition-all group"
                >
                  <span className={`w-1.5 self-stretch rounded-full shrink-0 ${m.won ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <img src={getHeroImg(constants, m.hero_id)} alt="" className="w-12 h-7 rounded-lg object-cover border border-line shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate">{getHeroName(constants, m.hero_id)}</div>
                    <div className="text-[10px] text-gray-400">{GAME_MODES[m.game_mode] || 'Partida'} · {fmtWhen(m.start_time)}<span className="sm:hidden"> · {m.kills}/{m.deaths}/{m.assists}</span></div>
                  </div>
                  <span className={`text-[10px] font-black uppercase w-16 text-center shrink-0 ${m.won ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {m.won ? 'Vitória' : 'Derrota'}
                  </span>
                  <span className="hidden sm:inline text-xs font-mono text-gray-300 w-24 text-center shrink-0">
                    {m.kills}/{m.deaths}/{m.assists}
                  </span>
                  <span className="hidden sm:inline text-xs font-mono text-gray-400 w-12 text-right shrink-0">{fmtDuration(m.duration)}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-amber-400 shrink-0" />
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
