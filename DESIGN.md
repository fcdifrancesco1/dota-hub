---
name: DotaHub Brasil
description: O portal definitivo do Dota 2 competitivo em português
colors:
  canvas: "#0B0E12"
  surface: "#12171D"
  surface-raised: "#1A2028"
  surface-hover: "#232A34"
  line: "#2A323D"
  line-strong: "#3A4450"
  panel-top: "#1B2129"
  panel-bottom: "#11151B"
  ink: "#E1E6F0"
  ink-bright: "#FFFFFF"
  ink-muted: "#9CA3AF"
  heading-silver: "#C9CED6"
  tab-idle: "#8B94A1"
  aegis-amber: "#F59E0B"
  aegis-amber-text: "#FBBF24"
  radiant-green: "#34D399"
  dire-red: "#FB7185"
  live-red: "#EF4444"
  stream-purple: "#C084FC"
  info-cyan: "#22D3EE"
  play-green-top: "#3E7F38"
  play-green-bottom: "#2A5A27"
  play-green-rim: "#5E9E52"
  play-green-ink: "#EAF6E4"
  light-canvas: "#FBF7F0"
  light-accent-navy: "#023266"
typography:
  display:
    fontFamily: "Segoe UI Variable Display, Segoe UI Variable, Segoe UI, -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Segoe UI Variable Text, Segoe UI Variable, Segoe UI, -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
  title:
    fontFamily: "Segoe UI Variable Text, Segoe UI Variable, Segoe UI, -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Segoe UI Variable Text, Segoe UI Variable, Segoe UI, -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Segoe UI Variable Text, Segoe UI Variable, Segoe UI, -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.4
  section-heading:
    fontFamily: "Segoe UI Variable Text, Segoe UI Variable, Segoe UI, -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.14em"
  scoreboard:
    fontFamily: "Segoe UI Variable Text, Segoe UI Variable, Segoe UI, -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: 1
    fontFeature: "tnum"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  gutter-mobile: "16px"
  gutter-tablet: "24px"
  gutter-desktop: "32px"
  container-max: "1680px"
components:
  button-play:
    backgroundColor: "{colors.play-green-top}"
    textColor: "{colors.play-green-ink}"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
  button-selected:
    backgroundColor: "{colors.aegis-amber}"
    textColor: "#000000"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
  button-idle:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
  button-idle-hover:
    backgroundColor: "{colors.surface-hover}"
    textColor: "{colors.ink-bright}"
  chip:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  panel:
    backgroundColor: "{colors.panel-top}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "20px"
  nav-tab:
    textColor: "{colors.tab-idle}"
    typography: "{typography.section-heading}"
    padding: "0 16px"
  nav-tab-active:
    textColor: "{colors.ink-bright}"
---

# Design System: DotaHub Brasil

## Overview

**Creative North Star: "O cliente do Dota"**

O DotaHub tem a cara de uma extensão do próprio jogo. Quem abre o site com a transmissão ao lado deve reconhecer a sala de espera do cliente: painéis grafite sobre a arte dos heróis, um fio de luz no topo de cada painel, abas e títulos em caixa alta espaçada, e o verde do botão de jogar marcando a ação principal. O site herda o material do cliente (metal escuro, chanfros, brilho contido) para parecer parte do Dota.

A tela é densa porque o fã acompanha vários jogos ao mesmo tempo. O texto corrido fica pequeno (12px) e os números grandes ficam para o que importa agora: o placar do mapa e da série. A cor de ação é o âmbar, e o verde e o vermelho pertencem aos lados do mapa (Radiant e Dire), nunca à decoração. Daqui para frente, cartões e botões novos ganham a textura do jogo (chanfro, fio de luz, gradiente de metal), mas o comportamento continua sóbrio: no hover a borda clareia, sem pulo nem brilho.

O tema escuro é a identidade. O tema claro (bege com azul-marinho no lugar do âmbar) existe por preferência e acessibilidade, funciona pelos mesmos tokens, mas não define o visual.

**Key Characteristics:**
- Grafite azulado sobre a arte dos heróis, com um véu escuro mais forte atrás do conteúdo.
- Painéis com degrau de tom de cima para baixo, linha fina e fio de luz no topo.
- Caixa alta espaçada para abas e títulos de seção, como no cliente.
- Âmbar como cor de ação; verde e vermelho só para Radiant, Dire e estados de jogo.
- Números com algarismos de largura fixa em placares e tabelas.
- Densidade alta: texto de 11 a 12px, números grandes só no placar.

## Colors

Paleta de cliente de jogo à noite: grafite azulado, um âmbar de Aegis para a ação e as cores dos dois lados do mapa.

### Primary
- **Âmbar da Aegis** (#F59E0B): fundo do item selecionado (aba ativa, botão de mapa escolhido, filtro ligado). No texto, o tom mais claro (#FBBF24) marca links, nomes de campeonato, o time na frente no placar e o hover de títulos. No tema claro, os dois viram azul-marinho (#023266).

### Secondary
- **Verde Radiant** (#34D399): o lado Radiant, o vencedor, ganho de ouro e o selo "Vencedor".
- **Vermelho Dire** (#FB7185): o lado Dire e as perdas.
- **Vermelho ao vivo** (#EF4444): só para o estado ao vivo (ponto pulsando, "Ao vivo", "Em andamento").

### Tertiary
- **Roxo de transmissão** (#C084FC): canais e o player (botão do canal ativo, formato da série).
- **Ciano informativo** (#22D3EE): datas, tempo de jogo e dados de apoio.
- **Verde de jogar** (#3E7F38 → #2A5A27, aro #5E9E52, texto #EAF6E4): o botão principal no estilo do "JOGAR DOTA" do cliente.

### Neutral
- **Grafite do cliente** (#0B0E12): fundo da página, quase sempre sob a arte dos heróis com véu.
- **Superfície** (#12171D): cartões simples.
- **Superfície elevada** (#1A2028): painéis internos, inputs, cabeçalhos de tabela, chips e botões em repouso.
- **Superfície de hover** (#232A34): hover de linhas e botões.
- **Linha** (#2A323D) e **linha forte** (#3A4450): bordas e divisórias.
- **Painel** (#1B2129 → #11151B): o gradiente vertical dos painéis grandes.
- **Tinta** (#E1E6F0), **tinta forte** (#FFFFFF) e **tinta apagada** (#9CA3AF): texto principal, destaque e secundário.
- **Prata de título** (#C9CED6) e **aba em repouso** (#8B94A1): títulos de seção e abas inativas.

### Named Rules
**The Two Sides Rule.** Verde e vermelho são Radiant e Dire (ou ganho e perda). Nunca usar esses tons como decoração, fundo de seção ou cor de marca.

**The One Amber Rule.** Só o item selecionado ganha o fundo âmbar. Numa barra de abas ou de mapas, um único botão é âmbar por vez.

**The Live Red Rule.** O vermelho #EF4444 com ponto pulsando significa "acontecendo agora". Uma série parada ou atrasada fica em cinza, nunca em vermelho.

## Typography

**Display Font:** Segoe UI Variable Display (com a fonte do sistema como alternativa)
**Body Font:** Segoe UI Variable Text (com -apple-system, Roboto e Helvetica como alternativas)
**Label/Mono Font:** a mesma Segoe, com algarismos de largura fixa (`tabular-nums`) em placares e tabelas

**Character:** a fonte do Windows 11, a mesma família do sistema de quem joga no PC. Neutra e técnica, deixa a personalidade com a caixa alta espaçada e os números.

### Hierarchy
- **Display** (600, 1.875rem, 1.2): título de página ("Central ao vivo"), no corte Display.
- **Headline** (600, 1.5rem, 1.25): nomes de times no cabeçalho de uma partida.
- **Scoreboard** (600, 2.25rem, 1, algarismos fixos): o placar do mapa e da série.
- **Title** (600, 0.875rem, 1.4): nomes de times em cartões e títulos de tabela.
- **Body** (400, 0.75rem, 1.5): o texto padrão do site, pequeno de propósito.
- **Label** (500, 0.6875rem): selos, metadados, nomes de plataforma e colunas.
- **Section heading** (600, 0.75rem, 0.14em, caixa alta): títulos de seção na cor prata. As abas da navegação usam 0.16em.

### Named Rules
**The Tabular Score Rule.** Todo número que se compara com outro (placar, abates, ouro, tempo) usa algarismos de largura fixa.

**The Client Caps Rule.** Caixa alta espaçada só em abas, títulos de seção e no botão de jogar. Texto corrido e nomes de times nunca vão em caixa alta.

## Layout

Conteúdo centralizado até 1680px, com margens laterais de 16px no celular, 24px no tablet e 32px no desktop (o modo teatro da Central ao vivo usa a largura toda). As páginas se organizam em colunas de cartões: três colunas nas Partidas (ao vivo, encerradas, próximas), grade de cartões na Central ao vivo e tabelas largas com rolagem horizontal própria nas estatísticas. O espaçamento vem de `gap` (12px dentro de grupos, 24px entre seções). No celular tudo vira uma coluna, as abas rolam na horizontal e a página nunca rola para o lado.

## Elevation & Depth

A profundidade imita o cliente do jogo: camadas de grafite empilhadas sobre a arte dos heróis. Cada painel grande tem um degrau de tom vertical, uma linha fina clara e um fio de luz no topo, além de uma sombra larga e difusa que o separa do fundo. Painéis internos não têm sombra: sobem um degrau de tom (superfície elevada).

### Shadow Vocabulary
- **Painel** (`box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 10px 30px rgba(0,0,0,0.35)`): todo painel grande (`glass-panel`).
- **Cartão flutuante** (`box-shadow: 0 8px 24px -12px rgba(0,0,0,0.6)`, no hover `0 14px 32px -14px rgba(0,0,0,0.75)`): cartões da faixa ao vivo da Home.
- **Chanfro do botão de jogar** (`box-shadow: inset 0 1px 0 rgba(255,255,255,0.18), 0 0 0 1px rgba(0,0,0,0.55)`): o fio de luz no topo e o aro escuro do botão verde.

### Named Rules
**The Light Thread Rule.** Painel e botão principal têm um fio de luz de 1px no topo (inset branco a 4 a 18%). É o detalhe que faz a peça parecer metal do cliente, não um cartão genérico.

**The Quiet Hover Rule.** Hover não levanta nem brilha: a borda clareia (até rgba(255,255,255,0.2)) ou o fundo sobe um degrau. O botão de jogar só clareia (brightness 1.12).

## Shapes

Cantos arredondados médios a grandes, em degraus: 8px em itens pequenos e no botão de jogar, 12px em botões e campos, 16px em cartões e botões de seleção, 24px nos painéis de cabeçalho (placar da partida, player) e pílula em chips e selos. Bordas finas de 1px em quase tudo. Logos de times levam um contorno de 1px (claro no tema escuro) para logos escuros não sumirem.

## Components

### Buttons
- **Shape:** 16px nos botões de seleção (12px nos menores), 8px no botão de jogar.
- **Jogar (principal):** gradiente verde vertical (#3E7F38 → #2A5A27), aro #5E9E52, texto #EAF6E4 em caixa alta (0.18em, 600) e o chanfro de luz no topo. Para a ação principal de uma tela.
- **Selecionado:** fundo âmbar (#F59E0B), texto preto, sombra média. Aba, mapa ou filtro ativo.
- **Em repouso:** superfície elevada, linha de 1px, texto apagado; no hover, superfície de hover e texto branco.
- **Hover / Focus:** transição de 150ms na curva `cubic-bezier(0.22, 1, 0.36, 1)`, sem movimento.

### Chips
- **Style:** pílula em superfície elevada com linha de 1px e texto de 11 a 12px. A cor do texto diz o tipo: âmbar para campeonato, roxo para formato, ciano para data, vermelho com fundo translúcido para ao vivo.
- **State:** um chip pode ser link (o campeonato, com a logo oficial); no hover, a borda fica âmbar.

### Cards / Containers
- **Corner Style:** 16px nos cartões, 24px nos painéis de cabeçalho.
- **Background:** gradiente de painel (#1B2129 → #11151B) nos grandes; superfície elevada dentro deles.
- **Shadow Strategy:** sombra de painel (ver Elevation & Depth); internos sem sombra.
- **Border:** 1px rgba(255,255,255,0.07); em cartões clicáveis, clareia no hover.
- **Internal Padding:** 16 a 20px; 24 a 32px nos cabeçalhos de partida.

### Inputs / Fields
- **Style:** fundo escuro translúcido (rgba(0,0,0,0.3)), linha de 1px, 8px de canto, texto de 14px, ícone de busca à esquerda.
- **Focus:** a borda vai para o cinza médio; sem brilho.

### Navigation
- **Style:** barra fixa no topo, grafite, com abas em caixa alta espaçada (0.16em, 600) em cinza #8B94A1; a aba ativa fica branca com um traço âmbar embaixo. O número de jogos ao vivo aparece num selo vermelho ao lado de "Ao vivo".
- **Mobile:** barra inferior com ícones e rótulos curtos (Início, Ao vivo, Campeonatos, Partidas, Heróis).

### Placar da partida
O componente que mais define o site: os dois times nas pontas (logo e nome), o placar no centro numa caixa de 16px de canto, com algarismos fixos de 2.25rem, o lado na frente em âmbar e o outro apagado, e uma fileira de chips em cima (campeonato, formato, data, estado).

## Do's and Don'ts

### Do:
- **Do** colocar painéis grandes sobre o gradiente #1B2129 → #11151B, com linha de 1px e o fio de luz no topo.
- **Do** usar caixa alta com 0.14 a 0.18em de espaçamento em abas, títulos de seção e no botão de jogar.
- **Do** usar algarismos de largura fixa em placares, abates, ouro e tempos.
- **Do** dar a componentes novos a textura do jogo: chanfro de luz, gradiente vertical de metal e aro escuro.
- **Do** manter o texto padrão em 12px e o de apoio em 11px; números grandes só no placar.

### Don't:
- **Don't** usar verde ou vermelho fora de Radiant, Dire, ganho, perda e ao vivo.
- **Don't** deixar mais de um item âmbar selecionado na mesma barra.
- **Don't** pular, escalar ou brilhar no hover; só a borda clareia ou o fundo sobe um degrau.
- **Don't** mostrar uma série atrasada ou parada em vermelho de ao vivo; ela fica em cinza.
- **Don't** criar telas que só funcionem no tema claro; o escuro é a referência.
