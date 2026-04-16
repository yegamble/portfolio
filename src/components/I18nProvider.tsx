'use client';

import { useEffect, useMemo } from 'react';
import { I18nextProvider } from 'react-i18next';
import {
  createI18nInstance,
  getDirection,
  LOCALE_COOKIE_NAME,
  type AppLocale,
} from '@/lib/i18n';

interface I18nProviderProps {
  children: React.ReactNode;
  locale: AppLocale;
}

export default function I18nProvider({ children, locale }: I18nProviderProps) {
  const i18n = useMemo(() => createI18nInstance(locale), [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = getDirection(locale);
    document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }, [locale]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
