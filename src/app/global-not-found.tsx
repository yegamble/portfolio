import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { fontVariables } from '@/app/fonts';
import {
  getDirection,
  getLocaleHref,
  getLocaleMessages,
  getPreferredLocale,
  isAppLocale,
  LOCALE_COOKIE_NAME,
  type AppLocale,
} from '@/lib/i18n';
import './globals.css';

// A 404 is served for paths that match no route, so there is no `locale` param
// to read. `src/middleware.ts` puts the path locale on an `x-locale` REQUEST
// header, which is what makes `/he/foo` come back in Hebrew; the stored cookie
// is the fallback for a path with no locale segment at all.
//
// This file replaces the old `not-found.tsx`, which rendered inside Next's
// `__next_error__` shell and could only fix `<html lang/dir>` from an effect
// after mount, leaving the document with no title.
async function resolveLocale(): Promise<AppLocale> {
  const [headerStore, cookieStore] = await Promise.all([headers(), cookies()]);
  const pathLocale = headerStore.get('x-locale');

  if (isAppLocale(pathLocale)) {
    return pathLocale;
  }

  return getPreferredLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
}

export async function generateMetadata(): Promise<Metadata> {
  const messages = getLocaleMessages(await resolveLocale());

  return {
    title: `${messages.notFound.title} | ${messages.meta.title}`,
    description: messages.notFound.description,
    robots: { index: false, follow: false },
  };
}

export default async function GlobalNotFound() {
  const locale = await resolveLocale();
  const t = getLocaleMessages(locale).notFound;

  return (
    <html lang={locale} dir={getDirection(locale)} className={fontVariables}>
      <body className="min-h-screen font-[family-name:var(--font-inter),var(--font-heebo)] antialiased leading-relaxed">
        <main className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-6">
          <div className="max-w-md text-center">
            <h1 className="mb-4 text-6xl font-bold text-primary">404</h1>
            <h2 className="mb-4 text-2xl font-semibold text-text-primary">{t.title}</h2>
            <p className="mb-8 text-lg text-text-secondary">{t.description}</p>
            <a
              href={getLocaleHref(locale)}
              className="inline-block rounded-md bg-primary px-6 py-3 text-sm font-bold text-slate-900 transition-colors hover:bg-primary/90"
            >
              {t.backHome}
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
