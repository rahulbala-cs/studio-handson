/**
 * The end of Session 1: the Destination template from the compound components,
 * and a first Section that binds itself when it's dropped on the template.
 *
 *   Trip Gallery           Section, linked to Destination: the Carousel bound
 *                          to `gallery`, so dropping it needs no mapping
 *
 *   Destination template   connected to Destination, one page per entry
 *     Header               compound, reads Site Settings through `site_settings`
 *     Hero                 compound, bound to the entry
 *     Trip Gallery         the Section
 *     Destination Cards    compound, Destinations bound to `related_trips`
 *     Footer               compound, reads Site Settings through `site_settings`
 */
import { nid } from '../composition.mjs';
import {
  C,
  WHOLE,
  lit,
  bound,
  node,
  page,
  StaticValues,
  sectionEntry,
  templateEntry,
  place,
} from './common.mjs';

/** The one Site Settings entry, through the page entry's reference. */
const SITE = 'site_settings.0';
export const DESTINATION_SCHEMA = WHOLE('destination', 'Destination');

/** The Header compound. Every page type has the same `site_settings` reference. */
export const header = (sv, P) =>
  node(C.header, nid(P, 'header'), {
    title: 'Header',
    props: {
      logo: bound('imageurl', `${SITE}.logo.url`),
      siteName: bound('string', `${SITE}.site_name`),
      links: bound('array', `${SITE}.nav_links`),
    },
  });

export const footer = (sv, P) =>
  node(C.footer, nid(P, 'footer'), {
    title: 'Footer',
    props: {
      siteName: bound('string', `${SITE}.site_name`),
      text: bound('string', `${SITE}.footer_text`),
      links: bound('array', `${SITE}.nav_links`),
    },
  });

/** The compound Hero, bound to a destination entry. Session 2 swaps it for a Section. */
export const compoundHero = (sv, P) =>
  node(C.hero, nid(P, 'hero'), {
    title: 'Hero',
    props: {
      eyebrow: bound('string', 'duration'),
      title: bound('string', 'title'),
      text: bound('string', 'tagline'),
      image: bound('imageurl', 'image.url'),
      imageAlt: bound('string', 'image_alt'),
      ctaLabel: lit(sv, nid(P, 'hero'), 'ctaLabel', 'string', 'Enquire about this trip'),
      ctaUrl: lit(sv, nid(P, 'hero'), 'ctaUrl', 'href', 'mailto:hello@wayfarer.example'),
    },
  });

/** Session 1's Section: the Carousel, bound once to the trip's gallery. */
export function tripGallery() {
  const sv = new StaticValues();
  const P = 'trip_gallery';
  const tree = page(nid(P, 'page'), [
    node(C.carousel, nid(P, 'carousel'), {
      title: 'Carousel',
      props: {
        title: lit(sv, nid(P, 'carousel'), 'title', 'string', 'In pictures'),
        images: bound('array', 'gallery'),
      },
    }),
  ]);
  return sectionEntry('Trip Gallery', sv, tree, { linkedSchemas: [DESTINATION_SCHEMA] });
}

const placeTripGallery = (s) => (sv, P) =>
  place(s.trip_gallery.uid, nid(P, 'gallery-section'), {
    title: 'Trip Gallery',
    matchedCt: 'destination',
  });

/** The compound Destination Cards over one reference field. Session 3 swaps it for a Repeater. */
export const destinationCards =
  (field, { title, intro = '' }) =>
  (sv, P) =>
    node(C.destinationCards, nid(P, 'cards'), {
      title: 'Destination Cards',
      props: {
        title: lit(sv, nid(P, 'cards'), 'title', 'string', title),
        intro: lit(sv, nid(P, 'cards'), 'intro', 'string', intro),
        destinations: bound('array', field),
        buttonLabel: lit(sv, nid(P, 'cards'), 'buttonLabel', 'string', 'View trip'),
      },
    });

export const similarTripsCompound = destinationCards('related_trips', {
  title: 'Similar trips',
  intro: 'If this one appeals, you might like these too.',
});

export const featuredCompound = destinationCards('featured_destinations', {
  title: 'Where we go',
  intro: 'Six places we know well, each with a guide who lives there.',
});

export function destinationTemplate(s, { hero, cards, extra = [] } = {}) {
  const sv = new StaticValues();
  const P = 'destination';
  const tree = page(nid(P, 'page'), [
    header(sv, P),
    hero ? hero(sv, P) : compoundHero(sv, P),
    placeTripGallery(s)(sv, P),
    ...extra.map((build) => build(sv, P)),
    (cards ?? similarTripsCompound)(sv, P),
    footer(sv, P),
  ]);
  return templateEntry('Destination', {
    contentType: 'destination',
    // Studio builds this from the content type's URL prefix + the entry's URL field.
    url: '/destinations/{{entry.url}}',
    references: ['site_settings', 'related_trips'],
    sv,
    tree,
  });
}

/** The Hero compound, bound to Home Page's `hero` group. */
const homeHero = (sv, P) =>
  node(C.hero, nid(P, 'hero'), {
    title: 'Hero',
    props: {
      eyebrow: bound('string', 'hero.eyebrow'),
      title: bound('string', 'hero.headline'),
      text: bound('string', 'hero.subheadline'),
      image: bound('imageurl', 'hero.image.url'),
      imageAlt: bound('string', 'hero.image_alt'),
      ctaLabel: bound('string', 'hero.cta_label'),
      ctaUrl: bound('href', 'hero.cta_url'),
    },
  });

export function homeTemplate(s, { cards } = {}) {
  const sv = new StaticValues();
  const P = 'home';
  const tree = page(nid(P, 'page'), [
    header(sv, P),
    homeHero(sv, P),
    (cards ?? featuredCompound)(sv, P),
    footer(sv, P),
  ]);
  return templateEntry('Home', {
    contentType: 'home_page',
    // Home Page has no URL pattern: the builder types "/".
    url: '/',
    references: ['site_settings', 'featured_destinations'],
    sv,
    tree,
  });
}

/** Session 1's whole result: one Section, one template. */
export const stage1 = [
  { key: 'trip_gallery', build: () => tripGallery() },
  { key: 'destination', build: (s) => destinationTemplate(s) },
];
