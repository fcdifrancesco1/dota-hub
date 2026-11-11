import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePageMeta } from '../utils/pageMeta';
import { ArrowLeft, ArrowRight, Clock, Droplet, Info, Loader2 } from 'lucide-react';
import { fetchHeroFullDetails, getHeroImg, getHeroName } from '../services/api';
import { attrIcon } from '../services/valveData';
import { useApp } from '../context/AppContext';
import { ATTACK_LABELS, Diamonds, ROLE_LABELS } from '../components/HeroBits';

// Cor de fundo atrás do herói, pelo atributo principal (como o palco do cliente)
const ATTR_GLOW = { str: '178, 34, 34', agi: '34, 139, 70', int: '40, 110, 190', all: '120, 60, 170' };
const ATTR_NAMES = { str: 'Força', agi: 'Agilidade', int: 'Inteligência', all: 'Universal' };
const TABS = [['overview', 'Visão geral'], ['talents', 'Talentos'], ['pro', 'Profissional'], ['lore', 'História']];

const fmt = (n, digits = 1) => (n == null ? '—' : Number.isInteger(n) ? String(n) : n.toFixed(digits));

export default function HeroDetailPage() {
  const { id } = useParams();
  const { constants } = useApp();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAbility, setSelectedAbility] = useState(null);
  const [videoError, setVideoError] = useState(false);
  const [tab, setTab] = useState('overview');
  // Itens e jogadores do herói nas partidas profissionais (OpenDota Explorer)
  const [proData, setProData] = useState(null);
  const [proLoading, setProLoading] = useState(true);

  const heroObj = constants?.heroes?.[id] || { id, localized_name: `Herói #${id}` };
  const heroName = heroObj.localized_name || getHeroName(id, constants);
  usePageMeta(heroObj.localized_name, heroObj.localized_name ? `Habilidades, atributos, itens mais comprados e especialistas de ${heroObj.localized_name} no Dota 2 profissional.` : null);
  const heroRawKey = heroObj?.name ? heroObj.name.replace('npc_dota_hero_', '') : '';
  const heroInternalName = constants?.heroes?.[id]?.name;

  // Herói anterior e seguinte em ordem alfabética, como as setas do cliente
  const [prevHero, nextHero] = useMemo(() => {
    const list = Object.values(constants?.heroes || {}).sort((a, b) => a.localized_name.localeCompare(b.localized_name));
    const i = list.findIndex((h) => String(h.id) === String(id));
    if (i < 0) return [null, null];
    return [list[(i - 1 + list.length) % list.length], list[(i + 1) % list.length]];
  }, [constants, id]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setVideoError(false);
    setTab('overview');
    window.scrollTo(0, 0);
    fetchHeroFullDetails(id, heroInternalName || `npc_dota_hero_${id}`).then((data) => {
      if (cancelled) return;
      setDetails(data);
      setSelectedAbility(data?.abilities?.[0] || null);
      setLoading(false);
    }).catch(() => { if (!cancelled) setLoading(false); });
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

  const sheet = details?.sheet;
  const attr = heroObj.primary_attr;
  const glow = ATTR_GLOW[attr] || ATTR_GLOW.all;

  return (
    <div className="min-h-screen">
      {/* Sub-navegação do herói: anterior, abas e seguinte */}
      <div className="border-b border-black/60 bg-black/30">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between gap-4 text-xs">
          {prevHero ? (
            <Link to={`/herois/${prevHero.id}`} className="dota-tab flex items-center gap-2 min-w-0">
              <ArrowLeft className="w-4 h-4 shrink-0" /><span className="truncate hidden sm:inline">{prevHero.localized_name}</span>
            </Link>
          ) : <span />}
          <nav className="flex items-center gap-3 sm:gap-4" aria-label="Seções do herói">
            {TABS.map(([key, label], i) => (
              <React.Fragment key={key}>
                {i > 0 && <span className="text-gray-600">/</span>}
                <button type="button" onClick={() => setTab(key)} className={`dota-tab text-xs sm:text-sm ${tab === key ? 'is-active' : ''}`}>{label}</button>
              </React.Fragment>
            ))}
          </nav>
          {nextHero ? (
            <Link to={`/herois/${nextHero.id}`} className="dota-tab flex items-center gap-2 min-w-0 justify-end">
              <span className="truncate hidden sm:inline">{nextHero.localized_name}</span><ArrowRight className="w-4 h-4 shrink-0" />
            </Link>
          ) : <span />}
        </div>
      </div>

      {/* Palco do herói */}
      <section
        className="relative overflow-hidden"
        style={{ background: `radial-gradient(ellipse 45% 70% at 52% 55%, rgba(${glow}, 0.32), transparent 70%)` }}
      >
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 grid gap-8 lg:grid-cols-12 items-center">
          {/* Ficha à esquerda */}
          <div className="lg:col-span-5 space-y-5 relative z-10">
            <Link to="/herois" className="dota-tab inline-flex items-center gap-2 text-[11px]">
              <ArrowLeft className="w-3.5 h-3.5" /> Todos os heróis
            </Link>
            <h1 className="text-4xl sm:text-6xl font-semibold uppercase tracking-wide text-white leading-none">{heroName}</h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
              {attr && <img src={attrIcon(attr)} alt={ATTR_NAMES[attr]} title={ATTR_NAMES[attr]} className="w-6 h-6" />}
              {sheet?.complexity ? <Diamonds value={sheet.complexity} /> : null}
              <span className="dota-heading text-[11px] text-gray-400">
                Tipo de ataque: <span className="text-white">{ATTACK_LABELS[heroObj.attack_type] || '—'}</span>
              </span>
            </div>
            {heroObj.roles?.length > 0 && (
              <p className="text-xs text-gray-400">{heroObj.roles.map((r) => ROLE_LABELS[r] || r).join(' · ')}</p>
            )}

            {/* Habilidades: clique para ver a descrição */}
            {details?.abilities?.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {details.abilities.map((ab) => (
                  <button
                    key={ab.name}
                    type="button"
                    onClick={() => { setSelectedAbility(ab); setTab('overview'); }}
                    title={ab.dname}
                    aria-label={ab.dname}
                    aria-pressed={selectedAbility?.name === ab.name}
                    className={`w-12 h-12 rounded-md overflow-hidden ring-1 transition-[box-shadow,filter] ${
                      selectedAbility?.name === ab.name ? 'ring-2 ring-gray-200' : 'ring-black/70 hover:brightness-125'
                    }`}
                  >
                    {/* Habilidade sem ícone na Valve (inata ou oculta): esconde o botão inteiro */}
                    <img src={ab.img} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }} />
                  </button>
                ))}
              </div>
            )}

            {sheet && <HeroSheet sheet={sheet} attr={attr} />}

            {sheet?.hype && <p className="text-sm text-gray-300 leading-relaxed max-w-xl">{sheet.hype}</p>}
          </div>

          {/* Herói animado no centro */}
          <div className="lg:col-span-4 h-72 sm:h-96 lg:h-[520px] flex items-center justify-center">
            {heroRawKey && !videoError ? (
              <video
                key={heroRawKey}
                autoPlay
                loop
                muted
                playsInline
                onError={() => setVideoError(true)}
                className="w-full h-full object-contain"
              >
                <source src={`https://cdn.cloudflare.steamstatic.com/apps/dota2/videos/dota_react/heroes/renders/${heroRawKey}.webm`} type="video/webm" />
              </video>
            ) : (
              <img src={getHeroImg(id, constants)} alt={heroName} className="w-72 object-contain" />
            )}
          </div>

          {/* Resumo profissional à direita */}
          <aside className="lg:col-span-3 glass-panel rounded-xl p-5 space-y-4">
            <h2 className="dota-heading text-xs">No cenário profissional</h2>
            {proLoading ? (
              <div className="flex items-center gap-2 text-xs text-gray-400"><Loader2 className="w-4 h-4 animate-spin" /> Carregando…</div>
            ) : !proData ? (
              <p className="text-xs text-gray-400">Dados indisponíveis no momento (OpenDota).</p>
            ) : (
              <>
                <div>
                  <div className="text-3xl font-semibold text-white font-mono">{(proData.totalGames || 0).toLocaleString('pt-BR')}</div>
                  <div className="text-xs text-gray-400">partidas profissionais nos últimos 180 dias</div>
                </div>
                {proData.items?.length > 0 && (
                  <div>
                    <div className="dota-heading text-[11px] text-gray-400 mb-2">Itens mais comprados</div>
                    <div className="flex flex-wrap gap-1.5">
                      {proData.items.slice(0, 6).map((item) => item.img && (
                        <img key={item.key} src={item.img} alt={item.name} title={item.name} className="w-11 h-8 rounded object-cover ring-1 ring-black/70" />
                      ))}
                    </div>
                  </div>
                )}
                {proData.players?.length > 0 && (
                  <div>
                    <div className="dota-heading text-[11px] text-gray-400 mb-2">Especialistas</div>
                    <ul className="space-y-1.5">
                      {proData.players.slice(0, 3).map((p) => (
                        <li key={p.account_id} className="flex items-center justify-between gap-2 text-xs">
                          <Link to={`/jogadores/${p.account_id}`} className="text-white hover:text-amber-400 truncate">{p.name || `Jogador ${p.account_id}`}</Link>
                          <span className="text-gray-400 font-mono shrink-0">{p.games} jogos</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <button type="button" onClick={() => setTab('pro')} className="btn-dota w-full rounded py-2.5 text-xs">
                  Ver no profissional
                </button>
              </>
            )}
          </aside>
        </div>
      </section>

      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <span className="text-xs font-medium">Carregando habilidades da Valve...</span>
          </div>
        ) : !details ? (
          <div className="glass-panel rounded-xl p-10 text-center max-w-lg mx-auto my-8">
            <Info className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <h2 className="text-base font-semibold text-white mb-2">Dados do herói temporariamente indisponíveis</h2>
            <p className="text-xs text-gray-400 mb-6">Não foi possível carregar as habilidades deste herói agora.</p>
            <button onClick={() => window.location.reload()} className="btn-dota rounded px-5 py-2.5 text-xs">Tentar novamente</button>
          </div>
        ) : tab === 'overview' ? (
          <OverviewTab ability={selectedAbility} aghs={details.aghs} />
        ) : tab === 'talents' ? (
          <TalentsTab talents={details.talents} />
        ) : tab === 'lore' ? (
          <LoreTab name={heroName} bio={sheet?.bio} />
        ) : (
          <ProTab details={details} proData={proData} proLoading={proLoading} constants={constants} />
        )}
      </div>
    </div>
  );
}

/** Atributos, combate e barras de vida/mana no nível 1, como a ficha do cliente. */
function HeroSheet({ sheet, attr }) {
  const attrs = [['str', 'Força'], ['agi', 'Agilidade'], ['int', 'Inteligência']];
  const combat = [
    ['Dano', `${sheet.damage[0]} - ${sheet.damage[1]}`],
    ['Armadura', fmt(sheet.armor)],
    ['Velocidade', sheet.moveSpeed],
    ['Intervalo de ataque', fmt(sheet.attackRate)],
    ['Alcance', sheet.attackRange],
    ['Resist. a magia', `${sheet.magicResist}%`]
  ];
  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 border-y border-white/10 py-4 max-w-xl">
      <div className="space-y-2.5 pr-6 border-r border-white/10">
        {attrs.map(([key, label]) => (
          <div key={key}>
            <div className={`text-[11px] uppercase tracking-wider ${attr === key ? 'text-white' : 'text-gray-500'}`}>{label}</div>
            <div className="flex items-center gap-1.5 text-sm font-mono">
              <img src={attrIcon(key)} alt="" className="w-4 h-4" />
              <span className="text-white font-semibold">{sheet[key][0]}</span>
              <span className="text-gray-400">+ {fmt(sheet[key][1])}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-x-4 gap-y-2">
          {combat.map(([label, value]) => (
            <div key={label}>
              <div className="text-[11px] text-gray-500 truncate">{label}</div>
              <div className="text-sm text-white font-mono">{value}</div>
            </div>
          ))}
        </div>
        <Bar label="Vida máxima" value={sheet.health[0]} regen={sheet.health[1]} className="from-[#3E8A2E] to-[#2F6E22]" />
        <Bar label="Mana máximo" value={sheet.mana[0]} regen={sheet.mana[1]} className="from-[#2F6FB5] to-[#255A94]" />
      </div>
    </div>
  );
}

function Bar({ label, value, regen, className }) {
  return (
    <div>
      <div className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">{label}</div>
      <div className={`relative h-6 rounded-sm bg-gradient-to-b ${className} flex items-center justify-center text-sm font-semibold text-white font-mono shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]`}>
        {value}
        <span className="absolute right-2 text-[11px] text-white/80">+{fmt(regen)}</span>
      </div>
    </div>
  );
}

function OverviewTab({ ability, aghs }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {ability ? (
        <section className="glass-panel rounded-xl p-6 lg:col-span-2 space-y-4">
          <div className="flex items-start gap-4">
            <img src={ability.img} alt="" className="w-16 h-16 rounded-md ring-1 ring-black/70 shrink-0" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
            <div className="min-w-0 space-y-1">
              <h2 className="dota-heading text-lg !text-white">{ability.dname}</h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                {ability.behavior && <span>Alvo: <span className="text-gray-200">{ability.behavior}</span></span>}
                {ability.dmg_type && <span>Dano: <span className="text-gray-200">{ability.dmg_type}</span></span>}
                {ability.bkbpierce && <span>Atravessa imunidade: <span className="text-gray-200">{ability.bkbpierce}</span></span>}
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-200 leading-relaxed">{ability.desc || 'Sem descrição disponível.'}</p>
          {ability.notes?.length > 0 && (
            <ul className="text-xs text-gray-400 space-y-1 list-disc pl-5">
              {ability.notes.map((n) => <li key={n}>{n}</li>)}
            </ul>
          )}
          {(ability.cd || ability.mc) && (
            <div className="flex flex-wrap gap-5 text-xs font-mono pt-1">
              {ability.cd && <span className="flex items-center gap-1.5 text-gray-300"><Clock className="w-4 h-4 text-gray-500" /> {ability.cd}s</span>}
              {ability.mc && <span className="flex items-center gap-1.5 text-gray-300"><Droplet className="w-4 h-4 text-blue-400" /> {ability.mc}</span>}
            </div>
          )}
          {ability.lore && <p className="text-xs text-gray-500 border-l-2 border-white/10 pl-3">{ability.lore}</p>}
        </section>
      ) : <div className="lg:col-span-2" />}

      <div className="space-y-4">
        {[
          ['ultimate_scepter', 'Cetro de Aghanim', aghs?.scepter_skill_name, aghs?.scepter_desc],
          ['aghanims_shard', 'Fragmento de Aghanim', aghs?.shard_skill_name, aghs?.shard_desc]
        ].map(([img, label, name, desc]) => (
          <section key={img} className="glass-panel rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-3">
              <img src={`https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/${img}.png`} alt="" className="w-10 h-8 rounded object-cover ring-1 ring-black/70" />
              <div className="min-w-0">
                <div className="dota-heading text-[11px] text-gray-400">{label}</div>
                <div className="text-sm text-white font-semibold truncate">{name}</div>
              </div>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">{desc}</p>
          </section>
        ))}
      </div>
    </div>
  );
}

function TalentsTab({ talents = [] }) {
  return (
    <section className="glass-panel rounded-xl p-6 max-w-3xl mx-auto">
      <h2 className="dota-heading text-sm text-center mb-5">Árvore de talentos</h2>
      <div className="space-y-2">
        {talents.map((t) => (
          <div key={t.level} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-sm">
            <div className="text-right text-gray-200 bg-black/25 rounded px-3 py-2.5">{t.left}</div>
            <div className="w-11 h-11 rounded-full border border-amber-500/60 text-amber-400 font-semibold flex items-center justify-center font-mono">{t.level}</div>
            <div className="text-gray-200 bg-black/25 rounded px-3 py-2.5">{t.right}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function LoreTab({ name, bio = [] }) {
  return (
    <section className="glass-panel rounded-xl p-6 sm:p-8 max-w-3xl mx-auto">
      <h2 className="dota-heading text-sm text-center mb-5">História{name ? ` de ${name}` : ''}</h2>
      {bio.length === 0 ? (
        <p className="text-sm text-gray-400 text-center">A história deste herói não está disponível agora.</p>
      ) : (
        <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
          {bio.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      )}
    </section>
  );
}

function ProTab({ details, proData, proLoading, constants }) {
  const pct = (wins, games) => (games ? ((wins / games) * 100).toFixed(1) : '0.0');
  const minutes = (sec) => (sec > 0 ? `${Math.round(sec / 60)} min` : 'início');
  const bench = details.benchmarks || {};
  const benchItems = [
    ['GPM', bench.gpm], ['XPM', bench.xpm], ['Dano em heróis / min', bench.damage]
  ].filter(([, v]) => v?.p50);

  return (
    <div className="space-y-6">
      {benchItems.length > 0 && (
        <section className="glass-panel rounded-xl p-6">
          <h2 className="dota-heading text-sm mb-4">Médias com o herói (todas as partidas, OpenDota)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {benchItems.map(([label, v]) => (
              <div key={label}>
                <div className="text-xs text-gray-400">{label}</div>
                <div className="text-2xl font-semibold text-white font-mono">{v.p50}</div>
                <div className="text-[11px] text-gray-500 font-mono">Top 25%: {v.p75} · Top 10%: {v.p90}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass-panel rounded-xl p-6 space-y-3">
          <h2 className="dota-heading text-sm">Itens mais comprados</h2>
          <p className="text-xs text-gray-400">Ligas profissionais, últimos 180 dias{proData?.totalGames ? `, ${proData.totalGames} partidas` : ''}.</p>
          {proLoading ? (
            <div className="flex items-center gap-2 text-xs text-gray-400 py-4"><Loader2 className="w-4 h-4 animate-spin" /> Carregando…</div>
          ) : !proData?.items?.length ? (
            <p className="text-xs text-gray-400 py-4">{proData ? 'Sem partidas profissionais com este herói no período.' : 'Dados indisponíveis no momento (OpenDota).'}</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {proData.items.map((item) => (
                <li key={item.key} className="flex items-center gap-3 py-2">
                  {item.img && <img src={item.img} alt="" loading="lazy" className="w-11 h-8 rounded object-cover ring-1 ring-black/70" />}
                  <span className="text-sm text-white flex-1 truncate">{item.name}</span>
                  <span className="text-xs text-gray-400 font-mono w-20 text-right">{minutes(item.avgTime)}</span>
                  <span className="text-xs text-gray-400 font-mono w-16 text-right">{item.games} jogos</span>
                  <span className="text-xs text-emerald-400 font-mono w-14 text-right">{pct(item.wins, item.games)}%</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="glass-panel rounded-xl p-6 space-y-3">
          <h2 className="dota-heading text-sm">Especialistas no cenário mundial</h2>
          <p className="text-xs text-gray-400">Quem mais jogou o herói nas ligas profissionais (últimos 365 dias).</p>
          {proLoading ? (
            <div className="flex items-center gap-2 text-xs text-gray-400 py-4"><Loader2 className="w-4 h-4 animate-spin" /> Carregando…</div>
          ) : !proData?.players?.length ? (
            <p className="text-xs text-gray-400 py-4">{proData ? 'Nenhum jogador profissional usou este herói no período.' : 'Dados indisponíveis no momento (OpenDota).'}</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {proData.players.map((p) => (
                <li key={p.account_id}>
                  <Link to={`/jogadores/${p.account_id}`} className="flex items-center justify-between gap-3 py-2 hover:bg-white/[0.03] -mx-2 px-2 rounded transition-colors">
                    <div className="min-w-0">
                      <div className="text-sm text-white truncate">{p.name || `Jogador ${p.account_id}`}</div>
                      <div className="text-xs text-gray-500">{p.team_name || 'Sem time'}</div>
                    </div>
                    <div className="text-right font-mono shrink-0">
                      <div className="text-xs text-emerald-400">{pct(p.wins, p.games)}%</div>
                      <div className="text-[11px] text-gray-500">{p.games} {p.games === 1 ? 'partida' : 'partidas'}</div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {[['Melhores confrontos', details.bestMatchups, 'text-emerald-400'], ['Piores confrontos', details.worstMatchups, 'text-rose-400']].map(([title, list, tone]) => (
          <section key={title} className="glass-panel rounded-xl p-6 space-y-3">
            <h2 className="dota-heading text-sm">{title}</h2>
            <ul className="divide-y divide-white/5">
              {(list || []).map((m) => (
                <li key={m.hero_id}>
                  <Link to={`/herois/${m.hero_id}`} className="flex items-center justify-between gap-3 py-2 hover:bg-white/[0.03] -mx-2 px-2 rounded transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={getHeroImg(m.hero_id, constants)} alt="" className="w-11 h-7 rounded object-cover ring-1 ring-black/70" />
                      <span className="text-sm text-white truncate">{getHeroName(m.hero_id, constants)}</span>
                    </div>
                    <div className="text-right font-mono shrink-0">
                      <div className={`text-xs ${tone}`}>{m.winRate}%</div>
                      <div className="text-[11px] text-gray-500">{m.games_played} jogos</div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
