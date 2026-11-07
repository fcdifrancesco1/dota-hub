// Layout da loja do jogo (scripts/shops.txt do Dota 2, cópia do d2vpkr de mar/2026):
// cada categoria com os itens na ordem em que aparecem no cliente.
// shortcut: lista fixa; quando a Valve mexer na loja, gerar de novo a partir do shops.txt
export const SHOP_BASIC = [
  {
    "key": "consumables",
    "label": "Consumíveis",
    "items": [
      "tpscroll",
      "clarity",
      "faerie_fire",
      "smoke_of_deceit",
      "ward_observer",
      "ward_sentry",
      "enchanted_mango",
      "flask",
      "tango",
      "blood_grenade",
      "dust",
      "bottle",
      "infused_raindrop",
      "aghanims_shard"
    ]
  },
  {
    "key": "attributes",
    "label": "Atributos",
    "items": [
      "branches",
      "gauntlets",
      "slippers",
      "mantle",
      "circlet",
      "belt_of_strength",
      "boots_of_elves",
      "robe",
      "crown",
      "ogre_axe",
      "blade_of_alacrity",
      "staff_of_wizardry",
      "diadem",
      "ghost"
    ]
  },
  {
    "key": "weapons_armor",
    "label": "Equipamento",
    "items": [
      "quelling_blade",
      "ring_of_protection",
      "blades_of_attack",
      "orb_of_frost",
      "gloves",
      "chainmail",
      "broadsword",
      "blight_stone",
      "blitz_knuckles",
      "splintmail",
      "claymore",
      "orb_of_venom",
      "javelin",
      "helm_of_iron_will",
      "mithril_hammer"
    ]
  },
  {
    "key": "misc",
    "label": "Diversos",
    "items": [
      "ring_of_regen",
      "sobi_mask",
      "wind_lace",
      "magic_stick",
      "fluffy_hat",
      "wizard_hat",
      "boots",
      "voodoo_mask",
      "shawl",
      "shadow_amulet",
      "gem",
      "lifesteal",
      "cloak",
      "chasm_stone",
      "blink"
    ]
  },
  {
    "key": "secretshop",
    "label": "Loja secreta",
    "items": [
      "ring_of_health",
      "void_stone",
      "talisman_of_evasion",
      "platemail",
      "ring_of_tarrasque",
      "tiara_of_selemene",
      "hyperstone",
      "demon_edge",
      "vitality_booster",
      "energy_booster",
      "point_booster",
      "relic",
      "reaver",
      "eagle",
      "mystic_staff",
      "ultimate_orb"
    ]
  }
];

export const SHOP_UPGRADES = [
  {
    "key": "basics",
    "label": "Acessórios",
    "items": [
      "magic_wand",
      "bracer",
      "wraith_band",
      "null_talisman",
      "power_treads",
      "soul_ring",
      "orb_of_corrosion",
      "falcon_blade",
      "phase_boots",
      "pers",
      "mask_of_madness",
      "oblivion_staff",
      "travel_boots",
      "hand_of_midas",
      "moon_shard",
      "soul_booster"
    ]
  },
  {
    "key": "support",
    "label": "Suporte",
    "items": [
      "ring_of_basilius",
      "headdress",
      "urn_of_shadows",
      "tranquil_boots",
      "arcane_boots",
      "mekansm",
      "essence_distiller",
      "ancient_janggo",
      "pavise",
      "guardian_greaves",
      "spirit_vessel",
      "boots_of_bearing",
      "solar_crest",
      "glimmer_cape",
      "holy_locket",
      "pipe"
    ]
  },
  {
    "key": "magics",
    "label": "Magia",
    "items": [
      "veil_of_discord",
      "rod_of_atos",
      "cyclone",
      "phylactery",
      "bloodstone",
      "gungir",
      "wind_waker",
      "angels_demise",
      "force_staff",
      "aether_lens",
      "meteor_hammer",
      "dagon",
      "ultimate_scepter",
      "crellas_crozier",
      "octarine_core",
      "orchid",
      "refresher",
      "ethereal_blade",
      "sheepstick",
      "bloodthorn"
    ]
  },
  {
    "key": "defense",
    "label": "Armadura",
    "items": [
      "buckler",
      "vanguard",
      "blade_mail",
      "helm_of_the_dominator",
      "vladmir",
      "crimson_guard",
      "armlet",
      "helm_of_the_overlord",
      "consecrated_wraps",
      "aeon_disk",
      "lotus_orb",
      "black_king_bar",
      "shivas_guard",
      "sphere",
      "assault",
      "heart"
    ]
  },
  {
    "key": "weapons",
    "label": "Armas",
    "items": [
      "lesser_crit",
      "mage_slayer",
      "heavens_halberd",
      "desolator",
      "revenants_brooch",
      "basher",
      "maelstrom",
      "invis_sword",
      "greater_crit",
      "abyssal_blade",
      "mjollnir",
      "silver_edge",
      "bfury",
      "nullifier",
      "manta",
      "radiance",
      "rapier",
      "monkey_king_bar",
      "butterfly",
      "satanic"
    ]
  },
  {
    "key": "artifacts",
    "label": "Armamentos",
    "items": [
      "sange",
      "yasha",
      "kaya",
      "dragon_lance",
      "kaya_and_sange",
      "sange_and_yasha",
      "yasha_and_kaya",
      "hurricane_pike",
      "echo_sabre",
      "diffusal_blade",
      "witch_blade",
      "specialists_array",
      "harpoon",
      "disperser",
      "devastator",
      "hydras_breath",
      "overwhelming_blink",
      "swift_blink",
      "arcane_blink",
      "skadi"
    ]
  }
];
