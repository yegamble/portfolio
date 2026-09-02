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

import LocaleLayout, { generateMetadata, generateStaticParams } from '@/app/[locale]/layout';

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
    expect(markup).toContain('pointer-events-none');
    expect(markup).toContain('--font-inter');
    expect(markup).toContain('--font-heebo');
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
