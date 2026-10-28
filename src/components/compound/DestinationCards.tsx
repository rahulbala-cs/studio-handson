/**
 * COMPOUND: a titled grid of trip cards, in one component.
 *
 * It takes the whole list of destinations as ONE prop and draws a card for each
 * one. Every card is built from the atoms, but the card's layout is fixed here:
 *
 *   Image (landscape)
 *   Badge          ← duration
 *   Heading (h3)   ← title
 *   Text           ← tagline
 *   Text (strong)  ← price  ·  Button (link) ← url
 *
 * In Session 3 the same card is built from atoms in Studio and repeated with a
 * Repeater, so an author can change it.
 */
import type { StudioAttributes } from '@contentstack/studio-react';
import { cx } from '@/lib/cx';
import Stack from '../layout/Stack';
import Image from '../atoms/Image';
import Badge from '../atoms/Badge';
import Heading from '../atoms/Heading';
import Text from '../atoms/Text';
import Button from '../atoms/Button';

/** One destination entry, as Contentstack delivers it. */
export interface DestinationSummary {
  title?: string | null;
  url?: string | null;
  tagline?: string | null;
  image?: { url?: string | null } | null;
  image_alt?: string | null;
  duration?: string | null;
  price?: string | null;
}

export interface DestinationCardsProps {
  /** The heading above the cards. */
  title?: string | null;
  /** A short line beside the heading. */
  intro?: string | null;
  /** The destinations to show, one card each. */
  destinations?: DestinationSummary[] | null;
  /** The link text on every card. */
  buttonLabel?: string | null;
  className?: string;
}

export default function DestinationCards({
  title,
  intro,
  destinations,
  buttonLabel = 'View trip',
  className,
  studioAttributes,
}: DestinationCardsProps & StudioAttributes) {
  return (
    <section
      className={cx('container container--light container--space-normal', className)}
      {...studioAttributes}
    >
      <div className="container__inner container__inner--wide">
        <Stack gap="large">
          <Stack direction="horizontal" align="between" gap="medium">
            <Heading text={title} level="h2" />
            <Text text={intro} className="section-note" />
          </Stack>
          <Stack direction="grid" gap="large" align="start">
            {(destinations ?? []).map((d, i) => (
              <Stack surface="card" gap="medium" align="stretch" key={d.url ?? i}>
                <Image src={d.image?.url} alt={d.image_alt} ratio="landscape" />
                <Stack gap="small">
                  <Badge text={d.duration} />
                  <Heading text={d.title} level="h3" />
                  <Text text={d.tagline} />
                  <Stack direction="horizontal" align="between">
                    <Text text={d.price} variant="strong" />
                    <Button label={buttonLabel} href={d.url} variant="link" />
                  </Stack>
                </Stack>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </div>
    </section>
  );
}
