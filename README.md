# 🛡️ DotaHub Brasil — Portal Competitivo de Dota 2

O **DotaHub Brasil** é uma plataforma moderna e completa em português (pt-BR) dedicada ao acompanhamento da cena profissional de Dota 2: partidas ao vivo em tempo real via telemetria Valve GOTV, agenda de torneios, estatísticas detalhadas de heróis e jogadores, gráficos de vantagem de ouro/XP, bolão de palpites (gamificação) e painel administrativo.

---

## 🚀 Tecnologias Utilizadas

- **Front-end:** React 18, Vite 5, Tailwind CSS, Lucide React
- **Navegação & Rotas:** React Router DOM
- **Gráficos & Telemetria:** Recharts (gráfico de vantagem de ouro/XP e radar comparativo de atletas)
- **Banco de Dados & Autenticação:** Supabase (PostgreSQL + RLS + Supabase Auth)
- **Back-end Serverless:** Vercel Serverless Functions (`/api`)
- **PWA:** Manifest e Service Worker (Cache-first para imagens Steam CDN, Network-first para telemetria)
- **Hospedagem:** Vercel

---

## 📋 Pré-requisitos

Antes de iniciar, você vai precisar ter instalado no seu computador:
1. **Node.js** (versão 18 ou superior): [Download Node.js](https://nodejs.org/)
2. **Git**: [Download Git](https://git-scm.com/)
3. Uma conta gratuita no [GitHub](https://github.com/)
4. Uma conta gratuita no [Supabase](https://supabase.com/)
5. Uma conta gratuita na [Vercel](https://vercel.com/)
6. Uma conta na [Steam](https://store.steampowered.com/)

---

## 🔑 Passo 1: Obter a Chave da Steam Web API (Gratuita)

A chave da Steam é necessária para buscar partidas profissionais ao vivo em tempo real diretamente dos servidores da Valve:

1. Acesse o portal de desenvolvedores da Valve: **[https://steamcommunity.com/dev/apikey](https://steamcommunity.com/dev/apikey)**
2. Faça login com a sua conta Steam.
3. No campo **Domain Name** (Nome de Domínio), você pode digitar qualquer valor (por exemplo: `localhost` ou `dotahub.vercel.app`).
4. Marque a caixa aceitando os termos e clique em **Register** (Registrar).
5. Copie a sua chave (uma sequência de 32 letras e números) e guarde-a.

---

## 🗄️ Passo 2: Criar o Projeto no Supabase e Rodar o SQL

1. Acesse **[https://supabase.com](https://supabase.com)** e clique em **Sign In** (pode entrar usando o seu GitHub).
2. Clique no botão verde **New project** (Novo projeto).
3. Preencha os campos:
   - **Name**: `dotahub`
   - **Database Password**: Escolha uma senha segura e anote.
   - **Region**: Escolha a região mais próxima (ex: `South America (São Paulo)` ou `East US`).
4. Clique em **Create new project** e aguarde cerca de 2 minutos até o banco ser provisionado.
5. No menu lateral esquerdo, clique no ícone **SQL Editor** (ícone de terminal `>_`).
6. Abra o arquivo **`supabase/schema.sql`** deste projeto, copie todo o seu conteúdo, cole no SQL Editor do Supabase e clique no botão verde **Run** (Executar).
7. *(Opcional)* Em seguida, abra o arquivo **`supabase/seed.sql`**, copie todo o conteúdo, cole no SQL Editor e clique em **Run** para carregar dados iniciais de demonstração (2 campeonatos, 8 times, 20 partidas, heróis e artigos).
8. Agora pegue as chaves de acesso:
   - No menu lateral esquerdo do Supabase, clique na engrenagem **Project Settings** (Configurações do Projeto).
   - Clique na aba **API**.
   - Copie a **Project URL** (ex: `https://xyzcompany.supabase.co`).
   - Copie a chave **anon public** (chave pública do front-end).
   - Copie a chave **service_role** (chave secreta de admin para o backend).

---

## ⚙️ Passo 3: Configurar as Variáveis de Ambiente

Na raiz do projeto no seu computador, crie um arquivo chamado **`.env.local`** (ou copie a partir de `.env.example`):

```bash
# No Windows PowerShell:
Copy-Item .env.example .env.local
```

Abra o arquivo `.env.local` e preencha com as suas chaves reais:

```env
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-secreta-aqui

# Steam Web API
STEAM_API_KEY=sua-chave-steam-aqui

# Token para o Cron da Vercel
CRON_SECRET=um-token-secreto-qualquer-aqui
```

> **Nota:** O projeto possui fallback automático em memória! Se você rodar localmente antes de configurar o Supabase, o site abrirá normalmente exibindo os dados de demonstração sem erros na tela.

---

## 💻 Passo 4: Executar o Projeto Localmente

1. Abra o terminal (PowerShell ou Prompt de Comando) na pasta do projeto:
   ```bash
   cd C:\Users\Felipe\Documents\Felipe\VSCode\dota-hub
   ```
2. Instale as dependências (caso ainda não tenha instalado):
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
4. Abra o seu navegador e acesse: **[http://localhost:5173](http://localhost:5173)**

---

## 🐙 Passo 5: Subir as Alterações para o GitHub

Execute os comandos abaixo no terminal, **uma linha por vez**:

```bash
git status
git add .
git commit -m "Evolucao completa do DotaHub: Supabase, React Router, Recharts, PWA e modais"
git branch -M main
git push origin main
```

---

## ☁️ Passo 6: Deploy na Vercel e Configuração do Cron

1. Acesse **[https://vercel.com](https://vercel.com)** e faça login com a sua conta do GitHub.
2. No painel principal, clique em **Add New...** -> **Project**.
3. Localize o repositório `dota-hub` na lista e clique no botão **Import**.
4. Na tela de configuração:
   - **Framework Preset**: Escolha `Vite`.
   - **Root Directory**: Mantenha `./`.
5. Expanda a seção **Environment Variables** (Variáveis de Ambiente) e adicione as variáveis:
   - `VITE_SUPABASE_URL`: sua URL do Supabase
   - `VITE_SUPABASE_ANON_KEY`: sua chave anon
   - `SUPABASE_SERVICE_ROLE_KEY`: sua chave service_role
   - `STEAM_API_KEY`: sua chave Steam Web API
   - `CRON_SECRET`: seu segredo de cron
6. Clique no botão **Deploy**.
7. Em cerca de 1 minuto, seu site estará publicado com uma URL pública (ex: `https://dota-hub-xyz.vercel.app`)!

### Configuração do Vercel Cron (Sincronização Automática)
O arquivo `vercel.json` na raiz do projeto já agenda a execução automática:
```json
{
  "crons": [
    {
      "path": "/api/sync-opendota",
      "schedule": "*/10 * * * *"
    }
  ]
}
```
Isso sincroniza as últimas partidas profissionais da OpenDota a cada 10 minutos automaticamente.

---

## 🎯 Estrutura do Projeto

```
dota-hub/
├── api/                       # Funções Serverless da Vercel
│   ├── live.js                # Telemetria GOTV e Steam API
│   ├── sync-opendota.js       # Sincronização periódica OpenDota
│   ├── sync-steam.js          # Sincronização periódica Steam Web API
│   └── upcoming.js            # Parser de partidas futuras
├── public/                    # Arquivos públicos e PWA
│   ├── manifest.json          # Manifesto PWA
│   ├── sw.js                  # Service Worker (Cache-first e Network-first)
│   └── aegis.png              # Ícone oficial
├── src/
│   ├── components/            # Componentes reutilizáveis
│   │   ├── home/              # Hero, Live Ticker, Cards de Stats, Próximas 24h
│   │   ├── AdvantageGraph.jsx # Gráficos de ouro/xp em SVG / Recharts
│   │   ├── Header.jsx         # Navbar fixa com blur, badge ao vivo e menu mobile
│   │   └── Footer.jsx         # Rodapé com créditos, comunidade e timestamp
│   ├── context/
│   │   ├── AppContext.jsx     # Contexto global (partidas, séries, live, modais)
│   │   └── AuthContext.jsx    # Autenticação e perfil admin
│   ├── pages/                 # Páginas da aplicação (React Router)
│   │   ├── Home.jsx           # Página Inicial completa
│   │   ├── LivePage.jsx       # Central Ao Vivo com Twitch embed
│   │   ├── TournamentsPage.jsx# Torneios & Brackets
│   │   ├── MatchesPage.jsx    # Histórico de partidas
│   │   ├── TeamsPage.jsx      # Ranking e perfis de times
│   │   ├── PlayersPage.jsx    # Diretório e Comparador Radar de atletas
│   │   ├── HeroesPage.jsx     # Meta do Patch e Tier List
│   │   ├── PredictionsPage.jsx# Bolão de palpites e badges
│   │   ├── AnalysesPage.jsx   # Blog tático e tendências automáticas
│   │   └── AdminPage.jsx      # Painel admin protegido
│   ├── services/
│   │   ├── api.js             # Chamadas resilientes, cache e normalização
│   │   └── supabase.js        # Cliente Supabase Dual-Mode com fallback local
│   ├── config/
│   │   └── siteConfig.js      # Centralização de cores, times favoritos e regras
│   ├── App.jsx                # Rotas e montagem dos modais globais
│   └── main.jsx               # Ponto de entrada do React
├── supabase/
│   ├── schema.sql             # Esquema completo do PostgreSQL com RLS e Views
│   └── seed.sql               # Dados de teste (2 torneios, 8 times, 20 jogos)
├── .env.example               # Modelo de variáveis de ambiente
└── README.md                  # Este guia
```

---

## 🎮 Contribuindo e Suporte

Ficou com alguma dúvida ou quer sugerir uma nova funcionalidade? Entre em contato pelo nosso Discord comunitário ou abra uma issue no repositório!
