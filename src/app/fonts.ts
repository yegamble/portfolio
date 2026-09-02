import { Inter, Heebo } from 'next/font/google';

// One declaration site for both documents that exist ([locale]/layout.tsx and
// global-not-found.tsx): declaring the same face twice makes next/font emit two
// separate CSS modules and two sets of files.
//
// Latin covers the UI and the Latin cipher glyph pool; Cyrillic is needed for
// /ru and for the Cyrillic glyphs the cipher scrambles through. latin-ext buys
// nothing here and cost a fifth preloaded file on every locale.
export const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-inter',
});

// Heebo is only ever used for Hebrew text (globals.css puts it first for
// `html:lang(he)`), so its Latin subset is dead weight.
export const heebo = Heebo({
  subsets: ['hebrew'],
  display: 'swap',
  variable: '--font-heebo',
});

/** The font variable classes for the <html> element. */
export const fontVariables = `${inter.variable} ${heebo.variable}`;
