/**
 * Atom: one link, styled as a button or as a plain text link.
 * Label and link are separate props on purpose: each one shows one field.
 */
import type { StudioAttributes } from '@contentstack/studio-react';
import { cx } from '@/lib/cx';

export type ButtonVariant = 'primary' | 'secondary' | 'link';

export interface ButtonProps {
  /** The button text. */
  label?: string | null;
  /** Where the button goes. */
  href?: string | null;
  /** primary: solid teal · secondary: outlined · link: underlined text. */
  variant?: ButtonVariant;
  className?: string;
}

export default function Button({
  label,
  href,
  variant = 'primary',
  className,
  studioAttributes,
}: ButtonProps & StudioAttributes) {
  return (
    <a
      className={cx('button', `button--${variant}`, className)}
      href={href || '#'}
      {...studioAttributes}
    >
      {label}
    </a>
  );
}
