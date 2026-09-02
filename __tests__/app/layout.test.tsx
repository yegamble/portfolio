import type { ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

// Next's notFound() throws to unwind the render; a mock that returns would let
// a component keep going past it and hide a real bug.
const NOT_FOUND_ERROR = 'NEXT_HTTP_ERROR_FALLBACK;404';

const { notFoundMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  notFound: notFoundMock,
}));

vi.mock('next/font/google', () => ({
  Inter: () => ({
    variable: '--font-inter',
  }),
  Heebo: () => ({
    variable: '--font-heebo',
  }),
}));

vi.mock('@/components/I18nProvider', () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

import LocaleLayout, {
  generateMetadata,
  generateStaticParams,
  viewport,
} from '@/app/[locale]/layout';

import { LOCALES, type AppLocale } from '@/lib/i18n';

import en from '../../public/locales/en/translation.json';
import he from '../../public/locales/he/translation.json';
import ru from '../../public/locales/ru/translation.json';
import et from '../../public/locales/et/translation.json';

// The production bundles, not the test fixtures in __tests__/setup.ts: page
// metadata is one of the two things that read them directly (the fallback pages
// are the other), and the fixtures deliberately carry no `meta` section.
//
// Record<AppLocale, …> and a LOCALES loop rather than a literal list, so a
// fifth locale fails typecheck here instead of silently going unasserted.
const MESSAGES: Record<AppLocale, typeof en | typeof he | typeof ru | typeof et> = {
  en,
  he,
  ru,
  et,
};

describe('LocaleLayout', () => {
  beforeEach(() => {
    notFoundMock.mockReset();
    notFoundMock.mockImplementation(() => {
      throw new Error(NOT_FOUND_ERROR);
    });
  });

  it('renders the document shell with the locale from the route params', async () => {
    const markup = renderToStaticMarkup(
      await LocaleLayout({
        children: <div>Locale Child</div>,
        params: Promise.resolve({ locale: 'en' }),
      })
    );

    expect(markup).toContain('Locale Child');
    expect(markup).toContain('lang="en"');
    expect(markup).toContain('dir="ltr"');
    expect(markup).toContain('--font-inter');
    expect(markup).toContain('--font-heebo');
  });

  it('opens the body with a skip link pointing at the main landmark', async () => {
    const markup = renderToStaticMarkup(
      await LocaleLayout({
        children: <div>Locale Child</div>,
        params: Promise.resolve({ locale: 'en' }),
      })
    );

    // First tab stop on the page: it has to precede the sticky header.
    expect(markup).toContain('href="#main"');
    expect(markup.indexOf('href="#main"')).toBeLessThan(markup.indexOf('Locale Child'));
  });

  it('renders Hebrew right-to-left without reading a request header', async () => {
    const markup = renderToStaticMarkup(
      await LocaleLayout({
        children: <div>Locale Child</div>,
        params: Promise.resolve({ locale: 'he' }),
      })
    );

    expect(markup).toContain('lang="he"');
    expect(markup).toContain('dir="rtl"');
  });

  it('embeds the JSON-LD structured data for the active locale', async () => {
    const markup = renderToStaticMarkup(
      await LocaleLayout({
        children: <div>Locale Child</div>,
        params: Promise.resolve({ locale: 'ru' }),
      })
    );

    expect(markup).toContain('application/ld+json');
    expect(markup).toContain('https://yosefgamble.com/ru');
  });

  it('provides static params for each supported locale', () => {
    expect(generateStaticParams()).toEqual([
      { locale: 'en' },
      { locale: 'he' },
      { locale: 'ru' },
      { locale: 'et' },
    ]);
  });

  it('returns locale-specific metadata with canonical URLs', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: 'he' }),
    });

    expect(metadata.alternates?.canonical).toBe('https://yosefgamble.com/he');
    expect(metadata.openGraph?.url).toBe('https://yosefgamble.com/he');
    expect(metadata.openGraph?.locale).toBe('he_IL');
  });

  it('returns Estonian metadata with the et_EE Open Graph locale', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: 'et' }),
    });

    expect(metadata.alternates?.canonical).toBe('https://yosefgamble.com/et');
    expect(metadata.openGraph?.url).toBe('https://yosefgamble.com/et');
    expect(metadata.openGraph?.locale).toBe('et_EE');
  });

  it('takes the title and both descriptions from the locale being rendered', async () => {
    for (const locale of LOCALES) {
      const metadata = await generateMetadata({
        params: Promise.resolve({ locale }),
      });
      const { meta } = MESSAGES[locale];

      expect(metadata.title, locale).toBe(meta.title);
      expect(metadata.description, locale).toBe(meta.description);
      // The search snippet and the social card are written separately: the card
      // has less room, so ogDescription is its own string.
      expect(metadata.openGraph?.description, locale).toBe(meta.ogDescription);
      expect(metadata.twitter?.description, locale).toBe(meta.ogDescription);
      expect(metadata.openGraph?.title, locale).toBe(meta.title);
      expect(metadata.twitter?.title, locale).toBe(meta.title);
    }
  });

  // The assertion above would also hold if every locale returned English, since
  // it reads the expectation from the same place the code does.
  it('gives each locale a title and description of its own', async () => {
    const metadata = await Promise.all(
      LOCALES.map((locale) => generateMetadata({ params: Promise.resolve({ locale }) }))
    );

    expect(new Set(metadata.map((entry) => entry.title)).size).toBe(LOCALES.length);
    expect(new Set(metadata.map((entry) => entry.description)).size).toBe(LOCALES.length);
  });

  it('lists every locale plus x-default in the hreflang alternates', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: 'en' }),
    });

    expect(metadata.alternates?.languages).toEqual({
      en: 'https://yosefgamble.com/en',
      he: 'https://yosefgamble.com/he',
      ru: 'https://yosefgamble.com/ru',
      et: 'https://yosefgamble.com/et',
      'x-default': 'https://yosefgamble.com/en',
    });
  });

  it('lists the other three translations as Open Graph alternates', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: 'he' }),
    });

    expect(metadata.openGraph).toMatchObject({
      locale: 'he_IL',
      alternateLocale: ['en_US', 'ru_RU', 'et_EE'],
    });
  });

  // Ignored by every major crawler, and the list claimed "full-stack engineer",
  // which is not how this site describes its subject.
  it('does not emit a keywords meta tag', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: 'en' }),
    });

    expect(metadata.keywords).toBeUndefined();
  });

  it('paints the browser chrome to match the page background', () => {
    expect(viewport.themeColor).toBe('#0f172a');
  });

  it('stops rendering for an invalid locale', async () => {
    await expect(
      LocaleLayout({
        children: <div>Ignored</div>,
        params: Promise.resolve({ locale: 'de' }),
      })
    ).rejects.toThrow(NOT_FOUND_ERROR);

    expect(notFoundMock).toHaveBeenCalled();
  });

  it('stops building metadata for an invalid locale', async () => {
    await expect(generateMetadata({ params: Promise.resolve({ locale: 'de' }) })).rejects.toThrow(
      NOT_FOUND_ERROR
    );

    expect(notFoundMock).toHaveBeenCalled();
  });
});
