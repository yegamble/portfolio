import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import staticAssetsIncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache';

// The four locale routes are prerendered at build time, but the default
// incremental cache is the "dummy" override, so the Worker could not read the
// prerendered HTML and re-rendered every request. Reading it back out of
// Workers static assets (`.open-next/assets/cdn-cgi/_next_cache/...`) plus
// cache interception lets the Worker answer from the prerender before the
// Next.js server handler runs, while the proxy (middleware) still executes.
//
// Nothing on this site revalidates, which is the one condition the static
// assets cache requires.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  enableCacheInterception: true,
});
