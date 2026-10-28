import 'server-only';

/**
 * The plain site's data: one function per page, each asking for exactly the
 * entries that page shows. This file goes away in Session 1, when Studio takes
 * over deciding what a page shows.
 */
import { stack } from './contentstack';
import type { HeaderLink } from '@/components/compound/Header';
import type { DestinationSummary } from '@/components/compound/DestinationCards';


type Asset = { url?: string; title?: string } | null;

export interface SiteSettings {
  site_name?: string;
  logo?: Asset;
  nav_links?: HeaderLink[];
  footer_text?: string;
}

export interface HomePage {
  title: string;
  hero?: {
    eyebrow?: string;
    headline?: string;
    subheadline?: string;
    image?: Asset;
    image_alt?: string;
    cta_label?: string;
    cta_url?: string;
  };
  featured_destinations?: DestinationSummary[];
}

export type ItineraryBlock =
  | { day: { label?: string; title?: string; text?: string } }
  | { quote: { quote?: string; name?: string } }
  | { photo: { image?: Asset; caption?: string } };

export interface Destination extends DestinationSummary {
  gallery?: NonNullable<Asset>[];
  itinerary?: ItineraryBlock[];
  related_trips?: DestinationSummary[];
}

export async function getSiteSettings() {
  const res = await stack.contentType('site_settings').entry().query().find<SiteSettings>();
  return res.entries?.[0] ?? null;
}

export async function getHomePage() {
  const res = await stack
    .contentType('home_page')
    .entry()
    .includeReference('featured_destinations')
    .query()
    .find<HomePage>();
  return res.entries?.[0] ?? null;
}

export async function getDestination(url: string) {
  const res = await stack
    .contentType('destination')
    .entry()
    .includeReference('related_trips')
    .query({ url })
    .find<Destination>();
  return res.entries?.[0] ?? null;
}
