import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

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
    offsetHeight: 100,
    clientWidth: 400,
    parentElement: {
      clientWidth: 400,
    },
    ...overrides,
  } as unknown as HTMLSpanElement;

  // Mock getComputedStyle for this element
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
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
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
    // ref.current is null — no DOM element
    expect(result.current.style).toHaveProperty('display', 'inline-block');
    expect(result.current.style).toHaveProperty('width', '100%');
    expect(result.current.style).not.toHaveProperty('minHeight');
  });

  it('should compute minHeight when ref is attached and text changes', () => {
    const { result, rerender } = renderHook(
      ({ text }) => usePretextHeight(text, true),
      { initialProps: { text: 'Hello' } }
    );

    // Simulate ref attachment
    const el = createMockElement();
    Object.defineProperty(result.current.ref, 'current', {
      value: el,
      writable: true,
    });

    // Trigger text change
    rerender({ text: 'New text in Hebrew' });

    expect(mockPrepare).toHaveBeenCalledWith(
      'New text in Hebrew',
      '400 16px Inter, Heebo, sans-serif'
    );
    expect(mockLayout).toHaveBeenCalledWith(
      { __brand: 'prepared' },
      400,
      26
    );
    // minHeight should be max(currentHeight=100, targetHeight=120) = 120
    expect(result.current.style).toHaveProperty('minHeight', '120px');
  });

  it('should transition minHeight to target after animation duration', () => {
    const { result, rerender } = renderHook(
      ({ text }) => usePretextHeight(text, true),
      { initialProps: { text: 'Hello' } }
    );

    const el = createMockElement();
    Object.defineProperty(result.current.ref, 'current', {
      value: el,
      writable: true,
    });

    rerender({ text: 'New text' });

    // Initially max(100, 120) = 120
    expect(result.current.style).toHaveProperty('minHeight', '120px');

    // After animation duration, should settle to target height
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.style).toHaveProperty('minHeight', '120px');
  });

  it('should use max of current and target height to prevent shrink', () => {
    // Target height (60) < current height (100) → use current during animation
    mockLayout.mockReturnValueOnce({ height: 60, lineCount: 3 });

    const { result, rerender } = renderHook(
      ({ text }) => usePretextHeight(text, true),
      { initialProps: { text: 'Long text' } }
    );

    const el = createMockElement({ offsetHeight: 100 } as Partial<HTMLSpanElement>);
    Object.defineProperty(result.current.ref, 'current', {
      value: el,
      writable: true,
    });

    rerender({ text: 'Short' });

    // During animation: max(100, 60) = 100
    expect(result.current.style).toHaveProperty('minHeight', '100px');

    // After animation: settle to target = 60
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.style).toHaveProperty('minHeight', '60px');
  });

  it('should return valid style when ref is attached but text has not changed', () => {
    const { result } = renderHook(() => usePretextHeight('Same text', true));

    const el = createMockElement({ clientWidth: 0 } as Partial<HTMLSpanElement>);
    Object.defineProperty(result.current.ref, 'current', {
      value: el,
      writable: true,
    });

    // Text hasn't changed — should not throw, should return base style
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

    // Should use fallback font string
    expect(mockPrepare).toHaveBeenCalledWith(
      'Changed',
      expect.stringContaining('Inter')
    );
  });

  it('should include transition in style', () => {
    const { result } = renderHook(() => usePretextHeight('Hello', true));
    expect(result.current.style).toHaveProperty('transition');
  });

  it('should handle unmount gracefully', () => {
    const { unmount } = renderHook(() => usePretextHeight('Hello', true));
    expect(() => unmount()).not.toThrow();
  });
});
