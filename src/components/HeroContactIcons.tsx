'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmailIcon, SecureEmailIcon, KeyIcon } from '@/components/icons';
import PgpKeyModal from '@/components/PgpKeyModal';
import { primaryEmailHref, secureEmailHref, pgpPublicKey } from '@/lib/contact';

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
          <EmailIcon className="h-7 w-7" />
        </a>
      )}
      {secureEmailHref && (
        <a className={linkClass} href={secureEmailHref} aria-label={t('social.secureEmail')}>
          <SecureEmailIcon className="h-7 w-7" />
        </a>
      )}
      {pgpPublicKey && (
        <>
          <button
            className={`${linkClass} cursor-pointer`}
            onClick={() => setShowPgpModal(true)}
            aria-label={t('social.pgpKey')}
          >
            <KeyIcon className="h-7 w-7" />
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
