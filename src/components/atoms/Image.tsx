/** Atom: one image. */
import type { StudioAttributes } from '@contentstack/studio-react';
import { cx } from '@/lib/cx';

export type ImageRatio = 'auto' | 'landscape' | 'square' | 'wide';

export interface ImageProps {
  /** The image URL. */
  src?: string | null;
  /** Describes the image for screen readers. */
  alt?: string | null;
  /** The image's shape: auto keeps the photo's own shape. */
  ratio?: ImageRatio;
  className?: string;
}

export default function Image({
  src,
  alt,
  ratio = 'auto',
  className,
  studioAttributes,
}: ImageProps & StudioAttributes) {
  const classes = cx('img', `img--${ratio}`, className);
  // No image yet: an empty box, hidden from visitors (see globals.css).
  if (!src) return <div className={cx(classes, 'img--empty')} {...studioAttributes} />;
  return <img className={classes} src={src} alt={alt ?? ''} {...studioAttributes} />;
}
