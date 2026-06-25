'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  DEFAULT_LOCALE,
  getDirection,
  getLocaleMessages,
  getPreferredLocale,
  LOCALE_COOKIE_NAME,
  type AppLocale,
} from '@/lib/i18n';

function readCookieLocale(): AppLocale {
  if (typeof document === 'undefined') return DEFAULT_LOCALE;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${LOCALE_COOKIE_NAME}=([^;]*)`)
  );
  return getPreferredLocale(match ? decodeURIComponent(match[1]) : undefined);
}

export default function NotFound() {
  // Start at the default locale so the first render matches the server output,
  // then adopt the visitor's stored locale after mount.
  const [locale, setLocale] = useState<AppLocale>(DEFAULT_LOCALE);
  useEffect(() => {
    const next = readCookieLocale();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocale(next);
    // The root layout can't read the locale during a not-found render, so align
    // <html lang/dir> with the visitor's stored locale here (RTL for Hebrew).
    document.documentElement.lang = next;
    document.documentElement.dir = getDirection(next);
  }, []);
  const t = getLocaleMessages(locale).notFound;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-6">
      <div className="max-w-md text-center">
        <h1 className="mb-4 text-6xl font-bold text-primary">404</h1>
        <h2 className="mb-4 text-2xl font-semibold text-text-primary">{t.title}</h2>
        <p className="mb-8 text-lg text-text-secondary">{t.description}</p>
        <Link
          href="/"
          className="inline-block rounded-md bg-primary px-6 py-3 text-sm font-bold text-slate-900 transition-colors hover:bg-primary/90"
        >
          {t.backHome}
        </Link>
      </div>
    </main>
  );
}
