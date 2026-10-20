import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Analytics from '@/app/analytics';

type TestWindow = Window & { dataLayer?: IArguments[]; gtag?: unknown };

function inlineLoader(): string {
  const markup = renderToStaticMarkup(<Analytics />);
  const match = /<script id="analytics-loader">([\s\S]*)<\/script>/.exec(markup);
  expect(match, 'no inline analytics loader').not.toBeNull();
  return match![1];
}

afterEach(() => {
  vi.restoreAllMocks();
  delete (window as TestWindow).dataLayer;
  delete (window as TestWindow).gtag;
});

describe('Analytics', () => {
  it('should render one inline loader carrying the production config', () => {
    const loader = inlineLoader();

    expect(loader).toContain('"measurementId":"G-CRKCRY9DXE"');
    expect(loader).toContain('"host":"yosefgamble.com"');
    // Inline only: the external scripts are created after `load`, never in HTML.
    expect(renderToStaticMarkup(<Analytics />)).not.toMatch(/<script[^>]+src=/);
  });

  // The loader is `loadAnalytics` serialized with toString(). Run it in a scope
  // that has no access to the module it came from: any reference to an import
  // or module-level name would throw here instead of in a visitor's browser.
  it('should run on its own, with nothing from its module in scope', () => {
    const loader = inlineLoader().replace('"host":"yosefgamble.com"', '"host":"localhost"');
    vi.spyOn(document, 'readyState', 'get').mockReturnValue('loading');

    expect(() => new Function(loader)()).not.toThrow();
    expect((window as TestWindow).dataLayer).toHaveLength(4);
  });

  it('should stay inert on any host but production', () => {
    expect(() => new Function(inlineLoader())()).not.toThrow();
    expect((window as TestWindow).dataLayer).toBeUndefined();
  });
});
