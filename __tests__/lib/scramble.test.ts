import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  scrambleTransition,
  randomChar,
  SCRIPT_POOLS,
} from '@/lib/scramble';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Flush all pending rAF callbacks synchronously. */
function flushRAF(frames = 1) {
  for (let i = 0; i < frames; i++) {
    vi.advanceTimersByTime(1000 / 24); // one frame at 24 fps
    vi.runAllTimers();
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  // Mock requestAnimationFrame to use setTimeout so fake timers work
  let id = 0;
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    id += 1;
    setTimeout(() => cb(performance.now()), 0);
    return id;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((frameId) => {
    clearTimeout(frameId);
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// SCRIPT_POOLS
// ---------------------------------------------------------------------------

describe('SCRIPT_POOLS', () => {
  it('should contain all expected script families', () => {
    const expectedKeys = [
      'cyrillic',
      'katakana',
      'chinese',
      'arabic',
      'hebrew',
      'farsi',
      'devanagari',
      'turkic',
      'latin',
      'binary',
    ];
    expect(Object.keys(SCRIPT_POOLS)).toEqual(expect.arrayContaining(expectedKeys));
  });

  it('should have non-empty character pools for every script', () => {
    for (const [key, pool] of Object.entries(SCRIPT_POOLS)) {
      expect(pool.length, `${key} pool should not be empty`).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// randomChar
// ---------------------------------------------------------------------------

describe('randomChar', () => {
  it('should return a single character', () => {
    const c = randomChar();
    expect([...c]).toHaveLength(1);
  });

  it('should return a character from the combined pool', () => {
    const allChars = Object.values(SCRIPT_POOLS).join('');
    for (let i = 0; i < 50; i++) {
      expect(allChars).toContain(randomChar());
    }
  });

  it('should produce varying output (not always the same char)', () => {
    const chars = new Set(Array.from({ length: 100 }, () => randomChar()));
    // With 10+ scripts, getting only 1 unique char in 100 draws is near-impossible
    expect(chars.size).toBeGreaterThan(1);
  });
});

// ---------------------------------------------------------------------------
// scrambleTransition
// ---------------------------------------------------------------------------

describe('scrambleTransition', () => {
  function makeEl(text = ''): HTMLSpanElement {
    const el = document.createElement('span');
    el.textContent = text;
    return el;
  }

  it('should set element text to toText when duration elapses', () => {
    const el = makeEl('Hello');
    scrambleTransition(el, 'Hello', 'World', { duration: 500 });

    // Advance well past the animation duration
    vi.advanceTimersByTime(1000);

    expect(el.textContent).toBe('World');
  });

  it('should call onComplete when animation finishes', () => {
    const el = makeEl('A');
    const onComplete = vi.fn();
    scrambleTransition(el, 'A', 'B', { duration: 200, onComplete });

    vi.advanceTimersByTime(500);

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('should immediately set toText when cancel is called', () => {
    const el = makeEl('abc');
    const cancel = scrambleTransition(el, 'abc', 'xyz', { duration: 2000 });

    // Advance a little (animation in progress)
    vi.advanceTimersByTime(50);

    cancel();

    expect(el.textContent).toBe('xyz');
  });

  it('should handle empty fromText gracefully', () => {
    const el = makeEl('');
    scrambleTransition(el, '', 'Hello', { duration: 500 });

    vi.advanceTimersByTime(1000);

    expect(el.textContent).toBe('Hello');
  });

  it('should handle empty toText gracefully', () => {
    const el = makeEl('Hello');
    scrambleTransition(el, 'Hello', '', { duration: 500 });

    vi.advanceTimersByTime(1000);

    expect(el.textContent).toBe('');
  });

  it('should handle both texts empty', () => {
    const el = makeEl('');
    const onComplete = vi.fn();
    scrambleTransition(el, '', '', { duration: 500, onComplete });

    // Should complete immediately for empty strings
    vi.advanceTimersByTime(50);
    expect(el.textContent).toBe('');
    expect(onComplete).toHaveBeenCalled();
  });

  it('should preserve spaces in the target text during animation', () => {
    const el = makeEl('AB');
    scrambleTransition(el, 'AB', 'A B', { duration: 1000 });

    // After first frame the text should have a space at index 1
    vi.advanceTimersByTime(50);

    // The middle character (index 1) of "A B" is a space — verify it stays
    const text = el.textContent ?? '';
    // The space position in toText is index 1
    if (text.length >= 2) {
      expect(text[1]).toBe(' ');
    }
  });

  it('should handle different length strings (from shorter to longer)', () => {
    const el = makeEl('Hi');
    scrambleTransition(el, 'Hi', 'Hello', { duration: 500 });

    vi.advanceTimersByTime(1000);

    expect(el.textContent).toBe('Hello');
  });

  it('should handle different length strings (from longer to shorter)', () => {
    const el = makeEl('Hello');
    scrambleTransition(el, 'Hello', 'Hi', { duration: 500 });

    vi.advanceTimersByTime(1000);

    expect(el.textContent).toBe('Hi');
  });

  it('should use requestAnimationFrame for rendering', () => {
    const el = makeEl('A');
    scrambleTransition(el, 'A', 'B', { duration: 500 });

    expect(window.requestAnimationFrame).toHaveBeenCalled();
  });

  it('should call cancelAnimationFrame when cancel is invoked', () => {
    const el = makeEl('A');
    const cancel = scrambleTransition(el, 'A', 'B', { duration: 2000 });

    cancel();

    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });

  it('should be safe to call cancel multiple times', () => {
    const el = makeEl('A');
    const cancel = scrambleTransition(el, 'A', 'B', { duration: 2000 });

    cancel();
    cancel();
    cancel();

    expect(el.textContent).toBe('B');
  });

  it('should produce intermediate scrambled text that differs from both from and to', () => {
    const el = makeEl('AAAAAAAAAA');
    scrambleTransition(el, 'AAAAAAAAAA', 'BBBBBBBBBB', { duration: 2000 });

    // Advance just past the first frame
    vi.advanceTimersByTime(100);

    const text = el.textContent ?? '';
    // At least some chars should be scrambled (neither A nor B)
    // Not all chars will have resolved yet
    const hasScrambled = [...text].some((c) => c !== 'A' && c !== 'B');
    expect(hasScrambled).toBe(true);
  });

  it('should respect the fps option by throttling frame updates', () => {
    const el = makeEl('A');
    const fps = 10;
    scrambleTransition(el, 'A', 'B', { duration: 2000, fps });

    // With fps=10, frame interval is 100ms.
    // Multiple rAF calls within 100ms should not all update the text.
    // We can verify rAF is called but the text doesn't change every ms.
    vi.advanceTimersByTime(5);
    const textAfter5ms = el.textContent;

    vi.advanceTimersByTime(5);
    const textAfter10ms = el.textContent;

    // These should be the same since both are within the first 100ms frame
    expect(textAfter5ms).toBe(textAfter10ms);
  });

  it('should handle Unicode / Hebrew target text', () => {
    const el = makeEl('About');
    scrambleTransition(el, 'About', 'אודות', { duration: 500 });

    vi.advanceTimersByTime(1000);

    expect(el.textContent).toBe('אודות');
  });

  it('should accept custom stagger override', () => {
    const el = makeEl('AB');
    scrambleTransition(el, 'AB', 'XY', { duration: 1000, stagger: 0 });

    vi.advanceTimersByTime(2000);

    expect(el.textContent).toBe('XY');
  });
});
