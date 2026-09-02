import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { pinViewportDuringReflow } from '@/lib/viewport-pin';

describe('pinViewportDuringReflow', () => {
  let frames: FrameRequestCallback[];
  let scrollBy: ReturnType<typeof vi.spyOn>;

  /**
   * jsdom reports a zero rect for everything, so the landmark that straddles
   * the viewport centre is faked. `drift.top` is read on every measurement, so
   * moving it simulates the page reflowing under the reader.
   */
  function mountAnchor(drift: { top: number }) {
    const footer = document.createElement('footer');
    footer.getBoundingClientRect = () => ({ top: drift.top, bottom: drift.top + 2000 }) as DOMRect;
    document.body.append(footer);
    return footer;
  }

  function runFrame(time = 0) {
    frames.shift()?.(time);
  }

  beforeEach(() => {
    frames = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });
    scrollBy = vi.spyOn(window, 'scrollBy').mockImplementation(() => {});
  });

  afterEach(() => {
    // Leave no pin running into the next test, then release the rAF spy.
    window.dispatchEvent(new Event('keydown'));
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('cancels drift with an instant scroll', () => {
    const drift = { top: 0 };
    mountAnchor(drift);

    pinViewportDuringReflow();
    drift.top = 50;
    runFrame();

    // 'auto' would defer to the page's CSS scroll-behavior: smooth and ease the
    // correction over a dozen frames instead of applying it in this one.
    expect(scrollBy).toHaveBeenCalledWith({ top: 50, behavior: 'instant' });
  });

  it('ignores movement below a pixel so it never fights sub-pixel rounding', () => {
    const drift = { top: 0 };
    mountAnchor(drift);

    pinViewportDuringReflow();
    drift.top = 0.4;
    runFrame();

    expect(scrollBy).not.toHaveBeenCalled();
  });

  it('samples the anchor synchronously, so callers can pin before mutating', () => {
    const drift = { top: 0 };
    mountAnchor(drift);

    // The caller contract: pin first, then mutate. Setting documentElement.lang
    // reflows on its own (globals.css keys the font stack off html:lang(he)),
    // so a pin taken afterwards would hold the already-shifted geometry.
    pinViewportDuringReflow();
    drift.top = 29;

    runFrame();

    expect(scrollBy).toHaveBeenCalledWith({ top: 29, behavior: 'instant' });
  });

  it('bails out when no landmark straddles the viewport centre', () => {
    const footer = document.createElement('footer');
    footer.getBoundingClientRect = () => ({ top: 5000, bottom: 6000 }) as DOMRect;
    document.body.append(footer);

    pinViewportDuringReflow();

    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
    expect(scrollBy).not.toHaveBeenCalled();
  });

  it.each(['wheel', 'touchstart', 'keydown'])(
    'stops pinning as soon as the reader %ss, rather than fighting them',
    (eventName) => {
      const drift = { top: 0 };
      mountAnchor(drift);

      pinViewportDuringReflow();
      window.dispatchEvent(new Event(eventName));

      drift.top = 80;
      runFrame();

      expect(scrollBy).not.toHaveBeenCalled();
      expect(frames).toHaveLength(0);
    }
  );

  it('keeps polling through still frames so a late reflow is still corrected', () => {
    const drift = { top: 0 };
    mountAnchor(drift);

    pinViewportDuringReflow();

    // The reflow arrives in bursts: a production build commits the i18n store in
    // a microtask after the handler, and the scramble structure unmounts ~1.6s
    // later. Settling on the quiet frames in between abandons the second burst.
    drift.top = 40;
    runFrame(0);
    drift.top = 0;
    runFrame(16);
    runFrame(32);
    expect(scrollBy).toHaveBeenCalledTimes(1);

    drift.top = 26;
    runFrame(1600);

    expect(scrollBy).toHaveBeenCalledTimes(2);
    expect(scrollBy).toHaveBeenLastCalledWith({ top: 26, behavior: 'instant' });
  });

  it('stops once the window is over', () => {
    const drift = { top: 0 };
    mountAnchor(drift);

    pinViewportDuringReflow(50);

    runFrame(performance.now() + 1000);

    expect(frames).toHaveLength(0);
  });

  it('cancels a pin that is still running when a new one starts', () => {
    const drift = { top: 0 };
    mountAnchor(drift);

    pinViewportDuringReflow();
    const firstLoop = frames.splice(0, 1);

    // A second switch before the first settled: two loops would fight over the
    // scroll position, each holding its own startTop.
    pinViewportDuringReflow();
    drift.top = 60;

    firstLoop[0]?.(0);
    expect(scrollBy).not.toHaveBeenCalled();

    runFrame();
    expect(scrollBy).toHaveBeenCalledTimes(1);
    expect(scrollBy).toHaveBeenCalledWith({ top: 60, behavior: 'instant' });
  });
});
