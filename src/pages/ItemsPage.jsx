import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Clock, Droplet, Loader2, Search } from 'lucide-react';
import { usePageMeta } from '../utils/pageMeta';
import { useApp } from '../context/AppContext';
import { SHOP_BASIC, SHOP_UPGRADES } from '../data/itemShop';
import { fetchValveItem, fetchValveItemList, itemImg } from '../services/valveData';
import { itemBonuses, itemDescriptionBlocks } from '../utils/valveText';

// Classes de itens neutros e a partir de quando caem na partida
const NEUTRAL_TIERS = [['Classe 1', '0:00+'], ['Classe 2', '15:00+'], ['Classe 3', '25:00+'], ['Classe 4', '35:00+'], ['Classe 5', '60:00+']];
const GOLD_ICON = 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/icons/gold.png';

/** Itens no layout da loja do cliente, com a ficha em português ao lado. */
export default function ItemsPage() {
  usePageMeta('Itens', 'Todos os itens de Dota 2 em português: loja, aprimoramentos, itens neutros, bônus, custo e descrição.');
  const [params, setParams] = useSearchParams();
  const [list, setList] = useState(null);
  const [search, setSearch] = useState('');
  const detailsRef = useRef(null);

  useEffect(() => { fetchValveItemList().then(setList); }, []);

  const byName = useMemo(() => Object.fromEntries((list || []).map((i) => [i.name.replace(/^item_/, ''), i])), [list]);
  const neutralTiers = useMemo(() => NEUTRAL_TIERS.map((_, tier) => (list || []).filter((i) => i.neutral_item_tier === tier)), [list]);
  const enchantments = useMemo(() => (list || []).filter((i) => /^item_enhancement_/.test(i.name)), [list]);

  const selected = params.get('item') || 'blink';
  const select = (name) => {
    setParams({ item: name }, { replace: true });
    // No celular o painel de detalhes fica embaixo da loja
    if (window.innerWidth < 1280) detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const q = search.trim().toLowerCase();
  const dim = (item) => Boolean(q) && !(item?.name_loc || '').toLowerCase().includes(q) && !(item?.name_english_loc || '').toLowerCase().includes(q);
  const tile = (item, key) => item && (
    <ItemTile key={key || item.name} item={item} active={selected === item.name.replace(/^item_/, '')} dim={dim(item)} onSelect={select} />
  );

  if (!list) {
    return (
      <div className="py-24 flex flex-col items-center gap-3 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span className="text-xs">Carregando itens da Valve...</span>
      </div>
    );
  }

  return (
    <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-6 min-h-screen space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="dota-heading text-lg !text-white">Itens</h1>
        <label className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar item"
            aria-label="Buscar item pelo nome"
            className="w-full bg-black/30 border border-line rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:border-gray-500"
          />
        </label>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_0.85fr_minmax(320px,0.95fr)] items-start">
        <ShopPanel title="Básico">
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            {SHOP_BASIC.map((cat) => (
              <Category key={cat.key} label={cat.label}>{cat.items.map((n) => tile(byName[n], n))}</Category>
            ))}
          </div>
        </ShopPanel>

        <ShopPanel title="Aprimoramentos">
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            {SHOP_UPGRADES.map((cat) => (
              <Category key={cat.key} label={cat.label}>{cat.items.map((n) => tile(byName[n], n))}</Category>
            ))}
          </div>
        </ShopPanel>

        <ShopPanel title="Itens neutros">
          <div className="space-y-4">
            {NEUTRAL_TIERS.map(([label, time], tier) => (
              <Category key={label} label={label} extra={<span className="flex items-center gap-1 font-mono"><Clock className="w-3 h-3" />{time}</span>} cols="grid-cols-6">
                {neutralTiers[tier].map((i) => tile(i))}
              </Category>
            ))}
            {enchantments.length > 0 && (
              <Category label="Encantamentos neutros" cols="grid-cols-6">{enchantments.map((i) => tile(i))}</Category>
            )}
          </div>
        </ShopPanel>

        <div ref={detailsRef} className="xl:sticky xl:top-20 scroll-mt-20">
          <ShopPanel title="Detalhes do item">
            <ItemDetails item={byName[selected]} byName={byName} onSelect={select} />
          </ShopPanel>
        </div>
      </div>
    </div>
  );
}

function ShopPanel({ title, children }) {
  return (
    <section className="glass-panel rounded-lg p-4">
      <h2 className="dota-heading text-xs text-center mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Category({ label, extra, cols = 'grid-cols-4', children }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1.5">
        <span className="uppercase tracking-wider">{label}</span>
        {extra}
      </div>
      <div className={`grid ${cols} gap-1`}>{children}</div>
    </div>
  );
}

function ItemTile({ item, active, dim, onSelect }) {
  const short = item.name.replace(/^item_/, '');
  return (
    <button
      type="button"
      onClick={() => onSelect(short)}
      title={item.name_loc}
      aria-label={item.name_loc}
      aria-pressed={active}
      className={`aspect-[11/8] overflow-hidden rounded-sm bg-black/40 transition-[opacity,filter,box-shadow] ${
        active ? 'ring-2 ring-amber-400' : 'ring-1 ring-black/70 hover:brightness-125'
      } ${dim ? 'opacity-20 grayscale' : ''}`}
    >
      <img src={itemImg(short)} alt="" loading="lazy" className="w-full h-full object-cover" />
    </button>
  );
}

/** Ficha do item: bônus, descrição (ativa/passiva), custo, recarga, receita, notas e lore. */
function ItemDetails({ item, byName, onSelect }) {
  const { constants } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0); // muda para buscar de novo após uma falha

  useEffect(() => {
    if (!item) return undefined;
    let cancelled = false;
    setLoading(true);
    fetchValveItem(item.id).then((d) => {
      if (!cancelled) { setData(d); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [item, attempt]);

  if (!item) return <p className="text-xs text-gray-400 text-center py-8">Escolha um item.</p>;
  if (loading || !data) {
    return (
      <div className="py-10 flex justify-center text-gray-400">
        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
          <div className="text-center space-y-3">
            <p className="text-xs">Não foi possível carregar o item.</p>
            <button type="button" onClick={() => setAttempt((n) => n + 1)} className="btn-dota rounded px-4 py-2 text-xs">Tentar novamente</button>
          </div>
        )}
      </div>
    );
  }

  const short = item.name.replace(/^item_/, '');
  const bonuses = itemBonuses(data);
  const blocks = itemDescriptionBlocks(data);
  // Receita: componentes do item pela constante da OpenDota (nomes internos sem "item_")
  const components = constants?.itemsById?.[item.id]?.components || [];
  const cooldown = data.cooldowns?.find((c) => c > 0);
  const mana = data.mana_costs?.find((m) => m > 0);

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-start gap-3">
        <img src={itemImg(short)} alt="" className="w-[88px] h-16 rounded-sm ring-1 ring-black/70 object-cover shrink-0" />
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-white leading-tight">{data.name_loc}</h3>
          {data.item_cost > 0 && (
            <div className="flex items-center gap-1.5 mt-1 text-amber-300 font-mono">
              <img src={GOLD_ICON} alt="" className="w-4 h-4" /> {data.item_cost.toLocaleString('pt-BR')}
            </div>
          )}
        </div>
      </div>

      {bonuses.length > 0 && (
        <ul className="space-y-0.5 text-gray-200">
          {bonuses.map((b) => <li key={b}>{b}</li>)}
        </ul>
      )}

      {blocks.map((b, i) => (
        <div key={i} className="rounded bg-black/30 border border-white/5 overflow-hidden">
          {b.title && <div className="px-3 py-1.5 bg-white/[0.04] text-[13px] font-semibold text-sky-200">{b.title}</div>}
          <p className="px-3 py-2 text-gray-300 leading-relaxed whitespace-pre-line">{b.text}</p>
        </div>
      ))}

      {(cooldown || mana) && (
        <div className="flex gap-5 text-xs font-mono text-gray-300">
          {cooldown && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-500" /> {cooldown}s</span>}
          {mana && <span className="flex items-center gap-1.5"><Droplet className="w-4 h-4 text-blue-400" /> {mana}</span>}
        </div>
      )}

      {data.notes_loc?.length > 0 && (
        <ul className="text-xs text-gray-400 space-y-1 list-disc pl-5">
          {data.notes_loc.map((n) => <li key={n}>{n}</li>)}
        </ul>
      )}

      {components.length > 0 && (
        <div>
          <div className="dota-heading text-[11px] text-gray-400 mb-1.5">Receita</div>
          <div className="flex flex-wrap gap-1">
            {components.map((c, i) => (
              <button key={`${c}-${i}`} type="button" onClick={() => onSelect(c)} title={byName[c]?.name_loc || c} className="w-11 h-8 rounded-sm overflow-hidden ring-1 ring-black/70 hover:brightness-125">
                <img src={itemImg(c)} alt={byName[c]?.name_loc || c} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {data.lore_loc && <p className="text-xs text-gray-500 border-l-2 border-white/10 pl-3">{data.lore_loc}</p>}
    </div>
  );
}
