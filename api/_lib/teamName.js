// Nome de time vindo da Liquipedia, sem os complementos que a wiki usa só para
// diferenciar páginas de times homônimos: "Nix Team (1win Streamers League)" →
// "Nix Team", "Xtreme Gaming (China)" → "Xtreme Gaming". "(stack)" fica, porque
// indica um time montado só para aquele campeonato (ex.: "LEGION (stack)").
export function cleanTeamName(name) {
  let s = String(name || '').replace(/\s*\(page does not exist\)/gi, '').trim();
  const extra = s.match(/^(.+?)\s*\(([^()]+)\)$/);
  if (extra && !/stack/i.test(extra[2])) s = extra[1].trim();
  return s;
}
