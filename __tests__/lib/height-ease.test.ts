import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cancelHeightEase, easeHeight, isHeightEasing } from '@/lib/height-ease';

/**
 * easeHeight refuses to run without `overflow-y: clip` support, so the tests
 * fake the answer rather than the whole CSS namespace (CSS.escape and friends
 * stay intact). jsdom 30 ships its own CSS.supports on the namespace's
 * prototype, so the fake has to be an own property that shadows it, and
 * `undefined` stands in for an engine that has no CSS.supports at all —
 * assigning `css.supports = undefined` would not do: deleting an own property
 * only reveals the inherited one again.
 */
function stubCssSupports(supported: boolean | undefined) {
  const css = globalThis.CSS as unknown as { supports?: (p: string, v: string) => boolean };
  Object.defineProperty(css, 'supports', {
    value: supported === undefined ? undefined : () => supported,
    configurable: true,
    enumerable: true,
    writable: true,
  });
  return () => {
    delete css.supports;
  };
}

function mountBox() {
  const element = document.createElement('span');
  element.style.display = 'inline-block';
  document.body.append(element);
  return element;
}

function endHeightTransition(element: HTMLElement) {
  const event = new Event('transitionend', { bubbles: true });
  Object.defineProperty(event, 'propertyName', { value: 'height' });
  element.dispatchEvent(event);
}

describe('easeHeight', () => {
  let element: HTMLElement;

  let restoreCssSupports: () => void;

  beforeEach(() => {
    vi.useFakeTimers();
    restoreCssSupports = stubCssSupports(true);
    element = mountBox();
  });

  afterEach(() => {
    cancelHeightEase(element);
    restoreCssSupports();
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('transitions the element from the old height to the new one', () => {
    easeHeight(element, 240, 180);

    expect(element.style.height).toBe('180px');
    expect(element.style.transition).toBe('height 300ms ease-out');
    expect(isHeightEasing(element)).toBe(true);
  });

  it('clips vertical overflow so a growing box does not paint over the content below', () => {
    easeHeight(element, 180, 240);

    // `clip` rather than `hidden`: clip creates no scroll container, so the
    // inline-block wrapper keeps its baseline and the line box its height.
    expect(element.style.overflowY).toBe('clip');
  });

  it('pins the start height and flushes it before transitioning away from it', () => {
    const heightsAtReflow: string[] = [];
    element.getBoundingClientRect = vi.fn(() => {
      heightsAtReflow.push(element.style.height);
      return { height: 0 } as DOMRect;
    });

    easeHeight(element, 240, 180);

    // Without a forced reflow between the two writes the browser coalesces them
    // into a single style change and no transition runs at all.
    expect(heightsAtReflow).toEqual(['240px']);
  });

  it('accepts a custom duration', () => {
    easeHeight(element, 100, 200, { durationMs: 120 });

    expect(element.style.transition).toBe('height 120ms ease-out');
  });

  it("clears the inline styles on the height transition's end", () => {
    easeHeight(element, 240, 180);

    endHeightTransition(element);

    expect(element.style.height).toBe('');
    expect(element.style.transition).toBe('');
    expect(element.style.overflowY).toBe('');
    expect(isHeightEasing(element)).toBe(false);
  });

  it('ignores a transitionend for another property', () => {
    easeHeight(element, 240, 180);

    const event = new Event('transitionend', { bubbles: true });
    Object.defineProperty(event, 'propertyName', { value: 'opacity' });
    element.dispatchEvent(event);

    expect(element.style.height).toBe('180px');
    expect(isHeightEasing(element)).toBe(true);
  });

  it('ignores a transitionend bubbling up from a descendant', () => {
    const child = document.createElement('span');
    element.append(child);
    easeHeight(element, 240, 180);

    endHeightTransition(child);

    expect(element.style.height).toBe('180px');
    expect(isHeightEasing(element)).toBe(true);
  });

  it('clears the inline styles from the timeout fallback when no transitionend arrives', () => {
    easeHeight(element, 240, 180);

    vi.advanceTimersByTime(349);
    expect(element.style.height).toBe('180px');

    vi.advanceTimersByTime(1);

    expect(element.style.height).toBe('');
    expect(element.style.transition).toBe('');
    expect(element.style.overflowY).toBe('');
    expect(isHeightEasing(element)).toBe(false);
  });

  it('does not run its cleanup twice when the timeout follows a transitionend', () => {
    easeHeight(element, 240, 180);
    endHeightTransition(element);

    element.style.height = '500px';
    vi.advanceTimersByTime(400);

    // A finished ease must not reach back in and clear a height something else
    // has set since.
    expect(element.style.height).toBe('500px');
  });

  it('cancels an in-flight ease when a second one starts on the same element', () => {
    easeHeight(element, 240, 180);
    vi.advanceTimersByTime(100);
    easeHeight(element, 200, 300);

    expect(element.style.height).toBe('300px');

    // The first ease's fallback would have fired here; it must not tear down
    // the second one's styles.
    vi.advanceTimersByTime(250);
    expect(element.style.height).toBe('300px');
    expect(isHeightEasing(element)).toBe(true);

    vi.advanceTimersByTime(100);
    expect(element.style.height).toBe('');
    expect(isHeightEasing(element)).toBe(false);
  });

  it('leaves no stale listener behind when a second ease supersedes the first', () => {
    const removeSpy = vi.spyOn(element, 'removeEventListener');

    easeHeight(element, 240, 180);
    easeHeight(element, 180, 240);

    expect(removeSpy).toHaveBeenCalledWith('transitionend', expect.any(Function));
  });

  it('restores natural sizing immediately when cancelled', () => {
    easeHeight(element, 240, 180);

    cancelHeightEase(element);

    expect(element.style.height).toBe('');
    expect(element.style.transition).toBe('');
    expect(element.style.overflowY).toBe('');
    expect(isHeightEasing(element)).toBe(false);
  });

  it('does not ease at all on an engine without overflow-y: clip', () => {
    restoreCssSupports();
    restoreCssSupports = stubCssSupports(false);

    easeHeight(element, 240, 180);

    // No `hidden` fallback on purpose: it would turn the wrapper into a scroll
    // container, moving an inline-block's baseline to its bottom margin edge and
    // inflating the line box around it for the length of the animation.
    expect(element.style.height).toBe('');
    expect(element.style.overflowY).toBe('');
    expect(isHeightEasing(element)).toBe(false);
  });

  it('does not ease when the engine has no CSS.supports to ask', () => {
    restoreCssSupports();
    restoreCssSupports = stubCssSupports(undefined);

    easeHeight(element, 240, 180);

    expect(element.style.height).toBe('');
    expect(isHeightEasing(element)).toBe(false);
  });

  it('is a no-op to cancel an element that is not easing', () => {
    element.style.height = '42px';

    expect(() => cancelHeightEase(element)).not.toThrow();
    expect(element.style.height).toBe('42px');
    expect(isHeightEasing(element)).toBe(false);
  });
});
