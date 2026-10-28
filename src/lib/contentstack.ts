/**
 * The Contentstack stack, Live Preview and the Studio SDK, in one place.
 * Pages read entries through `stack`; templates come through `sdk`.
 */
import contentstack from '@contentstack/delivery-sdk';
import { studioSdk } from '@contentstack/studio-react';

export const apiKey = process.env.NEXT_PUBLIC_CONTENTSTACK_API_KEY!;
export const deliveryToken = process.env.NEXT_PUBLIC_CONTENTSTACK_DELIVERY_TOKEN!;
export const environment = process.env.NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT!;
// Lets Studio and Live Preview show unsaved changes. Never set it on a public site.
export const previewToken = process.env.NEXT_PUBLIC_CONTENTSTACK_PREVIEW_TOKEN;

// Every region has its own hosts. `npm run setup` writes your region into .env.
const REGIONS = {
  us: {
    cdn: 'cdn.contentstack.io',
    preview: 'rest-preview.contentstack.com',
    app: 'app.contentstack.com',
  },
  eu: {
    cdn: 'eu-cdn.contentstack.com',
    preview: 'eu-rest-preview.contentstack.com',
    app: 'eu-app.contentstack.com',
  },
  au: {
    cdn: 'au-cdn.contentstack.com',
    preview: 'au-rest-preview.contentstack.com',
    app: 'au-app.contentstack.com',
  },
  'azure-na': {
    cdn: 'azure-na-cdn.contentstack.com',
    preview: 'azure-na-rest-preview.contentstack.com',
    app: 'azure-na-app.contentstack.com',
  },
  'azure-eu': {
    cdn: 'azure-eu-cdn.contentstack.com',
    preview: 'azure-eu-rest-preview.contentstack.com',
    app: 'azure-eu-app.contentstack.com',
  },
  'gcp-na': {
    cdn: 'gcp-na-cdn.contentstack.com',
    preview: 'gcp-na-rest-preview.contentstack.com',
    app: 'gcp-na-app.contentstack.com',
  },
  'gcp-eu': {
    cdn: 'gcp-eu-cdn.contentstack.com',
    preview: 'gcp-eu-rest-preview.contentstack.com',
    app: 'gcp-eu-app.contentstack.com',
  },
} as const;

type Region = keyof typeof REGIONS;
const region = (process.env.NEXT_PUBLIC_CONTENTSTACK_REGION ?? 'us') as Region;
export const hosts = REGIONS[region] ?? REGIONS.us;

export const stack = contentstack.stack({
  apiKey,
  deliveryToken,
  environment,
  host: hosts.cdn,
  // Live Preview: Studio passes a preview hash, and the SDK then reads drafts.
  ...(previewToken
    ? { live_preview: { enable: true, preview_token: previewToken, host: hosts.preview } }
    : {}),
});

// In the browser, Live Preview lets Studio show unsaved edits. A failure here
// must not stop studioSdk.init below, or Studio reports "SDK Not Initialized".
if (typeof window !== 'undefined' && previewToken) {
  import('@contentstack/live-preview-utils')
    .then(({ default: ContentstackLivePreview }) =>
      ContentstackLivePreview.init({
        enable: true,
        mode: 'builder',
        ssr: true,
        stackDetails: { apiKey, environment },
        clientUrlParams: { host: hosts.app },
        // No floating edit buttons on the page: editing happens in Studio.
        editButton: { enable: false },
        editInVisualBuilderButton: { enable: false },
      }),
    )
    .catch((err) => console.warn('Live Preview init failed. Continuing without it.', err));
}

// The Studio SDK. `contentTypeUid` is where Studio stores templates and
// Sections: set when the Studio project is created, `compositions` by default.
export const sdk = studioSdk.init({ stackSdk: stack, contentTypeUid: 'compositions' });
