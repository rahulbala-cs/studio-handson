/**
 * The end of Session 4: a freeform page, with pinned entries and a pinned
 * query instead of a connected entry. Every value on it comes from the CMS.
 *
 *   Autumn Escapes   freeform template at /autumn-escapes
 *     Header           compound, bound to the pinned Site Settings entry (a
 *                      freeform page has no entry of its own to read it through)
 *     Page Hero        Section Data: the pinned Europe Region entry
 *     Three trips      Repeater over the pinned query "Europe under $3,000"
 *                      (region = Europe, price_from < 3000, cheapest first,
 *                      3 results), the Trip Card Section per result
 *     Footer           compound, bound to the pinned Site Settings entry
 */
import { nid, pinned } from '../composition.mjs';
import {
  C,
  lit,
  rep,
  node,
  page,
  StaticValues,
  place,
  placedSections,
  container,
  stack,
  heading,
  repeater,
} from './common.mjs';
import { stage3 } from './s3.mjs';

const QUERY = {
  uid: 'europe-under-3000',
  name: 'Europe under $3,000',
  spec: {
    contentType: 'destination',
    sourceType: 'content_type',
    query: { region: 'Europe', price_from: { $lt: 3000 } },
    params: { limit: 3, asc: 'price_from' },
  },
};

/** A placed Section's own data: one pinned entry. */
const pinnedRoot = (contentTypeUid, uid) => ({
  type: 'contentstack',
  value: { uid, _content_type_uid: contentTypeUid, path: {} },
});

export function autumnEscapes(s, ctx) {
  const sv = new StaticValues();
  const P = 'autumn';
  const id = (k) => nid(P, k);
  const rid = id('repeater');
  const site = (path) => pinned('site_settings', ctx.settingsUid, path);

  const tree = page(id('page'), [
    node(C.header, id('header'), {
      title: 'Header',
      props: {
        logo: { type: 'imageurl', binding: site('logo.url') },
        siteName: { type: 'string', binding: site('site_name') },
        links: { type: 'array', binding: site('nav_links') },
      },
    }),
    place(s.page_hero.uid, id('hero'), {
      title: 'Page Hero',
      matchedCt: 'region',
      rootBinding: pinnedRoot('region', ctx.europeUid),
    }),
    container(sv, id('trips-band'), 'Trips band', { anchor: 'trips' }, [
      stack(sv, id('trips'), 'Trips', { gap: 'large' }, [
        heading(
          sv,
          id('trips-heading'),
          'Heading',
          lit(sv, id('trips-heading'), 'text', 'string', 'Three trips under $3,000'),
          'h2',
        ),
        stack(sv, id('grid'), 'Cards', { direction: 'grid', gap: 'large' }, [
          repeater(
            rid,
            'Each trip in the query',
            { type: 'contentstack_queries', value: { queryUID: QUERY.uid, path: { entries: {} } } },
            [
              place(s.trip_card.uid, id('card'), {
                title: 'Trip Card',
                matchedCt: 'destination',
                rootBinding: rep(rid, ''),
              }),
            ],
          ),
        ]),
      ]),
    ]),
    node(C.footer, id('footer'), {
      title: 'Footer',
      props: {
        siteName: { type: 'string', binding: site('site_name') },
        text: { type: 'string', binding: site('footer_text') },
        links: { type: 'array', binding: site('nav_links') },
      },
    }),
  ]);

  return {
    title: 'Autumn Escapes',
    place_composition_as: 'page',
    schema_version: '1.0.0',
    connected_content_type: '',
    url: '/autumn-escapes',
    url_metadata: { url_source: 'user_specified_pattern', url_queries: '' },
    data_sources: JSON.stringify([
      {
        uid: 'contentstack',
        data: [
          { uid: ctx.settingsUid, _content_type_uid: 'site_settings' },
          { uid: ctx.europeUid, _content_type_uid: 'region' },
        ],
        resolvedReferences: { [ctx.settingsUid]: [], [ctx.europeUid]: [] },
      },
      { uid: 'contentstack_queries', data: [QUERY] },
    ]),
    linked_schemas: [],
    linked_sections: placedSections(tree),
    static_value: sv.toEntryField(),
    __tree: tree,
  };
}

export const stage4 = [...stage3, { key: 'autumn', build: (s, ctx) => autumnEscapes(s, ctx) }];
