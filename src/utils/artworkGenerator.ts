import type { AnimeItem } from './animeLogic';

/**
 * Generates high-detail cel-shaded SVG anime artwork (posters, 16:9 hero banners,
 * episode scene thumbnails, and stylized title logos) as self-contained data URLs.
 * Guarantees 0 broken images and vibrant, distinct anime art for every title.
 */

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function hashCode(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * Generates a vertical 2:3 anime poster SVG data URL with custom character silhouettes,
 * energy effects, Japanese vertical katakana/kanji accents, and dramatic lighting.
 */
export function getAnimePosterUrl(anime: Pick<AnimeItem, 'id' | 'title' | 'nativeTitle' | 'palette' | 'artMotif' | 'studio'>): string {
  const seed = hashCode(anime.id + anime.title);
  const { primary, secondary, accent, bgDark } = anime.palette;
  const nativeSafe = escapeXml(anime.nativeTitle || 'アニメ');
  const studioSafe = escapeXml(anime.studio || 'STUDIO');

  const moonX = 160 + (seed % 180);
  const moonY = 120 + (seed % 90);
  const slashAngle = -28 + (seed % 40);

  let motifLayer = '';

  switch (anime.artMotif) {
    case 'cyberpunk':
      motifLayer = `
        <!-- Neon Night City skyscrapers -->
        <rect x="20" y="180" width="55" height="420" fill="#120907" opacity="0.85"/>
        <rect x="85" y="140" width="70" height="460" fill="#1c0d08" opacity="0.8"/>
        <rect x="330" y="160" width="60" height="440" fill="#160a06" opacity="0.85"/>
        <!-- Glowing cybernetic visors and cannon -->
        <g transform="translate(210, 290)">
          <polygon points="-140,-40 80,-95 110,-20 -120,45" fill="${primary}" opacity="0.85"/>
          <polygon points="-130,-25 65,-75 85,-25 -115,25" fill="${accent}" opacity="0.9"/>
          <!-- Cyborg mercenary silhouette -->
          <path d="M-20,-130 C30,-130 65,-90 65,-40 L95,180 L-85,180 L-55,-40 C-55,-90 -40,-130 -20,-130 Z" fill="#140907" stroke="${primary}" stroke-width="3"/>
          <!-- Glowing cyber shades -->
          <polygon points="-35,-75 5,-82 2,-64 -32,-60" fill="${accent}"/>
          <polygon points="15,-82 45,-76 42,-62 15,-65" fill="${accent}"/>
          <!-- Energy core -->
          <circle cx="-45" cy="-15" r="36" fill="${accent}" opacity="0.95"/>
          <circle cx="-45" cy="-15" r="58" fill="none" stroke="${primary}" stroke-width="4" opacity="0.7"/>
        </g>
      `;
      break;
    case 'cursed':
      motifLayer = `
        <!-- Cursed energy vortex & domain geometry -->
        <circle cx="200" cy="260" r="145" fill="none" stroke="${secondary}" stroke-width="3" stroke-dasharray="14 8" opacity="0.7"/>
        <circle cx="200" cy="260" r="110" fill="${primary}" opacity="0.22"/>
        <!-- Sorcerer silhouette -->
        <path d="M200,130 L245,190 L290,480 L110,480 L155,190 Z" fill="#0b101d" stroke="${secondary}" stroke-width="2.5"/>
        <!-- Spiky hair silhouette -->
        <polygon points="165,145 150,105 180,120 200,90 220,120 250,105 235,145" fill="#e2e8f0"/>
        <!-- Glowing six-eyes / cursed flame -->
        <path d="M120,250 Q200,180 280,250 Q200,310 120,250 Z" fill="${secondary}" opacity="0.45"/>
        <circle cx="184" cy="155" r="5" fill="#38bdf8"/>
        <circle cx="216" cy="155" r="5" fill="#38bdf8"/>
        <path d="M90,340 Q190,260 310,330" fill="none" stroke="${accent}" stroke-width="8" stroke-linecap="round"/>
      `;
      break;
    case 'grimoire':
    case 'fantasy':
      motifLayer = `
        <!-- Magic circle & anti-magic greatsword -->
        <circle cx="200" cy="240" r="135" fill="none" stroke="${accent}" stroke-width="2" opacity="0.6"/>
        <polygon points="200,95 325,310 75,310" fill="none" stroke="${primary}" stroke-width="2.5" opacity="0.6"/>
        <polygon points="200,385 325,170 75,170" fill="none" stroke="${secondary}" stroke-width="2.5" opacity="0.6"/>
        <!-- Giant Demon-Slayer Sword silhouette -->
        <polygon points="200,65 238,145 224,450 176,450 162,145" fill="#09090d" stroke="${primary}" stroke-width="3"/>
        <line x1="200" y1="85" x2="200" y2="430" stroke="${accent}" stroke-width="3" opacity="0.8"/>
      `;
      break;
    case 'shadow':
      motifLayer = `
        <!-- Shadow Monarch Dungeon Gate -->
        <ellipse cx="200" cy="270" rx="130" ry="175" fill="#090514" stroke="${primary}" stroke-width="5"/>
        <ellipse cx="200" cy="270" rx="105" ry="145" fill="${secondary}" opacity="0.25"/>
        <!-- Hunter silhouette with glowing daggers -->
        <path d="M200,145 L245,220 L265,470 L135,470 L155,220 Z" fill="#050508" stroke="${accent}" stroke-width="2"/>
        <!-- Glowing violet/cyan eyes -->
        <polygon points="180,175 196,180 184,185" fill="#38bdf8"/>
        <polygon points="220,175 204,180 216,185" fill="#38bdf8"/>
        <!-- Dual daggers slash -->
        <path d="M75,310 L325,210" stroke="#38bdf8" stroke-width="5" stroke-linecap="round"/>
        <path d="M85,220 L315,330" stroke="${primary}" stroke-width="5" stroke-linecap="round"/>
      `;
      break;
    case 'demon':
      motifLayer = `
        <!-- Blood moon & breathing slash -->
        <circle cx="200" cy="210" r="115" fill="${primary}" opacity="0.85"/>
        <circle cx="200" cy="210" r="135" fill="none" stroke="${accent}" stroke-width="2" opacity="0.5"/>
        <!-- Traditional torii / fortress beams -->
        <rect x="55" y="130" width="18" height="390" fill="#0c0708" opacity="0.75"/>
        <rect x="327" y="130" width="18" height="390" fill="#0c0708" opacity="0.75"/>
        <!-- Swordsman silhouette -->
        <path d="M200,165 L255,250 L285,480 L115,480 L145,250 Z" fill="#0a080c"/>
        <!-- Fiery arc slash -->
        <path d="M45,355 Q195,120 355,295" fill="none" stroke="${accent}" stroke-width="12" stroke-linecap="round"/>
        <path d="M45,355 Q195,120 355,295" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
      `;
      break;
    default:
      motifLayer = `
        <!-- Celestial anime key visual composition -->
        <circle cx="${moonX}" cy="${moonY}" r="95" fill="${accent}" opacity="0.8"/>
        <g transform="rotate(${slashAngle} 200 280)">
          <rect x="-40" y="255" width="480" height="14" fill="${primary}" opacity="0.85"/>
          <rect x="-40" y="275" width="480" height="4" fill="#ffffff" opacity="0.9"/>
        </g>
        <!-- Heroic anime character silhouette -->
        <path d="M200,150 C225,150 242,175 242,202 L285,485 L115,485 L158,202 C158,175 175,150 200,150 Z" fill="#0c0e14" stroke="${primary}" stroke-width="2.5"/>
        <!-- Flowing cape/scarf -->
        <path d="M185,205 Q290,175 345,255 Q275,275 215,235 Z" fill="${primary}" opacity="0.9"/>
      `;
      break;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${bgDark}"/>
        <stop offset="50%" stop-color="${primary}" stop-opacity="0.55"/>
        <stop offset="100%" stop-color="#050507"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="42%" r="55%">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.55"/>
        <stop offset="60%" stop-color="${secondary}" stop-opacity="0.2"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000000" stop-opacity="0.15"/>
        <stop offset="55%" stop-color="#000000" stop-opacity="0.05"/>
        <stop offset="82%" stop-color="#060608" stop-opacity="0.82"/>
        <stop offset="100%" stop-color="#060608" stop-opacity="0.98"/>
      </linearGradient>
    </defs>
    <rect width="400" height="600" fill="url(#bg)"/>
    <rect width="400" height="600" fill="url(#glow)"/>
    <!-- Subtle anime speedlines / halftone grid -->
    <g stroke="#ffffff" stroke-opacity="0.05" stroke-width="1">
      <line x1="0" y1="90" x2="400" y2="90"/>
      <line x1="0" y1="180" x2="400" y2="180"/>
      <line x1="0" y1="270" x2="400" y2="270"/>
      <line x1="0" y1="360" x2="400" y2="360"/>
      <line x1="95" y1="0" x2="95" y2="600"/>
      <line x1="305" y1="0" x2="305" y2="600"/>
    </g>
    ${motifLayer}
    <!-- Japanese vertical typography watermark on side -->
    <text x="36" y="70" fill="#ffffff" fill-opacity="0.28" font-family="sans-serif" font-weight="800" font-size="22" writing-mode="tb">${nativeSafe}</text>
    <text x="366" y="42" text-anchor="end" fill="${accent}" fill-opacity="0.7" font-family="monospace" font-weight="700" font-size="11" letter-spacing="2">${studioSafe}</text>
    <!-- Glowing particles -->
    <circle cx="${70 + (seed % 90)}" cy="${130 + (seed % 70)}" r="3.5" fill="${accent}" opacity="0.85"/>
    <circle cx="${260 + (seed % 80)}" cy="${160 + (seed % 110)}" r="2.5" fill="#ffffff" opacity="0.75"/>
    <circle cx="${140 + (seed % 120)}" cy="${340 + (seed % 80)}" r="4" fill="${primary}" opacity="0.9"/>
    <rect width="400" height="600" fill="url(#fade)"/>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Generates a wide 16:9 cinematic hero backdrop illustration for featured anime & detail headers.
 */
export function getAnimeBannerUrl(anime: Pick<AnimeItem, 'id' | 'title' | 'nativeTitle' | 'palette' | 'artMotif'>): string {
  const { primary, secondary, accent, bgDark } = anime.palette;
  const nativeSafe = escapeXml(anime.nativeTitle || '');

  let rightScene = '';
  if (anime.artMotif === 'cyberpunk') {
    rightScene = `
      <!-- High-contrast Studio Trigger style Cyberpunk Edgerunners 2 orange/red cannon scene matching ani.pm screenshot -->
      <g transform="translate(880, 320)">
        <!-- Industrial Night City interior beams -->
        <rect x="-680" y="-320" width="900" height="640" fill="${primary}" opacity="0.18"/>
        <line x1="-550" y1="-320" x2="-350" y2="320" stroke="#000" stroke-width="18" opacity="0.45"/>
        <line x1="-180" y1="-320" x2="-180" y2="320" stroke="#000" stroke-width="22" opacity="0.45"/>
        <!-- Giant heavy cyber cannon extending left -->
        <polygon points="-780,60 40,-130 95,45 -720,210" fill="#220904" stroke="${primary}" stroke-width="4"/>
        <polygon points="-740,20 -30,-115 10,-20 -710,120" fill="${primary}" opacity="0.88"/>
        <polygon points="-520,-20 -60,-105 -30,-40 -490,45" fill="${accent}" opacity="0.92"/>
        <!-- Character silhouette on right -->
        <path d="M180,-190 C235,-190 270,-145 270,-85 L360,290 L40,290 L110,-85 C110,-145 135,-190 180,-190 Z" fill="#2a0804" stroke="${accent}" stroke-width="3.5"/>
        <!-- Round cybernetic glasses -->
        <circle cx="155" cy="-115" r="18" fill="#120402" stroke="${accent}" stroke-width="3"/>
        <circle cx="202" cy="-112" r="18" fill="#120402" stroke="${accent}" stroke-width="3"/>
        <!-- Lens flare burst -->
        <circle cx="-360" cy="-95" r="95" fill="#ffffff" opacity="0.75"/>
        <circle cx="-360" cy="-95" r="180" fill="${accent}" opacity="0.4"/>
      </g>
    `;
  } else if (anime.artMotif === 'cursed') {
    rightScene = `
      <!-- Jujutsu Kaisen Shibuya train / cursed energy scene matching ani.pm watch screenshot -->
      <g transform="translate(920, 310)">
        <circle cx="0" cy="-20" r="260" fill="${secondary}" opacity="0.22"/>
        <circle cx="0" cy="-20" r="190" fill="none" stroke="${secondary}" stroke-width="3" stroke-dasharray="18 10" opacity="0.65"/>
        <!-- Gojo / Itadori silhouette -->
        <path d="M-40,-210 C25,-210 65,-160 65,-90 L170,310 L-210,310 L-115,-90 C-115,-160 -85,-210 -40,-210 Z" fill="#0d1322" stroke="${secondary}" stroke-width="3"/>
        <!-- White spiky hair & blindfold -->
        <polygon points="-95,-190 -120,-255 -65,-225 -35,-275 0,-225 45,-250 25,-190" fill="#f1f5f9"/>
        <rect x="-85" y="-185" width="95" height="28" rx="6" fill="#090c15"/>
        <!-- Cursed Technique Reversal Red & Blue orbs -->
        <circle cx="-240" cy="-40" r="42" fill="${primary}" opacity="0.95"/>
        <circle cx="-240" cy="-40" r="75" fill="${primary}" opacity="0.35"/>
        <circle cx="195" cy="-60" r="42" fill="${secondary}" opacity="0.95"/>
        <circle cx="195" cy="-60" r="75" fill="${secondary}" opacity="0.35"/>
      </g>
    `;
  } else {
    rightScene = `
      <g transform="translate(940, 310)">
        <circle cx="0" cy="-30" r="230" fill="${accent}" opacity="0.28"/>
        <circle cx="0" cy="-30" r="160" fill="${primary}" opacity="0.45"/>
        <!-- Dramatic diagonal energy slashes -->
        <path d="M-420,180 Q-40,-180 360,-90" fill="none" stroke="${accent}" stroke-width="14" stroke-linecap="round"/>
        <path d="M-380,220 Q20,-120 390,-20" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
        <!-- Hero silhouette -->
        <path d="M0,-200 C55,-200 95,-145 95,-75 L195,310 L-195,310 L-95,-75 C-95,-145 -55,-200 0,-200 Z" fill="#0b0c12" stroke="${accent}" stroke-width="3"/>
      </g>
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 680" width="1440" height="680">
    <defs>
      <linearGradient id="hbg" x1="0" y1="0" x2="1" y2="0.6">
        <stop offset="0%" stop-color="${bgDark}"/>
        <stop offset="55%" stop-color="${primary}" stop-opacity="0.65"/>
        <stop offset="100%" stop-color="#08080a"/>
      </linearGradient>
      <radialGradient id="hglow" cx="65%" cy="42%" r="55%">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.62"/>
        <stop offset="45%" stop-color="${primary}" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="#08080a" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="hleft" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#08080a" stop-opacity="0.92"/>
        <stop offset="42%" stop-color="#08080a" stop-opacity="0.52"/>
        <stop offset="100%" stop-color="#08080a" stop-opacity="0.05"/>
      </linearGradient>
      <linearGradient id="hbottom" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#08080a" stop-opacity="0.35"/>
        <stop offset="25%" stop-color="#08080a" stop-opacity="0"/>
        <stop offset="78%" stop-color="#08080a" stop-opacity="0.72"/>
        <stop offset="100%" stop-color="#08080a" stop-opacity="1"/>
      </linearGradient>
    </defs>
    <rect width="1440" height="680" fill="url(#hbg)"/>
    <rect width="1440" height="680" fill="url(#hglow)"/>
    ${rightScene}
    <text x="1360" y="120" text-anchor="end" fill="#ffffff" fill-opacity="0.12" font-family="sans-serif" font-weight="900" font-size="68">${nativeSafe}</text>
    <rect width="1440" height="680" fill="url(#hleft)"/>
    <rect width="1440" height="680" fill="url(#hbottom)"/>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Generates an episode 16:9 thumbnail SVG data URL with distinct scene composition per episode number.
 */
export function getEpisodeThumbnailUrl(
  anime: Pick<AnimeItem, 'id' | 'title' | 'palette'>,
  episodeNumber: number,
  episodeTitle: string = ''
): string {
  const seed = hashCode(`${anime.id}-ep-${episodeNumber}-${episodeTitle}`);
  const { primary, secondary, accent, bgDark } = anime.palette;
  const cx = 120 + (seed % 180);
  const cy = 65 + (seed % 90);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="400" height="225">
    <defs>
      <linearGradient id="ebg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${bgDark}"/>
        <stop offset="60%" stop-color="${primary}" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="#09090d"/>
      </linearGradient>
      <radialGradient id="eglow" cx="55%" cy="45%" r="60%">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.65"/>
        <stop offset="60%" stop-color="${secondary}" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="400" height="225" fill="url(#ebg)"/>
    <rect width="400" height="225" fill="url(#eglow)"/>
    <!-- Action slash & anime character silhouette -->
    <circle cx="${cx}" cy="${cy}" r="52" fill="${accent}" opacity="0.45"/>
    <path d="M${150 + (seed % 60)},55 L${215 + (seed % 40)},120 L${235 + (seed % 30)},225 L${115 + (seed % 30)},225 Z" fill="#0d0f17" stroke="${accent}" stroke-width="2"/>
    <path d="M30,${170 - (seed % 50)} Q200,${45 + (seed % 60)} 370,${140 - (seed % 40)}" fill="none" stroke="${accent}" stroke-width="5" stroke-linecap="round" opacity="0.85"/>
    <rect width="400" height="225" fill="#000000" fill-opacity="0.22"/>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Generates an avatar SVG data URL for community / chat users.
 */
export function getUserAvatarUrl(username: string, colorHex = '#f59e0b'): string {
  const initial = escapeXml((username.replace(/[^a-zA-Z0-9]/g, '')[0] || 'A').toUpperCase());
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80">
    <defs>
      <linearGradient id="av" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${colorHex}"/>
        <stop offset="100%" stop-color="#18181b"/>
      </linearGradient>
    </defs>
    <rect width="80" height="80" rx="40" fill="url(#av)"/>
    <circle cx="40" cy="32" r="14" fill="#ffffff" fill-opacity="0.18"/>
    <path d="M16,72 C16,54 64,54 64,72" fill="#ffffff" fill-opacity="0.18"/>
    <text x="40" y="48" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-weight="800" font-size="28">${initial}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
