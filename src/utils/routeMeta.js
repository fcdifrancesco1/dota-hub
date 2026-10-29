// Títulos e descrições por seção, usados no navegador (pageMeta.js) e na prévia de
// links gerada no servidor para WhatsApp, Discord etc. (api/results.js?og=1)
export const SITE_NAME = 'DotaHub Brasil';
export const SITE_URL = 'https://dota.hangover.com.br';
export const DEFAULT_DESCRIPTION = 'Acompanhe a cena profissional de Dota 2 em tempo real: partidas ao vivo, agenda, campeonatos, estatísticas e meta de heróis.';

// Título e descrição de cada seção (as páginas de detalhe trocam pelo nome do item quando carregam)
const ROUTE_META = [
  ['/ao-vivo/', 'Partida ao vivo', 'Placar, abates e ouro da partida profissional de Dota 2 em tempo real.'],
  ['/ao-vivo', 'Ao vivo', 'Partidas profissionais de Dota 2 acontecendo agora, com placar ao vivo e transmissões.'],
  ['/campeonatos/', 'Campeonato', 'Partidas, chaveamento, equipes, jogadores e heróis do campeonato de Dota 2.'],
  ['/campeonatos', 'Campeonatos', 'Campeonatos profissionais de Dota 2 em andamento, próximos e encerrados, com histórico por ano.'],
  ['/partidas/', 'Partida', 'Resultado, mapas, heróis e estatísticas da série profissional de Dota 2.'],
  ['/partidas', 'Partidas', 'Agenda e resultados das séries profissionais de Dota 2.'],
  ['/times/', 'Time', 'Elenco, resultados recentes e estatísticas do time profissional de Dota 2.'],
  ['/times', 'Ranking mundial de times', 'Ranking mundial dos times profissionais de Dota 2, com pontos e região.'],
  ['/jogadores/', 'Jogador', 'Títulos, heróis mais jogados e partidas recentes do jogador profissional de Dota 2.'],
  ['/players/', 'Jogador', 'Títulos, heróis mais jogados e partidas recentes do jogador profissional de Dota 2.'],
  ['/herois/', 'Herói', 'Habilidades, itens e especialistas do herói nas partidas profissionais de Dota 2.'],
  ['/herois', 'Meta de heróis', 'Taxa de escolha, banimento e vitória dos heróis de Dota 2, por posição, no cenário profissional.'],
  ['/perfil', 'Meu perfil', 'Suas partidas, recordes, heróis e parceiros no Dota 2, pela sua conta Steam.'],
  ['/admin', 'Administração', DEFAULT_DESCRIPTION]
];

export function routeMeta(pathname) {
  const found = ROUTE_META.find(([prefix]) => (prefix.endsWith('/') ? pathname.startsWith(prefix) : pathname === prefix));
  return found ? { title: found[1], description: found[2] } : { title: null, description: DEFAULT_DESCRIPTION };
}
