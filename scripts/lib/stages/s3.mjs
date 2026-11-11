/**
 * Session 3: Repeaters and Conditions, over references and modular blocks. No
 * code changes in this session.
 *
 * Two stages:
 *
 *   stage3start   what `catchup -- 3` builds before Session 3: Sessions 1-2,
 *                 plus one ready-made Section (Session 2 already taught building
 *                 one from atoms, and today is about lists):
 *     Trip Card     linked to Destination: one trip's photo beside its details.
 *                   Its Container gives it a sensible width on its own canvas.
 *
 *   stage3        the end of Session 3, which `catchup -- 4` builds. On the
 *                 Destination template, in place of the Destination Cards
 *                 compound, two lists the attendee builds straight on the
 *                 template, each a Container holding a Heading and a Repeater:
 *     The trip, day by day   a Repeater over the `itinerary` modular blocks, one
 *                            Condition Block per block type (Day, Quote), its Box
 *                            holding atoms bound from the block
 *     Similar trips          a Repeater over `related_trips`, one Condition Block
 *                            (content type: Destination), its Box holding the
 *                            Trip Card
 *
 * Built on the TEMPLATE, not as Sections: a Section placed in a Repeater reads
 * each item only when the Repeater is on a Template. Home and Region keep
 * Session 2's Destination Cards compound. The session also adds a Tip block
 * type and one more Condition for it: that is the attendee's own change to
 * their content model, so catch-up leaves it out.
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
  area,
  box,
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

/** One trip: the photo beside its details, one above the other on a phone. */
export function tripCard() {
  const sv = new StaticValues();
  const P = 'trip_card';
  const id = (k) => nid(P, k);
  const tree = page(id('page'), [
    container(sv, id('band'), 'Card band', { width: 'narrow', spacing: 'compact' }, [
      stack(sv, id('card'), 'Card', { direction: 'split', gap: 'medium', align: 'center' }, [
        area(sv, id('photo-area'), 'Photo', {}, [
          image(
            sv,
            id('photo'),
            'Photo',
            bound('imageurl', 'image.url'),
            bound('string', 'image_alt'),
            'landscape',
          ),
        ]),
        area(sv, id('details'), 'Details', { gap: 'small' }, [
          badge(sv, id('duration'), 'Duration', bound('string', 'duration')),
          heading(sv, id('title'), 'Title', bound('string', 'title'), 'h3'),
          textAtom(sv, id('tagline'), 'Tagline', bound('string', 'tagline')),
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

/** A list on the template: a Container holding a Heading, then the Repeater. */
const listBand = (sv, P, key, { label, width }, list) => {
  const id = (k) => nid(P, key, k);
  return container(sv, id('band'), `${label} band`, { width }, [
    heading(sv, id('heading'), 'Heading', lit(sv, id('heading'), 'text', 'string', label), 'h2'),
    list(id),
  ]);
};

/** Similar trips: one Trip Card per similar trip. */
const similarTrips = (s) => (sv, P) =>
  listBand(sv, P, 'trips', { label: 'Similar trips', width: 'narrow' }, (id) =>
    repeater(
      id('repeater'),
      'Repeater',
      bound('array', 'related_trips').binding,
      [
        conditionBlock(
          id('if-destination'),
          'Condition Block',
          when.contentTypeIs(id('repeater'), 'destination'),
          [
            box(id('box'), 'Box', [
              place(s.trip_card.uid, id('card'), { rootBinding: rep(id('repeater'), '') }),
            ]),
          ],
          { subject: 'Similar Trips', value: 'Destination' },
        ),
      ],
      'reference',
    ),
  );

/** The trip, day by day: a layout per block type, atoms straight in each Box. */
const itinerary = (sv, P) =>
  listBand(sv, P, 'itinerary', { label: 'The trip, day by day', width: 'narrow' }, (id) => {
    const rid = id('repeater');
    const item = (path) => ({ type: 'string', binding: rep(rid, path) });
    return repeater(
      rid,
      'Repeater',
      bound('array', 'itinerary').binding,
      [
        conditionBlock(
          id('if-day'),
          'Condition Block',
          when.blockIs(rid, 'day'),
          [
            box(id('day'), 'Box', [
              badge(sv, id('day-label'), 'Badge', item('label')),
              heading(sv, id('day-title'), 'Heading', item('title'), 'h3'),
              textAtom(sv, id('day-text'), 'Text', item('text')),
            ]),
          ],
          { subject: 'Itinerary', value: 'Day' },
        ),
        conditionBlock(
          id('if-quote'),
          'Condition Block',
          when.blockIs(rid, 'quote'),
          [
            box(id('quote'), 'Box', [
              textAtom(sv, id('quote-text'), 'Text', item('quote'), 'lead'),
              textAtom(sv, id('quote-name'), 'Text', item('name'), 'small'),
            ]),
          ],
          { subject: 'Itinerary', value: 'Quote' },
        ),
      ],
      'modular_block',
    );
  });

const common = [
  { key: 'trip_gallery', build: () => tripGallery() },
  { key: 'page_hero', build: () => pageHero() },
  { key: 'trip_card', build: () => tripCard() },
];

/** Sessions 1-2, plus the Trip Card Session 3 starts from. */
export const stage3start = [
  ...common,
  { key: 'destination', build: (s) => destinationTemplate(s, { hero: placePageHero(s, 'destination') }) },
  { key: 'home', build: (s) => homeTemplate(s) },
  { key: 'region', build: (s) => regionTemplate(s) },
];

/** The end of Session 3. */
export const stage3 = [
  ...common,
  {
    key: 'destination',
    build: (s) =>
      destinationTemplate(s, {
        hero: placePageHero(s, 'destination'),
        extra: [itinerary],
        cards: similarTrips(s),
      }),
  },
  { key: 'home', build: (s) => homeTemplate(s) },
  { key: 'region', build: (s) => regionTemplate(s) },
];
