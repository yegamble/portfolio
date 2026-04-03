import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '../../public/locales/en/translation.json';
import he from '../../public/locales/he/translation.json';
import ru from '../../public/locales/ru/translation.json';

const VALID_LANGUAGES = new Set(['en', 'he', 'ru']);

function getInitialLanguage(): string {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('language');
      if (stored && VALID_LANGUAGES.has(stored)) {
        return stored;
      }
    } catch {
      // localStorage may be unavailable (SSR, privacy mode)
    }
  }
  return 'en';
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    he: { translation: he },
    ru: { translation: ru },
  },
  lng: getInitialLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: true,
  },
});

export default i18n;
