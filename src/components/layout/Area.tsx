/**
 * Layout: one drop zone of a Stack. Studio adds and removes Areas to match the
 * Stack's Areas count, so an author never places one by hand. An Area decides
 * only how the items dropped into it line up; widths belong to the Stack.
 * It reuses the Stack's classes, so it lines items up exactly as a Stack would.
 */
import type { ReactNode } from 'react';
import type { StudioAttributes } from '@contentstack/studio-react';
import { cx } from '@/lib/cx';
import type { StackAlign, StackSpace } from './Stack';

export type AreaArrange = 'vertical' | 'horizontal' | 'grid';

export interface AreaProps {
  /** What is dropped into this area. */
  children?: ReactNode;
  /** vertical: one above the other · horizontal: in a row · grid: as many columns as fit. */
  direction?: AreaArrange;
  /** Space between the items. */
  gap?: StackSpace;
  /** How the items line up. */
  align?: StackAlign;
  className?: string;
}

export default function Area({
  children,
  direction = 'vertical',
  gap = 'medium',
  align = 'start',
  className,
  studioAttributes,
}: AreaProps & StudioAttributes) {
  return (
    <div
      className={cx(
        'stack',
        'stack__area',
        `stack--${direction}`,
        `stack--gap-${gap}`,
        `stack--align-${align}`,
        className,
      )}
      {...studioAttributes}
    >
      {children}
    </div>
  );
}
