import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/** Há uma página anterior deste site no histórico (o roteador guarda a posição em history.state.idx). */
function hasPreviousPage() {
  return typeof window !== 'undefined' && (window.history.state?.idx ?? 0) > 0;
}

/**
 * Botão "Voltar": volta exatamente para a página anterior (com a aba e os filtros
 * que estavam abertos, que ficam no endereço). Sem página anterior — link aberto
 * direto ou em nova aba —, vai para `fallbackPath`.
 * O texto usa a origem informada no clique (state.from.label), se houver.
 */
export default function BackButton({ fallbackPath, fallbackLabel, className = 'mb-5' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const canGoBack = hasPreviousPage();
  const fromLabel = location.state?.from?.label;
  const label = fromLabel || (canGoBack ? null : fallbackLabel);

  return (
    <button
      type="button"
      onClick={() => (canGoBack ? navigate(-1) : navigate(fallbackPath))}
      className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-amber-400 transition-colors ${className}`}
    >
      <ArrowLeft className="w-4 h-4 shrink-0" />
      <span>{label ? `Voltar para ${label}` : 'Voltar'}</span>
    </button>
  );
}
