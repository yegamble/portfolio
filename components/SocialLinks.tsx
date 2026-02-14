import {
  GitHubIcon,
  LinkedInIcon,
  EmailIcon,
  SecureEmailIcon,
} from '@/components/icons';

interface SocialLinkItem {
  label: string;
  href: string;
  icon: (props: { className?: string }) => React.ReactNode;
  external?: boolean;
}

const socialLinks: SocialLinkItem[] = [
  {
    label: 'GitHub',
    href: 'https://github.com/yegamble',
    icon: GitHubIcon,
    external: true,
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/in/yosefgamble',
    icon: LinkedInIcon,
    external: true,
  },
  {
    label: 'Email',
    href: 'mailto:yegamble@gmail.com',
    icon: EmailIcon,
  },
  {
    label: 'Secure email',
    href: 'mailto:yosef.gamble@protonmail.com',
    icon: SecureEmailIcon,
  },
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
  return (
    <div className={`flex items-center ${gap} ${className}`}>
      {socialLinks.map(({ label, href, icon: Icon, external }) => (
        <a
          key={label}
          className={linkClassName}
          href={href}
          {...(external
            ? { target: '_blank', rel: 'noreferrer noopener' }
            : {})}
        >
          <span className="sr-only">{label}</span>
          <Icon className={iconSize} />
        </a>
      ))}
    </div>
  );
}
