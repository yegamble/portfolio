/**
 * Cipher character sets utility for text scramble animation.
 * Provides Unicode character pools from 10+ world scripts and helper functions.
 */

const CHARACTER_POOLS: string[][] = [
  Array.from('АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ'),
  Array.from(
    'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'
  ),
  Array.from(
    '的一是不了人我在有他这中大来上个国到说们为子和你地出会也时要就可以'
  ),
  Array.from('ابتثجحخدذرزسشصضطظعغفقكلمنهوي'),
  Array.from('אבגדהוזחטיכלמנסעפצקרשת'),
  Array.from('अआइईउऊएऐओऔकखगघचछजझटठडढणतथदधनपफबभमयरलवशषसह'),
  Array.from('ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝ'),
  Array.from('01'),
  Array.from('აბგდევზთიკლმნოპჟრსტუფქღყშჩცძწჭხჯჰ'),
  Array.from('ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ'),
];

const LETTER_REGEX = /\p{L}/u;

/**
 * Returns a random cipher character from a randomly selected script pool.
 * Character pools are pre-computed as arrays for performance in animation hot paths.
 */
export function getRandomCipherChar(): string {
  const pool =
    CHARACTER_POOLS[Math.floor(Math.random() * CHARACTER_POOLS.length)];
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Determines if a character should be scrambled during the cipher animation.
 * Returns true for alphabetic/script characters, false for whitespace, digits, punctuation.
 * Uses Unicode property escapes to detect letters across all scripts.
 */
export function isScramblable(char: string): boolean {
  if (Array.from(char).length !== 1) return false;
  return LETTER_REGEX.test(char);
}
