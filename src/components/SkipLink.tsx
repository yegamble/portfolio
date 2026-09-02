'use client';

import { useTranslation } from 'react-i18next';

// The first tab stop on the page. Eight header controls and three hero contact
// links sit ahead of the content on every pass, and the header is sticky, so a
// keyboard user has no way to get past them otherwise. Hidden until focused,
// then pinned to the top-start corner (logical, so it follows RTL).
export default function SkipLink() {
  const { t } = useTranslation();

  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-slate-900"
    >
      {t('nav.skipToContent')}
    </a>
  );
}
