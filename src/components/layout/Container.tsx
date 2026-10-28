/**
 * Layout: a full-width band with a centred column inside.
 * It renders no content of its own; whatever is placed inside fills `children`.
 */
import type { ReactNode } from 'react';
import type { StudioAttributes } from '@contentstack/studio-react';
import { cx } from '@/lib/cx';

export type ContainerTone = 'light' | 'sand' | 'teal';
export type ContainerWidth = 'narrow' | 'normal' | 'wide';
export type ContainerSpacing = 'compact' | 'normal' | 'spacious';

export interface ContainerProps {
  /** What goes inside the band. */
  children?: ReactNode;
  /** Background colour of the band. */
  tone?: ContainerTone;
  /** How wide the centred column is. */
  width?: ContainerWidth;
  /** Space above and below the content. */
  spacing?: ContainerSpacing;
  /** Optional id, so a link like "/#trips" can jump here. */
  anchor?: string | null;
  className?: string;
}

export default function Container({
  children,
  tone = 'light',
  width = 'wide',
  spacing = 'normal',
  anchor,
  className,
  studioAttributes,
}: ContainerProps & StudioAttributes) {
  return (
    <section
      id={anchor || undefined}
      className={cx('container', `container--${tone}`, `container--space-${spacing}`, className)}
      {...studioAttributes}
    >
      <div className={cx('container__inner', `container__inner--${width}`)}>{children}</div>
    </section>
  );
}
