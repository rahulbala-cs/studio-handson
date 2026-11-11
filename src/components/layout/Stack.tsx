/**
 * Layout: places its Areas. Authors drop things into an Area, never into the
 * Stack itself: Studio adds or removes Areas to match the Areas number.
 *
 *   split       side by side, one equal column per Area (a hero)
 *   vertical    one above the other (a card: photo, then details)
 *   horizontal  in a row, sized to content (a price + link row)
 *   grid        as many columns as fit
 *
 * Each Area then lines up its own items (src/components/layout/Area.tsx).
 * `surface: card` makes the Stack a card: a photo with its details below.
 * Stacks saved before Areas existed hold their items directly; they still render.
 */
import type { CSSProperties, ReactNode } from 'react';
import type { StudioAttributes } from '@contentstack/studio-react';
import { cx } from '@/lib/cx';

export type StackDirection = 'vertical' | 'horizontal' | 'split' | 'grid';
export type StackSpace = 'none' | 'small' | 'medium' | 'large';
export type StackAlign = 'start' | 'center' | 'end' | 'stretch' | 'between';
export type StackSurface = 'none' | 'card';

export interface StackProps {
  /** What goes inside the stack: its Areas (older Stacks hold items directly). */
  children?: ReactNode;
  /** How many Areas. Side by side (split), they get equal columns unless Widths says otherwise. */
  areas?: number;
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
  areas = 2,
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
      style={{ '--areas': areas } as CSSProperties}
      {...studioAttributes}
    >
      {children}
    </div>
  );
}
