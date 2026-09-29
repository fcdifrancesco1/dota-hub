import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Swords,
  ArrowLeft,
  Clock,
  ExternalLink,
  Shield,
  Zap,
  CheckCircle2,
  Tv,
  Sparkles,
  Ban
} from 'lucide-react';
import { fetchMatchDetails, getHeroImg, getHeroName, getItemImg } from '../services/api';
import TeamLogo from '../utils/teamLogos';
import AdvantageGraph from '../components/AdvantageGraph';
import { useApp } from '../context/AppContext';

export default function MatchDetailPage() {
  const { id } = useParams();
  const { constants, setSelectedHero, setSelectedTeam } = useApp();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchMatchDetails(id)
      .then((data) => {
        setMatch(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-[1680px] mx-auto px-4 py-16 text-center text-gray-400">
        <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs uppercase tracking-wider font-bold">Carregando telemetria e draft da partida #{id}...</p>
      </div>
    );
  }

  const radWin = match?.radiant_win;
  const durationMin = Math.floor((match?.duration || 0) / 60);
  const durationSec = String((match?.duration || 0) % 60).padStart(2, '0');

  // Jogadores separados por lado
  const players = match?.players || [];
  const radiantPlayers = players.filter((p) => p.isRadiant !== false && (p.player_slot < 128));
  const direPlayers = players.filter((p) => p.isRadiant === false || (p.player_slot >= 128));

  // Picks e Bans
  const picksBans = match?.picks_bans || [];

  return (
    <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      {/* VOLTAR */}
      <Link
        to="/partidas"
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-amber-400 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar para Partidas</span>
      </Link>

      {/* HEADER DA PARTIDA COM PLACAR E VENCEDOR */}
      <div className="rounded-2xl bg-gradient-to-r from-[#141A28] via-[#0E1119] to-[#181116] border border-[#212838] p-6 sm:p-8 mb-8 shadow-2xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* RADIANT */}
          <div className="flex items-center gap-4 flex-1">
            <TeamLogo teamName={match?.radiant_name || 'Radiant'} logoUrl={match?.radiant_logo} className="w-16 h-16" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Radiante</span>
                {radWin && (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase border border-emerald-500/40">
                    Vencedor ✓
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">{match?.radiant_name || 'Radiant'}</h2>
            </div>
          </div>

          {/* PLACAR CENTRAL */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-3 font-mono text-3xl sm:text-4xl font-black px-6 py-2 bg-black/60 rounded-2xl border border-white/10 shadow-inner">
              <span className={radWin ? 'text-emerald-400' : 'text-gray-300'}>{match?.radiant_score ?? 0}</span>
              <span className="text-gray-500">:</span>
              <span className={!radWin ? 'text-red-400' : 'text-gray-300'}>{match?.dire_score ?? 0}</span>
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs font-mono text-gray-400 font-bold">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{durationMin}:{durationSec}</span>
              </span>
              <span>•</span>
              <span className="text-amber-400">Match ID: {id}</span>
            </div>
          </div>

          {/* DIRE */}
          <div className="flex items-center gap-4 flex-1 justify-end text-right">
            <div>
              <div className="flex items-center justify-end gap-2 mb-1">
                {!radWin && (
                  <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-black uppercase border border-red-500/40">
                    Vencedor ✓
                  </span>
                )}
                <span className="text-red-400 text-xs font-bold uppercase tracking-wider">Dire</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">{match?.dire_name || 'Dire'}</h2>
            </div>
            <TeamLogo teamName={match?.dire_name || 'Dire'} logoUrl={match?.dire_logo} className="w-16 h-16" />
          </div>
        </div>
      </div>

      {/* DRAFT COMPLETO (PICKS E BANS NA ORDEM OFICIAL - SEÇÃO 6.4) */}
      {picksBans.length > 0 && (
        <div className="mb-8 bg-[#0C0E14] border border-[#212838] rounded-2xl p-6 shadow-xl">
          <h3 className="text-xs font-black uppercase tracking-wider text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Fase de Draft (Picks & Bans Oficiais)</span>
          </h3>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
            {picksBans.map((pb, idx) => {
              const isPick = pb.is_pick;
              const isRad = pb.team === 0;
              const heroName = getHeroName(pb.hero_id, constants);

              return (
                <div
                  key={idx}
                  className={`flex-shrink-0 flex flex-col items-center p-2 rounded-xl border ${
                    isPick
                      ? isRad
                        ? 'bg-emerald-950/20 border-emerald-500/40'
                        : 'bg-red-950/20 border-red-500/40'
                      : 'bg-black/40 border-white/10 opacity-70'
                  }`}
                >
                  <span className={`text-[9px] font-black uppercase mb-1 ${
                    isPick ? (isRad ? 'text-emerald-400' : 'text-red-400') : 'text-gray-500'
                  }`}>
                    {isPick ? 'Pick' : 'Ban'} #{idx + 1}
                  </span>

                  <div className="relative">
                    <img
                      src={getHeroImg(pb.hero_id, constants)}
                      alt={heroName}
                      title={heroName}
                      className="w-10 h-7 object-cover rounded shadow"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    {!isPick && (
                      <div className="absolute inset-0 bg-red-950/70 flex items-center justify-center rounded">
                        <Ban className="w-4 h-4 text-red-400" />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-300 font-bold truncate max-w-[55px] mt-1">
                    {heroName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* GRÁFICO DE VANTAGEM DE OURO E XP */}
      {match?.radiant_gold_adv && match.radiant_gold_adv.length > 0 && (
        <div className="mb-8 bg-[#0C0E14] border border-[#212838] rounded-2xl p-6 shadow-xl">
          <h3 className="text-xs font-black uppercase tracking-wider text-white mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Vantagem de Ouro e Experiência ao Longo do Jogo</span>
          </h3>
          <AdvantageGraph
            goldAdv={match.radiant_gold_adv}
            xpAdv={match.radiant_xp_adv || []}
            radiantName={match.radiant_name}
            direName={match.dire_name}
          />
        </div>
      )}

      {/* TABELAS DE JOGADORES (RADIANTE E DIRE) */}
      <div className="space-y-8 mb-8">
        {/* TABELA RADIANTE */}
        <div className="bg-[#0C0E14] border border-emerald-900/30 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-emerald-950/20 border-b border-emerald-900/30 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase text-emerald-400 flex items-center gap-2">
              <span>Time Radiante</span>
              {radWin && <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded font-black">Vitória</span>}
            </h3>
            <span className="text-xs font-mono text-gray-400">Total Kills: {match?.radiant_score ?? 0}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium">
              <thead className="bg-[#11141E] text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Herói / Jogador</th>
                  <th className="p-3 text-center">K / D / A</th>
                  <th className="p-3 text-center">Net Worth</th>
                  <th className="p-3 text-center">LH / DN</th>
                  <th className="p-3 text-center">GPM / XPM</th>
                  <th className="p-3 text-center">Dano em Heróis</th>
                  <th className="p-3 text-center">Dano em Torres</th>
                  <th className="p-3">Itens Finais</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300">
                {radiantPlayers.map((p, idx) => (
                  <tr key={idx} className="hover:bg-white/5">
                    <td className="p-3 flex items-center gap-3">
                      <img
                        src={getHeroImg(p.hero_id, constants)}
                        alt={getHeroName(p.hero_id, constants)}
                        className="w-10 h-7 object-cover rounded shadow"
                      />
                      <div>
                        <span className="text-xs font-bold text-white block">{p.personaname || p.name || `Jogador ${idx + 1}`}</span>
                        <span className="text-[10px] text-gray-400">{getHeroName(p.hero_id, constants)}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center font-mono font-bold">
                      <span className="text-emerald-400">{p.kills ?? 0}</span> /{' '}
                      <span className="text-red-400">{p.deaths ?? 0}</span> /{' '}
                      <span className="text-gray-400">{p.assists ?? 0}</span>
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-amber-400">
                      {(p.net_worth || 0).toLocaleString('pt-BR')}
                    </td>
                    <td className="p-3 text-center font-mono text-gray-400">
                      {p.last_hits ?? 0} / {p.denies ?? 0}
                    </td>
                    <td className="p-3 text-center font-mono text-gray-300">
                      {p.gold_per_min || p.gpm || 0} / {p.xp_per_min || p.xpm || 0}
                    </td>
                    <td className="p-3 text-center font-mono text-gray-300">
                      {(p.hero_damage || 0).toLocaleString('pt-BR')}
                    </td>
                    <td className="p-3 text-center font-mono text-gray-300">
                      {(p.tower_damage || 0).toLocaleString('pt-BR')}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        {[p.item_0, p.item_1, p.item_2, p.item_3, p.item_4, p.item_5].map((it, iIdx) => (
                          <div key={iIdx} className="w-6 h-5 rounded bg-black/60 border border-white/10 overflow-hidden">
                            {it > 0 && (
                              <img
                                src={getItemImg(it, constants)}
                                alt="Item"
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* TABELA DIRE */}
        <div className="bg-[#0C0E14] border border-red-900/30 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-red-950/20 border-b border-red-900/30 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase text-red-400 flex items-center gap-2">
              <span>Time Dire</span>
              {!radWin && <span className="text-[10px] bg-red-500/20 px-2 py-0.5 rounded font-black">Vitória</span>}
            </h3>
            <span className="text-xs font-mono text-gray-400">Total Kills: {match?.dire_score ?? 0}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium">
              <thead className="bg-[#11141E] text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Herói / Jogador</th>
                  <th className="p-3 text-center">K / D / A</th>
                  <th className="p-3 text-center">Net Worth</th>
                  <th className="p-3 text-center">LH / DN</th>
                  <th className="p-3 text-center">GPM / XPM</th>
                  <th className="p-3 text-center">Dano em Heróis</th>
                  <th className="p-3 text-center">Dano em Torres</th>
                  <th className="p-3">Itens Finais</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300">
                {direPlayers.map((p, idx) => (
                  <tr key={idx} className="hover:bg-white/5">
                    <td className="p-3 flex items-center gap-3">
                      <img
                        src={getHeroImg(p.hero_id, constants)}
                        alt={getHeroName(p.hero_id, constants)}
                        className="w-10 h-7 object-cover rounded shadow"
                      />
                      <div>
                        <span className="text-xs font-bold text-white block">{p.personaname || p.name || `Jogador ${idx + 1}`}</span>
                        <span className="text-[10px] text-gray-400">{getHeroName(p.hero_id, constants)}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center font-mono font-bold">
                      <span className="text-emerald-400">{p.kills ?? 0}</span> /{' '}
                      <span className="text-red-400">{p.deaths ?? 0}</span> /{' '}
                      <span className="text-gray-400">{p.assists ?? 0}</span>
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-amber-400">
                      {(p.net_worth || 0).toLocaleString('pt-BR')}
                    </td>
                    <td className="p-3 text-center font-mono text-gray-400">
                      {p.last_hits ?? 0} / {p.denies ?? 0}
                    </td>
                    <td className="p-3 text-center font-mono text-gray-300">
                      {p.gold_per_min || p.gpm || 0} / {p.xp_per_min || p.xpm || 0}
                    </td>
                    <td className="p-3 text-center font-mono text-gray-300">
                      {(p.hero_damage || 0).toLocaleString('pt-BR')}
                    </td>
                    <td className="p-3 text-center font-mono text-gray-300">
                      {(p.tower_damage || 0).toLocaleString('pt-BR')}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        {[p.item_0, p.item_1, p.item_2, p.item_3, p.item_4, p.item_5].map((it, iIdx) => (
                          <div key={iIdx} className="w-6 h-5 rounded bg-black/60 border border-white/10 overflow-hidden">
                            {it > 0 && (
                              <img
                                src={getItemImg(it, constants)}
                                alt="Item"
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* LINKS EXTERNOS (OPENDOTA / VOD) */}
      <div className="flex items-center gap-4 text-xs">
        <a
          href={`https://www.opendota.com/matches/${id}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#131722] border border-[#212838] hover:border-amber-500/40 text-gray-300 hover:text-white font-bold transition-all"
        >
          <ExternalLink className="w-4 h-4 text-amber-400" />
          <span>Abrir Replay no OpenDota Oficial</span>
        </a>

        {match?.vod_url && (
          <a
            href={match.vod_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-950/40 border border-red-800 text-red-300 hover:text-white font-bold transition-all"
          >
            <Tv className="w-4 h-4 text-red-400" />
            <span>Assistir Gravação (VOD)</span>
          </a>
        )}
      </div>
    </div>
  );
}
