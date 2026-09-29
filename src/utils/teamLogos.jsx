import React, { useReducer } from 'react';
import { Shield } from 'lucide-react';

// Mapeamento de logos locais de alta resolução e Steam CDN oficiais verificados
const LOCAL_TEAM_LOGOS = {
  // Team Spirit
  'spirit': '/team-logos/spirit.png',
  'team spirit': '/team-logos/spirit.png',
  'tspirit': '/team-logos/spirit.png',
  '7119388': '/team-logos/spirit.png',

  // Team Nemesis
  'nemesis': '/team-logos/nemesis.png',
  'team nemesis': '/team-logos/nemesis.png',
  'nmss': '/team-logos/nemesis.png',
  '9691969': '/team-logos/nemesis.png',

  // Level UP esports
  'levelup': '/team-logos/levelup.png',
  'level up': '/team-logos/levelup.png',
  'level up esports': '/team-logos/levelup.png',
  '9256405': '/team-logos/levelup.png',

  // PARIVISION / VISION
  'parivision': '/team-logos/parivision.png',
  'pari vision': '/team-logos/parivision.png',
  'vision': '/team-logos/parivision.png',
  'pv': '/team-logos/parivision.png',
  '9824702': '/team-logos/parivision.png',

  // GamerLegion
  'gamerlegion': '/team-logos/gamerlegion.png',
  'gamer legion': '/team-logos/gamerlegion.png',
  'gl': '/team-logos/gamerlegion.png',
  '9964962': '/team-logos/gamerlegion.png',

  // Hokori
  'hokori': '/team-logos/hokori.png',
  '7119077': '/team-logos/hokori.png',

  // Conventus Stellarum
  'conventus': '/team-logos/conventus.png',
  'conventus stellarum': '/team-logos/conventus.png',
  '10261180': '/team-logos/conventus.png',

  // Team Falcons
  'falcons': '/team-logos/falcons.png',
  'team falcons': '/team-logos/falcons.png',
  'flcn': '/team-logos/falcons.png',
  '9247354': '/team-logos/falcons.png',

  // Team Liquid
  'liquid': '/team-logos/liquid.png',
  'team liquid': '/team-logos/liquid.png',
  'tl': '/team-logos/liquid.png',
  '2163': '/team-logos/liquid.png',

  // Gaimin Gladiators
  'gladiators': '/team-logos/gladiators.png',
  'gaimin gladiators': '/team-logos/gladiators.png',
  'gaimin': '/team-logos/gladiators.png',
  'gg': '/team-logos/gladiators.png',
  '8599101': '/team-logos/gladiators.png',

  // BetBoom Team
  'betboom': '/team-logos/betboom.png',
  'betboom team': '/team-logos/betboom.png',
  'bb': '/team-logos/betboom.png',
  'bb team': '/team-logos/betboom.png',
  '8605863': '/team-logos/betboom.png',
  '9131584': '/team-logos/betboom.png',

  // Tundra Esports
  'tundra': '/team-logos/tundra.png',
  'tundra esports': '/team-logos/tundra.png',
  '8255776': '/team-logos/tundra.png',
  '8291895': '/team-logos/tundra.png',

  // Xtreme Gaming
  'xtreme': '/team-logos/xtreme.png',
  'xtreme gaming': '/team-logos/xtreme.png',
  'xg': '/team-logos/xtreme.png',
  '8254400': '/team-logos/xtreme.png',
  '8261500': '/team-logos/xtreme.png',

  // OG
  'og': '/team-logos/og.png',
  '2586976': '/team-logos/og.png',

  // Natus Vincere (NAVI)
  'navi': '/team-logos/navi.png',
  'natus vincere': '/team-logos/navi.png',
  "na'vi": '/team-logos/navi.png',
  '36': '/team-logos/navi.png',
  '9017006': '/team-logos/navi.png',

  // Team Secret
  'secret': '/team-logos/secret.png',
  'team secret': '/team-logos/secret.png',
  '1838315': '/team-logos/secret.png',

  // Aurora
  'aurora': '/team-logos/aurora.png',
  'aurora gaming': '/team-logos/aurora.png',
  'aurora 1xbet': '/team-logos/aurora.png',
  '9247498': '/team-logos/aurora.png',
  '9467224': '/team-logos/aurora.png',

  // Cloud9
  'cloud9': '/team-logos/cloud9.png',
  'cloud 9': '/team-logos/cloud9.png',
  'c9': '/team-logos/cloud9.png',
  '1333179': '/team-logos/cloud9.png',

  // Shopify Rebellion
  'shopify': '/team-logos/shopify.png',
  'shopify rebellion': '/team-logos/shopify.png',
  'sr': '/team-logos/shopify.png',
  '8894818': '/team-logos/shopify.png',

  // Talon Esports
  'talon': '/team-logos/talon.png',
  'talon esports': '/team-logos/talon.png',
  'flipster talon': '/team-logos/talon.png',
  '8632698': '/team-logos/talon.png',
  '9766941': '/team-logos/talon.png',

  // HEROIC
  'heroic': '/team-logos/heroic.png',
  'team heroic': '/team-logos/heroic.png',
  '9272362': '/team-logos/heroic.png',
  '9303484': '/team-logos/heroic.png',

  // Beastcoast
  'beastcoast': '/team-logos/beastcoast.png',
  'bc': '/team-logos/beastcoast.png',
  '7390454': '/team-logos/beastcoast.png',

  // MOUZ
  'mouz': '/team-logos/mouz.png',
  'mousesports': '/team-logos/mouz.png',
  '9459989': '/team-logos/mouz.png',
  '9338413': '/team-logos/mouz.png',

  // 1win
  '1win': '/team-logos/1win.png',
  '1win team': '/team-logos/1win.png',
  '1w': '/team-logos/1win.png',
  '8676239': '/team-logos/1win.png',
  '10182357': '/team-logos/1win.png',

  // PSG Quest
  'quest': '/team-logos/quest.png',
  'psg quest': '/team-logos/quest.png',
  'quest esports': '/team-logos/quest.png',
  '8897531': '/team-logos/quest.png',

  // Nigma Galaxy
  'nigma': '/team-logos/nigma.png',
  'nigma galaxy': '/team-logos/nigma.png',
  'ngx': '/team-logos/nigma.png',
  '7554697': '/team-logos/nigma.png',
  '10136357': '/team-logos/nigma.png',

  // Entity
  'entity': '/team-logos/entity.png',
  'entity gaming': '/team-logos/entity.png',
  'entity esports': '/team-logos/entity.png',

  // Virtus.pro
  'virtus': '/team-logos/virtus.png',
  'virtus.pro': '/team-logos/virtus.png',
  'virtus pro': '/team-logos/virtus.png',
  'vp': '/team-logos/virtus.png',
  '1883502': '/team-logos/virtus.png',
  '7819701': '/team-logos/virtus.png',

  // BOOM Esports
  'boom': '/team-logos/boom.png',
  'boom esports': '/team-logos/boom.png',
  '726228': '/team-logos/boom.png',

  // LGD Gaming
  'lgd': '/team-logos/lgd.png',
  'lgd gaming': '/team-logos/lgd.png',
  'psg.lgd': '/team-logos/lgd.png',
  '15': '/team-logos/lgd.png',
  '10150538': '/team-logos/lgd.png',

  // Azure Ray
  'azureray': '/team-logos/azureray.png',
  'azure ray': '/team-logos/azureray.png',
  'ar': '/team-logos/azureray.png',
  '9170852': '/team-logos/azureray.png',

  // Invictus Gaming
  'invictus gaming': 'https://steamcdn-a.akamaihd.net/apps/dota2/images/team_logos/5.png',
  'ig': 'https://steamcdn-a.akamaihd.net/apps/dota2/images/team_logos/5.png',
  '5': 'https://steamcdn-a.akamaihd.net/apps/dota2/images/team_logos/5.png',

  // Newbee
  'newbee': 'https://steamcdn-a.akamaihd.net/apps/dota2/images/team_logos/6214538.png',
  '6214538': 'https://steamcdn-a.akamaihd.net/apps/dota2/images/team_logos/6214538.png',

  // Evil Geniuses
  'evil geniuses': 'https://cdn.steamusercontent.com/ugc/1983302387907692940/BAA861E234E1BA39D75DF4CB814A5B76D020BED7/',
  'eg': 'https://cdn.steamusercontent.com/ugc/1983302387907692940/BAA861E234E1BA39D75DF4CB814A5B76D020BED7/',
  '8255756': 'https://cdn.steamusercontent.com/ugc/1983302387907692940/BAA861E234E1BA39D75DF4CB814A5B76D020BED7/'
};

// Registro dinâmico de equipes populado via API OpenDota (/api/teams)
const DYNAMIC_TEAMS_BY_ID = new Map();
const DYNAMIC_TEAMS_BY_NAME = new Map();

export function registerTeamLogos(teams) {
  if (!Array.isArray(teams)) return;
  for (const t of teams) {
    if (!t) continue;
    const logo = t.logo_url || t.logo;
    if (!logo || typeof logo !== 'string' || !logo.startsWith('http')) continue;
    if (t.team_id) {
      DYNAMIC_TEAMS_BY_ID.set(String(t.team_id), logo);
    }
    if (t.name) {
      DYNAMIC_TEAMS_BY_NAME.set(cleanStr(t.name), logo);
      const stripped = cleanStr(t.name).replace(/^(team|gaming|esports)/, '').replace(/(team|gaming|esports)$/, '');
      if (stripped && stripped.length >= 2) {
        DYNAMIC_TEAMS_BY_NAME.set(stripped, logo);
      }
    }
  }
}

function cleanStr(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

// URLs de logo que já falharam ao carregar nesta sessão. Guardado fora do
// componente para que um logo quebrado não seja tentado de novo a cada
// atualização automática (era isso que fazia o espaço do logo "piscar").
const FAILED_LOGO_URLS = new Set();

function isUsableLogoUrl(url) {
  return typeof url === 'string' &&
    (url.startsWith('http') || url.startsWith('/')) &&
    !url.includes('placeholder-team') &&
    !/Dota_2_default/i.test(url);
}

function findLocalLogoByName(teamName) {
  const cleaned = cleanStr(teamName);
  if (!cleaned) return null;
  for (const [key, logoPath] of Object.entries(LOCAL_TEAM_LOGOS)) {
    if (cleanStr(key) === cleaned) return logoPath;
  }
  const stripped = cleaned.replace(/^(team|gaming|esports)/, '').replace(/(team|gaming|esports)$/, '');
  if (stripped && stripped.length >= 2) {
    for (const [key, logoPath] of Object.entries(LOCAL_TEAM_LOGOS)) {
      if (cleanStr(key) === stripped) return logoPath;
    }
  }
  return null;
}

/**
 * Lista, em ordem de prioridade, todas as URLs de logo conhecidas para a equipe.
 * Suporta as assinaturas (teamName, teamId, fallbackUrl) e (teamName, fallbackUrl).
 */
export function getTeamLogoCandidates(teamName, teamIdOrUrl, fallbackUrl) {
  let teamId = null;
  const explicitUrls = [];

  if (isUsableLogoUrl(teamIdOrUrl)) {
    explicitUrls.push(teamIdOrUrl);
  } else if (teamIdOrUrl && /^\d+$/.test(String(teamIdOrUrl))) {
    teamId = String(teamIdOrUrl);
  }
  if (isUsableLogoUrl(fallbackUrl)) explicitUrls.push(fallbackUrl);

  const candidates = [
    // 1. URL fornecida pela API — a Liquipedia já envia a versão "darkmode",
    //    feita para fundo escuro, e cobre também times menores
    ...explicitUrls,
    // 2. Dicionário local (arquivos em /public/team-logos)
    teamId && LOCAL_TEAM_LOGOS[teamId],
    teamName && findLocalLogoByName(teamName),
    // 3. Registro dinâmico carregado da OpenDota
    teamId && DYNAMIC_TEAMS_BY_ID.get(teamId),
    teamName && DYNAMIC_TEAMS_BY_NAME.get(cleanStr(teamName))
  ];

  return [...new Set(candidates.filter(isUsableLogoUrl))];
}

/**
 * Melhor logo disponível para a equipe, ou null quando nenhum é conhecido
 * (nesse caso, exiba as iniciais do time — ver componente TeamLogo).
 */
export function getTeamLogo(teamName, teamIdOrUrl, fallbackUrl) {
  return getTeamLogoCandidates(teamName, teamIdOrUrl, fallbackUrl)
    .find((url) => !FAILED_LOGO_URLS.has(url)) || null;
}

function getTeamInitials(teamName) {
  return String(teamName || '')
    .replace(/^(team|gaming|esports)\s+/i, '')
    .replace(/[^\p{L}\p{N}]/gu, '')
    .slice(0, 3)
    .toUpperCase();
}

/**
 * Componente universal de logo de equipe. Tenta cada URL conhecida em ordem;
 * se todas falharem (ou não houver nenhuma), mostra um badge estático com as
 * iniciais do time — sem animação e sem novas tentativas.
 */
export default function TeamLogo({
  teamName,
  teamId,
  logoUrl,
  className = "w-6 h-6",
  imgClassName = "w-full h-full object-contain",
  alt = "",
  showBadgeFallback = true
}) {
  const [, forceRender] = useReducer((n) => n + 1, 0);
  const resolvedUrl = getTeamLogo(teamName, teamId, logoUrl);

  if (!resolvedUrl) {
    if (!showBadgeFallback) return null;
    const initials = getTeamInitials(teamName);
    return (
      <div
        className={`${className} flex items-center justify-center rounded-lg bg-surface-2 border border-white/10 text-[9px] font-mono font-black text-amber-400 shrink-0 select-none shadow-sm`}
        title={teamName || "Equipe"}
      >
        {initials || <Shield className="w-3.5 h-3.5 text-gray-500" />}
      </div>
    );
  }

  return (
    <div className={`${className} flex items-center justify-center shrink-0 overflow-hidden`}>
      <img
        key={resolvedUrl}
        src={resolvedUrl}
        alt={alt || teamName || "Logo da Equipe"}
        title={teamName || undefined}
        // team-logo-img (index.css): contorno sutil que mantém legíveis logos
        // escuros no tema escuro e logos brancos no tema claro
        className={`${imgClassName} team-logo-img`}
        referrerPolicy="no-referrer"
        loading="lazy"
        decoding="async"
        onError={() => {
          FAILED_LOGO_URLS.add(resolvedUrl);
          forceRender();
        }}
      />
    </div>
  );
}
