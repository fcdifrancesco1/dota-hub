// Configurações globais do portal competitivo de Dota 2
export const SITE_CONFIG = {
  name: "DotaHub Brasil",
  tagline: "O portal definitivo do Dota 2 competitivo em português",
  shortName: "DotaHub",
  version: "2.0.0",

  // Times favoritos em destaque padrão (IDs da OpenDota / Valve)
  // Falcons: 8255888, Liquid: 2163
  favoriteTeamIds: [8255888, 2163],
  favoriteTeams: [
    { id: 9247354, name: "Team Falcons", tag: "Falcons" },
    { id: 2163, name: "Team Liquid", tag: "Liquid" }
  ],

  // Identidade Visual
  colors: {
    radiant: "#00d26a",
    dire: "#e03e2d",
    gold: "#c59b27",
    primary: "#e03e2d",
    secondary: "#c59b27",
    bgDark: "#0c0e14",
    cardDark: "#131722",
    borderDark: "#212838"
  },

  // Links da comunidade
  community: {
    discord: "https://discord.gg/dota2brasil",
    whatsapp: "https://chat.whatsapp.com/dota2brasil",
    github: "https://github.com/fcdifrancesco1/dota-hub"
  },

  // Pontuação do Bolão (Palpites) - Centralizada em um único arquivo conforme especificação
  predictionPoints: {
    correctWinner: 3, // Acertar o vencedor da série/partida
    exactScore: 5,    // Acertar o placar exato (ex: 2x1 em MD3)
    upsetBonus: 2     // Bônus se apostou no time com menor % de votos
  },

  // URLs CDN
  steamCdn: "https://cdn.cloudflare.steamstatic.com",
  openDotaApi: "https://api.opendota.com/api"
};
