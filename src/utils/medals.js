// Cores de medalha (ouro, prata, bronze) fixas: o tema claro troca as cores
// "amber" do Tailwind por azul-marinho, então estas ficam em estilo inline.
export const MEDAL_STYLES = {
  1: { background: 'linear-gradient(135deg, #f8dc7a 0%, #e0ac2b 55%, #b9850f 100%)', color: '#3a2800', borderColor: '#f3cd5a', boxShadow: '0 6px 18px -6px rgba(214, 160, 30, 0.65)' },
  2: { background: 'linear-gradient(135deg, #f3f5f8 0%, #c5ccd6 55%, #98a2af 100%)', color: '#262c35', borderColor: '#d9dee5', boxShadow: '0 6px 18px -6px rgba(140, 150, 165, 0.6)' },
  3: { background: 'linear-gradient(135deg, #efb784 0%, #c97a3f 55%, #985224 100%)', color: '#2d1606', borderColor: '#dd9a62', boxShadow: '0 6px 18px -6px rgba(176, 98, 45, 0.6)' }
};

/** Estilo da medalha para uma colocação (1, 2, 3 ou "1st", "2nd", "3rd"); null nas demais. */
export function medalStyle(place) {
  const n = typeof place === 'number' ? place : parseInt(String(place || ''), 10);
  return MEDAL_STYLES[n] || null;
}
