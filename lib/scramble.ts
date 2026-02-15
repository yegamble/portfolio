/**
 * Text scramble/encryption transition engine.
 *
 * Animates an element's textContent character-by-character through random
 * world-script glyphs (Cyrillic, Katakana, Chinese, Arabic, Hebrew, Farsi,
 * Devanagari, Turkic, Latin, Binary) before settling on the target text.
 *
 * Designed for reuse with ANY target language — just pass the desired
 * `toText` string and the engine handles the rest.
 *
 * Performance: uses requestAnimationFrame with an FPS cap, directly
 * mutates `element.textContent` to avoid React re-renders during animation.
 */

// ---------------------------------------------------------------------------
// Character pools – one entry per script family
// ---------------------------------------------------------------------------
export const SCRIPT_POOLS: Record<string, string> = {
  cyrillic:
    'БВГДЖЗИЙКЛМНПРСТУФХЦЧШЩЪЫЭЮЯбвгджзиклмнпрстуфхцчшщэюя',
  katakana:
    'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン',
  chinese:
    '的一是不了人我在有他这中大来上个国到说们为子和你地出会也时要就可以生',
  arabic: 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي',
  hebrew: 'אבגדהוזחטיכלמנסעפצקרשת',
  farsi: 'پچژکگیآ',
  devanagari:
    'अआइईउऊऋएऐओऔकखगघचछजझटठडढणतथदधनपफबभमयरलवशषसह',
  turkic: 'ÇĞİÖŞÜçğışöü',
  latin: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  binary: '01',
};

const ALL_CHARS = Object.values(SCRIPT_POOLS).join('');

/** Return a random character from the combined pool of all scripts. */
export function randomChar(): string {
  return ALL_CHARS[Math.floor(Math.random() * ALL_CHARS.length)];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ScrambleOptions {
  /** Total animation duration in milliseconds. @default 1200 */
  duration?: number;
  /**
   * Override the per-character stagger (ms). When omitted, the stagger is
   * calculated automatically so that the first character resolves at ~30 %
   * of the total duration and the last at ~95 %.
   */
  stagger?: number;
  /** Maximum frames per second for the scramble effect. @default 24 */
  fps?: number;
  /** Fires once when the animation naturally completes. */
  onComplete?: () => void;
}

/**
 * Animate `element.textContent` from `fromText` → random glyphs → `toText`.
 *
 * Characters resolve left-to-right with a stagger. For RTL scripts the first
 * string index is the *rightmost* visual character, so the cascade naturally
 * flows right-to-left when displaying RTL text.
 *
 * Spaces and empty target positions are never scrambled.
 *
 * @returns A cancel function. Calling it immediately jumps to `toText`.
 */
export function scrambleTransition(
  element: HTMLElement,
  fromText: string,
  toText: string,
  options: ScrambleOptions = {},
): () => void {
  const { duration = 1200, stagger: staggerOverride, fps = 24, onComplete } = options;

  const maxLen = Math.max(fromText.length, toText.length);

  // Edge case: nothing to animate
  if (maxLen === 0) {
    element.textContent = toText;
    onComplete?.();
    return () => {};
  }

  // Timing: first char resolves at 30 % of duration, last at 95 %.
  const resolveStart = duration * 0.3;
  const resolveEnd = duration * 0.95;
  const stagger =
    staggerOverride ??
    (maxLen > 1 ? (resolveEnd - resolveStart) / (maxLen - 1) : 0);

  const frameInterval = 1000 / fps;

  let animationId = 0;
  let startTime: number | null = null;
  let lastFrameTime = 0;
  let cancelled = false;

  function animate(timestamp: number) {
    if (cancelled) return;

    if (startTime === null) startTime = timestamp;
    const elapsed = timestamp - startTime;

    // Throttle to the FPS cap
    if (timestamp - lastFrameTime < frameInterval) {
      animationId = requestAnimationFrame(animate);
      return;
    }
    lastFrameTime = timestamp;

    let result = '';
    let allDone = true;

    for (let i = 0; i < maxLen; i++) {
      const charResolveTime = resolveStart + i * stagger;
      const targetChar = i < toText.length ? toText[i] : '';

      if (elapsed >= charResolveTime) {
        // Resolved — show final character
        result += targetChar;
      } else if (targetChar === ' ' || targetChar === '') {
        // Preserve whitespace / empty slots
        result += targetChar;
      } else {
        result += randomChar();
        allDone = false;
      }
    }

    element.textContent = result;

    if (allDone) {
      onComplete?.();
    } else {
      animationId = requestAnimationFrame(animate);
    }
  }

  animationId = requestAnimationFrame(animate);

  // Cancel function — jumps straight to the final text
  return () => {
    if (!cancelled) {
      cancelled = true;
      cancelAnimationFrame(animationId);
      element.textContent = toText;
    }
  };
}
