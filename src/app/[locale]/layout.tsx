import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { fontVariables } from '@/app/fonts';
import JsonLd from '@/app/json-ld';
import I18nProvider from '@/components/I18nProvider';
import {
  DEFAULT_LOCALE,
  getDirection,
  getLocaleHref,
  getLocaleMessages,
  isAppLocale,
  LOCALES,
  type AppLocale,
} from '@/lib/i18n';
import '../globals.css';

const SITE_URL = 'https://yosefgamble.com';

// This is the application's root layout: it owns <html>/<body>. Everything the
// document needs comes from the `locale` route param, so the four locale routes
// prerender at build time instead of being forced dynamic by a per-request
// header read.

// Record<AppLocale, ...> keeps this exhaustive: adding a locale without an
// Open Graph mapping fails typecheck.
const OG_LOCALES: Record<AppLocale, string> = {
  en: 'en_US',
  he: 'he_IL',
  ru: 'ru_RU',
  et: 'et_EE',
};

function getMetadataForLocale(locale: AppLocale): Metadata {
  const href = `${SITE_URL}${getLocaleHref(locale)}`;
  const meta = getLocaleMessages(locale).meta;
  const languages = Object.fromEntries(
    LOCALES.map((supportedLocale) => [
      supportedLocale,
      `${SITE_URL}${getLocaleHref(supportedLocale)}`,
    ])
  );

  return {
    metadataBase: new URL(SITE_URL),
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: href,
      languages: {
        ...languages,
        'x-default': `${SITE_URL}${getLocaleHref(DEFAULT_LOCALE)}`,
      },
    },
    openGraph: {
      title: meta.title,
      description: meta.ogDescription,
      url: href,
      siteName: 'Yosef Gamble',
      locale: OG_LOCALES[locale],
      // The three other translations of this same page.
      alternateLocale: LOCALES.filter((other) => other !== locale).map(
        (other) => OG_LOCALES[other]
      ),
      type: 'website',
      images: [
        {
          url: '/images/og-image.jpg',
          width: 1200,
          height: 630,
          alt: 'Yosef Gamble — Senior Software Engineer',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.ogDescription,
      images: ['/images/og-image.jpg'],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

// Paints the browser chrome to match the page background instead of leaving a
// white bar above a dark document. Locale-independent, so it is a constant
// rather than part of generateMetadata.
export const viewport: Viewport = {
  themeColor: '#0f172a',
};

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!isAppLocale(locale)) {
    notFound();
  }

  return getMetadataForLocale(locale);
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!isAppLocale(locale)) {
    notFound();
  }

  return (
    <html lang={locale} dir={getDirection(locale)} className={fontVariables}>
      <body className="min-h-screen font-[family-name:var(--font-inter),var(--font-heebo)] antialiased leading-relaxed">
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900" />
          <div className="absolute -right-[10%] -top-[10%] h-[40rem] w-[40rem] rounded-full bg-[#1e293b] opacity-30 blur-[100px]" />
          <div className="absolute -bottom-[10%] -left-[10%] h-[30rem] w-[30rem] rounded-full bg-[#1e293b] opacity-30 blur-[80px]" />
        </div>
        <JsonLd locale={locale} />
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
