/**
 * COMPOUND: the site header, in one component.
 *
 * Logo, site name and menu always appear together, in this order. The layout
 * is fixed here, in code: an author fills in the props but can't rearrange it.
 */
import type { StudioAttributes } from '@contentstack/studio-react';
import { cx } from '@/lib/cx';
import Image from '../atoms/Image';
import Button from '../atoms/Button';

export interface HeaderLink {
  label?: string | null;
  url?: string | null;
}

export interface HeaderProps {
  /** The logo image URL. */
  logo?: string | null;
  /** The site name, shown next to the logo. */
  siteName?: string | null;
  /** The menu: one link per item. */
  links?: HeaderLink[] | null;
  className?: string;
}

export default function Header({
  logo,
  siteName,
  links,
  className,
  studioAttributes,
}: HeaderProps & StudioAttributes) {
  return (
    <header
      className={cx('container container--light container--space-compact site-header', className)}
      {...studioAttributes}
    >
      <div className="container__inner container__inner--wide">
        <div className="stack stack--horizontal stack--gap-medium stack--align-between">
          <a className="brand" href="/">
            <Image src={logo} alt="" className="brand__logo" />
            <span className="brand__name">{siteName}</span>
          </a>
          <nav className="stack stack--horizontal stack--gap-medium" aria-label="Main">
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
    </header>
  );
}
