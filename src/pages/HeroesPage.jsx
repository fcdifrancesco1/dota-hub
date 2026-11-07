import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import HeroMetaView from '../components/HeroMetaView';
import { useApp } from '../context/AppContext';
import { usePageMeta } from '../utils/pageMeta';
import { fetchValveHeroList, heroVertImg, attrIcon } from '../services/valveData';
import { getHeroImg } from '../services/api';
import { ATTACK_LABELS, Diamonds, ROLE_LABELS } from '../components/HeroBits';

const ATTRS = [['str', 'Força'], ['agi', 'Agilidade'], ['int', 'Inteligência'], ['all', 'Universais']];
/** Página de heróis no estilo do cliente: sub-abas Heróis (grade por atributo) e Tendências (meta profissional). */
export default function HeroesPage() {
  const { setSelectedHero } = useApp();
  const [params, setParams] = useSearchParams();
  const tab = params.get('aba') === 'tendencias' ? 'trends' : 'grid';
  usePageMeta('Heróis', 'Todos os heróis de Dota 2 por atributo, com filtros e o meta das partidas profissionais.');

  const setTab = (t) => setParams(t === 'trends' ? { aba: 'tendencias' } : {}, { replace: true });

  return (
    <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-6 min-h-screen">
      <nav className="flex items-center justify-center gap-3 text-sm mb-6" aria-label="Seções de heróis">
        <button type="button" onClick={() => setTab('grid')} className={`dota-tab ${tab === 'grid' ? 'is-active' : ''}`}>Heróis</button>
        <span className="text-gray-600">/</span>
        <button type="button" onClick={() => setTab('trends')} className={`dota-tab ${tab === 'trends' ? 'is-active' : ''}`}>Tendências</button>
      </nav>
      {tab === 'grid' ? <HeroGrid /> : <HeroMetaView onSelectHero={setSelectedHero} />}
    </div>
  );
}

function HeroGrid() {
  const { constants } = useApp();
  const [valveHeroes, setValveHeroes] = useState({});
  const [search, setSearch] = useState('');
  const [attack, setAttack] = useState('');
  const [complexity, setComplexity] = useState(0);
  const [role, setRole] = useState('');

  useEffect(() => { fetchValveHeroList().then(setValveHeroes); }, []);

  const heroes = useMemo(
    () => Object.values(constants?.heroes || {}).sort((a, b) => a.localized_name.localeCompare(b.localized_name)),
    [constants]
  );
  const filtering = Boolean(search || attack || complexity || role);
  const q = search.trim().toLowerCase();
  const matches = (h) => (!q || h.localized_name.toLowerCase().includes(q))
    && (!attack || h.attack_type === attack)
    && (!complexity || valveHeroes[h.id]?.complexity === complexity)
    && (!role || (h.roles || []).includes(role));

  const clear = () => { setSearch(''); setAttack(''); setComplexity(0); setRole(''); };

  return (
    <div className="space-y-6">
      {/* Filtros, como a barra de baixo da grade do cliente */}
      <div className="glass-panel rounded-xl px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs">
        <label className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar herói"
            aria-label="Buscar herói pelo nome"
            className="w-full bg-black/30 border border-line rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:border-gray-500"
          />
        </label>

        <div className="flex items-center gap-2">
          <span className="dota-heading text-[11px] text-gray-400">Tipo de ataque</span>
          {Object.entries(ATTACK_LABELS).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setAttack(attack === value ? '' : value)}
              aria-pressed={attack === value}
              className={`px-2.5 py-1.5 rounded-md border transition-colors ${attack === value ? 'bg-white/15 border-gray-400 text-white' : 'border-line text-gray-400 hover:text-white'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="dota-heading text-[11px] text-gray-400">Complexidade</span>
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setComplexity(complexity === n ? 0 : n)}
              aria-pressed={complexity === n}
              title={`Complexidade ${n}`}
              className={`px-2 py-1.5 rounded-md border transition-colors ${complexity === n ? 'bg-white/15 border-gray-400' : 'border-line opacity-60 hover:opacity-100'}`}
            >
              <Diamonds value={n} size="w-2 h-2" />
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2">
          <span className="dota-heading text-[11px] text-gray-400">Função</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="bg-black/30 border border-line rounded-lg px-2.5 py-1.5 text-sm text-white outline-none focus:border-gray-500"
          >
            <option value="">Todas</option>
            {Object.entries(ROLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>

        {filtering && (
          <button type="button" onClick={clear} className="ml-auto inline-flex items-center gap-1 text-gray-400 hover:text-white transition-colors">
            <X className="w-3.5 h-3.5" /> Limpar filtros
          </button>
        )}
      </div>

      {/* Grade por atributo principal */}
      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-2 2xl:grid-cols-4">
        {ATTRS.map(([attr, label]) => (
          <section key={attr}>
            <h2 className="dota-heading text-sm flex items-center gap-2 mb-3">
              <img src={attrIcon(attr)} alt="" className="w-5 h-5" />
              {label}
            </h2>
            <div className="grid grid-cols-6 gap-1.5">
              {heroes.filter((h) => h.primary_attr === attr).map((h) => (
                <HeroTile key={h.id} hero={h} dim={filtering && !matches(h)} constants={constants} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function HeroTile({ hero, dim, constants }) {
  const short = hero.name.replace('npc_dota_hero_', '');
  const [src, setSrc] = useState(heroVertImg(short));
  return (
    <Link
      to={`/herois/${hero.id}`}
      title={hero.localized_name}
      aria-label={hero.localized_name}
      className={`group relative block aspect-[235/272] overflow-hidden bg-black/40 ring-1 ring-black/60 transition-[opacity,filter] ${
        dim ? 'opacity-20 grayscale' : 'hover:ring-gray-300 hover:brightness-110'
      }`}
    >
      {/* Herói novo sem retrato vertical: usa o horizontal recortado */}
      <img src={src} alt="" loading="lazy" onError={() => setSrc(getHeroImg(hero.id, constants))} className="w-full h-full object-cover" />
      <span className="absolute inset-x-0 bottom-0 px-1 py-0.5 bg-black/75 text-[11px] leading-tight text-white text-center truncate opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
        {hero.localized_name}
      </span>
    </Link>
  );
}
