import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import { cancelHeightEase, easeHeight, isHeightEasing } from '@/lib/height-ease';
import { prefersReducedMotion } from '@/lib/media';

// The ease measures the DOM after a commit, which is client-only work.
// useLayoutEffect warns when React renders on the server, so pick the effect
// that fits the environment once, at module scope (never per render).
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** Sub-pixel wobble between two layouts is not a height change worth animating. */
const EPSILON_PX = 1;

/**
 * Ease a block's height across an in-place text swap.
 *
 * A translation that wraps to a different number of lines changes the block's
 * height in the single commit that swaps the text, so everything below jumps by
 * the delta in one frame. This measures that step and replays it as a 300ms
 * transition (src/lib/height-ease.ts).
 *
 * Two measurements, deliberately split:
 * - a ResizeObserver records the height the box SETTLED at, off the hot path —
 *   it delivers after layout, so reading there costs nothing, while measuring
 *   during render or per animation frame would force a reflow. Its bookkeeping
 *   runs unconditionally, so an instance that was off-screen for one switch
 *   still knows where it stands for the next one.
 * - a layout effect, in the commit where `text` changes, reads the natural new
 *   height before paint and eases from the settled one to it.
 *
 * @param elementRef      the box to animate — must be the same DOM node across
 *                        every render branch, or React remounts it mid-ease
 * @param text            the text being swapped; drives the layout effect
 * @param enabled         false leaves the element entirely alone
 * @param isVisibleRef    read at ease time, not a dependency: ~10 block
 *                        instances commit in the same frame and 7-8 of them are
 *                        usually off-screen, and a transition nobody can see is
 *                        pure cost during the busiest 300ms on the page. A ref
 *                        rather than a prop keeps visibility changes from
 *                        re-running the effect and easing at the wrong moment.
 */
export function useBlockHeightEase(
  elementRef: RefObject<HTMLElement | null>,
  text: string,
  enabled: boolean,
  isVisibleRef: RefObject<boolean>
): void {
  // Last height the box settled at, i.e. the one the reader is looking at when
  // the next translation arrives.
  const settledHeightRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const el = elementRef.current;
    // jsdom and any other environment without ResizeObserver simply never
    // records a height, so the ease below stays off.
    if (!el || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver((entries) => {
      // The ease's own frames are not a settled height and must not be recorded
      // as one: they would make the next switch start from wherever this one
      // happened to be interrupted.
      if (isHeightEasing(el)) return;
      // Border box, to match the inline `height` the ease writes — the two can
      // otherwise diverge the moment the wrapper gains padding or a border.
      settledHeightRef.current =
        entries.at(-1)?.borderBoxSize?.[0]?.blockSize ?? el.getBoundingClientRect().height;
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelHeightEase(el);
    };
  }, [elementRef, enabled]);

  useIsomorphicLayoutEffect(() => {
    if (!enabled || prefersReducedMotion()) return;
    const el = elementRef.current;
    if (!el) return;

    const settled = settledHeightRef.current;
    // Nothing to ease from on the first commit (or without a ResizeObserver).
    if (settled === null) return;

    // React has already committed the new text, so the box is at its natural
    // new height; an ease still in flight is instead at whatever height it had
    // animated to, and that — not the target it was heading for — is where the
    // reader's eye is. Cancelling drops the inline height so the next read is
    // the natural one again.
    const from = isHeightEasing(el) ? el.getBoundingClientRect().height : settled;
    cancelHeightEase(el);
    const to = el.getBoundingClientRect().height;
    settledHeightRef.current = to;

    if (!isVisibleRef.current) return;
    if (Math.abs(to - from) <= EPSILON_PX) return;
    easeHeight(el, from, to);
  }, [elementRef, enabled, isVisibleRef, text]);
}
