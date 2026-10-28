/**
 * Step 1: the stack's setup.
 *
 *   environment (+ Base URL) → Live Preview → delivery + preview token → content types
 *
 * No Studio project: attendees create that themselves in Session 1.
 *
 * Find-or-create throughout, so re-running is safe. The repo owns these content
 * types: a re-run replaces each with its definition in content-model.mjs.
 */
import { resolveAuth, cma, log, run, appRegionCode } from './lib/cma.mjs';
import { CONTENT_TYPE_STEPS } from './lib/content-model.mjs';
import { requireStack, ENVIRONMENT, BASE_URL, LOCALE, writeEnv } from './lib/config.mjs';

let apiKey;

/**
 * The Base URL is where Studio finds the running app: it loads the canvas from
 * Base URL + "/canvas" and previews a template at Base URL + its URL.
 */
async function ensureEnvironment() {
  log.step(`Environment "${ENVIRONMENT}"`);
  const { environments = [] } = await cma(apiKey, '/environments');
  const found = environments.find((e) => e.name === ENVIRONMENT);
  const urls = [{ locale: LOCALE, url: BASE_URL }];
  if (found) {
    if (found.urls?.find((u) => u.locale === LOCALE)?.url !== BASE_URL) {
      // This endpoint is keyed on the environment NAME, not its uid.
      await cma(apiKey, `/environments/${ENVIRONMENT}`, {
        method: 'PUT',
        body: { environment: { name: ENVIRONMENT, urls } },
      });
      log.ok(`Base URL updated to ${BASE_URL}`);
    } else {
      log.skip(`exists (${found.uid}), Base URL ${BASE_URL}`);
    }
    return found.uid;
  }
  const { environment } = await cma(apiKey, '/environments', {
    method: 'POST',
    body: { environment: { name: ENVIRONMENT, urls } },
  });
  log.ok(`created ${environment.uid}, Base URL ${BASE_URL}`);
  return environment.uid;
}

async function enableLivePreview(envUid) {
  log.step('Live Preview');
  // Read-modify-write: sibling settings must survive.
  const current = await cma(apiKey, '/stacks/settings');
  const settings = current.stack_settings ?? {};
  if (settings.live_preview?.enabled && settings.live_preview['default-env'] === envUid) {
    log.skip('already enabled for this environment');
    return;
  }
  await cma(apiKey, '/stacks/settings', {
    method: 'POST',
    body: {
      stack_settings: {
        ...settings,
        live_preview: {
          enabled: true,
          'default-env': envUid,
          'default-url': '',
          'is-always-open-in-new-tab': false,
          'lp-onboarding-setup-visible': true,
        },
      },
    },
  });
  // A 201 is not proof. Read it back.
  const after = await cma(apiKey, '/stacks/settings');
  if (!after.stack_settings?.live_preview?.enabled) {
    throw new Error('Live Preview write returned success but did not persist.');
  }
  log.ok('enabled');
}

async function ensureTokens() {
  log.step('Delivery token + preview token');
  const { tokens = [] } = await cma(apiKey, '/stacks/delivery_tokens');
  let token = tokens.find((t) => t.name === 'studio');
  if (!token) {
    // create_with_preview_token is a QUERY param. In the body it silently no-ops.
    const res = await cma(apiKey, '/stacks/delivery_tokens?create_with_preview_token=true', {
      method: 'POST',
      body: {
        token: {
          name: 'studio',
          description: 'Studio canvas, Live Preview and the site',
          scope: [
            { module: 'environment', environments: [ENVIRONMENT], acl: { read: true } },
            // Required even on a single-branch stack, or creation fails with 141.
            { module: 'branch', branches: ['main'], acl: { read: true } },
          ],
        },
      },
    });
    token = res.token;
    log.ok(`created ${token.uid}`);
  } else {
    log.skip(`exists (${token.uid})`);
  }
  // The create response does not reliably carry the preview token. Read it back.
  const full = await cma(apiKey, `/stacks/delivery_tokens/${token.uid}?include_preview_token=true`);
  const deliveryToken = full.token?.token ?? token.token;
  const previewToken = full.token?.preview_token;
  if (!previewToken)
    throw new Error('No preview token on the delivery token: Live Preview would not work.');
  log.ok('preview token resolved');
  return { deliveryToken, previewToken };
}

/** Create or update one content type. */
async function upsertContentType(ct, existing) {
  if (existing.has(ct.uid)) {
    await cma(apiKey, `/content_types/${ct.uid}`, { method: 'PUT', body: { content_type: ct } });
  } else {
    await cma(apiKey, '/content_types', { method: 'POST', body: { content_type: ct } });
    existing.add(ct.uid);
  }
}

async function ensureContentTypes() {
  log.step('Content types');
  const { content_types = [] } = await cma(apiKey, '/content_types');
  const existing = new Set(content_types.map((c) => c.uid));
  let urlPatterns = true;
  for (const ct of CONTENT_TYPE_STEPS) {
    const isNew = !existing.has(ct.uid);
    try {
      await upsertContentType(ct, existing);
    } catch (e) {
      // URL patterns need URL Management, which Contentstack turns on per stack.
      // Without it, keep the content type and fill each entry's URL ourselves.
      if (!ct.options?.url_pattern) throw e;
      const { url_pattern, url_prefix, ...options } = ct.options;
      await upsertContentType({ ...ct, options }, existing);
      urlPatterns = false;
    }
    const fields = ct.schema.length;
    if (isNew) log.ok(`${ct.uid} created (${fields} fields)`);
    else log.skip(`${ct.uid} updated (${fields} fields)`);
  }
  if (!urlPatterns) {
    log.warn(
      'URL patterns are not enabled on this stack; destination URLs are set by the seed step instead.',
    );
  }
}

run(async () => {
  await resolveAuth();
  apiKey = requireStack();
  const environmentUid = await ensureEnvironment();
  await enableLivePreview(environmentUid);
  const { deliveryToken, previewToken } = await ensureTokens();
  await ensureContentTypes();
  writeEnv({
    NEXT_PUBLIC_CONTENTSTACK_DELIVERY_TOKEN: deliveryToken,
    NEXT_PUBLIC_CONTENTSTACK_PREVIEW_TOKEN: previewToken,
    NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT: ENVIRONMENT,
    NEXT_PUBLIC_CONTENTSTACK_REGION: appRegionCode(),
    CONTENTSTACK_ENVIRONMENT_UID: environmentUid,
  });
  log.info('tokens, environment and region written to .env');
});
