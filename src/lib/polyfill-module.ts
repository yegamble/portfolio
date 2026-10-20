/**
 * Stands in for Next's client polyfill module,
 * `next/dist/build/polyfills/polyfill-module.js`, which `next.config.ts`
 * aliases here (see `turbopack.resolveAlias` there for why the key looks the
 * way it does).
 *
 * Next's module polyfills ten built-ins, and every page loads it. Nine are
 * native in every browser Next 16 compiles for — Chrome and Edge 111,
 * Firefox 111, Safari 16.4 — so for this site they were 1.4 KB of code that
 * never runs: `String.prototype.trimStart` and `trimEnd`,
 * `Symbol.prototype.description`, `Array.prototype.flat` and `flatMap`,
 * `Promise.prototype.finally`, `Object.fromEntries`, `Array.prototype.at` and
 * `Object.hasOwn`. Lighthouse's legacy-JavaScript check flagged seven of them
 * on every audit.
 *
 * `URL.canParse` is the exception. It shipped in Chrome and Edge 120,
 * Firefox 115 and Safari 17, after every one of those targets, so it stays,
 * with the semantics Next's version had. Nothing in the production bundle
 * calls it today (Next's dev-only HMR client does), but the targets are a
 * promise about every dependency upgrade to come, not just this one.
 */
if (typeof URL.canParse !== 'function') {
  URL.canParse = function canParse(url: string | URL, base?: string | URL): boolean {
    try {
      return Boolean(new URL(url, base));
    } catch {
      return false;
    }
  };
}

export {};
