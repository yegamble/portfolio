'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import MainRegion from '@/components/MainRegion';

interface ErrorPageProps {
  error: Error;
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  // This boundary sits inside the [locale] layout, so I18nProvider is already
  // above it: the active language comes from the route, not from a cookie read
  // after mount.
  const { t } = useTranslation();

  useEffect(() => {
    // Surface the boundary error for diagnostics (it is not shown to the user).
    console.error(error);
  }, [error]);

  return (
    // This boundary replaces the page inside the locale layout, and that layout
    // still renders the skip link — without the target here the link would
    // point at nothing.
    <MainRegion className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-6">
      <div className="max-w-md text-center" role="alert">
        <h1 className="mb-4 text-4xl font-bold text-text-primary">{t('error.title')}</h1>
        <p className="mb-8 text-lg text-text-secondary">{t('error.description')}</p>
        <button
          onClick={reset}
          className="rounded-md bg-primary px-6 py-3 text-sm font-bold text-slate-900 transition-colors hover:bg-primary/90"
        >
          {t('error.retry')}
        </button>
      </div>
    </MainRegion>
  );
}
