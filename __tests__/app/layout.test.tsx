import type { ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const { headersMock, notFoundMock } = vi.hoisted(() => ({
  headersMock: vi.fn(),
  notFoundMock: vi.fn(),
}));

vi.mock('next/headers', () => ({
  headers: headersMock,
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

import RootLayout from '@/app/layout';
import LocaleLayout, {
  generateMetadata,
  generateStaticParams,
} from '@/app/[locale]/layout';

describe('RootLayout', () => {
  beforeEach(() => {
    headersMock.mockReset();
    notFoundMock.mockReset();
  });

  it('renders children inside the layout shell with server locale attributes', async () => {
    headersMock.mockResolvedValue(new Headers([['x-locale', 'he']]));

    const markup = renderToStaticMarkup(
      await RootLayout({
        children: <div>Smoke Child</div>,
      })
    );

    expect(markup).toContain('Smoke Child');
    expect(markup).toContain('lang="he"');
    expect(markup).toContain('dir="rtl"');
    expect(markup).toContain('pointer-events-none');
  });
});

describe('LocaleLayout', () => {
  it('renders children inside the locale provider wrapper', async () => {
    const markup = renderToStaticMarkup(
      await LocaleLayout({
        children: <div>Locale Child</div>,
        params: Promise.resolve({ locale: 'en' }),
      })
    );

    expect(markup).toContain('Locale Child');
  });

  it('provides static params for each supported locale', () => {
    expect(generateStaticParams()).toEqual([{ locale: 'en' }, { locale: 'he' }, { locale: 'ru' }]);
  });

  it('returns locale-specific metadata with canonical URLs', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: 'he' }),
    });

    expect(metadata.alternates?.canonical).toBe('https://yosefgamble.com/he');
    expect(metadata.openGraph?.url).toBe('https://yosefgamble.com/he');
    expect(metadata.openGraph?.locale).toBe('he_IL');
  });

  it('calls notFound for invalid locales', async () => {
    await LocaleLayout({
      children: <div>Ignored</div>,
      params: Promise.resolve({ locale: 'de' }),
    });

    expect(notFoundMock).toHaveBeenCalled();
  });
});
