/**
 * npm run doctor: is this laptop ready for the next session?
 *
 * Every check prints what it found, and every failure says what to do. Run it
 * with `npm run dev` running in another terminal, so it can reach the site.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import path from 'node:path';
import { resolveAuth, cma, cmaOrg, orgUid, authSource, authRegion, studio } from './lib/cma.mjs';
import { ROOT, readEnv, BASE_URL, ENVIRONMENT } from './lib/config.mjs';

const CDN = {
  us: 'cdn.contentstack.io',
  eu: 'eu-cdn.contentstack.com',
  au: 'au-cdn.contentstack.com',
  'azure-na': 'azure-na-cdn.contentstack.com',
  'azure-eu': 'azure-eu-cdn.contentstack.com',
  'gcp-na': 'gcp-na-cdn.contentstack.com',
  'gcp-eu': 'gcp-eu-cdn.contentstack.com',
};

let failures = 0;
const ok = (label, detail = '') =>
  console.log(`  \x1b[32m✓\x1b[0m ${label}${detail ? `\x1b[90m  ${detail}\x1b[0m` : ''}`);
const info = (label, detail = '') =>
  console.log(`  \x1b[36mi\x1b[0m ${label}${detail ? `\x1b[90m  ${detail}\x1b[0m` : ''}`);
const fail = (label, fix) => {
  failures++;
  console.log(`  \x1b[31m✗\x1b[0m ${label}\n      \x1b[33m→ ${fix}\x1b[0m`);
};
const section = (title) => console.log(`\n\x1b[1m${title}\x1b[0m`);

const sh = (cmd) => {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'], timeout: 60_000 }).toString();
  } catch {
    return null;
  }
};

/** GET a URL (http or https). Resolves to the status code, or 0 if nothing answers. */
const status = (url) =>
  new Promise((resolve) => {
    const client = url.startsWith('https:') ? https : http;
    const req = client.get(url, { rejectUnauthorized: false, timeout: 15_000 }, (res) => {
      res.resume();
      resolve(res.statusCode);
    });
    req.on('error', () => resolve(0));
    req.on('timeout', () => {
      req.destroy();
      resolve(0);
    });
  });

console.log('\n\x1b[1mStudio hands-on: ready check\x1b[0m');

// ─── 1. Tools ────────────────────────────────────────────────────────────────
section('Tools');
const [major, minor] = process.versions.node.split('.').map(Number);
if (major > 20 || (major === 20 && minor >= 9)) ok(`Node.js ${process.versions.node}`);
else fail(`Node.js ${process.versions.node} is too old`, 'Install Node.js 22 LTS from nodejs.org.');

const csdxVersion = sh('csdx --version');
if (csdxVersion) ok('Contentstack CLI', csdxVersion.trim().split(' ')[0]);
else
  fail('Contentstack CLI not found', 'npm install -g @contentstack/cli, then open a new terminal.');

if (csdxVersion) {
  const plugins = sh('csdx plugins') ?? '';
  if (plugins.includes('@contentstack/studio')) ok('Studio CLI plugin', '@contentstack/studio');
  else fail('Studio CLI plugin not installed', 'csdx plugins:install @contentstack/studio');
}

// ─── 2. Login ────────────────────────────────────────────────────────────────
section('Contentstack login');
let signedIn = false;
try {
  await resolveAuth();
  signedIn = true;
  const { organizations = [] } = await cmaOrg('/organizations?limit=100').catch(() => ({}));
  const org = organizations.find((o) => o.uid === orgUid());
  ok(
    `Signed in (${authSource() === 'csdx' ? 'CLI' : authSource()}, region ${authRegion()})`,
    org?.name ?? orgUid(),
  );
} catch (e) {
  fail('Not signed in', 'csdx auth:login --oauth   (pick the organization that has Studio)');
}

// ─── 3. .env ─────────────────────────────────────────────────────────────────
section('Your .env');
const env = readEnv();
const required = [
  ['NEXT_PUBLIC_CONTENTSTACK_API_KEY', 'stack API key'],
  ['NEXT_PUBLIC_CONTENTSTACK_DELIVERY_TOKEN', 'delivery token'],
  ['NEXT_PUBLIC_CONTENTSTACK_PREVIEW_TOKEN', 'preview token'],
  ['NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT', 'environment'],
  ['NEXT_PUBLIC_CONTENTSTACK_REGION', 'region'],
];
const missing = required.filter(([k]) => !env[k]);
if (!fs.existsSync(path.join(ROOT, '.env'))) fail('No .env file', 'npm run setup');
else if (missing.length)
  fail(`.env is missing: ${missing.map(([, d]) => d).join(', ')}`, 'npm run setup');
else
  ok(
    '.env has everything',
    `stack ${env.NEXT_PUBLIC_CONTENTSTACK_API_KEY}, region ${env.NEXT_PUBLIC_CONTENTSTACK_REGION}`,
  );

// ─── 4. Stack ────────────────────────────────────────────────────────────────
section('Your stack');
const apiKey = env.NEXT_PUBLIC_CONTENTSTACK_API_KEY;
if (signedIn && apiKey) {
  try {
    const { stack } = await cma(apiKey, '/stacks');
    ok(`Stack "${stack.name}"`);

    const { environments = [] } = await cma(apiKey, '/environments');
    const envRow = environments.find((e) => e.name === ENVIRONMENT);
    const url = envRow?.urls?.find((u) => u.locale === 'en-us')?.url;
    if (url === BASE_URL) ok(`Environment "${ENVIRONMENT}"`, `Base URL ${url}`);
    else
      fail(
        `Environment "${ENVIRONMENT}" Base URL is ${url ?? 'not set'}, expected ${BASE_URL}`,
        'npm run setup (it sets the Base URL)',
      );

    const { stack_settings: settings } = await cma(apiKey, '/stacks/settings');
    if (settings?.live_preview?.enabled) ok('Live Preview is on');
    else fail('Live Preview is off', 'npm run setup');

    const { content_type: ct } = await cma(apiKey, '/content_types/destination');
    if (ct?.options?.url_pattern)
      ok(
        'URL patterns are on',
        `${ct.options.url_prefix}${ct.options.url_pattern.replace(/^\//, '')}`,
      );
    else
      info(
        'URL patterns are off for this stack',
        'fine: Session 1 shows how to set the template URL yourself',
      );

    const { projects = [] } = await studio('/projects').catch(() => ({}));
    const project = projects.find((p) => p.connectedStackApiKey === apiKey);
    if (project)
      info(`Studio project "${project.name}"`, `canvas ${project.canvasUrl ?? '(not set)'}`);
    else info('No Studio project yet', 'expected before Session 1: we create it together');
  } catch (e) {
    fail(
      `Can't read the stack: ${e.message.slice(0, 120)}`,
      'Check the API key in .env, and that you are signed in to its organization.',
    );
  }
}

// ─── 5. Content (what the site actually sees) ────────────────────────────────
section('Published content');
if (apiKey && env.NEXT_PUBLIC_CONTENTSTACK_DELIVERY_TOKEN) {
  const host = CDN[env.NEXT_PUBLIC_CONTENTSTACK_REGION] ?? CDN.us;
  const count = async (ct) => {
    const res = await fetch(
      `https://${host}/v3/content_types/${ct}/entries?environment=${ENVIRONMENT}&include_count=true&limit=1`,
      { headers: { api_key: apiKey, access_token: env.NEXT_PUBLIC_CONTENTSTACK_DELIVERY_TOKEN } },
    );
    if (!res.ok) throw new Error(`${ct}: HTTP ${res.status}`);
    return (await res.json()).count ?? 0;
  };
  try {
    const counts = {
      site_settings: await count('site_settings'),
      home_page: await count('home_page'),
      destination: await count('destination'),
      region: await count('region'),
    };
    const want = { site_settings: 1, home_page: 1, destination: 6, region: 2 };
    const short = Object.entries(want).filter(([k, n]) => counts[k] < n);
    if (short.length)
      fail(
        `Published: ${Object.entries(counts)
          .map(([k, n]) => `${k} ${n}`)
          .join(', ')}`,
        'npm run setup (it publishes everything). Publishing can take a minute.',
      );
    else
      ok(
        'Published',
        `1 site settings, 1 home page, ${counts.destination} destinations, ${counts.region} regions`,
      );
  } catch (e) {
    fail(
      `The Delivery API refused: ${e.message}`,
      'npm run setup (it recreates the delivery token)',
    );
  }
}

// ─── 6. The site ─────────────────────────────────────────────────────────────
section('The site on your laptop');
const home = await status(`${BASE_URL}/`);
if (home === 200) ok(`${BASE_URL} answers`);
else if (home === 0)
  fail(`${BASE_URL} doesn't answer`, 'Start it in another terminal: npm run dev');
else fail(`${BASE_URL} answered ${home}`, 'Look at the npm run dev terminal for the error.');

if (home === 200) {
  const kyoto = await status(`${BASE_URL}/destinations/kyoto`);
  if (kyoto === 200) ok('/destinations/kyoto answers');
  else
    info(
      `/destinations/kyoto answered ${kyoto}`,
      'expected until the Destination template is deployed',
    );
  if (fs.existsSync(path.join(ROOT, 'src/app/canvas/page.tsx'))) {
    const canvas = await status(`${BASE_URL}/canvas`);
    if (canvas === 200) ok('/canvas answers', 'Studio can load your canvas');
    else fail(`/canvas answered ${canvas}`, 'Check src/app/canvas/page.tsx (Session 1).');
  }
}

console.log(
  failures
    ? `\n\x1b[31m\x1b[1m${failures} to fix.\x1b[0m Fix the red lines above, then run npm run doctor again.\n`
    : '\n\x1b[32m\x1b[1mAll green.\x1b[0m Post a screenshot in the Slack channel. You are ready.\n',
);
process.exit(failures ? 1 : 0);
