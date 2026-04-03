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
    it('should not animate on mount', () => {
      const { result } = renderHook(() => useCipherTransition('Hello'));

      expect(result.current.isAnimating).toBe(false);
      expect(result.current.containerRef).toBeDefined();
    });

    it('should handle empty string', () => {
      const { result } = renderHook(() => useCipherTransition(''));

      expect(result.current.isAnimating).toBe(false);
    });
  });

  describe('text changes (disabled mode)', () => {
    it('should not animate when disabled', () => {
      const { result, rerender } = renderHook(
        ({ text }) => useCipherTransition(text),
        { initialProps: { text: 'Hello' } }
      );

      rerender({ text: 'World' });

      expect(result.current.isAnimating).toBe(false);
    });
  });

  describe('environment variable toggle', () => {
    it('should skip animation when NEXT_PUBLIC_CIPHER_TRANSITION is not "true"', () => {
      const { result, rerender } = renderHook(
        ({ text }) => useCipherTransition(text),
        { initialProps: { text: 'Hello' } }
      );

      rerender({ text: 'World' });

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

    it('should set isAnimating to true after first RAF tick when animation is enabled', () => {
      process.env.NEXT_PUBLIC_CIPHER_TRANSITION = 'true';

      let rafCallback: FrameRequestCallback | null = null;
      global.requestAnimationFrame = vi.fn((cb) => {
        rafCallback = cb;
        return 1;
      }) as unknown as typeof requestAnimationFrame;

      const { result, rerender } = renderHook(
        ({ text }) => useCipherTransition(text),
        { initialProps: { text: 'Hello' } }
      );

      rerender({ text: 'World' });

      // isAnimating is set inside the RAF callback, not synchronously
      expect(result.current.isAnimating).toBe(false);

      // Simulate first RAF tick — triggers setIsAnimating(true)
      if (rafCallback) {
        act(() => {
          (rafCallback as FrameRequestCallback)(1000);
        });
      }

      expect(result.current.isAnimating).toBe(true);
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

      expect(result.current.isAnimating).toBe(false);
    });

    it('should not animate when reduced motion is preferred even with animation enabled', () => {
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

      const { result, rerender } = renderHook(
        ({ text }) => useCipherTransition(text),
        { initialProps: { text: 'Hello' } }
      );

      rerender({ text: 'World' });

      expect(result.current.isAnimating).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should handle unmount gracefully', () => {
      const { unmount, result } = renderHook(() => useCipherTransition('Hello'));

      expect(result.current.isAnimating).toBe(false);

      expect(() => unmount()).not.toThrow();
    });

    it('should handle rapid text changes', () => {
      const { result, rerender } = renderHook(
        ({ text }) => useCipherTransition(text),
        { initialProps: { text: 'Hello' } }
      );

      rerender({ text: 'World' });
      rerender({ text: 'Test' });

      expect(result.current.isAnimating).toBe(false);
    });
  });

  describe('containerRef', () => {
    it('should provide a containerRef for DOM manipulation', () => {
      const { result } = renderHook(() => useCipherTransition('Hello'));

      expect(result.current.containerRef).toBeDefined();
      expect(result.current.containerRef.current).toBeNull();
    });
  });
});
