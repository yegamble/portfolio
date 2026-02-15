'use client';

import { useTranslation } from 'react-i18next';
import SocialLinks from '@/components/SocialLinks';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="mt-12 border-t border-slate-800/30 pb-8 pt-12 text-center text-sm text-text-muted">
      <SocialLinks
        iconSize="h-6 w-6"
        gap="gap-8"
        linkClassName="transition-colors hover:text-text-primary"
        className="mb-8 justify-center"
      />
      <p className="mx-auto max-w-md">
        {t('footer.codedIn')}{' '}
        <a
          className="font-medium text-text-secondary transition-colors hover:text-primary"
          href="https://code.visualstudio.com/"
          target="_blank"
          rel="noreferrer noopener"
        >
          {t('footer.vscode')}
        </a>
        . {t('footer.builtWith')}{' '}
        <a
          className="font-medium text-text-secondary transition-colors hover:text-primary"
          href="https://tailwindcss.com/"
          target="_blank"
          rel="noreferrer noopener"
        >
          {t('footer.tailwind')}
        </a>
        {' '}{t('footer.and')}{' '}
        <a
          className="font-medium text-text-secondary transition-colors hover:text-primary"
          href="https://fonts.google.com/specimen/Inter"
          target="_blank"
          rel="noreferrer noopener"
        >
          Inter
        </a>
        {' '}{t('footer.font')}.
      </p>
    </footer>
  );
}
