/**
 * npm run upgrade: bring a stack set up by an earlier version of this repo up
 * to date (see scripts/lib/upgrades.mjs). Safe to run any number of times.
 *
 * You rarely need to run it yourself: `npm run setup`, `npm run catchup` and
 * `npm run dev` run it first, and `npm run doctor` says when it is needed.
 *
 *   --before-dev   what `npm run dev` runs: says nothing when there is nothing
 *                  to do, and never stops the site from starting. A network or
 *                  login problem is a warning.
 */
import { resolveAuth, log, run } from './lib/cma.mjs';
import { requireStack } from './lib/config.mjs';
import { pendingUpgrades, runUpgrades } from './lib/upgrades.mjs';

const beforeDev = process.argv.includes('--before-dev');

if (beforeDev) {
  let stack;
  try {
    stack = requireStack();
  } catch {
    process.exit(0); // No stack yet (before npm run setup): nothing to upgrade.
  }
  let todo;
  try {
    // The check is one read; don't hold the site up if Contentstack is slow.
    todo = await Promise.race([
      resolveAuth().then(() => pendingUpgrades(stack)),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Contentstack did not answer in 20 seconds')), 20_000),
      ),
    ]);
  } catch (e) {
    log.warn(`Could not check your stack for upgrades: ${e.message.split('\n')[0]}`);
    log.info('The site starts anyway. When you are back online: npm run upgrade');
    process.exit(0);
  }
  if (todo.length) {
    try {
      await runUpgrades(stack, todo);
    } catch (e) {
      log.warn(`The upgrade stopped: ${e.message.split('\n')[0]}`);
      log.info('Your content is intact. The site starts anyway; run npm run upgrade to finish.');
    }
  }
  process.exit(0);
}

run(async () => {
  await resolveAuth();
  const done = await runUpgrades(requireStack());
  if (!done.length) log.ok('Your stack is up to date.');
});
