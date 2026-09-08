import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Zap,
  Shield,
  TrendingUp,
  BarChart3,
  Swords,
  Loader2,
  CheckCircle2,
  Clock,
  Droplet,
  Info,
  Flame,
  Award
} from 'lucide-react';
import { fetchHeroFullDetails, getHeroImg, getHeroName } from '../services/api';

export default function HeroDetailModal({
  hero,
  constants,
  onClose,
  onSelectAnotherHero
}) {
  const [activeTab, setActiveTab] = useState('skills'); // 'skills' | 'talents' | 'benchmarks' | 'matchups'
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAbility, setSelectedAbility] = useState(null);

  useEffect(() => {
    if (!hero?.id) return;
    setLoading(true);
    const internalName = constants?.heroes?.[hero.id]?.name || `npc_dota_hero_${hero.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    fetchHeroFullDetails(hero.id, internalName).then((data) => {
      setDetails(data);
      if (data?.abilities?.length > 0) {
        setSelectedAbility(data.abilities[0]);
      }
      setLoading(false);
    });
  }, [hero?.id, hero?.name, constants]);

  // Fechar no ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!hero) return null;

  const heroImg = hero.img || getHeroImg(constants, hero.id);
  const heroName = hero.name || getHeroName(constants, hero.id);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-[#0C0F16] border border-amber-500/40 rounded-2xl p-4 sm:p-6 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* BOTÃO FECHAR */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-all z-20 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* CABEÇALHO DO HERÓI */}
        <div className="border-b border-white/10 pb-4 mb-4 relative z-10 shrink-0">
          <div className="flex flex-wrap items-center gap-4">
            <img
              src={heroImg}
              alt={heroName}
              className="w-20 h-12 sm:w-24 sm:h-14 rounded-xl object-cover border-2 border-amber-400 shadow-lg shadow-amber-500/20 shrink-0"
              onError={(e) => { e.target.style.display = 'none'; }}
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white">{heroName}</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase font-mono bg-amber-500 text-black shadow-sm">
                  Tier {hero.tier || 'A'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-white/10 text-cyan-300 border border-white/10">
                  {hero.primaryAttr || 'Atributo'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-white/10 text-gray-300 border border-white/10">
                  {hero.attackType || 'Corpo a Corpo'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-gray-400 mt-1.5">
                {hero.proWinRate !== undefined && (
                  <span>Win Rate Pro: <strong className="text-emerald-400 font-bold">{hero.proWinRate}%</strong></span>
                )}
                {hero.proPick !== undefined && (
                  <span>Picks Pro: <strong className="text-amber-400 font-bold">{hero.proPick}</strong></span>
                )}
                {hero.pub8WinRate !== undefined && (
                  <span>Win Rate High MMR: <strong className="text-cyan-400 font-bold">{hero.pub8WinRate}%</strong></span>
                )}
              </div>
            </div>
          </div>

          {/* NAVEGAÇÃO DE ABAS INTERNAS */}
          <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-white/5 overflow-x-auto">
            <button
              onClick={() => setActiveTab('skills')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'skills'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                  : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
              }`}
            >
              <Zap className="w-3.5 h-3.5" /> Habilidades &amp; Aghanim
            </button>
            <button
              onClick={() => setActiveTab('talents')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'talents'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                  : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Árvore de Talentos
            </button>
            <button
              onClick={() => setActiveTab('benchmarks')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'benchmarks'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                  : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" /> Benchmarks
            </button>
            <button
              onClick={() => setActiveTab('matchups')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'matchups'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                  : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
              }`}
            >
              <Swords className="w-3.5 h-3.5" /> Counters &amp; Vantagens
            </button>
          </div>
        </div>

        {/* CONTEÚDO DA ABA SELECIONADA */}
        <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar space-y-4">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              <span className="text-xs font-semibold">Carregando habilidades, talentos e benchmarks da Valve...</span>
            </div>
          ) : !details ? (
            <div className="text-center py-16 text-gray-400 text-xs">
              Não foi possível carregar as informações detalhadas deste herói.
            </div>
          ) : (
            <>
              {/* 1. ABA DE HABILIDADES & AGHANIM */}
              {activeTab === 'skills' && (
                <div className="space-y-4">
                  {/* Seletor de Habilidades */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 block">
                      Habilidades Principais do Herói
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {details.abilities.map((ab, idx) => {
                        const isSelected = selectedAbility?.name === ab.name;
                        return (
                          <button
                            key={idx}
                            onClick={() => setSelectedAbility(ab)}
                            className={`flex items-center gap-2 p-1.5 pr-3 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500/20 border-amber-400 text-white shadow-md shadow-amber-500/10'
                                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            <img
                              src={ab.img}
                              alt={ab.dname}
                              className="w-8 h-8 rounded-lg object-cover border border-white/10"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                            <span className="text-xs font-bold truncate max-w-[120px]">{ab.dname}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Detalhes da Habilidade Selecionada */}
                  {selectedAbility && (
                    <div className="bg-[#141824] border border-white/10 rounded-xl p-4 space-y-3">
                      <div className="flex items-start gap-3.5">
                        <img
                          src={selectedAbility.img}
                          alt={selectedAbility.dname}
                          className="w-14 h-14 rounded-xl object-cover border-2 border-amber-400/80 shadow-md shrink-0"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-black text-white">{selectedAbility.dname}</h3>
                          <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-gray-400 mt-1">
                            {selectedAbility.behavior && <span>Tipo: <strong className="text-gray-200">{selectedAbility.behavior}</strong></span>}
                            {selectedAbility.dmg_type && <span>Dano: <strong className="text-rose-400">{selectedAbility.dmg_type}</strong></span>}
                            {selectedAbility.bkbpierce && <span>Atravessa BKB: <strong className="text-amber-300">{selectedAbility.bkbpierce}</strong></span>}
                          </div>
                        </div>
                      </div>

                      {/* Descrição */}
                      <p className="text-xs text-gray-300 leading-relaxed bg-black/30 p-3 rounded-lg border border-white/5">
                        {selectedAbility.desc || 'Sem descrição textual detalhada.'}
                      </p>

                      {/* Mana & Cooldown */}
                      <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-1">
                        {selectedAbility.cd && (
                          <div className="flex items-center gap-1.5 text-gray-300 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                            <Clock className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Tempo de Recarga: <strong className="text-white">{selectedAbility.cd}s</strong></span>
                          </div>
                        )}
                        {selectedAbility.mc && (
                          <div className="flex items-center gap-1.5 text-gray-300 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                            <Droplet className="w-3.5 h-3.5 text-blue-400" />
                            <span>Custo de Mana: <strong className="text-white">{selectedAbility.mc}</strong></span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Upgrades de Aghanim's Scepter e Shard */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {/* Scepter */}
                    <div className="bg-[#141824] border border-cyan-500/30 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center gap-2.5">
                        <img
                          src="https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/ultimate_scepter.png"
                          alt="Cetro de Aghanim"
                          className="w-8 h-8 object-contain rounded bg-black/40 p-1 border border-cyan-500/40"
                        />
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-400 block">
                            Aghanim's Scepter (Cetro)
                          </span>
                          <strong className="text-xs text-white">{details.aghs.scepter_skill_name}</strong>
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-300 leading-relaxed bg-black/40 p-2.5 rounded-lg border border-white/5">
                        {details.aghs.scepter_desc}
                      </p>
                    </div>

                    {/* Shard */}
                    <div className="bg-[#141824] border border-purple-500/30 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center gap-2.5">
                        <img
                          src="https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/aghanims_shard.png"
                          alt="Fragmento de Aghanim"
                          className="w-8 h-8 object-contain rounded bg-black/40 p-1 border border-purple-500/40"
                        />
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400 block">
                            Aghanim's Shard (Fragmento)
                          </span>
                          <strong className="text-xs text-white">{details.aghs.shard_skill_name}</strong>
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-300 leading-relaxed bg-black/40 p-2.5 rounded-lg border border-white/5">
                        {details.aghs.shard_desc}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. ABA DA ÁRVORE DE TALENTOS */}
              {activeTab === 'talents' && (
                <div className="space-y-3">
                  <div className="text-center text-xs text-gray-400 font-mono">
                    Escolha de talentos por nível (Lado Esquerdo vs Lado Direito)
                  </div>

                  <div className="space-y-2">
                    {details.talents.map((t, idx) => (
                      <div
                        key={idx}
                        className="bg-[#141824] border border-white/10 rounded-xl p-3 flex items-center justify-between gap-2 sm:gap-4 text-xs font-mono"
                      >
                        <div className="flex-1 text-right text-gray-200 font-medium truncate sm:whitespace-normal">
                          {t.left}
                        </div>
                        <div className="w-12 h-12 rounded-full bg-amber-500/20 border-2 border-amber-400 text-amber-300 font-black text-sm flex items-center justify-center shrink-0 shadow-md">
                          {t.level}
                        </div>
                        <div className="flex-1 text-left text-gray-200 font-medium truncate sm:whitespace-normal">
                          {t.right}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. ABA DE BENCHMARKS COMPETITIVOS */}
              {activeTab === 'benchmarks' && (
                <div className="space-y-4">
                  <div className="text-xs text-gray-400 bg-white/5 p-3 rounded-xl border border-white/10">
                    Estes são os valores de referência dos jogadores mais proficientes com <strong>{heroName}</strong> em partidas de alto nível.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                    {/* GPM */}
                    <div className="bg-[#141824] border border-white/10 rounded-xl p-3.5 space-y-2">
                      <span className="text-[11px] font-extrabold uppercase text-amber-400">Ouro Por Minuto (GPM)</span>
                      <div className="grid grid-cols-3 gap-2 text-center pt-1">
                        <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                          <span className="text-[10px] text-gray-500 block">Médio (p50)</span>
                          <strong className="text-white text-sm">{details.benchmarks.gpm.p50}</strong>
                        </div>
                        <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                          <span className="text-[10px] text-gray-500 block">Bom (p75)</span>
                          <strong className="text-cyan-400 text-sm">{details.benchmarks.gpm.p75}</strong>
                        </div>
                        <div className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/30">
                          <span className="text-[10px] text-amber-400 block">Elite (p90)</span>
                          <strong className="text-amber-400 text-sm">{details.benchmarks.gpm.p90}</strong>
                        </div>
                      </div>
                    </div>

                    {/* XPM */}
                    <div className="bg-[#141824] border border-white/10 rounded-xl p-3.5 space-y-2">
                      <span className="text-[11px] font-extrabold uppercase text-cyan-400">XP Por Minuto (XPM)</span>
                      <div className="grid grid-cols-3 gap-2 text-center pt-1">
                        <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                          <span className="text-[10px] text-gray-500 block">Médio (p50)</span>
                          <strong className="text-white text-sm">{details.benchmarks.xpm.p50}</strong>
                        </div>
                        <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                          <span className="text-[10px] text-gray-500 block">Bom (p75)</span>
                          <strong className="text-cyan-400 text-sm">{details.benchmarks.xpm.p75}</strong>
                        </div>
                        <div className="bg-cyan-500/10 p-2 rounded-lg border border-cyan-500/30">
                          <span className="text-[10px] text-cyan-400 block">Elite (p90)</span>
                          <strong className="text-cyan-400 text-sm">{details.benchmarks.xpm.p90}</strong>
                        </div>
                      </div>
                    </div>

                    {/* KILLS PER MIN */}
                    <div className="bg-[#141824] border border-white/10 rounded-xl p-3.5 space-y-2">
                      <span className="text-[11px] font-extrabold uppercase text-rose-400">Abates Por Minuto (KPM)</span>
                      <div className="grid grid-cols-3 gap-2 text-center pt-1">
                        <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                          <span className="text-[10px] text-gray-500 block">Médio (p50)</span>
                          <strong className="text-white text-sm">{details.benchmarks.kpm.p50}</strong>
                        </div>
                        <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                          <span className="text-[10px] text-gray-500 block">Bom (p75)</span>
                          <strong className="text-rose-400 text-sm">{details.benchmarks.kpm.p75}</strong>
                        </div>
                        <div className="bg-rose-500/10 p-2 rounded-lg border border-rose-500/30">
                          <span className="text-[10px] text-rose-400 block">Elite (p90)</span>
                          <strong className="text-rose-400 text-sm">{details.benchmarks.kpm.p90}</strong>
                        </div>
                      </div>
                    </div>

                    {/* LAST HITS PER MIN */}
                    <div className="bg-[#141824] border border-white/10 rounded-xl p-3.5 space-y-2">
                      <span className="text-[11px] font-extrabold uppercase text-emerald-400">Last Hits Por Minuto (CS)</span>
                      <div className="grid grid-cols-3 gap-2 text-center pt-1">
                        <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                          <span className="text-[10px] text-gray-500 block">Médio (p50)</span>
                          <strong className="text-white text-sm">{details.benchmarks.lpm.p50}</strong>
                        </div>
                        <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                          <span className="text-[10px] text-gray-500 block">Bom (p75)</span>
                          <strong className="text-emerald-400 text-sm">{details.benchmarks.lpm.p75}</strong>
                        </div>
                        <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/30">
                          <span className="text-[10px] text-emerald-400 block">Elite (p90)</span>
                          <strong className="text-emerald-400 text-sm">{details.benchmarks.lpm.p90}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. ABA DE COUNTERS E VANTAGENS */}
              {activeTab === 'matchups' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Melhores Vantagens (Heróis que ele vence com folga) */}
                  <div className="space-y-2.5">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Melhores Matchups (Maior Vantagem)
                    </span>
                    <div className="space-y-2">
                      {details.bestMatchups.map((m, idx) => {
                        const mImg = getHeroImg(constants, m.hero_id);
                        const mName = getHeroName(constants, m.hero_id);
                        return (
                          <div
                            key={idx}
                            onClick={() => onSelectAnotherHero && onSelectAnotherHero({ id: m.hero_id, name: mName })}
                            className="bg-[#141824] hover:bg-[#1A2030] border border-emerald-500/30 rounded-xl p-2.5 px-3 flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img src={mImg} alt="" className="w-9 h-6 rounded object-cover border border-emerald-500/40" />
                              <span className="text-xs font-bold text-white truncate">{mName}</span>
                            </div>
                            <div className="text-right font-mono">
                              <strong className="text-emerald-400 text-xs">{m.winRate}% WR</strong>
                              <span className="text-[9px] text-gray-500 block">({m.games_played} jogos)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Maiores Counters (Heróis que causam problemas para ele) */}
                  <div className="space-y-2.5">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                      <Swords className="w-4 h-4 text-rose-400" /> Maiores Counters (Pior Desvantagem)
                    </span>
                    <div className="space-y-2">
                      {details.worstMatchups.map((m, idx) => {
                        const mImg = getHeroImg(constants, m.hero_id);
                        const mName = getHeroName(constants, m.hero_id);
                        return (
                          <div
                            key={idx}
                            onClick={() => onSelectAnotherHero && onSelectAnotherHero({ id: m.hero_id, name: mName })}
                            className="bg-[#141824] hover:bg-[#1A2030] border border-rose-500/30 rounded-xl p-2.5 px-3 flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img src={mImg} alt="" className="w-9 h-6 rounded object-cover border border-rose-500/40" />
                              <span className="text-xs font-bold text-white truncate">{mName}</span>
                            </div>
                            <div className="text-right font-mono">
                              <strong className="text-rose-400 text-xs">{m.winRate}% WR</strong>
                              <span className="text-[9px] text-gray-500 block">({m.games_played} jogos)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
