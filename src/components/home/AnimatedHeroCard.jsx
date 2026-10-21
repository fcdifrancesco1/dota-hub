import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Trophy, Flame, ChevronRight, Zap } from 'lucide-react';

const HERO_ROSTER = [
  {
    id: 8,
    key: 'juggernaut',
    name: 'Juggernaut',
    role: 'Carry • Agilidade',
    winrate: '68.4%',
    tier: 'TIER S+',
    specialist: 'Yatoro (14 vitórias)',
    primaryColor: '#059669', // Emerald
    accentColor: '#D97706',  // Amber
    description: 'Maior pico de dano por minuto (DPM) nos playoffs do Riyadh Masters.'
  },
  {
    id: 74,
    key: 'invoker',
    name: 'Invoker',
    role: 'Mid • Inteligência',
    winrate: '62.1%',
    tier: 'TIER S',
    specialist: 'bzm (11 vitórias)',
    primaryColor: '#2563EB', // Cobalt
    accentColor: '#9333EA',  // Purple
    description: 'Herói mais contestado na Fase de Grupos com 84% de presença no draft.'
  },
  {
    id: 14,
    key: 'pudge',
    name: 'Pudge',
    role: 'Roamer • Força',
    winrate: '58.0%',
    tier: 'TIER S',
    specialist: 'Save- (9 vitórias)',
    primaryColor: '#EA580C', // Orange
    accentColor: '#16A34A',  // Green
    description: 'Fator surpresa decisivo em confrontos MD3 com hooks de alta precisão.'
  },
  {
    id: 44,
    key: 'phantom_assassin',
    name: 'Phantom Assassin',
    role: 'Hard Carry • Agilidade',
    winrate: '64.7%',
    tier: 'TIER S+',
    specialist: 'Satanic (12 vitórias)',
    primaryColor: '#7C3AED', // Violet
    accentColor: '#0284C7',  // Sky
    description: 'Evolução mais rápida de patrimônio líquido (GPM 860+) na grande final.'
  }
];

export default function AnimatedHeroCard() {
  const [selectedHero, setSelectedHero] = useState(HERO_ROSTER[0]);
  const [videoError, setVideoError] = useState(false);
  const cardRef = useRef(null);
  const navigate = useNavigate();

  const handleCardClick = (e) => {
    // Não navegar se o clique veio de botões ou links internos
    if (e.target.closest('button, a')) return;
    if (selectedHero?.id) {
      navigate(`/herois/${selectedHero.id}`);
    }
  };

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;

    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
    cardRef.current.style.setProperty('--mouse-x', `${(x / rect.width * 100).toFixed(1)}%`);
    cardRef.current.style.setProperty('--mouse-y', `${(y / rect.height * 100).toFixed(1)}%`);
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
  };

  const handleSelectHero = (hero) => {
    setSelectedHero(hero);
    setVideoError(false);
  };

  return (
    <div className="space-y-3">
      {/* CABEÇALHO DO CARD COM SELETOR RÁPIDO */}
      <div className="flex items-center justify-between px-1 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500 animate-spin-slow" />
          <span className="text-xs font-black uppercase tracking-wider text-white">
            Destaque do Meta
          </span>
        </div>

        {/* BOTÕES DE SELEÇÃO RÁPIDA DE HERÓIS */}
        <div className="flex items-center gap-1 text-[11px] font-bold p-1 rounded-xl bg-surface-2 border border-line">
          {HERO_ROSTER.map((h) => {
            const isActive = selectedHero.key === h.key;
            return (
              <button
                key={h.key}
                type="button"
                onClick={() => handleSelectHero(h)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  isActive
                    ? 'bg-blue-600 text-on-accent shadow-sm font-black'
                    : 'text-gray-400 hover:text-white hover:bg-surface-3'
                }`}
              >
                {h.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* CARD 3D COM VÍDEO DO PERSONAGEM EM LOOP */}
      <div
        ref={cardRef}
        onClick={handleCardClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="tilt-card glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden group cursor-pointer shadow-xl border border-line"
      >
        <div className="holo-sheen" />

        {/* TOPO: BADGE E STATUS */}
        <div className="flex items-center justify-between mb-4 relative z-20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-surface-2 text-blue-600 dark:text-blue-400 border border-line shadow-sm">
            <Flame className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>HERÓI MAIS DISPUTADO DO META</span>
          </div>

          <span className="text-xs font-mono font-black px-2.5 py-1 rounded-lg bg-surface-2 text-amber-500 border border-line shadow-sm">
            {selectedHero.tier}
          </span>
        </div>

        {/* CORPO DO CARD: RESPONSIVO (LADO A LADO EM DESKTOP) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-20">
          {/* COLUNA ESQUERDA: VÍDEO ANIMADO (VALVE WEBM RENDER) */}
          <div className="md:col-span-5 relative w-full h-64 sm:h-72 md:h-80 flex items-center justify-center overflow-hidden">
            {/* Aura luminosa difusa atrás do herói */}
            <div
              className="absolute w-56 h-56 rounded-full blur-3xl opacity-35 dark:opacity-25 pointer-events-none animate-pulse"
              style={{
                background: `radial-gradient(circle, ${selectedHero.primaryColor}, transparent 70%)`
              }}
            />

            {/* VÍDEO DO PERSONAGEM EM ALTA QUALIDADE */}
            {!videoError ? (
              <video
                key={selectedHero.key}
                autoPlay
                loop
                muted
                playsInline
                onError={() => setVideoError(true)}
                className="w-full h-full object-contain filter drop-shadow-[0_15px_25px_rgba(0,0,0,0.22)] animate-hero-float"
              >
                <source
                  src={`https://cdn.cloudflare.steamstatic.com/apps/dota2/videos/dota_react/heroes/renders/${selectedHero.key}.webm`}
                  type="video/webm"
                />
              </video>
            ) : (
              <img
                src={`https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${selectedHero.key}.png`}
                alt={selectedHero.name}
                className="w-full h-full object-contain filter drop-shadow-[0_15px_25px_rgba(0,0,0,0.22)] animate-hero-float"
              />
            )}
          </div>

          {/* COLUNA DIREITA: INFORMAÇÕES TÁTICAS E WINRATE */}
          <div className="md:col-span-7 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-3xl font-black tracking-tight text-white">
                  {selectedHero.name}
                </h4>
                <span className="text-xs font-semibold text-gray-400">
                  {selectedHero.role}
                </span>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black text-emerald-500 font-mono block">
                  {selectedHero.winrate}
                </span>
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                  Taxa de Vitória
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              {selectedHero.description}
            </p>

            <div className="p-3 rounded-2xl bg-surface-2 border border-line flex items-center justify-between text-xs shadow-sm">
              <span className="text-gray-400 font-medium">Jogador Especialista:</span>
              <span className="font-bold text-blue-600 dark:text-amber-500">
                {selectedHero.specialist}
              </span>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to={`/herois/${selectedHero.id}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all text-on-accent bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg hover:scale-[1.02]"
              >
                <span>Ver Página de {selectedHero.name}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                to="/herois"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-surface-2 border border-line transition-all"
              >
                <span>Todos os Heróis</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
