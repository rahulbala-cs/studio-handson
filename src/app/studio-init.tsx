'use client';

/**
 * Starts the Studio SDK in the browser and registers your components, on every
 * page. Studio can only connect to an SDK that runs in the browser.
 */
import '@/lib/contentstack';
import '@/studio/register-components';

export function StudioInit() {
  return null;
}
