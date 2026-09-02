import type { MetadataRoute } from 'next';
import { DEFAULT_LOCALE, LOCALES, getLocaleHref } from '@/lib/i18n';

const SITE_URL = 'https://yosefgamble.com';

// A build-time constant, not `new Date()`: request time made every crawl report
// the page as modified seconds ago, which tells a crawler nothing and trains it
// to ignore the field. Bump this when the résumé or the copy actually changes.
const LAST_MODIFIED = new Date('2026-09-02');

// The four locale pages are translations of one another, so each entry carries
// the full set — that is what tells a crawler these are alternates rather than
// four competing pages.
const languages: Record<string, string> = {
  ...Object.fromEntries(LOCALES.map((locale) => [locale, `${SITE_URL}${getLocaleHref(locale)}`])),
  'x-default': `${SITE_URL}${getLocaleHref(DEFAULT_LOCALE)}`,
};

export default function sitemap(): MetadataRoute.Sitemap {
  return LOCALES.map((locale) => ({
    url: `${SITE_URL}${getLocaleHref(locale)}`,
    lastModified: LAST_MODIFIED,
    changeFrequency: 'monthly',
    priority: locale === 'en' ? 1 : 0.8,
    alternates: { languages },
  }));
}
