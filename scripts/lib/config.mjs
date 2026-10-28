/**
 * Project constants + a tiny .env reader/writer.
 *
 * No dotenv dependency: this reads the one file it owns, and loads it into
 * process.env (without overriding real env vars). The scripts write the ids they
 * create back into .env, so the app and the later scripts agree.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ENV_PATH = path.join(ROOT, '.env');

export function readEnv() {
  if (!fs.existsSync(ENV_PATH)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(ENV_PATH, 'utf8')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#') && l.includes('='))
      .map((l) => {
        const i = l.indexOf('=');
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      }),
  );
}

/** Merge values into .env, keeping everything else (comments are not kept). */
export function writeEnv(values) {
  const merged = { ...readEnv(), ...values };
  const body = [
    '# Written by the provisioning scripts. Never commit this file.',
    '# See .env.example for what each value is.',
    '',
    ...Object.entries(merged)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => `${k}=${v}`),
    '',
  ].join('\n');
  fs.writeFileSync(ENV_PATH, body);
  for (const [k, v] of Object.entries(values)) if (v) process.env[k] = v;
}

for (const [k, v] of Object.entries(readEnv())) {
  if (process.env[k] === undefined && v !== '') process.env[k] = v;
}

const env = process.env;

// ─── Project constants ───────────────────────────────────────────────────────
export const stackApiKey = () => env.NEXT_PUBLIC_CONTENTSTACK_API_KEY ?? '';
export const STACK_NAME = env.STACK_NAME || 'Studio Hands-on';
export const ENVIRONMENT = env.NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT || 'preview';
/** No localization in this boilerplate: everything lives in the master locale. */
export const LOCALE = 'en-us';
/**
 * The environment's Base URL. Studio builds the canvas address as Base URL +
 * Canvas URL. Plain http works for localhost: browsers treat it as secure.
 */
export const BASE_URL = env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

/** Studio's own content type. One per project; the project points at it by uid. */
export const COMPOSITIONS_CT = 'compositions';
export const STUDIO_PROJECT_NAME = 'Wayfarer';
export const CANVAS_URL = '/canvas';

export const environmentUid = () => env.CONTENTSTACK_ENVIRONMENT_UID ?? '';
export const studioProjectUid = () => env.STUDIO_PROJECT_UID ?? '';

/** Every script after the first needs a stack. */
export function requireStack() {
  const key = stackApiKey();
  if (!key) {
    throw new Error(
      'No stack API key in .env. Run `npm run setup` (it creates the stack), or set\n' +
        '  NEXT_PUBLIC_CONTENTSTACK_API_KEY to the API key of an empty stack.',
    );
  }
  return key;
}
