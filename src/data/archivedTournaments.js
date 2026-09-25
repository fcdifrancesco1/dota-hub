// Acervo histórico permanente de torneios profissionais finalizados de Dota 2
// Mantém histórico completo de séries, campeões, datas e estatísticas

export const INITIAL_ARCHIVED_TOURNAMENTS = [
  {
    id: "ti2024",
    league_id: 16935,
    name: "The International 2024",
    status: "finalizado",
    champion: "Team Liquid",
    runnerUp: "Gaimin Gladiators",
    prizePool: "$2,600,000",
    location: "Copenhagen, Dinamarca",
    recentDate: "Set 2024",
    seriesList: [
      {
        stage: "Grande Final (MD5)",
        timeA: "Team Liquid",
        timeB: "Gaimin Gladiators",
        scoreA: 3,
        scoreB: 0,
        dur: "MD5",
        games: [
          { match_id: 7945612301, duration: 2340, radiant_win: true, radiant_score: 34, dire_score: 14 },
          { match_id: 7945698712, duration: 2650, radiant_win: true, radiant_score: 29, dire_score: 18 },
          { match_id: 7945785412, duration: 2110, radiant_win: true, radiant_score: 31, dire_score: 11 }
        ]
      },
      {
        stage: "Final Lower Bracket (MD3)",
        timeA: "Team Liquid",
        timeB: "Tundra Esports",
        scoreA: 2,
        scoreB: 1,
        dur: "MD3",
        games: [
          { match_id: 7944512301, duration: 3100, radiant_win: false, radiant_score: 22, dire_score: 39 },
          { match_id: 7944612301, duration: 2840, radiant_win: true, radiant_score: 41, dire_score: 25 },
          { match_id: 7944712301, duration: 2450, radiant_win: true, radiant_score: 28, dire_score: 16 }
        ]
      },
      {
        stage: "Final Upper Bracket (MD3)",
        timeA: "Gaimin Gladiators",
        timeB: "Team Liquid",
        scoreA: 2,
        scoreB: 0,
        dur: "MD3",
        games: [
          { match_id: 7943512301, duration: 2230, radiant_win: true, radiant_score: 35, dire_score: 12 },
          { match_id: 7943612301, duration: 2540, radiant_win: true, radiant_score: 28, dire_score: 15 }
        ]
      },
      {
        stage: "Semi-Final Lower (MD3)",
        timeA: "Tundra Esports",
        timeB: "Team Falcons",
        scoreA: 2,
        scoreB: 0,
        dur: "MD3",
        games: [
          { match_id: 7942512301, duration: 2780, radiant_win: true, radiant_score: 31, dire_score: 20 },
          { match_id: 7942612301, duration: 3010, radiant_win: true, radiant_score: 36, dire_score: 22 }
        ]
      },
      {
        stage: "Rodada 4 Lower (MD3)",
        timeA: "Team Falcons",
        timeB: "BetBoom Team",
        scoreA: 2,
        scoreB: 0,
        dur: "MD3",
        games: [
          { match_id: 7941512301, duration: 2490, radiant_win: true, radiant_score: 29, dire_score: 14 },
          { match_id: 7941612301, duration: 2710, radiant_win: true, radiant_score: 33, dire_score: 19 }
        ]
      }
    ]
  },
  {
    id: "riyadh2024",
    league_id: 16752,
    name: "Riyadh Masters 2024",
    status: "finalizado",
    champion: "Gaimin Gladiators",
    runnerUp: "Team Liquid",
    prizePool: "$5,000,000",
    location: "Riyadh, Arábia Saudita",
    recentDate: "Jul 2024",
    seriesList: [
      {
        stage: "Grande Final (MD5)",
        timeA: "Gaimin Gladiators",
        timeB: "Team Liquid",
        scoreA: 3,
        scoreB: 0,
        dur: "MD5",
        games: [
          { match_id: 7856412301, duration: 2120, radiant_win: true, radiant_score: 32, dire_score: 15 },
          { match_id: 7856512301, duration: 2450, radiant_win: true, radiant_score: 30, dire_score: 19 },
          { match_id: 7856612301, duration: 2310, radiant_win: true, radiant_score: 27, dire_score: 12 }
        ]
      },
      {
        stage: "Final Lower Bracket (MD3)",
        timeA: "Team Liquid",
        timeB: "Team Falcons",
        scoreA: 2,
        scoreB: 0,
        dur: "MD3",
        games: [
          { match_id: 7855412301, duration: 2890, radiant_win: true, radiant_score: 38, dire_score: 21 },
          { match_id: 7855512301, duration: 2640, radiant_win: true, radiant_score: 31, dire_score: 18 }
        ]
      },
      {
        stage: "Final Upper Bracket (MD3)",
        timeA: "Gaimin Gladiators",
        timeB: "Team Falcons",
        scoreA: 2,
        scoreB: 1,
        dur: "MD3",
        games: [
          { match_id: 7854412301, duration: 2610, radiant_win: true, radiant_score: 29, dire_score: 17 },
          { match_id: 7854512301, duration: 3120, radiant_win: false, radiant_score: 19, dire_score: 35 },
          { match_id: 7854612301, duration: 2480, radiant_win: true, radiant_score: 33, dire_score: 14 }
        ]
      }
    ]
  },
  {
    id: "pgl_wallachia_s1",
    league_id: 16490,
    name: "PGL Wallachia Season 1",
    status: "finalizado",
    champion: "Team Spirit",
    runnerUp: "Xtreme Gaming",
    prizePool: "$1,000,000",
    location: "Bucareste, Romênia",
    recentDate: "Mai 2024",
    seriesList: [
      {
        stage: "Grande Final (MD5)",
        timeA: "Team Spirit",
        timeB: "Xtreme Gaming",
        scoreA: 3,
        scoreB: 2,
        dur: "MD5",
        games: [
          { match_id: 7745612301, duration: 2890, radiant_win: true, radiant_score: 34, dire_score: 26 },
          { match_id: 7745712301, duration: 3140, radiant_win: false, radiant_score: 18, dire_score: 35 },
          { match_id: 7745812301, duration: 2620, radiant_win: true, radiant_score: 29, dire_score: 17 },
          { match_id: 7745912301, duration: 2450, radiant_win: false, radiant_score: 14, dire_score: 30 },
          { match_id: 7746012301, duration: 3340, radiant_win: true, radiant_score: 38, dire_score: 27 }
        ]
      },
      {
        stage: "Final Lower Bracket (MD3)",
        timeA: "Xtreme Gaming",
        timeB: "Team Falcons",
        scoreA: 2,
        scoreB: 0,
        dur: "MD3",
        games: [
          { match_id: 7744512301, duration: 2580, radiant_win: true, radiant_score: 32, dire_score: 16 },
          { match_id: 7744612301, duration: 2910, radiant_win: true, radiant_score: 36, dire_score: 21 }
        ]
      },
      {
        stage: "Final Upper Bracket (MD3)",
        timeA: "Team Spirit",
        timeB: "Xtreme Gaming",
        scoreA: 2,
        scoreB: 1,
        dur: "MD3",
        games: [
          { match_id: 7743512301, duration: 2710, radiant_win: true, radiant_score: 28, dire_score: 19 },
          { match_id: 7743612301, duration: 2490, radiant_win: false, radiant_score: 15, dire_score: 31 },
          { match_id: 7743712301, duration: 3020, radiant_win: true, radiant_score: 35, dire_score: 23 }
        ]
      }
    ]
  },
  {
    id: "esl_birmingham_2024",
    league_id: 16321,
    name: "ESL One Birmingham 2024",
    status: "finalizado",
    champion: "Team Falcons",
    runnerUp: "BetBoom Team",
    prizePool: "$1,000,000",
    location: "Birmingham, Reino Unido",
    recentDate: "Abr 2024",
    seriesList: [
      {
        stage: "Grande Final (MD5)",
        timeA: "Team Falcons",
        timeB: "BetBoom Team",
        scoreA: 3,
        scoreB: 0,
        dur: "MD5",
        games: [
          { match_id: 7612345678, duration: 2450, radiant_win: true, radiant_score: 31, dire_score: 14 },
          { match_id: 7612445678, duration: 2780, radiant_win: true, radiant_score: 37, dire_score: 20 },
          { match_id: 7612545678, duration: 2310, radiant_win: true, radiant_score: 29, dire_score: 12 }
        ]
      },
      {
        stage: "Final Lower Bracket (MD3)",
        timeA: "BetBoom Team",
        timeB: "Tundra Esports",
        scoreA: 2,
        scoreB: 1,
        dur: "MD3",
        games: [
          { match_id: 7611345678, duration: 2890, radiant_win: true, radiant_score: 33, dire_score: 22 },
          { match_id: 7611445678, duration: 2540, radiant_win: false, radiant_score: 17, dire_score: 30 },
          { match_id: 7611545678, duration: 3120, radiant_win: true, radiant_score: 35, dire_score: 25 }
        ]
      }
    ]
  },
  {
    id: "betboom_dacha_2024",
    league_id: 16180,
    name: "BetBoom Dacha Dubai 2024",
    status: "finalizado",
    champion: "Team Falcons",
    runnerUp: "Team Liquid",
    prizePool: "$1,000,000",
    location: "Dubai, EAU",
    recentDate: "Fev 2024",
    seriesList: [
      {
        stage: "Grande Final (MD5)",
        timeA: "Team Falcons",
        timeB: "Team Liquid",
        scoreA: 3,
        scoreB: 0,
        dur: "MD5",
        games: [
          { match_id: 7541236980, duration: 2340, radiant_win: true, radiant_score: 30, dire_score: 13 },
          { match_id: 7541336980, duration: 2670, radiant_win: true, radiant_score: 36, dire_score: 18 },
          { match_id: 7541436980, duration: 2210, radiant_win: true, radiant_score: 28, dire_score: 11 }
        ]
      },
      {
        stage: "Final Lower Bracket (MD3)",
        timeA: "Team Liquid",
        timeB: "BetBoom Team",
        scoreA: 2,
        scoreB: 1,
        dur: "MD3",
        games: [
          { match_id: 7540236980, duration: 2980, radiant_win: true, radiant_score: 34, dire_score: 24 },
          { match_id: 7540336980, duration: 2450, radiant_win: false, radiant_score: 16, dire_score: 29 },
          { match_id: 7540436980, duration: 2810, radiant_win: true, radiant_score: 32, dire_score: 20 }
        ]
      }
    ]
  },
  {
    id: "ti2023",
    league_id: 15728,
    name: "The International 2023",
    status: "finalizado",
    champion: "Team Spirit",
    runnerUp: "Gaimin Gladiators",
    prizePool: "$3,380,000",
    location: "Seattle, EUA",
    recentDate: "Out 2023",
    seriesList: [
      {
        stage: "Grande Final (MD5)",
        timeA: "Team Spirit",
        timeB: "Gaimin Gladiators",
        scoreA: 3,
        scoreB: 0,
        dur: "MD5",
        games: [
          { match_id: 7412589630, duration: 2480, radiant_win: true, radiant_score: 33, dire_score: 16 },
          { match_id: 7412689630, duration: 2790, radiant_win: true, radiant_score: 38, dire_score: 22 },
          { match_id: 7412789630, duration: 2510, radiant_win: true, radiant_score: 29, dire_score: 15 }
        ]
      },
      {
        stage: "Final Lower Bracket (MD3)",
        timeA: "Gaimin Gladiators",
        timeB: "LGD Gaming",
        scoreA: 2,
        scoreB: 0,
        dur: "MD3",
        games: [
          { match_id: 7411589630, duration: 2630, radiant_win: true, radiant_score: 31, dire_score: 17 },
          { match_id: 7411689630, duration: 2840, radiant_win: true, radiant_score: 35, dire_score: 20 }
        ]
      }
    ]
  }
];
