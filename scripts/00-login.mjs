/**
 * Step 0: the Contentstack CLI, its Studio plugin, and your login.
 *
 * Installs the plugin if it's missing. With no OAuth session, asks for your
 * region and runs the CLI's browser login, where you pick the organization that
 * has Studio. Session 1 needs the same CLI, so this is the only login there is.
 */
import { execSync, spawnSync } from 'node:child_process';
import readline from 'node:readline/promises';
import { resolveAuth, authSource, log, run } from './lib/cma.mjs';

/** The CLI's region names, and the start of the Contentstack address for each. */
const REGIONS = [
  ['AWS-NA', 'app.contentstack.com'],
  ['AWS-EU', 'eu-app.contentstack.com'],
  ['AWS-AU', 'au-app.contentstack.com'],
  ['AZURE-NA', 'azure-na-app.contentstack.com'],
  ['AZURE-EU', 'azure-eu-app.contentstack.com'],
  ['GCP-NA', 'gcp-na-app.contentstack.com'],
  ['GCP-EU', 'gcp-eu-app.contentstack.com'],
];

const sh = (cmd) => {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'], timeout: 60_000 }).toString();
  } catch {
    return null;
  }
};

/** Runs a CLI command in this terminal, so its prompts and browser login work. */
function csdx(...args) {
  const res = spawnSync('csdx', args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (res.status !== 0) throw new Error(`csdx ${args.join(' ')} failed`);
}

async function askRegion() {
  console.log('\n  Which region is your organization in? Look at your Contentstack address:\n');
  REGIONS.forEach(([name, host], i) => console.log(`    ${i + 1}. ${name.padEnd(9)} ${host}`));
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = (await rl.question('\n  Number [1]: ')).trim();
  rl.close();
  const region = REGIONS[(Number(answer) || 1) - 1];
  if (!region)
    throw new Error(`"${answer}" isn't one of the numbers above. Run npm run setup again.`);
  return region[0];
}

run(async () => {
  log.step('Contentstack CLI');
  const version = sh('csdx --version');
  if (!version) {
    throw new Error(
      'The Contentstack CLI is not installed. Run:\n' +
        '    npm install -g @contentstack/cli\n' +
        '  then open a new terminal and run npm run setup again.',
    );
  }
  log.ok(`installed (${version.trim().split(' ')[0]})`);

  if ((sh('csdx plugins') ?? '').includes('@contentstack/studio')) {
    log.skip('Studio plugin already installed');
  } else {
    log.info('adding the Studio plugin (Session 1 registers components with it)…');
    csdx('plugins:install', '@contentstack/studio');
    log.ok('Studio plugin installed');
  }

  log.step('Login');
  // Session 1 runs the CLI itself, so a login from somewhere else (the MCP) isn't enough.
  const source = await resolveAuth().then(authSource, () => null);
  if (source === 'csdx' || source === 'CS_OAUTH_ACCESS_TOKEN') {
    log.skip('already logged in (the next step shows the organization)');
    return;
  }
  if (!process.stdin.isTTY) {
    throw new Error('Not logged in. Run csdx auth:login --oauth, then npm run setup again.');
  }
  const region = await askRegion();
  csdx('config:set:region', region);
  console.log('\n  Your browser opens next. Log in, and pick the organization that has Studio.\n');
  csdx('auth:login', '--oauth');
  log.ok(`logged in (${region})`);
});
