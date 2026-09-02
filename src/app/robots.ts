import type { MetadataRoute } from 'next';
// `@/lib/locales`, not `@/lib/i18n`: this route needs one constant, and the
// re-export would pull i18next, react-i18next and all four translation JSONs
// into its bundle for it.
import { SITE_URL } from '@/lib/locales';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
