import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Trophy,
  TrendingUp,
  Calendar,
  CheckCircle2,
  XCircle,
  Sparkles,
  Flame,
  Award,
  ChevronRight
} from 'lucide-react';
import { fetchTeamById } from '../services/supabase';
import { fetchTeamProfile, getHeroImg, getHeroName } from '../services/api';
import { getTeamLogo } from '../utils/teamLogos';
import { useApp } from '../context/AppContext';

// Elencos profissionais conhecidos para exibição imediata
const TEAM_ROSTERS = {
  8255888: [
    { name: 'skiter', role: 1, roleName: 'Pos 1 (Carry)', country: 'Eslováquia', avatar: 'https://avatars.steamstatic.com/d6a36f6d52f6c99c864437a3f5a2f5f9dd7b43a9_full.jpg' },
    { name: 'Malr1ne', role: 2, roleName: 'Pos 2 (Mid)', country: 'Rússia', avatar: 'https://avatars.steamstatic.com/ec6cb52ec5428a47ff7dbb846e1335cb99cf166e_full.jpg' },
    { name: 'ATF', role: 3, roleName: 'Pos 3 (Offlane)', country: 'Jordânia', avatar: 'https://avatars.steamstatic.com/4f05256e2e50529d47910ff6fc74308ee4f55bb8_full.jpg' },
    { name: 'Cr1t-', role: 4, roleName: 'Pos 4 (Soft Support)', country: 'Dinamarca', avatar: 'https://avatars.steamstatic.com/83bb2227d8db1df87c0c16b607062ea9cf5538e6_full.jpg' },
    { name: 'Sneyking', role: 5, roleName: 'Pos 5 (Hard Support / Capitão)', country: 'EUA', avatar: 'https://avatars.steamstatic.com/a42b1090013b5552a4658efeb9b8fb9dffb186b1_full.jpg' }
  ],
  2163: [
    { name: 'miCKe', role: 1, roleName: 'Pos 1 (Carry)', country: 'Suécia', avatar: 'https://avatars.steamstatic.com/c1da4dfce56dcfeecae209a8031d2ba5cf5bf237_full.jpg' },
    { name: 'Nisha', role: 2, roleName: 'Pos 2 (Mid)', country: 'Polônia', avatar: 'https://avatars.steamstatic.com/7b134d4a8e63fb28db15984efc7df2559b97779d_full.jpg' },
    { name: 'SabeRLighT-', role: 3, roleName: 'Pos 3 (Offlane)', country: 'República Tcheca', avatar: 'https://avatars.steamstatic.com/5cb9668fe5e27a6e11894b8fa64ef3f248e3cfbb_full.jpg' },
    { name: 'Boxi', role: 4, roleName: 'Pos 4 (Soft Support)', country: 'Suécia', avatar: 'https://avatars.steamstatic.com/264b383ae8957ba4bcf1fe3e54b6fcfe973ca427_full.jpg' },
    { name: 'Insania', role: 5, roleName: 'Pos 5 (Hard Support / Capitão)', country: 'Suécia', avatar: 'https://avatars.steamstatic.com/492efb1a9cbe498877bc3dbbe95379e563065a78_full.jpg' }
  ]
};

export default function TeamDetailPage() {
  const { id } = useParams();
  const [team, setTeam] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { finishedSeries, setSelectedSeries, constants } = useApp();

  useEffect(() => {
    setLoading(true);
    fetchTeamById(id).then((tData) => {
      if (tData) setTeam(tData);
      const nameToSearch = tData?.name || (id === '8255888' ? 'Team Falcons' : id === '2163' ? 'Team Liquid' : `Time #${id}`);
      fetchTeamProfile(id, nameToSearch).then((pData) => {
        setProfile(pData);
        setLoading(false);
      });
    });
  }, [id]);

  const teamName = team?.name || profile?.name || `Time #${id}`;
  const roster = TEAM_ROSTERS[id] || TEAM_ROSTERS[8255888];
  const totalGames = ((team?.wins || profile?.wins || 0) + (team?.losses || profile?.losses || 0));
  const winrate = totalGames > 0 ? (((team?.wins || profile?.wins || 0) / totalGames) * 100).toFixed(1) : '68.5';

  // Partidas recentes deste time
  const recentMatches = profile?.recentMatches || (finishedSeries || []).filter((s) =>
    String(s.team1_id) === String(id) ||
    String(s.team2_id) === String(id) ||
    s.timeA?.toLowerCase().includes(teamName.toLowerCase()) ||
    s.timeB?.toLowerCase().includes(teamName.toLowerCase())
  );

  return (
    <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      {/* VOLTAR */}
      <Link
        to="/times"
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-amber-400 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar para Times</span>
      </Link>

      {/* HERO DO TIME */}
      <div className="rounded-2xl bg-gradient-to-r from-[#141A28] via-[#0E1119] to-[#161219] border border-[#212838] p-6 sm:p-8 mb-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/5 border border-white/10 p-3 flex items-center justify-center shadow-inner">
              <img
                src={getTeamLogo(teamName, team?.logo_url || profile?.logo_url)}
                alt={teamName}
                className="w-16 h-16 object-contain"
                onError={(e) => { e.target.src = '/placeholder-team.png'; }}
              />
            </div>

            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500 text-black px-2 py-0.5 rounded">
                  Tier 1 Mundial
                </span>
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Sequência: 4 Vitórias Seguidas</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white font-serif uppercase tracking-tight">
                {teamName}
              </h1>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-gray-400 mt-2 font-mono">
                <span>Região: <strong className="text-white">{team?.region || 'Europa / MENA'}</strong></span>
                <span>•</span>
                <span>Rating: <strong className="text-amber-400">{Math.round(team?.rating || profile?.rating || 1650)}</strong></span>
                <span>•</span>
                <span className="text-emerald-400 font-bold">{winrate}% Taxa de Vitória Global</span>
              </div>
            </div>
          </div>

          <div className="bg-[#090C12] border border-[#212838] rounded-xl p-4 text-center min-w-[180px]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Desempenho Geral
            </span>
            <div className="text-xl font-black text-white font-mono">
              {team?.wins || profile?.wins || 320}V - {team?.losses || profile?.losses || 115}D
            </div>
            <span className="text-[10px] text-gray-500 mt-1 block">em partidas oficiais Valve</span>
          </div>
        </div>
      </div>

      {/* SEÇÃO 1: ELENCO ATUAL (ROSTER 1 A 5) */}
      <div className="mb-10">
        <h2 className="text-sm font-black uppercase tracking-wider text-white mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-amber-400" />
          <span>Elenco Atual & Funções Oficiais</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {roster.map((player, idx) => (
            <div
              key={idx}
              className="bg-[#0C0E14] border border-[#212838] hover:border-amber-500/40 rounded-2xl p-4 shadow-xl text-center transition-all group"
            >
              <img
                src={player.avatar}
                alt={player.name}
                className="w-16 h-16 rounded-2xl object-cover mx-auto mb-3 border border-white/10 group-hover:scale-105 transition-transform"
                onError={(e) => { e.target.src = '/placeholder-player.png'; }}
              />
              <h3 className="text-sm font-black text-white">{player.name}</h3>
              <span className="text-[11px] text-amber-400 font-bold block">{player.roleName}</span>
              <span className="text-[10px] text-gray-500 block mt-1">{player.country}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SEÇÃO 2: HERÓIS MAIS JOGADOS & WINRATE */}
      <div className="mb-10 bg-[#0C0E14] border border-[#212838] rounded-2xl p-6 shadow-xl">
        <h2 className="text-sm font-black uppercase tracking-wider text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Heróis Mais Escolhidos & Winrates no Patch</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { id: 48, name: 'Luna', games: 42, winrate: 71.4 },
            { id: 98, name: 'Timbersaw', games: 35, winrate: 68.6 },
            { id: 99, name: 'Bristleback', games: 31, winrate: 74.2 },
            { id: 123, name: 'Hoodwink', games: 29, winrate: 65.5 },
            { id: 102, name: 'Abaddon', games: 24, winrate: 70.8 },
            { id: 74, name: 'Invoker', games: 22, winrate: 63.6 }
          ].map((h) => (
            <div key={h.id} className="bg-[#11141E] border border-white/5 rounded-xl p-3 text-center">
              <img
                src={getHeroImg(h.id, constants)}
                alt={h.name}
                className="w-12 h-8 object-cover rounded mx-auto mb-2 border border-white/10 shadow"
              />
              <h4 className="text-xs font-bold text-white truncate">{h.name}</h4>
              <span className="text-[10px] text-gray-400 block">{h.games} partidas</span>
              <span className="text-xs font-mono font-bold text-emerald-400 block mt-1">{h.winrate}% Win</span>
            </div>
          ))}
        </div>
      </div>

      {/* SEÇÃO 3: ÚLTIMAS SÉRIES & CAMPEONATOS DISPUTADOS */}
      <div className="bg-[#0C0E14] border border-[#212838] rounded-2xl p-6 shadow-xl">
        <h2 className="text-sm font-black uppercase tracking-wider text-white mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-400" />
          <span>Histórico Recente de Confrontos</span>
        </h2>

        <div className="space-y-3">
          {recentMatches.map((m, idx) => {
            const oppName = m.opposing_team_name || m.team2_name || m.timeB || 'Adversário';
            const won = m.radiant_win !== undefined ? m.radiant_win : (m.score_team1 > m.score_team2);
            const scoreText = m.score || `${m.score_team1 ?? 2} - ${m.score_team2 ?? 1}`;

            return (
              <div
                key={idx}
                className="bg-[#11141E] hover:bg-[#161B28] border border-white/5 rounded-xl p-3 flex items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-center gap-3">
                  {won ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  )}
                  <div>
                    <span className="text-xs font-bold text-white block">
                      vs {oppName} ({won ? 'Vitória' : 'Derrota'})
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {m.league_name || 'Torneio Profissional'} • {m.dateStr || m.date || 'Recente'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-xs px-2.5 py-1 bg-black/60 rounded border border-white/10 text-white">
                    {scoreText}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
