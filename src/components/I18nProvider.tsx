'use client';

import { useEffect } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';

const VALID_LANGUAGES = new Set(['en', 'he', 'ru']);

function HtmlLangUpdater() {
  const { i18n: i18nInstance } = useTranslation();

  // Restore language from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('language');
    if (stored && VALID_LANGUAGES.has(stored) && stored !== i18nInstance.language) {
      i18nInstance.changeLanguage(stored);
    }
  }, [i18nInstance]);

  useEffect(() => {
    const lang = i18nInstance.language;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
  }, [i18nInstance.language]);

  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      document.documentElement.lang = lng;
      document.documentElement.dir = lng === 'he' ? 'rtl' : 'ltr';
      if (typeof window !== 'undefined') {
        localStorage.setItem('language', lng);
      }
    };

    i18nInstance.on('languageChanged', handleLanguageChanged);
    return () => {
      i18nInstance.off('languageChanged', handleLanguageChanged);
    };
  }, [i18nInstance]);

  return null;
}

export default function I18nProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <I18nextProvider i18n={i18n}>
      <HtmlLangUpdater />
      {children}
    </I18nextProvider>
  );
}
