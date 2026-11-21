# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Fãs brasileiros da cena profissional de Dota 2. O uso típico é no computador, com uma transmissão aberta: a pessoa acompanha os jogos que estão acontecendo, confere o placar do mapa e da série, descobre onde assistir e o que vem depois, e consulta resultados e campeonatos.

Jogadores que estudam heróis, itens e estatísticas de profissionais também usam o site, mas não são o público que orienta as decisões.

## Product Purpose

O DotaHub Brasil reúne, em português e no horário de Brasília, tudo o que um fã precisa para acompanhar o Dota 2 competitivo: jogos ao vivo, transmissões, resultados, agenda, campeonatos, times, jogadores, heróis e itens.

Dá certo quando quem abre a Central ao vivo vê na hora quais jogos estão rolando, o placar real do mapa e da série, e consegue assistir sem sair do site. E quando o que aparece no site bate com o que está acontecendo no jogo.

## Positioning

O foco é acompanhar ao vivo. A Central ao vivo junta o placar oficial da Valve (mapa, série, heróis, ouro, construções), as transmissões da Twitch, do YouTube e da Kick de cada partida, com vários canais lado a lado, e a série em tempo real. Liquipedia, Dotabuff e OpenDota têm partes disso, mas nenhum junta tudo numa tela em português.

## Operating Context

- **Sessão típica:** computador, transmissão aberta (no site ou fora dele), consultas durante e entre os mapas.
- **Ritmo:** o calendário dos campeonatos. Dias de campeonato grande têm vários jogos ao mesmo tempo e intervalos curtos entre mapas.
- **Horário:** tudo em horário de Brasília (BRT).
- **Fontes de dados:**
  - Valve (jogos ao vivo, placar da série enquanto há mapa ao vivo, dados oficiais de heróis e itens).
  - OpenDota (partidas encerradas e estatísticas; costuma atrasar horas para registrar os mapas).
  - Liquipedia (agenda, campeonatos, chaveamentos, classificação e o placar final quando a OpenDota atrasa).
  - Twitch, YouTube e Kick (quais canais estão ao vivo e com qual partida).

## Capabilities and Constraints

- **Páginas:** Início, Ao vivo (Central e página de cada partida ao vivo), Campeonatos, Partidas, Times, Jogadores (com comparação), Heróis, Itens, Perfil com login Steam e Admin.
- **Stack:** React 18, Vite, Tailwind, React Router, Supabase (banco e login), funções serverless na Vercel.
- **Limite da Vercel:** o plano Hobby permite no máximo 12 funções serverless. Rotas novas entram como parâmetros das funções que já existem.
- **Liquipedia:** exige User-Agent identificado e no máximo uma requisição a cada 2 segundos. O IP do dono do projeto já foi bloqueado (429), então todo acesso passa pelo cache do servidor.
- **Dados ao vivo:** o placar da série entre um mapa e outro não vem de nenhuma fonte em tempo real. Quando as fontes atrasam, o site prefere mostrar "Aguardando resultado" a mostrar um placar errado.
- **Em aberto:** o README cita um bolão de palpites; não está confirmado se ainda faz parte do produto.

## Brand Commitments

- **Nome:** DotaHub Brasil (curto: DotaHub).
- **Slogan:** "O portal definitivo do Dota 2 competitivo em português".
- **Idioma:** português do Brasil, com os termos que a comunidade usa (MD3, mapa, série, draft, Radiant/Dire).
- **Repositório:** github.com/fcdifrancesco1/dota-hub.

## Evidence on Hand

- Dados reais e atualizados das fontes acima. Não há depoimentos, números de audiência, parceiros nem imprensa, e nada disso deve ser inventado.
- Imagens de heróis, itens e logos vêm da Valve e da Liquipedia; o site não tem acervo próprio de imagens.

## Product Principles

1. **O placar tem que ser verdade.** Um dado atrasado ou incerto aparece como tal; nunca um placar errado com cara de certo.
2. **O ao vivo vem primeiro.** O que está acontecendo agora tem prioridade sobre o histórico.
3. **Assistir sem sair do site.** Transmissões e dados da partida ficam lado a lado.
4. **Português e horário de Brasília em tudo.**
5. **Respeitar as fontes.** Cache e limites da Liquipedia e da Vercel valem mais que dados mais frescos.
