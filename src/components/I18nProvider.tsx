'use client';

import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import {
  createI18nInstance,
  getDirection,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_COOKIE_NAME,
  type AppLocale,
} from '@/lib/i18n';

interface I18nProviderProps {
  children: React.ReactNode;
  locale: AppLocale;
}

function applyDocumentLocale(locale: string) {
  document.documentElement.lang = locale;
  document.documentElement.dir = getDirection(locale);
}

// Written only when the visitor actually picks a language. Rendering a locale
// route is not a choice — someone following an /en link from a CV keeps their
// stored `he` — and the middleware likewise only writes the cookie on the
// redirect it serves for a locale-less path.
function persistLocaleChoice(locale: string) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie =
    `${LOCALE_COOKIE_NAME}=${locale}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; ` +
    `SameSite=Lax${secure}`;
}

export default function I18nProvider({ children, locale }: I18nProviderProps) {
  // Create the i18n instance once (lazy state initializer) and keep it stable for
  // the app's lifetime. Language changes are driven through `changeLanguage`
  // (client-side switching), so the React tree is never torn down — the cipher
  // decrypt animation runs to completion in place instead of being cut short by a
  // route remount.
  const [i18n] = useState(() => createI18nInstance(locale));

  // Keep <html lang/dir> in sync with the active language, including
  // client-side switches that never re-render the server root layout. The
  // cookie is only touched by the change handler, never on mount.
  useEffect(() => {
    applyDocumentLocale(i18n.language);
    const handleLanguageChanged = (lng: string) => {
      applyDocumentLocale(lng);
      persistLocaleChoice(lng);
    };
    i18n.on('languageChanged', handleLanguageChanged);
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  // If a full navigation or SSR ever delivers a different server-provided locale,
  // follow it (the instance was created with the first-rendered locale).
  useEffect(() => {
    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }
  }, [i18n, locale]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
