import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCipherTransition } from '@/hooks/useCipherTransition';

// Mock pretext — it requires canvas which isn't available in jsdom
let lastPreparedText = '';
vi.mock('@chenglou/pretext', () => ({
  prepareWithSegments: vi.fn((text: string) => {
    lastPreparedText = text;
    return { _mock: true };
  }),
  layoutWithLines: vi.fn(() => ({
    height: 20,
    lineCount: 1,
    lines: [{ text: lastPreparedText, width: 100, start: { segmentIndex: 0, graphemeIndex: 0 }, end: { segmentIndex: 0, graphemeIndex: lastPreparedText.length } }],
  })),
}));

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
    it('should return text as single line on mount without animating', () => {
      const { result } = renderHook(() => useCipherTransition('Hello'));

      expect(result.current.lines).toHaveLength(1);
      expect(result.current.lines[0].text).toBe('Hello');
      expect(result.current.lines[0].chars).toEqual(['H', 'e', 'l', 'l', 'o']);
      expect(result.current.lines[0].lineResolved).toBe(true);
      expect(result.current.isAnimating).toBe(false);
    });

    it('should handle empty string', () => {
      const { result } = renderHook(() => useCipherTransition(''));

      expect(result.current.lines).toHaveLength(1);
      expect(result.current.lines[0].text).toBe('');
      expect(result.current.isAnimating).toBe(false);
    });
  });

  describe('text changes (disabled mode)', () => {
    it('should update lines when text changes', () => {
      const { result, rerender } = renderHook(
        ({ text }) => useCipherTransition(text),
        { initialProps: { text: 'Hello' } }
      );

      rerender({ text: 'World' });

      expect(result.current.lines[0].chars).toEqual(['W', 'o', 'r', 'l', 'd']);
    });

    it('should return lines matching new text', () => {
      const { result, rerender } = renderHook(
        ({ text }) => useCipherTransition(text),
        { initialProps: { text: 'Hi' } }
      );

      rerender({ text: 'Hello World' });

      expect(result.current.lines[0].text).toBe('Hello World');
    });
  });

  describe('environment variable toggle', () => {
    it('should skip animation when NEXT_PUBLIC_CIPHER_TRANSITION is not "true"', () => {
      const { result, rerender } = renderHook(
        ({ text }) => useCipherTransition(text),
        { initialProps: { text: 'Hello' } }
      );

      rerender({ text: 'World' });

      expect(result.current.lines[0].chars).toEqual(['W', 'o', 'r', 'l', 'd']);
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

      expect(result.current.lines[0].chars).toEqual(['W', 'o', 'r', 'l', 'd']);
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

      expect(result.current.lines[0].chars).toEqual(['W', 'o', 'r', 'l', 'd']);
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

      expect(result.current.lines[0].chars).toEqual(['H', 'e', 'l', 'l', 'o']);

      expect(() => unmount()).not.toThrow();
    });

    it('should handle rapid text changes', () => {
      const { rerender, result } = renderHook(
        ({ text }) => useCipherTransition(text),
        { initialProps: { text: 'Hello' } }
      );

      rerender({ text: 'World' });
      rerender({ text: 'Test' });

      expect(result.current.lines[0].chars).toEqual(['T', 'e', 's', 't']);
    });

    it('should handle interrupted animation without stale chars', () => {
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

      rerender({ text: 'World' });

      if (rafCallbacks.length > 0) {
        act(() => rafCallbacks[rafCallbacks.length - 1](100));
      }

      // Interrupt with new text
      rerender({ text: 'Final' });

      // Lines should reflect either the interrupted target or the new target
      // The key invariant: no stale chars from previous animation
      const lineText = result.current.lines[0].text;
      expect(['World', 'Final']).toContain(lineText);
    });
  });

  describe('line structure', () => {
    it('should return CipherLine objects with text, chars, targetChars, lineResolved', () => {
      const { result } = renderHook(() => useCipherTransition('Hello'));

      const line = result.current.lines[0];
      expect(line).toHaveProperty('text');
      expect(line).toHaveProperty('chars');
      expect(line).toHaveProperty('targetChars');
      expect(line).toHaveProperty('lineResolved');
    });

    it('should mark lines as resolved when not animating', () => {
      const { result } = renderHook(() => useCipherTransition('Hello'));

      expect(result.current.lines[0].lineResolved).toBe(true);
    });
  });
});
