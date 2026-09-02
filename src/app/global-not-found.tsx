import { cookies } from 'next/headers';
import { fontVariables } from '@/app/fonts';
import {
  getDirection,
  getLocaleHref,
  getLocaleMessages,
  getPreferredLocale,
  LOCALE_COOKIE_NAME,
} from '@/lib/i18n';
import './globals.css';

// A 404 is served for paths that match no route, so there is no `locale` param
// to read. The locale cookie is the next best signal: the middleware sets it on
// the redirect that brought the visitor to a localized URL, and refreshes it
// whenever the path locale disagrees — including on the request that 404s.
//
// This file replaces the old `not-found.tsx`, which rendered inside Next's
// `__next_error__` shell and could only fix `<html lang/dir>` from an effect
// after mount, leaving the document with no <title> at all.

export default async function GlobalNotFound() {
  const cookieStore = await cookies();
  const locale = getPreferredLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  const messages = getLocaleMessages(locale);
  const t = messages.notFound;

  return (
    <html lang={locale} dir={getDirection(locale)} className={fontVariables}>
      <body className="min-h-screen font-[family-name:var(--font-inter),var(--font-heebo)] antialiased leading-relaxed">
        <title>{`${t.title} | ${messages.meta.title}`}</title>
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
