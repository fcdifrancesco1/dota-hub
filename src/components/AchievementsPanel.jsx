import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Medal, Sparkles, Trophy } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { medalStyle } from '../utils/medals';
import { tournamentPath } from '../utils/tournamentFormat';
import { liquipediaImage } from '../utils/liquipediaImage';
import TeamLogo from '../utils/teamLogos';

// "US$ 5,9 mi" / "US$ 320 mil"
export const prizeShort = (usd) => (usd >= 1e6
  ? `US$ ${(usd / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`
  : `US$ ${Math.round(usd / 1000).toLocaleString('pt-BR')} mil`);

// Página do campeonato no site a partir da página dele na Liquipedia (ex.: "BLAST/SLAM/8")
function tournamentLinkFromSlug(slug) {
  if (!slug) return null;
  let page = slug;
  try { page = decodeURIComponent(slug); } catch { /* mantém como veio */ }
  page = page.replace(/_/g, ' ');
  const id = page.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return id ? tournamentPath({ id, page }) : null;
}

function formatTournamentDate(val) {
  if (!val) return '—';
  if (typeof val === 'string' && val.includes('-')) {
    const parts = val.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return val;
  }
  const num = Number(val);
  if (!isNaN(num) && num > 0) {
    const ms = num > 1e11 ? num : num * 1000;
    return new Date(ms).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  return String(val);
}

/**
 * Resumo (títulos, pódios, Tier 1, premiação) e galeria de troféus com filtros,
 * a partir dos resultados da Liquipedia. subject: 'jogador' | 'time'.
 */
export default function AchievementsPanel({ titles = [], allAchievements = [], summary = {}, subject = 'jogador' }) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [titleFilter, setTitleFilter] = useState('champions'); // 'champions' | 'podiums' | 'tier1' | 'all'
  const achievementsSummary = summary;

  const displayedAchievements = useMemo(() => {
    if (titleFilter === 'champions') return allAchievements.filter((a) => a.isChampion);
    if (titleFilter === 'podiums') return allAchievements.filter((a) => a.isPodium);
    if (titleFilter === 'tier1') {
      return allAchievements.filter((a) => /tier\s*1/i.test(a.tier) || /major|international|blast|riyadh/i.test(a.tournament));
    }
    return allAchievements;
  }, [allAchievements, titleFilter]);

  return (
  <div className="space-y-8">
    {/* PAINEL DE RESUMO DE TÍTULOS E PREMIAÇÃO */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="tilt-card glass-panel rounded-3xl p-5 border border-amber-500/40 bg-amber-500/5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl border" style={medalStyle(1)}>
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-gray-400 block">Títulos de campeão</span>
            <span className="text-2xl font-semibold font-mono text-amber-400 block mt-0.5">
              {titles.length || (achievementsSummary?.totalChampionships || 0)}
            </span>
          </div>
        </div>
      </div>

      <div className="tilt-card glass-panel rounded-3xl p-5 border border-line shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-surface-2 text-slate-300 border border-slate-400/30">
            <Medal className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-gray-400 block">Pódios (Top 3)</span>
            <span className="text-2xl font-semibold font-mono text-white block mt-0.5">
              {achievementsSummary?.totalPodiums || allAchievements.filter(a => a.isPodium).length}
            </span>
          </div>
        </div>
      </div>

      <div className="tilt-card glass-panel rounded-3xl p-5 border border-line shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-surface-2 text-amber-500 border border-amber-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-gray-400 block">Tier 1 & Majors</span>
            <span className="text-2xl font-semibold font-mono text-white block mt-0.5">
              {achievementsSummary?.tier1Titles || titles.filter(a => /tier\s*1/i.test(a.tier)).length}
            </span>
          </div>
        </div>
      </div>

      <div className="tilt-card glass-panel rounded-3xl p-5 border border-line shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-surface-2 text-emerald-400 border border-emerald-500/30">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-gray-400 block">Premiação acumulada</span>
            <span className="text-xl sm:text-2xl font-semibold font-mono text-emerald-400 block mt-0.5">
              {achievementsSummary?.totalPrizeUsd ? `$${achievementsSummary.totalPrizeUsd.toLocaleString('en-US')}` : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>

    {/* LISTA DE TÍTULOS CONQUISTADOS NOS TIMES */}
    <section className="glass-panel border border-line rounded-3xl overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-line flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Títulos e campeonatos</span>
          </h2>
          <span className="text-xs text-gray-400 mt-1 block">
            {subject === 'time' ? 'Histórico oficial de campeonatos do time' : 'Histórico oficial de conquistas obtidas pelo jogador nos times em que atuou'} (Dados Liquipedia)
          </span>
        </div>

        {/* Filtros de Conquistas */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { id: 'champions', label: 'Campeão' },
            { id: 'podiums', label: 'Pódios' },
            { id: 'tier1', label: 'Tier 1' },
            { id: 'all', label: 'Todos' }
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setTitleFilter(btn.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-[color,background-color,border-color,opacity,transform] ${
                titleFilter === btn.id
                  ? 'bg-amber-500 text-on-accent font-semibold'
                  : 'bg-surface-2 border border-line text-gray-400 hover:text-white'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {displayedAchievements.length === 0 ? (
        <div className="p-16 text-center">
          <Trophy className="w-12 h-12 text-gray-500 mx-auto mb-3 opacity-50" />
          <h3 className="text-base font-semibold text-white">Nenhum título listado neste filtro</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
            {subject === 'time' ? 'Este time' : 'Este jogador'} ainda não possui conquistas oficiais registradas sob o critério selecionado na base da Liquipedia.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 p-4 sm:p-6">
          {displayedAchievements.map((item, idx) => {
            const is1st = item.isChampion;
            // Clique leva à página do campeonato (partidas, chaveamento, estatísticas)
            const link = tournamentLinkFromSlug(item.tourneySlug);
            const open = () => link && navigate(link, { state: { from: { label: 'Títulos' } } });
            return (
              <div
                key={idx}
                role={link ? 'link' : undefined}
                tabIndex={link ? 0 : undefined}
                onClick={open}
                onKeyDown={(e) => { if (link && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); open(); } }}
                title={link ? `Abrir ${item.tournament}` : undefined}
                className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 hover:bg-surface-2/50 transition-colors ${is1st ? 'border-amber-500/40 bg-amber-500/5' : 'border-line bg-surface/60'} ${link ? 'cursor-pointer' : ''}`}
              >
                {/* Lado Esquerdo: Colocação, Torneio e Tier */}
                <div className="flex items-start gap-4 min-w-0">
                  <div className="flex flex-col items-center gap-1.5 shrink-0 w-14">
                    <div className="w-12 h-12 rounded-2xl bg-surface-2 border border-line flex items-center justify-center p-1.5 shadow-sm">
                      {item.tournamentIcon ? (
                        <img
                          src={liquipediaImage(item.tournamentIcon[theme] || item.tournamentIcon.dark || item.tournamentIcon.light)}
                          alt={item.tournament}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : is1st ? (
                        <Trophy className="w-5 h-5 text-gray-400" />
                      ) : (
                        <Medal className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <span
                      className={`px-1.5 py-px rounded-md border text-[11px] font-mono font-semibold leading-tight whitespace-nowrap ${
                        medalStyle(item.placement) ? '' : 'bg-surface-2 text-gray-400 border-line'
                      }`}
                      style={medalStyle(item.placement) || undefined}
                    >
                      {item.placement.replace(/&#160;/g, ' ')}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-white text-sm sm:text-base tracking-tight">
                        {item.tournament}
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-surface-3 border border-line text-blue-500 dark:text-cyan-400">
                        {item.tier}
                      </span>
                      {is1st && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/20 border border-amber-500/40 text-amber-400">
                          Campeão
                        </span>
                      )}
                    </div>

                    {/* Time pelo qual conquistou (na página do time é sempre o próprio) */}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      {subject !== 'time' && (<>
                      <span className="text-xs text-gray-400 font-medium">Equipe:</span>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-2 border border-line">
                        {item.teamLogo ? (
                          <img src={liquipediaImage(item.teamLogo)} alt={item.teamName} referrerPolicy="no-referrer" className="w-4 h-4 object-contain" />
                        ) : (
                          <TeamLogo teamName={item.teamName} className="w-4 h-4" />
                        )}
                        <span className="text-xs font-semibold text-white">{item.teamName}</span>
                      </div>
                      <span className="text-gray-500 text-xs">•</span>
                      </>)}
                      <span className="text-xs text-gray-400 font-mono">
                        {formatTournamentDate(item.date)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lado Direito: Placar da Final e Premiação */}
                <div className="flex items-center justify-between gap-4 pt-3 border-t border-line/60">
                  {item.opponent && (
                    <div className="text-left min-w-0">
                      <span className="text-[11px] font-medium text-gray-500 block">Final / adversário</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.score && (
                          <span className="font-mono font-semibold text-white text-xs px-2 py-0.5 rounded bg-surface-2 border border-line">
                            {item.score}
                          </span>
                        )}
                        <span className="text-xs font-medium text-gray-300">vs {item.opponent}</span>
                      </div>
                    </div>
                  )}

                  {item.prize && (
                    <div className="text-right min-w-[90px]">
                      <span className="text-[11px] font-medium text-emerald-500 block">Prêmio</span>
                      <span className="font-mono font-semibold text-emerald-400 text-sm block mt-0.5">
                        {item.prize}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  </div>
  );
}
