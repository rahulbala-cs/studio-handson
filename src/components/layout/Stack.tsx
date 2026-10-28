/**
 * Layout: arranges whatever is placed inside it.
 *
 *   vertical    one above the other
 *   horizontal  side by side, sized to content (a menu, a price + link row)
 *   split       two columns, the first a little wider (a hero)
 *   grid        as many columns as fit (a list of cards)
 *
 * `surface: card` makes the Stack a card: a photo with its details below.
 */
import type { ReactNode } from 'react';
import type { StudioAttributes } from '@contentstack/studio-react';
import { cx } from '@/lib/cx';

export type StackDirection = 'vertical' | 'horizontal' | 'split' | 'grid';
export type StackSpace = 'none' | 'small' | 'medium' | 'large';
export type StackAlign = 'start' | 'center' | 'end' | 'stretch' | 'between';
export type StackSurface = 'none' | 'card';

export interface StackProps {
  /** What goes inside the stack. */
  children?: ReactNode;
  /** How the items are arranged. */
  direction?: StackDirection;
  /** Space between the items. */
  gap?: StackSpace;
  /** How the items line up. */
  align?: StackAlign;
  /** card: shows the items as a card. */
  surface?: StackSurface;
  /** Space inside the edges. */
  padding?: StackSpace;
  /**
   * Design prop, for Split and Grid: the column layout, per breakpoint. Studio
   * passes a class name that sets grid-template-columns.
   */
  gridTemplateColumns?: string;
  className?: string;
}

export default function Stack({
  children,
  direction = 'vertical',
  gap = 'medium',
  align = 'start',
  surface = 'none',
  padding = 'none',
  gridTemplateColumns,
  className,
  studioAttributes,
}: StackProps & StudioAttributes) {
  return (
    <div
      className={cx(
        'stack',
        `stack--${direction}`,
        `stack--gap-${gap}`,
        `stack--align-${align}`,
        surface === 'card' && 'stack--card',
        padding !== 'none' && `stack--pad-${padding}`,
        gridTemplateColumns,
        className,
      )}
      {...studioAttributes}
    >
      {children}
    </div>
  );
}
