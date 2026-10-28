import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Flame, ChevronRight, Loader2 } from 'lucide-react';
import { fetchHeroStats, fetchHeroPositions } from '../../services/api';

// Cores da aura atrás do herói, pelo atributo principal
const ATTR_COLORS = { str: '#DC2626', agi: '#059669', int: '#2563EB', all: '#9333EA' };
const HOW_MANY = 4;
const POSITIONS = [
  { n: 1, label: 'Carry' },
  { n: 2, label: 'Midlane' },
  { n: 3, label: 'Offlane' },
  { n: 4, label: 'Suporte 4' },
  { n: 5, label: 'Suporte 5' }
];
// Herói conta numa posição quando foi jogado nela em pelo menos 15% dos seus
// jogos profissionais recentes (e no mínimo 3 vezes), como na página de heróis
const MIN_SHARE = 0.15;
const MIN_GAMES = 3;

const contest = (h) => h.proPick + h.proBan;

/**
 * Um destaque por posição: o herói mais disputado (escolhas + banimentos) entre
 * os que jogam principalmente naquela posição; se nenhum, entre os que jogam nela
 * com frequência. Sem os dados de posição, os mais disputados no geral.
 */
function pickHighlights(list, positions) {
  const ranked = [...(list || [])].filter((h) => contest(h) > 0).sort((a, b) => contest(b) - contest(a));
  if (!positions) return ranked.slice(0, HOW_MANY).map((h) => ({ hero: h, position: null }));

  const share = (h, n) => {
    const p = positions[h.id];
    return p?.total && p[n] >= MIN_GAMES ? p[n] / p.total : 0;
  };
  const mainPosition = (h) => [1, 2, 3, 4, 5].reduce((best, n) => (share(h, n) > share(h, best) ? n : best), 1);

  const used = new Set();
  return POSITIONS.map((pos) => {
    const hero =
      ranked.find((h) => !used.has(h.id) && share(h, pos.n) > 0 && mainPosition(h) === pos.n) ||
      ranked.find((h) => !used.has(h.id) && share(h, pos.n) >= MIN_SHARE);
    if (!hero) return null;
    used.add(hero.id);
    return { hero, position: pos };
  }).filter(Boolean);
}

// "…/heroes/juggernaut.png?" → "juggernaut" (nome do vídeo animado da Valve)
const heroKey = (hero) => (hero?.img || '').split('/').pop().split('.')[0];

export default function AnimatedHeroCard() {
  // O herói mais disputado (escolhas + banimentos) de cada posição nas partidas profissionais recentes da OpenDota
  const [highlights, setHighlights] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [videoError, setVideoError] = useState(false);
  const [specialists, setSpecialists] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    Promise.all([fetchHeroStats(), fetchHeroPositions()]).then(([list, positions]) => {
      if (!active) return;
      const top = pickHighlights(list, positions);
      setHighlights(top);
      setSelectedId((id) => id ?? top[0]?.hero.id ?? null);
    });
    return () => { active = false; };
  }, []);

  const selected = highlights?.find((x) => x.hero.id === selectedId) || null;
  const selectedHero = selected?.hero || null;

  // Jogador que mais usou o herói nas ligas profissionais (mesma fonte da página do herói)
  useEffect(() => {
    if (!selectedId || specialists[selectedId] !== undefined) return undefined;
    let active = true;
    fetch(`/api/results?heroDetail=${selectedId}`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((data) => {
        if (active) setSpecialists((s) => ({ ...s, [selectedId]: data?.players?.[0] || null }));
      });
    return () => { active = false; };
  }, [selectedId, specialists]);

  const handleCardClick = (e) => {
    if (e.target.closest('button, a')) return;
    if (selectedHero) navigate(`/herois/${selectedHero.id}`);
  };

  const handleSelectHero = (hero) => {
    setSelectedId(hero.id);
    setVideoError(false);
  };

  if (highlights && !highlights.length) return null;

  const key = heroKey(selectedHero);
  const specialist = selectedHero ? specialists[selectedHero.id] : undefined;

  return (
    <div className="space-y-3">
      {/* CABEÇALHO DO CARD COM SELETOR RÁPIDO */}
      <div className="flex items-center justify-between px-1 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500 animate-spin-slow" />
          <span className="text-xs font-black uppercase tracking-wider text-white">Destaque do Meta</span>
        </div>

        {highlights && (
          <div className="flex flex-wrap items-center gap-1 text-[11px] font-bold p-1 rounded-xl bg-surface-2/80">
            {highlights.map(({ hero: h, position }) => (
              <button
                key={h.id}
                type="button"
                onClick={() => handleSelectHero(h)}
                title={position ? `Pos ${position.n} · ${position.label}` : undefined}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedId === h.id ? 'bg-blue-600 text-on-accent shadow-sm font-black' : 'text-gray-400 hover:text-white hover:bg-surface-3'
                }`}
              >
                {position && <span className="opacity-70 mr-1">{position.n}</span>}
                {h.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {!selectedHero ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      ) : (
        /* CARD 3D COM VÍDEO DO PERSONAGEM EM LOOP */
        <div
          onClick={handleCardClick}
          className="rounded-[20px] p-4 sm:p-5 relative overflow-hidden group cursor-pointer transition-colors hover:bg-surface-2/60"
        >
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center relative z-20">
            {/* VÍDEO ANIMADO (VALVE WEBM RENDER) */}
            <div className="sm:col-span-4 relative w-full h-32 sm:h-36 md:h-40 flex items-center justify-center overflow-hidden">
              <div
                className="absolute w-28 h-28 rounded-full blur-3xl opacity-35 dark:opacity-25 pointer-events-none animate-pulse"
                style={{ background: `radial-gradient(circle, ${ATTR_COLORS[selectedHero.attrCode] || '#2563EB'}, transparent 70%)` }}
              />
              {!videoError && key ? (
                <video
                  key={key}
                  autoPlay
                  loop
                  muted
                  playsInline
                  onError={() => setVideoError(true)}
                  className="w-full h-full object-contain filter drop-shadow-[0_10px_18px_rgba(0,0,0,0.22)] animate-hero-float"
                >
                  <source src={`https://cdn.cloudflare.steamstatic.com/apps/dota2/videos/dota_react/heroes/renders/${key}.webm`} type="video/webm" />
                </video>
              ) : (
                <img
                  src={selectedHero.img}
                  alt={selectedHero.name}
                  className="w-full h-full object-contain filter drop-shadow-[0_10px_18px_rgba(0,0,0,0.22)] animate-hero-float"
                />
              )}
            </div>

            {/* INFORMAÇÕES DAS PARTIDAS PROFISSIONAIS */}
            <div className="sm:col-span-8 space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1 mb-1 text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    <Flame className="w-3 h-3" />
                    {selected.position
                      ? `Mais disputado na Pos ${selected.position.n} · ${selected.position.label}`
                      : 'Mais disputado no profissional'}
                  </div>
                  <h4 className="text-xl font-black tracking-tight text-white truncate">{selectedHero.name}</h4>
                  <span className="text-[11px] font-semibold text-gray-400">
                    {[selectedHero.roles?.[0], selectedHero.primaryAttr].filter(Boolean).join(' • ')}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-lg font-black text-emerald-500 font-mono block">{selectedHero.proWinRate}%</span>
                  <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Vitórias (pro)</span>
                </div>
              </div>

              <p className="text-xs text-gray-300">
                Escolhido <strong className="text-white">{selectedHero.proPick}</strong> vezes e banido{' '}
                <strong className="text-white">{selectedHero.proBan}</strong> vezes nas partidas profissionais recentes.
              </p>

              <div className="px-3 py-2 rounded-xl bg-surface-2/70 flex items-center justify-between gap-2 text-[11px]">
                <span className="text-gray-400 font-medium shrink-0">Quem mais jogou (12 meses):</span>
                {specialist === undefined ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                ) : specialist ? (
                  <Link to={`/jogadores/${specialist.account_id}`} className="font-bold text-blue-600 dark:text-amber-500 truncate hover:underline">
                    {specialist.name || `Jogador ${specialist.account_id}`} ({specialist.games} {specialist.games === 1 ? 'partida' : 'partidas'})
                  </Link>
                ) : (
                  <span className="text-gray-500">—</span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to={`/herois/${selectedHero.id}`}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all text-on-accent bg-blue-600 hover:bg-blue-700 shadow-md"
                >
                  <span>Ver {selectedHero.name}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/herois"
                  className="inline-flex items-center justify-center px-3 py-2 rounded-xl text-[11px] font-bold text-gray-400 hover:text-white hover:bg-surface-2 ring-1 ring-line/70 transition-all"
                >
                  Todos os Heróis
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
