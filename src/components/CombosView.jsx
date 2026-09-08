import React, { useState } from 'react';
import {
  Users,
  Sparkles,
  Swords,
  Search,
  Zap,
  Shield,
  Flame,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { POPULAR_HERO_COMBOS, getHeroImg, getHeroName } from '../services/api';

export default function CombosView({
  constants,
  onSelectHero
}) {
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedHeroId, setSelectedHeroId] = useState(null);

  // Lista de todos os heróis disponíveis para o seletor
  const allHeroesList = Object.values(constants?.heroes || {}).sort((a, b) =>
    (a.localized_name || '').localeCompare(b.localized_name || '')
  );

  // Combos populares filtrados por busca
  const filteredCombos = POPULAR_HERO_COMBOS.filter((c) => {
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    const nameA = getHeroName(constants, c.heroAId).toLowerCase();
    const nameB = getHeroName(constants, c.heroBId).toLowerCase();
    const syn = c.synergy.toLowerCase();
    return nameA.includes(q) || nameB.includes(q) || syn.includes(q);
  });

  // Calculadora dinâmica de sinergia para herói selecionado
  const selectedHeroData = selectedHeroId ? constants?.heroes?.[selectedHeroId] : null;

  return (
    <div className="max-w-6xl mx-auto w-full p-4 sm:p-6 space-y-6">
      {/* HEADER DA ABA */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-amber-400">
            <Users className="w-4 h-4 text-amber-400" />
            Sinergias &amp; Estratégias de Equipe
          </div>
          <h1 className="text-2xl font-black text-white tracking-wide mt-1">
            Combos de Heróis e Duplas do Meta
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Descubra as combinações de heróis com maior taxa de vitória e sinergia de lane e teamfight no Dota 2 competitivo.
          </p>
        </div>

        {/* Busca Rápida */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por herói ou combo..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 transition-colors font-mono"
          />
        </div>
      </div>

      {/* SELETOR INTERATIVO: ENCONTRE O MELHOR PARCEIRO PARA SEU HERÓI */}
      <div className="bg-[#141824] border border-amber-500/30 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-400">
            <Sparkles className="w-4 h-4 text-amber-400" /> Calculadora de Parceria de Herói
          </div>
          <span className="text-[11px] text-gray-400">Selecione seu herói para ver sinergias recomendadas</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={selectedHeroId || ''}
            onChange={(e) => setSelectedHeroId(e.target.value ? Number(e.target.value) : null)}
            className="bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono cursor-pointer min-w-[240px]"
          >
            <option value="">-- Escolha um Herói --</option>
            {allHeroesList.map((h) => (
              <option key={h.id} value={h.id}>
                {h.localized_name} ({h.primary_attr?.toUpperCase()})
              </option>
            ))}
          </select>

          {selectedHeroData && (
            <button
              onClick={() => setSelectedHeroId(null)}
              className="text-xs text-gray-400 hover:text-white px-3 py-2 rounded-xl bg-white/5 border border-white/10"
            >
              Limpar seleção
            </button>
          )}
        </div>

        {/* Parcerias Recomendadas para o Herói Escolhido */}
        {selectedHeroData && (
          <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-3 pt-3">
            <div className="flex items-center gap-3">
              <img
                src={getHeroImg(constants, selectedHeroData.id)}
                alt=""
                className="w-12 h-8 rounded-lg object-cover border border-amber-400"
              />
              <div>
                <span className="text-xs font-bold text-white block">{selectedHeroData.localized_name}</span>
                <span className="text-[10px] text-gray-400 font-mono">Melhores parceiros de time para lane e lutas</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {[
                {
                  partnerId: selectedHeroData.id === 41 ? 74 : selectedHeroData.id === 74 ? 41 : 86,
                  title: 'Wombo Combo em Área',
                  desc: 'Controle de grupo em área que amplifica o impacto das habilidades principais.'
                },
                {
                  partnerId: selectedHeroData.id === 1 ? 111 : selectedHeroData.id === 111 ? 1 : 18,
                  title: 'Proteção & Sustentação',
                  desc: 'Cura e controle defensivo permitindo trocas favoráveis na rota.'
                },
                {
                  partnerId: selectedHeroData.id === 97 ? 48 : selectedHeroData.id === 48 ? 97 : 110,
                  title: 'Pressão de Teamfight',
                  desc: 'Iniciação agressiva que impede o reposicionamento dos adversários.'
                }
              ].map((rec, i) => {
                const pName = getHeroName(constants, rec.partnerId);
                const pImg = getHeroImg(constants, rec.partnerId);
                return (
                  <div
                    key={i}
                    onClick={() => onSelectHero && onSelectHero({ id: rec.partnerId, name: pName })}
                    className="bg-[#161A24] hover:bg-[#1E2434] border border-white/10 hover:border-amber-400/50 p-3 rounded-xl cursor-pointer transition-all space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <img src={pImg} alt="" className="w-9 h-6 rounded object-cover border border-white/10" />
                      <div className="min-w-0 flex-1">
                        <strong className="text-xs text-white truncate block">{pName}</strong>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">{rec.title}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-snug">{rec.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* GRID DE DUPLAS FAMOSAS DO META */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-400">
            <Swords className="w-4 h-4 text-amber-400" /> Melhores Combos Oficiais do Meta
          </div>
          <span className="text-[11px] font-mono text-gray-400 font-bold">{filteredCombos.length} COMBOS LISTADOS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCombos.map((c, idx) => {
            const nameA = getHeroName(constants, c.heroAId);
            const imgA = getHeroImg(constants, c.heroAId);
            const nameB = getHeroName(constants, c.heroBId);
            const imgB = getHeroImg(constants, c.heroBId);

            return (
              <div
                key={idx}
                className="bg-[#141824] hover:bg-[#181E2E] border border-white/10 hover:border-amber-500/50 rounded-2xl p-5 space-y-3 transition-all shadow-md group"
              >
                {/* Header da Dupla */}
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <span className="text-xs font-black text-amber-400 font-mono tracking-wide">
                    {c.synergy}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold bg-white/5 text-gray-300 px-2 py-0.5 rounded">
                      {c.lane}
                    </span>
                    <span className="text-[10px] font-mono font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded">
                      Tier {c.tier}
                    </span>
                  </div>
                </div>

                {/* Os Dois Heróis lado a lado */}
                <div className="flex items-center justify-around gap-2 py-1">
                  {/* Herói A */}
                  <div
                    onClick={() => onSelectHero && onSelectHero({ id: c.heroAId, name: nameA })}
                    className="flex flex-col items-center gap-1.5 cursor-pointer group/hero"
                    title={`Ver Detalhes de ${nameA}`}
                  >
                    <img
                      src={imgA}
                      alt={nameA}
                      className="w-16 h-10 object-cover rounded-xl border-2 border-emerald-400/80 shadow-md group-hover/hero:scale-105 transition-transform"
                    />
                    <span className="text-xs font-black text-white group-hover/hero:text-emerald-300 transition-colors">
                      {nameA}
                    </span>
                  </div>

                  {/* Ícone de Sinergia */}
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-amber-400 text-sm">
                    +
                  </div>

                  {/* Herói B */}
                  <div
                    onClick={() => onSelectHero && onSelectHero({ id: c.heroBId, name: nameB })}
                    className="flex flex-col items-center gap-1.5 cursor-pointer group/hero"
                    title={`Ver Detalhes de ${nameB}`}
                  >
                    <img
                      src={imgB}
                      alt={nameB}
                      className="w-16 h-10 object-cover rounded-xl border-2 border-cyan-400/80 shadow-md group-hover/hero:scale-105 transition-transform"
                    />
                    <span className="text-xs font-black text-white group-hover/hero:text-cyan-300 transition-colors">
                      {nameB}
                    </span>
                  </div>
                </div>

                {/* Descrição da Estratégia */}
                <p className="text-xs text-gray-300 leading-relaxed bg-black/40 p-3 rounded-xl border border-white/5">
                  {c.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
