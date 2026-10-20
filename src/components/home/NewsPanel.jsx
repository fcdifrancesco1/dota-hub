import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, ArrowRightLeft, ExternalLink, Loader2 } from 'lucide-react';
import { fetchNews } from '../../services/api';
import TeamLogo from '../../utils/teamLogos';
import { teamPath } from '../../utils/teamRoute';

const NEWS_SHOWN = 8;
const TRANSFERS_SHOWN = 10;

// "há 5 min", "há 3 h", "há 2 dias", ou a data
function timeAgo(ms) {
  if (!ms) return '';
  const diff = Date.now() - ms;
  const min = Math.floor(diff / 60000);
  if (min < 60) return `há ${Math.max(1, min)} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `há ${d} ${d === 1 ? 'dia' : 'dias'}`;
  return new Date(ms).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

const fmtDate = (iso) => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '');

const SOURCE_STYLE = {
  Valve: 'bg-red-500/10 text-red-400 border-red-500/30',
  Dotabuff: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
};

function TeamTag({ side }) {
  if (!side?.name) return <span className="text-gray-500 italic">sem time</span>;
  const path = teamPath(null, side.name);
  return (
    <Link to={path} className="inline-flex items-center gap-1 min-w-0 hover:text-amber-400" title={side.name}>
      <TeamLogo teamName={side.name} logoUrl={side.logo} className="w-4 h-4 shrink-0" />
      <span className="truncate">{side.name}</span>
    </Link>
  );
}

/** Notícias e transferências de Dota 2 (coluna lateral da página inicial). */
export default function NewsPanel() {
  const [tab, setTab] = useState('news'); // 'news' | 'transfers'
  const [data, setData] = useState(null);

  useEffect(() => {
    let active = true;
    fetchNews().then((d) => { if (active) setData(d); });
    return () => { active = false; };
  }, []);

  const news = (data?.news || []).slice(0, NEWS_SHOWN);
  const transfers = (data?.transfers || []).slice(0, TRANSFERS_SHOWN);

  return (
    <aside className="glass-panel rounded-3xl p-5 sm:p-6 shadow-xl border border-line">
      <div className="flex items-center gap-1.5 pb-3 mb-4 border-b border-line">
        {[['news', 'Notícias', Newspaper], ['transfers', 'Transferências', ArrowRightLeft]].map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
              tab === id ? 'bg-blue-600 text-on-accent shadow-md shadow-blue-500/25' : 'text-gray-400 hover:text-white hover:bg-surface-2'
            }`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {!data ? (
        <div className="py-10 flex flex-col items-center gap-2 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
          <span className="text-xs">Carregando...</span>
        </div>
      ) : tab === 'news' ? (
        news.length === 0 ? (
          <p className="py-8 text-center text-xs text-gray-500">Não foi possível carregar as notícias agora.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-1">
            {news.map((n) => (
              <li key={n.id}>
                <a
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-3 group"
                  title={n.summary || n.title}
                >
                  {n.image ? (
                    <img
                      src={n.image}
                      alt=""
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="w-20 h-14 rounded-lg object-cover border border-line shrink-0 bg-surface-2"
                      onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                    />
                  ) : (
                    <div className="w-20 h-14 rounded-lg bg-surface-2 border border-line shrink-0 flex items-center justify-center">
                      <Newspaper className="w-5 h-5 text-gray-500" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[10px] mb-0.5">
                      <span className={`px-1.5 py-px rounded border font-bold ${SOURCE_STYLE[n.source] || 'bg-white/5 text-gray-400 border-line'}`}>{n.source}</span>
                      <span className="text-gray-500">{timeAgo(n.date)}</span>
                    </div>
                    <div className="text-xs font-bold text-white leading-snug line-clamp-2 group-hover:text-amber-400 transition-colors">
                      {n.title}
                    </div>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )
      ) : transfers.length === 0 ? (
        <p className="py-8 text-center text-xs text-gray-500">Não foi possível carregar as transferências agora.</p>
      ) : (
        <ul className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-1 2xl:divide-y 2xl:divide-white/5">
          {transfers.map((t, idx) => (
            <li key={`${t.date}-${idx}`} className="py-2.5 border-b border-white/5 2xl:border-b-0">
              <div className="flex items-center justify-between gap-2 text-[10px] text-gray-500 mb-1">
                <span>{fmtDate(t.date)}</span>
                {t.ref && (
                  <a href={t.ref} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-0.5 hover:text-amber-400" title="Fonte do anúncio">
                    fonte <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
              <div className="text-xs font-bold text-white leading-snug">
                {t.players.map((p) => p.name).join(', ')}
                {t.to.role && <span className="ml-1 text-[10px] font-semibold text-gray-400">({t.to.role})</span>}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-gray-300 min-w-0">
                <TeamTag side={t.from} />
                <span className="text-gray-500 shrink-0">→</span>
                <TeamTag side={t.to} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 pt-3 border-t border-white/5 text-[10px] text-gray-500 text-center">
        {tab === 'news' ? 'Fontes: Valve (Steam) e blog do Dotabuff. Clique para ler a matéria completa.' : 'Fonte: Liquipedia.'}
      </p>
    </aside>
  );
}
