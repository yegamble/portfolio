'use client';

import { Trans, useTranslation } from 'react-i18next';
import SectionHeader from '@/components/SectionHeader';

export default function About() {
  const { t } = useTranslation();

  return (
    <section
      id="about"
      className="scroll-mt-24 border-t border-slate-800/30 py-16 md:py-24"
      aria-label={t('about.ariaLabel')}
    >
      <SectionHeader title={t('about.heading')} className="mb-8 md:mb-10" />
      <div className="space-y-6 text-lg leading-relaxed text-text-secondary">
        <p>{t('about.p1')}</p>
        <p>
          <Trans
            i18nKey="about.p2"
            components={[
              <a
                key="realestate"
                className="font-medium text-text-primary underline decoration-slate-700 underline-offset-4 transition-colors hover:text-primary"
                href="https://www.realestate.co.nz"
                target="_blank"
                rel="noreferrer noopener"
              />,
            ]}
          />
        </p>
        <p>{t('about.p3')}</p>
      </div>
    </section>
  );
}
