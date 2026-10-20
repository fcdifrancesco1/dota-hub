import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL, routeMeta } from './routeMeta';

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/** Atualiza título da aba, descrição, Open Graph e endereço canônico. */
export function setPageMeta(title, description = DEFAULT_DESCRIPTION) {
  const fullTitle = title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} - Portal Competitivo de Dota 2`;
  document.title = fullTitle;
  setMeta('name', 'description', description);
  setMeta('property', 'og:title', fullTitle);
  setMeta('property', 'og:description', description);
  const url = SITE_URL + window.location.pathname;
  setMeta('property', 'og:url', url);
  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', url);
}

/** Título padrão da seção a cada troca de página (fica antes das rotas no App). */
export function RouteMeta() {
  const { pathname } = useLocation();
  useEffect(() => {
    const { title, description } = routeMeta(pathname);
    setPageMeta(title, description);
  }, [pathname]);
  return null;
}

/** Nas páginas de detalhe: troca o título pelo nome do item quando ele carrega. */
export function usePageMeta(title, description) {
  useEffect(() => {
    if (title) setPageMeta(title, description || routeMeta(window.location.pathname).description);
  }, [title, description]);
}
