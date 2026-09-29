import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, Trophy, TrendingUp, Calendar } from 'lucide-react';
import { fetchTeamById } from '../services/supabase';
import { getTeamLogo } from '../utils/teamLogos';
import { useApp } from '../context/AppContext';

export default function TeamDetailPage() {
  const { id } = useParams();
  const [team, setTeam] = useState(null);
  const { finishedSeries, setSelectedSeries } = useApp();

  useEffect(() => {
    fetchTeamById(id).then(data => {
      if (data) setTeam(data);
      else {
        setTeam({
          id,
          name: `Time #${id}`,
          rating: 1600,
          wins: 300,
          losses: 120,
          region: 'Europa Ocidental'
        });
      }
    });
  }, [id]);

  const teamMatches = (finishedSeries || []).filter(s =>
    String(s.team1_id) === String(id) ||
    String(s.team2_id) === String(id) ||
    (team && s.timeA?.toLowerCase().includes(team.name.toLowerCase())) ||
    (team && s.timeB?.toLowerCase().includes(team.name.toLowerCase()))
  );

  return (
    <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      <Link
        to="/times"
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-amber-400 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar para Times</span>
      </Link>

      {/* Hero do Time */}
      <div className="rounded-2xl bg-gradient-to-r from-[#141A28] to-[#0D1017] border border-[#212838] p-6 sm:p-8 mb-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 p-3 flex items-center justify-center">
            <img
              src={getTeamLogo(team?.name || 'Team', team?.logo_url)}
              alt={team?.name}
              className="w-14 h-14 object-contain"
              onError={(e) => { e.target.src = '/placeholder-team.png'; }}
            />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase text-amber-500 tracking-wider">
              {team?.region || 'Tier 1 Internacional'}
            </span>
            <h1 className="text-3xl font-black text-white font-serif uppercase tracking-tight">
              {team?.name || 'Carregando time...'}
            </h1>
            <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
              <span>{team?.wins || 0} Vitórias / {team?.losses || 0} Derrotas</span>
              <span className="text-amber-400 font-bold font-mono">Rating: {Math.round(team?.rating || 1500)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Histórico Recente de Séries */}
      <div className="bg-[#0C0E14] border border-[#212838] rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-black uppercase text-white mb-4">Últimas Partidas Disputadas</h3>
        <div className="space-y-3">
          {teamMatches.length === 0 ? (
            <div className="text-center py-6 text-gray-500 text-xs">
              Nenhuma partida recente registrada para este time no cache local.
            </div>
          ) : (
            teamMatches.map((s, idx) => (
              <div
                key={s.series_id || idx}
                onClick={() => setSelectedSeries(s)}
                className="bg-[#11141E] hover:bg-[#161B28] border border-[#1C2232] rounded-xl p-3 flex items-center justify-between gap-4 cursor-pointer transition-all"
              >
                <span className="text-xs text-gray-400 truncate max-w-[200px]">
                  {s.league_name || s.tourneyName || 'Torneio'}
                </span>
                <span className="text-xs font-black text-white">
                  {s.score_team1 ?? s.scoreA ?? 0} - {s.score_team2 ?? s.scoreB ?? 0}
                </span>
                <span className="text-xs font-bold text-amber-400 hover:underline">
                  Ver Replay →
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
