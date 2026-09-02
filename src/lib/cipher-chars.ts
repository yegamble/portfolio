/**
 * Cipher character sets utility for text scramble animation.
 * Provides Unicode character pools from 10+ world scripts and helper functions.
 */

// Wide pools: these glyphs advance ~1.2-1.8x a Latin lowercase letter. They are
// the visual heart of the effect but must only be drawn for targets that are
// themselves wide — an overlay slot is sized to the FINAL glyph, so a wide
// scramble glyph in a narrow slot spills out of it (and, before the slots
// gained `overflow-x: clip`, widened the whole document on a phone).
const KANA = Array.from(
  'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'
);
const CJK = Array.from('的一是不了人我在有他这中大来上个国到说们为子和你地出会也时要就可以');
const ARABIC = Array.from('ابتثجحخدذرزسشصضطظعغفقكلمنهوي');
const DEVANAGARI = Array.from('अआइईउऊएऐओऔकखगघचछजझटठडढणतथदधनपफबभमयरलवशषसह');
const GEORGIAN = Array.from('აბგდევზთიკლმნოპჟრსტუფქღყშჩცძწჭხჯჰ');

// Narrow pools, split by case: an uppercase target keeps cap-height scramble
// glyphs and a lowercase target keeps x-height ones, so the scramble neither
// overflows its slot nor changes the perceived weight of the line.
const CYRILLIC_UPPER = Array.from('АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ');
const CYRILLIC_LOWER = Array.from('абвгдежзиклмнопрстуфхцчшщэюя');
const GREEK_UPPER = Array.from('ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ');
const GREEK_LOWER = Array.from('αβγδεζηθικλμνξοπρστυφχψω');
const LATIN_EXT_UPPER = Array.from('ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝ');
const LATIN_EXT_LOWER = Array.from('àáâãäåæçèéêëìíîïðñòóôõöøùúûüýÿ');
// Hebrew is unicase and sits between the two heights; digits are narrow in both.
const HEBREW = Array.from('אבגדהוזחטיכלמנסעפצקרשת');
const BINARY = Array.from('01');

const WIDE_POOLS: string[][] = [KANA, CJK, ARABIC, DEVANAGARI, GEORGIAN];
const NARROW_UPPER_POOLS: string[][] = [
  CYRILLIC_UPPER,
  GREEK_UPPER,
  LATIN_EXT_UPPER,
  HEBREW,
  BINARY,
];
const NARROW_LOWER_POOLS: string[][] = [
  CYRILLIC_LOWER,
  GREEK_LOWER,
  LATIN_EXT_LOWER,
  HEBREW,
  BINARY,
];

const CHARACTER_POOLS: string[][] = [
  ...WIDE_POOLS,
  ...NARROW_UPPER_POOLS,
  CYRILLIC_LOWER,
  GREEK_LOWER,
  LATIN_EXT_LOWER,
];

const SINGLE_LETTER_REGEX = /^\p{L}$/u;
// Scripts whose glyph advance is close enough to the narrow pools to swap for.
const NARROW_SCRIPT_REGEX = /[A-Za-z\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF]/;
const HEBREW_REGEX = /[\u0590-\u05FF]/;

function poolsForTarget(target: string): string[][] {
  // Hebrew has no case; its glyphs sit at roughly x-height.
  if (HEBREW_REGEX.test(target)) return NARROW_LOWER_POOLS;
  if (!NARROW_SCRIPT_REGEX.test(target)) return CHARACTER_POOLS;

  const isLowercase = target === target.toLowerCase() && target !== target.toUpperCase();
  return isLowercase ? NARROW_LOWER_POOLS : NARROW_UPPER_POOLS;
}

/**
 * Returns a random cipher character from a randomly selected script pool.
 *
 * Pass the character the scramble is heading towards and the draw becomes
 * width-aware: narrow, case-matched pools for Latin/Cyrillic/Greek/Hebrew
 * targets, the full multi-script mix for everything else (and for calls with no
 * target). Pools are pre-computed as arrays for the animation hot path.
 */
export function getRandomCipherChar(target?: string): string {
  const pools = target ? poolsForTarget(target) : CHARACTER_POOLS;
  const pool = pools[Math.floor(Math.random() * pools.length)];
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Determines if a character should be scrambled during the cipher animation.
 * Returns true for alphabetic/script characters, false for whitespace, digits, punctuation.
 * Uses Unicode property escapes to detect letters across all scripts.
 */
export function isScramblable(char: string): boolean {
  return SINGLE_LETTER_REGEX.test(char);
}
