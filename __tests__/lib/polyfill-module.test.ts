import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * `src/lib/polyfill-module.ts` stands in for Next's client polyfill module (see
 * `turbopack.resolveAlias` in `next.config.ts`; the guards that keep that alias
 * honest are in `__tests__/config/next-config.test.ts`). It is a side-effect
 * module, so every test imports a fresh copy.
 */

const NativeURL = URL;

// Absolute, relative with and without a base, and the ways parsing fails.
const CASES: ReadonlyArray<readonly [string, string?]> = [
  ['https://yosefgamble.com/en'],
  ['/en', 'https://yosefgamble.com'],
  ['/en'],
  ['not a url'],
  ['mailto:someone@example.com'],
  ['https://[::1'],
  ['/en', 'not a base'],
];

/**
 * A `URL` from a browser that predates `canParse` (Chrome 111-119, Firefox
 * 111-114, Safari 16.4-16.6): it constructs exactly like the native one and has
 * no static `canParse` of its own or inherited.
 */
function urlWithoutCanParse(): typeof URL {
  return function LegacyURL(url: string | URL, base?: string | URL) {
    return new NativeURL(url, base);
  } as unknown as typeof URL;
}

async function importStandIn() {
  vi.resetModules();
  await import('@/lib/polyfill-module');
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('polyfill-module', () => {
  it('should leave a native URL.canParse in place', async () => {
    const native = URL.canParse;

    await importStandIn();

    expect(URL.canParse).toBe(native);
  });

  it('should install URL.canParse in a browser that predates it', async () => {
    vi.stubGlobal('URL', urlWithoutCanParse());
    expect('canParse' in URL).toBe(false);

    await importStandIn();

    expect(URL.canParse).toBeTypeOf('function');
  });

  it('should answer every input exactly as the native URL.canParse does', async () => {
    vi.stubGlobal('URL', urlWithoutCanParse());

    await importStandIn();

    const answers = CASES.map(([url, base]) => URL.canParse(url, base));
    expect(answers).toEqual(CASES.map(([url, base]) => NativeURL.canParse(url, base)));
    // Both answers occur, so the comparison covers the parse and the throw.
    expect(new Set(answers)).toEqual(new Set([true, false]));
  });
});
