// Imagens da Liquipedia (logos de times e campeonatos) passam pela rota
// /api/tournaments?img=, que as guarda no cache da Vercel: o navegador não
// acessa a Liquipedia direto, que limita (429) quem pede muitas imagens.
const LIQUIPEDIA_IMG_RE = /^https?:\/\/liquipedia\.net(\/commons\/images\/[^?#]+)$/;

export function liquipediaImage(url) {
  if (typeof url !== 'string') return url;
  const m = url.match(LIQUIPEDIA_IMG_RE);
  return m ? `/api/tournaments?img=${encodeURIComponent(m[1])}` : url;
}
