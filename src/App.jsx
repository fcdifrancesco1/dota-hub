import React, { useState, useEffect } from 'react';
import { Flame, Trophy, Award, History, X } from 'lucide-react';

const OPENDOTA_BASE = "https://api.opendota.com/api";
const STEAM_CDN = "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react";

const MAP_MIN = -8288, MAP_MAX = 8288;
function worldToPct(x, y) {
  const fx = (x - MAP_MIN) / (MAP_MAX - MAP_MIN);
  const fy = 1 - (y - MAP_MIN) / (MAP_MAX - MAP_MIN);
  return { 
    left: `${Math.min(100, Math.max(0, fx * 100)).toFixed(1)}%`, 
    top: `${Math.min(100, Math.max(0, fy * 100)).toFixed(1)}%` 
  };
}

export default function App() {
  const [currentTab, setCurrentTab] = useState('hub');
  const [liveGames, setLiveGames] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [tiFinishedMatches, setTiFinishedMatches] = useState([]);
  const [selectedLiveGame, setSelectedLiveGame] = useState(null);
  const [selectedSeriesDetail, setSelectedSeriesDetail] = useState(null);
  const [activeMapIndex, setActiveMapIndex] = useState(0);
  const [mmrPlayers, setMmrPlayers] = useState([]);
  const [mmrLoading, setMmrLoading] = useState(false);
  const [mmrDivision, setMmrDivision] = useState('europe');

  // 1. CARREGAR JOGOS DO ÚLTIMO TORNEIO FINALIZADO (THE INTERNATIONAL 2026 - PLAYOFFS)
  useEffect(() => {
    const ti2026Playoffs = [
      {
        id: "final_ti2026",
        stage: "Grande Final (BO5)",
        timeA: "Team Spirit",
        timeB: "TEAM VISION",
        scoreA: 3,
        scoreB: 2,
        winner: "Team Spirit",
        dur: "5 mapas",
        games: [
          {
            mapNumber: 1,
            duracao: "38:42",
            vencedor: "Team Spirit (Radiant)",
            draft: {
              radiantBans: ["Doom", "Shadow Demon", "Beastmaster"],
              radiantPicks: ["Morphling", "Storm Spirit", "Centaur Warrunner", "Hoodwink", "Clockwerk"],
              direBans: ["Batrider", "Naga Siren", "Chen"],
              direPicks: ["Luna", "Puck", "Mars", "Rubick", "Disruptor"]
            },
            radiantRoster: [
              { pos: 1, name: "Yatoro", hero: "Morphling", kda: "12/1/8", gpm: 790, xpm: 840, items: ["Power Treads", "Manta Style", "Butterfly", "Satanic", "Eye of Skadi", "Black King Bar"] },
              { pos: 2, name: "Larl", hero: "Storm Spirit", kda: "8/2/14", gpm: 680, xpm: 730, items: ["Power Treads", "Kaya and Sange", "Orchid Malevolence", "Black King Bar", "Shiva's Guard", "Aghanim's Scepter"] },
              { pos: 3, name: "Collapse", hero: "Centaur Warrunner", kda: "4/3/18", gpm: 540, xpm: 610, items: ["Phase Boots", "Blink Dagger", "Pipe of Insight", "Heart of Tarrasque", "Crimson Guard", "Lotus Orb"] },
              { pos: 4, name: "rue", hero: "Hoodwink", kda: "3/3/16", gpm: 390, xpm: 450, items: ["Arcane Boots", "Aether Lens", "Gleipnir", "Force Staff", "Eul's Scepter", "Solar Crest"] },
              { pos: 5, name: "not me", hero: "Clockwerk", kda: "2/5/17", gpm: 310, xpm: 380, items: ["Tranquil Boots", "Force Staff", "Glimmer Cape", "Aghanim's Shard", "Blade Mail", "Observer Ward"] }
            ],
            direRoster: [
              { pos: 1, name: "Kiritych", hero: "Luna", kda: "4/5/3", gpm: 670, xpm: 710, items: ["Power Treads", "Manta Style", "Black King Bar", "Dragon Lance", "Butterfly", "Mask of Madness"] },
              { pos: 2, name: "Squad1x", hero: "Puck", kda: "5/4/6", gpm: 610, xpm: 650, items: ["Phase Boots", "Witch Blade", "Blink Dagger", "Eul's Scepter", "Linken's Sphere", "Dagon"] },
              { pos: 3, name: "Fng", hero: "Mars", kda: "2/6/7", gpm: 460, xpm: 520, items: ["Phase Boots", "Blink Dagger", "Black King Bar", "Refresher Orb", "Desolator", "Vladmir's Offering"] },
              { pos: 4, name: "sayuw", hero: "Rubick", kda: "1/5/9", gpm: 340, xpm: 390, items: ["Arcane Boots", "Aether Lens", "Blink Dagger", "Force Staff", "Glimmer Cape", "Ghost Scepter"] },
              { pos: 5, name: "Pantomem", hero: "Disruptor", kda: "2/8/6", gpm: 280, xpm: 330, items: ["Arcane Boots", "Glimmer Cape", "Force Staff", "Aghanim's Shard", "Observer Ward", "Town Portal Scroll"] }
            ]
          },
          {
            mapNumber: 2,
            duracao: "42:15",
            vencedor: "TEAM VISION (Dire)",
            draft: {
              radiantBans: ["Chen", "Naga Siren", "Storm Spirit"],
              radiantPicks: ["Faceless Void", "Ember Spirit", "Slardar", "Tusk", "Shadow Shaman"],
              direBans: ["Morphling", "Batrider", "Hoodwink"],
              direPicks: ["Terrorblade", "Leshrac", "Dark Seer", "Earth Spirit", "Treant Protector"]
            },
            radiantRoster: [
              { pos: 1, name: "Yatoro", hero: "Faceless Void", kda: "6/4/5", gpm: 710, xpm: 750, items: ["Power Treads", "Maelstrom", "Black King Bar", "Manta Style", "Eye of Skadi", "Daedalus"] },
              { pos: 2, name: "Larl", hero: "Ember Spirit", kda: "5/5/8", gpm: 620, xpm: 670, items: ["Phase Boots", "Battle Fury", "Mage Slayer", "Black King Bar", "Shiva's Guard", "Desolator"] },
              { pos: 3, name: "Collapse", hero: "Slardar", kda: "3/6/7", gpm: 490, xpm: 540, items: ["Power Treads", "Blink Dagger", "Black King Bar", "Aghanim's Scepter", "Moon Shard", "Assault Cuirass"] },
              { pos: 4, name: "rue", hero: "Tusk", kda: "2/7/9", gpm: 340, xpm: 400, items: ["Phase Boots", "Blink Dagger", "Force Staff", "Desolator", "Solar Crest", "Ghost Scepter"] },
              { pos: 5, name: "not me", hero: "Shadow Shaman", kda: "1/8/8", gpm: 270, xpm: 320, items: ["Arcane Boots", "Aether Lens", "Blink Dagger", "Glimmer Cape", "Aghanim's Shard", "Wind Lace"] }
            ],
            direRoster: [
              { pos: 1, name: "Kiritych", hero: "Terrorblade", kda: "11/2/9", gpm: 820, xpm: 870, items: ["Power Treads", "Manta Style", "Eye of Skadi", "Butterfly", "Satanic", "Daedalus"] },
              { pos: 2, name: "Squad1x", hero: "Leshrac", kda: "9/3/12", gpm: 740, xpm: 780, items: ["Bloodstone", "Boots of Travel", "Kaya and Sange", "Black King Bar", "Shiva's Guard", "Eternal Shroud"] },
              { pos: 3, name: "Fng", hero: "Dark Seer", kda: "4/2/16", gpm: 550, xpm: 610, items: ["Guardian Greaves", "Blink Dagger", "Pipe of Insight", "Aghanim's Scepter", "Refresher Orb", "Lotus Orb"] },
              { pos: 4, name: "sayuw", hero: "Earth Spirit", kda: "3/4/18", gpm: 380, xpm: 430, items: ["Tranquil Boots", "Urn of Shadows", "Blink Dagger", "Black King Bar", "Force Staff", "Ghost Scepter"] },
              { pos: 5, name: "Pantomem", hero: "Treant Protector", kda: "2/3/20", gpm: 310, xpm: 370, items: ["Arcane Boots", "Solar Crest", "Holy Locket", "Aghanim's Shard", "Glimmer Cape", "Blink Dagger"] }
            ]
          },
          {
            mapNumber: 3,
            duracao: "31:10",
            vencedor: "Team Spirit (Radiant)",
            draft: {
              radiantBans: ["Terrorblade", "Leshrac", "Puck"],
              radiantPicks: ["Ursa", "Pangolier", "Magnus", "Mirana", "Jakiro"],
              direBans: ["Morphling", "Centaur Warrunner", "Batrider"],
              direPicks: ["Sven", "Tiny", "Brewmaster", "Muerta", "Grimstroke"]
            },
            radiantRoster: [
              { pos: 1, name: "Yatoro", hero: "Ursa", kda: "14/0/6", gpm: 840, xpm: 890, items: ["Phase Boots", "Diffusal Blade", "Blink Dagger", "Black King Bar", "Abyssal Blade", "Satanic"] },
              { pos: 2, name: "Larl", hero: "Pangolier", kda: "6/2/11", gpm: 660, xpm: 710, items: ["Arcane Boots", "Diffusal Blade", "Blink Dagger", "Eul's Scepter", "Black King Bar", "Aghanim's Shard"] },
              { pos: 3, name: "Collapse", hero: "Magnus", kda: "5/1/15", gpm: 580, xpm: 640, items: ["Power Treads", "Blink Dagger", "Force Staff", "Refresher Orb", "Harpoon", "Shiva's Guard"] },
              { pos: 4, name: "rue", hero: "Mirana", kda: "4/2/13", gpm: 410, xpm: 460, items: ["Power Treads", "Spirit Vessel", "Eul's Scepter", "Solar Crest", "Force Staff", "Glimmer Cape"] },
              { pos: 5, name: "not me", hero: "Jakiro", kda: "2/3/17", gpm: 330, xpm: 390, items: ["Arcane Boots", "Aether Lens", "Force Staff", "Glimmer Cape", "Aghanim's Shard", "Observer Ward"] }
            ],
            direRoster: [
              { pos: 1, name: "Kiritych", hero: "Sven", kda: "3/7/2", gpm: 620, xpm: 660, items: ["Power Treads", "Echo Sabre", "Black King Bar", "Mask of Madness", "Blink Dagger", "Daedalus"] },
              { pos: 2, name: "Squad1x", hero: "Tiny", kda: "2/6/4", gpm: 560, xpm: 600, items: ["Power Treads", "Blink Dagger", "Echo Sabre", "Black King Bar", "Daedalus", "Assault Cuirass"] },
              { pos: 3, name: "Fng", hero: "Brewmaster", kda: "1/5/6", gpm: 420, xpm: 480, items: ["Phase Boots", "Urn of Shadows", "Radiance", "Black King Bar", "Refresher Orb", "Shiva's Guard"] },
              { pos: 4, name: "sayuw", hero: "Muerta", kda: "1/6/5", gpm: 320, xpm: 380, items: ["Power Treads", "Dragon Lance", "Maelstrom", "Blink Dagger", "Ghost Scepter", "Force Staff"] },
              { pos: 5, name: "Pantomem", hero: "Grimstroke", kda: "1/7/4", gpm: 260, xpm: 310, items: ["Arcane Boots", "Aether Lens", "Glimmer Cape", "Force Staff", "Aghanim's Shard", "Wind Lace"] }
            ]
          },
          {
            mapNumber: 4,
            duracao: "47:20",
            vencedor: "TEAM VISION (Radiant)",
            draft: {
              radiantBans: ["Ursa", "Magnus", "Centaur Warrunner"],
              radiantPicks: ["Medusa", "Invoker", "Beastmaster", "Snapfire", "Bane"],
              direBans: ["Terrorblade", "Morphling", "Storm Spirit"],
              direPicks: ["Chaos Knight", "Queen of Pain", "Tidehunter", "Rubick", "Lich"]
            },
            radiantRoster: [
              { pos: 1, name: "Kiritych", hero: "Medusa", kda: "9/1/14", gpm: 860, xpm: 910, items: ["Power Treads", "Manta Style", "Butterfly", "Eye of Skadi", "Daedalus", "Disperser"] },
              { pos: 2, name: "Squad1x", hero: "Invoker", kda: "8/2/16", gpm: 710, xpm: 760, items: ["Boots of Travel", "Aghanim's Scepter", "Refresher Orb", "Black King Bar", "Shiva's Guard", "Octarine Core"] },
              { pos: 3, name: "Fng", hero: "Beastmaster", kda: "4/4/15", gpm: 530, xpm: 590, items: ["Helm of the Overlord", "Blink Dagger", "Refresher Orb", "Black King Bar", "Boots of Bearing", "Solar Crest"] },
              { pos: 4, name: "sayuw", hero: "Snapfire", kda: "3/5/18", gpm: 400, xpm: 460, items: ["Tranquil Boots", "Rod of Atos", "Aghanim's Scepter", "Force Staff", "Blink Dagger", "Ghost Scepter"] },
              { pos: 5, name: "Pantomem", hero: "Bane", kda: "2/5/19", gpm: 300, xpm: 360, items: ["Arcane Boots", "Aether Lens", "Glimmer Cape", "Aghanim's Shard", "Blink Dagger", "Lotus Orb"] }
            ],
            direRoster: [
              { pos: 1, name: "Yatoro", hero: "Chaos Knight", kda: "5/6/7", gpm: 680, xpm: 720, items: ["Power Treads", "Armlet of Mordiggian", "Echo Sabre", "Heart of Tarrasque", "Black King Bar", "Assault Cuirass"] },
              { pos: 2, name: "Larl", hero: "Queen of Pain", kda: "6/5/6", gpm: 640, xpm: 690, items: ["Power Treads", "Witch Blade", "Black King Bar", "Aghanim's Scepter", "Shiva's Guard", "Refresher Orb"] },
              { pos: 3, name: "Collapse", hero: "Tidehunter", kda: "2/5/8", gpm: 460, xpm: 510, items: ["Phase Boots", "Blink Dagger", "Refresher Orb", "Pipe of Insight", "Shiva's Guard", "Lotus Orb"] },
              { pos: 4, name: "rue", hero: "Rubick", kda: "2/7/9", gpm: 330, xpm: 380, items: ["Arcane Boots", "Aether Lens", "Blink Dagger", "Force Staff", "Glimmer Cape", "Ghost Scepter"] },
              { pos: 5, name: "not me", hero: "Lich", kda: "1/7/8", gpm: 270, xpm: 320, items: ["Tranquil Boots", "Glimmer Cape", "Force Staff", "Aghanim's Shard", "Aether Lens", "Wind Lace"] }
            ]
          },
          {
            mapNumber: 5,
            duracao: "36:55",
            vencedor: "Team Spirit (Dire - Campeã)",
            draft: {
              radiantBans: ["Morphling", "Magnus", "Pangolier"],
              radiantPicks: ["Dragon Knight", "Storm Spirit", "Enigma", "Tusk", "Shadow Demon"],
              direBans: ["Medusa", "Invoker", "Terrorblade"],
              direPicks: ["Anti-Mage", "Kunkka", "Centaur Warrunner", "Clockwerk", "Disruptor"]
            },
            radiantRoster: [
              { pos: 1, name: "Kiritych", hero: "Dragon Knight", kda: "3/6/5", gpm: 650, xpm: 690, items: ["Power Treads", "Manta Style", "Black King Bar", "Blink Dagger", "Assault Cuirass", "Daedalus"] },
              { pos: 2, name: "Squad1x", hero: "Storm Spirit", kda: "5/7/4", gpm: 620, xpm: 670, items: ["Power Treads", "Kaya and Sange", "Orchid Malevolence", "Black King Bar", "Shiva's Guard", "Linken's Sphere"] },
              { pos: 3, name: "Fng", hero: "Enigma", kda: "2/5/7", gpm: 480, xpm: 540, items: ["Blink Dagger", "Black King Bar", "Refresher Orb", "Guardian Greaves", "Aghanim's Shard", "Aeon Disk"] },
              { pos: 4, name: "sayuw", hero: "Tusk", kda: "2/8/8", gpm: 330, xpm: 390, items: ["Phase Boots", "Blink Dagger", "Force Staff", "Desolator", "Solar Crest", "Ghost Scepter"] },
              { pos: 5, name: "Pantomem", hero: "Shadow Demon", kda: "1/9/6", gpm: 260, xpm: 310, items: ["Arcane Boots", "Aether Lens", "Glimmer Cape", "Force Staff", "Aghanim's Shard", "Wind Lace"] }
            ],
            direRoster: [
              { pos: 1, name: "Yatoro", hero: "Anti-Mage", kda: "15/1/8", gpm: 890, xpm: 940, items: ["Power Treads", "Battle Fury", "Manta Style", "Butterfly", "Abyssal Blade", "Heart of Tarrasque"] },
              { pos: 2, name: "Larl", hero: "Kunkka", kda: "8/2/15", gpm: 720, xpm: 770, items: ["Phase Boots", "Aghanim's Scepter", "Black King Bar", "Shiva's Guard", "Refresher Orb", "Heart of Tarrasque"] },
              { pos: 3, name: "Collapse", hero: "Centaur Warrunner", kda: "6/2/18", gpm: 590, xpm: 650, items: ["Phase Boots", "Blink Dagger", "Heart of Tarrasque", "Pipe of Insight", "Crimson Guard", "Lotus Orb"] },
              { pos: 4, name: "rue", hero: "Clockwerk", kda: "4/4/19", gpm: 410, xpm: 470, items: ["Tranquil Boots", "Force Staff", "Blade Mail", "Glimmer Cape", "Aghanim's Shard", "Lotus Orb"] },
              { pos: 5, name: "not me", hero: "Disruptor", kda: "2/4/22", gpm: 330, xpm: 390, items: ["Arcane Boots", "Aghanim's Scepter", "Glimmer Cape", "Force Staff", "Aether Lens", "Ghost Scepter"] }
            ]
          }
        ]
      },
      { stage: "Final Lower Bracket", timeA: "Team Spirit", timeB: "Team Yandex", scoreA: 2, scoreB: 0, winner: "Team Spirit", dur: "38m / 32m" },
      { stage: "Semi Lower Bracket", timeA: "Team Spirit", timeB: "BB Team", scoreA: 2, scoreB: 0, winner: "Team Spirit", dur: "41m / 29m" },
      { stage: "Final Upper Bracket", timeA: "TEAM VISION", timeB: "Team Yandex", scoreA: 2, scoreB: 1, winner: "TEAM VISION", dur: "3 mapas" },
      { stage: "Round 3 Lower Bracket", timeA: "Nigma Galaxy", timeB: "BB Team", scoreA: 1, scoreB: 2, winner: "BB Team", dur: "3 mapas" },
      { stage: "Round 3 Lower Bracket", timeA: "Team Liquid", timeB: "Team Spirit", scoreA: 0, scoreB: 2, winner: "Team Spirit", dur: "34m / 30m" },
      { stage: "Semi Upper Bracket", timeA: "Nigma Galaxy", timeB: "Team Yandex", scoreA: 1, scoreB: 2, winner: "Team Yandex", dur: "3 mapas" },
      { stage: "Semi Upper Bracket", timeA: "TEAM VISION", timeB: "Team Spirit", scoreA: 2, scoreB: 1, winner: "TEAM VISION", dur: "3 mapas" },
      { stage: "Round 2 Lower Bracket", timeA: "Team Liquid", timeB: "Team Falcons", scoreA: 2, scoreB: 1, winner: "Team Liquid", dur: "3 mapas" },
      { stage: "Round 2 Lower Bracket", timeA: "1win Team", timeB: "BB Team", scoreA: 1, scoreB: 2, winner: "BB Team", dur: "3 mapas" },
    ];
    setTiFinishedMatches(ti2026Playoffs);
  }, []);

  // 2. POLLING DE PARTIDAS AO VIVO (SÓ EXIBE SE HOUVER JOGO EM ANDAMENTO)
  useEffect(() => {
    async function fetchLive() {
      try {
        let list = [];
        try {
          const res = await fetch('/api/live');
          const data = await res.json();
          list = (data && data.result && data.result.games) || (Array.isArray(data) ? data : []);
        } catch {
          const res = await fetch(`${OPENDOTA_BASE}/liveLeagueGames`);
          const data = await res.json();
          list = (data && data.result && data.result.games) || (Array.isArray(data) ? data : []);
        }

        const validLive = (list || []).filter(g => 
          (g.radiant_team || g.scoreboard?.radiant) && 
          (g.dire_team || g.scoreboard?.dire)
        );

        setLiveGames(validLive);
      } catch (err) {
        setLiveGames([]);
      }
    }

    fetchLive();
    const interval = setInterval(fetchLive, 15000);
    return () => clearInterval(interval);
  }, []);

  // 3. JOGOS A SEREM REALIZADOS (VALIDAÇÃO ESTRITA COM A DATA DE HOJE)
  useEffect(() => {
    async function loadUpcomingOnly() {
      try {
        const res = await fetch('/api/upcoming');
        if (res.ok) {
          const data = await res.json();
          const now = Date.now();
          // Validação estrita: só inclui se a data da partida for estritamente maior que agora
          const strictlyFuture = (data || []).filter(m => m.data && new Date(m.data).getTime() > now);
          setUpcomingMatches(strictlyFuture);
        } else {
          setUpcomingMatches([]);
        }
      } catch {
        setUpcomingMatches([]);
      }
    }
    loadUpcomingOnly();
  }, []);

  // 4. LEADERBOARD MMR OFICIAL (VALVE)
  useEffect(() => {
    if (currentTab === 'mmr') {
      setMmrLoading(true);
      fetch(`/api/leaderboard?division=${mmrDivision}`)
        .then(r => r.json())
        .then(d => {
          setMmrPlayers((d.leaderboard || []).slice(0, 50));
          setMmrLoading(false);
        })
        .catch(() => setMmrLoading(false));
    }
  }, [currentTab, mmrDivision]);

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="top-header">
        <button onClick={() => setCurrentTab('hub')} className="logo-btn">
          <div className="logo-btn-inner">
            <Flame size={22} color="#D49244" />
          </div>
        </button>

        <nav className="nav-group">
          <button
            onClick={() => setCurrentTab('hub')}
            className={`nav-tab-btn ${currentTab === 'hub' ? 'active' : ''}`}
          >
            Hub Principal
          </button>
          <button
            onClick={() => setCurrentTab('torneios')}
            className={`nav-tab-btn ${currentTab === 'torneios' ? 'active' : ''}`}
          >
            <Trophy size={14} /> Torneios
          </button>
          <button
            onClick={() => setCurrentTab('mmr')}
            className={`nav-tab-btn ${currentTab === 'mmr' ? 'active' : ''}`}
          >
            <Award size={14} /> Ranking MMR
          </button>
        </nav>

        <div style={{ width: 42 }} />
      </header>

      {/* HUB PRINCIPAL */}
      {currentTab === 'hub' && (
        <div className="main-grid">
          
          {/* ESQUERDA: JOGOS DO THE INTERNATIONAL 2026 (FINALIZADO) */}
          <aside className="sidebar-left">
            <div className="sidebar-header">
              <div className="sidebar-title">
                <History size={14} /> The International 2026
              </div>
              <span className="badge-status">FINALIZADO</span>
            </div>

            <div className="finished-scroll">
              {tiFinishedMatches.map((m, idx) => (
                <div 
                  key={idx} 
                  className="finished-card"
                  onClick={() => {
                    if (m.games && m.games.length) {
                      setSelectedSeriesDetail(m);
                      setActiveMapIndex(0);
                    }
                  }}
                >
                  <div className="finished-card-stage">
                    <span>{m.stage}</span>
                    <span>{m.dur}</span>
                  </div>
                  <div className="finished-team-row">
                    <span className={m.winner === m.timeA ? "finished-team-winner" : "finished-team-loser"}>
                      {m.winner === m.timeA ? `👑 ${m.timeA}` : m.timeA}
                    </span>
                    <span className="score-tag" style={{ color: m.winner === m.timeA ? "var(--accent-gold)" : "var(--text-dim)" }}>
                      {m.scoreA}
                    </span>
                  </div>
                  <div className="finished-team-row">
                    <span className={m.winner === m.timeB ? "finished-team-winner" : "finished-team-loser"}>
                      {m.winner === m.timeB ? `👑 ${m.timeB}` : m.timeB}
                    </span>
                    <span className="score-tag" style={{ color: m.winner === m.timeB ? "var(--accent-gold)" : "var(--text-dim)" }}>
                      {m.scoreB}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* CENTRO: AO VIVO + CAMPEÃO MUNDIAL TI 2026 */}
          <main className="center-content">
            
            {/* SEÇÃO AO VIVO CONDICIONAL */}
            {liveGames.length > 0 && (
              <section className="live-block-wrap">
                <div className="live-heading">
                  <span className="live-dot" />
                  Ao Vivo Agora
                </div>
                <div className="live-grid">
                  {liveGames.map((g, idx) => {
                    const sb = g.scoreboard || {};
                    const rScore = sb.radiant ? sb.radiant.score : (g.radiant_score ?? 0);
                    const dScore = sb.dire ? sb.dire.score : (g.dire_score ?? 0);
                    const mins = Math.floor((sb.duration || 0) / 60) || 26;
                    const rName = (g.radiant_team && (g.radiant_team.team_name || g.radiant_team.name)) || "Radiant";
                    const dName = (g.dire_team && (g.dire_team.team_name || g.dire_team.name)) || "Dire";

                    return (
                      <div key={idx} onClick={() => setSelectedLiveGame(g)} className="live-card">
                        <span className="live-badge">AO VIVO · {mins}MIN</span>
                        <div className="live-teams-row">
                          <span className="live-team-name">{rName}</span>
                          <span className="live-score">{rScore} - {dScore}</span>
                          <span className="live-team-name" style={{ textAlign: 'right' }}>{dName}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* CARD CAMPEÃO THE INTERNATIONAL 2026 COM O AEGIS OFICIAL */}
            <div className="champ-card">
              <div className="champ-header">
                <div className="champ-title-group">
                  <img
                    src="/aegis.png"
                    alt="Aegis of Champions"
                    className="aegis-real-img"
                    onError={(e) => {
                      e.target.src = "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/trophies/aegis.png";
                    }}
                  />
                  <div>
                    <div className="champ-sub">Último Campeão Mundial</div>
                    <h2 className="champ-name">The International 2026</h2>
                  </div>
                </div>
                
                <div className="champ-team-tag">
                  <img 
                    src="https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/teams/7119388.png" 
                    alt="Team Spirit" 
                    onError={(e) => {
                      e.target.src = "https://steamcdn-a.akamaihd.net/apps/dota2/images/team_logos/7119388.png";
                    }}
                  />
                  <span>Team Spirit</span>
                </div>
              </div>

              <div className="players-grid">
                {[
                  { pos: 1, nick: "Yatoro", role: "Carry", kda: "6.8", gpm: 785 },
                  { pos: 2, nick: "Larl", role: "Midlane", kda: "5.9", gpm: 690 },
                  { pos: 3, nick: "Collapse", role: "Offlane", kda: "5.2", gpm: 610 },
                  { pos: 4, nick: "rue", role: "Support", kda: "3.4", gpm: 405 },
                  { pos: 5, nick: "not me", role: "Hard Support", kda: "2.4", gpm: 330 },
                ].map((p) => (
                  <div key={p.pos} className="player-card">
                    <span className="player-pos-badge">{p.pos}</span>
                    <strong className="player-nick">{p.nick}</strong>
                    <span className="player-role-text">{p.role}</span>
                    <div className="player-stat-split">
                      <div><span className="player-stat-label">KDA</span>{p.kda}</div>
                      <div><span className="player-stat-label">GPM</span><span style={{ color: 'var(--accent-cyan)' }}>{p.gpm}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>

          {/* DIREITA: JOGOS A SEREM REALIZADOS */}
          <aside className="sidebar-right">
            <div className="date-strip">
              <span>Jogos a Serem Realizados</span>
              <span style={{ fontSize: 9, background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 3 }}>EM BREVE</span>
            </div>

            <div className="matches-scroll">
              {upcomingMatches.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 16px', color: 'var(--text-dim)', fontSize: 12 }}>
                  Nenhuma partida agendada no momento para hoje.
                </div>
              ) : (
                upcomingMatches.map((m, idx) => (
                  <div key={idx} className="match-card">
                    <div className="match-tourney-name">{m.torneio}</div>
                    <div className="match-header-row">
                      <div className="match-teams-col">
                        <div className="match-team-single">{m.timeA}</div>
                        <div className="match-team-single">{m.timeB}</div>
                      </div>
                      <div className="match-meta-col">
                        <span className="match-format-badge">{m.formato || "BO3"}</span>
                        <span className="match-time-text">
                          {new Date(m.data).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} BRT
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      )}

      {/* VIEW TORNEIOS */}
      {currentTab === 'torneios' && (
        <div style={{ maxWidth: 860, margin: '24px auto', width: '100%', padding: '0 20px' }}>
          <h2 style={{ color: 'var(--accent-gold)', textTransform: 'uppercase', marginBottom: 16, fontSize: 16 }}>Torneios</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: 20, borderRadius: 12 }}>
              <h3 style={{ color: '#fff', fontSize: 16 }}>The International 2026</h3>
              <p style={{ color: 'var(--text-dim)', fontSize: 12, marginTop: 4 }}>Concluído em Agosto de 2026</p>
              <p style={{ color: 'var(--accent-cyan)', fontFamily: 'monospace', fontSize: 13, marginTop: 8 }}>Campeão: Team Spirit (3x2 TEAM VISION)</p>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MMR */}
      {currentTab === 'mmr' && (
        <div style={{ maxWidth: 860, margin: '24px auto', width: '100%', padding: '0 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 14 }}>
            <h2 style={{ color: '#fff', textTransform: 'uppercase', fontSize: 15 }}>Leaderboard Oficial Valve</h2>
            <div style={{ display: 'flex', gap: 4, background: 'var(--bg-card)', padding: 4, borderRadius: 8, border: '1px solid var(--border)' }}>
              {['europe', 'americas', 'china', 'se_asia'].map(div => (
                <button
                  key={div}
                  onClick={() => setMmrDivision(div)}
                  style={{
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    background: mmrDivision === div ? 'var(--accent-gold)' : 'transparent',
                    color: mmrDivision === div ? '#0B0D12' : 'var(--text-dim)',
                    textTransform: 'uppercase'
                  }}
                >
                  {div}
                </button>
              ))}
            </div>
          </div>

          {mmrLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>Carregando Leaderboard...</div>
          ) : (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginTop: 16 }}>
              <table className="table-custom" style={{ marginTop: 0 }}>
                <thead>
                  <tr>
                    <th style={{ width: 40, paddingLeft: 16 }}>#</th>
                    <th>Jogador</th>
                    <th>País</th>
                    <th style={{ textAlign: 'right', paddingRight: 16 }}>Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {mmrPlayers.map(p => (
                    <tr key={p.rank}>
                      <td style={{ paddingLeft: 16, fontWeight: 700, color: 'var(--accent-gold)', fontFamily: 'monospace' }}>{p.rank}</td>
                      <td style={{ fontWeight: 600, color: '#fff' }}>
                        {p.team_tag && <span style={{ color: 'var(--accent-gold)', marginRight: 4 }}>[{p.team_tag}]</span>}
                        {p.name || 'Anônimo'}
                      </td>
                      <td style={{ color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'monospace' }}>{p.country || '—'}</td>
                      <td style={{ textAlign: 'right', paddingRight: 16, color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>Immortal</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL DETALHADO DO CONFRONTO FINALIZADO (JOGO 1 A 5, DRAFT, ITENS E STATS) */}
      {selectedSeriesDetail && selectedSeriesDetail.games && (
        <div className="modal-backdrop">
          <div className="modal-box-wide">
            <button onClick={() => setSelectedSeriesDetail(null)} className="modal-close-btn">
              <X size={20} />
            </button>

            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--accent-gold)', textTransform: 'uppercase', fontWeight: 700 }}>
                {selectedSeriesDetail.stage}
              </span>
              <h2 style={{ color: '#fff', fontSize: 18, marginTop: 4 }}>
                {selectedSeriesDetail.timeA} <span style={{ color: 'var(--accent-gold)' }}>{selectedSeriesDetail.scoreA} - {selectedSeriesDetail.scoreB}</span> {selectedSeriesDetail.timeB}
              </h2>
            </div>

            {/* ABAS DOS MAPAS DA SÉRIE */}
            <div className="map-tabs-row">
              {selectedSeriesDetail.games.map((g, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveMapIndex(idx)}
                  className={`map-tab-btn ${activeMapIndex === idx ? 'active' : ''}`}
                >
                  Jogo {g.mapNumber} ({g.duracao})
                </button>
              ))}
            </div>

            {/* DETALHES DO MAPA ATIVO */}
            {selectedSeriesDetail.games[activeMapIndex] && (() => {
              const game = selectedSeriesDetail.games[activeMapIndex];
              return (
                <div>
                  {/* RESULTADO & DURAÇÃO */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 12 }}>
                    <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>Vencedor: {game.vencedor}</span>
                    <span style={{ color: 'var(--text-dim)' }}>Duração: {game.duracao}</span>
                  </div>

                  {/* DRAFT: PICKS & BANS */}
                  <div className="draft-block">
                    <div className="draft-title">Ordem de Draft (Picks & Bans)</div>
                    <div style={{ marginBottom: 6 }}>
                      <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>Radiant Bans: </span>
                      <span style={{ color: 'var(--text-dim)' }}>{game.draft.radiantBans.join(', ')}</span>
                      <span style={{ marginLeft: 12, color: 'var(--accent-cyan)', fontWeight: 700 }}>Picks: </span>
                      <span style={{ color: '#fff' }}>{game.draft.radiantPicks.join(', ')}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--accent-red)', fontWeight: 700 }}>Dire Bans: </span>
                      <span style={{ color: 'var(--text-dim)' }}>{game.draft.direBans.join(', ')}</span>
                      <span style={{ marginLeft: 12, color: 'var(--accent-red)', fontWeight: 700 }}>Picks: </span>
                      <span style={{ color: '#fff' }}>{game.draft.direPicks.join(', ')}</span>
                    </div>
                  </div>

                  {/* TABELA RADIANT */}
                  <div style={{ color: 'var(--accent-cyan)', fontWeight: 700, fontSize: 12, marginTop: 12 }}>Radiant</div>
                  <table className="table-custom">
                    <thead>
                      <tr>
                        <th>Jogador</th>
                        <th>Herói</th>
                        <th>KDA</th>
                        <th>GPM/XPM</th>
                        <th>Itens de Fim de Jogo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {game.radiantRoster.map((p, i) => (
                        <tr key={i}>
                          <td style={{ color: '#fff', fontWeight: 600 }}>Pos {p.pos} - {p.name}</td>
                          <td style={{ color: 'var(--accent-gold)' }}>{p.hero}</td>
                          <td style={{ fontFamily: 'monospace' }}>{p.kda}</td>
                          <td style={{ fontFamily: 'monospace' }}>{p.gpm}/{p.xpm}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {p.items.map((item, itIdx) => (
                                <span key={itIdx} style={{ fontSize: 9, background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '2px 4px', borderRadius: 3, color: 'var(--text-dim)' }}>
                                  {item}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* TABELA DIRE */}
                  <div style={{ color: 'var(--accent-red)', fontWeight: 700, fontSize: 12, marginTop: 16 }}>Dire</div>
                  <table className="table-custom">
                    <thead>
                      <tr>
                        <th>Jogador</th>
                        <th>Herói</th>
                        <th>KDA</th>
                        <th>GPM/XPM</th>
                        <th>Itens de Fim de Jogo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {game.direRoster.map((p, i) => (
                        <tr key={i}>
                          <td style={{ color: '#fff', fontWeight: 600 }}>Pos {p.pos} - {p.name}</td>
                          <td style={{ color: 'var(--accent-gold)' }}>{p.hero}</td>
                          <td style={{ fontFamily: 'monospace' }}>{p.kda}</td>
                          <td style={{ fontFamily: 'monospace' }}>{p.gpm}/{p.xpm}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {p.items.map((item, itIdx) => (
                                <span key={itIdx} style={{ fontSize: 9, background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '2px 4px', borderRadius: 3, color: 'var(--text-dim)' }}>
                                  {item}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL DETALHE AO VIVO */}
      {selectedLiveGame && (
        <div className="modal-backdrop">
          <div className="modal-box-wide" style={{ maxWidth: 700 }}>
            <button onClick={() => setSelectedLiveGame(null)} className="modal-close-btn">
              <X size={18} />
            </button>

            <h3 style={{ textAlign: 'center', color: '#fff', fontSize: 16, marginBottom: 12 }}>
              {(selectedLiveGame.radiant_team?.team_name || "Radiant")}
              <span style={{ color: 'var(--accent-gold)', fontSize: 20, margin: '0 12px' }}>
                {(selectedLiveGame.scoreboard?.radiant?.score || 0)} - {(selectedLiveGame.scoreboard?.dire?.score || 0)}
              </span>
              {(selectedLiveGame.dire_team?.team_name || "Dire")}
            </h3>

            <div className="minimap-box">
              {[...(selectedLiveGame.scoreboard?.radiant?.players || []).map((p, i) => {
                const pos = worldToPct(p.position_x || 0, p.position_y || 0);
                return <div key={`r_${i}`} style={{ left: pos.left, top: pos.top }} className="minimap-dot minimap-dot-radiant" title={p.name || ''} />;
              }), ...(selectedLiveGame.scoreboard?.dire?.players || []).map((p, i) => {
                const pos = worldToPct(p.position_x || 0, p.position_y || 0);
                return <div key={`d_${i}`} style={{ left: pos.left, top: pos.top }} className="minimap-dot minimap-dot-dire" title={p.name || ''} />;
              })]}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}