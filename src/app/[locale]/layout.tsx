import type { Metadata } from 'next';
import { Inter, Heebo } from 'next/font/google';
import { notFound } from 'next/navigation';
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

// Latin covers the UI and the Latin cipher glyph pool; Cyrillic is needed for
// /ru and for the Cyrillic glyphs the cipher scrambles through. latin-ext buys
// nothing here and cost a fifth preloaded font file on every locale.
const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-inter',
});

// Heebo is only ever used for Hebrew text (globals.css puts it first for
// `html:lang(he)`), so its Latin subset is dead weight.
const heebo = Heebo({
  subsets: ['hebrew'],
  display: 'swap',
  variable: '--font-heebo',
});

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
    keywords: [
      'Yosef Gamble',
      'senior software engineer',
      'Golang',
      'Go developer',
      'TypeScript',
      'AWS',
      'New York software engineer',
      'Auckland software engineer',
      'New Zealand developer',
      'real estate portal engineer',
      'video streaming',
      'full-stack engineer',
      'ActivityPub',
      'cloud infrastructure',
    ],
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
    <html
      lang={locale}
      dir={getDirection(locale)}
      className={`${inter.variable} ${heebo.variable}`}
    >
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
