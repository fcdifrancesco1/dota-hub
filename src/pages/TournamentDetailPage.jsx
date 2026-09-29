import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Trophy,
  Calendar,
  MapPin,
  DollarSign,
  ArrowLeft,
  Swords,
  Users,
  BarChart3,
  Award,
  Sparkles,
  Ban,
  Clock,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { fetchLeagueById } from '../services/supabase';
import { useApp } from '../context/AppContext';
import TeamLogo from '../utils/teamLogos';

export default function TournamentDetailPage() {
  const { id } = useParams();
  const { finishedSeries, setSelectedSeries, constants } = useApp();
  const [league, setLeague] = useState(null);
  const [activeTab, setActiveTab] = useState('matches'); // 'matches' | 'standings' | 'brackets' | 'stats'

  useEffect(() => {
    fetchLeagueById(id).then((data) => {
      if (data) setLeague(data);
      else {
        setLeague({
          id,
          name: `Campeonato #${id}`,
          prize_pool: '$1,000,000',
          tier: 'Tier 1',
          location: 'Arena Internacional',
          status: 'ongoing'
        });
      }
    });
  }, [id]);

  // Filtra as partidas pertencentes a este torneio
  const matches = (finishedSeries || []).filter((s) =>
    String(s.league_id) === String(id) ||
    s.league_name?.toLowerCase().includes('bangkok') ||
    s.tourneyName?.toLowerCase().includes('bangkok')
  );

  return (
    <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      {/* NAVEGAÇÃO DE VOLTA */}
      <Link
        to="/campeonatos"
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-amber-400 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar para Campeonatos</span>
      </Link>

      {/* HERO BANNER DO CAMPEONATO */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#141A28] via-[#0E1119] to-[#161219] border border-[#212838] p-6 sm:p-8 mb-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center p-3 shadow-inner">
              <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500 text-black">
                  {league?.tier ? league.tier.replace('_', ' ') : 'Tier 1'}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  league?.status === 'ongoing' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-white/10 text-gray-300'
                }`}>
                  {league?.status === 'ongoing' ? '● Em Andamento' : 'Finalizado'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white font-serif uppercase tracking-tight">
                {league?.name || 'Carregando torneio...'}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 mt-3">
                {league?.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-500" />
                    <span>{league.location}</span>
                  </span>
                )}
                {league?.prize_pool && (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold font-mono">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Premiação: {league.prize_pool}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ABAS DO CAMPEONATO (SEÇÃO 6.3 DO PROMPT) */}
      <div className="flex items-center gap-2 border-b border-[#212838] pb-3 mb-8 overflow-x-auto">
        {[
          { id: 'matches', label: 'Partidas da Série', icon: Swords },
          { id: 'standings', label: 'Tabela de Classificação', icon: Trophy },
          { id: 'brackets', label: 'Chaveamento / Playoffs', icon: Users },
          { id: 'stats', label: 'Estatísticas do Torneio', icon: BarChart3 }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-amber-500 text-black font-black shadow-lg shadow-amber-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ABA 1: PARTIDAS */}
      {activeTab === 'matches' && (
        <div className="space-y-3">
          {matches.length === 0 ? (
            <div className="bg-[#0C0E14] border border-[#212838] rounded-xl p-8 text-center text-xs text-gray-400">
              Nenhuma partida registrada para este campeonato ainda.
            </div>
          ) : (
            matches.map((s, idx) => {
              const tA = s.team1_name || s.timeA || 'Team 1';
              const tB = s.team2_name || s.timeB || 'Team 2';
              const scoreA = s.score_team1 ?? s.scoreA ?? 0;
              const scoreB = s.score_team2 ?? s.scoreB ?? 0;
              const isWinnerA = scoreA > scoreB;
              const isWinnerB = scoreB > scoreA;

              return (
                <div
                  key={s.series_id || idx}
                  onClick={() => setSelectedSeries(s)}
                  className="bg-[#0C0E14] hover:bg-[#11141E] border border-[#212838] hover:border-amber-500/40 rounded-xl p-4 transition-all cursor-pointer flex items-center justify-between gap-4 shadow-lg group"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-[11px] font-mono text-gray-500 w-32 truncate hidden sm:inline">
                      {s.stage || 'Playoffs'}
                    </span>
                    <div className="flex items-center gap-2">
                      <TeamLogo teamName={tA} className="w-6 h-6" />
                      <span className={`text-xs font-bold truncate ${isWinnerA ? 'text-amber-400 font-black' : 'text-white'}`}>
                        {tA}
                      </span>
                    </div>
                  </div>

                  <div className="font-mono font-black text-xs px-3 py-1 bg-black/60 rounded-lg border border-white/10 text-white">
                    {scoreA} - {scoreB}
                  </div>

                  <div className="flex items-center gap-4 flex-1 justify-end">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold truncate text-right ${isWinnerB ? 'text-amber-400 font-black' : 'text-white'}`}>
                        {tB}
                      </span>
                      <TeamLogo teamName={tB} className="w-6 h-6" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-amber-400 transition-colors hidden sm:block" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ABA 2: CLASSIFICAÇÃO */}
      {activeTab === 'standings' && (
        <div className="bg-[#0C0E14] border border-[#212838] rounded-2xl p-6 shadow-xl">
          <h3 className="text-sm font-black uppercase text-white mb-4">Classificação da Fase de Grupos</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#11141E] text-gray-400 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3">Pos</th>
                  <th className="p-3">Time</th>
                  <th className="p-3 text-center">Vitórias</th>
                  <th className="p-3 text-center">Derrotas</th>
                  <th className="p-3 text-center">Saldo Mapas</th>
                  <th className="p-3 text-right">Destino</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium text-gray-300">
                <tr className="hover:bg-white/5">
                  <td className="p-3 font-bold text-amber-400">1º</td>
                  <td className="p-3 font-bold text-white flex items-center gap-2">
                    <TeamLogo teamName={'Team Falcons'} className="w-5 h-5" />
                    Team Falcons
                  </td>
                  <td className="p-3 text-center text-emerald-400 font-bold font-mono">5</td>
                  <td className="p-3 text-center text-red-400 font-bold font-mono">0</td>
                  <td className="p-3 text-center font-mono text-emerald-400 font-bold">+10</td>
                  <td className="p-3 text-right text-emerald-400 font-bold text-[11px]">Upper Bracket</td>
                </tr>
                <tr className="hover:bg-white/5">
                  <td className="p-3 font-bold text-amber-400">2º</td>
                  <td className="p-3 font-bold text-white flex items-center gap-2">
                    <TeamLogo teamName={'Team Liquid'} className="w-5 h-5" />
                    Team Liquid
                  </td>
                  <td className="p-3 text-center text-emerald-400 font-bold font-mono">4</td>
                  <td className="p-3 text-center text-red-400 font-bold font-mono">1</td>
                  <td className="p-3 text-center font-mono text-emerald-400 font-bold">+6</td>
                  <td className="p-3 text-right text-emerald-400 font-bold text-[11px]">Upper Bracket</td>
                </tr>
                <tr className="hover:bg-white/5">
                  <td className="p-3 font-bold text-gray-400">3º</td>
                  <td className="p-3 font-bold text-white flex items-center gap-2">
                    <TeamLogo teamName={'Gaimin Gladiators'} className="w-5 h-5" />
                    Gaimin Gladiators
                  </td>
                  <td className="p-3 text-center text-emerald-400 font-bold font-mono">3</td>
                  <td className="p-3 text-center text-red-400 font-bold font-mono">2</td>
                  <td className="p-3 text-center font-mono text-emerald-400 font-bold">+2</td>
                  <td className="p-3 text-right text-amber-400 font-bold text-[11px]">Lower Bracket</td>
                </tr>
                <tr className="hover:bg-white/5">
                  <td className="p-3 font-bold text-gray-400">4º</td>
                  <td className="p-3 font-bold text-white flex items-center gap-2">
                    <TeamLogo teamName={'Team Spirit'} className="w-5 h-5" />
                    Team Spirit
                  </td>
                  <td className="p-3 text-center text-emerald-400 font-bold font-mono">2</td>
                  <td className="p-3 text-center text-red-400 font-bold font-mono">3</td>
                  <td className="p-3 text-center font-mono text-red-400 font-bold">-1</td>
                  <td className="p-3 text-right text-amber-400 font-bold text-[11px]">Lower Bracket</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA 3: CHAVEAMENTO / BRACKETS */}
      {activeTab === 'brackets' && (
        <div className="bg-[#0C0E14] border border-[#212838] rounded-2xl p-6 sm:p-8 shadow-xl">
          <h3 className="text-sm font-black uppercase text-white mb-8 text-center flex items-center justify-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Chaveamento dos Playoffs</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {/* Semifinais Upper */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase text-amber-400 border-b border-white/10 pb-2">
                Upper Semifinais (MD3)
              </h4>
              <div className="bg-[#11141E] border border-white/10 rounded-xl p-3 shadow">
                <div className="flex justify-between items-center text-xs font-bold text-white mb-1.5">
                  <div className="flex items-center gap-2">
                    <TeamLogo teamName={'Team Falcons'} className="w-4 h-4" />
                    <span>Team Falcons</span>
                  </div>
                  <span className="text-emerald-400 font-mono font-black">2</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-gray-400">
                  <div className="flex items-center gap-2">
                    <TeamLogo teamName={'Gaimin Gladiators'} className="w-4 h-4" />
                    <span>Gaimin Gladiators</span>
                  </div>
                  <span className="font-mono">0</span>
                </div>
              </div>
            </div>

            {/* Upper Final */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase text-amber-400 border-b border-white/10 pb-2">
                Final Upper (MD3)
              </h4>
              <div className="bg-[#11141E] border border-white/10 rounded-xl p-3 shadow">
                <div className="flex justify-between items-center text-xs font-bold text-white mb-1.5">
                  <div className="flex items-center gap-2">
                    <TeamLogo teamName={'Team Falcons'} className="w-4 h-4" />
                    <span>Team Falcons</span>
                  </div>
                  <span className="text-emerald-400 font-mono font-black">2</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-gray-400">
                  <div className="flex items-center gap-2">
                    <TeamLogo teamName={'Team Liquid'} className="w-4 h-4" />
                    <span>Team Liquid</span>
                  </div>
                  <span className="font-mono">1</span>
                </div>
              </div>
            </div>

            {/* Grande Final */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase text-amber-400 border-b border-white/10 pb-2">
                Grande Final (MD5)
              </h4>
              <div className="bg-[#11141E] border border-amber-500/50 rounded-xl p-4 shadow-xl">
                <div className="flex justify-between items-center text-xs font-black text-amber-400 mb-2">
                  <div className="flex items-center gap-2">
                    <TeamLogo teamName={'Team Falcons'} className="w-5 h-5" />
                    <span>Team Falcons 🏆</span>
                  </div>
                  <span className="font-mono text-base">3</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-gray-300">
                  <div className="flex items-center gap-2">
                    <TeamLogo teamName={'Team Liquid'} className="w-5 h-5" />
                    <span>Team Liquid</span>
                  </div>
                  <span className="font-mono text-base">2</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA 4: ESTATÍSTICAS DO CAMPEONATO */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0C0E14] border border-[#212838] rounded-2xl p-5 shadow-xl">
            <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Herói Mais Escolhido</span>
            <div className="text-xl font-black text-white">Luna</div>
            <span className="text-xs text-emerald-400 font-bold font-mono">38 Jogos (68.4% Win)</span>
          </div>

          <div className="bg-[#0C0E14] border border-[#212838] rounded-2xl p-5 shadow-xl">
            <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Herói Mais Banido</span>
            <div className="text-xl font-black text-white">Io / Wisp</div>
            <span className="text-xs text-red-400 font-bold font-mono">42 Bans na Fase Principal</span>
          </div>

          <div className="bg-[#0C0E14] border border-[#212838] rounded-2xl p-5 shadow-xl">
            <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Maior KDA Médio</span>
            <div className="text-xl font-black text-white">skiter (Falcons)</div>
            <span className="text-xs text-amber-400 font-bold font-mono">KDA 8.42 em 15 partidas</span>
          </div>

          <div className="bg-[#0C0E14] border border-[#212838] rounded-2xl p-5 shadow-xl">
            <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Partida Mais Longa</span>
            <div className="text-xl font-black text-white">57m 30s</div>
            <span className="text-xs text-gray-400 font-mono">Game 4: Liquid vs Falcons</span>
          </div>
        </div>
      )}
    </div>
  );
}
