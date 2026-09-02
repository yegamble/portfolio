import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const { cookiesMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: cookiesMock,
}));

vi.mock('next/font/google', () => ({
  Inter: () => ({ variable: '--font-inter' }),
  Heebo: () => ({ variable: '--font-heebo' }),
}));

import GlobalNotFound from '@/app/global-not-found';

function mockLocaleCookie(value?: string) {
  cookiesMock.mockResolvedValue({
    get: vi.fn().mockReturnValue(value == null ? undefined : { value }),
  });
}

async function renderNotFound() {
  return renderToStaticMarkup(await GlobalNotFound());
}

describe('GlobalNotFound', () => {
  beforeEach(() => {
    cookiesMock.mockReset();
  });

  it('renders its own document shell in the default locale when no cookie is set', async () => {
    mockLocaleCookie();
    const markup = await renderNotFound();

    expect(markup).toContain('<html');
    expect(markup).toContain('lang="en"');
    expect(markup).toContain('dir="ltr"');
    expect(markup).toContain('404');
  });

  it('gives the 404 document a title so it is not untitled in history and tabs', async () => {
    mockLocaleCookie();
    const markup = await renderNotFound();

    const title = markup.match(/<title[^>]*>(.*?)<\/title>/)?.[1];
    expect(title).toBeDefined();
    expect(title).toContain('Page Not Found');
  });

  it('renders Hebrew right-to-left with the Hebrew copy and title', async () => {
    mockLocaleCookie('he');
    const markup = await renderNotFound();

    expect(markup).toContain('lang="he"');
    expect(markup).toContain('dir="rtl"');
    expect(markup).toContain('הדף לא נמצא');
  });

  it('falls back to the default locale for an unsupported cookie value', async () => {
    mockLocaleCookie('fr');
    const markup = await renderNotFound();

    expect(markup).toContain('lang="en"');
  });

  it('links back to the visitor localized home page', async () => {
    mockLocaleCookie('ru');
    const markup = await renderNotFound();

    expect(markup).toContain('href="/ru"');
  });

  it('uses a main landmark for the 404 content', async () => {
    mockLocaleCookie();
    const markup = await renderNotFound();

    expect(markup).toContain('<main');
  });
});
