/**
 * npm run catchup -- <session>
 *
 * Rebuilds, in YOUR stack, everything the earlier sessions did in Studio: the
 * project and its settings, every Section and Template (deployed), and from
 * Session 2 on the breakpoints. So you can join the next session even if you
 * missed one or something broke. Run it after switching to the matching code:
 *
 *   npm run catchup -- 2     git switch session-2-start     (Session 1's result)
 *   npm run catchup -- 3     git switch session-3-start     (Sessions 1-2)
 *   npm run catchup -- 4     git switch session-4-start     (Sessions 1-3)
 *   npm run catchup -- final git switch final              (all four)
 *
 * It replaces Sections and Templates that have the same names, and asks first.
 * Anything else you built is left alone. Add --yes to skip the question.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { resolveAuth, cma, log, run } from './lib/cma.mjs';
import { upsertComposition, findCompositionByTitle } from './lib/composition.mjs';
import { requireStack, COMPOSITIONS_CT, ROOT } from './lib/config.mjs';
import { ensureProject } from './lib/studio-project.mjs';
import { stage1 } from './lib/stages/s1.mjs';
import { stage2 } from './lib/stages/s2.mjs';
import { stage3 } from './lib/stages/s3.mjs';
import { stage4 } from './lib/stages/s4.mjs';

const RESULTS = {
  2: { label: 'Session 1', steps: stage1, freeform: false, branch: 'session-2-start' },
  3: { label: 'Session 2', steps: stage2, freeform: false, branch: 'session-3-start' },
  4: { label: 'Session 3', steps: stage3, freeform: false, branch: 'session-4-start' },
  final: { label: 'Session 4', steps: stage4, freeform: true, branch: 'final' },
};

const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith('-'));
const yes = args.includes('--yes') || args.includes('-y');

/** The entries the freeform page pins, looked up by title. */
async function loadContext(apiKey) {
  const byTitle = async (contentType, title) => {
    const q = encodeURIComponent(JSON.stringify({ title }));
    const res = await cma(apiKey, `/content_types/${contentType}/entries?query=${q}`);
    return (res.entries ?? [])[0];
  };
  const settings = await byTitle('site_settings', 'Site Settings');
  const europe = await byTitle('region', 'Europe');
  if (!settings || !europe) throw new Error('Sample content is missing: run npm run setup first.');
  return { settingsUid: settings.uid, europeUid: europe.uid };
}

run(async () => {
  const result = RESULTS[target];
  if (!result) {
    throw new Error(
      `Which session are you about to join? npm run catchup -- ${Object.keys(RESULTS).join(' | ')}`,
    );
  }
  await resolveAuth();
  const apiKey = requireStack();
  console.log(`\n\x1b[1mCatching up: everything up to the end of ${result.label}\x1b[0m`);

  const projectUid = await ensureProject(apiKey, { freeform: result.freeform });
  const ctx = await loadContext(apiKey);

  // Build every entry first (cheap, offline), so nothing is written if one is wrong.
  log.step('What will be rebuilt');
  const titles = [];
  for (const step of result.steps) {
    const sample = step.build(new Proxy({}, { get: () => ({ uid: 'pending' }) }), ctx);
    titles.push(sample.title);
    const exists = await findCompositionByTitle(sample.title);
    log.info(
      `${sample.place_composition_as === 'page' ? 'Template' : 'Section '} ${sample.title}${exists ? '  \x1b[33m(replaces yours)\x1b[0m' : ''}`,
    );
  }

  if (!yes) {
    if (!process.stdin.isTTY) throw new Error('Run it in a terminal, or add --yes.');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question('\n  Go ahead? (y/N) ');
    rl.close();
    if (!/^y/i.test(answer.trim())) {
      log.warn('Nothing changed.');
      return;
    }
  }

  log.step('Building');
  const built = {};
  for (const step of result.steps) {
    const entry = step.build(built, ctx);
    const { uid, created } = await upsertComposition(entry);
    built[step.key] = { uid, title: entry.title };
    log.ok(`${created ? 'created' : 'replaced'} ${entry.title} (published)`);
  }

  // Two templates for the same content type fight over the same URLs.
  const { entries = [] } = await cma(
    apiKey,
    `/content_types/${COMPOSITIONS_CT}/entries?query=${encodeURIComponent(JSON.stringify({ place_composition_as: 'page' }))}`,
  );
  const ours = new Set(titles);
  const rivals = entries.filter(
    (e) =>
      !ours.has(e.title) &&
      ['destination', 'home_page', 'region'].includes(e.connected_content_type),
  );
  for (const r of rivals) {
    log.warn(
      `Your template "${r.title}" is also connected to ${r.connected_content_type}: its URLs may win over these. Delete it or change its URL in Studio.`,
    );
  }

  // Session 2 sends the breakpoints to the project with the CLI; do the same.
  const breakpoints = 'src/studio/breakpoints.ts';
  if (target !== '2' && fs.existsSync(path.join(ROOT, breakpoints))) {
    log.step('Breakpoints');
    const csdx = (...a) =>
      spawnSync('csdx', a, { stdio: 'inherit', shell: process.platform === 'win32' }).status === 0;
    if (
      csdx('studio:project:set', `--project-id=${projectUid}`) &&
      csdx('studio:responsive-options:sync', `--file-path=${breakpoints}`)
    ) {
      log.ok('synced to your project');
    } else {
      log.warn(`not synced. Run: csdx studio:responsive-options:sync --file-path=${breakpoints}`);
    }
  }

  console.log(
    `\n\x1b[32m\x1b[1mDone.\x1b[0m Your code should match: \x1b[1mgit switch ${result.branch}\x1b[0m, then npm run dev.\n`,
  );
});
