import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { GitCompare, Loader2, User } from 'lucide-react';
import BackButton from '../components/BackButton';
import RadarChart, { RADAR_COLORS } from '../components/RadarChart';
import { RatingBadge } from '../components/PlayerPerformance';
import { fetchProBenchmarks } from '../services/api';
import { getProPlayersList } from '../services/playerProfile';
import { METRICS, AREAS, performanceRating, playerRow } from '../utils/proBenchmarks';
import { usePageMeta } from '../utils/pageMeta';

const TABLE_METRICS = ['kills', 'deaths', 'assists', 'kp', 'gpm', 'xpm', 'lh10', 'dmg_min', 'tower_min', 'wards'];

/** Dois profissionais lado a lado: nota, radar das áreas e médias (jogos oficiais, 90 dias). */
export default function ComparePlayersPage() {
  usePageMeta('Comparar jogadores', 'Compare dois jogadores profissionais de Dota 2 lado a lado.');
  const [params, setParams] = useSearchParams();
  const [benchmarks, setBenchmarks] = useState(null);
  const [pros, setPros] = useState([]);

  useEffect(() => {
    fetchProBenchmarks().then(setBenchmarks);
    getProPlayersList().then(setPros);
  }, []);

  // Só quem tem jogos oficiais recentes (tem nota) entra na busca
  const options = useMemo(() => {
    const ids = new Set((benchmarks || []).map((r) => String(r.account_id)));
    return pros.filter((p) => ids.has(String(p.account_id)) && p.name)
      .map((p) => ({ id: String(p.account_id), label: p.team_name ? `${p.name} (${p.team_name})` : p.name, p }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [benchmarks, pros]);

  const pick = (slot, label) => {
    const found = options.find((o) => o.label === label);
    if (!found) return;
    const next = new URLSearchParams(params);
    next.set(slot, found.id);
    setParams(next, { replace: true });
  };

  const side = (slot) => {
    const id = params.get(slot);
    if (!id || !benchmarks) return null;
    const row = playerRow(benchmarks, id);
    const info = pros.find((p) => String(p.account_id) === id);
    return {
      id, row, info,
      name: info?.name || info?.personaname || `Jogador ${id}`,
      rating: row ? performanceRating(benchmarks, row.position, row) : null
    };
  };
  const a = side('a');
  const b = side('b');
  const both = [a, b].filter(Boolean);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen space-y-6">
      <BackButton fallbackPath="/times" fallbackLabel="Times" />
      <div>
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-600 dark:text-amber-500">
          <GitCompare className="w-4 h-4" /> Comparar jogadores
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">Frente a frente</h1>
        <p className="text-xs text-gray-400 mt-1">
          Médias dos jogos oficiais dos últimos 90 dias. A nota (0 a 100) compara cada um com os profissionais da própria posição.
        </p>
      </div>

      {!benchmarks ? (
        <div className="py-16 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-amber-400" /></div>
      ) : (
        <>
          <datalist id="pro-players">{options.map((o) => <option key={o.id} value={o.label} />)}</datalist>
          <div className="grid sm:grid-cols-2 gap-4">
            {[['a', a], ['b', b]].map(([slot, p], i) => (
              <div key={slot} className="glass-panel border border-line rounded-3xl p-5 shadow-xl" style={{ borderTopColor: RADAR_COLORS[i], borderTopWidth: 3 }}>
                <input
                  list="pro-players"
                  defaultValue=""
                  onChange={(e) => pick(slot, e.target.value)}
                  placeholder={p ? `Trocar ${p.name}…` : 'Buscar jogador pelo nome…'}
                  aria-label={`Jogador ${i + 1}`}
                  className="w-full bg-surface-2 border border-line rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-500/40"
                />
                {p ? (
                  <div className="flex items-center gap-4 mt-4">
                    {p.info?.avatarfull
                      ? <img src={p.info.avatarfull} alt="" className="w-14 h-14 rounded-2xl border border-line object-cover" referrerPolicy="no-referrer" />
                      : <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-line flex items-center justify-center"><User className="w-6 h-6 text-gray-500" /></div>}
                    <div className="min-w-0 flex-1">
                      <Link to={`/jogadores/${p.id}`} className="text-lg font-black text-white hover:text-amber-500 truncate block">{p.name}</Link>
                      <span className="text-xs text-gray-400">
                        {p.info?.team_name || 'Sem time'}{p.row ? ` · Pos ${p.row.position} · ${p.row.games} jogos` : ''}
                      </span>
                    </div>
                    <RatingBadge rating={p.rating} size="sm" />
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 mt-4">Escolha um jogador para comparar.</p>
                )}
                {p && !p.row && <p className="text-xs text-gray-400 mt-3">Sem jogos oficiais suficientes nos últimos 90 dias.</p>}
              </div>
            ))}
          </div>

          {both.some((p) => p.rating) && (
            <section className="glass-panel border border-line rounded-3xl p-6 shadow-xl">
              <h2 className="text-base font-black text-white uppercase tracking-wider mb-2">Áreas do jogo</h2>
              <div className="flex justify-center gap-4 text-xs font-bold mb-2">
                {both.map((p, i) => (
                  <span key={p.id} className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm" style={{ background: RADAR_COLORS[i] }} />{p.name}
                  </span>
                ))}
              </div>
              <RadarChart
                axes={AREAS.map((x) => ({ id: x.id, label: x.label }))}
                series={both.filter((p) => p.rating).map((p) => ({
                  name: p.name,
                  values: Object.fromEntries(p.rating.areas.map((x) => [x.id, x.score]))
                }))}
                size={300}
              />
            </section>
          )}

          {a?.row && b?.row && (
            <section className="glass-panel border border-line rounded-3xl overflow-hidden shadow-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-gray-400 bg-surface-2/60">
                    <th className="p-3 text-left" style={{ color: RADAR_COLORS[0] }}>{a.name}</th>
                    <th className="p-3 text-center">Média por jogo</th>
                    <th className="p-3 text-right" style={{ color: RADAR_COLORS[1] }}>{b.name}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {TABLE_METRICS.map((m) => {
                    const meta = METRICS[m];
                    const va = a.row[m];
                    const vb = b.row[m];
                    const aWins = meta.lowerIsBetter ? va < vb : va > vb;
                    const bWins = meta.lowerIsBetter ? vb < va : vb > va;
                    return (
                      <tr key={m}>
                        <td className={`p-3 font-mono ${aWins ? 'font-black text-emerald-500' : 'text-white'}`}>{meta.fmt(va)}</td>
                        <td className="p-3 text-center text-xs text-gray-400">{meta.label}</td>
                        <td className={`p-3 text-right font-mono ${bWins ? 'font-black text-emerald-500' : 'text-white'}`}>{meta.fmt(vb)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {a.row.position !== b.row.position && (
                <p className="text-[11px] text-gray-500 p-3 border-t border-line">
                  Posições diferentes (Pos {a.row.position} x Pos {b.row.position}): compare pelas notas, que já levam a posição em conta.
                </p>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
