/**
 * Step 3: sample content.
 *
 *   assets → site settings → destinations → similar trips → home page → regions → publish
 *
 * Idempotent by title: a re-run updates entries and assets instead of
 * duplicating them. Publishing is part of seeding: an unpublished entry is
 * invisible to the Delivery API, so the site and the canvas render blank while
 * the CMS looks fine.
 */
import { resolveAuth, cma, upsertAsset, log, run } from './lib/cma.mjs';
import { logo, PHOTOS, fetchPhoto, photoSource } from './lib/artwork.mjs';
import { SITE_SETTINGS, HOME, DESTINATIONS, REGIONS } from './lib/sample-content.mjs';
import { requireStack, ENVIRONMENT, LOCALE } from './lib/config.mjs';

let apiKey;
const publishTo = { environments: [ENVIRONMENT], locales: [LOCALE] };

const slug = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const ref = (contentTypeUid, uid) => ({ uid, _content_type_uid: contentTypeUid });

/** Upload every photo, a few at a time. Returns { key: assetUid }. */
async function uploadPhotos() {
  const keys = Object.keys(PHOTOS);
  const uids = {};
  let next = 0;
  async function worker() {
    while (next < keys.length) {
      const key = keys[next++];
      const meta = PHOTOS[key];
      const { uid, replaced } = await upsertAsset(apiKey, {
        // The title is the photo's description: the Carousel uses it as alt text.
        title: meta.alt,
        filename: `${key}.jpg`,
        body: await fetchPhoto(meta.id, meta.ar ? { ar: meta.ar } : {}),
        contentType: 'image/jpeg',
        description: `${photoSource(meta.id)} (Unsplash License).`,
      });
      uids[key] = uid;
      log.ok(`${replaced ? 'replaced' : 'uploaded'} ${key}`);
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker));
  return uids;
}

async function upsertEntry(ct, entry) {
  const q = encodeURIComponent(JSON.stringify({ title: entry.title }));
  const { entries = [] } = await cma(apiKey, `/content_types/${ct}/entries?query=${q}`);
  const existing = entries[0];
  if (existing) {
    await cma(apiKey, `/content_types/${ct}/entries/${existing.uid}`, {
      method: 'PUT',
      body: { entry },
    });
    log.skip(`${ct} "${entry.title}" updated`);
    return existing.uid;
  }
  const res = await cma(apiKey, `/content_types/${ct}/entries`, {
    method: 'POST',
    body: { entry },
  });
  log.ok(`${ct} "${entry.title}" created`);
  return res.entry.uid;
}

/** One itinerary block, with its photo key swapped for the asset uid. */
function itineraryBlock(block, photoUids) {
  if (!block.photo) return block;
  const { photo: key, caption } = block.photo;
  return { photo: { image: photoUids[key], caption } };
}

run(async () => {
  await resolveAuth();
  apiKey = requireStack();

  log.step('Assets');
  const { uid: logoUid, replaced } = await upsertAsset(apiKey, {
    title: 'Wayfarer logo',
    filename: 'wayfarer-logo.svg',
    body: logo(),
    contentType: 'image/svg+xml',
    description: 'Wayfarer compass mark.',
  });
  log.ok(`${replaced ? 'replaced' : 'uploaded'} logo`);
  const photoUids = await uploadPhotos();

  log.step('Site settings');
  const settingsUid = await upsertEntry('site_settings', { ...SITE_SETTINGS, logo: logoUid });
  const siteSettings = [ref('site_settings', settingsUid)];

  log.step('Destinations');
  const destinationUids = {};
  for (const d of DESTINATIONS) {
    destinationUids[d.title] = await upsertEntry('destination', {
      title: d.title,
      url: `/destinations/${slug(d.title)}`,
      site_settings: siteSettings,
      tagline: d.tagline,
      image: photoUids[d.photo],
      image_alt: PHOTOS[d.photo].alt,
      duration: d.duration,
      price: d.price,
      price_from: d.price_from,
      region: d.region,
      on_sale: d.on_sale,
      spots_left: d.spots_left,
      gallery: d.gallery.map((key) => photoUids[key]),
      itinerary: d.itinerary.map((block) => itineraryBlock(block, photoUids)),
    });
  }

  // Every destination exists now, so the similar-trip references can point at them.
  log.step('Similar trips');
  for (const d of DESTINATIONS) {
    await cma(apiKey, `/content_types/destination/entries/${destinationUids[d.title]}`, {
      method: 'PUT',
      body: {
        entry: { related_trips: d.related.map((t) => ref('destination', destinationUids[t])) },
      },
    });
    log.ok(`${d.title} → ${d.related.join(', ')}`);
  }

  log.step('Home page');
  const { photo, ...hero } = HOME.hero;
  const homeUid = await upsertEntry('home_page', {
    title: HOME.title,
    url: HOME.url,
    site_settings: siteSettings,
    hero: { ...hero, image: photoUids[photo], image_alt: PHOTOS[photo].alt },
    featured_destinations: DESTINATIONS.map((d) => ref('destination', destinationUids[d.title])),
  });

  log.step('Regions');
  const regionUids = {};
  for (const r of REGIONS) {
    regionUids[r.title] = await upsertEntry('region', {
      title: r.title,
      url: r.url,
      site_settings: siteSettings,
      tagline: r.tagline,
      image: photoUids[r.photo],
      image_alt: PHOTOS[r.photo].alt,
      duration: r.duration,
      price: r.price,
      trips: r.trips.map((t) => ref('destination', destinationUids[t])),
    });
  }

  log.step(`Publishing to "${ENVIRONMENT}"`);
  const assets = [logoUid, ...Object.values(photoUids)];
  for (const uid of assets) {
    await cma(apiKey, `/assets/${uid}/publish`, { method: 'POST', body: { asset: publishTo } });
  }
  log.ok(`${assets.length} assets`);
  const entries = [
    ['site_settings', settingsUid],
    ...Object.values(destinationUids).map((uid) => ['destination', uid]),
    ['home_page', homeUid],
    ...Object.values(regionUids).map((uid) => ['region', uid]),
  ];
  for (const [ct, uid] of entries) {
    await cma(apiKey, `/content_types/${ct}/entries/${uid}/publish`, {
      method: 'POST',
      body: { entry: publishTo },
    });
  }
  log.ok(`${entries.length} entries`);

  // Publishing is asynchronous: check the latest version landed.
  await new Promise((r) => setTimeout(r, 4000));
  const behind = [];
  for (const [ct, uid] of entries) {
    const { entry } = await cma(
      apiKey,
      `/content_types/${ct}/entries/${uid}?include_publish_details=true`,
    );
    if (!(entry.publish_details ?? []).some((d) => d.version === entry._version)) {
      behind.push(`${ct}/${entry.title}`);
    }
  }
  if (behind.length)
    log.warn(`not live yet (publishing is async; npm run doctor re-checks): ${behind.join(', ')}`);
  else log.ok('every entry is live at its latest version');
});
