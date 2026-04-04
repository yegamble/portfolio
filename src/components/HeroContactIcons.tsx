'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmailIcon, SecureEmailIcon, KeyIcon } from '@/components/icons';
import PgpKeyModal from '@/components/PgpKeyModal';

function validateMailto(email: string | undefined): string | null {
  const trimmed = email?.trim();
  if (!trimmed) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? `mailto:${trimmed}` : null;
}

const primaryEmailHref = validateMailto(process.env.NEXT_PUBLIC_CONTACT_EMAIL);
const secureEmailHref = validateMailto(process.env.NEXT_PUBLIC_SECURE_CONTACT_EMAIL);
const pgpPublicKey = process.env.NEXT_PUBLIC_PGP_PUBLIC_KEY?.trim() || null;

interface HeroContactIconsProps {
  className?: string;
}

const linkClass = 'text-text-muted transition-colors hover:text-primary';

export default function HeroContactIcons({ className = '' }: HeroContactIconsProps) {
  const { t } = useTranslation();
  const [showPgpModal, setShowPgpModal] = useState(false);

  const hasAny = primaryEmailHref || secureEmailHref || pgpPublicKey;
  if (!hasAny) return null;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {primaryEmailHref && (
        <a className={linkClass} href={primaryEmailHref} aria-label={t('social.email')}>
          <EmailIcon className="h-5 w-5" />
        </a>
      )}
      {secureEmailHref && (
        <a className={linkClass} href={secureEmailHref} aria-label={t('social.secureEmail')}>
          <SecureEmailIcon className="h-5 w-5" />
        </a>
      )}
      {pgpPublicKey && (
        <>
          <button
            className={linkClass}
            onClick={() => setShowPgpModal(true)}
            aria-label={t('social.pgpKey')}
          >
            <KeyIcon className="h-5 w-5" />
          </button>
          <PgpKeyModal
            isOpen={showPgpModal}
            onClose={() => setShowPgpModal(false)}
            armoredKey={pgpPublicKey}
          />
        </>
      )}
    </div>
  );
}
