import { createInstance, type Resource, type i18n as I18nInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { DEFAULT_LOCALE, LOCALES, type AppLocale } from '@/lib/locales';

import en from '../../public/locales/en/translation.json';
import he from '../../public/locales/he/translation.json';
import ru from '../../public/locales/ru/translation.json';
import et from '../../public/locales/et/translation.json';

// The locale primitives live in `@/lib/locales` (no imports, so the proxy/edge
// bundle stays free of i18next and the translation JSON). They are re-exported
// here so `@/lib/i18n` remains the single import site for the React tree.
export {
  DEFAULT_LOCALE,
  getDirection,
  getLocaleHref,
  getLocalizedPathname,
  getPreferredLocale,
  isAppLocale,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_COOKIE_NAME,
  LOCALES,
  negotiateLocale,
  SITE_URL,
  type AppLocale,
} from '@/lib/locales';

const localeResources = {
  en: { translation: en },
  he: { translation: he },
  ru: { translation: ru },
  et: { translation: et },
} as const satisfies Resource;

function initI18nInstance(instance: I18nInstance, locale: AppLocale) {
  void instance.use(initReactI18next).init({
    resources: localeResources,
    lng: locale,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: LOCALES,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    // Synchronous init: the resources are bundled, so there is nothing to wait
    // for, and the first render must already have its strings. (`initImmediate`
    // was this option's pre-v24 name; i18next 26 drops the alias.)
    initAsync: false,
  });

  return instance;
}

export function createI18nInstance(locale: AppLocale = DEFAULT_LOCALE) {
  return initI18nInstance(createInstance(), locale);
}

export function getLocaleMessages(locale: AppLocale) {
  return localeResources[locale].translation;
}

const defaultI18n = createI18nInstance(DEFAULT_LOCALE);

export default defaultI18n;
