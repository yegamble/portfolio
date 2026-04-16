import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const { redirectMock, cookiesMock, notFoundMock } = vi.hoisted(() => ({
  redirectMock: vi.fn(),
  cookiesMock: vi.fn(),
  notFoundMock: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: cookiesMock,
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
  notFound: notFoundMock,
}));

vi.mock('@/components/ScrollHeader', () => ({
  default: () => <div data-testid="scroll-header">Mock ScrollHeader</div>,
}));

vi.mock('@/components/About', () => ({
  default: () => <div data-testid="about">Mock About</div>,
}));

vi.mock('@/components/Experience', () => ({
  default: () => <div data-testid="experience">Mock Experience</div>,
}));

vi.mock('@/components/Projects', () => ({
  default: () => <div data-testid="projects">Mock Projects</div>,
}));

vi.mock('@/components/Footer', () => ({
  default: () => <div data-testid="footer">Mock Footer</div>,
}));

import IndexPage from '@/app/page';
import LocalizedHomePage from '@/app/[locale]/page';

describe('Index Page', () => {
  beforeEach(() => {
    redirectMock.mockReset();
    cookiesMock.mockReset();
    notFoundMock.mockReset();
  });

  it('redirects to the default locale when no locale cookie is set', async () => {
    cookiesMock.mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    });

    await IndexPage();

    expect(redirectMock).toHaveBeenCalledWith('/en');
  });

  it('redirects to the cookie locale when it is valid', async () => {
    cookiesMock.mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'he' }),
    });

    await IndexPage();

    expect(redirectMock).toHaveBeenCalledWith('/he');
  });
});

describe('Localized Home Page', () => {
  it('renders all sections successfully for a valid locale', async () => {
    const markup = renderToStaticMarkup(
      await LocalizedHomePage({ params: Promise.resolve({ locale: 'en' }) })
    );

    expect(markup).toContain('Mock ScrollHeader');
    expect(markup).toContain('Mock About');
    expect(markup).toContain('Mock Experience');
    expect(markup).toContain('Mock Projects');
    expect(markup).toContain('Mock Footer');
    expect(markup).toContain('mx-auto w-full max-w-3xl px-6 pb-24 lg:px-8');
  });

  it('calls notFound for an invalid locale', async () => {
    await LocalizedHomePage({ params: Promise.resolve({ locale: 'de' }) });

    expect(notFoundMock).toHaveBeenCalled();
  });
});
