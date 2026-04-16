import type { MetadataRoute } from 'next';
import { LOCALES, getLocaleHref } from '@/lib/i18n';

export default function sitemap(): MetadataRoute.Sitemap {
  return LOCALES.map((locale) => ({
    url: `https://yosefgamble.com${getLocaleHref(locale)}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: locale === 'en' ? 1 : 0.8,
  }));
}
