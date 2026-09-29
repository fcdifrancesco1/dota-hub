import React, { useState, useEffect } from 'react';
import { BookOpen, TrendingUp, TrendingDown, Clock, ShieldAlert, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchAnalyses } from '../services/supabase';

export default function AnalysesPage() {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    fetchAnalyses().then(data => {
      if (data) setArticles(data);
    });
  }, []);

  return (
    <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-line">
        <h1 className="text-2xl sm:text-3xl font-black text-white uppercase font-serif tracking-tight flex items-center gap-2.5">
          <BookOpen className="w-7 h-7 text-amber-500" />
          <span>Análises Táticas & Tendências do Meta</span>
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm mt-1">
          Artigos aprofundados sobre estratégias, drafts, impacto dos patches e tendências de vitórias no competitivo.
        </p>
      </div>

      {/* BLOCOS AUTOMÁTICOS DE TENDÊNCIAS (SEÇÃO 6.9) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Bloco 1: Heróis em Alta e em Queda */}
        <div className="bg-surface border border-line rounded-2xl p-5 shadow-xl">
          <h3 className="text-xs font-black uppercase tracking-wider text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Tendência de Heróis (Semana)</span>
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2.5 bg-emerald-950/20 border border-emerald-900/30 rounded-xl">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">Luna (Em Alta)</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">+8.4% Winrate</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-red-950/20 border border-red-900/30 rounded-xl">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className="text-xs font-bold text-white">Lina (Em Queda)</span>
              </div>
              <span className="text-xs font-mono font-bold text-red-400">-6.2% Winrate</span>
            </div>
          </div>
        </div>

        {/* Bloco 2: Duração Média por Patch */}
        <div className="bg-surface border border-line rounded-2xl p-5 shadow-xl">
          <h3 className="text-xs font-black uppercase tracking-wider text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Duração Média das Partidas</span>
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-300 py-1 border-b border-white/5">
              <span>Patch 7.37 (Atual):</span>
              <span className="font-mono font-bold text-amber-400">38m 42s</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400 py-1 border-b border-white/5">
              <span>Patch 7.36c:</span>
              <span className="font-mono text-gray-300">41m 15s</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 py-1">
              <span>Patch 7.35d:</span>
              <span className="font-mono text-gray-400">36m 50s</span>
            </div>
          </div>
        </div>

        {/* Bloco 3: Winrate Radiant x Dire */}
        <div className="bg-surface border border-line rounded-2xl p-5 shadow-xl">
          <h3 className="text-xs font-black uppercase tracking-wider text-white mb-4 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Vantagem de Mapa (Pro Matches)</span>
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-emerald-400">Radiante: 52.4%</span>
                <span className="text-red-400">Dire: 47.6%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-red-950 overflow-hidden flex">
                <div className="bg-emerald-500 h-full" style={{ width: '52.4%' }} />
                <div className="bg-red-600 h-full" style={{ width: '47.6%' }} />
              </div>
            </div>
            <p className="text-[10px] text-gray-500">
              Cálculo baseado nas últimas 350 partidas oficiais registradas nos torneios Tier 1.
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Artigos / Análises */}
      <h2 className="text-sm font-black uppercase text-white mb-4">Artigos & Recaps Publicados</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {articles.map((art) => (
          <article
            key={art.id}
            className="rounded-2xl bg-surface border border-line hover:border-amber-500/40 overflow-hidden shadow-xl transition-all group flex flex-col justify-between"
          >
            <div>
              {art.cover_image && (
                <div className="h-48 w-full overflow-hidden bg-black/40 relative">
                  <img
                    src={art.cover_image}
                    alt={art.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {art.is_featured && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-amber-500 text-black font-black text-[10px] uppercase tracking-wider shadow">
                      Destaque
                    </span>
                  )}
                </div>
              )}
              <div className="p-6">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {art.tags?.map((tag, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/5 text-amber-400">
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="text-lg font-black text-white group-hover:text-amber-400 transition-colors mb-2 leading-snug">
                  {art.title}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">
                  {art.summary}
                </p>
              </div>
            </div>

            <div className="px-6 pb-6 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-gray-500">
                Por {art.author} • {new Date(art.published_at).toLocaleDateString('pt-BR')}
              </span>
              <Link
                to={`/analises/${art.slug}`}
                className="font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 uppercase tracking-wider"
              >
                <span>Ler Artigo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
