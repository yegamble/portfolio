/**
 * Cipher character sets utility for text scramble animation.
 * Provides Unicode character pools from 10+ world scripts and helper functions.
 *
 * Characters are stored in a single flat array for O(1) random access
 * with a single Math.random() call per character.
 */

const FLAT_POOL: string[] = [
  // Cyrillic
  ...'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ',
  // Japanese
  ...'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン',
  // Chinese
  ...'的一是不了人我在有他这中大来上个国到说们为子和你地出会也时要就可以',
  // Arabic
  ...'ابتثجحخدذرزسشصضطظعغفقكلمنهوي',
  // Hebrew
  ...'אבגדהוזחטיכלמנסעפצקרשת',
  // Devanagari
  ...'अआइईउऊएऐओऔकखगघचछजझटठडढणतथदधनपफबभमयरलवशषसह',
  // Latin extended
  ...'ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝ',
  // Binary
  ...'01',
  // Georgian
  ...'აბგდევზთიკლმნოპჟრსტუფქღყშჩცძწჭხჯჰ',
  // Greek
  ...'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ',
];

const POOL_SIZE = FLAT_POOL.length;
const SINGLE_LETTER_REGEX = /^\p{L}$/u;

/**
 * Returns a random cipher character from the flat pool.
 * Single Math.random() call instead of two (pool + char selection).
 */
export function getRandomCipherChar(): string {
  return FLAT_POOL[(Math.random() * POOL_SIZE) | 0];
}

/**
 * Determines if a character should be scrambled during the cipher animation.
 * Returns true for alphabetic/script characters, false for whitespace, digits, punctuation.
 * Uses Unicode property escapes to detect letters across all scripts.
 */
export function isScramblable(char: string): boolean {
  return SINGLE_LETTER_REGEX.test(char);
}
