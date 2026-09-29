import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';

export default function HeroDetailPage() {
  const { id } = useParams();

  return (
    <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      <Link
        to="/herois"
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-amber-400 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar para Meta de Heróis</span>
      </Link>

      <div className="rounded-2xl bg-[#0C0E14] border border-[#212838] p-8 text-center max-w-xl mx-auto shadow-xl">
        <Sparkles className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <h1 className="text-xl font-black text-white uppercase">Estatísticas do Herói #{id}</h1>
        <p className="text-xs text-gray-400 mt-2">
          Desempenho no cenário profissional, itens mais comprados e evolução de winrate.
        </p>
      </div>
    </div>
  );
}
