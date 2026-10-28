/**
 * COMPOUND: a row of photos you swipe or scroll through.
 *
 * It takes the whole list of images as ONE prop and lays them out itself, so
 * every slide looks the same and the order is the list's order. No JavaScript:
 * the browser's scroll snapping does the work.
 */
import type { StudioAttributes } from '@contentstack/studio-react';
import { cx } from '@/lib/cx';
import Heading from '../atoms/Heading';

export interface CarouselImage {
  /** The image URL. */
  url?: string | null;
  /** Describes the image; used as its alt text. */
  title?: string | null;
}

export interface CarouselProps {
  /** A heading above the photos. Leave empty for none. */
  title?: string | null;
  /** The photos, in order. */
  images?: CarouselImage[] | null;
  className?: string;
}

export default function Carousel({
  title,
  images,
  className,
  studioAttributes,
}: CarouselProps & StudioAttributes) {
  return (
    <section
      className={cx('container container--light container--space-normal', className)}
      {...studioAttributes}
    >
      <div className="container__inner container__inner--wide">
        <div className="stack stack--vertical stack--gap-medium">
          {title ? <Heading text={title} level="h2" /> : null}
          <div className="carousel" tabIndex={0} aria-label={title || 'Photos'}>
            {(images ?? []).map((img, i) =>
              img?.url ? (
                <figure className="carousel__slide" key={i}>
                  <img
                    className="carousel__img"
                    src={img.url}
                    alt={img.title ?? ''}
                    loading="lazy"
                  />
                </figure>
              ) : null,
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
