import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, UserCheck } from 'lucide-react';

export default function PlayerDetailPage() {
  const { id } = useParams();

  return (
    <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      <Link
        to="/jogadores"
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-amber-400 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar para Jogadores</span>
      </Link>

      <div className="rounded-2xl bg-[#0C0E14] border border-[#212838] p-8 text-center max-w-xl mx-auto">
        <UserCheck className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <h1 className="text-xl font-black text-white uppercase">Perfil do Jogador #{id}</h1>
        <p className="text-xs text-gray-400 mt-2">
          Histórico e estatísticas detalhadas de heróis mais jogados e médias por torneio.
        </p>
      </div>
    </div>
  );
}
