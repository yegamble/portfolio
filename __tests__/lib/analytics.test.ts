import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ANALYTICS_CONFIG, loadAnalytics, type AnalyticsConfig } from '@/lib/analytics';

type TestWindow = Window & { dataLayer?: IArguments[]; gtag?: unknown };

// jsdom serves pages from http://localhost, so tests aim the host gate there.
const LOCAL: AnalyticsConfig = { ...ANALYTICS_CONFIG, host: 'localhost' };

const commands = () =>
  ((window as TestWindow).dataLayer ?? []).map((args) => Array.from(args) as unknown[]);

const injectedSources = () =>
  Array.from(document.head.querySelectorAll('script[src]'), (script) => script.getAttribute('src'));

let idle: (() => void) | undefined;

beforeEach(() => {
  idle = undefined;
  // Capture the idle callback so each test decides when the browser is idle.
  vi.stubGlobal('requestIdleCallback', (callback: () => void) => {
    idle = callback;
    return 1;
  });
  // jsdom has finished loading before any test runs; most tests start earlier.
  vi.spyOn(document, 'readyState', 'get').mockReturnValue('loading');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete (window as TestWindow).dataLayer;
  delete (window as TestWindow).gtag;
  document.head.querySelectorAll('script').forEach((script) => script.remove());
  document.body.querySelectorAll('script').forEach((script) => script.remove());
});

describe('ANALYTICS_CONFIG', () => {
  it('should run only on the production host, with the GA4 measurement ID', () => {
    expect(ANALYTICS_CONFIG.host).toBe('yosefgamble.com');
    expect(ANALYTICS_CONFIG.measurementId).toBe('G-CRKCRY9DXE');
  });

  it('should deny analytics storage by default across the EEA, the UK and Switzerland', () => {
    const regions = ANALYTICS_CONFIG.consentDeniedRegions;

    expect(regions).toHaveLength(32);
    expect(regions).toEqual(
      expect.arrayContaining(['EE', 'DE', 'GR', 'NO', 'IS', 'LI', 'GB', 'CH'])
    );
    expect(regions).not.toContain('US');
  });
});

describe('loadAnalytics', () => {
  it('should do nothing at all off the production host', () => {
    loadAnalytics(ANALYTICS_CONFIG);
    window.dispatchEvent(new Event('load'));

    expect((window as TestWindow).dataLayer).toBeUndefined();
    expect(idle).toBeUndefined();
    expect(injectedSources()).toEqual([]);
  });

  it('should queue consent defaults before the tag is configured', () => {
    loadAnalytics(LOCAL);

    const queued = commands();
    expect(queued.map(([command]) => command)).toEqual(['consent', 'consent', 'js', 'config']);
    expect(queued[0]).toEqual([
      'consent',
      'default',
      {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'granted',
      },
    ]);
    expect(queued[1]).toEqual([
      'consent',
      'default',
      {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied',
        region: LOCAL.consentDeniedRegions,
      },
    ]);
    expect(queued[3]).toEqual([
      'config',
      'G-CRKCRY9DXE',
      { allow_google_signals: false, allow_ad_personalization_signals: false },
    ]);
  });

  it('should load nothing until the page has loaded and the browser is idle', () => {
    loadAnalytics(LOCAL);
    expect(injectedSources()).toEqual([]);

    window.dispatchEvent(new Event('load'));
    expect(injectedSources()).toEqual([]);

    idle!();
    expect(injectedSources()).toEqual([
      'https://www.googletagmanager.com/gtag/js?id=G-CRKCRY9DXE',
      'https://static.cloudflareinsights.com/beacon.min.js',
    ]);
  });

  it('should hand the Cloudflare beacon its site token', () => {
    loadAnalytics(LOCAL);
    window.dispatchEvent(new Event('load'));
    idle!();

    const beacon = document.head.querySelector('script[src*="cloudflareinsights"]');
    expect(JSON.parse(beacon!.getAttribute('data-cf-beacon')!)).toEqual({
      token: LOCAL.cloudflareToken,
    });
  });

  // While the zone's automatic setup is still on, Cloudflare injects its own
  // beacon; loading a second one would count every visit twice.
  it('should leave the beacon alone when the zone has already injected one', () => {
    const injected = document.createElement('script');
    injected.src = 'https://static.cloudflareinsights.com/beacon.min.js/vce70182';
    document.body.appendChild(injected);

    loadAnalytics(LOCAL);
    window.dispatchEvent(new Event('load'));
    idle!();

    expect(injectedSources()).toEqual(['https://www.googletagmanager.com/gtag/js?id=G-CRKCRY9DXE']);
  });

  it('should still wait for idle when the page had already loaded', () => {
    vi.spyOn(document, 'readyState', 'get').mockReturnValue('complete');

    loadAnalytics(LOCAL);
    expect(injectedSources()).toEqual([]);

    idle!();
    expect(injectedSources()).toHaveLength(2);
  });

  it('should fall back to a timer where requestIdleCallback is missing', () => {
    vi.useFakeTimers();
    vi.stubGlobal('requestIdleCallback', undefined);
    // `'requestIdleCallback' in window` must be false, not merely undefined.
    delete (window as Partial<Window>).requestIdleCallback;

    loadAnalytics(LOCAL);
    window.dispatchEvent(new Event('load'));
    expect(injectedSources()).toEqual([]);

    vi.runAllTimers();
    expect(injectedSources()).toHaveLength(2);
    vi.useRealTimers();
  });

  it('should queue commands as arguments objects, the shape gtag.js reads', () => {
    loadAnalytics(LOCAL);

    const [first] = (window as TestWindow).dataLayer!;
    expect(Object.prototype.toString.call(first)).toBe('[object Arguments]');
  });
});
