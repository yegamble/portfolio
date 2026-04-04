import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@chenglou/pretext', () => ({
  prepare: vi.fn(() => ({ __brand: 'prepared' })),
  layout: vi.fn(() => ({ height: 120, lineCount: 5 })),
}));

import { prepare, layout } from '@chenglou/pretext';
import { usePretextHeight } from '@/hooks/usePretextHeight';

const mockPrepare = vi.mocked(prepare);
const mockLayout = vi.mocked(layout);

function createMockElement(overrides: Partial<HTMLSpanElement> = {}): HTMLSpanElement {
  const el = {
    clientWidth: 400,
    parentElement: {
      clientWidth: 400,
    },
    ...overrides,
  } as unknown as HTMLSpanElement;

  vi.spyOn(window, 'getComputedStyle').mockReturnValue({
    font: '400 16px Inter, Heebo, sans-serif',
    lineHeight: '26px',
  } as unknown as CSSStyleDeclaration);

  return el;
}

describe('usePretextHeight', () => {
  beforeEach(() => {
    mockPrepare.mockClear();
    mockLayout.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return a ref and style object', () => {
    const { result } = renderHook(() => usePretextHeight('Hello world', true));
    expect(result.current.ref).toBeDefined();
    expect(result.current.style).toBeDefined();
  });

  it('should return empty style when disabled', () => {
    const { result } = renderHook(() => usePretextHeight('Hello world', false));
    expect(result.current.style).toEqual({});
  });

  it('should return base block style when enabled but ref not attached', () => {
    const { result } = renderHook(() => usePretextHeight('Hello world', true));
    expect(result.current.style).toHaveProperty('display', 'inline-block');
    expect(result.current.style).toHaveProperty('width', '100%');
    expect(result.current.style).not.toHaveProperty('maxHeight');
  });

  it('should measure both old and new text via pretext on text change', () => {
    const { result, rerender } = renderHook(
      ({ text }) => usePretextHeight(text, true),
      { initialProps: { text: 'Hello' } }
    );

    const el = createMockElement();
    Object.defineProperty(result.current.ref, 'current', {
      value: el,
      writable: true,
    });

    rerender({ text: 'New text in Hebrew' });

    expect(mockPrepare).toHaveBeenCalledWith(
      'Hello',
      '400 16px Inter, Heebo, sans-serif'
    );
    expect(mockPrepare).toHaveBeenCalledWith(
      'New text in Hebrew',
      '400 16px Inter, Heebo, sans-serif'
    );
    expect(mockLayout).toHaveBeenCalledWith(
      { __brand: 'prepared' },
      400,
      26
    );
  });

  it('should not apply maxHeight when not animating', () => {
    const { result, rerender } = renderHook(
      ({ text }) => usePretextHeight(text, true, false),
      { initialProps: { text: 'Hello' } }
    );

    const el = createMockElement();
    Object.defineProperty(result.current.ref, 'current', {
      value: el,
      writable: true,
    });

    rerender({ text: 'Changed' });

    expect(result.current.style).not.toHaveProperty('maxHeight');
    expect(result.current.style).not.toHaveProperty('overflow');
  });

  it('should return valid style when ref is attached but text has not changed', () => {
    const { result } = renderHook(() => usePretextHeight('Same text', true));

    const el = createMockElement({ clientWidth: 0 } as Partial<HTMLSpanElement>);
    Object.defineProperty(result.current.ref, 'current', {
      value: el,
      writable: true,
    });

    expect(result.current.style).toHaveProperty('display', 'inline-block');
    expect(mockPrepare).not.toHaveBeenCalled();
  });

  it('should handle font string fallback when getComputedStyle returns empty', () => {
    const { result, rerender } = renderHook(
      ({ text }) => usePretextHeight(text, true),
      { initialProps: { text: 'Hello' } }
    );

    const el = createMockElement();
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      font: '',
      lineHeight: 'normal',
    } as unknown as CSSStyleDeclaration);
    Object.defineProperty(result.current.ref, 'current', {
      value: el,
      writable: true,
    });

    rerender({ text: 'Changed' });

    expect(mockPrepare).toHaveBeenCalledWith(
      'Changed',
      expect.stringContaining('Inter')
    );
  });

  it('should include min-height transition in style', () => {
    const { result } = renderHook(() => usePretextHeight('Hello', true));
    expect(result.current.style).toHaveProperty('transition');
    const transition = result.current.style.transition as string;
    expect(transition).toContain('min-height');
  });

  it('should handle unmount gracefully', () => {
    const { unmount } = renderHook(() => usePretextHeight('Hello', true));
    expect(() => unmount()).not.toThrow();
  });

  describe('height clamping with isAnimating', () => {
    it('should apply maxHeight and overflow hidden when isAnimating is true and text changes', () => {
      mockLayout
        .mockReturnValueOnce({ height: 100, lineCount: 4 })
        .mockReturnValueOnce({ height: 120, lineCount: 5 });

      const { result, rerender } = renderHook(
        ({ text, isAnimating }) => usePretextHeight(text, true, isAnimating),
        { initialProps: { text: 'Hello', isAnimating: false } }
      );

      const el = createMockElement();
      Object.defineProperty(result.current.ref, 'current', {
        value: el,
        writable: true,
      });

      rerender({ text: 'New text in Hebrew', isAnimating: true });

      expect(result.current.style).toHaveProperty('maxHeight', '120px');
      expect(result.current.style).toHaveProperty('overflow', 'hidden');
    });

    it('should remove maxHeight and set minHeight to target when isAnimating goes false', () => {
      mockLayout
        .mockReturnValueOnce({ height: 100, lineCount: 4 })
        .mockReturnValueOnce({ height: 80, lineCount: 3 });

      const { result, rerender } = renderHook(
        ({ text, isAnimating }) => usePretextHeight(text, true, isAnimating),
        { initialProps: { text: 'Hello', isAnimating: false } }
      );

      const el = createMockElement();
      Object.defineProperty(result.current.ref, 'current', {
        value: el,
        writable: true,
      });

      rerender({ text: 'Short HE', isAnimating: true });

      expect(result.current.style).toHaveProperty('maxHeight', '100px');
      expect(result.current.style).toHaveProperty('overflow', 'hidden');

      rerender({ text: 'Short HE', isAnimating: false });

      expect(result.current.style).not.toHaveProperty('maxHeight');
      expect(result.current.style).not.toHaveProperty('overflow');
      expect(result.current.style).toHaveProperty('minHeight', '80px');
    });

    it('should measure both old and new text heights via pretext', () => {
      mockLayout
        .mockReturnValueOnce({ height: 146, lineCount: 6 })
        .mockReturnValueOnce({ height: 88, lineCount: 4 });

      const { result, rerender } = renderHook(
        ({ text, isAnimating }) => usePretextHeight(text, true, isAnimating),
        { initialProps: { text: 'English paragraph', isAnimating: false } }
      );

      const el = createMockElement();
      Object.defineProperty(result.current.ref, 'current', {
        value: el,
        writable: true,
      });

      rerender({ text: 'Hebrew paragraph', isAnimating: true });

      expect(mockPrepare).toHaveBeenCalledTimes(2);
      expect(mockPrepare).toHaveBeenCalledWith('English paragraph', expect.any(String));
      expect(mockPrepare).toHaveBeenCalledWith('Hebrew paragraph', expect.any(String));
    });

    it('should use max of old and new height to prevent overshoot', () => {
      mockLayout
        .mockReturnValueOnce({ height: 100, lineCount: 4 })
        .mockReturnValueOnce({ height: 60, lineCount: 3 });

      const { result, rerender } = renderHook(
        ({ text, isAnimating }) => usePretextHeight(text, true, isAnimating),
        { initialProps: { text: 'Long text', isAnimating: false } }
      );

      const el = createMockElement();
      Object.defineProperty(result.current.ref, 'current', {
        value: el,
        writable: true,
      });

      rerender({ text: 'Short', isAnimating: true });

      // max(100, 60) = 100 — prevents overshoot
      expect(result.current.style).toHaveProperty('maxHeight', '100px');

      // Animation completes → release to target = 60
      rerender({ text: 'Short', isAnimating: false });
      expect(result.current.style).toHaveProperty('minHeight', '60px');
      expect(result.current.style).not.toHaveProperty('maxHeight');
    });
  });
});
