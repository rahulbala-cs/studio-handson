/**
 * The end of Session 2: a new component built in Studio from atoms and layouts,
 * reused on a new page type, plus breakpoints.
 *
 *   Page Hero     Section built from atoms, linked to Destination AND Region.
 *                 Unlike the compound it replaces: photo on the LEFT, a price
 *                 line, and on Mobile one column (a design prop, set per
 *                 breakpoint). Region has the same six fields it binds (title,
 *                 tagline, image, image_alt, duration, price), so it binds
 *                 itself there too.
 *   Destination   the Page Hero Section instead of the Hero compound
 *   Region        new: connected to Region, URL from the content type
 *                 (/regions/{{entry.url}}). Header, Page Hero, Destination
 *                 Cards over the region's `trips`, Footer. No code change.
 *   Home          new: connected to Home Page, one entry at "/". Header, the Hero
 *                 compound bound to the `hero` group, Destination Cards, Footer
 */
import { nid } from '../composition.mjs';
import {
  WHOLE,
  bound,
  page,
  StaticValues,
  sectionEntry,
  templateEntry,
  place,
  container,
  stack,
  heading,
  textAtom,
  image,
  badge,
} from './common.mjs';
import {
  DESTINATION_SCHEMA,
  destinationTemplate,
  homeTemplate,
  tripGallery,
  header,
  footer,
  destinationCards,
} from './s1.mjs';

export const REGION_SCHEMA = WHOLE('region', 'Region');

export function pageHero() {
  const sv = new StaticValues();
  const P = 'page_hero';
  const id = (k) => nid(P, k);
  const tree = page(id('page'), [
    container(sv, id('band'), 'Hero band', { tone: 'sand' }, [
      stack(
        sv,
        id('layout'),
        'Hero layout',
        {
          direction: 'split',
          gap: 'large',
          align: 'center',
          // Photo first, so the photo column is the wider one; one column on a phone.
          columns: { default: 'minmax(0, 6fr) minmax(0, 5fr)', mobile: 'minmax(0, 1fr)' },
        },
        [
          image(
            sv,
            id('photo'),
            'Photo',
            bound('imageurl', 'image.url'),
            bound('string', 'image_alt'),
            'landscape',
          ),
          stack(sv, id('copy'), 'Hero copy', { gap: 'medium' }, [
            badge(sv, id('duration'), 'Duration', bound('string', 'duration')),
            heading(sv, id('title'), 'Title', bound('string', 'title'), 'h1'),
            textAtom(sv, id('tagline'), 'Tagline', bound('string', 'tagline'), 'lead'),
            textAtom(sv, id('price'), 'Price', bound('string', 'price'), 'strong'),
          ]),
        ],
      ),
    ]),
  ]);
  // Two schemas of the same kind (whole content types). The fields it binds
  // have the same uids on both, so the bindings work on either template. A
  // field missing on one would show the atom's registered default instead.
  return sectionEntry('Page Hero', sv, tree, {
    linkedSchemas: [DESTINATION_SCHEMA, REGION_SCHEMA],
  });
}

export const placePageHero = (s, matchedCt) => (sv, P) =>
  place(s.page_hero.uid, nid(P, 'hero-section'), { title: 'Page Hero', matchedCt });

export const regionTrips = destinationCards('trips', { title: 'The trips' });

export function regionTemplate(s, { cards } = {}) {
  const sv = new StaticValues();
  const P = 'region';
  const tree = page(nid(P, 'page'), [
    header(sv, P),
    placePageHero(s, 'region')(sv, P),
    (cards ?? regionTrips)(sv, P),
    footer(sv, P),
  ]);
  return templateEntry('Region', {
    contentType: 'region',
    // From the Region content type's URL prefix + the entry's URL field.
    url: '/regions/{{entry.url}}',
    references: ['site_settings', 'trips'],
    sv,
    tree,
  });
}

export const stage2 = [
  { key: 'trip_gallery', build: () => tripGallery() },
  { key: 'page_hero', build: () => pageHero() },
  {
    key: 'destination',
    build: (s) => destinationTemplate(s, { hero: placePageHero(s, 'destination') }),
  },
  { key: 'home', build: (s) => homeTemplate(s) },
  { key: 'region', build: (s) => regionTemplate(s) },
];
