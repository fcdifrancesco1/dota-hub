import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Tag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { fetchAnalysisBySlug } from '../services/supabase';

export default function AnalysisDetailPage() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalysisBySlug(slug).then(data => {
      setArticle(data);
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-400">
        Carregando artigo...
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Artigo não encontrado</h2>
        <Link to="/analises" className="text-amber-400 font-bold text-xs uppercase hover:underline">
          Voltar para análises
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      <Link
        to="/analises"
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-amber-400 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar para Análises</span>
      </Link>

      <article className="bg-surface border border-line rounded-2xl overflow-hidden shadow-2xl p-6 sm:p-10">
        {/* Metadados */}
        <div className="flex flex-wrap gap-2 mb-4">
          {article.tags?.map((t, idx) => (
            <span key={idx} className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 border border-amber-500/30 text-amber-400">
              {t}
            </span>
          ))}
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-white font-serif uppercase tracking-tight mb-4 leading-tight">
          {article.title}
        </h1>

        <div className="flex items-center gap-4 text-xs text-gray-400 pb-6 border-b border-white/10 mb-8">
          <span className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-gray-500" />
            <span>{article.author}</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-500" />
            <span>{new Date(article.published_at).toLocaleDateString('pt-BR')}</span>
          </span>
        </div>

        {article.cover_image && (
          <img
            src={article.cover_image}
            alt={article.title}
            className="w-full h-72 sm:h-96 object-cover rounded-xl mb-8 border border-white/10 shadow-lg"
          />
        )}

        {/* Renderizador de Markdown */}
        <div className="prose prose-invert max-w-none text-gray-300 text-sm sm:text-base leading-relaxed space-y-4">
          <ReactMarkdown>{article.content}</ReactMarkdown>
        </div>
      </article>
    </div>
  );
}
