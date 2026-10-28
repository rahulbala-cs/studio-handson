/**
 * The canvas's Desktop / Tablet / Mobile switcher.
 *
 * The first entry is the base: no media query. Narrower breakpoints follow,
 * widest first, and inherit every value until an author overrides it there.
 * After changing this file, push it to your Studio project:
 *
 *   csdx studio:responsive-options:sync --file-path=src/studio/breakpoints.ts
 *
 * The CLI can only read values written inline, like these.
 */
import { registerBreakpoints } from '@contentstack/studio-react';

registerBreakpoints([
  { id: 'default', displayName: 'Desktop', previewSize: { width: 1440, height: 900 } },
  {
    id: 'tablet',
    displayName: 'Tablet',
    query: '(max-width: 1024px)',
    previewSize: { width: 834, height: 1112 },
  },
  {
    id: 'mobile',
    displayName: 'Mobile',
    query: '(max-width: 640px)',
    previewSize: { width: 390, height: 844 },
  },
]);
