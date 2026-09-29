import React, { useState } from 'react';
import { Award, Trophy, Flame, CheckCircle, Shield, Sparkles, Lock, Star } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { SITE_CONFIG } from '../config/siteConfig';
import { getTeamLogo } from '../utils/teamLogos';

export default function PredictionsPage() {
  const { upcomingMatches } = useApp();
  const { user, isConfigured } = useAuth();

  // Armazena palpites locais
  const [predictions, setPredictions] = useState({});
  const [activeTab, setActiveTab] = useState('matches'); // 'matches' | 'leaderboard' | 'badges'

  const handlePredict = (matchId, teamChosen, score = '2-1') => {
    setPredictions(prev => ({
      ...prev,
      [matchId]: { teamChosen, score, savedAt: new Date().toISOString() }
    }));
  };

  // Mock Ranking Leaderboard
  const leaderboard = [
    { rank: 1, name: 'DendiFanBR', points: 145, hits: 28, exactScores: 12, badge: 'Mestre do Major' },
    { rank: 2, name: 'RoshanHunter', points: 132, hits: 25, exactScores: 10, badge: 'Oráculo' },
    { rank: 3, name: 'MidOrFeed', points: 121, hits: 22, exactScores: 9, badge: 'Em Chamas' },
    { rank: 4, name: 'CarryGod', points: 108, hits: 20, exactScores: 8, badge: 'Caçador de Zebras' },
    { rank: 5, name: 'SupportLife', points: 95, hits: 18, exactScores: 6, badge: 'Iniciado' }
  ];

  // Conquistas / Badges
  const badges = [
    { title: 'Iniciado em Roshan', desc: 'Fez o primeiro palpite em uma partida oficial', icon: Shield, unlocked: true },
    { title: 'Em Chamas', desc: 'Acertou o vencedor de 3 partidas seguidas', icon: Flame, unlocked: true },
    { title: 'Visão do Oráculo', desc: 'Acertou o placar exato de uma série MD3 ou MD5', icon: Sparkles, unlocked: false },
    { title: 'Caçador de Zebras', desc: 'Acertou a vitória de um azarão com menos de 30% dos votos', icon: Star, unlocked: false },
    { title: 'Mestre do Major', desc: 'Palpitou em todos os confrontos dos playoffs', icon: Trophy, unlocked: false }
  ];

  return (
    <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#212838]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase font-serif tracking-tight flex items-center gap-2.5">
            <Award className="w-7 h-7 text-amber-500" />
            <span>Bolão de Palpites & Conquistas</span>
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            Palpite nos vencedores das séries antes do início. Vencedor = {SITE_CONFIG.predictionPoints.correctWinner} pts • Placar Exato = {SITE_CONFIG.predictionPoints.exactScore} pts.
          </p>
        </div>

        {/* Abas */}
        <div className="flex bg-[#11141E] p-1 rounded-xl border border-[#212838]">
          {[
            { id: 'matches', label: 'Próximos Jogos', icon: Trophy },
            { id: 'leaderboard', label: 'Ranking do Bolão', icon: Award },
            { id: 'badges', label: 'Conquistas & Badges', icon: Sparkles }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'bg-amber-500 text-black font-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo Aba: Próximos Jogos para Palpite */}
      {activeTab === 'matches' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(upcomingMatches || []).slice(0, 9).map((m, idx) => {
            const pred = predictions[m.id || idx];
            return (
              <div
                key={m.id || idx}
                className="bg-[#0C0E14] border border-[#212838] hover:border-amber-500/40 rounded-2xl p-5 shadow-xl transition-all"
              >
                <div className="flex items-center justify-between text-[11px] text-gray-400 pb-3 border-b border-white/5 mb-4">
                  <span className="font-bold text-amber-400 truncate max-w-[200px]">{m.tourneyName || 'Torneio'}</span>
                  <span className="font-mono text-gray-400 font-bold bg-white/5 px-2 py-0.5 rounded">
                    {m.startTime || 'Em breve'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 mb-5">
                  <button
                    onClick={() => handlePredict(m.id || idx, m.timeA, '2-1')}
                    className={`flex flex-col items-center flex-1 p-3 rounded-xl border transition-all ${
                      pred?.teamChosen === m.timeA
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/10'
                        : 'bg-[#11141E] border-white/5 hover:border-white/20 text-gray-300'
                    }`}
                  >
                    <img src={getTeamLogo(m.timeA)} alt={m.timeA} className="w-10 h-10 object-contain mb-2" />
                    <span className="text-xs font-bold truncate max-w-[100px]">{m.timeA}</span>
                    <span className="text-[10px] text-gray-500 mt-1">Palpitar Vitória</span>
                  </button>

                  <span className="text-xs font-black text-gray-500 uppercase">VS</span>

                  <button
                    onClick={() => handlePredict(m.id || idx, m.timeB, '1-2')}
                    className={`flex flex-col items-center flex-1 p-3 rounded-xl border transition-all ${
                      pred?.teamChosen === m.timeB
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/10'
                        : 'bg-[#11141E] border-white/5 hover:border-white/20 text-gray-300'
                    }`}
                  >
                    <img src={getTeamLogo(m.timeB)} alt={m.timeB} className="w-10 h-10 object-contain mb-2" />
                    <span className="text-xs font-bold truncate max-w-[100px]">{m.timeB}</span>
                    <span className="text-[10px] text-gray-500 mt-1">Palpitar Vitória</span>
                  </button>
                </div>

                {pred ? (
                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-emerald-400 font-bold">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" />
                      <span>Palpite registrado: {pred.teamChosen}</span>
                    </span>
                    <span className="text-gray-400 font-mono text-[10px]">Bloqueia no início</span>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-white/5 text-[11px] text-gray-500 text-center">
                    Clique em um dos times para palpitar
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Conteúdo Aba: Ranking */}
      {activeTab === 'leaderboard' && (
        <div className="bg-[#0C0E14] border border-[#212838] rounded-2xl p-6 shadow-xl max-w-4xl mx-auto">
          <h3 className="text-base font-black uppercase text-white mb-6 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Classificação Geral do Bolão</span>
          </h3>

          <div className="divide-y divide-white/5">
            {leaderboard.map((item) => (
              <div key={item.rank} className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className={`w-8 h-8 rounded-xl font-mono font-black text-sm flex items-center justify-center ${
                    item.rank === 1 ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30' :
                    item.rank === 2 ? 'bg-slate-300 text-black' :
                    item.rank === 3 ? 'bg-amber-800 text-white' : 'bg-white/5 text-gray-400'
                  }`}>
                    #{item.rank}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-white">{item.name}</h4>
                    <span className="text-[10px] text-amber-400 font-bold uppercase">{item.badge}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-right">
                  <div className="hidden sm:block">
                    <span className="block text-xs text-gray-400">{item.hits} acertos</span>
                    <span className="block text-[10px] text-gray-500">{item.exactScores} placares exatos</span>
                  </div>
                  <div>
                    <span className="block font-mono text-xl font-black text-amber-400 leading-none">
                      {item.points}
                    </span>
                    <span className="text-[10px] text-gray-500 uppercase font-bold">Pontos</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conteúdo Aba: Badges & Conquistas */}
      {activeTab === 'badges' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {badges.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div
                key={idx}
                className={`rounded-2xl p-6 border transition-all ${
                  b.unlocked
                    ? 'bg-gradient-to-br from-[#141A28] to-[#0D1017] border-amber-500/40 shadow-xl'
                    : 'bg-[#0A0C10] border-white/5 opacity-60'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-2xl ${
                    b.unlocked ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-white/5 text-gray-500'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">{b.title}</h4>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">{b.desc}</p>
                    <span className={`inline-block mt-3 px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      b.unlocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-500'
                    }`}>
                      {b.unlocked ? 'Conquistado ✓' : 'Bloqueado 🔒'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
