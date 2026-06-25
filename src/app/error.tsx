'use client';

import { useEffect, useState } from 'react';
import {
  DEFAULT_LOCALE,
  getDirection,
  getLocaleMessages,
  getPreferredLocale,
  LOCALE_COOKIE_NAME,
  type AppLocale,
} from '@/lib/i18n';

interface ErrorPageProps {
  error: Error;
  reset: () => void;
}

function readCookieLocale(): AppLocale {
  if (typeof document === 'undefined') return DEFAULT_LOCALE;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${LOCALE_COOKIE_NAME}=([^;]*)`)
  );
  return getPreferredLocale(match ? decodeURIComponent(match[1]) : undefined);
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const [locale, setLocale] = useState<AppLocale>(DEFAULT_LOCALE);

  useEffect(() => {
    const next = readCookieLocale();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocale(next);
    document.documentElement.lang = next;
    document.documentElement.dir = getDirection(next);
    // Surface the boundary error for diagnostics (it is not shown to the user).
    console.error(error);
  }, [error]);

  const t = getLocaleMessages(locale).error;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-6">
      <div className="max-w-md text-center" role="alert">
        <h1 className="mb-4 text-4xl font-bold text-text-primary">{t.title}</h1>
        <p className="mb-8 text-lg text-text-secondary">{t.description}</p>
        <button
          onClick={reset}
          className="rounded-md bg-primary px-6 py-3 text-sm font-bold text-slate-900 transition-colors hover:bg-primary/90"
        >
          {t.retry}
        </button>
      </div>
    </main>
  );
}
