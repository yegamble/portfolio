'use client';

import { useTranslation } from 'react-i18next';
import {
  GitHubIcon,
  LinkedInIcon,
  EmailIcon,
  SecureEmailIcon,
} from '@/components/icons';

interface SocialLinkItem {
  labelKey: string;
  href: string;
  icon: (props: { className?: string }) => React.ReactNode;
  external?: boolean;
}

function validateMailto(email: string | undefined): string | null {
  const trimmed = email?.trim();
  if (!trimmed) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? `mailto:${trimmed}` : null;
}

const primaryEmailHref = validateMailto(process.env.NEXT_PUBLIC_CONTACT_EMAIL);
const secureEmailHref = validateMailto(process.env.NEXT_PUBLIC_SECURE_CONTACT_EMAIL);

const socialLinks: SocialLinkItem[] = [
  {
    labelKey: 'social.github',
    href: 'https://github.com/yegamble',
    icon: GitHubIcon,
    external: true,
  },
  {
    labelKey: 'social.linkedin',
    href: 'https://linkedin.com/in/yosefgamble',
    icon: LinkedInIcon,
    external: true,
  },
  ...(primaryEmailHref
    ? [
        {
          labelKey: 'social.email',
          href: primaryEmailHref,
          icon: EmailIcon,
        },
      ]
    : []),
  ...(secureEmailHref
    ? [
        {
          labelKey: 'social.secureEmail',
          href: secureEmailHref,
          icon: SecureEmailIcon,
        },
      ]
    : []),
];

interface SocialLinksProps {
  iconSize?: string;
  gap?: string;
  linkClassName?: string;
  className?: string;
}

export default function SocialLinks({
  iconSize = 'h-5 w-5',
  gap = 'gap-3',
  linkClassName = 'text-text-muted transition-colors hover:text-text-primary',
  className = '',
}: SocialLinksProps) {
  const { t } = useTranslation();

  return (
    <div className={`flex items-center ${gap} ${className}`}>
      {socialLinks.map(({ labelKey, href, icon: Icon, external }) => (
        <a
          key={labelKey}
          className={linkClassName}
          href={href}
          {...(external
            ? { target: '_blank', rel: 'noreferrer noopener' }
            : {})}
        >
          <span className="sr-only">{t(labelKey)}</span>
          <Icon className={iconSize} />
        </a>
      ))}
    </div>
  );
}
