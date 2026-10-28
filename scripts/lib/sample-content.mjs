/**
 * The sample content: one Site Settings entry, one Home Page, six Destinations
 * and two Regions.
 *
 * Wayfarer is a made-up travel company. Photo names are keys in artwork.mjs
 * PHOTOS; the seed script swaps each for the uploaded asset.
 *
 * Some details are there because the sessions need them:
 *   Session 2   Asia and Europe have no page until a Region template exists:
 *               a new page type, with no code change.
 *   Session 3   every trip has similar trips (a Repeater over references), and
 *               the itineraries mix their three block types differently (a
 *               Repeater over modular blocks, one Condition per block type).
 *   Session 4   three trips in Europe, all under $3,000 (the pinned query).
 */

export const SITE_SETTINGS = {
  title: 'Site Settings',
  site_name: 'Wayfarer',
  nav_links: [
    { label: 'All trips', url: '/' },
    { label: 'Kyoto', url: '/destinations/kyoto' },
    { label: 'Hoi An', url: '/destinations/hoi-an' },
    { label: 'Dolomites', url: '/destinations/dolomites' },
  ],
  footer_text:
    'Wayfarer is a made-up travel company: demo content for the Contentstack Studio hands-on.',
};

export const HOME = {
  title: 'Home',
  url: '/',
  hero: {
    eyebrow: 'Booking now for 2027',
    headline: 'Go somewhere and stay a while.',
    subheadline:
      'We run small-group trips to a handful of places we know well. Twelve travellers at most, the same local guide all week, and afternoons left free.',
    photo: 'hero',
    cta_label: 'See the trips',
    cta_url: '/destinations/kyoto',
  },
};

const day = (label, title, text) => ({ day: { label, title, text } });
const quote = (text, name) => ({ quote: { quote: text, name } });
const photo = (key, caption) => ({ photo: { photo: key, caption } });

export const DESTINATIONS = [
  {
    title: 'Kyoto',
    region: 'Asia',
    tagline:
      'A week in the old wooden quarter of Higashiyama, out on foot before the tour buses arrive.',
    photo: 'kyoto',
    duration: '8 days',
    price: 'From $3,250',
    price_from: 3250,
    on_sale: false,
    spots_left: 6,
    gallery: ['kyoto-bamboo', 'kyoto-path', 'kyoto-torii'],
    related: ['Hoi An', 'Porto'],
    itinerary: [
      day(
        'Days 1–3',
        'Higashiyama on foot',
        'We stay in a family-run ryokan and walk the lantern-lit lanes of Gion before the day-trippers arrive.',
      ),
      quote('The tea ceremony was the quietest hour of my year.', 'Mei, travelled in April'),
      day(
        'Day 4',
        'Tea with a fourth-generation host',
        'A morning in a tea house that has been in the same family since 1890.',
      ),
      photo('kyoto-torii', 'The torii gates at Fushimi Inari, before 7am.'),
      day(
        'Days 5–8',
        'Arashiyama and the north',
        'The bamboo groves at first light, then two slow days in the hills above the city.',
      ),
    ],
  },
  {
    title: 'Porto',
    region: 'Europe',
    tagline:
      'A long weekend in the riverside Ribeira district, with a day upriver in the vineyards.',
    photo: 'porto',
    duration: '5 days',
    price: 'From $1,480',
    price_from: 1480,
    on_sale: true,
    spots_left: 9,
    gallery: ['porto-bridge', 'porto-city', 'porto-night'],
    related: ['Dolomites', 'Kyoto'],
    itinerary: [
      day(
        'Days 1–2',
        'Ribeira and the bridge',
        'A guesthouse a short walk from the Dom Luís I bridge, and an evening crossing it on foot.',
      ),
      day(
        'Day 3',
        'Into the Douro valley',
        'A rabelo boat upriver to the terraced vineyards, lunch at a family quinta.',
      ),
      photo('porto-night', 'The bridge from the Gaia side, after dinner.'),
      quote('Five days felt like two weeks, in the best way.', 'Tomás, travelled in September'),
    ],
  },
  {
    title: 'Palawan',
    region: 'Asia',
    tagline:
      'Ten days by outrigger boat from El Nido to Coron, with two nights camping on an island.',
    photo: 'palawan',
    duration: '10 days',
    price: 'From $2,690',
    price_from: 2690,
    on_sale: false,
    spots_left: 3,
    gallery: ['palawan-islands', 'palawan-cove', 'palawan-boat'],
    related: ['Hoi An'],
    itinerary: [
      day(
        'Days 1–4',
        'El Nido by boat',
        'Lagoons you can only reach at high tide, and a different beach for lunch every day.',
      ),
      photo('palawan-cove', 'Our second camp, on an island with no road.'),
      day(
        'Days 5–10',
        'On to Coron',
        'Two nights camping, then the wrecks of Coron Bay with snorkel gear and a local captain.',
      ),
      quote('I still dream about that cove.', 'Priya, travelled in February'),
    ],
  },
  {
    title: 'Iceland',
    region: 'Europe',
    tagline: 'A week on the south coast in small 4x4s, from Seljalandsfoss to the glacier lagoon.',
    photo: 'iceland',
    duration: '7 days',
    price: 'From $2,980',
    price_from: 2980,
    on_sale: false,
    spots_left: 8,
    gallery: ['iceland-diamond', 'iceland-lagoon', 'iceland-glacier'],
    related: ['Dolomites', 'Porto'],
    itinerary: [
      day(
        'Days 1–3',
        'Waterfalls of the south coast',
        'Seljalandsfoss and Skógafoss, then a guided walk on the Sólheimajökull glacier.',
      ),
      day(
        'Days 4–7',
        'To the glacier lagoon',
        'Icebergs drifting out to sea at Jökulsárlón, and an evening soak in a geothermal pool.',
      ),
      quote('We saw the northern lights from the hot pool.', 'Anna, travelled in March'),
    ],
  },
  {
    title: 'Hoi An',
    region: 'Asia',
    tagline: 'Six days in the lantern-lit old town, with a day by bicycle through the rice fields.',
    photo: 'hoi-an',
    duration: '6 days',
    price: 'From $1,890',
    price_from: 1890,
    on_sale: true,
    spots_left: 4,
    gallery: ['hoi-an-lanterns', 'hoi-an-shop', 'hoi-an-trees'],
    related: ['Kyoto', 'Palawan'],
    itinerary: [
      day(
        'Days 1–3',
        'The old town',
        'Tailors, markets and the full-moon lantern festival, from a guesthouse on the river.',
      ),
      photo('hoi-an-shop', 'Choosing a lantern to take home.'),
      day(
        'Days 4–6',
        'Rice fields and the coast',
        'A day by bicycle through the paddies to Tra Que, then a cooking class and a free day at the beach.',
      ),
    ],
  },
  {
    title: 'Dolomites',
    region: 'Europe',
    tagline: 'A week of hut-to-hut walking in South Tyrol, with luggage sent on ahead every day.',
    photo: 'dolomites',
    duration: '7 days',
    price: 'From $2,450',
    price_from: 2450,
    on_sale: false,
    spots_left: 10,
    gallery: ['dolomites-braies', 'dolomites-dock', 'dolomites-flowers'],
    related: ['Iceland', 'Porto'],
    itinerary: [
      day(
        'Days 1–2',
        'Seceda and the Val Gardena',
        'A cable car up from Ortisei and a first walk along the ridge.',
      ),
      quote('Every hut had better cake than the last.', 'Lukas, travelled in July'),
      day(
        'Days 3–7',
        'Hut to hut',
        'Four nights in mountain huts, ending with a swim in Lago di Braies.',
      ),
      photo('dolomites-braies', 'Lago di Braies on the last morning.'),
    ],
  },
];

/** Region pages: /regions/asia and /regions/europe, each listing its trips. */
export const REGIONS = [
  {
    title: 'Asia',
    url: '/regions/asia',
    tagline:
      'Three slow trips in Japan, Vietnam and the Philippines: old towns, tea houses and islands you can only reach by boat.',
    photo: 'palawan-islands',
    duration: '6 to 10 days',
    price: 'From $1,890',
    trips: ['Kyoto', 'Hoi An', 'Palawan'],
  },
  {
    title: 'Europe',
    url: '/regions/europe',
    tagline:
      'Three trips you can do in a week: a river city, a ridge of mountain huts and a coast of glaciers.',
    photo: 'dolomites-braies',
    duration: '5 to 7 days',
    price: 'From $1,480',
    trips: ['Porto', 'Dolomites', 'Iceland'],
  },
];
