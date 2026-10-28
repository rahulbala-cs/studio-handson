/**
 * Brand mark + sample photography.
 *
 * Photos are fetched from Unsplash at seed time and uploaded into the stack, so
 * the site never renders from a third-party CDN. Unsplash photos are free for
 * commercial use (https://unsplash.com/license); each asset's description
 * records its source. Replace them before production.
 */
export const PALETTE = {
  ink: '#1D2B2A',
  paper: '#FBF8F3',
  sand: '#F1ECE3',
  accent: '#C2562E',
  teal: '#1F5C5A',
};

/** A compass mark. The site name is a separate field, so it stays editable. */
export const logo =
  () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="Wayfarer">
  <circle cx="32" cy="32" r="30" fill="${PALETTE.teal}"/>
  <circle cx="32" cy="32" r="22" fill="none" stroke="${PALETTE.paper}" stroke-width="2" opacity="0.5"/>
  <path d="M32 10 L38 32 L32 54 L26 32 Z" fill="${PALETTE.paper}"/>
  <path d="M32 10 L38 32 L26 32 Z" fill="${PALETTE.accent}"/>
  <circle cx="32" cy="32" r="3" fill="${PALETTE.teal}"/>
</svg>`;

/**
 * Sample photography: a destination's main photo, a gallery or itinerary
 * photo, or a region's photo (the two regions reuse gallery photos). `alt`
 * doubles as the asset's title in the stack, which is what the Carousel uses
 * as alt text.
 */
export const PHOTOS = {
  hero: {
    id: '1469854523086-cc02fe5d8800',
    alt: 'A yellow camper van on an open road toward red sandstone cliffs',
    ar: '4:3',
  },

  kyoto: {
    id: '1493976040374-85c8e12f0c0e',
    alt: 'Two people in kimono walking up a lantern-lit lane toward a pagoda at dusk',
  },
  'kyoto-bamboo': {
    id: '1540999758994-161f2ee6e1c8',
    alt: 'Tall bamboo stems in the Arashiyama grove, Kyoto',
  },
  'kyoto-path': {
    id: '1511364033374-07ffa0c99c4c',
    alt: 'An empty path between walls of bamboo, early morning',
  },
  'kyoto-torii': {
    id: '1764418365982-742441557a6c',
    alt: 'Rows of vermilion torii gates at Fushimi Inari, Kyoto',
  },

  porto: {
    id: '1555881400-74d7acaacd8b',
    alt: 'Colourful riverside houses and moored wooden boats along the Douro in Porto',
  },
  'porto-bridge': {
    id: '1765918232627-36f14c234775',
    alt: 'The Dom Luís I bridge over the Douro river, Porto',
  },
  'porto-city': {
    id: '1631910801074-dfd9d95b8b7f',
    alt: 'The iron bridge and the old town of Porto across the river',
  },
  'porto-night': { id: '1569959220744-ff553533f492', alt: 'The Dom Luís I bridge lit up at night' },

  palawan: {
    id: '1531761535209-180857e963b9',
    alt: 'Aerial view of a turquoise bay ringed by limestone cliffs in El Nido',
  },
  'palawan-islands': {
    id: '1744069729320-3c5fb7120089',
    alt: 'Green limestone islands rising out of a calm blue sea off El Nido',
  },
  'palawan-cove': {
    id: '1771533680002-5210c217a16f',
    alt: 'A small cove with limestone cliffs and turquoise water',
  },
  'palawan-boat': {
    id: '1519485837477-db36b0c4ad7a',
    alt: 'A boat crossing a lagoon between tree-covered rocks, from above',
  },

  iceland: {
    id: '1476610182048-b716b8518aae',
    alt: 'A waterfall plunging over a green cliff into a pool at sunset',
  },
  'iceland-diamond': {
    id: '1456440286046-98764af9fd1b',
    alt: 'Blocks of glacier ice on the black sand of Diamond Beach',
  },
  'iceland-lagoon': {
    id: '1567365356019-e942c0b50721',
    alt: 'Icebergs drifting in the Jökulsárlón glacier lagoon',
  },
  'iceland-glacier': {
    id: '1537255439072-8b7f411e6212',
    alt: 'A glacier tongue spilling down between dark hills',
  },

  'hoi-an': {
    id: '1741274236412-b6760ff6c01b',
    alt: 'A bridge hung with lanterns over the river in Hoi An at night',
  },
  'hoi-an-lanterns': {
    id: '1596401057633-54a8fe8ef647',
    alt: 'White and red paper lanterns hanging over a street in Hoi An',
  },
  'hoi-an-shop': {
    id: '1722398169770-218cd336f174',
    alt: 'A lantern shop with hundreds of coloured lanterns',
  },
  'hoi-an-trees': {
    id: '1506430806163-511b73d549b8',
    alt: 'Red paper lanterns hanging in green trees',
  },

  dolomites: {
    id: '1615729947596-a598e5de0ab3',
    alt: 'The Seceda ridge above Ortisei, with wildflowers in the foreground',
  },
  'dolomites-braies': {
    id: '1678052812569-7fea895cac74',
    alt: 'Lago di Braies, a turquoise lake below grey limestone walls',
  },
  'dolomites-dock': {
    id: '1741893041975-94a0e8656209',
    alt: 'A wooden dock on a still mountain lake in the Dolomites',
  },
  'dolomites-flowers': {
    id: '1634304233286-8c7956a85b29',
    alt: 'Jagged peaks behind a meadow of purple flowers',
  },
};

const UNSPLASH = (id, w, ar) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=80&fm=jpg&fit=crop&ar=${ar}`;

export const photoSource = (id) => `Unsplash, https://images.unsplash.com/photo-${id}`;

/** Download one photo as a JPEG buffer. Fails loudly rather than seeding a gap. */
export async function fetchPhoto(id, { width = 1600, ar = '3:2' } = {}) {
  const res = await fetch(UNSPLASH(id, width, ar), { redirect: 'follow' });
  if (!res.ok) throw new Error(`photo ${id} -> HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 10_000 || buf[0] !== 0xff || buf[1] !== 0xd8) {
    throw new Error(`photo ${id} did not come back as a JPEG (${buf.length} bytes)`);
  }
  return buf;
}
