import defaultColors from 'tailwindcss/colors';
import plugin from 'tailwindcss/plugin';

/**
 * Temas claro e escuro via variáveis CSS.
 *
 * As classes de cor do projeto (text-white, text-gray-400, bg-amber-500,
 * bg-surface...) leem variáveis `--c-*` com os canais RGB. No tema escuro
 * (padrão) as variáveis têm os valores originais do Tailwind, então o visual
 * escuro não muda. Com `data-theme="light"` no <html>, as mesmas classes passam
 * a usar a paleta clara abaixo — inspirada em portais de estatísticas
 * esportivas: fundo bege, cards brancos, azul-marinho como cor de ação e
 * verde/vermelho escurecidos para manter contraste WCAG AA sobre o branco.
 */

// Paletas do Tailwind que viram variáveis (as que o projeto usa)
const THEMED_PALETTES = ['gray', 'slate', 'amber', 'emerald', 'rose', 'red', 'cyan', 'purple', 'blue'];
const SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

// Tokens semânticos de superfície (substituem os hex fixos como bg-[#0C0E14])
const SURFACE_TOKENS = {
  //             escuro       claro
  canvas:      ['#0A0C10', '#F7EFE4'], // fundo da página
  surface:     ['#0C0E14', '#FFFFFF'], // cards
  'surface-2': ['#141824', '#F3F5F8'], // painéis internos, inputs, cabeçalhos de tabela
  'surface-3': ['#1C2230', '#E9EDF2'], // hover / elevação
  line:        ['#212838', '#E3E6EB'], // bordas
  'line-strong': ['#262F44', '#CDD3DB'],
  'on-accent': ['#FFFFFF', '#FFFFFF'] // texto sobre preenchimento colorido (vermelho, roxo...)
};

// Paleta legada `dota-*` do projeto
const DOTA_TOKENS = {
  bg:     ['#0D0F14', '#F7EFE4'],
  surface:['#151821', '#FFFFFF'],
  card:   ['#1B1F2B', '#F3F5F8'],
  border: ['#282E3F', '#E3E6EB'],
  accent: ['#E5A93C', '#023266'],
  cyan:   ['#00E5FF', '#1F6F99'],
  text:   ['#E2E8F0', '#18202B'],
  dim:    ['#8E99AD', '#4F5863']
};

// Tema claro. "white" é a cor de texto principal do tema escuro, então no claro
// vira tinta escura; "black" (fundos rebaixados e texto sobre botões) vira um
// cinza-claro. amber (acento do tema escuro) vira o azul-marinho da paleta.
const LIGHT = {
  white: '#18202B',
  black: '#E6EAF0',
  gray: {
    50: '#0E141C', 100: '#1F2630', 200: '#2A323C', 300: '#3B4450', 400: '#4F5863',
    500: '#5F6873', 600: '#687180', 700: '#B4BAC2', 800: '#D5DAE0', 900: '#E9ECF0', 950: '#F4F6F9'
  },
  slate: {
    50: '#0E141C', 100: '#1F2630', 200: '#2A323C', 300: '#3B4450', 400: '#4F5863',
    500: '#5F6873', 600: '#687180', 700: '#B4BAC2', 800: '#D5DAE0', 900: '#E9ECF0', 950: '#F4F6F9'
  },
  amber: {
    50: '#EAF1F8', 100: '#CFDDEC', 200: '#3A6A9E', 300: '#1E4E86', 400: '#023266',
    500: '#023266', 600: '#01264E', 700: '#011C3B', 800: '#DCE6F1', 900: '#E6EDF5', 950: '#EEF3F9'
  },
  emerald: {
    50: '#E9F6F0', 100: '#CDEBDD', 200: '#07603F', 300: '#065C3F', 400: '#07683F',
    500: '#0A8F62', 600: '#087550', 700: '#065F41', 800: '#CFE9DC', 900: '#DDF0E6', 950: '#EAF6F0'
  },
  rose: {
    50: '#FCECEE', 100: '#F8D3D8', 200: '#960D24', 300: '#8F0C22', 400: '#B00E28',
    500: '#D92023', 600: '#B01A1D', 700: '#8E1518', 800: '#F3D2D6', 900: '#F8E1E4', 950: '#FCEEF0'
  },
  red: {
    50: '#FCECEC', 100: '#F8D4D4', 200: '#961A1A', 300: '#A51F1F', 400: '#B42323',
    500: '#D92023', 600: '#B01A1D', 700: '#8E1518', 800: '#F1D0D0', 900: '#F7DEDE', 950: '#FBECEC'
  },
  cyan: {
    50: '#E8F3F9', 100: '#CBE4F1', 200: '#154F69', 300: '#1A5F82', 400: '#1B6489',
    500: '#2E8BB9', 600: '#236F95', 700: '#1B5876', 800: '#D3E7F2', 900: '#E0EEF6', 950: '#EDF6FB'
  },
  purple: {
    50: '#F2ECFC', 100: '#E1D5F7', 200: '#4F2C8F', 300: '#57309C', 400: '#6236B0',
    500: '#7C4DDB', 600: '#6231B8', 700: '#4E2794', 800: '#E1D6F6', 900: '#EAE2F9', 950: '#F3EEFC'
  },
  blue: {
    50: '#EAF1FB', 100: '#D0E0F6', 200: '#1D4F9E', 300: '#1F58B0', 400: '#1D5FC4',
    500: '#2563EB', 600: '#1D4ED8', 700: '#1E40AF', 800: '#D6E3F7', 900: '#E3ECF9', 950: '#EEF4FC'
  }
};

const rgb = (hex) => {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(' ');
};
const ref = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

function buildColors() {
  const colors = { white: ref('white'), black: ref('black') };
  for (const p of THEMED_PALETTES) {
    colors[p] = Object.fromEntries(SHADES.map((s) => [s, ref(`${p}-${s}`)]));
  }
  for (const name of Object.keys(SURFACE_TOKENS)) colors[name] = ref(name);
  colors.dota = Object.fromEntries(Object.keys(DOTA_TOKENS).map((k) => [k, ref(`dota-${k}`)]));
  return colors;
}

function buildVars(mode) {
  const i = mode === 'dark' ? 0 : 1;
  const vars = {};
  if (mode === 'dark') {
    vars['--c-white'] = rgb('#FFFFFF');
    vars['--c-black'] = rgb('#000000');
    for (const p of THEMED_PALETTES) for (const s of SHADES) vars[`--c-${p}-${s}`] = rgb(defaultColors[p][s]);
  } else {
    vars['--c-white'] = rgb(LIGHT.white);
    vars['--c-black'] = rgb(LIGHT.black);
    for (const p of THEMED_PALETTES) for (const s of SHADES) vars[`--c-${p}-${s}`] = rgb(LIGHT[p][s]);
  }
  for (const [name, pair] of Object.entries(SURFACE_TOKENS)) vars[`--c-${name}`] = rgb(pair[i]);
  for (const [name, pair] of Object.entries(DOTA_TOKENS)) vars[`--c-dota-${name}`] = rgb(pair[i]);
  return vars;
}

/** @type {import('tailwindcss').Config} */
export default {
  // Variante dark: para os raros casos que precisam de valores diferentes por tema
  // (ex.: cores de marca como Discord/WhatsApp, que não passam pelos tokens)
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: buildColors()
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ':root': { ...buildVars('dark'), colorScheme: 'dark' },
        '[data-theme="light"]': { ...buildVars('light'), colorScheme: 'light' }
      });
    })
  ],
}
