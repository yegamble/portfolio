import { ANALYTICS_CONFIG, loadAnalytics } from '@/lib/analytics';

// The loader runs as an inline script straight from the prerendered HTML, so it
// adds nothing to the client bundle and needs no hydration. It does nothing
// until `load`; see src/lib/analytics.ts for what it loads and why.
// `<` is escaped so no string in the config can close the <script> early.
const LOADER = `(${loadAnalytics.toString()})(${JSON.stringify(ANALYTICS_CONFIG).replace(/</g, '\\u003c')});`;

export default function Analytics() {
  return <script id="analytics-loader" dangerouslySetInnerHTML={{ __html: LOADER }} />;
}
