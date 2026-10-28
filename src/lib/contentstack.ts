/**
 * The Contentstack Delivery SDK: how this site reads content.
 *
 * No React in here, so both the server and (later) the browser can import it.
 */
import contentstack from '@contentstack/delivery-sdk';

export const apiKey = process.env.NEXT_PUBLIC_CONTENTSTACK_API_KEY!;
export const deliveryToken = process.env.NEXT_PUBLIC_CONTENTSTACK_DELIVERY_TOKEN!;
export const environment = process.env.NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT!;

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
});
