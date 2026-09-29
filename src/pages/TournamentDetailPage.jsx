import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trophy, Calendar, MapPin, DollarSign, ArrowLeft, Swords, Users, BarChart3, Award } from 'lucide-react';
import { fetchLeagueById } from '../services/supabase';
import { useApp } from '../context/AppContext';
import { getTeamLogo } from '../utils/teamLogos';

export default function TournamentDetailPage() {
  const { id } = useParams();
  const { finishedSeries, setSelectedSeries } = useApp();
  const [league, setLeague] = useState(null);
  const [activeTab, setActiveTab] = useState('matches'); // 'matches' | 'standings' | 'brackets' | 'stats'

  useEffect(() => {
    fetchLeagueById(id).then(data => {
      if (data) setLeague(data);
      else {
        setLeague({
          id,
          name: `Campeonato #${id}`,
          prize_pool: '$1,000,000',
          tier: 'Tier 1',
          location: 'Arena Oficial'
        });
      }
    });
  }, [id]);

  // Filtra partidas deste torneio
  const matches = (finishedSeries || []).filter(s => 
    String(s.league_id) === String(id) || 
    s.league_name?.toLowerCase().includes('bangkok') ||
    s.tourneyName?.toLowerCase().includes('bangkok')
  );

  return (
    <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      <Link
        to="/campeonatos"
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-amber-400 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar para Campeonatos</span>
      </Link>

      {/* Hero do Campeonato */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#141A28] to-[#0D1017] border border-[#212838] p-6 sm:p-8 mb-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center p-3 shadow-inner">
              <Trophy className="w-10 h-10 text-amber-400" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-500 block mb-1">
                {league?.tier || 'Tier 1'} • {league?.status === 'ongoing' ? 'Em Andamento' : 'Finalizado'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white font-serif uppercase tracking-tight">
                {league?.name || 'Carregando torneio...'}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 mt-2">
                {league?.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-500" />
                    <span>{league.location}</span>
                  </span>
                )}
                {league?.prize_pool && (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold font-mono">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>{league.prize_pool}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Abas do Campeonato: Partidas, Classificação, Chaveamento, Estatísticas */}
      <div className="flex items-center gap-2 border-b border-[#212838] pb-3 mb-6 overflow-x-auto">
        {[
          { id: 'matches', label: 'Partidas', icon: Swords },
          { id: 'standings', label: 'Classificação', icon: Trophy },
          { id: 'brackets', label: 'Chaveamento / Playoffs', icon: Users },
          { id: 'stats', label: 'Estatísticas do Torneio', icon: BarChart3 }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                isActive
                  ? 'bg-amber-500 text-black font-black'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Conteúdo da Aba */}
      {activeTab === 'matches' && (
        <div className="space-y-3">
          {matches.length === 0 ? (
            <div className="bg-[#0C0E14] border border-[#212838] rounded-xl p-8 text-center text-xs text-gray-400">
              Nenhuma partida registrada para este campeonato ainda.
            </div>
          ) : (
            matches.map((s, idx) => (
              <div
                key={s.series_id || idx}
                onClick={() => setSelectedSeries(s)}
                className="bg-[#0C0E14] hover:bg-[#11141E] border border-[#212838] hover:border-amber-500/40 rounded-xl p-4 transition-all cursor-pointer flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-gray-500">{s.stage || 'Playoffs'}</span>
                  <div className="flex items-center gap-2">
                    <img src={getTeamLogo(s.team1_name || s.timeA)} alt="Team A" className="w-6 h-6 object-contain" />
                    <span className="text-xs font-bold text-white">{s.team1_name || s.timeA}</span>
                  </div>
                </div>

                <div className="font-mono font-black text-sm px-3 py-1 bg-black/40 rounded-lg border border-white/10 text-white">
                  {s.score_team1 ?? s.scoreA ?? 0} - {s.score_team2 ?? s.scoreB ?? 0}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{s.team2_name || s.timeB}</span>
                    <img src={getTeamLogo(s.team2_name || s.timeB)} alt="Team B" className="w-6 h-6 object-contain" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'standings' && (
        <div className="bg-[#0C0E14] border border-[#212838] rounded-2xl p-6 shadow-xl">
          <h3 className="text-sm font-black uppercase text-white mb-4">Tabela da Fase de Grupos</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#11141E] text-gray-400 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3">Posição</th>
                  <th className="p-3">Time</th>
                  <th className="p-3 text-center">Vitórias</th>
                  <th className="p-3 text-center">Derrotas</th>
                  <th className="p-3 text-center">Saldo de Mapas</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium text-gray-300">
                <tr className="hover:bg-white/5">
                  <td className="p-3 font-bold text-amber-400">1º</td>
                  <td className="p-3 font-bold text-white flex items-center gap-2">
                    <img src={getTeamLogo('Team Falcons')} alt="Falcons" className="w-5 h-5 object-contain" />
                    Team Falcons
                  </td>
                  <td className="p-3 text-center text-emerald-400 font-bold font-mono">5</td>
                  <td className="p-3 text-center text-red-400 font-bold font-mono">0</td>
                  <td className="p-3 text-center font-mono">+10</td>
                  <td className="p-3 text-right text-emerald-400 font-bold text-[11px]">Upper Bracket</td>
                </tr>
                <tr className="hover:bg-white/5">
                  <td className="p-3 font-bold text-amber-400">2º</td>
                  <td className="p-3 font-bold text-white flex items-center gap-2">
                    <img src={getTeamLogo('Team Liquid')} alt="Liquid" className="w-5 h-5 object-contain" />
                    Team Liquid
                  </td>
                  <td className="p-3 text-center text-emerald-400 font-bold font-mono">4</td>
                  <td className="p-3 text-center text-red-400 font-bold font-mono">1</td>
                  <td className="p-3 text-center font-mono">+6</td>
                  <td className="p-3 text-right text-emerald-400 font-bold text-[11px]">Upper Bracket</td>
                </tr>
                <tr className="hover:bg-white/5">
                  <td className="p-3 font-bold text-gray-400">3º</td>
                  <td className="p-3 font-bold text-white flex items-center gap-2">
                    <img src={getTeamLogo('Gaimin Gladiators')} alt="GG" className="w-5 h-5 object-contain" />
                    Gaimin Gladiators
                  </td>
                  <td className="p-3 text-center text-emerald-400 font-bold font-mono">3</td>
                  <td className="p-3 text-center text-red-400 font-bold font-mono">2</td>
                  <td className="p-3 text-center font-mono">+2</td>
                  <td className="p-3 text-right text-amber-400 font-bold text-[11px]">Lower Bracket</td>
                </tr>
                <tr className="hover:bg-white/5">
                  <td className="p-3 font-bold text-gray-400">4º</td>
                  <td className="p-3 font-bold text-white flex items-center gap-2">
                    <img src={getTeamLogo('Team Spirit')} alt="Spirit" className="w-5 h-5 object-contain" />
                    Team Spirit
                  </td>
                  <td className="p-3 text-center text-emerald-400 font-bold font-mono">2</td>
                  <td className="p-3 text-center text-red-400 font-bold font-mono">3</td>
                  <td className="p-3 text-center font-mono">-1</td>
                  <td className="p-3 text-right text-amber-400 font-bold text-[11px]">Lower Bracket</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'brackets' && (
        <div className="bg-[#0C0E14] border border-[#212838] rounded-2xl p-6 shadow-xl text-center">
          <h3 className="text-sm font-black uppercase text-white mb-6">Playoffs Bracket</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase text-amber-400 border-b border-white/10 pb-2">Semifinais</h4>
              <div className="bg-[#11141E] border border-white/10 rounded-xl p-3">
                <div className="flex justify-between text-xs font-bold text-white mb-1">
                  <span>Team Falcons</span>
                  <span className="text-emerald-400">2</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-gray-400">
                  <span>Gaimin Gladiators</span>
                  <span>0</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase text-amber-400 border-b border-white/10 pb-2">Final Upper</h4>
              <div className="bg-[#11141E] border border-white/10 rounded-xl p-3">
                <div className="flex justify-between text-xs font-bold text-white mb-1">
                  <span>Team Falcons</span>
                  <span className="text-emerald-400">2</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-gray-400">
                  <span>Team Liquid</span>
                  <span>1</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase text-amber-400 border-b border-white/10 pb-2">Grande Final (MD5)</h4>
              <div className="bg-[#11141E] border border-amber-500/40 rounded-xl p-3 shadow-lg">
                <div className="flex justify-between text-xs font-black text-amber-400 mb-1">
                  <span>Team Falcons 🏆</span>
                  <span>3</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-gray-300">
                  <span>Team Liquid</span>
                  <span>2</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0C0E14] border border-[#212838] rounded-xl p-4">
            <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Herói Mais Escolhido</span>
            <div className="text-lg font-black text-white">Luna (28 jogos)</div>
            <span className="text-[11px] text-emerald-400 font-bold">67.9% Winrate</span>
          </div>
          <div className="bg-[#0C0E14] border border-[#212838] rounded-xl p-4">
            <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Herói Mais Banido</span>
            <div className="text-lg font-black text-white">Io (35 bans)</div>
            <span className="text-[11px] text-red-400 font-bold">Prioridade absoluta</span>
          </div>
          <div className="bg-[#0C0E14] border border-[#212838] rounded-xl p-4">
            <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Jogador com Mais Kills</span>
            <div className="text-lg font-black text-white">skiter (14.2 méd.)</div>
            <span className="text-[11px] text-amber-400 font-bold">Team Falcons</span>
          </div>
          <div className="bg-[#0C0E14] border border-[#212838] rounded-xl p-4">
            <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Partida Mais Longa</span>
            <div className="text-lg font-black text-white">57m 30s</div>
            <span className="text-[11px] text-gray-400 font-medium">Liquid vs Spirit</span>
          </div>
        </div>
      )}
    </div>
  );
}
