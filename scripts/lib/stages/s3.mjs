/**
 * The end of Session 3: Repeaters and Conditions, over references and modular
 * blocks. No code changes in this session.
 *
 *   Trip Card     Section from atoms, linked to Destination: one trip's card.
 *   Trip lists    on each TEMPLATE, a Repeater over a reference field with one
 *                 Condition Block (content type: Destination) holding the Trip
 *                 Card, which reads each item. The same card on three templates:
 *                   Destination   Similar trips   related_trips
 *                   Home          Where we go     featured_destinations
 *                   Region        The trips       trips
 *                 Each replaces that template's Destination Cards compound.
 *   Itinerary     Section. A Repeater over the `itinerary` modular blocks, one
 *                 Condition Block per block type: day, quote, photo.
 *   Destination   Header, Page Hero, Carousel, Itinerary, Similar trips, Footer
 *
 * The session also adds a fourth block type (a Tip) to the content type and one
 * more Condition for it. That is the attendee's own change to their content
 * model, so catch-up leaves it out.
 */
import { nid } from '../composition.mjs';
import {
  lit,
  bound,
  rep,
  page,
  StaticValues,
  sectionEntry,
  place,
  container,
  stack,
  heading,
  textAtom,
  image,
  badge,
  button,
  repeater,
  conditionBlock,
  when,
} from './common.mjs';
import { destinationTemplate, homeTemplate, tripGallery, DESTINATION_SCHEMA } from './s1.mjs';
import { pageHero, placePageHero, regionTemplate } from './s2.mjs';

export function tripCard() {
  const sv = new StaticValues();
  const P = 'trip_card';
  const id = (k) => nid(P, k);
  const tree = page(id('page'), [
    stack(sv, id('card'), 'Card', { surface: 'card', align: 'stretch' }, [
      image(
        sv,
        id('photo'),
        'Photo',
        bound('imageurl', 'image.url'),
        bound('string', 'image_alt'),
        'landscape',
      ),
      stack(sv, id('details'), 'Details', { gap: 'small' }, [
        badge(sv, id('duration'), 'Duration', bound('string', 'duration')),
        heading(sv, id('title'), 'Title', bound('string', 'title'), 'h3'),
        textAtom(sv, id('tagline'), 'Tagline', bound('string', 'tagline')),
        stack(sv, id('price-row'), 'Price row', { direction: 'horizontal', align: 'between' }, [
          textAtom(sv, id('price'), 'Price', bound('string', 'price'), 'strong'),
          button(
            sv,
            id('link'),
            'Link',
            lit(sv, id('link'), 'label', 'string', 'View trip'),
            bound('href', 'url'),
            'link',
          ),
        ]),
      ]),
    ]),
  ]);
  return sectionEntry('Trip Card', sv, tree, { linkedSchemas: [DESTINATION_SCHEMA] });
}

/**
 * A list of trips, built on the TEMPLATE (not as a Section): a Section placed
 * in a Repeater reads each item only when the Repeater is on a Template.
 */
export const tripList = (field, label) => (s) => (sv, P) => {
  const id = (k) => nid(P, 'trips', k);
  const rid = id('repeater');
  return container(sv, id('band'), `${label} band`, {}, [
    stack(sv, id('layout'), 'Layout', { gap: 'large' }, [
      heading(sv, id('heading'), 'Heading', lit(sv, id('heading'), 'text', 'string', label), 'h2'),
      stack(sv, id('grid'), 'Cards', { direction: 'grid', gap: 'large' }, [
        repeater(
          rid,
          `Each trip in ${field}`,
          bound('array', field).binding,
          [
            conditionBlock(
              id('if-destination'),
              'If it is a destination',
              when.contentTypeIs(rid, 'destination'),
              [
                place(s.trip_card.uid, id('card'), {
                  title: 'Trip Card',
                  rootBinding: rep(rid, ''),
                }),
              ],
            ),
          ],
          'reference',
        ),
      ]),
    ]),
  ]);
};

export function itinerary() {
  const sv = new StaticValues();
  const P = 'itinerary';
  const id = (k) => nid(P, k);
  const rid = id('repeater');
  const item = (path) => ({ type: 'string', binding: rep(rid, path) });
  const tree = page(id('page'), [
    container(sv, id('band'), 'Itinerary band', { width: 'normal' }, [
      stack(sv, id('layout'), 'Layout', { gap: 'large' }, [
        heading(
          sv,
          id('heading'),
          'Heading',
          lit(sv, id('heading'), 'text', 'string', 'The trip, day by day'),
          'h2',
        ),
        repeater(
          rid,
          'Each block',
          bound('array', 'itinerary').binding,
          [
            conditionBlock(id('if-day'), 'Day', when.blockIs(rid, 'day'), [
              stack(sv, id('day'), 'Day', { gap: 'small' }, [
                badge(sv, id('day-label'), 'Label', item('label')),
                heading(sv, id('day-title'), 'Title', item('title'), 'h3'),
                textAtom(sv, id('day-text'), 'Text', item('text')),
              ]),
            ]),
            conditionBlock(id('if-quote'), 'Quote', when.blockIs(rid, 'quote'), [
              stack(sv, id('quote'), 'Quote', { gap: 'small' }, [
                textAtom(sv, id('quote-text'), 'Quote', item('quote'), 'lead'),
                textAtom(sv, id('quote-name'), 'Name', item('name'), 'small'),
              ]),
            ]),
            conditionBlock(id('if-photo'), 'Photo', when.blockIs(rid, 'photo'), [
              stack(sv, id('photo'), 'Photo', { gap: 'small' }, [
                image(
                  sv,
                  id('photo-img'),
                  'Image',
                  { type: 'imageurl', binding: rep(rid, 'image.url') },
                  item('caption'),
                  'wide',
                ),
                textAtom(sv, id('photo-caption'), 'Caption', item('caption'), 'small'),
              ]),
            ]),
          ],
          'modular_block',
        ),
      ]),
    ]),
  ]);
  return sectionEntry('Itinerary', sv, tree, { linkedSchemas: [DESTINATION_SCHEMA] });
}

const placeItinerary = (s) => (sv, P) =>
  place(s.itinerary.uid, nid(P, 'itinerary'), { title: 'Itinerary', matchedCt: 'destination' });

export const stage3 = [
  { key: 'trip_gallery', build: () => tripGallery() },
  { key: 'page_hero', build: () => pageHero() },
  { key: 'trip_card', build: () => tripCard() },
  { key: 'itinerary', build: () => itinerary() },
  {
    key: 'destination',
    build: (s) =>
      destinationTemplate(s, {
        hero: placePageHero(s, 'destination'),
        extra: [placeItinerary(s)],
        cards: tripList('related_trips', 'Similar trips')(s),
      }),
  },
  {
    key: 'home',
    build: (s) => homeTemplate(s, { cards: tripList('featured_destinations', 'Where we go')(s) }),
  },
  {
    key: 'region',
    build: (s) => regionTemplate(s, { cards: tripList('trips', 'The trips')(s) }),
  },
];
