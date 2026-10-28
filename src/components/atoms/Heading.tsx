/** Atom: one heading. Renders ONE piece of content, nothing else. */
import type { StudioAttributes } from '@contentstack/studio-react';
import { cx } from '@/lib/cx';

export type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4';

export interface HeadingProps {
  /** The heading text. */
  text?: string | null;
  /** h1 is the page title; h2 a section title; h3/h4 smaller titles. */
  level?: HeadingLevel;
  /** Design prop: Studio passes a class name that sets text-align per breakpoint. */
  textAlign?: string;
  className?: string;
}

export default function Heading({
  text,
  level = 'h2',
  textAlign,
  className,
  studioAttributes,
}: HeadingProps & StudioAttributes) {
  const Tag = level;
  return (
    <Tag className={cx('heading', `heading--${level}`, textAlign, className)} {...studioAttributes}>
      {text}
    </Tag>
  );
}
