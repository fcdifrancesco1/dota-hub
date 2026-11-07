// Textos dos feeds da Valve (dota2.com/datafeed) prontos para a tela, em português

// Marcadores dos bônus de item ("+$str" → "+40 Força")
const BONUS_LABELS = {
  str: 'Força',
  agi: 'Agilidade',
  int: 'Inteligência',
  all: 'em todos os atributos',
  selected_attrib: 'no atributo escolhido',
  armor: 'de armadura',
  damage: 'de dano',
  attack: 'de velocidade de ataque',
  attack_pct: 'de velocidade de ataque',
  attack_range: 'de alcance de ataque',
  attack_range_melee: 'de alcance de ataque (corpo a corpo)',
  cast_range: 'de alcance de lançamento',
  aoe_bonus: 'de raio de efeito',
  cooldown_reduction: 'de redução de recarga',
  evasion: 'de evasão',
  health: 'de vida',
  hp_regen: 'de regeneração de vida',
  mana: 'de mana',
  mana_regen: 'de regeneração de mana',
  max_mana_percentage: 'de mana máxima',
  move_speed: 'de velocidade de movimento',
  projectile_speed: 'de velocidade de projétil',
  restoration_amp: 'de amplificação de restauração',
  lifesteal: 'de roubo de vida',
  spell_lifesteal: 'de roubo de vida mágico',
  spell_resist: 'de resistência a magia'
};

const formatNumber = (n) => (Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2))));

/** Valor de um special_value: "1200", "60 / 90 / 120" ou "25%". */
export function specialValueText(sv) {
  const vals = (sv?.values_float || []).map(formatNumber);
  return vals.length ? vals.join(' / ') + (sv.is_percentage ? '%' : '') : '';
}

/** Troca %nome% pelo valor correspondente e %% por %. */
export function fillValues(text, specialValues = []) {
  let out = String(text || '');
  for (const sv of specialValues) {
    if (sv?.name) out = out.split(`%${sv.name}%`).join(specialValueText({ ...sv, is_percentage: false }));
  }
  return out.replace(/%%/g, '%');
}

const stripTags = (s) => s.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim();

/**
 * Descrição do item em blocos: [{ title: 'Ativa: Translocar', text: '...' }, ...].
 * Tira a linha "Em inglês: ..." que a Valve acrescenta no fim.
 */
export function itemDescriptionBlocks(item) {
  const raw = fillValues(item?.desc_loc, item?.special_values).replace(/\n?Em inglês:[\s\S]*$/i, '');
  const blocks = [];
  const parts = raw.split(/<h1>([\s\S]*?)<\/h1>/i);
  // parts: [texto antes, título1, texto1, título2, texto2, ...]
  const lead = stripTags(parts[0] || '');
  if (lead) blocks.push({ title: null, text: lead });
  for (let i = 1; i < parts.length; i += 2) {
    blocks.push({ title: stripTags(parts[i]), text: stripTags(parts[i + 1] || '') });
  }
  return blocks;
}

/** Bônus de atributos do item: ["+40 Força", "+1% de regeneração de vida máxima", "Intervalo entre usos: 105"]. */
export function itemBonuses(item) {
  const out = [];
  for (const sv of item?.special_values || []) {
    const heading = (sv.heading_loc || '').trim();
    const value = specialValueText(sv);
    if (!heading || !value) continue;
    if (heading.startsWith('+')) {
      const rest = heading.slice(1).trim();
      const token = rest.match(/^\$([a-z_]+)$/i);
      const label = token ? (BONUS_LABELS[token[1]] || token[1].replace(/_/g, ' ')) : rest;
      out.push(`+${value} ${label}`);
    } else {
      // "INTERVALO ENTRE USOS:" → "Intervalo entre usos: 105"
      const label = heading.replace(/:$/, '').toLowerCase();
      out.push(`${label[0].toUpperCase()}${label.slice(1)}: ${value}`);
    }
  }
  return out;
}
