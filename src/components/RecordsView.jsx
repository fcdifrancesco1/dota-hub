import React, { useState, useEffect } from 'react';
import {
  Award,
  Flame,
  Zap,
  Clock,
  Coins,
  Shield,
  Swords,
  Crosshair,
  Loader2,
  ExternalLink,
  Trophy
} from 'lucide-react';
import { fetchDotaRecords, getHeroImg, getHeroName } from '../services/api';

const RECORD_TYPES = [
  { id: 'kills', label: 'Mais Abates (Kills)', icon: Crosshair, unit: 'kills' },
  { id: 'gold_per_min', label: 'Maior GPM', icon: Coins, unit: 'GPM' },
  { id: 'xp_per_min', label: 'Maior XPM', icon: Zap, unit: 'XPM' },
  { id: 'duration', label: 'Partida Mais Longa', icon: Clock, unit: 'min' },
  { id: 'last_hits', label: 'Mais Last Hits (CS)', icon: Swords, unit: 'LH' },
  { id: 'hero_damage', label: 'Dano a Heróis', icon: Flame, unit: 'dano' },
  { id: 'tower_damage', label: 'Dano a Torres', icon: Shield, unit: 'dano' }
];

export default function RecordsView({
  constants,
  onSelectHero,
  onSelectMatchId
}) {
  const [selectedType, setSelectedType] = useState('kills');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchDotaRecords(selectedType).then((data) => {
      setRecords(data || []);
      setLoading(false);
    });
  }, [selectedType]);

  const currentCategory = RECORD_TYPES.find((r) => r.id === selectedType) || RECORD_TYPES[0];

  const formatScore = (val, type) => {
    if (type === 'duration') {
      const totalMins = Math.floor(val / 60);
      const secs = val % 60;
      return `${totalMins}m ${secs < 10 ? '0' : ''}${secs}s`;
    }
    return Number(val).toLocaleString();
  };

  return (
    <div className="max-w-6xl mx-auto w-full p-4 sm:p-6 space-y-6">
      {/* HEADER DA ABA */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-amber-400">
            <Trophy className="w-4 h-4 text-amber-400" />
            Hall da Fama Oficial do Dota 2
          </div>
          <h1 className="text-2xl font-black text-white tracking-wide mt-1">
            Recordes Históricos Mundiais
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Os maiores marcos numéricos já registrados na história das partidas profissionais e de alto nível de Dota 2.
          </p>
        </div>

        {/* Total de Recordes */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 font-mono text-xs text-amber-400 font-bold">
          <Award className="w-4 h-4" /> Top 50 Oficiais
        </div>
      </div>

      {/* SELETOR DE CATEGORIAS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {RECORD_TYPES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedType === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedType(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* CONTEÚDO DA LISTAGEM DE RECORDES */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          <span className="text-xs font-semibold">Consultando recordes mundiais da OpenDota...</span>
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-xs">
          Nenhum recorde encontrado para esta categoria no momento.
        </div>
      ) : (
        <div className="space-y-4">
          {/* O RECORDISTA MUNDIAL #1 EM DESTAQUE */}
          {records[0] && (
            <div className="bg-gradient-to-r from-amber-500/20 via-[#161A24] to-[#141824] border border-amber-500/50 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500 text-black flex items-center justify-center font-black text-2xl shadow-lg shadow-amber-500/40 shrink-0">
                  #1
                </div>
                {records[0].hero_id && (
                  <img
                    src={getHeroImg(constants, records[0].hero_id)}
                    alt=""
                    className="w-16 h-10 rounded-xl object-cover border-2 border-amber-400 shadow-md cursor-pointer hover:scale-105 transition-transform shrink-0"
                    onClick={() => onSelectHero && onSelectHero({ id: records[0].hero_id, name: getHeroName(constants, records[0].hero_id) })}
                    title="Ver Detalhes do Herói"
                  />
                )}
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 block">
                    Recordista Mundial Absoluto
                  </span>
                  <h3 className="text-xl font-black text-white">
                    {records[0].hero_id ? getHeroName(constants, records[0].hero_id) : 'Partida Profissional'}
                  </h3>
                  <span className="text-[11px] font-mono text-gray-400">
                    Match ID: <strong className="text-gray-200">{records[0].match_id}</strong>
                    {records[0].start_time && ` · ${new Date(records[0].start_time * 1000).toLocaleDateString('pt-BR')}`}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="font-mono text-3xl font-black text-amber-400">
                  {formatScore(records[0].score, selectedType)}
                </div>
                <span className="text-[10px] uppercase font-mono text-gray-400 block tracking-wider">
                  {currentCategory.unit}
                </span>
              </div>
            </div>
          )}

          {/* TABELA DO TOP 2 AO 50 */}
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0E1118]/80 backdrop-blur-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#161A24]/90 text-gray-400 font-mono text-[10px] uppercase border-b border-white/10">
                <tr>
                  <th className="p-3.5 pl-5 w-16 text-center">Posição</th>
                  <th className="p-3.5">Herói / Jogador</th>
                  <th className="p-3.5 text-right font-bold">Valor Recorde</th>
                  <th className="p-3.5 text-right">Data</th>
                  <th className="p-3.5 pr-5 text-right">Match ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {records.slice(1).map((r, idx) => {
                  const heroName = r.hero_id ? getHeroName(constants, r.hero_id) : '—';
                  const heroImg = r.hero_id ? getHeroImg(constants, r.hero_id) : null;
                  const dateStr = r.start_time ? new Date(r.start_time * 1000).toLocaleDateString('pt-BR') : '—';

                  return (
                    <tr key={idx} className="hover:bg-white/[0.03] transition-colors">
                      <td className="p-3.5 pl-5 text-center font-mono font-bold text-gray-400">
                        #{idx + 2}
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          {heroImg ? (
                            <img
                              src={heroImg}
                              alt={heroName}
                              className="w-9 h-6 object-cover rounded border border-white/10 cursor-pointer hover:border-amber-400 transition-colors"
                              onClick={() => onSelectHero && onSelectHero({ id: r.hero_id, name: heroName })}
                              title="Ver Detalhes do Herói"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-9 h-6 rounded bg-white/5 border border-white/10 flex items-center justify-center font-mono text-[9px] text-gray-400">
                              Dota
                            </div>
                          )}
                          <span
                            className="text-white font-bold cursor-pointer hover:text-amber-400 transition-colors"
                            onClick={() => r.hero_id && onSelectHero && onSelectHero({ id: r.hero_id, name: heroName })}
                          >
                            {heroName}
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5 text-right font-mono font-black text-amber-400 text-sm">
                        {formatScore(r.score, selectedType)}
                        <span className="text-[10px] text-gray-500 font-normal ml-1">{currentCategory.unit}</span>
                      </td>

                      <td className="p-3.5 text-right font-mono text-gray-400">
                        {dateStr}
                      </td>

                      <td className="p-3.5 pr-5 text-right font-mono">
                        <a
                          href={`https://www.opendota.com/matches/${r.match_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 transition-colors"
                          title="Ver Partida na OpenDota"
                        >
                          {r.match_id}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
