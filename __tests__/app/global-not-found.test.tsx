import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const { cookiesMock, headersMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  headersMock: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: cookiesMock,
  headers: headersMock,
}));

vi.mock('@/app/fonts', () => ({
  inter: { variable: '--font-inter' },
  heebo: { variable: '--font-heebo' },
  fontVariables: '--font-inter --font-heebo',
}));

import GlobalNotFound, { generateMetadata } from '@/app/global-not-found';

function mockRequest({ cookie, pathLocale }: { cookie?: string; pathLocale?: string } = {}) {
  cookiesMock.mockResolvedValue({
    get: vi.fn().mockReturnValue(cookie == null ? undefined : { value: cookie }),
  });
  headersMock.mockResolvedValue(new Headers(pathLocale == null ? [] : [['x-locale', pathLocale]]));
}

async function renderNotFound() {
  return renderToStaticMarkup(await GlobalNotFound());
}

describe('GlobalNotFound', () => {
  beforeEach(() => {
    cookiesMock.mockReset();
    headersMock.mockReset();
  });

  it('renders its own document shell in the default locale with no header and no cookie', async () => {
    mockRequest();
    const markup = await renderNotFound();

    expect(markup).toContain('<html');
    expect(markup).toContain('lang="en"');
    expect(markup).toContain('dir="ltr"');
    expect(markup).toContain('404');
  });

  it('localizes from the proxy x-locale header without any cookie', async () => {
    // /he/foo carries no locale cookie for a first-time visitor, so the path
    // locale has to reach the 404 some other way.
    mockRequest({ pathLocale: 'he' });
    const markup = await renderNotFound();

    expect(markup).toContain('lang="he"');
    expect(markup).toContain('dir="rtl"');
    expect(markup).toContain('הדף לא נמצא');
  });

  it('prefers the path locale over a disagreeing stored cookie', async () => {
    mockRequest({ cookie: 'he', pathLocale: 'ru' });
    const markup = await renderNotFound();

    expect(markup).toContain('lang="ru"');
  });

  it('falls back to the stored cookie when the path has no locale segment', async () => {
    mockRequest({ cookie: 'ru' });
    const markup = await renderNotFound();

    expect(markup).toContain('lang="ru"');
    expect(markup).toContain('href="/ru"');
  });

  it('falls back to the default locale for an unsupported cookie or header', async () => {
    mockRequest({ cookie: 'fr', pathLocale: 'de' });
    const markup = await renderNotFound();

    expect(markup).toContain('lang="en"');
  });

  it('uses a main landmark for the 404 content', async () => {
    mockRequest();
    const markup = await renderNotFound();

    expect(markup).toContain('<main');
  });
});

describe('GlobalNotFound metadata', () => {
  beforeEach(() => {
    cookiesMock.mockReset();
    headersMock.mockReset();
  });

  it('gives the 404 document a title so it is not untitled in history and tabs', async () => {
    mockRequest();
    const metadata = await generateMetadata();

    expect(metadata.title).toContain('Page Not Found');
    expect(metadata.description).toBeTruthy();
  });

  it('titles the 404 in the locale the path asked for', async () => {
    mockRequest({ pathLocale: 'he' });
    const metadata = await generateMetadata();

    expect(metadata.title).toContain('הדף לא נמצא');
  });

  it('keeps the 404 out of the index', async () => {
    mockRequest();
    const metadata = await generateMetadata();

    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
