/**
 * One page per destination, the way most sites are built today: the LAYOUT
 * IS IN CODE. Every trip page has exactly this arrangement, because this file
 * says so. Session 1 deletes it and builds the same page as a Studio template.
 */
import { notFound } from 'next/navigation';
import { getDestination, getSiteSettings } from '@/lib/content';
import Header from '@/components/compound/Header';
import Hero from '@/components/compound/Hero';
import Carousel from '@/components/compound/Carousel';
import DestinationCards from '@/components/compound/DestinationCards';
import Footer from '@/components/compound/Footer';
import Container from '@/components/layout/Container';
import Stack from '@/components/layout/Stack';
import Badge from '@/components/atoms/Badge';
import Heading from '@/components/atoms/Heading';
import Text from '@/components/atoms/Text';
import Image from '@/components/atoms/Image';

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [site, trip] = await Promise.all([
    getSiteSettings(),
    getDestination(`/destinations/${slug}`),
  ]);
  if (!trip) notFound();

  return (
    <>
      <Header logo={site?.logo?.url} siteName={site?.site_name} links={site?.nav_links} />
      <Hero
        eyebrow={trip.duration}
        title={trip.title}
        text={trip.tagline}
        image={trip.image?.url}
        imageAlt={trip.image_alt}
        ctaLabel="Enquire about this trip"
        ctaUrl="mailto:hello@wayfarer.example"
      />
      <Carousel title="In pictures" images={trip.gallery} />

      {/* The itinerary: a list of blocks of three kinds, each drawn its own way. */}
      <Container width="normal">
        <Stack gap="large">
          <Heading text="The trip, day by day" level="h2" />
          {(trip.itinerary ?? []).map((block, i) => {
            if ('day' in block)
              return (
                <Stack gap="small" key={i}>
                  <Badge text={block.day.label} />
                  <Heading text={block.day.title} level="h3" />
                  <Text text={block.day.text} />
                </Stack>
              );
            if ('quote' in block)
              return (
                <Stack gap="small" key={i}>
                  <Text text={`“${block.quote.quote}”`} variant="lead" />
                  <Text text={block.quote.name} variant="small" />
                </Stack>
              );
            return (
              <Stack gap="small" key={i}>
                <Image src={block.photo.image?.url} alt={block.photo.caption} ratio="wide" />
                <Text text={block.photo.caption} variant="small" />
              </Stack>
            );
          })}
        </Stack>
      </Container>

      <DestinationCards
        title="Similar trips"
        intro="If this one appeals, you might like these too."
        destinations={trip.related_trips}
      />
      <Footer siteName={site?.site_name} text={site?.footer_text} links={site?.nav_links} />
    </>
  );
}
