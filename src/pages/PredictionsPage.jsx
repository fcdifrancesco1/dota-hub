import React, { useState, useEffect } from 'react';
import {
  Award,
  Trophy,
  Flame,
  CheckCircle2,
  Shield,
  Sparkles,
  Lock,
  Star,
  Clock,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { SITE_CONFIG } from '../config/siteConfig';
import TeamLogo from '../utils/teamLogos';
import { supabase, isSupabaseConfigured } from '../services/supabase';

export default function PredictionsPage() {
  const { upcomingMatches } = useApp();
  const { user } = useAuth();

  // Armazena palpites (persistência local e Supabase)
  const [predictions, setPredictions] = useState(() => {
    try {
      const saved = localStorage.getItem('dotahub_user_predictions');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [activeTab, setActiveTab] = useState('matches'); // 'matches' | 'leaderboard' | 'badges'
  const [rankingFilter, setRankingFilter] = useState('overall'); // 'overall' | 'tournament' | 'monthly'
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem('dotahub_user_predictions', JSON.stringify(predictions));
    } catch (e) {}
  }, [predictions]);

  const handlePredict = async (matchId, teamChosen, score = '2-1') => {
    const newPred = {
      teamChosen,
      score,
      timestamp: Date.now(),
      status: 'pending'
    };

    setPredictions((prev) => ({
      ...prev,
      [matchId]: newPred
    }));

    // Se o Supabase estiver configurado e o usuário logado, salva na nuvem
    if (isSupabaseConfigured && user) {
      try {
        await supabase.from('predictions').upsert({
          user_id: user.id,
          schedule_id: Number(matchId) || null,
          predicted_winner_team_id: null,
          predicted_team1_score: parseInt(score.split('-')[0], 10),
          predicted_team2_score: parseInt(score.split('-')[1], 10),
          status: 'pending'
        });
      } catch (err) {
        console.warn('Erro ao salvar palpite no Supabase:', err);
      }
    }

    setToastMessage(`Palpite registrado: ${teamChosen} (${score})!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Classificação zerada: ainda não há apuração de palpites (os nomes fictícios
  // que existiam aqui foram removidos). Preencher com dados reais quando houver.
  const leaderboardOverall = [];
  const leaderboardTournament = [];
  const leaderboardMonthly = [];

  const currentLeaderboard =
    rankingFilter === 'tournament'
      ? leaderboardTournament
      : rankingFilter === 'monthly'
      ? leaderboardMonthly
      : leaderboardOverall;

  // Conquistas: só "Iniciado" pode ser verificada hoje (há palpite salvo). As
  // demais dependem da apuração dos resultados, que ainda não existe.
  const badges = [
    { title: 'Iniciado em Roshan', desc: 'Fez o primeiro palpite em uma partida oficial', icon: Shield, unlocked: Object.keys(predictions).length > 0 },
    { title: 'Em Chamas', desc: 'Acertou o vencedor de 3 partidas seguidas', icon: Flame, unlocked: false },
    { title: 'Visão do Oráculo', desc: 'Acertou o placar exato de uma série MD3 ou MD5', icon: Sparkles, unlocked: false },
    { title: 'Caçador de Zebras', desc: 'Acertou a vitória de um azarão com menos de 30% dos votos', icon: Star, unlocked: false },
    { title: 'Mestre do Major', desc: 'Palpitou em todos os confrontos dos playoffs', icon: Trophy, unlocked: false }
  ];

  return (
    <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      
      {/* TOAST DE FEEDBACK */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 border border-emerald-500 text-emerald-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce text-xs font-bold">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER DA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-line">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase font-serif tracking-tight flex items-center gap-2.5">
            <Award className="w-7 h-7 text-amber-500" />
            <span>Bolão de Palpites & Conquistas</span>
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            Palpite nos vencedores e placares exatos antes do início dos jogos para subir no ranking e desbloquear medalhas.
          </p>
        </div>

        {/* ABAS */}
        <div className="flex bg-surface-2 p-1 rounded-xl border border-line">
          {[
            { id: 'matches', label: 'Próximos Jogos', icon: Trophy },
            { id: 'leaderboard', label: 'Tabela de Classificação', icon: Award },
            { id: 'badges', label: 'Medalhas & Badges', icon: Sparkles }
          ].map((tab) => (
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

      {/* REGRAS DE PONTUAÇÃO (CENTRALIZADAS NO ARQUIVO DE CONFIGURAÇÃO) */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface border border-line rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 font-black text-sm">
            +{SITE_CONFIG.predictionPoints.correctWinner} pts
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase">Acerto de Vencedor</h4>
            <span className="text-[11px] text-gray-400">Palpitar o time vencedor da série</span>
          </div>
        </div>

        <div className="bg-surface border border-line rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 font-black text-sm">
            +{SITE_CONFIG.predictionPoints.exactScore} pts
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase">Placar Exato</h4>
            <span className="text-[11px] text-gray-400">Acertar os mapas (ex: 2x0 ou 2x1)</span>
          </div>
        </div>

        <div className="bg-surface border border-line rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 font-black text-sm">
            +{SITE_CONFIG.predictionPoints.upsetBonus} pts
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase">Bônus de Zebra</h4>
            <span className="text-[11px] text-gray-400">Apostar no azarão com menos de 30%</span>
          </div>
        </div>
      </div>

      {/* ABA 1: PRÓXIMOS JOGOS PARA PALPITAR */}
      {activeTab === 'matches' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(upcomingMatches || []).slice(0, 9).map((m, idx) => {
            const matchKey = m.id || `match_${idx}`;
            const pred = predictions[matchKey];

            return (
              <div
                key={matchKey}
                className="bg-surface border border-line hover:border-amber-500/40 rounded-2xl p-5 shadow-xl transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-gray-400 pb-3 border-b border-white/5 mb-4">
                    <span className="font-bold text-amber-400 truncate max-w-[200px]">
                      {m.tourneyName || 'Torneio Oficial'}
                    </span>
                    <span className="font-mono text-gray-400 font-bold bg-white/5 px-2 py-0.5 rounded">
                      {m.startTime || 'Em breve'}
                    </span>
                  </div>

                  {/* ESCOLHA DO VENCEDOR */}
                  <div className="flex items-center justify-between gap-4 mb-4">
                    {/* TIME A */}
                    <button
                      onClick={() => handlePredict(matchKey, m.timeA, '2-1')}
                      className={`flex flex-col items-center flex-1 p-3 rounded-xl border transition-all ${
                        pred?.teamChosen === m.timeA
                          ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/10'
                          : 'bg-surface-2 border-white/5 hover:border-white/20 text-gray-300'
                      }`}
                    >
                      <TeamLogo teamName={m.timeA} logoUrl={m.logoA} className="w-10 h-10 mb-2" />
                      <span className="text-xs font-bold leading-tight break-words line-clamp-2 max-w-full text-center">{m.timeA}</span>
                      <span className="text-[10px] text-gray-500 mt-1 uppercase font-semibold">Vencedor</span>
                    </button>

                    <span className="text-xs font-black text-gray-500 uppercase">VS</span>

                    {/* TIME B */}
                    <button
                      onClick={() => handlePredict(matchKey, m.timeB, '1-2')}
                      className={`flex flex-col items-center flex-1 p-3 rounded-xl border transition-all ${
                        pred?.teamChosen === m.timeB
                          ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/10'
                          : 'bg-surface-2 border-white/5 hover:border-white/20 text-gray-300'
                      }`}
                    >
                      <TeamLogo teamName={m.timeB} logoUrl={m.logoB} className="w-10 h-10 mb-2" />
                      <span className="text-xs font-bold leading-tight break-words line-clamp-2 max-w-full text-center">{m.timeB}</span>
                      <span className="text-[10px] text-gray-500 mt-1 uppercase font-semibold">Vencedor</span>
                    </button>
                  </div>

                  {/* SELETOR DE PLACAR EXATO (MD3) */}
                  {pred && (
                    <div className="mb-3 pt-2 border-t border-white/5">
                      <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1.5 text-center">
                        Escolha o Placar Exato da Série (MD3):
                      </span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {['2-0', '2-1', '1-2', '0-2'].map((sc) => (
                          <button
                            key={sc}
                            onClick={() => handlePredict(matchKey, pred.teamChosen, sc)}
                            className={`py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                              pred.score === sc
                                ? 'bg-amber-500 text-black font-black'
                                : 'bg-surface-2 border border-white/10 text-gray-400 hover:text-white'
                            }`}
                          >
                            {sc}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* STATUS DO PALPITE */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  {pred ? (
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Palpite: {pred.teamChosen} ({pred.score})</span>
                    </div>
                  ) : (
                    <span className="text-gray-500 text-[11px]">Selecione um dos times para votar</span>
                  )}
                  <span className="text-gray-500 font-mono text-[10px] flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>Trava no Início</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ABA 2: RANKING E CLASSIFICAÇÃO */}
      {activeTab === 'leaderboard' && (
        <div className="bg-surface border border-line rounded-2xl p-6 sm:p-8 shadow-xl max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
            <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>Quadro de Líderes do Bolão</span>
            </h3>

            {/* SELETOR DE RANKING (GERAL / CAMPEONATO / MENSAL) */}
            <div className="flex bg-surface-2 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setRankingFilter('overall')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  rankingFilter === 'overall' ? 'bg-amber-500 text-black font-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                Geral
              </button>
              <button
                onClick={() => setRankingFilter('tournament')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  rankingFilter === 'tournament' ? 'bg-amber-500 text-black font-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                Por Campeonato
              </button>
              <button
                onClick={() => setRankingFilter('monthly')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  rankingFilter === 'monthly' ? 'bg-amber-500 text-black font-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                Mensal
              </button>
            </div>
          </div>

          {currentLeaderboard.length === 0 && (
            <div className="py-12 text-center">
              <Trophy className="w-10 h-10 text-gray-500 mx-auto mb-3" />
              <p className="text-sm font-bold text-white">Nenhum participante pontuado ainda</p>
              <p className="text-xs text-gray-400 mt-1">
                A classificação aparece aqui conforme os palpites forem sendo apurados.
              </p>
            </div>
          )}

          <div className="divide-y divide-white/5">
            {currentLeaderboard.map((item) => (
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

      {/* ABA 3: BADGES & CONQUISTAS */}
      {activeTab === 'badges' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {badges.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div
                key={idx}
                className={`rounded-2xl p-6 border transition-all ${
                  b.unlocked
                    ? 'bg-gradient-to-br from-surface-2 to-surface border-amber-500/40 shadow-xl'
                    : 'bg-canvas border-white/5 opacity-60'
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
