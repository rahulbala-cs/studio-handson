/** COMPOUND: the site footer, in one component. Its layout is fixed in code. */
import type { StudioAttributes } from '@contentstack/studio-react';
import { cx } from '@/lib/cx';
import Text from '../atoms/Text';
import Button from '../atoms/Button';

export interface FooterLink {
  label?: string | null;
  url?: string | null;
}

export interface FooterProps {
  /** The site name. */
  siteName?: string | null;
  /** A line of small print. */
  text?: string | null;
  /** The footer menu: one link per item. */
  links?: FooterLink[] | null;
  className?: string;
}

export default function Footer({
  siteName,
  text,
  links,
  className,
  studioAttributes,
}: FooterProps & StudioAttributes) {
  return (
    <footer
      className={cx('container container--teal container--space-normal site-footer', className)}
      {...studioAttributes}
    >
      <div className="container__inner container__inner--wide">
        <div className="stack stack--horizontal stack--gap-large stack--align-between">
          <div className="stack stack--vertical stack--gap-small">
            <span className="brand__name">{siteName}</span>
            <Text text={text} variant="small" />
          </div>
          <nav className="stack stack--horizontal stack--gap-medium" aria-label="Footer">
            {(links ?? []).map((link, i) => (
              <Button
                key={i}
                label={link.label}
                href={link.url}
                variant="link"
                className="menu-link"
              />
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
