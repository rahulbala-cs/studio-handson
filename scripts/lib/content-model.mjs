/**
 * The content model, as data: four content types.
 *
 *   site_settings  one entry   site name, logo, menu and footer text for every page
 *   destination    six         each renders its own page at /destinations/<title>
 *   home_page      one entry   the page at "/"
 *   region         two         Asia and Europe; no page until Session 2 builds one
 *
 * Every page type has a `site_settings` reference to the one Site Settings
 * entry, with the same uid on each. The Header and Footer compounds, placed on
 * each template, read the menu through it, so the menu lives in one place.
 *
 * Region's title, tagline, image, image_alt, duration and price have the same
 * uids as Destination's. That is what lets one Section (Session 2's Page Hero)
 * be linked to both content types and bind itself on either template. Every
 * field the Section binds has to exist on both: a missing one doesn't render
 * empty, it falls back to the component's registered default.
 */

const base = (uid, display_name, data_type, extra = {}) => ({
  data_type,
  display_name,
  uid,
  field_metadata: { description: '', ...(extra.field_metadata ?? {}) },
  mandatory: extra.mandatory ?? false,
  multiple: extra.multiple ?? false,
  non_localizable: false,
  unique: extra.unique ?? false,
  ...Object.fromEntries(
    Object.entries(extra).filter(
      ([k]) => !['field_metadata', 'mandatory', 'multiple', 'unique'].includes(k),
    ),
  ),
});

/** Field builders: the CMA's verbose shapes, kept in one place. */
const text = (uid, display_name, opts = {}) =>
  base(uid, display_name, 'text', {
    mandatory: opts.mandatory,
    unique: opts.unique,
    field_metadata: { _default: true, version: 3, ...(opts.multiline ? { multiline: true } : {}) },
    format: '',
    error_messages: { format: '' },
  });

const number = (uid, display_name) => base(uid, display_name, 'number');

const boolean = (uid, display_name) =>
  base(uid, display_name, 'boolean', { field_metadata: { default_value: false } });

const select = (uid, display_name, choices) =>
  base(uid, display_name, 'text', {
    display_type: 'dropdown',
    enum: { advanced: false, choices: choices.map((value) => ({ value })) },
    field_metadata: { default_value: '', version: 3 },
  });

const file = (uid, display_name, opts = {}) =>
  base(uid, display_name, 'file', {
    multiple: opts.multiple,
    field_metadata: { rich_text_type: 'standard', image: true },
    extensions: [],
  });

const group = (uid, display_name, schema, opts = {}) =>
  base(uid, display_name, 'group', { multiple: opts.multiple, schema, field_metadata: {} });

const reference = (uid, display_name, to, opts = {}) =>
  base(uid, display_name, 'reference', {
    reference_to: [to],
    field_metadata: { ref_multiple: opts.multiple ?? false, ref_multiple_content_types: false },
  });

const blocks = (uid, display_name, blockDefs) =>
  base(uid, display_name, 'blocks', { multiple: true, blocks: blockDefs, field_metadata: {} });

/** The `title` + `url` pair every page content type needs. */
const pageBase = () => [
  text('title', 'Title', { mandatory: true, unique: true }),
  text('url', 'URL'),
];

const SITE_SETTINGS_REF = () => reference('site_settings', 'Site Settings', 'site_settings');

const SITE_SETTINGS = {
  uid: 'site_settings',
  title: 'Site Settings',
  description: 'One entry. The site name, logo, menu and footer text every page shares.',
  options: { is_page: false, singleton: true, title: 'title', sub_title: [] },
  schema: [
    text('title', 'Title', { mandatory: true, unique: true }),
    text('site_name', 'Site Name'),
    file('logo', 'Logo'),
    group('nav_links', 'Menu Links', [text('label', 'Label'), text('url', 'URL')], {
      multiple: true,
    }),
    text('footer_text', 'Footer Text', { multiline: true }),
  ],
};

const destinationSchema = (withSelfReference) => [
  ...pageBase(),
  SITE_SETTINGS_REF(),
  text('tagline', 'Tagline', { multiline: true }),
  file('image', 'Image'),
  text('image_alt', 'Image Alt Text'),
  text('duration', 'Duration'),
  text('price', 'Price'),
  number('price_from', 'Price From (USD)'),
  select('region', 'Region', ['Asia', 'Europe']),
  boolean('on_sale', 'On Sale'),
  number('spots_left', 'Spots Left'),
  file('gallery', 'Gallery', { multiple: true }),
  blocks('itinerary', 'Itinerary', [
    {
      title: 'Day',
      uid: 'day',
      schema: [
        text('label', 'Label'),
        text('title', 'Title'),
        text('text', 'Text', { multiline: true }),
      ],
    },
    {
      title: 'Quote',
      uid: 'quote',
      schema: [text('quote', 'Quote', { multiline: true }), text('name', 'Name')],
    },
    { title: 'Photo', uid: 'photo', schema: [file('image', 'Image'), text('caption', 'Caption')] },
  ]),
  // A content type can't reference itself until it exists: added in a second pass.
  ...(withSelfReference
    ? [reference('related_trips', 'Similar Trips', 'destination', { multiple: true })]
    : []),
];

const DESTINATION_OPTIONS = {
  is_page: true,
  singleton: false,
  title: 'title',
  sub_title: [],
  // URL Management: Contentstack writes /destinations/<title> into each entry's
  // URL field, and Studio builds the template URL from the prefix. Stacks
  // without URL patterns get the same URL values from the seed script.
  url_pattern: '/:title',
  url_prefix: '/destinations/',
};

const HOME_PAGE = {
  uid: 'home_page',
  title: 'Home Page',
  description: 'One entry, at "/". A hero and a pick of destinations.',
  options: { is_page: true, singleton: true, title: 'title', sub_title: [] },
  schema: [
    ...pageBase(),
    SITE_SETTINGS_REF(),
    group('hero', 'Hero', [
      text('eyebrow', 'Eyebrow'),
      text('headline', 'Headline'),
      text('subheadline', 'Subheadline', { multiline: true }),
      file('image', 'Image'),
      text('image_alt', 'Image Alt Text'),
      text('cta_label', 'Button Label'),
      text('cta_url', 'Button URL'),
    ]),
    reference('featured_destinations', 'Featured Destinations', 'destination', { multiple: true }),
  ],
};

const REGION = {
  uid: 'region',
  title: 'Region',
  description: 'Two entries, Asia and Europe. Session 2 gives them pages with no code change.',
  options: {
    is_page: true,
    singleton: false,
    title: 'title',
    sub_title: [],
    // Same scheme as Destination: /regions/<title>.
    url_pattern: '/:title',
    url_prefix: '/regions/',
  },
  schema: [
    ...pageBase(),
    SITE_SETTINGS_REF(),
    text('tagline', 'Tagline', { multiline: true }),
    file('image', 'Image'),
    text('image_alt', 'Image Alt Text'),
    // For a region: the range of its trips, such as "6 to 10 days" and "From $1,890".
    text('duration', 'Duration'),
    text('price', 'Price'),
    reference('trips', 'Trips', 'destination', { multiple: true }),
  ],
};

const destination = (withSelfReference) => ({
  uid: 'destination',
  title: 'Destination',
  description: 'Six entries. One template gives every one of them its own page.',
  options: DESTINATION_OPTIONS,
  schema: destinationSchema(withSelfReference),
});

/**
 * In order. Each step is a create-or-update; destination appears twice
 * because its `related_trips` field points at itself. Home Page and Region
 * come after it, because both reference destinations.
 */
export const CONTENT_TYPE_STEPS = [
  SITE_SETTINGS,
  destination(false),
  destination(true),
  HOME_PAGE,
  REGION,
];

export const CONTENT_TYPE_UIDS = ['site_settings', 'destination', 'home_page', 'region'];
