/**
 * Building blocks for the catch-up stages: the component types the code
 * registers, and the Section and Template entry shapes.
 *
 * The `type` strings must match src/studio/register-components.ts exactly. They
 * are the ones `csdx studio:component:register` generates: the component name.
 */
import { node, page, tmpl, rep, StaticValues } from '../composition.mjs';
import { COMPOSITIONS_CT } from '../config.mjs';

export const C = {
  // Session 1: compounds
  header: 'Header',
  hero: 'Hero',
  carousel: 'Carousel',
  destinationCards: 'DestinationCards',
  footer: 'Footer',
  // Session 2: atoms and layouts
  container: 'Container',
  stack: 'Stack',
  heading: 'Heading',
  text: 'Text',
  image: 'Image',
  badge: 'Badge',
  button: 'Button',
};

/** Linked schema: the whole entry of a content type. Paths are `title`, `image.url`. */
export const WHOLE = (contentTypeUid, displayName) => ({
  content_type_uid: contentTypeUid,
  display_name: displayName,
  cardinality: 'single',
});

/** A literal prop value; the value itself lives in the entry's static_value buckets. */
export const lit = (sv, uid, name, type, value) => ({
  type,
  binding: sv.add(uid, name, type, value),
});
/** A prop bound to a field of the page entry (or the Section's slice of it). */
export const bound = (type, path) => ({ type, binding: tmpl(path) });

export { node, page, tmpl, rep, StaticValues };

/**
 * Every Section a tree places, at any depth. Studio's own API fills
 * `linked_sections` from the tree; the CMA doesn't, and a Section placed inside
 * another Section then renders without its own data and static values.
 */
export function placedSections(tree) {
  const uids = [];
  (function walk(n) {
    if (n.metadata?.compositionUID) uids.push(n.metadata.compositionUID);
    Object.values(n.slots ?? {}).forEach((arr) => arr.forEach(walk));
  })(tree);
  return [...new Set(uids)].map((uid) => ({ uid, _content_type_uid: COMPOSITIONS_CT }));
}

export const sectionEntry = (title, sv, tree, { linkedSchemas = [], dataSources = '[]' } = {}) => ({
  title,
  place_composition_as: 'section',
  schema_version: '1.0.0',
  connected_content_type: '',
  data_sources: dataSources,
  linked_schemas: linkedSchemas,
  linked_sections: placedSections(tree),
  static_value: sv.toEntryField(),
  __tree: tree,
});

const URL_QUERIES = JSON.stringify({ include: [], only: {}, where: {} });

/**
 * A connected template. Three things the UI writes for itself, each silent
 * when missing over the API:
 *   linked_sections   one reference per placed Section ("Template Did Not Load")
 *   url_metadata      where the URL came from
 *   resolvedReferences  the reference fields to fetch whole, or they arrive as {uid} stubs
 */
export const templateEntry = (
  title,
  { contentType, url, references = [], sv = new StaticValues(), tree },
) => ({
  title,
  place_composition_as: 'page',
  schema_version: '1.0.0',
  connected_content_type: contentType,
  url,
  url_metadata: { url_source: 'content_type_url_pattern', url_queries: URL_QUERIES },
  data_sources: JSON.stringify([
    { uid: 'template', data: null, resolvedReferences: { template: references } },
  ]),
  linked_schemas: [],
  linked_sections: placedSections(tree),
  static_value: sv.toEntryField(),
  __tree: tree,
});

/**
 * Place a Section. `rootBinding` replaces the Section's own data: the current
 * Repeater item, or a pinned entry on a freeform template.
 */
export const place = (
  sectionUid,
  instanceUid,
  { title, matchedCt, selectedField, rootBinding } = {},
) =>
  node('section-composition', instanceUid, {
    title,
    metadata: {
      // The runtime resolves the Section by its entry uid.
      compositionUID: sectionUid,
      ...(matchedCt || selectedField || rootBinding
        ? {
            sectionBindingOverride: {
              ...(selectedField ? { selectedField } : {}),
              ...(matchedCt ? { matchedSchemaCt: matchedCt } : {}),
              ...(rootBinding ? { rootBinding, uidRemapping: {} } : {}),
            },
          }
        : {}),
    },
  });

// ─── Repeaters and Condition Blocks (Session 3 on) ───────────────────────────
/** Repeats its children once per item of `items` (a binding to a list). */
export const repeater = (uid, title, items, children, fieldType) =>
  node('repeater', uid, {
    title,
    // Without mode "preview" the canvas shows one placeholder item.
    metadata: { mode: 'preview', ...(fieldType ? { repeaterBindingFieldType: fieldType } : {}) },
    props: { items: { type: 'array', binding: items } },
    children,
  });

/** Shows its children only when `condition` holds. One condition, no else. */
export function conditionBlock(uid, title, condition, children) {
  const n = node('condition-block', uid, { title, children });
  n.metadata.condition = condition;
  return n;
}

export const when = {
  /** A boolean field is true. */
  isTrue: (path) => ({
    type: 'boolean',
    operator: 'is',
    value: true,
    conditionBinding: tmpl(path),
  }),
  /** A number field is at most `n`. */
  atMost: (path, n) => ({
    type: 'number',
    operator: 'lte',
    value: n,
    conditionBinding: tmpl(path),
  }),
  /** A reference field has at least one entry. */
  hasAny: (path) => ({
    type: 'reference',
    subType: 'length',
    operator: 'gt',
    value: 0,
    conditionBinding: tmpl(path),
  }),
  /** The current reference item is an entry of this content type. */
  contentTypeIs: (repeaterUID, contentTypeUid) => ({
    type: 'reference',
    operator: 'eq',
    value: contentTypeUid,
    conditionBinding: rep(repeaterUID, '_content_type_uid'),
  }),
  /** The current modular block is this block type; children read inside it. */
  blockIs: (repeaterUID, blockUid) => ({
    type: 'modular_block',
    operator: 'eq',
    value: blockUid,
    conditionBinding: rep(repeaterUID, blockUid),
    dataBinding: rep(repeaterUID, blockUid),
  }),
};

// ─── Atoms and layouts (Session 2 on) ────────────────────────────────────────
// Every registered prop is written, or Studio's panel shows it blank. Content
// props take a ready prop object: bound('string', 'title') or lit(...).

/** A design prop's per-breakpoint values: { default: 'x', mobile: 'y' }. */
const responsive = (prop, byBreakpoint) => ({
  classes: [''],
  responsiveStyles: Object.fromEntries(
    Object.entries(byBreakpoint).map(([bp, value]) => [bp, { [prop]: value }]),
  ),
});

export function container(sv, uid, title, opts, children) {
  const { tone = 'light', width = 'wide', spacing = 'normal', anchor = '' } = opts;
  return node(C.container, uid, {
    title,
    props: {
      tone: lit(sv, uid, 'tone', 'choice', tone),
      width: lit(sv, uid, 'width', 'choice', width),
      spacing: lit(sv, uid, 'spacing', 'choice', spacing),
      anchor: lit(sv, uid, 'anchor', 'string', anchor),
    },
    children,
  });
}

export function stack(sv, uid, title, opts, children, metadata = {}) {
  const {
    direction = 'vertical',
    gap = 'medium',
    align = 'start',
    surface = 'none',
    padding = 'none',
    columns,
  } = opts;
  const n = node(C.stack, uid, {
    title,
    metadata,
    props: {
      direction: lit(sv, uid, 'direction', 'choice', direction),
      gap: lit(sv, uid, 'gap', 'choice', gap),
      align: lit(sv, uid, 'align', 'choice', align),
      surface: lit(sv, uid, 'surface', 'choice', surface),
      padding: lit(sv, uid, 'padding', 'choice', padding),
    },
    children,
  });
  if (columns) n.styles.gridTemplateColumns = responsive('gridTemplateColumns', columns);
  return n;
}

export function heading(sv, uid, title, text, level, { align } = {}) {
  const n = node(C.heading, uid, {
    title,
    props: { text, level: lit(sv, uid, 'level', 'choice', level) },
  });
  if (align) n.styles.textAlign = responsive('textAlign', align);
  return n;
}

export function textAtom(sv, uid, title, text, variant = 'body', { align, classes } = {}) {
  const n = node(C.text, uid, {
    title,
    classes,
    props: { text, variant: lit(sv, uid, 'variant', 'choice', variant) },
  });
  if (align) n.styles.textAlign = responsive('textAlign', align);
  return n;
}

export const image = (sv, uid, title, src, alt, ratio = 'auto') =>
  node(C.image, uid, {
    title,
    props: { src, alt, ratio: lit(sv, uid, 'ratio', 'choice', ratio) },
  });

export const badge = (sv, uid, title, text, tone = 'accent') =>
  node(C.badge, uid, { title, props: { text, tone: lit(sv, uid, 'tone', 'choice', tone) } });

export const button = (sv, uid, title, label, href, variant = 'primary') =>
  node(C.button, uid, {
    title,
    props: { label, href, variant: lit(sv, uid, 'variant', 'choice', variant) },
  });
