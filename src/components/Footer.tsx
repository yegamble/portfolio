'use client';

import { useTranslation } from 'react-i18next';
import SocialLinks from '@/components/SocialLinks';
import CipherText from '@/components/CipherText';

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
        <CipherText>{t('footer.codedIn')}</CipherText>{' '}
        <a
          className="font-medium text-text-secondary transition-colors hover:text-primary"
          href="https://code.visualstudio.com/"
          target="_blank"
          rel="noreferrer noopener"
        >
          <CipherText>{t('footer.vscode')}</CipherText>
        </a>
        . <CipherText>{t('footer.builtWith')}</CipherText>{' '}
        <a
          className="font-medium text-text-secondary transition-colors hover:text-primary"
          href="https://tailwindcss.com/"
          target="_blank"
          rel="noreferrer noopener"
        >
          <CipherText>{t('footer.tailwind')}</CipherText>
        </a>
        {' '}<CipherText>{t('footer.and')}</CipherText>{' '}
        <a
          className="font-medium text-text-secondary transition-colors hover:text-primary"
          href="https://fonts.google.com/specimen/Inter"
          target="_blank"
          rel="noreferrer noopener"
        >
          Inter
        </a>
        {' '}<CipherText>{t('footer.font')}</CipherText>.
      </p>
    </footer>
  );
}
