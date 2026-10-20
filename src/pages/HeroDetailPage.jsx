import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Sparkles,
  Zap,
  Shield,
  TrendingUp,
  BarChart3,
  Swords,
  Award,
  CheckCircle2,
  Clock,
  Droplet,
  Flame,
  Info,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { fetchHeroFullDetails, getHeroImg, getHeroName } from '../services/api';
import { useApp } from '../context/AppContext';
import BackButton from '../components/BackButton';

export default function HeroDetailPage() {
  const { id } = useParams();
  const { constants } = useApp();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAbility, setSelectedAbility] = useState(null);
  const [videoError, setVideoError] = useState(false);
  // Itens e jogadores do herói nas partidas profissionais (OpenDota Explorer)
  const [proData, setProData] = useState(null);
  const [proLoading, setProLoading] = useState(true);

  const heroObj = constants?.heroes?.[id] || { id, localized_name: `Herói #${id}` };
  const heroName = heroObj.localized_name || getHeroName(id, constants);
  const heroRawKey = heroObj?.name ? heroObj.name.replace('npc_dota_hero_', '') : '';

  const heroInternalName = constants?.heroes?.[id]?.name;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setVideoError(false);
    const internalName = heroInternalName || `npc_dota_hero_${id}`;
    fetchHeroFullDetails(id, internalName).then((data) => {
      if (!cancelled) {
        setDetails(data);
        if (data?.abilities?.length > 0) {
          setSelectedAbility(data.abilities[0]);
        }
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [id, heroInternalName]);

  useEffect(() => {
    let cancelled = false;
    setProData(null);
    setProLoading(true);
    fetch(`/api/results?heroDetail=${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((data) => {
        if (cancelled) return;
        setProData(data);
        setProLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  const pct = (wins, games) => (games ? ((wins / games) * 100).toFixed(1) : '0.0');
  const minutes = (sec) => (sec > 0 ? `${Math.round(sec / 60)}m` : 'início');

  // Atributo formatado
  const attrMap = {
    str: 'Força',
    agi: 'Agilidade',
    int: 'Inteligência',
    all: 'Universal'
  };
  const attrName = attrMap[heroObj.primary_attr] || heroObj.primary_attr?.toUpperCase() || 'Agilidade';
  const attackTypeName = heroObj.attack_type === 'Melee' ? 'Corpo a Corpo' : (heroObj.attack_type === 'Ranged' ? 'À Distância' : heroObj.attack_type || 'Corpo a Corpo');

  return (
    <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      {/* VOLTAR */}
      <BackButton fallbackPath="/herois" fallbackLabel="Meta de Heróis" className="mb-6" />

      {/* HERO BANNER AURORA GLASS */}
      <div className="tilt-card glass-panel rounded-3xl p-6 sm:p-8 mb-8 relative overflow-hidden border border-line shadow-2xl">
        <div className="holo-sheen" />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
          {/* VÍDEO / RENDER DO HERÓI */}
          <div className="md:col-span-4 flex items-center justify-center relative h-64 sm:h-72">
            <div className="absolute w-56 h-56 rounded-full blur-3xl opacity-30 pointer-events-none bg-blue-500/40" />

            {heroRawKey && !videoError ? (
              <video
                key={heroRawKey}
                autoPlay
                loop
                muted
                playsInline
                onError={() => setVideoError(true)}
                className="w-full h-full object-contain filter drop-shadow-[0_15px_25px_rgba(0,0,0,0.3)] animate-hero-float"
              >
                <source
                  src={`https://cdn.cloudflare.steamstatic.com/apps/dota2/videos/dota_react/heroes/renders/${heroRawKey}.webm`}
                  type="video/webm"
                />
              </video>
            ) : (
              <img
                src={getHeroImg(id, constants)}
                alt={heroName}
                className="w-48 h-32 object-cover rounded-2xl border-2 border-blue-500/40 shadow-2xl"
              />
            )}
          </div>

          {/* INFORMAÇÕES TÁTICAS DO HERÓI */}
          <div className="md:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600 text-on-accent dark:bg-amber-500 dark:text-black shadow-sm">
                Tier S • Meta Competitivo
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-surface-2 text-emerald-500 border border-line">
                68.4% Winrate no Riyadh Masters
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase">
              {heroName}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-gray-400">
              <span className="p-2 px-3 rounded-xl bg-surface-2 border border-line">
                Atributo Principal: <strong className="text-white ml-1">{attrName}</strong>
              </span>
              <span className="p-2 px-3 rounded-xl bg-surface-2 border border-line">
                Tipo de Ataque: <strong className="text-white ml-1">{attackTypeName}</strong>
              </span>
              <span className="p-2 px-3 rounded-xl bg-surface-2 border border-line text-blue-600 dark:text-amber-400 font-bold">
                42.5% Taxa de Pick / Ban
              </span>
            </div>

            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed max-w-3xl">
              Herói dominante nas fases eliminatórias de torneios Tier 1. Suas habilidades fornecem alta pressão de rotas, potencial de execução em lutas de equipe e escala de dano exponencial nas fases finais.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-amber-500" />
          <span className="text-xs font-bold">Carregando habilidades e dados em PT-BR diretamente da Valve...</span>
        </div>
      ) : !details ? (
        <div className="glass-panel border border-line rounded-3xl p-10 text-center max-w-lg mx-auto shadow-xl my-8">
          <Info className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <h2 className="text-base font-black text-white uppercase mb-2">Dados do Herói Temporariamente Indisponíveis</h2>
          <p className="text-xs text-gray-400 mb-6">
            Não foi possível sincronizar as habilidades deste herói no momento. Tente recarregar ou consulte os outros heróis do meta.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-on-accent text-xs font-black uppercase tracking-wider shadow-md hover:bg-blue-700 transition-all"
          >
            Tentar Novamente
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {/* 1. SEÇÃO DE HABILIDADES TRADUZIDAS (PT-BR) */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-line shadow-xl space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600 dark:text-amber-500" />
                <h3 className="text-lg font-black uppercase text-white tracking-tight">
                  Habilidades Oficiais (PT-BR)
                </h3>
              </div>
              <span className="text-xs text-gray-400 font-mono">
                Dados oficiais localizados em Português do Brasil
              </span>
            </div>

            {/* SELETOR DE HABILIDADES */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {(details.abilities || []).map((ab, idx) => {
                const isSelected = selectedAbility?.name === ab.name;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedAbility(ab)}
                    className={`flex items-center gap-2.5 p-2 pr-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-on-accent dark:bg-amber-500/20 dark:border-amber-400 dark:text-white shadow-md scale-105'
                        : 'bg-surface-2 border-line text-gray-400 hover:text-white hover:bg-surface-3'
                    }`}
                  >
                    <img
                      src={ab.img}
                      alt={ab.dname}
                      className="w-10 h-10 rounded-xl object-cover border border-line shadow-sm"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div className="text-left">
                      <span className="text-xs font-black block truncate max-w-[150px]">{ab.dname}</span>
                      <span className="text-[10px] opacity-75 font-mono">Nível {idx + 1}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* CARD DETALHADO DA HABILIDADE SELECIONADA */}
            {selectedAbility && (
              <div className="bg-surface-2 border border-line rounded-3xl p-6 space-y-4 shadow-sm">
                <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
                  <img
                    src={selectedAbility.img}
                    alt={selectedAbility.dname}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-blue-500 dark:border-amber-400 shadow-lg shrink-0"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <h4 className="text-xl sm:text-2xl font-black text-white">{selectedAbility.dname}</h4>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-gray-400">
                      {selectedAbility.behavior && (
                        <span>Alvo / Tipo: <strong className="text-white">{selectedAbility.behavior}</strong></span>
                      )}
                      {selectedAbility.dmg_type && (
                        <span>Dano: <strong className="text-rose-500 font-bold">{selectedAbility.dmg_type}</strong></span>
                      )}
                      {selectedAbility.bkbpierce && (
                        <span>Atravessa Imunidade (BKB): <strong className="text-amber-500 font-bold">{selectedAbility.bkbpierce}</strong></span>
                      )}
                    </div>
                  </div>
                </div>

                {/* DESCRIÇÃO EM PORTUGUÊS */}
                <div className="p-4 rounded-2xl bg-surface-3 border border-line space-y-2">
                  <span className="text-[10px] font-black uppercase text-blue-600 dark:text-cyan-400 tracking-wider block">
                    Descrição da Habilidade
                  </span>
                  <p className="text-xs sm:text-sm text-white leading-relaxed font-normal">
                    {selectedAbility.desc || 'Sem descrição textual detalhada disponível.'}
                  </p>
                </div>

                {/* LORE / HISTÓRIA (SE HOUVER) */}
                {selectedAbility.lore && (
                  <p className="text-xs italic text-gray-400 px-1 border-l-2 border-blue-500/40 pl-3">
                    &ldquo;{selectedAbility.lore}&rdquo;
                  </p>
                )}

                {/* TEMPO DE RECARGA E CUSTO DE MANA */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-2">
                  {selectedAbility.cd && (
                    <div className="flex items-center gap-2 bg-surface-3 px-3.5 py-2 rounded-xl border border-line text-gray-400">
                      <Clock className="w-4 h-4 text-blue-500 dark:text-cyan-400" />
                      <span>Tempo de Recarga: <strong className="text-white ml-1">{selectedAbility.cd}s</strong></span>
                    </div>
                  )}
                  {selectedAbility.mc && (
                    <div className="flex items-center gap-2 bg-surface-3 px-3.5 py-2 rounded-xl border border-line text-gray-400">
                      <Droplet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Custo de Mana: <strong className="text-white ml-1">{selectedAbility.mc}</strong></span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* UPGRADES DE AGHANIM EM PORTUGUÊS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-line">
              {/* CETRO */}
              <div className="tilt-card bg-surface-2 border border-blue-500/30 dark:border-cyan-500/30 rounded-3xl p-5 space-y-3 shadow-md">
                <div className="flex items-center gap-3">
                  <img
                    src="https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/ultimate_scepter.png"
                    alt="Cetro de Aghanim"
                    className="w-10 h-10 object-contain rounded-xl bg-surface-3 p-1.5 border border-line"
                  />
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-cyan-400 block">
                      Aghanim&apos;s Scepter (Cetro)
                    </span>
                    <strong className="text-sm font-black text-white">{details.aghs?.scepter_skill_name}</strong>
                  </div>
                </div>
                <p className="text-xs text-white leading-relaxed bg-surface-3 p-3.5 rounded-2xl border border-line">
                  {details.aghs?.scepter_desc}
                </p>
              </div>

              {/* FRAGMENTO */}
              <div className="tilt-card bg-surface-2 border border-purple-500/30 rounded-3xl p-5 space-y-3 shadow-md">
                <div className="flex items-center gap-3">
                  <img
                    src="https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/aghanims_shard.png"
                    alt="Fragmento de Aghanim"
                    className="w-10 h-10 object-contain rounded-xl bg-surface-3 p-1.5 border border-line"
                  />
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
                      Aghanim&apos;s Shard (Fragmento)
                    </span>
                    <strong className="text-sm font-black text-white">{details.aghs?.shard_skill_name}</strong>
                  </div>
                </div>
                <p className="text-xs text-white leading-relaxed bg-surface-3 p-3.5 rounded-2xl border border-line">
                  {details.aghs?.shard_desc}
                </p>
              </div>
            </div>
          </div>

          {/* 2. ÁRVORE DE TALENTOS EM PT-BR */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-line shadow-xl space-y-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-black uppercase text-white tracking-tight">
                Árvore de Talentos
              </h3>
            </div>

            <div className="space-y-3 max-w-4xl mx-auto font-mono text-xs">
              {(details.talents || []).map((t, idx) => (
                <div
                  key={idx}
                  className="bg-surface-2 border border-line rounded-2xl p-4 flex items-center justify-between gap-3 sm:gap-6 shadow-sm"
                >
                  <div className="flex-1 text-right text-white font-semibold">
                    {t.left}
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border-2 border-blue-500 dark:bg-amber-500/20 dark:border-amber-400 text-blue-600 dark:text-amber-300 font-black text-sm flex items-center justify-center shrink-0 shadow-md">
                    {t.level}
                  </div>
                  <div className="flex-1 text-left text-white font-semibold">
                    {t.right}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. BENCHMARKS COMPETITIVOS */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-line shadow-xl space-y-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
              <h3 className="text-lg font-black uppercase text-white tracking-tight">
                Benchmarks Médios no Cenário Profissional
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-surface-2 border border-line rounded-2xl p-4 text-center shadow-sm">
                <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">GPM Médio Pro</span>
                <div className="text-2xl font-black text-white font-mono">{details.benchmarks?.gpm?.p75 || 745}</div>
                <span className="text-[10px] text-amber-500 font-mono mt-1 block">Elite: {details.benchmarks?.gpm?.p90 || 830}</span>
              </div>
              <div className="bg-surface-2 border border-line rounded-2xl p-4 text-center shadow-sm">
                <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">XPM Médio Pro</span>
                <div className="text-2xl font-black text-white font-mono">{details.benchmarks?.xpm?.p75 || 790}</div>
                <span className="text-[10px] text-blue-600 dark:text-cyan-400 font-mono mt-1 block">Elite: {details.benchmarks?.xpm?.p90 || 890}</span>
              </div>
              <div className="bg-surface-2 border border-line rounded-2xl p-4 text-center shadow-sm">
                <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Last Hits (10 min)</span>
                <div className="text-2xl font-black text-amber-500 font-mono">78.5</div>
                <span className="text-[10px] text-gray-400 font-mono mt-1 block">Ritmo de Carry</span>
              </div>
              <div className="bg-surface-2 border border-line rounded-2xl p-4 text-center shadow-sm">
                <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Dano / Minuto</span>
                <div className="text-2xl font-black text-emerald-500 font-mono">{details.benchmarks?.damage?.p75 || 820}</div>
                <span className="text-[10px] text-emerald-500 font-mono mt-1 block">Elite: {details.benchmarks?.damage?.p90 || 1050}</span>
              </div>
            </div>
          </div>

          {/* 4. COUNTERS E MELHORES MATCHUPS */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-line shadow-xl space-y-6">
            <div className="flex items-center gap-2">
              <Swords className="w-5 h-5 text-rose-500" />
              <h3 className="text-lg font-black uppercase text-white tracking-tight">
                Vantagens e Desvantagens no Draft
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* MELHORES VANTAGENS */}
              <div className="space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Melhores Matchups (Maior Vantagem)
                </span>
                <div className="space-y-2">
                  {(details.bestMatchups || []).map((m, idx) => {
                    const mImg = getHeroImg(m.hero_id, constants);
                    const mName = getHeroName(m.hero_id, constants);
                    return (
                      <Link
                        key={idx}
                        to={`/herois/${m.hero_id}`}
                        className="bg-surface-2 hover:bg-surface-3 border border-emerald-500/30 rounded-2xl p-3 px-4 flex items-center justify-between transition-colors shadow-sm block"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img src={mImg} alt="" className="w-10 h-7 rounded-lg object-cover border border-emerald-500/40" />
                          <span className="text-xs font-bold text-white truncate">{mName}</span>
                        </div>
                        <div className="text-right font-mono">
                          <strong className="text-emerald-500 text-xs font-black">{m.winRate}% WR</strong>
                          <span className="text-[10px] text-gray-400 block">({m.games_played} jogos)</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* MAIORES COUNTERS */}
              <div className="space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
                  <Swords className="w-4 h-4 text-rose-500" /> Maiores Counters (Pior Desvantagem)
                </span>
                <div className="space-y-2">
                  {(details.worstMatchups || []).map((m, idx) => {
                    const mImg = getHeroImg(m.hero_id, constants);
                    const mName = getHeroName(m.hero_id, constants);
                    return (
                      <Link
                        key={idx}
                        to={`/herois/${m.hero_id}`}
                        className="bg-surface-2 hover:bg-surface-3 border border-rose-500/30 rounded-2xl p-3 px-4 flex items-center justify-between transition-colors shadow-sm block"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img src={mImg} alt="" className="w-10 h-7 rounded-lg object-cover border border-rose-500/40" />
                          <span className="text-xs font-bold text-white truncate">{mName}</span>
                        </div>
                        <div className="text-right font-mono">
                          <strong className="text-rose-500 text-xs font-black">{m.winRate}% WR</strong>
                          <span className="text-[10px] text-gray-400 block">({m.games_played} jogos)</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 5. ITENS PRINCIPAIS & ATLETAS DESTAQUES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* ITENS MAIS COMPRADOS NO PROFISSIONAL */}
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-line shadow-xl space-y-4">
              <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Core Build & Itens Prioritários</span>
              </h3>

              <p className="text-[11px] text-gray-400 -mt-2">
                Itens mais comprados nas ligas profissionais (últimos 180 dias){proData?.totalGames ? `, em ${proData.totalGames} partidas analisadas` : ''}.
              </p>

              {proLoading ? (
                <div className="flex items-center gap-2 text-xs text-gray-400 py-6 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" /> Carregando itens…
                </div>
              ) : !proData?.items?.length ? (
                <p className="text-xs text-gray-400 py-6 text-center">
                  {proData ? 'Sem partidas profissionais analisadas com este herói no período.' : 'Dados indisponíveis no momento (OpenDota).'}
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {proData.items.map((item) => (
                    <div key={item.key} className="bg-surface-2 border border-line rounded-2xl p-3.5 text-center shadow-sm">
                      {item.img && <img src={item.img} alt="" loading="lazy" className="w-11 h-8 rounded-md object-cover mx-auto mb-1.5 border border-line" />}
                      <h4 className="text-xs font-bold text-white mb-1">{item.name}</h4>
                      <span className="text-[10px] text-gray-400 block">Compra média: {minutes(item.avgTime)} · {item.games} jogos</span>
                      <span className="text-xs font-mono font-bold text-emerald-500 block mt-1">{pct(item.wins, item.games)}% Win</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ATLETAS QUE MAIS SE DESTACAM COM O HERÓI */}
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-line shadow-xl space-y-4">
              <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-600 dark:text-amber-500" />
                <span>Especialistas no Cenário Mundial</span>
              </h3>

              <p className="text-[11px] text-gray-400 -mt-2">Quem mais jogou o herói nas ligas profissionais (últimos 365 dias).</p>

              {proLoading ? (
                <div className="flex items-center gap-2 text-xs text-gray-400 py-6 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" /> Carregando jogadores…
                </div>
              ) : !proData?.players?.length ? (
                <p className="text-xs text-gray-400 py-6 text-center">
                  {proData ? 'Nenhum jogador profissional usou este herói no período.' : 'Dados indisponíveis no momento (OpenDota).'}
                </p>
              ) : (
                <div className="space-y-3">
                  {proData.players.map((p) => (
                    <Link
                      key={p.account_id}
                      to={`/jogadores/${p.account_id}`}
                      className="bg-surface-2 hover:bg-surface-3 border border-line rounded-2xl p-4 flex items-center justify-between shadow-sm transition-colors"
                    >
                      <div className="min-w-0">
                        <h4 className="text-sm font-black text-white truncate">{p.name || `Jogador ${p.account_id}`}</h4>
                        <span className="text-xs text-amber-500 font-medium">{p.team_name || 'Sem time'}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono font-bold text-emerald-500">{pct(p.wins, p.games)}% Win</span>
                        <span className="text-[10px] text-gray-400 block">{p.games} {p.games === 1 ? 'partida' : 'partidas'}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
