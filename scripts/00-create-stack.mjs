/**
 * Step 1: the stack.
 *
 * With no API key in .env, shows the organization you're logged in to, checks
 * that it has Studio, asks for a stack name, and creates the stack there. With
 * an API key (an empty stack an admin made for you), checks that the stack
 * exists and records which organization it lives in (the Studio API is scoped
 * by organization, not by stack).
 */
import os from 'node:os';
import readline from 'node:readline/promises';
import {
  resolveAuth,
  cma,
  cmaOrg,
  orgUid,
  setOrgUid,
  authRegion,
  studio,
  log,
  run,
} from './lib/cma.mjs';
import { stackApiKey, LOCALE, writeEnv } from './lib/config.mjs';

const PLACEHOLDER = 'Studio Hands-on - Your Name';

async function orgName(uid) {
  const { organizations = [] } = await cmaOrg('/organizations?limit=100').catch(() => ({}));
  return organizations.find((o) => o.uid === uid)?.name ?? uid;
}

/** Asks one question; answers the default when there's no terminal to ask in. */
async function ask(question, fallback) {
  if (!process.stdin.isTTY) return fallback;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = (await rl.question(`  ${question} `)).trim();
  rl.close();
  return answer || fallback;
}

run(async () => {
  await resolveAuth();
  log.step('Stack');

  const existingKey = stackApiKey();
  if (existingKey) {
    const { stack } = await cma(existingKey, '/stacks');
    setOrgUid(stack.org_uid);
    writeEnv({ CS_ORG_UID: stack.org_uid });
    log.skip(`using "${stack.name}" (${existingKey}) in ${await orgName(stack.org_uid)}`);
    return;
  }

  const org = orgUid();
  const name = await orgName(org);
  log.info(`organization: ${name} (${authRegion()})`);
  // Studio projects are org-scoped: an org without Studio rejects this call.
  try {
    await studio('/projects');
    log.ok('Studio is available in this organization');
  } catch (e) {
    throw new Error(
      `Studio isn't available in "${name}" (${e.message.slice(0, 80)}).\n` +
        '  Pick an organization that has Studio: csdx auth:logout, then npm run setup again.',
    );
  }

  const fromEnv = process.env.STACK_NAME;
  const suggested = `Studio Hands-on - ${os.userInfo().username}`;
  const stackName =
    fromEnv && fromEnv !== PLACEHOLDER
      ? fromEnv
      : await ask(`Name for your new stack [${suggested}]:`, suggested);

  // Never adopt a stack by name: a stack you didn't mean could already hold content.
  const { stacks = [] } = await cmaOrg('/stacks');
  const clash = stacks.find((s) => s.name === stackName);
  if (clash) {
    throw new Error(
      `A stack named "${stackName}" already exists in this organization (${clash.api_key}).\n` +
        '  Run npm run setup again and pick another name, or, to fill that stack,\n' +
        `  run: npm run setup -- --api-key ${clash.api_key}`,
    );
  }
  const go = await ask(`Create "${stackName}" in ${name}? [Y/n]`, 'y');
  if (!/^y/i.test(go)) {
    throw new Error(
      'Nothing created. To use another organization: csdx auth:logout, then npm run setup.',
    );
  }

  const { stack } = await cmaOrg('/stacks', {
    method: 'POST',
    body: {
      stack: {
        name: stackName,
        description: 'Contentstack Studio hands-on boilerplate.',
        master_locale: LOCALE,
      },
    },
  });
  writeEnv({
    STACK_NAME: stackName,
    NEXT_PUBLIC_CONTENTSTACK_API_KEY: stack.api_key,
    CS_ORG_UID: org,
  });
  log.ok(`created "${stack.name}" (${stack.api_key}) in ${name}`);
  log.info('API key written to .env');
});
