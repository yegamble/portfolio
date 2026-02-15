'use client';

import { useTranslation } from 'react-i18next';
import CipherText from '@/components/CipherText';

export default function LanguageToggle() {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'he' : 'en';
    i18n.changeLanguage(nextLang);
  };

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className="rounded-md border border-slate-700 px-2.5 py-1 text-xs font-bold tracking-wide text-text-muted transition-colors hover:border-primary hover:text-primary"
      aria-label={t('language.label')}
    >
      <CipherText>{t('language.toggle')}</CipherText>
    </button>
  );
}
