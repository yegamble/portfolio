/**
 * Analytics, loaded after the page has finished loading and only on the
 * production host.
 *
 * `loadAnalytics` is serialized with `Function.prototype.toString()` into an
 * inline <script> by `src/app/analytics.tsx`, so it must stay self-contained:
 * everything it needs arrives through its one argument, and it may not touch
 * an import or anything else in this module's scope.
 * `__tests__/lib/analytics.test.ts` runs the serialized form to hold it to that.
 *
 * - Google Analytics 4 (gtag.js). Consent Mode v2 defaults: no ads signals
 *   anywhere (the site runs no ads), and no analytics cookies in the EEA, the
 *   UK and Switzerland, where they need opt-in consent and there is no banner
 *   to ask for it. Visitors there send cookieless pings only.
 * - Cloudflare Web Analytics, but only when the zone has not already injected
 *   its beacon. The zone's automatic setup puts a `type="module"` beacon in the
 *   document, which Lighthouse's simulation counts as render-blocking. With
 *   automatic setup switched off in the dashboard, this loads the same beacon
 *   after `load` instead; while it is still on, this sees the injected tag and
 *   stays out of the way, so the two can never double-count.
 *
 * Nothing loads before `load` plus an idle callback, so neither script competes
 * with the first paint. The cost is that a visitor who leaves within a second
 * or two of arriving is not counted.
 */

import { SITE_URL } from '@/lib/locales';

export interface AnalyticsConfig {
  /** Hostname analytics runs on; anywhere else (CI, `next dev`) nothing loads. */
  host: string;
  /** GA4 measurement ID. */
  measurementId: string;
  /** ISO 3166-1 codes where analytics storage is denied by default. */
  consentDeniedRegions: readonly string[];
  /** Cloudflare Web Analytics site token, for the manual beacon. */
  cloudflareToken: string;
}

// EU member states, the rest of the EEA (IS, LI, NO), the UK and Switzerland.
const CONSENT_DENIED_REGIONS = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT',
  'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  'IS', 'LI', 'NO',
  'GB', 'CH',
] as const; // prettier-ignore

export const ANALYTICS_CONFIG: AnalyticsConfig = {
  host: new URL(SITE_URL).hostname,
  measurementId: 'G-CRKCRY9DXE',
  consentDeniedRegions: CONSENT_DENIED_REGIONS,
  // Not a secret: the Web Analytics site token is public by design and is
  // already in every page's HTML via the zone-injected beacon's data-cf-beacon.
  cloudflareToken: 'c49dc66b66db42cbb465a7bec309a063', // ggignore
};

type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

export function loadAnalytics(config: AnalyticsConfig): void {
  if (window.location.hostname !== config.host) return;

  const w = window as AnalyticsWindow;
  const dataLayer = (w.dataLayer = w.dataLayer || []);
  // gtag.js reads each queued command as an `arguments` object, not an array.
  w.gtag = function gtag() {
    dataLayer.push(arguments);
  };

  const ads = { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };
  w.gtag('consent', 'default', { ...ads, analytics_storage: 'granted' });
  // The region-scoped default wins over the global one for visitors there.
  w.gtag('consent', 'default', {
    ...ads,
    analytics_storage: 'denied',
    region: config.consentDeniedRegions,
  });
  w.gtag('js', new Date());
  w.gtag('config', config.measurementId, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });

  const inject = (src: string, attributes: Record<string, string> = {}) => {
    const script = document.createElement('script');
    script.async = true;
    script.src = src;
    for (const [name, value] of Object.entries(attributes)) script.setAttribute(name, value);
    document.head.appendChild(script);
  };

  const load = () => {
    inject(`https://www.googletagmanager.com/gtag/js?id=${config.measurementId}`);
    if (!document.querySelector('script[src^="https://static.cloudflareinsights.com/"]')) {
      inject('https://static.cloudflareinsights.com/beacon.min.js', {
        'data-cf-beacon': JSON.stringify({ token: config.cloudflareToken }),
      });
    }
  };

  const whenIdle = () => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(load);
    else setTimeout(load, 1);
  };

  if (document.readyState === 'complete') whenIdle();
  else window.addEventListener('load', whenIdle, { once: true });
}
