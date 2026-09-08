import React, { useState } from 'react';
import { Shield } from 'lucide-react';

// Mapeamento de logos locais de alta resolução armazenados em /public/team-logos/
const LOCAL_TEAM_LOGOS = {
  // Team Spirit
  'spirit': '/team-logos/spirit.png',
  'team spirit': '/team-logos/spirit.png',
  'tspirit': '/team-logos/spirit.png',
  '7119388': '/team-logos/spirit.png',

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
  '8605863': '/team-logos/betboom.png',

  // Tundra Esports
  'tundra': '/team-logos/tundra.png',
  'tundra esports': '/team-logos/tundra.png',
  '8255776': '/team-logos/tundra.png',

  // Xtreme Gaming
  'xtreme': '/team-logos/xtreme.png',
  'xtreme gaming': '/team-logos/xtreme.png',
  'xg': '/team-logos/xtreme.png',
  '8254400': '/team-logos/xtreme.png',

  // OG
  'og': '/team-logos/og.png',
  '2586976': '/team-logos/og.png',

  // Natus Vincere (NAVI)
  'navi': '/team-logos/navi.png',
  'natus vincere': '/team-logos/navi.png',
  "na'vi": '/team-logos/navi.png',
  '36': '/team-logos/navi.png',

  // Team Secret
  'secret': '/team-logos/secret.png',
  'team secret': '/team-logos/secret.png',
  '1838315': '/team-logos/secret.png',

  // Aurora
  'aurora': '/team-logos/aurora.png',
  'aurora gaming': '/team-logos/aurora.png',
  'aurora 1xbet': '/team-logos/aurora.png',
  '9247498': '/team-logos/aurora.png',

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
  '8632698': '/team-logos/talon.png',

  // HEROIC
  'heroic': '/team-logos/heroic.png',
  'team heroic': '/team-logos/heroic.png',
  '9272362': '/team-logos/heroic.png',

  // Beastcoast
  'beastcoast': '/team-logos/beastcoast.png',
  'bc': '/team-logos/beastcoast.png',
  '7390454': '/team-logos/beastcoast.png',

  // MOUZ
  'mouz': '/team-logos/mouz.png',
  'mousesports': '/team-logos/mouz.png',
  '9459989': '/team-logos/mouz.png',

  // 1win
  '1win': '/team-logos/1win.png',
  '1win team': '/team-logos/1win.png',
  '8676239': '/team-logos/1win.png',

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

  // BOOM Esports
  'boom': '/team-logos/boom.png',
  'boom esports': '/team-logos/boom.png',
  '726228': '/team-logos/boom.png',

  // LGD Gaming
  'lgd': '/team-logos/lgd.png',
  'lgd gaming': '/team-logos/lgd.png',
  'psg.lgd': '/team-logos/lgd.png',
  '15': '/team-logos/lgd.png',

  // Azure Ray
  'azureray': '/team-logos/azureray.png',
  'azure ray': '/team-logos/azureray.png',
  'ar': '/team-logos/azureray.png',
  '9170852': '/team-logos/azureray.png',

  // PARIVISION / VISION
  'vision': '/team-logos/vision.png',
  'parivision': '/team-logos/vision.png'
};

function cleanStr(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Resolve o melhor logo para qualquer equipe de Dota 2.
 * 1. Logo local em /team-logos/ (instantâneo, sem 404, alta qualidade)
 * 2. URL fornecida via API (se houver)
 * 3. Stratz CDN por teamId (se id fornecido)
 */
export function getTeamLogo(teamName, teamId, fallbackUrl) {
  if (teamId && LOCAL_TEAM_LOGOS[String(teamId)]) {
    return LOCAL_TEAM_LOGOS[String(teamId)];
  }

  if (teamName) {
    const cleaned = cleanStr(teamName);
    if (cleaned) {
      for (const [key, logoPath] of Object.entries(LOCAL_TEAM_LOGOS)) {
        if (cleanStr(key) === cleaned) {
          return logoPath;
        }
      }

      const stripped = cleaned.replace(/^(team|gaming|esports)/, '').replace(/(team|gaming|esports)$/, '');
      if (stripped && stripped.length >= 2) {
        for (const [key, logoPath] of Object.entries(LOCAL_TEAM_LOGOS)) {
          if (cleanStr(key) === stripped) {
            return logoPath;
          }
        }
      }
    }
  }

  if (fallbackUrl && typeof fallbackUrl === 'string' && fallbackUrl.startsWith('http')) {
    return fallbackUrl;
  }

  if (teamId && /^\d+$/.test(String(teamId))) {
    return `https://cdn.stratz.com/images/dota2/teams/${teamId}.png`;
  }

  return null;
}

/**
 * Componente React universal para exibir o logo de uma equipe de forma consistente.
 */
export default function TeamLogo({
  teamName,
  teamId,
  logoUrl,
  className = "w-5 h-5",
  imgClassName = "w-full h-full object-contain",
  alt = "",
  showBadgeFallback = true
}) {
  const [hasError, setHasError] = useState(false);
  const resolvedUrl = hasError ? null : getTeamLogo(teamName, teamId, logoUrl);

  const initials = String(teamName || 'D2')
    .replace(/^(team|gaming)\s+/i, '')
    .trim()
    .slice(0, 3)
    .toUpperCase();

  if (!resolvedUrl) {
    if (!showBadgeFallback) return null;
    return (
      <div
        className={`${className} flex items-center justify-center rounded-md bg-white/5 border border-white/10 text-[9px] font-mono font-black text-amber-400/80 shrink-0 select-none`}
        title={teamName || "Equipe"}
      >
        {initials || <Shield className="w-3.5 h-3.5 text-gray-500" />}
      </div>
    );
  }

  return (
    <div className={`${className} flex items-center justify-center shrink-0 overflow-hidden`}>
      <img
        src={resolvedUrl}
        alt={alt || teamName || "Logo da Equipe"}
        className={`${imgClassName} transition-transform hover:scale-105`}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
      />
    </div>
  );
}
