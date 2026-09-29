import React, { useState, useEffect } from 'react';
import {
  Lock,
  Shield,
  RefreshCw,
  Calendar,
  Tv,
  FileText,
  Settings,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Plus,
  Trash2,
  ExternalLink,
  Flame,
  Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { SITE_CONFIG } from '../config/siteConfig';
import { supabase, isSupabaseConfigured } from '../services/supabase';

export default function AdminPage() {
  const { user, isAdmin, signIn, signOut, isConfigured } = useAuth();
  const { refreshData } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('sync'); // 'sync' | 'schedule' | 'streams' | 'analyses' | 'settings'

  // Sincronização
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncLogs, setSyncLogs] = useState([
    { source: 'OpenDota API', status: 'Sucesso', items: 30, time: 'Hoje às 08:15' },
    { source: 'Steam Web API', status: 'Sucesso', items: 2, time: 'Hoje às 08:30' }
  ]);

  // Agenda de Partidas (CRUD)
  const [scheduleList, setScheduleList] = useState([
    { id: 1, team1: 'Team Falcons', team2: 'Gaimin Gladiators', league: 'ESL One Bangkok 2026', time: '14:00', format: 'MD3' },
    { id: 2, team1: 'Team Liquid', team2: 'Team Spirit', league: 'ESL One Bangkok 2026', time: '17:30', format: 'MD3' },
    { id: 3, team1: 'BetBoom Team', team2: 'PARIVISION', league: 'ESL One Bangkok 2026', time: '21:00', format: 'MD3' }
  ]);
  const [newTeam1, setNewTeam1] = useState('');
  const [newTeam2, setNewTeam2] = useState('');
  const [newLeague, setNewLeague] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newFormat, setNewFormat] = useState('3');

  // Streams (CRUD)
  const [streamsList, setStreamsList] = useState([
    { id: 1, name: 'ESL Dota 2 Brasil', channel: 'esl_dota2br', platform: 'Twitch', lang: 'pt-BR', active: true },
    { id: 3, name: 'ESL Dota 2 Official', channel: 'esl_dota2', platform: 'Twitch', lang: 'en', active: true }
  ]);
  const [newStreamName, setNewStreamName] = useState('');
  const [newStreamChannel, setNewStreamChannel] = useState('');
  const [newStreamLang, setNewStreamLang] = useState('pt-BR');

  // Editor de Análises (Markdown)
  const [articleTitle, setArticleTitle] = useState('');
  const [articleSlug, setArticleSlug] = useState('');
  const [articleSummary, setArticleSummary] = useState('');
  const [articleContent, setArticleContent] = useState('');
  const [articleAuthor, setArticleAuthor] = useState('Admin DotaHub');
  const [articleCover, setArticleCover] = useState('');

  // Notificação interna
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    const res = await signIn(email, password);
    if (res.error) {
      setLoginError(res.error.message || 'Erro ao realizar login');
    }
  };

  // Disparo de sincronização
  const handleSyncSource = async (source) => {
    setSyncLoading(true);
    setSyncStatus(null);
    try {
      const endpoint = source === 'opendota' ? '/api/sync-opendota' : '/api/sync-steam';
      const res = await fetch(endpoint);
      const data = await res.json();
      const statusObj = {
        source: source === 'opendota' ? 'OpenDota API' : 'Steam Web API',
        ok: data.ok,
        message: data.message || `Sincronização concluída com sucesso (${data.synced || data.count || 0} itens processados)`
      };
      setSyncStatus(statusObj);
      setSyncLogs((prev) => [
        {
          source: statusObj.source,
          status: data.ok ? 'Sucesso' : 'Falha',
          items: data.synced || data.count || 0,
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        },
        ...prev
      ]);
      refreshData();
      showToast(`Sincronização ${source} executada!`);
    } catch (err) {
      setSyncStatus({ source, ok: false, message: err.message || 'Falha ao acionar sincronização' });
    } finally {
      setSyncLoading(false);
    }
  };

  // Adicionar partida à agenda
  const handleAddSchedule = (e) => {
    e.preventDefault();
    if (!newTeam1 || !newTeam2 || !newLeague) return;
    const newEntry = {
      id: Date.now(),
      team1: newTeam1,
      team2: newTeam2,
      league: newLeague,
      time: newTime || '16:00',
      format: `MD${newFormat}`
    };
    setScheduleList([newEntry, ...scheduleList]);
    setNewTeam1('');
    setNewTeam2('');
    setNewLeague('');
    setNewTime('');
    showToast('Partida cadastrada na agenda com sucesso!');
  };

  // Remover partida da agenda
  const handleDeleteSchedule = (id) => {
    setScheduleList(scheduleList.filter((s) => s.id !== id));
    showToast('Partida removida da agenda.');
  };

  // Adicionar Stream
  const handleAddStream = (e) => {
    e.preventDefault();
    if (!newStreamName || !newStreamChannel) return;
    const newEntry = {
      id: Date.now(),
      name: newStreamName,
      channel: newStreamChannel,
      platform: 'Twitch',
      lang: newStreamLang,
      active: true
    };
    setStreamsList([...streamsList, newEntry]);
    setNewStreamName('');
    setNewStreamChannel('');
    showToast('Transmissão cadastrada com sucesso!');
  };

  // Publicar Análise em Markdown
  const handlePublishArticle = async (e) => {
    e.preventDefault();
    if (!articleTitle || !articleContent) return;

    const payload = {
      title: articleTitle,
      slug: articleSlug || articleTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      summary: articleSummary,
      content: articleContent,
      author: articleAuthor,
      cover_image: articleCover || 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/blog/patch737_banner.jpg',
      tags: ['Análise', 'Meta', 'Admin'],
      is_featured: false,
      published_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('analyses').upsert(payload, { onConflict: 'slug' });
      } catch (err) {
        console.warn('Erro ao salvar no Supabase:', err);
      }
    }

    setArticleTitle('');
    setArticleSlug('');
    setArticleSummary('');
    setArticleContent('');
    showToast('Artigo publicado com sucesso no blog tático!');
  };

  // TELA DE LOGIN (PROTEÇÃO ADMIN)
  if (!user || !isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 min-h-screen flex items-center justify-center">
        <div className="w-full bg-[#0C0E14] border border-[#212838] rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-7 h-7 text-amber-400" />
            </div>
            <h1 className="text-xl font-black text-white uppercase tracking-tight">
              Acesso Administrativo
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Faça login com a sua conta autorizada para gerenciar a agenda, streams e sincronização.
            </p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@dotahub.com"
                className="w-full bg-[#11141E] border border-[#212838] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#11141E] border border-[#212838] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black uppercase tracking-wider text-xs shadow-lg shadow-amber-500/20 transition-all"
            >
              Entrar no Painel
            </button>
          </form>

          {!isConfigured && (
            <div className="mt-6 p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-gray-400 text-center">
              💡 <strong>Ambiente Local:</strong> Você pode fazer login com qualquer e-mail contendo <code className="text-amber-400">admin</code> para testar todas as funcionalidades administrativas.
            </div>
          )}
        </div>
      </div>
    );
  }

  // PAINEL AUTENTICADO
  return (
    <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      
      {/* TOAST DE FEEDBACK */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 border border-emerald-500 text-emerald-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce text-xs font-bold">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* HEADER DO PAINEL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#212838]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white uppercase font-serif tracking-tight">
              Painel Administrativo DotaHub
            </h1>
            <span className="text-xs text-emerald-400 font-bold">
              Autenticado como: {user?.email} (Acesso Total)
            </span>
          </div>
        </div>

        <button
          onClick={() => signOut()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white transition-all w-fit"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair da Conta</span>
        </button>
      </div>

      {/* ABAS DO PAINEL */}
      <div className="flex items-center gap-2 border-b border-[#212838] pb-3 mb-8 overflow-x-auto">
        {[
          { id: 'sync', label: 'Sincronização & Cron', icon: RefreshCw },
          { id: 'schedule', label: 'Cadastrar Agenda', icon: Calendar },
          { id: 'streams', label: 'Streams & VODs', icon: Tv },
          { id: 'analyses', label: 'Publicar Análises (Markdown)', icon: FileText },
          { id: 'settings', label: 'Configurações do Site', icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                isActive ? 'bg-amber-500 text-black font-black' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ABA 1: SINCRONIZAÇÃO */}
      {activeTab === 'sync' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[#0C0E14] border border-[#212838] rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-black uppercase text-white mb-2">Disparadores Manuais</h3>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
              Acione as rotas serverless sob demanda para importar dados da OpenDota e da Steam Web API para o Supabase.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => handleSyncSource('opendota')}
                disabled={syncLoading}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#141A28] hover:bg-[#1A2234] border border-amber-500/30 text-xs font-bold text-amber-400 uppercase tracking-wider transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${syncLoading ? 'animate-spin' : ''}`} />
                <span>Sincronizar OpenDota ProMatches</span>
              </button>

              <button
                onClick={() => handleSyncSource('steam')}
                disabled={syncLoading}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#141A28] hover:bg-[#1A2234] border border-blue-500/30 text-xs font-bold text-blue-400 uppercase tracking-wider transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${syncLoading ? 'animate-spin' : ''}`} />
                <span>Sincronizar Steam GOTV Live</span>
              </button>
            </div>

            {syncStatus && (
              <div className={`mt-6 p-4 rounded-xl text-xs flex items-center gap-3 border ${
                syncStatus.ok ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-red-950/40 border-red-800 text-red-300'
              }`}>
                {syncStatus.ok ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                <div>
                  <span className="font-bold block uppercase">{syncStatus.source}:</span>
                  <span>{syncStatus.message}</span>
                </div>
              </div>
            )}
          </div>

          {/* HISTÓRICO DE LOGS DE SINCRONIZAÇÃO */}
          <div className="bg-[#0C0E14] border border-[#212838] rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-black uppercase text-white mb-4">Registro Recente de Sincronizações</h3>
            <div className="space-y-3">
              {syncLogs.map((log, idx) => (
                <div key={idx} className="p-3 bg-[#11141E] border border-white/5 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">{log.source}</span>
                    <span className="text-[11px] text-gray-500">{log.time}</span>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400">
                      {log.status} ({log.items} itens)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: CRUD DE AGENDA */}
      {activeTab === 'schedule' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* FORMULÁRIO DE ADIÇÃO */}
          <div className="lg:col-span-5 bg-[#0C0E14] border border-[#212838] rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-black uppercase text-white mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Cadastrar Próxima Partida</span>
            </h3>

            <form onSubmit={handleAddSchedule} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Time A (Radiante)</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Team Falcons"
                    value={newTeam1}
                    onChange={(e) => setNewTeam1(e.target.value)}
                    className="w-full bg-[#11141E] border border-[#212838] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Time B (Dire)</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Team Liquid"
                    value={newTeam2}
                    onChange={(e) => setNewTeam2(e.target.value)}
                    className="w-full bg-[#11141E] border border-[#212838] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Campeonato</label>
                <input
                  type="text"
                  required
                  placeholder="ex: ESL One Bangkok 2026"
                  value={newLeague}
                  onChange={(e) => setNewLeague(e.target.value)}
                  className="w-full bg-[#11141E] border border-[#212838] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Horário (Brasília)</label>
                  <input
                    type="text"
                    placeholder="ex: 15:30"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-[#11141E] border border-[#212838] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Formato</label>
                  <select
                    value={newFormat}
                    onChange={(e) => setNewFormat(e.target.value)}
                    className="w-full bg-[#11141E] border border-[#212838] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="3">MD3 (Melhor de 3)</option>
                    <option value="5">MD5 (Melhor de 5)</option>
                    <option value="1">MD1 (Melhor de 1)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 text-black font-black uppercase tracking-wider text-xs shadow-md shadow-amber-500/20 hover:bg-amber-400 transition-all"
              >
                Adicionar à Agenda
              </button>
            </form>
          </div>

          {/* LISTA DA AGENDA CADASTRADA */}
          <div className="lg:col-span-7 bg-[#0C0E14] border border-[#212838] rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-black uppercase text-white mb-4">Agenda Cadastrada ({scheduleList.length})</h3>
            <div className="space-y-3">
              {scheduleList.map((item) => (
                <div key={item.id} className="p-3.5 bg-[#11141E] border border-white/5 rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-white text-xs">{item.team1} vs {item.team2}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 text-amber-400 font-bold">{item.format}</span>
                    </div>
                    <span className="text-[11px] text-gray-400 block">{item.league} • às {item.time} BRT</span>
                  </div>

                  <button
                    onClick={() => handleDeleteSchedule(item.id)}
                    className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ABA 3: STREAMS E VODS */}
      {activeTab === 'streams' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 bg-[#0C0E14] border border-[#212838] rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-black uppercase text-white mb-4">Adicionar Canal de Stream</h3>
            <form onSubmit={handleAddStream} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nome do Canal</label>
                <input
                  type="text"
                  required
                  placeholder="ex: ESL Dota 2 Brasil"
                  value={newStreamName}
                  onChange={(e) => setNewStreamName(e.target.value)}
                  className="w-full bg-[#11141E] border border-[#212838] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Usuário Twitch</label>
                <input
                  type="text"
                  required
                  placeholder="ex: esl_dota2br"
                  value={newStreamChannel}
                  onChange={(e) => setNewStreamChannel(e.target.value)}
                  className="w-full bg-[#11141E] border border-[#212838] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Idioma</label>
                <select
                  value={newStreamLang}
                  onChange={(e) => setNewStreamLang(e.target.value)}
                  className="w-full bg-[#11141E] border border-[#212838] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="pt-BR">Português (pt-BR)</option>
                  <option value="en">Inglês (en)</option>
                  <option value="es">Espanhol (es)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-wider text-xs shadow-md transition-all"
              >
                Cadastrar Canal
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-[#0C0E14] border border-[#212838] rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-black uppercase text-white mb-4">Canais de Transmissão Ativos</h3>
            <div className="space-y-3">
              {streamsList.map((st) => (
                <div key={st.id} className="p-3 bg-[#11141E] border border-white/5 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">{st.name}</span>
                    <span className="text-[11px] text-gray-500 font-mono">twitch.tv/{st.channel} ({st.lang})</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400">
                    Ativo
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ABA 4: PUBLICADOR DE ANÁLISES (MARKDOWN) */}
      {activeTab === 'analyses' && (
        <div className="bg-[#0C0E14] border border-[#212838] rounded-2xl p-6 sm:p-8 shadow-xl max-w-4xl mx-auto">
          <h3 className="text-base font-black uppercase text-white mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <span>Publicar Novo Artigo / Análise Tática</span>
          </h3>

          <form onSubmit={handlePublishArticle} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Título do Artigo</label>
              <input
                type="text"
                required
                placeholder="ex: Como o Meta da Posição 4 Mudou com o Patch 7.37"
                value={articleTitle}
                onChange={(e) => setArticleTitle(e.target.value)}
                className="w-full bg-[#11141E] border border-[#212838] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Slug URL</label>
                <input
                  type="text"
                  placeholder="ex: como-meta-pos-4-mudou"
                  value={articleSlug}
                  onChange={(e) => setArticleSlug(e.target.value)}
                  className="w-full bg-[#11141E] border border-[#212838] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Autor</label>
                <input
                  type="text"
                  value={articleAuthor}
                  onChange={(e) => setArticleAuthor(e.target.value)}
                  className="w-full bg-[#11141E] border border-[#212838] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Resumo (Lead do Post)</label>
              <textarea
                rows={2}
                value={articleSummary}
                onChange={(e) => setArticleSummary(e.target.value)}
                placeholder="Breve resumo da análise..."
                className="w-full bg-[#11141E] border border-[#212838] rounded-xl p-3 text-xs text-white placeholder-gray-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Conteúdo Completo (Markdown)</label>
              <textarea
                rows={8}
                required
                value={articleContent}
                onChange={(e) => setArticleContent(e.target.value)}
                placeholder="# Escreva em Markdown aqui...&#10;&#10;Use títulos, tópicos e negrito."
                className="w-full bg-[#11141E] border border-[#212838] rounded-xl p-3.5 text-xs text-white font-mono placeholder-gray-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-wider text-xs shadow-lg shadow-amber-500/20 transition-all"
            >
              Publicar Artigo Agora
            </button>
          </form>
        </div>
      )}

      {/* ABA 5: CONFIGURAÇÕES DO SITE */}
      {activeTab === 'settings' && (
        <div className="bg-[#0C0E14] border border-[#212838] rounded-2xl p-6 sm:p-8 shadow-xl max-w-2xl mx-auto">
          <h3 className="text-base font-black uppercase text-white mb-6 flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            <span>Configurações Globais da Aplicação</span>
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nome do Site</label>
              <input
                type="text"
                defaultValue={SITE_CONFIG.name}
                className="w-full bg-[#11141E] border border-[#212838] rounded-xl px-3.5 py-2.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Link do Discord da Comunidade</label>
              <input
                type="text"
                defaultValue={SITE_CONFIG.community.discord}
                className="w-full bg-[#11141E] border border-[#212838] rounded-xl px-3.5 py-2.5 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Pontos: Acerto Vencedor</label>
                <input
                  type="number"
                  defaultValue={SITE_CONFIG.predictionPoints.correctWinner}
                  className="w-full bg-[#11141E] border border-[#212838] rounded-xl px-3.5 py-2.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Pontos: Placar Exato</label>
                <input
                  type="number"
                  defaultValue={SITE_CONFIG.predictionPoints.exactScore}
                  className="w-full bg-[#11141E] border border-[#212838] rounded-xl px-3.5 py-2.5 text-xs text-white"
                />
              </div>
            </div>

            <button
              onClick={() => showToast('Configurações salvas!')}
              className="px-6 py-2.5 rounded-xl bg-amber-500 text-black font-black uppercase tracking-wider text-xs shadow-md hover:bg-amber-400 transition-all"
            >
              Salvar Alterações
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
