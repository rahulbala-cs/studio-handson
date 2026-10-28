/** Atom: one paragraph of plain text. */
import type { StudioAttributes } from '@contentstack/studio-react';
import { cx } from '@/lib/cx';

export type TextVariant = 'body' | 'lead' | 'small' | 'strong';

export interface TextProps {
  /** The paragraph text. */
  text?: string | null;
  /** body: normal prose · lead: a larger intro · small: fine print · strong: a fact, such as a price. */
  variant?: TextVariant;
  className?: string;
}

export default function Text({
  text,
  variant = 'body',
  className,
  studioAttributes,
}: TextProps & StudioAttributes) {
  // Empty field, nothing drawn: a Section reused where this field is missing leaves no gap.
  if (!text) return null;
  return (
    <p className={cx('text', `text--${variant}`, className)} {...studioAttributes}>
      {text}
    </p>
  );
}
