import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Swords, ArrowLeft, Clock, ExternalLink, Shield, Zap } from 'lucide-react';
import { fetchProMatches, fetchMatchDetails } from '../services/api';
import { getTeamLogo } from '../utils/teamLogos';
import AdvantageGraph from '../components/AdvantageGraph';

export default function MatchDetailPage() {
  const { id } = useParams();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatchDetails(id).then(data => {
      setMatch(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-[1680px] mx-auto px-4 py-12 text-center text-gray-400">
        Carregando detalhes e telemetria da partida #{id}...
      </div>
    );
  }

  const radWin = match?.radiant_win;
  const durationMin = Math.floor((match?.duration || 0) / 60);
  const durationSec = String((match?.duration || 0) % 60).padStart(2, '0');

  return (
    <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      <Link
        to="/partidas"
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-amber-400 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar para Partidas</span>
      </Link>

      {/* Cabeçalho da Partida */}
      <div className="rounded-2xl bg-gradient-to-r from-[#141A28] to-[#0D1017] border border-[#212838] p-6 mb-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Radiant */}
          <div className="flex items-center gap-4 flex-1">
            <img
              src={getTeamLogo(match?.radiant_name || 'Radiant', match?.radiant_logo)}
              alt="Radiant"
              className="w-14 h-14 object-contain"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 text-xs font-bold uppercase">Radiante</span>
                {radWin && <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase">Vencedor</span>}
              </div>
              <h2 className="text-xl font-black text-white">{match?.radiant_name || 'Radiant'}</h2>
            </div>
          </div>

          {/* Placar Central */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-3 font-mono text-3xl font-black px-5 py-2 bg-black/50 rounded-2xl border border-white/10">
              <span className={radWin ? 'text-emerald-400' : 'text-gray-300'}>{match?.radiant_score ?? 0}</span>
              <span className="text-gray-500">:</span>
              <span className={!radWin ? 'text-red-400' : 'text-gray-300'}>{match?.dire_score ?? 0}</span>
            </div>
            <span className="text-xs font-mono text-gray-400 mt-2 font-bold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{durationMin}:{durationSec}</span>
            </span>
          </div>

          {/* Dire */}
          <div className="flex items-center gap-4 flex-1 justify-end text-right">
            <div>
              <div className="flex items-center justify-end gap-2">
                {!radWin && <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-black uppercase">Vencedor</span>}
                <span className="text-red-400 text-xs font-bold uppercase">Dire</span>
              </div>
              <h2 className="text-xl font-black text-white">{match?.dire_name || 'Dire'}</h2>
            </div>
            <img
              src={getTeamLogo(match?.dire_name || 'Dire', match?.dire_logo)}
              alt="Dire"
              className="w-14 h-14 object-contain"
            />
          </div>
        </div>
      </div>

      {/* Gráfico de Vantagem Ouro & XP */}
      {match?.radiant_gold_adv && match.radiant_gold_adv.length > 0 && (
        <div className="mb-8 bg-[#0C0E14] border border-[#212838] rounded-2xl p-6 shadow-xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Vantagem de Ouro ao Longo da Partida</span>
          </h3>
          <AdvantageGraph
            goldAdv={match.radiant_gold_adv}
            xpAdv={match.radiant_xp_adv || []}
            radiantName={match.radiant_name}
            direName={match.dire_name}
          />
        </div>
      )}

      {/* Links Externos */}
      <div className="flex items-center gap-4 text-xs">
        <a
          href={`https://www.opendota.com/matches/${id}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#131722] border border-[#212838] hover:border-amber-500/40 text-gray-300 hover:text-white font-bold transition-all"
        >
          <span>Ver Replay no OpenDota</span>
          <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
        </a>
      </div>
    </div>
  );
}
