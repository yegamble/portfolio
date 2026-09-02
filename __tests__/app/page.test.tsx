import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

// Next's notFound() throws to unwind the render, so the mock does too.
const NOT_FOUND_ERROR = 'NEXT_HTTP_ERROR_FALLBACK;404';

const { notFoundMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
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

import LocalizedHomePage from '@/app/[locale]/page';

describe('Localized Home Page', () => {
  beforeEach(() => {
    notFoundMock.mockReset();
    notFoundMock.mockImplementation(() => {
      throw new Error(NOT_FOUND_ERROR);
    });
  });

  it('renders all sections successfully for a valid locale', async () => {
    const markup = renderToStaticMarkup(
      await LocalizedHomePage({ params: Promise.resolve({ locale: 'en' }) })
    );

    expect(markup).toContain('Mock ScrollHeader');
    expect(markup).toContain('Mock About');
    expect(markup).toContain('Mock Experience');
    expect(markup).toContain('Mock Projects');
    expect(markup).toContain('Mock Footer');
  });

  it('gives <main> the skip link target and makes it focusable', async () => {
    const markup = renderToStaticMarkup(
      await LocalizedHomePage({ params: Promise.resolve({ locale: 'en' }) })
    );

    expect(markup).toContain('id="main"');
    // Without tabindex the skip link would move the viewport but leave focus in
    // the header, so the next Tab press would land back on the nav.
    expect(markup).toMatch(/<main[^>]*tabindex="-1"/);
    // That the landing is actually drawn is measured from the computed outline
    // in cypress/e2e/portfolio.cy.ts, where there is real CSS.
  });

  it('stops rendering for an invalid locale', async () => {
    await expect(LocalizedHomePage({ params: Promise.resolve({ locale: 'de' }) })).rejects.toThrow(
      NOT_FOUND_ERROR
    );

    expect(notFoundMock).toHaveBeenCalled();
  });
});
