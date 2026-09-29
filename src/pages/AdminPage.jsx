import React, { useState } from 'react';
import { Lock, Shield, RefreshCw, Calendar, Tv, FileText, Settings, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SITE_CONFIG } from '../config/siteConfig';

export default function AdminPage() {
  const { user, isAdmin, signIn, signOut, isConfigured } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('sync'); // 'sync' | 'schedule' | 'streams' | 'analyses' | 'settings'

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    const res = await signIn(email, password);
    if (res.error) {
      setLoginError(res.error.message || 'Erro ao realizar login');
    }
  };

  const handleSyncSource = async (source) => {
    setSyncLoading(true);
    setSyncStatus(null);
    try {
      const endpoint = source === 'opendota' ? '/api/sync-opendota' : '/api/sync-steam';
      const res = await fetch(endpoint);
      const data = await res.json();
      setSyncStatus({ source, ok: data.ok, message: data.message || `Sincronização concluída (${data.synced || data.count || 0} itens processados)` });
    } catch (err) {
      setSyncStatus({ source, ok: false, message: err.message || 'Falha ao acionar sincronização' });
    } finally {
      setSyncLoading(false);
    }
  };

  // Se não estiver logado ou não for admin
  if (!user || !isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 min-h-screen flex items-center justify-center">
        <div className="w-full bg-[#0C0E14] border border-[#212838] rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-7 h-7 text-amber-400" />
            </div>
            <h1 className="text-xl font-black text-white uppercase tracking-tight">
              Painel Administrativo
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Acesso restrito para gerenciamento de agenda, streams e sincronização.
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
              💡 <strong>Modo Local:</strong> O Supabase ainda não foi conectado. Você pode testar digitando qualquer e-mail contendo <code className="text-amber-400">admin</code> para login de demonstração.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      {/* Header Admin */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#212838]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white uppercase font-serif tracking-tight">
              Painel de Controle DotaHub
            </h1>
            <span className="text-xs text-emerald-400 font-bold">
              Autenticado como: {user?.email} (Administrador)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </div>

      {/* Abas Administrativas */}
      <div className="flex items-center gap-2 border-b border-[#212838] pb-3 mb-6 overflow-x-auto">
        {[
          { id: 'sync', label: 'Sincronização & Cron', icon: RefreshCw },
          { id: 'schedule', label: 'Cadastrar Agenda', icon: Calendar },
          { id: 'streams', label: 'Streams & VODs', icon: Tv },
          { id: 'analyses', label: 'Artigos & Blog', icon: FileText },
          { id: 'settings', label: 'Configurações do Site', icon: Settings }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                isActive ? 'bg-amber-500 text-black font-black' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Conteúdo Aba Sincronização */}
      {activeTab === 'sync' && (
        <div className="max-w-3xl space-y-6">
          <div className="bg-[#0C0E14] border border-[#212838] rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-black uppercase text-white mb-2">Disparo Manual de Sincronização</h3>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
              Acione as funções serverless para atualizar o banco de dados Supabase com as últimas partidas da OpenDota e da Steam Web API.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => handleSyncSource('opendota')}
                disabled={syncLoading}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#141A28] hover:bg-[#1A2234] border border-amber-500/30 text-xs font-bold text-amber-400 uppercase tracking-wider transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${syncLoading ? 'animate-spin' : ''}`} />
                <span>Sincronizar OpenDota</span>
              </button>

              <button
                onClick={() => handleSyncSource('steam')}
                disabled={syncLoading}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#141A28] hover:bg-[#1A2234] border border-blue-500/30 text-xs font-bold text-blue-400 uppercase tracking-wider transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${syncLoading ? 'animate-spin' : ''}`} />
                <span>Sincronizar Steam Web API</span>
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
        </div>
      )}

      {/* Conteúdo Aba Agenda */}
      {activeTab === 'schedule' && (
        <div className="bg-[#0C0E14] border border-[#212838] rounded-2xl p-6 shadow-xl max-w-2xl">
          <h3 className="text-base font-black uppercase text-white mb-4">Adicionar Partida Futura à Agenda</h3>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Partida agendada com sucesso!'); }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Time Radiante</label>
                <input type="text" placeholder="ex: Team Falcons" className="w-full bg-[#11141E] border border-[#212838] rounded-xl px-3 py-2 text-xs text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Time Dire</label>
                <input type="text" placeholder="ex: Team Liquid" className="w-full bg-[#11141E] border border-[#212838] rounded-xl px-3 py-2 text-xs text-white" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nome do Campeonato</label>
              <input type="text" placeholder="ex: ESL One Bangkok 2026" className="w-full bg-[#11141E] border border-[#212838] rounded-xl px-3 py-2 text-xs text-white" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Horário (Brasília)</label>
                <input type="datetime-local" className="w-full bg-[#11141E] border border-[#212838] rounded-xl px-3 py-2 text-xs text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Formato</label>
                <select className="w-full bg-[#11141E] border border-[#212838] rounded-xl px-3 py-2 text-xs text-white">
                  <option value="3">MD3 (Melhor de 3)</option>
                  <option value="5">MD5 (Melhor de 5)</option>
                  <option value="1">MD1 (Melhor de 1)</option>
                </select>
              </div>
            </div>
            <button type="submit" className="px-6 py-2.5 rounded-xl bg-amber-500 text-black font-bold uppercase text-xs">
              Salvar Partida na Agenda
            </button>
          </form>
        </div>
      )}

      {/* Conteúdo Aba Streams */}
      {activeTab === 'streams' && (
        <div className="bg-[#0C0E14] border border-[#212838] rounded-2xl p-6 shadow-xl max-w-2xl">
          <h3 className="text-base font-black uppercase text-white mb-4">Gerenciar Transmissões Oficiais</h3>
          <p className="text-xs text-gray-400 mb-4">
            Cadastre canais da Twitch e YouTube para incorporar na página Ao Vivo.
          </p>
          <div className="space-y-3">
            <div className="p-3 bg-[#11141E] border border-white/5 rounded-xl flex justify-between items-center text-xs">
              <div>
                <span className="font-bold text-white block">ESL Dota 2 Brasil</span>
                <span className="text-gray-500 font-mono">twitch.tv/esl_dota2br</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold uppercase text-[10px]">Ativa</span>
            </div>
            <div className="p-3 bg-[#11141E] border border-white/5 rounded-xl flex justify-between items-center text-xs">
              <div>
                <span className="font-bold text-white block">BTS Brasil TV</span>
                <span className="text-gray-500 font-mono">twitch.tv/btsbrasiltv</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold uppercase text-[10px]">Ativa</span>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo Aba Configurações */}
      {activeTab === 'settings' && (
        <div className="bg-[#0C0E14] border border-[#212838] rounded-2xl p-6 shadow-xl max-w-2xl">
          <h3 className="text-base font-black uppercase text-white mb-4">Configurações Gerais do Site</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nome do Site</label>
              <input type="text" defaultValue={SITE_CONFIG.name} className="w-full bg-[#11141E] border border-[#212838] rounded-xl px-3 py-2 text-xs text-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Link do Discord da Comunidade</label>
              <input type="text" defaultValue={SITE_CONFIG.community.discord} className="w-full bg-[#11141E] border border-[#212838] rounded-xl px-3 py-2 text-xs text-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Pontuação: Acerto de Vencedor</label>
              <input type="number" defaultValue={SITE_CONFIG.predictionPoints.correctWinner} className="w-full bg-[#11141E] border border-[#212838] rounded-xl px-3 py-2 text-xs text-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Pontuação: Placar Exato</label>
              <input type="number" defaultValue={SITE_CONFIG.predictionPoints.exactScore} className="w-full bg-[#11141E] border border-[#212838] rounded-xl px-3 py-2 text-xs text-white" />
            </div>
            <button className="px-6 py-2.5 rounded-xl bg-amber-500 text-black font-bold uppercase text-xs">
              Salvar Alterações
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
