import { Inter, Heebo } from 'next/font/google';

// One declaration site for both documents that exist ([locale]/layout.tsx and
// global-not-found.tsx): declaring the same face twice makes next/font emit two
// separate CSS modules and two sets of files.
//
// `subsets` does NOT decide which glyphs the site can render. next/font emits an
// @font-face for every subset the family publishes either way (the built CSS
// carries latin-ext, cyrillic-ext, greek, vietnamese, symbols...), each with its
// own unicode-range, so the browser still fetches whatever a page actually uses.
// What `subsets` controls is which files get a <link rel="preload"> in the head.
//
// So this list is a preload budget, not a coverage list. Latin and Cyrillic are
// the two that every first paint needs (the UI, and /ru plus the Cyrillic glyphs
// the cipher scrambles through); Hebrew is what a `he` page needs immediately.
// The subsets dropped here are still served on demand — Estonian's `ž` (U+017E)
// lives in latin-ext, and Heebo's Latin faces do get used for the Latin runs
// inside a `html:lang(he)` page — they just no longer cost a preloaded file on
// every locale. That took the preload from 5 files / 192 KB to 3 / 77 KB.
export const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-inter',
});

export const heebo = Heebo({
  subsets: ['hebrew'],
  display: 'swap',
  variable: '--font-heebo',
});

/** The font variable classes for the <html> element. */
export const fontVariables = `${inter.variable} ${heebo.variable}`;
