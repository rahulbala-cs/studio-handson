/**
 * COMPOUND: a hero band, in one component.
 *
 *   text column (eyebrow, title, text, button) | photo
 *
 * The arrangement is fixed in code: the photo is always on the right, and the
 * columns stack on a phone because the CSS says so (`.hero__layout`). In
 * Session 2 the same hero is rebuilt from atoms in Studio, where an author can
 * change all of that without a developer.
 */
import type { StudioAttributes } from '@contentstack/studio-react';
import { cx } from '@/lib/cx';
import Stack from '../layout/Stack';
import Badge from '../atoms/Badge';
import Heading from '../atoms/Heading';
import Text from '../atoms/Text';
import Button from '../atoms/Button';
import Image from '../atoms/Image';

export interface HeroProps {
  /** A short line above the title, such as "8 days". */
  eyebrow?: string | null;
  /** The page title. */
  title?: string | null;
  /** One or two sentences under the title. */
  text?: string | null;
  /** The photo URL. */
  image?: string | null;
  /** Describes the photo for screen readers. */
  imageAlt?: string | null;
  /** The button text. Leave empty for no button. */
  ctaLabel?: string | null;
  /** Where the button goes. */
  ctaUrl?: string | null;
  className?: string;
}

export default function Hero({
  eyebrow,
  title,
  text,
  image,
  imageAlt,
  ctaLabel,
  ctaUrl,
  className,
  studioAttributes,
}: HeroProps & StudioAttributes) {
  return (
    <section
      className={cx('container container--sand container--space-normal hero', className)}
      {...studioAttributes}
    >
      <div className="container__inner container__inner--wide">
        <Stack direction="split" gap="large" align="center" className="hero__layout">
          <Stack gap="medium">
            <Badge text={eyebrow} />
            <Heading text={title} level="h1" />
            <Text text={text} variant="lead" />
            <Button label={ctaLabel} href={ctaUrl} />
          </Stack>
          <Image src={image} alt={imageAlt} ratio="landscape" />
        </Stack>
      </div>
    </section>
  );
}
