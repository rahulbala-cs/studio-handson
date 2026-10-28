/** Atom: one short fact set in colour, such as "8 days". */
import type { StudioAttributes } from '@contentstack/studio-react';
import { cx } from '@/lib/cx';

export type BadgeTone = 'accent' | 'neutral' | 'dark' | 'sale';

export interface BadgeProps {
  /** The badge text. */
  text?: string | null;
  /** accent: teal · neutral: grey · dark: ink · sale: a terracotta pill. */
  tone?: BadgeTone;
  className?: string;
}

export default function Badge({
  text,
  tone = 'accent',
  className,
  studioAttributes,
}: BadgeProps & StudioAttributes) {
  // Empty field, nothing drawn: a Section reused where this field is missing leaves no gap.
  if (!text) return null;
  return (
    <span className={cx('badge', `badge--${tone}`, className)} {...studioAttributes}>
      {text}
    </span>
  );
}
