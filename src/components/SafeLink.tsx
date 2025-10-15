import { Link, LinkProps } from 'react-router-dom';
import { isExternalUrl } from '@/routes/paths';
import { AnchorHTMLAttributes, forwardRef } from 'react';

interface SafeLinkProps extends Omit<LinkProps, 'to'> {
  to: string;
  external?: boolean;
}

/**
 * SafeLink component that handles internal and external links
 * - Internal links use React Router's Link for SPA navigation
 * - External links use anchor tags with security attributes
 */
export const SafeLink = forwardRef<HTMLAnchorElement, SafeLinkProps>(
  ({ to, external, children, ...props }, ref) => {
    const isExternal = external || isExternalUrl(to);

    if (isExternal) {
      return (
        <a
          ref={ref}
          href={to}
          target="_blank"
          rel="noopener noreferrer"
          {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {children}
        </a>
      );
    }

    return (
      <Link ref={ref} to={to} {...props}>
        {children}
      </Link>
    );
  }
);

SafeLink.displayName = 'SafeLink';
