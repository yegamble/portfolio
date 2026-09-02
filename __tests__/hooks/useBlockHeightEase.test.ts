import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useBlockHeightEase } from '@/hooks/useBlockHeightEase';

describe('useBlockHeightEase', () => {
  let element: HTMLElement;
  let elementRef: { current: HTMLElement | null };
  let isVisibleRef: { current: boolean };
  let resizeCallbacks: ResizeObserverCallback[];
  let disconnectMock: ReturnType<typeof vi.fn>;
  let originalResizeObserver: typeof ResizeObserver | undefined;

  /**
   * jsdom reports a zero rect for everything, so the box's height is scripted.
   * A commit reads it twice (the height an in-flight ease is at, then the
   * natural height React just committed), so the values are queued and the last
   * one repeats. The returned array records the inline height in effect at each
   * read, which is what the ease pinned before forcing its reflow.
   */
  function stubHeights(...heights: number[]) {
    const queue = [...heights];
    const inlineHeightAtRead: string[] = [];
    element.getBoundingClientRect = vi.fn(() => {
      inlineHeightAtRead.push(element.style.height);
      const height = queue.length > 1 ? queue.shift()! : queue[0];
      return { height, width: 0, top: 0, bottom: height, left: 0, right: 0 } as DOMRect;
    });
    return inlineHeightAtRead;
  }

  /** A height a ResizeObserver would have reported after layout. */
  function reportSettledHeight(height: number, { borderBox = true } = {}) {
    const entry = {
      borderBoxSize: borderBox ? [{ blockSize: height, inlineSize: 0 }] : undefined,
      contentRect: { height },
    } as unknown as ResizeObserverEntry;
    resizeCallbacks.forEach((callback) => callback([entry], {} as ResizeObserver));
  }

  function endHeightTransition() {
    const event = new Event('transitionend', { bubbles: true });
    Object.defineProperty(event, 'propertyName', { value: 'height' });
    element.dispatchEvent(event);
  }

  function renderEase(enabled = true) {
    return renderHook(({ text }) => useBlockHeightEase(elementRef, text, enabled, isVisibleRef), {
      initialProps: { text: 'Alpha' },
    });
  }

  beforeEach(() => {
    element = document.createElement('span');
    document.body.append(element);
    elementRef = { current: element };
    isVisibleRef = { current: true };
    resizeCallbacks = [];
    disconnectMock = vi.fn();

    originalResizeObserver = global.ResizeObserver;
    global.ResizeObserver = vi.fn(function (
      this: ResizeObserver,
      callback: ResizeObserverCallback
    ) {
      resizeCallbacks.push(callback);
      return { observe: vi.fn(), unobserve: vi.fn(), disconnect: disconnectMock };
    }) as unknown as typeof ResizeObserver;

    // jsdom has a CSS namespace but no CSS.supports, and the ease refuses to run
    // without `overflow-y: clip` support.
    (globalThis.CSS as unknown as { supports?: () => boolean }).supports = () => true;

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
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
    delete (globalThis.CSS as unknown as { supports?: () => boolean }).supports;
    global.ResizeObserver = originalResizeObserver as typeof ResizeObserver;
    document.body.innerHTML = '';
  });

  it('should ease from the height the reader saw to the newly committed one', () => {
    const { rerender } = renderEase();

    reportSettledHeight(240);
    const inlineHeightAtRead = stubHeights(180);
    rerender({ text: 'Beta' });

    expect(inlineHeightAtRead).toContain('240px');
    expect(element.style.height).toBe('180px');
    expect(element.style.transition).toBe('height 300ms ease-out');
    // A box easing upwards is briefly shorter than its own content.
    expect(element.style.overflowY).toBe('clip');
  });

  it('should hand the element back to natural sizing when the ease ends', () => {
    const { rerender } = renderEase();

    reportSettledHeight(240);
    stubHeights(180);
    rerender({ text: 'Beta' });
    endHeightTransition();

    expect(element.style.height).toBe('');
    expect(element.style.transition).toBe('');
    expect(element.style.overflowY).toBe('');
  });

  it('should restart cleanly from the rendered height when the text changes mid-ease', () => {
    const { rerender } = renderEase();

    reportSettledHeight(240);
    stubHeights(180);
    rerender({ text: 'Beta' });
    expect(element.style.height).toBe('180px');

    // Mid-flight: the box has animated down to 210 and the next translation is
    // taller again. The ease must pick up from 210, not from 180 (where it was
    // heading) and not from 240 (where it started).
    const inlineHeightAtRead = stubHeights(210, 260);
    rerender({ text: 'Gamma' });

    expect(inlineHeightAtRead).toContain('210px');
    expect(element.style.height).toBe('260px');

    endHeightTransition();
    expect(element.style.height).toBe('');
  });

  it("should ignore the ease's own frames when recording the settled height", () => {
    const { rerender } = renderEase();

    reportSettledHeight(240);
    stubHeights(180);
    rerender({ text: 'Beta' });

    // The observer fires on every frame of the transition it is watching. Those
    // heights are mid-animation, not settled: recording one would make the next
    // switch start from wherever this ease happened to be.
    reportSettledHeight(210);
    endHeightTransition();

    // Nothing arrives from the observer after the transition ends, which is why
    // the guard is the only thing protecting this: dropping an inline height
    // that already equals the natural one resizes no box. The last height the
    // observer saw was that mid-flight 210.
    const inlineHeightAtRead = stubHeights(260);
    rerender({ text: 'Gamma' });

    expect(inlineHeightAtRead).toContain('180px');
    expect(inlineHeightAtRead).not.toContain('210px');
    expect(element.style.height).toBe('260px');
  });

  it('should record a genuine resize that lands after the ease has finished', () => {
    const { rerender } = renderEase();

    reportSettledHeight(240);
    stubHeights(180);
    rerender({ text: 'Beta' });
    endHeightTransition();

    // Not every post-ease report is noise — a font finishing or the viewport
    // changing genuinely resettles the box, and that height is the one the next
    // switch has to start from.
    reportSettledHeight(200);

    const inlineHeightAtRead = stubHeights(260);
    rerender({ text: 'Gamma' });

    expect(inlineHeightAtRead).toContain('200px');
  });

  it('should measure the border box, falling back to the rect when none is reported', () => {
    const { rerender } = renderEase();

    // contentRect and borderBoxSize disagree; the inline `height` the ease
    // writes is a border box, so that is the one to record.
    const entry = {
      borderBoxSize: [{ blockSize: 240, inlineSize: 0 }],
      contentRect: { height: 200 },
    } as unknown as ResizeObserverEntry;
    resizeCallbacks.forEach((callback) => callback([entry], {} as ResizeObserver));

    const inlineHeightAtRead = stubHeights(180);
    rerender({ text: 'Beta' });

    expect(inlineHeightAtRead).toContain('240px');
  });

  it('should fall back to the rect when the observer reports no border box size', () => {
    const { rerender } = renderEase();

    stubHeights(300);
    reportSettledHeight(0, { borderBox: false });

    stubHeights(180);
    rerender({ text: 'Beta' });

    // 300 came from the rect read inside the observer callback, not from the
    // (absent) borderBoxSize.
    expect(element.style.height).toBe('180px');
  });

  it('should skip the ease while the instance is off-screen', () => {
    const { rerender } = renderEase();

    reportSettledHeight(240);
    isVisibleRef.current = false;
    stubHeights(180);
    rerender({ text: 'Beta' });

    expect(element.style.height).toBe('');
    expect(element.style.transition).toBe('');
  });

  it('should keep its bookkeeping while off-screen so the next visible switch eases correctly', () => {
    const { rerender } = renderEase();

    reportSettledHeight(240);
    isVisibleRef.current = false;
    stubHeights(180);
    rerender({ text: 'Beta' });

    isVisibleRef.current = true;
    const inlineHeightAtRead = stubHeights(260);
    rerender({ text: 'Gamma' });

    // 180 is where the invisible switch left the box, not the stale 240.
    expect(inlineHeightAtRead).toContain('180px');
    expect(element.style.height).toBe('260px');
  });

  it('should skip the ease when the reader prefers reduced motion', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { rerender } = renderEase();

    reportSettledHeight(240);
    stubHeights(180);
    rerender({ text: 'Beta' });

    expect(element.style.height).toBe('');
    expect(element.style.transition).toBe('');
  });

  it('should skip the ease when the environment has no ResizeObserver', () => {
    // @ts-expect-error deliberately removing the API the ease depends on
    delete global.ResizeObserver;

    const { rerender } = renderEase();

    stubHeights(180);
    rerender({ text: 'Beta' });

    expect(element.style.height).toBe('');
  });

  it('should skip the ease for a sub-pixel height change', () => {
    const { rerender } = renderEase();

    reportSettledHeight(240);
    stubHeights(240.5);
    rerender({ text: 'Beta' });

    expect(element.style.height).toBe('');
  });

  it('should observe nothing when disabled', () => {
    const { rerender } = renderEase(false);

    rerender({ text: 'Beta' });

    expect(global.ResizeObserver).not.toHaveBeenCalled();
    expect(element.style.height).toBe('');
  });

  it('should stop observing and drop any inline height on unmount', () => {
    const { rerender, unmount } = renderEase();

    reportSettledHeight(240);
    stubHeights(180);
    rerender({ text: 'Beta' });

    unmount();

    expect(disconnectMock).toHaveBeenCalled();
    expect(element.style.height).toBe('');
    expect(element.style.transition).toBe('');
  });
});
