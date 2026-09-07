import React, { useState, useEffect } from 'react';
import { X, Shield, Trophy, TrendingUp, Swords, Loader2, Sparkles, Calendar, Award } from 'lucide-react';
import { fetchTeamProfile, getHeroImg, getHeroName } from '../services/api';

export default function TeamProfileModal({
  teamId,
  teamName = "Time",
  constants,
  onClose
}) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (teamId || teamName) {
      setLoading(true);
      fetchTeamProfile(teamId, teamName).then((data) => {
        setProfile(data);
        setLoading(false);
      });
    }
  }, [teamId, teamName]);

  // Fechar com a tecla ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!teamId && !teamName) return null;

  const displayName = profile?.name || teamName || "Equipe Profissional";
  const displayTag = profile?.tag || (displayName.length <= 4 ? displayName.toUpperCase() : "");

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-[#0C0F16] border border-white/15 rounded-2xl p-6 shadow-2xl overflow-hidden my-auto"
      >
        {/* BOTÃO FECHAR */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-all z-20 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            <span className="text-xs font-semibold">Carregando dados da equipe ({displayName})...</span>
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* CABEÇALHO DO TIME */}
            <div className="flex items-center gap-4 border-b border-white/10 pb-5">
              {profile.logo_url ? (
                <img
                  src={profile.logo_url}
                  alt={displayName}
                  className="w-16 h-16 object-contain rounded-xl bg-white/5 p-1 border border-white/10 shrink-0"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
                  <Shield className="w-8 h-8 text-amber-400" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
                  <Trophy className="w-3.5 h-3.5" /> Equipe Profissional {displayTag && <span className="text-gray-400 font-mono">[{displayTag}]</span>}
                </div>
                <h2 className="text-2xl font-black text-white mt-0.5 truncate">{displayName}</h2>
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 mt-1.5 font-mono">
                  <span>Rating Elo: <strong className="text-cyan-400 font-black">{Math.round(profile.rating || 1300)}</strong></span>
                  <span>Win Rate Recente: <strong className="text-emerald-400 font-black">{profile.recentWinRate}%</strong></span>
                  {(profile.wins !== undefined && profile.losses !== undefined) && (
                    <span className="text-gray-500 text-[11px]">
                      ({profile.wins}V - {profile.losses}D)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* HERÓIS ASSINATURA DO TIME */}
            {profile.topHeroes && profile.topHeroes.length > 0 && (
              <div className="space-y-2.5">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Heróis Mais Jogados Pela Equipe
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {profile.topHeroes.map((h, i) => {
                    const heroImg = getHeroImg(constants, h.hero_id);
                    const heroName = getHeroName(constants, h.hero_id);
                    const winRate = h.games_played > 0 ? ((h.wins / h.games_played) * 100).toFixed(0) : 0;

                    return (
                      <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex flex-col items-center text-center hover:border-amber-400/40 transition-colors">
                        <img src={heroImg} alt={heroName} className="w-10 h-6 object-cover rounded mb-1.5 shadow-sm" />
                        <span className="text-[11px] font-bold text-white truncate w-full">{heroName}</span>
                        <div className="text-[10px] font-mono text-gray-400 mt-1">
                          <span className="text-emerald-400 font-bold">{winRate}% WR</span>
                          <span className="block text-[9px] text-gray-500">({h.games_played} jogos)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* HISTÓRICO DAS ÚLTIMAS PARTIDAS */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Histórico de Partidas Oficiais
              </h3>
              <div className="divide-y divide-white/5 bg-white/5 border border-white/10 rounded-xl overflow-hidden max-h-52 overflow-y-auto custom-scrollbar">
                {(profile.recentMatches || []).slice(0, 10).map((m, idx) => {
                  const won = (m.radiant && m.radiant_win) || (!m.radiant && !m.radiant_win);
                  const opponentName = m.opposing_team_name || "Adversário Competitivo";

                  return (
                    <div key={idx} className="p-2.5 px-4 flex items-center justify-between text-xs hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${won ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                          {won ? 'VITÓRIA' : 'DERROTA'}
                        </span>
                        <span className="text-gray-300 font-medium">vs <strong className="text-white">{opponentName}</strong></span>
                      </div>
                      <span className="text-gray-500 text-[10px] font-mono truncate max-w-[160px]">{m.league_name || "Torneio Dota 2"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400 text-xs">
            Informações do time não encontradas.
          </div>
        )}
      </div>
    </div>
  );
}
