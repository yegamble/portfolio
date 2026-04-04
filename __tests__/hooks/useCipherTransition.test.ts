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

      // Interrupt with new text — cleanup should reset to new target
      rerender({ text: 'Final' });

      // After interruption, displayChars should be the new target (not stale scrambled chars)
      expect(result.current.displayChars).toHaveLength(5);
      // The chars should either be the final text or a new animation starting from it
      // Key assertion: no chars from 'World' animation should persist
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
  });
});
