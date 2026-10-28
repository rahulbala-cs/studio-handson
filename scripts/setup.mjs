/**
 * npm run setup: everything attendees need BEFORE Session 1, in their own org.
 *
 *   the CLI's Studio plugin and your login → the stack → environment, Live
 *   Preview, tokens, content types → sample content → .env
 *
 * It asks at most three things: your region and a browser login (only if the
 * CLI isn't logged in yet), and a name for the stack. An admin-made empty stack
 * is filled instead with: npm run setup -- --api-key <key>
 *
 * No Studio project: creating it is the first thing attendees do in Session 1.
 * Every step is idempotent, so re-running after a failure carries on safely.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');

// The defaults in .env.example (environment, Base URL) are the starting .env.
if (!fs.existsSync(path.join(ROOT, '.env'))) {
  fs.copyFileSync(path.join(ROOT, '.env.example'), path.join(ROOT, '.env'));
}
const keyArg = process.argv.indexOf('--api-key');
if (keyArg > -1) {
  const key = process.argv[keyArg + 1];
  if (!key?.startsWith('blt')) {
    console.error('\n\x1b[31m✗ --api-key needs the stack API key, such as blt0123…\x1b[0m\n');
    process.exit(1);
  }
  // Read by the config loader in every step below.
  const { writeEnv } = await import('./lib/config.mjs');
  writeEnv({ NEXT_PUBLIC_CONTENTSTACK_API_KEY: key });
}

const STEPS = [
  ['00-login.mjs', 'The Contentstack CLI and your login'],
  ['00-create-stack.mjs', 'Your stack'],
  ['01-provision-stack.mjs', 'Environment, Live Preview, tokens and content types'],
  [
    '03-seed-content.mjs',
    'Sample content: 6 destinations, 2 regions, the home page, site settings',
  ],
];

const run = (file) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(HERE, file)], { stdio: 'inherit' });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${file} stopped`))));
  });

try {
  for (const [i, [file, what]] of STEPS.entries()) {
    console.log(`\n\x1b[1m\x1b[7m  ${i + 1}/${STEPS.length}  \x1b[0m \x1b[1m${what}\x1b[0m`);
    await run(file);
  }
  console.log(
    '\n\x1b[32m\x1b[1mDone.\x1b[0m Next: npm run dev, open http://localhost:3000, then npm run doctor.\n',
  );
} catch (e) {
  console.error(
    `\n\x1b[31m✗ ${e.message}.\x1b[0m Fix the error above, then run npm run setup again.\n`,
  );
  process.exit(1);
}
