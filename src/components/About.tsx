'use client';

import { useTranslation } from 'react-i18next';
import SectionHeader from '@/components/SectionHeader';
import CipherText from '@/components/CipherText';

export default function About() {
  const { t } = useTranslation();

  return (
    <section
      id="about"
      className="scroll-mt-24 border-t border-slate-800/30 py-16 md:py-24"
      aria-label={t('about.ariaLabel')}
    >
      <SectionHeader
        title={<CipherText>{t('about.heading')}</CipherText>}
        className="mb-8 md:mb-10"
      />
      <div className="space-y-6 text-lg leading-relaxed text-text-secondary">
        <p>
          <CipherText block>{t('about.p1')}</CipherText>
        </p>
        <p>
          <CipherText>{t('about.p2_before')}</CipherText>
          <a
            className="font-medium text-text-primary underline decoration-slate-700 underline-offset-4 transition-colors hover:text-primary"
            href="https://www.realestate.co.nz"
            target="_blank"
            rel="noreferrer noopener"
          >
            <CipherText>{t('about.p2_link')}</CipherText>
          </a>
          <CipherText>{t('about.p2_after')}</CipherText>
        </p>
        <p>
          <CipherText block>{t('about.p3')}</CipherText>
        </p>
      </div>
    </section>
  );
}
