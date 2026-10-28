/**
 * The home page, the way most sites are built today: the LAYOUT IS IN CODE.
 *
 * This file decides which components appear and in what order. Moving the
 * trips above the hero, or adding a section, means editing this file and
 * releasing the site. Session 1 deletes it and hands the layout to Studio.
 */
import { notFound } from 'next/navigation';
import { getHomePage, getSiteSettings } from '@/lib/content';
import Header from '@/components/compound/Header';
import Hero from '@/components/compound/Hero';
import DestinationCards from '@/components/compound/DestinationCards';
import Footer from '@/components/compound/Footer';

export default async function HomePage() {
  const [site, home] = await Promise.all([getSiteSettings(), getHomePage()]);
  if (!home) notFound();

  return (
    <>
      <Header logo={site?.logo?.url} siteName={site?.site_name} links={site?.nav_links} />
      <Hero
        eyebrow={home.hero?.eyebrow}
        title={home.hero?.headline}
        text={home.hero?.subheadline}
        image={home.hero?.image?.url}
        imageAlt={home.hero?.image_alt}
        ctaLabel={home.hero?.cta_label}
        ctaUrl={home.hero?.cta_url}
      />
      <DestinationCards
        title="Where we go"
        intro="Six places we know well, each with a guide who lives there."
        destinations={home.featured_destinations}
      />
      <Footer siteName={site?.site_name} text={site?.footer_text} links={site?.nav_links} />
    </>
  );
}
