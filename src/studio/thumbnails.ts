/**
 * Thumbnails for the Components panel: a small wireframe of each component.
 *
 * Studio shows these in its own window, not on this site, so a path like
 * `/thumbs/hero.svg` would not resolve. Each one is an inline SVG data URI.
 */

const INK = '#1d2b2a';
const SOFT = '#4d5a58';
const PAPER = '#fbf8f3';
const SAND = '#f1ece3';
const TEAL = '#1f5c5a';
const ACCENT = '#c2562e';
const LINE = '#e3ddd2';
const WHITE = '#ffffff';

function thumb(body: string, background = PAPER) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200"><rect width="320" height="200" fill="${background}"/>${body}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const bar = (x: number, y: number, w: number, h: number, fill: string, r = h / 2) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"/>`;

// A photo placeholder: sky, sun and two hills.
const photo = (x: number, y: number, w: number, h: number) =>
  `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 100 70" preserveAspectRatio="xMidYMid slice">` +
  `<rect width="100" height="70" rx="4" fill="${TEAL}"/>` +
  `<circle cx="74" cy="20" r="8" fill="${SAND}"/>` +
  `<path d="M0 70 L30 36 L52 56 L70 42 L100 70 Z" fill="#164341"/>` +
  `</svg>`;

const dashed = (x: number, y: number, w: number, h: number) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${WHITE}" stroke="${TEAL}" stroke-width="2" stroke-dasharray="6 5"/>`;

export const THUMBNAILS = {
  Header: thumb(
    `<rect y="64" width="320" height="72" fill="${WHITE}"/>` +
      `<line x1="0" y1="136" x2="320" y2="136" stroke="${LINE}" stroke-width="2"/>` +
      `<circle cx="40" cy="100" r="13" fill="${ACCENT}"/>` +
      bar(62, 93, 70, 14, INK) +
      bar(182, 95, 34, 10, SOFT) +
      bar(226, 95, 34, 10, SOFT) +
      bar(270, 95, 30, 10, SOFT),
  ),

  Hero: thumb(
    bar(24, 44, 54, 8, ACCENT) +
      bar(24, 62, 130, 16, INK, 4) +
      bar(24, 84, 104, 16, INK, 4) +
      bar(24, 112, 128, 7, SOFT) +
      bar(24, 124, 112, 7, SOFT) +
      bar(24, 144, 70, 22, ACCENT, 4) +
      photo(172, 30, 126, 140),
    SAND,
  ),

  Carousel: thumb(
    bar(24, 28, 110, 14, INK, 4) +
      photo(24, 58, 120, 100) +
      photo(156, 58, 120, 100) +
      photo(288, 58, 120, 100) +
      `<circle cx="146" cy="176" r="4" fill="${INK}"/>` +
      `<circle cx="160" cy="176" r="4" fill="${LINE}"/>` +
      `<circle cx="174" cy="176" r="4" fill="${LINE}"/>`,
  ),

  DestinationCards: thumb(
    bar(24, 20, 120, 14, INK, 4) +
      bar(24, 42, 180, 7, SOFT) +
      [24, 116, 208]
        .map(
          (x) =>
            `<rect x="${x}" y="62" width="88" height="122" rx="6" fill="${WHITE}" stroke="${LINE}" stroke-width="2"/>` +
            photo(x + 6, 68, 76, 52) +
            bar(x + 8, 130, 56, 9, INK) +
            bar(x + 8, 145, 70, 6, SOFT) +
            bar(x + 8, 166, 34, 9, ACCENT),
        )
        .join(''),
  ),

  Footer: thumb(
    `<rect y="70" width="320" height="130" fill="${TEAL}"/>` +
      bar(28, 100, 84, 14, WHITE) +
      bar(28, 124, 140, 7, SAND) +
      bar(28, 137, 118, 7, SAND) +
      bar(200, 104, 40, 9, SAND) +
      bar(250, 104, 44, 9, SAND),
  ),

  Heading: thumb(
    `<text x="28" y="112" font-family="Georgia, serif" font-size="64" font-weight="700" fill="${INK}">Aa</text>` +
      bar(140, 70, 154, 18, INK, 4) +
      bar(140, 98, 112, 18, INK, 4) +
      bar(140, 134, 70, 7, LINE),
  ),

  Text: thumb(
    bar(36, 52, 248, 8, SOFT) +
      bar(36, 72, 236, 8, SOFT) +
      bar(36, 92, 248, 8, SOFT) +
      bar(36, 112, 220, 8, SOFT) +
      bar(36, 132, 150, 8, SOFT),
  ),

  Image: thumb(photo(48, 30, 224, 140)),

  Badge: thumb(
    bar(70, 66, 120, 30, ACCENT) +
      bar(90, 77, 80, 8, WHITE) +
      bar(130, 108, 120, 30, SAND) +
      bar(150, 119, 80, 8, INK),
  ),

  Button: thumb(
    bar(80, 58, 160, 38, TEAL, 6) +
      bar(118, 73, 84, 9, WHITE) +
      `<rect x="80" y="110" width="160" height="38" rx="6" fill="${WHITE}" stroke="${TEAL}" stroke-width="2"/>` +
      bar(118, 125, 84, 9, TEAL),
  ),

  Container: thumb(
    `<rect y="24" width="320" height="152" fill="${SAND}"/>` +
      `<line x1="64" y1="24" x2="64" y2="176" stroke="${LINE}" stroke-width="2" stroke-dasharray="4 4"/>` +
      `<line x1="256" y1="24" x2="256" y2="176" stroke="${LINE}" stroke-width="2" stroke-dasharray="4 4"/>` +
      dashed(76, 48, 168, 104) +
      `<path d="M160 82 v36 M142 100 h36" stroke="${TEAL}" stroke-width="4" stroke-linecap="round"/>`,
  ),

  Stack: thumb(
    dashed(28, 60, 76, 80) +
      dashed(122, 60, 76, 80) +
      dashed(216, 60, 76, 80) +
      bar(56, 96, 20, 8, TEAL) +
      bar(150, 96, 20, 8, TEAL) +
      bar(244, 96, 20, 8, TEAL),
  ),
} as const;
