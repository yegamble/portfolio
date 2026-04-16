import { createInstance, type Resource, type i18n as I18nInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '../../public/locales/en/translation.json';
import he from '../../public/locales/he/translation.json';
import ru from '../../public/locales/ru/translation.json';

export const LOCALES = ['en', 'he', 'ru'] as const;
export type AppLocale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = 'en';
export const LOCALE_COOKIE_NAME = 'locale';

const RTL_LOCALES = new Set<AppLocale>(['he']);
const LOCALE_SET = new Set<AppLocale>(LOCALES);

export const localeResources = {
  en: { translation: en },
  he: { translation: he },
  ru: { translation: ru },
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
    initImmediate: false,
  });

  return instance;
}

export function createI18nInstance(locale: AppLocale = DEFAULT_LOCALE) {
  return initI18nInstance(createInstance(), locale);
}

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return value != null && LOCALE_SET.has(value as AppLocale);
}

export function getDirection(locale: AppLocale | string): 'ltr' | 'rtl' {
  return RTL_LOCALES.has(locale as AppLocale) ? 'rtl' : 'ltr';
}

export function getLocaleHref(locale: AppLocale) {
  return `/${locale}`;
}

export function getLocalizedPathname(pathname: string | null | undefined, locale: AppLocale) {
  const normalizedPathname =
    pathname == null || pathname === ''
      ? getLocaleHref(locale)
      : pathname.startsWith('/')
        ? pathname
        : `/${pathname}`;
  const segments = normalizedPathname.split('/');

  if (isAppLocale(segments[1])) {
    segments[1] = locale;
  } else {
    segments.splice(1, 0, locale);
  }

  return segments.join('/').replace(/\/{2,}/g, '/');
}

export function getPreferredLocale(cookieLocale?: string | null): AppLocale {
  return isAppLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
}

export function getLocaleMessages(locale: AppLocale) {
  return localeResources[locale].translation;
}

const defaultI18n = createI18nInstance(DEFAULT_LOCALE);

export default defaultI18n;
