import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCipherTransition } from '@/hooks/useCipherTransition';

describe('useCipherTransition', () => {
  beforeEach(() => {
    let rafId = 0;
    global.requestAnimationFrame = vi.fn((_callback) => {
      rafId++;
      return rafId;
    }) as unknown as typeof requestAnimationFrame;
    global.cancelAnimationFrame = vi.fn();
    global.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_CIPHER_TRANSITION;
    vi.restoreAllMocks();
  });

  describe('initial mount', () => {
    it('should return text as-is on mount without animating', () => {
      const { result } = renderHook(() => useCipherTransition('Hello'));

      expect(result.current.displayChars).toEqual(['H', 'e', 'l', 'l', 'o']);
      expect(result.current.isAnimating).toBe(false);
    });

    it('should handle empty string', () => {
      const { result } = renderHook(() => useCipherTransition(''));

      expect(result.current.displayChars).toEqual([]);
      expect(result.current.isAnimating).toBe(false);
    });
  });

  describe('text changes (disabled mode)', () => {
    it('should update displayChars when text changes', () => {
      const { result, rerender } = renderHook(
        ({ text }) => useCipherTransition(text),
        { initialProps: { text: 'Hello' } }
      );

      rerender({ text: 'World' });

      expect(result.current.displayChars).toEqual(['W', 'o', 'r', 'l', 'd']);
    });

    it('should return array matching new text length', () => {
      const { result, rerender } = renderHook(
        ({ text }) => useCipherTransition(text),
        { initialProps: { text: 'Hi' } }
      );

      rerender({ text: 'Hello World' });

      expect(result.current.displayChars).toHaveLength(11);
    });
  });

  describe('environment variable toggle', () => {
    it('should skip animation when NEXT_PUBLIC_CIPHER_TRANSITION is not "true"', () => {
      const { result, rerender } = renderHook(
        ({ text }) => useCipherTransition(text),
        { initialProps: { text: 'Hello' } }
      );

      rerender({ text: 'World' });

      expect(result.current.displayChars).toEqual(['W', 'o', 'r', 'l', 'd']);
      expect(result.current.isAnimating).toBe(false);
    });

    it('should schedule rAF when animation is enabled and text changes', () => {
      process.env.NEXT_PUBLIC_CIPHER_TRANSITION = 'true';

      const { rerender } = renderHook(
        ({ text }) => useCipherTransition(text),
        { initialProps: { text: 'Hello' } }
      );

      rerender({ text: 'World' });

      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });

    it('should not schedule rAF when animation is disabled', () => {
      const { rerender } = renderHook(
        ({ text }) => useCipherTransition(text),
        { initialProps: { text: 'Hello' } }
      );

      (global.requestAnimationFrame as ReturnType<typeof vi.fn>).mockClear();
      rerender({ text: 'World' });

      expect(global.requestAnimationFrame).not.toHaveBeenCalled();
    });
  });

  describe('prefers-reduced-motion', () => {
    it('should skip animation when user prefers reduced motion (disabled mode)', () => {
      global.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { result, rerender } = renderHook(
        ({ text }) => useCipherTransition(text),
        { initialProps: { text: 'Hello' } }
      );

      rerender({ text: 'World' });

      expect(result.current.displayChars).toEqual(['W', 'o', 'r', 'l', 'd']);
      expect(result.current.isAnimating).toBe(false);
    });

    it('should schedule rAF for reduced-motion path when animation is enabled', () => {
      process.env.NEXT_PUBLIC_CIPHER_TRANSITION = 'true';
      global.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { rerender } = renderHook(
        ({ text }) => useCipherTransition(text),
        { initialProps: { text: 'Hello' } }
      );

      rerender({ text: 'World' });

      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('visibility control', () => {
    it('should return static text and not animate when isVisible is false', () => {
      process.env.NEXT_PUBLIC_CIPHER_TRANSITION = 'true';

      const { result, rerender } = renderHook(
        ({ text, isVisible }) =>
          useCipherTransition(text, { isVisible }),
        { initialProps: { text: 'Hello', isVisible: false } }
      );

      (global.requestAnimationFrame as ReturnType<typeof vi.fn>).mockClear();
      rerender({ text: 'World', isVisible: false });

      // With isVisible=false, text should update instantly without animation
      expect(result.current.displayChars).toEqual(['W', 'o', 'r', 'l', 'd']);
      expect(result.current.isAnimating).toBe(false);
      expect(global.requestAnimationFrame).not.toHaveBeenCalled();
    });

    it('should animate normally when isVisible is true', () => {
      process.env.NEXT_PUBLIC_CIPHER_TRANSITION = 'true';

      const { rerender } = renderHook(
        ({ text, isVisible }) =>
          useCipherTransition(text, { isVisible }),
        { initialProps: { text: 'Hello', isVisible: true } }
      );

      (global.requestAnimationFrame as ReturnType<typeof vi.fn>).mockClear();
      rerender({ text: 'World', isVisible: true });

      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should handle unmount gracefully', () => {
      const { unmount, result } = renderHook(() => useCipherTransition('Hello'));

      expect(result.current.displayChars).toEqual(['H', 'e', 'l', 'l', 'o']);

      expect(() => unmount()).not.toThrow();
    });

    it('should handle rapid text changes', () => {
      const { rerender, result } = renderHook(
        ({ text }) => useCipherTransition(text),
        { initialProps: { text: 'Hello' } }
      );

      rerender({ text: 'World' });
      rerender({ text: 'Test' });

      expect(result.current.displayChars).toEqual(['T', 'e', 's', 't']);
    });

    it('should reset displayChars to target text when animation is interrupted', () => {
      process.env.NEXT_PUBLIC_CIPHER_TRANSITION = 'true';

      const rafCallbacks: ((time: number) => void)[] = [];
      global.requestAnimationFrame = vi.fn((cb) => {
        rafCallbacks.push(cb);
        return rafCallbacks.length;
      }) as unknown as typeof requestAnimationFrame;

      const { rerender, result } = renderHook(
        ({ text }) => useCipherTransition(text),
        { initialProps: { text: 'Hello' } }
      );

      // Start first animation
      rerender({ text: 'World' });

      // Run one frame to get animation started
      if (rafCallbacks.length > 0) {
        act(() => rafCallbacks[rafCallbacks.length - 1](100));
      }

      // Interrupt with new text — cleanup should reset to a clean (non-scrambled) state
      rerender({ text: 'Final' });

      // The interrupted animation's cleanup writes its plain target text, so no
      // mid-scramble cipher glyphs survive the interruption. cipher glyphs are all
      // non-Latin, so a pure-ASCII result proves nothing stale persisted.
      expect(result.current.displayChars).toEqual(['W', 'o', 'r', 'l', 'd']);
      expect(
        result.current.displayChars.every((char) => /^[A-Za-z]$/.test(char))
      ).toBe(true);
    });

    it('should not produce more displayChars than target text length', () => {
      process.env.NEXT_PUBLIC_CIPHER_TRANSITION = 'true';

      const rafCallbacks: ((time: number) => void)[] = [];
      global.requestAnimationFrame = vi.fn((cb) => {
        rafCallbacks.push(cb);
        return rafCallbacks.length;
      }) as unknown as typeof requestAnimationFrame;

      const { rerender, result } = renderHook(
        ({ text }) => useCipherTransition(text),
        { initialProps: { text: 'A long sentence here' } }
      );

      // Switch to shorter text
      rerender({ text: 'Short' });

      // Run animation frames
      if (rafCallbacks.length > 0) {
        act(() => rafCallbacks[rafCallbacks.length - 1](100));
      }

      // displayChars should never be longer than new target
      expect(result.current.displayChars.length).toBeLessThanOrEqual(5);
    });

    it('should update a late-mounted ref during ref-mode animation', () => {
      process.env.NEXT_PUBLIC_CIPHER_TRANSITION = 'true';

      const rafCallbacks: ((time: number) => void)[] = [];
      global.requestAnimationFrame = vi.fn((cb) => {
        rafCallbacks.push(cb);
        return rafCallbacks.length;
      }) as unknown as typeof requestAnimationFrame;

      const element = document.createElement('span');
      const elementRef = { current: null as HTMLSpanElement | null };
      const nextText = 'B'.repeat(96);

      const { rerender } = renderHook(
        ({ text }) => useCipherTransition(text, { elementRef }),
        { initialProps: { text: 'A'.repeat(96) } }
      );

      rerender({ text: nextText });

      act(() => rafCallbacks.shift()?.(100));
      expect(element.textContent).toBe('');

      elementRef.current = element;

      act(() => rafCallbacks.shift()?.(160));

      expect(element.textContent).toHaveLength(nextText.length);
      expect(element.textContent).not.toBe(nextText);
    });
  });

  // Regression guard for the "animation is too fast — you don't see the letters
  // change" report. Drives the shared RAF scheduler with controlled timestamps and
  // a deterministic Math.random so the per-character resolve schedule is fixed.
  describe('visible scramble progression', () => {
    let rafCallbacks: ((time: number) => void)[];

    beforeEach(() => {
      process.env.NEXT_PUBLIC_CIPHER_TRANSITION = 'true';
      rafCallbacks = [];
      global.requestAnimationFrame = vi.fn((cb) => {
        rafCallbacks.push(cb);
        return rafCallbacks.length;
      }) as unknown as typeof requestAnimationFrame;
      // Fixed value → zero jitter and a stable (non-Latin) scramble glyph, so every
      // assertion below is deterministic and never coincidentally equals the target.
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
    });

    function frame(time: number) {
      const cb = rafCallbacks.shift();
      if (cb) act(() => cb(time));
    }

    it('keeps characters scrambling well past the old fast timing before resolving', () => {
      const { result, rerender } = renderHook(
        ({ text }) => useCipherTransition(text),
        { initialProps: { text: 'Hello' } }
      );

      rerender({ text: 'World' });

      // First frame (elapsed 0): every letter is scrambled, none resolved yet.
      frame(1000);
      expect(result.current.isAnimating).toBe(true);
      expect(result.current.displayChars).toHaveLength(5);
      expect(result.current.displayChars.join('')).not.toBe('World');

      // At 300ms elapsed the first character must STILL be scrambling. Under the old
      // profile (first char resolved at ~180ms) this char would already read 'W',
      // which is exactly the "you don't see it change" bug.
      frame(1300);
      expect(result.current.displayChars[0]).not.toBe('W');
      expect(result.current.displayChars.join('')).not.toBe('World');

      // Eventually everything resolves to the target and animation stops.
      frame(5000);
      expect(result.current.displayChars).toEqual(['W', 'o', 'r', 'l', 'd']);
      expect(result.current.isAnimating).toBe(false);
    });

    it('resolves characters progressively (left-to-right wave), not all at once', () => {
      const { result, rerender } = renderHook(
        ({ text }) => useCipherTransition(text),
        { initialProps: { text: 'Hello' } }
      );

      rerender({ text: 'World' });

      frame(1000); // start

      // Mid-animation: the leading character has locked in while a trailing one is
      // still cycling — proof the reveal is a visible staggered wave.
      frame(1700);
      const mid = result.current.displayChars;
      expect(mid[0]).toBe('W');
      expect(mid[mid.length - 1]).not.toBe('d');
    });

    it('keeps digits, spaces and punctuation literal while only letters scramble', () => {
      const { result, rerender } = renderHook(
        ({ text }) => useCipherTransition(text),
        { initialProps: { text: 'Hello' } }
      );

      rerender({ text: 'Go 5!' });

      frame(1000); // start

      // Early frame: letters are scrambled to cipher glyphs, but the space, digit
      // and punctuation are written as their literal target from the first frame.
      frame(1300);
      const early = result.current.displayChars;
      expect(early[2]).toBe(' ');
      expect(early[3]).toBe('5');
      expect(early[4]).toBe('!');
      expect(early[0]).not.toBe('G');
      expect(early[1]).not.toBe('o');

      // Everything resolves to the literal target.
      frame(5000);
      expect(result.current.displayChars).toEqual(['G', 'o', ' ', '5', '!']);
      expect(result.current.isAnimating).toBe(false);
    });
  });
});
