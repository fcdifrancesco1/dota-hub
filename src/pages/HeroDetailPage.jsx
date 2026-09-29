import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Zap,
  Shield,
  TrendingUp,
  BarChart3,
  Swords,
  Award,
  CheckCircle2
} from 'lucide-react';
import { fetchHeroFullDetails, getHeroImg, getHeroName } from '../services/api';
import { useApp } from '../context/AppContext';

export default function HeroDetailPage() {
  const { id } = useParams();
  const { constants } = useApp();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  const heroObj = constants?.heroes?.[id] || { id, localized_name: `Herói #${id}` };
  const heroName = heroObj.localized_name || getHeroName(id, constants);

  useEffect(() => {
    setLoading(true);
    const internalName = constants?.heroes?.[id]?.name || 'npc_dota_hero_luna';
    fetchHeroFullDetails(id, internalName).then((data) => {
      setDetails(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id, constants]);

  return (
    <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      {/* VOLTAR */}
      <Link
        to="/herois"
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-amber-400 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar para Meta de Heróis</span>
      </Link>

      {/* HERO BANNER */}
      <div className="rounded-2xl bg-gradient-to-r from-[#141A28] via-[#0E1119] to-[#181116] border border-[#212838] p-6 sm:p-8 mb-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <img
            src={getHeroImg(id, constants)}
            alt={heroName}
            className="w-28 h-18 object-cover rounded-2xl border-2 border-amber-500/40 shadow-xl"
          />

          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500 text-black px-2 py-0.5 rounded">
                Tier S • Alta Prioridade
              </span>
              <span className="text-xs text-emerald-400 font-bold font-mono">
                68.4% Winrate no Patch 7.37
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white font-serif uppercase tracking-tight">
              {heroName}
            </h1>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-gray-400 mt-2 font-mono">
              <span>Atributo: <strong className="text-white">{heroObj.primary_attr?.toUpperCase() || 'AGI'}</strong></span>
              <span>•</span>
              <span>Ataque: <strong className="text-white">{heroObj.attack_type || 'Ranged'}</strong></span>
              <span>•</span>
              <span className="text-amber-400 font-bold">42.5% Taxa de Pick / Ban</span>
            </div>
          </div>
        </div>
      </div>

      {/* BENCHMARKS NO CENÁRIO PROFISSIONAL */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <div className="bg-[#0C0E14] border border-[#212838] rounded-xl p-4 text-center">
          <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">GPM Médio Pro</span>
          <div className="text-xl font-black text-white font-mono">745</div>
        </div>
        <div className="bg-[#0C0E14] border border-[#212838] rounded-xl p-4 text-center">
          <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">XPM Médio Pro</span>
          <div className="text-xl font-black text-white font-mono">790</div>
        </div>
        <div className="bg-[#0C0E14] border border-[#212838] rounded-xl p-4 text-center">
          <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Last Hits em 10 min</span>
          <div className="text-xl font-black text-amber-400 font-mono">78.5</div>
        </div>
        <div className="bg-[#0C0E14] border border-[#212838] rounded-xl p-4 text-center">
          <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Dano / Minuto</span>
          <div className="text-xl font-black text-emerald-400 font-mono">820</div>
        </div>
      </div>

      {/* ITENS MAIS COMPRADOS NO PROFISSIONAL */}
      <div className="bg-[#0C0E14] border border-[#212838] rounded-2xl p-6 shadow-xl mb-10">
        <h3 className="text-sm font-black uppercase text-white mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Core Build & Itens Mais Prioritários</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { name: 'Manta Style', winrate: 72.5, timing: '18m' },
            { name: 'Power Treads', winrate: 67.8, timing: '7m' },
            { name: 'Dragon Lance', winrate: 69.2, timing: '12m' },
            { name: 'Black King Bar', winrate: 74.0, timing: '23m' },
            { name: 'Butterfly', winrate: 81.5, timing: '29m' },
            { name: 'Satanic', winrate: 78.9, timing: '34m' }
          ].map((item, idx) => (
            <div key={idx} className="bg-[#11141E] border border-white/5 rounded-xl p-3 text-center">
              <h4 className="text-xs font-bold text-white mb-1">{item.name}</h4>
              <span className="text-[10px] text-gray-400 block">Tempo Médio: {item.timing}</span>
              <span className="text-xs font-mono font-bold text-emerald-400 block mt-1">{item.winrate}% Win</span>
            </div>
          ))}
        </div>
      </div>

      {/* ATLETAS QUE MAIS SE DESTACAM COM O HERÓI */}
      <div className="bg-[#0C0E14] border border-[#212838] rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-black uppercase text-white mb-4 flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          <span>Especialistas no Cenário Mundial</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#11141E] border border-white/5 rounded-xl p-4 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-black text-white">skiter</h4>
              <span className="text-xs text-amber-400">Team Falcons</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-emerald-400">82.4% Win</span>
              <span className="text-[10px] text-gray-400 block">17 partidas</span>
            </div>
          </div>

          <div className="bg-[#11141E] border border-white/5 rounded-xl p-4 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-black text-white">miCKe</h4>
              <span className="text-xs text-amber-400">Team Liquid</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-emerald-400">76.9% Win</span>
              <span className="text-[10px] text-gray-400 block">13 partidas</span>
            </div>
          </div>

          <div className="bg-[#11141E] border border-white/5 rounded-xl p-4 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-black text-white">Yatoro / Raddan</h4>
              <span className="text-xs text-amber-400">Team Spirit</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-emerald-400">71.4% Win</span>
              <span className="text-[10px] text-gray-400 block">14 partidas</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
