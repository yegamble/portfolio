import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import I18nProvider from '@/components/I18nProvider';
import {
  DEFAULT_LOCALE,
  getLocaleHref,
  isAppLocale,
  LOCALES,
  type AppLocale,
} from '@/lib/i18n';

const SITE_URL = 'https://yosefgamble.com';

function getMetadataForLocale(locale: AppLocale): Metadata {
  const href = `${SITE_URL}${getLocaleHref(locale)}`;
  const languages = Object.fromEntries(
    LOCALES.map((supportedLocale) => [supportedLocale, `${SITE_URL}${getLocaleHref(supportedLocale)}`])
  );

  return {
    metadataBase: new URL(SITE_URL),
    title: 'Yosef Gamble | Senior Software Engineer — Go, TypeScript, AWS',
    description:
      'Yosef Gamble — Senior Software Engineer in New York & Auckland. Go (Golang), TypeScript, AWS specialist. Real estate portals, video streaming platforms, and scalable cloud systems.',
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
      title: 'Yosef Gamble | Senior Software Engineer — Go, TypeScript, AWS',
      description:
        'Senior Software Engineer in New York & Auckland. Go (Golang), TypeScript, AWS. Real estate portals, video streaming, and scalable cloud systems.',
      url: href,
      siteName: 'Yosef Gamble',
      locale: locale === 'he' ? 'he_IL' : locale === 'ru' ? 'ru_RU' : 'en_US',
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
      title: 'Yosef Gamble | Senior Software Engineer — Go, TypeScript, AWS',
      description:
        'Senior Software Engineer in New York & Auckland. Go (Golang), TypeScript, AWS. Real estate portals, video streaming, and scalable cloud systems.',
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

  return <I18nProvider locale={locale}>{children}</I18nProvider>;
}
