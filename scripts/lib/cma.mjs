/**
 * Contentstack API client for the provisioning scripts.
 *
 * OAuth only. The credential is resolved in this order:
 *   1. CS_OAUTH_ACCESS_TOKEN                 (env var, for CI; pair it with CS_ORG_UID)
 *   2. The Contentstack CLI's OAuth session   (`csdx auth:login --oauth`)
 *   3. The Contentstack MCP's OAuth session   (`npx @contentstack/mcp --auth`)
 *
 * Access tokens live about an hour and refresh tokens ROTATE: a refresh spends
 * the stored one. So a refresh always goes through the owner of the session (the
 * CLI's own auth handler, or a write-back to the MCP's file). Refreshing without
 * writing the new pair back would sign that tool out on its next refresh.
 *
 * No script asks for a session `authtoken`: it is a full user-session credential
 * across every org and stack you can reach.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

const require = createRequire(import.meta.url);

/**
 * Regional hosts, for all seven Contentstack regions. Attendees bring their own
 * organization, so the scripts can't assume North America.
 *
 * The key is the region code the Contentstack MCP uses; `app` is the code the
 * Next.js app reads from NEXT_PUBLIC_CONTENTSTACK_REGION.
 */
const regionHosts = (prefix, appCode) => ({
  cma: `https://${prefix}api.contentstack.${prefix ? 'com' : 'io'}`,
  studio: `https://${prefix}composable-studio-api.contentstack.com`,
  devhub: `https://${prefix}developerhub-api.contentstack.com`,
  app: `https://${prefix}app.contentstack.com`,
  appCode,
});
const REGIONS = {
  NA: regionHosts('', 'us'),
  EU: regionHosts('eu-', 'eu'),
  AU: regionHosts('au-', 'au'),
  AZURE_NA: regionHosts('azure-na-', 'azure-na'),
  AZURE_EU: regionHosts('azure-eu-', 'azure-eu'),
  GCP_NA: regionHosts('gcp-na-', 'gcp-na'),
  GCP_EU: regionHosts('gcp-eu-', 'gcp-eu'),
};
/** Accepts the CLI's spelling (AWS-NA, AZURE-EU) as well as the MCP's (NA, AZURE_EU). */
export const normalizeRegion = (r) =>
  String(r ?? 'NA')
    .toUpperCase()
    .replace(/-/g, '_')
    .replace(/^AWS_/, '')
    .replace(/^US$/, 'NA');
const regionForCmaHost = (cma) =>
  Object.keys(REGIONS).find((r) => REGIONS[r].cma === cma?.replace(/\/$/, ''));

const state = {
  accessToken: null,
  orgUid: null,
  region: 'NA',
  source: null,
  csdx: null,
  store: null,
};

// ─── Source 2: the Contentstack CLI ──────────────────────────────────────────
/** Loads the CLI's own utilities from its global install, if there is one. */
function loadCsdx() {
  let root;
  try {
    root = execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return null;
  }
  // Node 26 warns about localStorage when the CLI's dependencies probe for it.
  const emit = process.emitWarning;
  process.emitWarning = (w, ...rest) =>
    String(w).includes('localStorage') ? undefined : emit.call(process, w, ...rest);
  for (const rel of [
    '@contentstack/cli/node_modules/@contentstack/cli-utilities',
    '@contentstack/cli-utilities',
  ]) {
    try {
      return require(path.join(root, rel));
    } catch {
      /* try the next layout */
    }
  }
  return null;
}

async function fromCsdx({ force = false } = {}) {
  state.csdx ??= loadCsdx();
  const utils = state.csdx;
  if (!utils?.configHandler) return null;
  const { configHandler, authHandler } = utils;
  if (configHandler.get('authorisationType') !== 'OAUTH') {
    if (configHandler.get('authtoken')) {
      console.log(
        '  ! The Contentstack CLI is logged in with email/password, not OAuth. These scripts\n' +
          '    only use OAuth. Run:  csdx auth:logout && csdx auth:login --oauth',
      );
    }
    return null;
  }
  // The CLI refreshes (and stores the rotated pair) itself.
  await authHandler.checkExpiryAndRefresh(force);
  const token = configHandler.get('oauthAccessToken');
  if (!token) return null;
  return {
    token,
    orgUid: configHandler.get('oauthOrgUid'),
    region: regionForCmaHost(configHandler.get('region')?.cma) ?? 'NA',
  };
}

// ─── Source 3: the Contentstack MCP ──────────────────────────────────────────
// The MCP's public OAuth client: these scripts reuse the session
// `npx @contentstack/mcp --auth` creates, so no app registration is needed.
const MCP_CLIENT_ID = 'cGQZujH3Y_oYkf59';
const MCP_REDIRECT_URI = 'http://localhost:8184';

function mcpStorePath() {
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library/Application Support/ContentstackMCP/oauth-config.json');
  }
  if (process.platform === 'win32') {
    return path.join(process.env.LOCALAPPDATA ?? '', 'ContentstackMCP/oauth-config.json');
  }
  return path.join(os.homedir(), '.config/ContentstackMCP/oauth-config.json');
}

async function fromMcp({ force = false } = {}) {
  const p = mcpStorePath();
  if (!fs.existsSync(p)) return null;
  let cfg;
  try {
    cfg = JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
  const region = normalizeRegion(cfg.region);
  const expiry = cfg.token_issued_at + cfg.expires_in * 1000;
  if (force || Date.now() >= expiry - 5 * 60 * 1000) {
    const res = await fetch(`${REGIONS[region].devhub}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: MCP_CLIENT_ID,
        refresh_token: cfg.refresh_token,
        redirect_uri: MCP_REDIRECT_URI,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.access_token) return null;
    // Write the rotated pair back atomically, keeping every other field.
    cfg = { ...cfg, ...data, token_issued_at: Date.now() };
    fs.writeFileSync(`${p}.tmp`, JSON.stringify(cfg, null, 2));
    fs.renameSync(`${p}.tmp`, p);
  }
  return { token: cfg.access_token, orgUid: cfg.organization_uid, region };
}

/** Resolve a usable access token. `force` refreshes the current source. */
export async function resolveAuth({ force = false } = {}) {
  if (process.env.CS_OAUTH_ACCESS_TOKEN) {
    if (force)
      throw new Error('401 from Contentstack: CS_OAUTH_ACCESS_TOKEN is expired or invalid.');
    Object.assign(state, {
      accessToken: process.env.CS_OAUTH_ACCESS_TOKEN,
      orgUid: process.env.CS_ORG_UID || null,
      region: normalizeRegion(process.env.CONTENTSTACK_REGION || 'NA'),
      source: 'CS_OAUTH_ACCESS_TOKEN',
    });
    return state.accessToken;
  }
  const sources = { csdx: fromCsdx, mcp: fromMcp };
  const order = state.source && sources[state.source] ? [state.source] : ['csdx', 'mcp'];
  for (const name of order) {
    const found = await sources[name]({ force });
    if (found) {
      Object.assign(state, {
        accessToken: found.token,
        orgUid: process.env.CS_ORG_UID || found.orgUid,
        region: normalizeRegion(process.env.CONTENTSTACK_REGION || found.region),
        source: name,
      });
      return state.accessToken;
    }
  }
  throw new Error(
    'No Contentstack OAuth session found. Log in once with the CLI:\n' +
      '    csdx auth:login --oauth\n' +
      '  (or export CS_OAUTH_ACCESS_TOKEN and CS_ORG_UID).',
  );
}

export const authSource = () => state.source;
/** The signed-in region, e.g. "NA" or "AZURE_EU". */
export const authRegion = () => state.region;
/** The region code the Next.js app expects in NEXT_PUBLIC_CONTENTSTACK_REGION. */
export const appRegionCode = () => REGIONS[state.region]?.appCode ?? 'us';

export function hosts() {
  const h = REGIONS[state.region];
  if (!h) {
    throw new Error(
      `Region "${state.region}" is not supported by these scripts (${Object.keys(REGIONS).join(', ')}).`,
    );
  }
  return h;
}

export function orgUid() {
  if (!state.orgUid) throw new Error('Organization uid unresolved. Set CS_ORG_UID in .env.');
  return state.orgUid;
}
export function setOrgUid(uid) {
  state.orgUid = uid;
}

async function request(url, { method = 'GET', headers = {}, body, scope } = {}, isRetry = false) {
  const token = state.accessToken ?? (await resolveAuth());
  const h = { authorization: `Bearer ${token}`, ...(scope ?? {}), ...headers };
  // FormData sets its own multipart boundary, so it never gets a Content-Type here.
  const isForm = body instanceof FormData;
  if (body !== undefined && !isForm && !h['Content-Type']) h['Content-Type'] = 'application/json';

  const res = await fetch(url, {
    method,
    headers: h,
    body: body === undefined || isForm || typeof body === 'string' ? body : JSON.stringify(body),
  });

  // A token that worked minutes ago can be expired now. Refresh once, retry once.
  if (res.status === 401 && !isRetry) {
    await resolveAuth({ force: true });
    return request(url, { method, headers, body, scope }, true);
  }

  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(
      `${method} ${url.replace(/https:\/\/[^/]+/, '')} -> ${res.status} ${JSON.stringify(json).slice(0, 600)}`,
    );
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

/** Org-scoped CMA call (creating a stack, listing stacks). */
export function cmaOrg(endpoint, opts = {}) {
  return request(`${hosts().cma}/v3${endpoint}`, {
    ...opts,
    scope: { organization_uid: orgUid() },
  });
}

/** Stack-scoped CMA call (content types, entries, assets, publish). */
export function cma(apiKey, endpoint, opts = {}) {
  return request(`${hosts().cma}/v3${endpoint}`, { ...opts, scope: { api_key: apiKey } });
}

/**
 * Upload an asset, or replace the file of the one with the same title, so
 * re-running a script updates the stack instead of piling up duplicates.
 */
export async function upsertAsset(apiKey, { title, filename, body, contentType, description }) {
  const q = encodeURIComponent(JSON.stringify({ title }));
  const { assets = [] } = await cma(apiKey, `/assets?query=${q}`);
  const existing = assets[0];
  const form = new FormData();
  form.append('asset[upload]', new Blob([body], { type: contentType }), filename);
  form.append('asset[title]', title);
  if (description) form.append('asset[description]', description);
  const { asset } = await cma(apiKey, existing ? `/assets/${existing.uid}` : '/assets', {
    method: existing ? 'PUT' : 'POST',
    body: form,
  });
  return { uid: asset.uid, replaced: !!existing };
}

/** Studio API call. Projects are org-scoped, never stack-scoped. */
export function studio(endpoint, opts = {}) {
  return request(`${hosts().studio}/v1${endpoint}`, {
    ...opts,
    scope: { organization_uid: orgUid() },
  });
}

export const log = {
  step: (m) => console.log(`\n\x1b[1m\x1b[36m▸ ${m}\x1b[0m`),
  ok: (m) => console.log(`  \x1b[32m✓\x1b[0m ${m}`),
  skip: (m) => console.log(`  \x1b[90m·\x1b[0m ${m}`),
  warn: (m) => console.log(`  \x1b[33m!\x1b[0m ${m}`),
  info: (m) => console.log(`    ${m}`),
};

/** Every script ends the same way: a readable error, a non-zero exit. */
export function run(main) {
  main().catch((e) => {
    console.error(`\n\x1b[31m✗ ${e.message}\x1b[0m`);
    process.exit(1);
  });
}
