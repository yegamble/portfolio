'use client';

import { useEffect } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';

function applyLangAttributes(lng: string) {
  document.documentElement.lang = lng;
  document.documentElement.dir = lng === 'he' ? 'rtl' : 'ltr';
}

function HtmlLangUpdater() {
  const { i18n: i18nInstance } = useTranslation();

  // Set lang/dir on mount (i18n already initialized with stored language)
  useEffect(() => {
    applyLangAttributes(i18nInstance.language);
  }, [i18nInstance]);

  // Update lang/dir and persist on language changes
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      applyLangAttributes(lng);
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
