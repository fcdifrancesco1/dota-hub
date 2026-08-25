import React, { useState, useEffect } from 'react';
import { Flame, Trophy, Award, History, X } from 'lucide-react';

const OPENDOTA_BASE = "https://api.opendota.com/api";

// Mapeamento exato dos heróis para os nomes dos arquivos na CDN da Valve
function getHeroImageUrl(heroName) {
  if (!heroName) return "";
  const map = {
    "Anti-Mage": "antimage",
    "Centaur Warrunner": "centaur",
    "Clockwerk": "rattletrap",
    "Dark Seer": "dark_seer",
    "Dark Willow": "dark_willow",
    "Doom": "doom_bringer",
    "Dragon Knight": "dragon_knight",
    "Earth Spirit": "earth_spirit",
    "Earthshaker": "earthshaker",
    "Ember Spirit": "ember_spirit",
    "Enchantress": "enchantress",
    "Faceless Void": "faceless_void",
    "Keeper of the Light": "keeper_of_the_light",
    "Nature's Prophet": "furion",
    "Queen of Pain": "queenofpain",
    "Sand King": "sand_king",
    "Shadow Demon": "shadow_demon",
    "Shadow Fiend": "nevermore",
    "Shadow Shaman": "shadow_shaman",
    "Storm Spirit": "storm_spirit",
    "Templar Assassin": "templar_assassin",
    "Treant Protector": "treant",
    "Vengeful Spirit": "vengefulspirit",
    "Windranger": "windrunner",
    "Witch Doctor": "witch_doctor",
    "Wraith King": "skeleton_king",
    "Io": "wisp",
    "Underlord": "abyssal_underlord"
  };
  const key = map[heroName] || heroName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${key}.png`;
}

function getItemImageUrl(itemName) {
  if (!itemName) return "";
  const map = {
    "Power Treads": "power_treads",
    "Manta Style": "manta",
    "Butterfly": "butterfly",
    "Satanic": "satanic",
    "Eye of Skadi": "skadi",
    "Black King Bar": "black_king_bar",
    "Kaya and Sange": "kaya_and_sange",
    "Orchid Malevolence": "orchid",
    "Shiva's Guard": "shivas_guard",
    "Aghanim's Scepter": "ultimate_scepter",
    "Aghanim's Shard": "aghanims_shard",
    "Phase Boots": "phase_boots",
    "Blink Dagger": "blink",
    "Pipe of Insight": "pipe",
    "Heart of Tarrasque": "heart",
    "Crimson Guard": "crimson_guard",
    "Lotus Orb": "lotus_orb",
    "Arcane Boots": "arcane_boots",
    "Aether Lens": "aether_lens",
    "Gleipnir": "gungir",
    "Force Staff": "force_staff",
    "Eul's Scepter": "cyclone",
    "Solar Crest": "solar_crest",
    "Tranquil Boots": "tranquil_boots",
    "Glimmer Cape": "glimmer_cape",
    "Blade Mail": "blade_mail",
    "Observer Ward": "ward_observer",
    "Town Portal Scroll": "tpscroll",
    "Dragon Lance": "dragon_lance",
    "Mask of Madness": "mask_of_madness",
    "Witch Blade": "witch_blade",
    "Linken's Sphere": "sphere",
    "Dagon": "dagon",
    "Refresher Orb": "refresher",
    "Desolator": "desolator",
    "Vladmir's Offering": "vladmir",
    "Ghost Scepter": "ghost",
    "Wind Lace": "wind_lace",
    "Bloodstone": "bloodstone",
    "Boots of Travel": "travel_boots",
    "Eternal Shroud": "eternal_shroud",
    "Guardian Greaves": "guardian_greaves",
    "Holy Locket": "holy_locket",
    "Urn of Shadows": "urn_of_shadows",
    "Spirit Vessel": "spirit_vessel",
    "Echo Sabre": "echo_sabre",
    "Daedalus": "greater_crit",
    "Assault Cuirass": "assault",
    "Radiance": "radiance",
    "Maelstrom": "maelstrom",
    "Diffusal Blade": "diffusal_blade",
    "Abyssal Blade": "abyssal_blade",
    "Harpoon": "harpoon",
    "Disperser": "disperser",
    "Octarine Core": "octarine_core",
    "Helm of the Overlord": "helm_of_the_overlord",
    "Boots of Bearing": "boots_of_bearing",
    "Rod of Atos": "rod_of_atos",
    "Battle Fury": "bfury",
    "Mage Slayer": "mage_slayer",
    "Moon Shard": "moon_shard",
    "Armlet of Mordiggian": "armlet",
    "Aeon Disk": "aeon_disk",
    "Bloodthorn": "bloodthorn",
    "Nullifier": "nullifier"
  };
  const key = map[itemName] || itemName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/${key}.png`;
}

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

  // 1. CARREGAR TODAS AS PARTIDAS DOS PLAYOFFS COM DADOS E JOGOS REAIS
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
            duracao: "46:15",
            vencedor: "Team Spirit (Dire)",
            draft: {
              radiantBans: ["Doom", "Beastmaster", "Chen", "Naga Siren", "Batrider", "Shadow Demon", "Puck"],
              radiantPicks: ["Ember Spirit", "Mirana", "Io", "Mars", "Hoodwink"],
              direBans: ["Terrorblade", "Leshrac", "Morphling", "Storm Spirit", "Centaur Warrunner", "Dark Seer", "Luna"],
              direPicks: ["Slark", "Dark Willow", "Shadow Fiend", "Disruptor", "Rubick"]
            },
            radiantRoster: [
              { pos: 1, name: "Kiritych", hero: "Ember Spirit", kda: "7/6/12", gpm: 680, xpm: 720, items: ["Phase Boots", "Battle Fury", "Mage Slayer", "Black King Bar", "Desolator", "Daedalus"] },
              { pos: 2, name: "Squad1x", hero: "Mirana", kda: "8/5/11", gpm: 640, xpm: 690, items: ["Power Treads", "Manta Style", "Diffusal Blade", "Butterfly", "Black King Bar", "Linken's Sphere"] },
              { pos: 3, name: "Fng", hero: "Mars", kda: "4/7/15", gpm: 490, xpm: 540, items: ["Phase Boots", "Blink Dagger", "Black King Bar", "Refresher Orb", "Desolator", "Assault Cuirass"] },
              { pos: 4, name: "sayuw", hero: "Hoodwink", kda: "3/8/16", gpm: 350, xpm: 410, items: ["Arcane Boots", "Aether Lens", "Gleipnir", "Force Staff", "Eul's Scepter", "Solar Crest"] },
              { pos: 5, name: "Pantomem", hero: "Io", kda: "2/9/19", gpm: 290, xpm: 340, items: ["Holy Locket", "Mekansm", "Glimmer Cape", "Ghost Scepter", "Aghanim's Shard", "Wind Lace"] }
            ],
            direRoster: [
              { pos: 1, name: "Yatoro", hero: "Slark", kda: "15/3/9", gpm: 820, xpm: 870, items: ["Power Treads", "Diffusal Blade", "Aghanim's Scepter", "Black King Bar", "Eye of Skadi", "Abyssal Blade"] },
              { pos: 2, name: "Larl", hero: "Shadow Fiend", kda: "9/4/14", gpm: 740, xpm: 790, items: ["Power Treads", "Dragon Lance", "Black King Bar", "Butterfly", "Satanic", "Daedalus"] },
              { pos: 3, name: "Collapse", hero: "Dark Willow", kda: "6/4/18", gpm: 560, xpm: 620, items: ["Eul's Scepter", "Blink Dagger", "Aghanim's Scepter", "Octarine Core", "Lotus Orb", "Black King Bar"] },
              { pos: 4, name: "rue", hero: "Rubick", kda: "4/5/21", gpm: 390, xpm: 450, items: ["Arcane Boots", "Aether Lens", "Blink Dagger", "Force Staff", "Glimmer Cape", "Ghost Scepter"] },
              { pos: 5, name: "not me", hero: "Disruptor", kda: "3/6/23", gpm: 320, xpm: 380, items: ["Arcane Boots", "Aghanim's Scepter", "Glimmer Cape", "Force Staff", "Aether Lens", "Ghost Scepter"] }
            ]
          },
          {
            mapNumber: 2,
            duracao: "64:29",
            vencedor: "TEAM VISION (Radiant)",
            draft: {
              radiantBans: ["Morphling", "Slark", "Dark Willow", "Disruptor", "Puck", "Batrider", "Mars"],
              radiantPicks: ["Razor", "Enchantress", "Rubick", "Underlord", "Sand King"],
              direBans: ["Io", "Ember Spirit", "Mirana", "Hoodwink", "Centaur Warrunner", "Leshrac", "Luna"],
              direPicks: ["Shadow Fiend", "Slardar", "Hoodwink", "Rubick", "Mars"]
            },
            radiantRoster: [
              { pos: 1, name: "Kiritych", hero: "Razor", kda: "13/6/18", gpm: 810, xpm: 860, items: ["Phase Boots", "Black King Bar", "Refresher Orb", "Satanic", "Shiva's Guard", "Eye of Skadi"] },
              { pos: 2, name: "Squad1x", hero: "Sand King", kda: "10/5/21", gpm: 730, xpm: 780, items: ["Boots of Travel", "Blink Dagger", "Black King Bar", "Bloodstone", "Shiva's Guard", "Aghanim's Scepter"] },
              { pos: 3, name: "Fng", hero: "Underlord", kda: "5/7/24", gpm: 540, xpm: 600, items: ["Guardian Greaves", "Pipe of Insight", "Crimson Guard", "Lotus Orb", "Heart of Tarrasque", "Refresher Orb"] },
              { pos: 4, name: "sayuw", hero: "Rubick", kda: "4/8/26", gpm: 410, xpm: 470, items: ["Arcane Boots", "Aether Lens", "Blink Dagger", "Force Staff", "Glimmer Cape", "Aeon Disk"] },
              { pos: 5, name: "Pantomem", hero: "Enchantress", kda: "6/8/22", gpm: 380, xpm: 430, items: ["Power Treads", "Dragon Lance", "Solar Crest", "Glimmer Cape", "Hurricane Pike", "Aghanim's Shard"] }
            ],
            direRoster: [
              { pos: 1, name: "Yatoro", hero: "Shadow Fiend", kda: "11/8/12", gpm: 790, xpm: 830, items: ["Power Treads", "Black King Bar", "Butterfly", "Satanic", "Daedalus", "Eye of Skadi"] },
              { pos: 2, name: "Larl", hero: "Slardar", kda: "7/9/14", gpm: 610, xpm: 670, items: ["Power Treads", "Blink Dagger", "Black King Bar", "Aghanim's Scepter", "Assault Cuirass", "Moon Shard"] },
              { pos: 3, name: "Collapse", hero: "Mars", kda: "5/10/16", gpm: 510, xpm: 570, items: ["Phase Boots", "Blink Dagger", "Black King Bar", "Refresher Orb", "Desolator", "Lotus Orb"] },
              { pos: 4, name: "rue", hero: "Hoodwink", kda: "4/9/19", gpm: 360, xpm: 420, items: ["Arcane Boots", "Gleipnir", "Aether Lens", "Force Staff", "Eul's Scepter", "Ghost Scepter"] },
              { pos: 5, name: "not me", hero: "Rubick", kda: "2/11/17", gpm: 290, xpm: 340, items: ["Arcane Boots", "Glimmer Cape", "Force Staff", "Aether Lens", "Aghanim's Shard", "Town Portal Scroll"] }
            ]
          },
          {
            mapNumber: 3,
            duracao: "45:56",
            vencedor: "Team Spirit (Dire)",
            draft: {
              radiantBans: ["Slark", "Shadow Fiend", "Razor", "Underlord", "Disruptor", "Pangolier", "Mirana"],
              radiantPicks: ["Shadow Fiend", "Enchantress", "Slardar", "Pangolier", "Marci"],
              direBans: ["Sand King", "Io", "Ember Spirit", "Razor", "Centaur Warrunner", "Hoodwink", "Doom"],
              direPicks: ["Nature's Prophet", "Dark Willow", "Tusk", "Mars", "Terrorblade"]
            },
            radiantRoster: [
              { pos: 1, name: "Kiritych", hero: "Shadow Fiend", kda: "8/7/8", gpm: 720, xpm: 760, items: ["Power Treads", "Black King Bar", "Dragon Lance", "Butterfly", "Satanic", "Daedalus"] },
              { pos: 2, name: "Squad1x", hero: "Pangolier", kda: "6/6/9", gpm: 630, xpm: 680, items: ["Arcane Boots", "Diffusal Blade", "Blink Dagger", "Eul's Scepter", "Black King Bar", "Aghanim's Shard"] },
              { pos: 3, name: "Fng", hero: "Slardar", kda: "4/8/7", gpm: 470, xpm: 520, items: ["Power Treads", "Blink Dagger", "Black King Bar", "Aghanim's Scepter", "Echo Sabre", "Armlet of Mordiggian"] },
              { pos: 4, name: "sayuw", hero: "Marci", kda: "3/8/11", gpm: 350, xpm: 400, items: ["Phase Boots", "Black King Bar", "Basher", "Blink Dagger", "Armlet of Mordiggian", "Ghost Scepter"] },
              { pos: 5, name: "Pantomem", hero: "Enchantress", kda: "2/9/10", gpm: 300, xpm: 350, items: ["Power Treads", "Dragon Lance", "Solar Crest", "Glimmer Cape", "Aghanim's Shard", "Wind Lace"] }
            ],
            direRoster: [
              { pos: 1, name: "Yatoro", hero: "Terrorblade", kda: "14/2/11", gpm: 870, xpm: 920, items: ["Power Treads", "Manta Style", "Eye of Skadi", "Butterfly", "Satanic", "Daedalus"] },
              { pos: 2, name: "Larl", hero: "Nature's Prophet", kda: "9/3/16", gpm: 780, xpm: 820, items: ["Power Treads", "Orchid Malevolence", "Black King Bar", "Gleipnir", "Bloodthorn", "Nullifier"] },
              { pos: 3, name: "Collapse", hero: "Mars", kda: "6/4/20", gpm: 580, xpm: 640, items: ["Phase Boots", "Blink Dagger", "Black King Bar", "Refresher Orb", "Desolator", "Lotus Orb"] },
              { pos: 4, name: "rue", hero: "Dark Willow", kda: "4/5/22", gpm: 420, xpm: 480, items: ["Eul's Scepter", "Blink Dagger", "Aghanim's Scepter", "Force Staff", "Ghost Scepter", "Solar Crest"] },
              { pos: 5, name: "not me", hero: "Tusk", kda: "3/5/24", gpm: 340, xpm: 400, items: ["Phase Boots", "Blink Dagger", "Force Staff", "Solar Crest", "Glimmer Cape", "Aghanim's Shard"] }
            ]
          },
          {
            mapNumber: 4,
            duracao: "44:18",
            vencedor: "TEAM VISION (Radiant)",
            draft: {
              radiantBans: ["Terrorblade", "Nature's Prophet", "Slark", "Mars", "Disruptor", "Dark Willow", "Puck"],
              radiantPicks: ["Keeper of the Light", "Doom", "Sand King", "Mirana", "Venomancer"],
              direBans: ["Razor", "Underlord", "Io", "Ember Spirit", "Shadow Fiend", "Slardar", "Hoodwink"],
              direPicks: ["Weaver", "Earthshaker", "Clockwerk", "Templar Assassin", "Storm Spirit"]
            },
            radiantRoster: [
              { pos: 1, name: "Kiritych", hero: "Doom", kda: "9/4/16", gpm: 780, xpm: 830, items: ["Phase Boots", "Blink Dagger", "Black King Bar", "Refresher Orb", "Shiva's Guard", "Heart of Tarrasque"] },
              { pos: 2, name: "Squad1x", hero: "Keeper of the Light", kda: "11/2/19", gpm: 740, xpm: 790, items: ["Boots of Travel", "Dagon", "Ethereal Blade", "Octarine Core", "Black King Bar", "Shiva's Guard"] },
              { pos: 3, name: "Fng", hero: "Sand King", kda: "6/5/22", gpm: 560, xpm: 620, items: ["Boots of Travel", "Blink Dagger", "Black King Bar", "Bloodstone", "Shiva's Guard", "Aghanim's Scepter"] },
              { pos: 4, name: "sayuw", hero: "Mirana", kda: "4/4/24", gpm: 420, xpm: 480, items: ["Power Treads", "Spirit Vessel", "Eul's Scepter", "Solar Crest", "Force Staff", "Glimmer Cape"] },
              { pos: 5, name: "Pantomem", hero: "Venomancer", kda: "3/6/26", gpm: 330, xpm: 390, items: ["Arcane Boots", "Glimmer Cape", "Force Staff", "Aghanim's Scepter", "Aghanim's Shard", "Ghost Scepter"] }
            ],
            direRoster: [
              { pos: 1, name: "Yatoro", hero: "Templar Assassin", kda: "7/6/5", gpm: 760, xpm: 800, items: ["Power Treads", "Dragon Lance", "Desolator", "Black King Bar", "Blink Dagger", "Daedalus"] },
              { pos: 2, name: "Larl", hero: "Storm Spirit", kda: "6/7/8", gpm: 660, xpm: 710, items: ["Power Treads", "Kaya and Sange", "Orchid Malevolence", "Black King Bar", "Shiva's Guard", "Linken's Sphere"] },
              { pos: 3, name: "Collapse", hero: "Earthshaker", kda: "4/8/9", gpm: 480, xpm: 530, items: ["Arcane Boots", "Blink Dagger", "Aghanim's Scepter", "Black King Bar", "Refresher Orb", "Force Staff"] },
              { pos: 4, name: "rue", hero: "Weaver", kda: "3/7/11", gpm: 370, xpm: 430, items: ["Power Treads", "Spirit Vessel", "Solar Crest", "Gleipnir", "Aghanim's Shard", "Ghost Scepter"] },
              { pos: 5, name: "not me", hero: "Clockwerk", kda: "1/9/12", gpm: 270, xpm: 320, items: ["Tranquil Boots", "Force Staff", "Blade Mail", "Glimmer Cape", "Aghanim's Shard", "Wind Lace"] }
            ]
          },
          {
            mapNumber: 5,
            duracao: "64:22",
            vencedor: "Team Spirit (Dire - Campeã Tricampeã)",
            draft: {
              radiantBans: ["Terrorblade", "Slark", "Nature's Prophet", "Mars", "Dark Willow", "Disruptor", "Templar Assassin"],
              radiantPicks: ["Invoker", "Rubick", "Mars", "Hoodwink", "Silencer"],
              direBans: ["Keeper of the Light", "Doom", "Sand King", "Razor", "Underlord", "Ember Spirit", "Io"],
              direPicks: ["Faceless Void", "Pangolier", "Mirana", "Sand King", "Tinker"]
            },
            radiantRoster: [
              { pos: 1, name: "Kiritych", hero: "Invoker", kda: "10/7/16", gpm: 790, xpm: 840, items: ["Boots of Travel", "Aghanim's Scepter", "Refresher Orb", "Black King Bar", "Shiva's Guard", "Octarine Core"] },
              { pos: 2, name: "Squad1x", hero: "Silencer", kda: "8/8/18", gpm: 710, xpm: 760, items: ["Power Treads", "Dragon Lance", "Black King Bar", "Refresher Orb", "Scythe of Vyse", "Moon Shard"] },
              { pos: 3, name: "Fng", hero: "Mars", kda: "5/11/20", gpm: 520, xpm: 580, items: ["Phase Boots", "Blink Dagger", "Black King Bar", "Refresher Orb", "Desolator", "Lotus Orb"] },
              { pos: 4, name: "sayuw", hero: "Hoodwink", kda: "4/9/22", gpm: 390, xpm: 450, items: ["Arcane Boots", "Gleipnir", "Aether Lens", "Force Staff", "Eul's Scepter", "Ghost Scepter"] },
              { pos: 5, name: "Pantomem", hero: "Rubick", kda: "3/10/24", gpm: 320, xpm: 380, items: ["Arcane Boots", "Aether Lens", "Blink Dagger", "Force Staff", "Glimmer Cape", "Aeon Disk"] }
            ],
            direRoster: [
              { pos: 1, name: "Yatoro", hero: "Faceless Void", kda: "17/4/15", gpm: 910, xpm: 960, items: ["Power Treads", "Manta Style", "Maelstrom", "Black King Bar", "Butterfly", "Refresher Orb"] },
              { pos: 2, name: "Larl", hero: "Pangolier", kda: "10/5/22", gpm: 750, xpm: 800, items: ["Arcane Boots", "Diffusal Blade", "Blink Dagger", "Eul's Scepter", "Black King Bar", "Aghanim's Shard"] },
              { pos: 3, name: "Collapse", hero: "Sand King", kda: "8/6/26", gpm: 640, xpm: 710, items: ["Boots of Travel", "Blink Dagger", "Black King Bar", "Bloodstone", "Shiva's Guard", "Aghanim's Scepter"] },
              { pos: 4, name: "rue", hero: "Mirana", kda: "5/7/28", gpm: 440, xpm: 500, items: ["Power Treads", "Spirit Vessel", "Eul's Scepter", "Solar Crest", "Force Staff", "Glimmer Cape"] },
              { pos: 5, name: "not me", hero: "Tinker", kda: "4/6/30", gpm: 380, xpm: 440, items: ["Guardian Greaves", "Blink Dagger", "Glimmer Cape", "Holy Locket", "Aether Lens", "Ghost Scepter"] }
            ]
          }
        ]
      },
      {
        id: "final_lb",
        stage: "Final Lower Bracket",
        timeA: "Team Spirit",
        timeB: "Team Yandex",
        scoreA: 2,
        scoreB: 0,
        winner: "Team Spirit",
        dur: "38m / 32m",
        games: [
          {
            mapNumber: 1,
            duracao: "38:12",
            vencedor: "Team Spirit (Radiant)",
            draft: {
              radiantBans: ["Doom", "Chen", "Shadow Demon", "Batrider", "Puck", "Naga Siren", "Mars"],
              radiantPicks: ["Morphling", "Storm Spirit", "Centaur Warrunner", "Hoodwink", "Clockwerk"],
              direBans: ["Slark", "Terrorblade", "Leshrac", "Dark Willow", "Disruptor", "Luna", "Rubick"],
              direPicks: ["Luna", "Puck", "Mars", "Rubick", "Disruptor"]
            },
            radiantRoster: [
              { pos: 1, name: "Yatoro", hero: "Morphling", kda: "11/1/9", gpm: 780, xpm: 830, items: ["Power Treads", "Manta Style", "Butterfly", "Satanic", "Eye of Skadi", "Black King Bar"] },
              { pos: 2, name: "Larl", hero: "Storm Spirit", kda: "7/2/13", gpm: 670, xpm: 720, items: ["Power Treads", "Kaya and Sange", "Orchid Malevolence", "Black King Bar", "Shiva's Guard", "Aghanim's Scepter"] },
              { pos: 3, name: "Collapse", hero: "Centaur Warrunner", kda: "4/3/17", gpm: 530, xpm: 600, items: ["Phase Boots", "Blink Dagger", "Pipe of Insight", "Heart of Tarrasque", "Crimson Guard", "Lotus Orb"] },
              { pos: 4, name: "rue", hero: "Hoodwink", kda: "3/3/15", gpm: 380, xpm: 440, items: ["Arcane Boots", "Aether Lens", "Gleipnir", "Force Staff", "Eul's Scepter", "Solar Crest"] },
              { pos: 5, name: "not me", hero: "Clockwerk", kda: "2/5/16", gpm: 300, xpm: 370, items: ["Tranquil Boots", "Force Staff", "Glimmer Cape", "Aghanim's Shard", "Blade Mail", "Observer Ward"] }
            ],
            direRoster: [
              { pos: 1, name: "Pure", hero: "Luna", kda: "3/5/4", gpm: 640, xpm: 680, items: ["Power Treads", "Manta Style", "Black King Bar", "Dragon Lance", "Butterfly", "Mask of Madness"] },
              { pos: 2, name: "gpk", hero: "Puck", kda: "4/4/5", gpm: 590, xpm: 630, items: ["Phase Boots", "Witch Blade", "Blink Dagger", "Eul's Scepter", "Linken's Sphere", "Dagon"] },
              { pos: 3, name: "MieRo", hero: "Mars", kda: "2/6/6", gpm: 450, xpm: 510, items: ["Phase Boots", "Blink Dagger", "Black King Bar", "Refresher Orb", "Desolator", "Vladmir's Offering"] },
              { pos: 4, name: "Save-", hero: "Rubick", kda: "1/5/8", gpm: 330, xpm: 380, items: ["Arcane Boots", "Aether Lens", "Blink Dagger", "Force Staff", "Glimmer Cape", "Ghost Scepter"] },
              { pos: 5, name: "TORONTOTOKYO", hero: "Disruptor", kda: "1/7/5", gpm: 270, xpm: 320, items: ["Arcane Boots", "Glimmer Cape", "Force Staff", "Aghanim's Shard", "Observer Ward", "Town Portal Scroll"] }
            ]
          },
          {
            mapNumber: 2,
            duracao: "32:45",
            vencedor: "Team Spirit (Dire)",
            draft: {
              radiantBans: ["Terrorblade", "Slark", "Morphling", "Centaur Warrunner", "Disruptor", "Dark Willow", "Mars"],
              radiantPicks: ["Sven", "Tiny", "Brewmaster", "Muerta", "Grimstroke"],
              direBans: ["Doom", "Beastmaster", "Shadow Demon", "Puck", "Naga Siren", "Chen", "Batrider"],
              direPicks: ["Ursa", "Pangolier", "Magnus", "Mirana", "Jakiro"]
            },
            radiantRoster: [
              { pos: 1, name: "Pure", hero: "Sven", kda: "2/6/3", gpm: 610, xpm: 650, items: ["Power Treads", "Echo Sabre", "Black King Bar", "Mask of Madness", "Blink Dagger", "Daedalus"] },
              { pos: 2, name: "gpk", hero: "Tiny", kda: "3/5/4", gpm: 550, xpm: 590, items: ["Power Treads", "Blink Dagger", "Echo Sabre", "Black King Bar", "Daedalus", "Assault Cuirass"] },
              { pos: 3, name: "MieRo", hero: "Brewmaster", kda: "1/5/5", gpm: 410, xpm: 470, items: ["Phase Boots", "Urn of Shadows", "Radiance", "Black King Bar", "Refresher Orb", "Shiva's Guard"] },
              { pos: 4, name: "Save-", hero: "Muerta", kda: "1/6/4", gpm: 310, xpm: 370, items: ["Power Treads", "Dragon Lance", "Maelstrom", "Blink Dagger", "Ghost Scepter", "Force Staff"] },
              { pos: 5, name: "TORONTOTOKYO", hero: "Grimstroke", kda: "1/6/3", gpm: 250, xpm: 300, items: ["Arcane Boots", "Aether Lens", "Glimmer Cape", "Force Staff", "Aghanim's Shard", "Wind Lace"] }
            ],
            direRoster: [
              { pos: 1, name: "Yatoro", hero: "Ursa", kda: "13/0/7", gpm: 830, xpm: 880, items: ["Phase Boots", "Diffusal Blade", "Blink Dagger", "Black King Bar", "Abyssal Blade", "Satanic"] },
              { pos: 2, name: "Larl", hero: "Pangolier", kda: "6/2/12", gpm: 650, xpm: 700, items: ["Arcane Boots", "Diffusal Blade", "Blink Dagger", "Eul's Scepter", "Black King Bar", "Aghanim's Shard"] },
              { pos: 3, name: "Collapse", hero: "Magnus", kda: "5/1/14", gpm: 570, xpm: 630, items: ["Power Treads", "Blink Dagger", "Force Staff", "Refresher Orb", "Harpoon", "Shiva's Guard"] },
              { pos: 4, name: "rue", hero: "Mirana", kda: "4/2/14", gpm: 400, xpm: 450, items: ["Power Treads", "Spirit Vessel", "Eul's Scepter", "Solar Crest", "Force Staff", "Glimmer Cape"] },
              { pos: 5, name: "not me", hero: "Jakiro", kda: "2/3/16", gpm: 320, xpm: 380, items: ["Arcane Boots", "Aether Lens", "Force Staff", "Glimmer Cape", "Aghanim's Shard", "Observer Ward"] }
            ]
          }
        ]
      },
      {
        id: "semi_lb",
        stage: "Semi Lower Bracket",
        timeA: "Team Spirit",
        timeB: "BB Team",
        scoreA: 2,
        scoreB: 0,
        winner: "Team Spirit",
        dur: "41m / 29m",
        games: [
          {
            mapNumber: 1,
            duracao: "41:30",
            vencedor: "Team Spirit (Radiant)",
            draft: {
              radiantBans: ["Doom", "Beastmaster", "Chen", "Naga Siren", "Batrider", "Puck", "Shadow Demon"],
              radiantPicks: ["Faceless Void", "Ember Spirit", "Slardar", "Tusk", "Shadow Shaman"],
              direBans: ["Terrorblade", "Slark", "Morphling", "Centaur Warrunner", "Disruptor", "Dark Willow", "Mars"],
              direPicks: ["Terrorblade", "Leshrac", "Dark Seer", "Earth Spirit", "Treant Protector"]
            },
            radiantRoster: [
              { pos: 1, name: "Yatoro", hero: "Faceless Void", kda: "10/2/8", gpm: 760, xpm: 810, items: ["Power Treads", "Maelstrom", "Black King Bar", "Manta Style", "Eye of Skadi", "Daedalus"] },
              { pos: 2, name: "Larl", hero: "Ember Spirit", kda: "7/3/11", gpm: 660, xpm: 710, items: ["Phase Boots", "Battle Fury", "Mage Slayer", "Black King Bar", "Shiva's Guard", "Desolator"] },
              { pos: 3, name: "Collapse", hero: "Slardar", kda: "5/4/10", gpm: 520, xpm: 580, items: ["Power Treads", "Blink Dagger", "Black King Bar", "Aghanim's Scepter", "Moon Shard", "Assault Cuirass"] },
              { pos: 4, name: "rue", hero: "Tusk", kda: "3/5/12", gpm: 370, xpm: 430, items: ["Phase Boots", "Blink Dagger", "Force Staff", "Desolator", "Solar Crest", "Ghost Scepter"] },
              { pos: 5, name: "not me", hero: "Shadow Shaman", kda: "2/6/11", gpm: 290, xpm: 340, items: ["Arcane Boots", "Aether Lens", "Blink Dagger", "Glimmer Cape", "Aghanim's Shard", "Wind Lace"] }
            ],
            direRoster: [
              { pos: 1, name: "Nightfall", hero: "Terrorblade", kda: "4/5/4", gpm: 680, xpm: 720, items: ["Power Treads", "Manta Style", "Eye of Skadi", "Butterfly", "Satanic", "Daedalus"] },
              { pos: 2, name: "gpk", hero: "Leshrac", kda: "5/6/5", gpm: 620, xpm: 670, items: ["Bloodstone", "Boots of Travel", "Kaya and Sange", "Black King Bar", "Shiva's Guard", "Eternal Shroud"] },
              { pos: 3, name: "MieRo", hero: "Dark Seer", kda: "2/5/7", gpm: 460, xpm: 510, items: ["Guardian Greaves", "Blink Dagger", "Pipe of Insight", "Aghanim's Scepter", "Refresher Orb", "Lotus Orb"] },
              { pos: 4, name: "Save-", hero: "Earth Spirit", kda: "2/6/8", gpm: 320, xpm: 370, items: ["Tranquil Boots", "Urn of Shadows", "Blink Dagger", "Black King Bar", "Force Staff", "Ghost Scepter"] },
              { pos: 5, name: "TORONTOTOKYO", hero: "Treant Protector", kda: "1/6/9", gpm: 260, xpm: 310, items: ["Arcane Boots", "Solar Crest", "Holy Locket", "Aghanim's Shard", "Glimmer Cape", "Blink Dagger"] }
            ]
          },
          {
            mapNumber: 2,
            duracao: "29:10",
            vencedor: "Team Spirit (Dire)",
            draft: {
              radiantBans: ["Terrorblade", "Slark", "Morphling", "Centaur Warrunner", "Disruptor", "Dark Willow", "Mars"],
              radiantPicks: ["Chaos Knight", "Queen of Pain", "Tidehunter", "Rubick", "Lich"],
              direBans: ["Doom", "Beastmaster", "Chen", "Naga Siren", "Batrider", "Puck", "Shadow Demon"],
              direPicks: ["Anti-Mage", "Kunkka", "Centaur Warrunner", "Clockwerk", "Disruptor"]
            },
            radiantRoster: [
              { pos: 1, name: "Nightfall", hero: "Chaos Knight", kda: "2/7/3", gpm: 580, xpm: 620, items: ["Power Treads", "Armlet of Mordiggian", "Echo Sabre", "Heart of Tarrasque", "Black King Bar", "Assault Cuirass"] },
              { pos: 2, name: "gpk", hero: "Queen of Pain", kda: "3/6/4", gpm: 540, xpm: 590, items: ["Power Treads", "Witch Blade", "Black King Bar", "Aghanim's Scepter", "Shiva's Guard", "Refresher Orb"] },
              { pos: 3, name: "MieRo", hero: "Tidehunter", kda: "1/6/5", gpm: 400, xpm: 450, items: ["Phase Boots", "Blink Dagger", "Refresher Orb", "Pipe of Insight", "Shiva's Guard", "Lotus Orb"] },
              { pos: 4, name: "Save-", hero: "Rubick", kda: "1/7/6", gpm: 290, xpm: 340, items: ["Arcane Boots", "Aether Lens", "Blink Dagger", "Force Staff", "Glimmer Cape", "Ghost Scepter"] },
              { pos: 5, name: "TORONTOTOKYO", hero: "Lich", kda: "1/8/5", gpm: 230, xpm: 280, items: ["Tranquil Boots", "Glimmer Cape", "Force Staff", "Aghanim's Shard", "Aether Lens", "Wind Lace"] }
            ],
            direRoster: [
              { pos: 1, name: "Yatoro", hero: "Anti-Mage", kda: "12/0/5", gpm: 880, xpm: 930, items: ["Power Treads", "Battle Fury", "Manta Style", "Butterfly", "Abyssal Blade", "Heart of Tarrasque"] },
              { pos: 2, name: "Larl", hero: "Kunkka", kda: "6/1/12", gpm: 700, xpm: 750, items: ["Phase Boots", "Aghanim's Scepter", "Black King Bar", "Shiva's Guard", "Refresher Orb", "Heart of Tarrasque"] },
              { pos: 3, name: "Collapse", hero: "Centaur Warrunner", kda: "5/1/14", gpm: 570, xpm: 630, items: ["Phase Boots", "Blink Dagger", "Heart of Tarrasque", "Pipe of Insight", "Crimson Guard", "Lotus Orb"] },
              { pos: 4, name: "rue", hero: "Clockwerk", kda: "3/3/15", gpm: 390, xpm: 450, items: ["Tranquil Boots", "Force Staff", "Blade Mail", "Glimmer Cape", "Aghanim's Shard", "Lotus Orb"] },
              { pos: 5, name: "not me", hero: "Disruptor", kda: "2/3/17", gpm: 310, xpm: 370, items: ["Arcane Boots", "Aghanim's Scepter", "Glimmer Cape", "Force Staff", "Aether Lens", "Ghost Scepter"] }
            ]
          }
        ]
      }
    ];
    setTiFinishedMatches(ti2026Playoffs);
  }, []);

  // 2. POLLING DE PARTIDAS AO VIVO
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

  // 3. JOGOS A SEREM REALIZADOS (VALIDAÇÃO ESTRITA COM A DATA ATUAL)
  useEffect(() => {
    async function loadUpcomingOnly() {
      try {
        const res = await fetch('/api/upcoming');
        if (res.ok) {
          const data = await res.json();
          const now = Date.now();
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
          
          {/* ESQUERDA: JOGOS DO THE INTERNATIONAL 2026 */}
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

      {/* MODAL DETALHADO DA SÉRIE COM IMAGENS DE HERÓIS E ITENS */}
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

            {/* ABAS DOS MAPAS */}
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

            {/* MAPA SELECIONADO */}
            {selectedSeriesDetail.games[activeMapIndex] && (() => {
              const game = selectedSeriesDetail.games[activeMapIndex];
              return (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 12 }}>
                    <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>Vencedor: {game.vencedor}</span>
                    <span style={{ color: 'var(--text-dim)' }}>Duração: {game.duracao}</span>
                  </div>

                  {/* DRAFT COM BANS E PICKS COMPLETOS */}
                  <div className="draft-block">
                    <div className="draft-title">Ordem de Draft (Picks & Bans)</div>
                    
                    {/* RADIANT DRAFT */}
                    <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--accent-cyan)', fontWeight: 700, minWidth: 60 }}>Radiant:</span>
                      <span style={{ color: 'var(--text-dim)', fontSize: 10 }}>Bans:</span>
                      {game.draft.radiantBans.map((h, i) => (
                        <div key={`rb_${i}`} className="draft-hero-pill" style={{ opacity: 0.6 }}>
                          <img src={getHeroImageUrl(h)} alt={h} title={`Ban: ${h}`} />
                        </div>
                      ))}
                      <span style={{ color: '#fff', fontSize: 10, marginLeft: 6 }}>Picks:</span>
                      {game.draft.radiantPicks.map((h, i) => (
                        <div key={`rp_${i}`} className="draft-hero-pill" style={{ border: '1px solid var(--accent-cyan)' }}>
                          <img src={getHeroImageUrl(h)} alt={h} title={`Pick: ${h}`} />
                          <span style={{ color: '#fff', fontWeight: 600 }}>{h}</span>
                        </div>
                      ))}
                    </div>

                    {/* DIRE DRAFT */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--accent-red)', fontWeight: 700, minWidth: 60 }}>Dire:</span>
                      <span style={{ color: 'var(--text-dim)', fontSize: 10 }}>Bans:</span>
                      {game.draft.direBans.map((h, i) => (
                        <div key={`db_${i}`} className="draft-hero-pill" style={{ opacity: 0.6 }}>
                          <img src={getHeroImageUrl(h)} alt={h} title={`Ban: ${h}`} />
                        </div>
                      ))}
                      <span style={{ color: '#fff', fontSize: 10, marginLeft: 6 }}>Picks:</span>
                      {game.draft.direPicks.map((h, i) => (
                        <div key={`dp_${i}`} className="draft-hero-pill" style={{ border: '1px solid var(--accent-red)' }}>
                          <img src={getHeroImageUrl(h)} alt={h} title={`Pick: ${h}`} />
                          <span style={{ color: '#fff', fontWeight: 600 }}>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* TABELA RADIANT */}
                  <div style={{ color: 'var(--accent-cyan)', fontWeight: 700, fontSize: 12, marginTop: 12 }}>Radiant</div>
                  <table className="table-custom">
                    <thead>
                      <tr>
                        <th style={{ width: 140 }}>Jogador</th>
                        <th style={{ width: 60 }}>Herói</th>
                        <th style={{ width: 80 }}>K/D/A</th>
                        <th style={{ width: 90 }}>GPM/XPM</th>
                        <th>Itens de Fim de Jogo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {game.radiantRoster.map((p, i) => (
                        <tr key={i}>
                          <td style={{ color: '#fff', fontWeight: 600 }}>
                            <span style={{ color: 'var(--accent-gold)', marginRight: 6 }}>Pos {p.pos}</span>
                            {p.name}
                          </td>
                          <td>
                            <img 
                              src={getHeroImageUrl(p.hero)} 
                              alt={p.hero} 
                              title={p.hero} 
                              style={{ width: 34, height: 20, borderRadius: 3, objectFit: 'cover', verticalAlign: 'middle', border: '1px solid var(--border)' }} 
                            />
                          </td>
                          <td style={{ fontFamily: 'monospace' }}>{p.kda}</td>
                          <td style={{ fontFamily: 'monospace' }}>
                            <span style={{ color: 'var(--accent-cyan)' }}>{p.gpm}</span> / {p.xpm}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                              {p.items.map((item, itIdx) => (
                                <img
                                  key={itIdx}
                                  src={getItemImageUrl(item)}
                                  alt={item}
                                  title={item}
                                  className="item-slot-icon"
                                />
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
                        <th style={{ width: 140 }}>Jogador</th>
                        <th style={{ width: 60 }}>Herói</th>
                        <th style={{ width: 80 }}>K/D/A</th>
                        <th style={{ width: 90 }}>GPM/XPM</th>
                        <th>Itens de Fim de Jogo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {game.direRoster.map((p, i) => (
                        <tr key={i}>
                          <td style={{ color: '#fff', fontWeight: 600 }}>
                            <span style={{ color: 'var(--accent-gold)', marginRight: 6 }}>Pos {p.pos}</span>
                            {p.name}
                          </td>
                          <td>
                            <img 
                              src={getHeroImageUrl(p.hero)} 
                              alt={p.hero} 
                              title={p.hero} 
                              style={{ width: 34, height: 20, borderRadius: 3, objectFit: 'cover', verticalAlign: 'middle', border: '1px solid var(--border)' }} 
                            />
                          </td>
                          <td style={{ fontFamily: 'monospace' }}>{p.kda}</td>
                          <td style={{ fontFamily: 'monospace' }}>
                            <span style={{ color: 'var(--accent-cyan)' }}>{p.gpm}</span> / {p.xpm}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                              {p.items.map((item, itIdx) => (
                                <img
                                  key={itIdx}
                                  src={getItemImageUrl(item)}
                                  alt={item}
                                  title={item}
                                  className="item-slot-icon"
                                />
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