/**
 * FLIP-style height ease for a box whose content is swapped in place.
 *
 * The language selector replaces every string on the page inside a single
 * React commit. When a translation wraps to a different number of lines, the
 * box around it changes height in that one commit and everything below jumps
 * by the delta in a single frame (measured on a production build: the 1280px
 * hero <h1> goes 240 -> 180px on en->he, the 390px one 270 -> 180px, and the
 * #about copy 633 -> 692px on en->et). Reserving the tallest height across all
 * languages was tried before and removed: the reservation over-estimates for
 * every language but one and leaves a phantom gap.
 *
 * So instead of preventing the change we replay it. Layout settles at its
 * natural new height, then we pin the element back to the height it had, make
 * the browser accept that as a start state, and transition to the new one —
 * content below slides over ~300ms while the cipher scramble runs.
 */

interface EaseHeightOptions {
  /** Length of the transition. */
  durationMs?: number;
}

const DEFAULT_DURATION_MS = 300;
/**
 * Slack on top of the duration before the safety net fires. It covers a
 * `transitionend` that never arrives — a background tab, a transition the
 * compositor drops, an element removed mid-flight.
 */
const TIMEOUT_SLACK_MS = 50;

// Keyed by element rather than held in a module-level variable: several block
// wrappers ease at once (hero tagline, about copy, every job description) and
// each owns its own transition. A WeakMap keeps no element alive.
const activeEases = new WeakMap<HTMLElement, () => void>();

/** True while `element` has an ease in flight, i.e. an inline height we own. */
export function isHeightEasing(element: HTMLElement): boolean {
  return activeEases.has(element);
}

/**
 * Stop an in-flight ease and hand the element back to natural sizing.
 * Safe to call on an element that is not easing.
 */
export function cancelHeightEase(element: HTMLElement): void {
  activeEases.get(element)?.();
}

/**
 * Ease `element` from `fromPx` to `toPx`, then return it to natural sizing.
 *
 * The caller is expected to have let layout settle at the new height already;
 * `toPx` is that settled height, `fromPx` the one the reader was looking at.
 * A second call on the same element supersedes the first cleanly, so a text
 * change mid-ease can restart from whatever height is currently rendered
 * without ever leaving a stuck inline height behind.
 */
export function easeHeight(
  element: HTMLElement,
  fromPx: number,
  toPx: number,
  options: EaseHeightOptions = {}
): void {
  // The ease is only safe with `overflow-y: clip`, which is what keeps a box
  // easing upwards from painting its last line over the content below without
  // turning the wrapper into a scroll container. An engine that lacks it gets
  // no ease rather than a `hidden` fallback: `hidden` would move the
  // inline-block wrapper's baseline to its bottom margin edge and inflate the
  // line box around it for the length of the animation, which is a worse
  // artefact than the single-frame step the ease exists to smooth.
  const cssObj = typeof CSS !== 'undefined' ? CSS : undefined;
  if (
    !cssObj ||
    typeof cssObj.supports !== 'function' ||
    !cssObj.supports('overflow-y', 'clip')
  ) {
    return;
  }

  const durationMs = options.durationMs ?? DEFAULT_DURATION_MS;

  cancelHeightEase(element);

  let timeoutId = 0;

  const finish = () => {
    // Only the ease that is still registered may clear the styles: a stale
    // callback would otherwise wipe an inline height its successor owns.
    if (activeEases.get(element) !== finish) return;
    activeEases.delete(element);
    window.clearTimeout(timeoutId);
    element.removeEventListener('transitionend', handleTransitionEnd);
    element.style.height = '';
    element.style.transition = '';
    element.style.overflowY = '';
  };

  const handleTransitionEnd = (event: TransitionEvent) => {
    // transitionend bubbles, and the cipher overlays below run their own
    // opacity transitions — only this element's own height counts as the end.
    if (event.target !== element || event.propertyName !== 'height') return;
    finish();
  };

  element.style.transition = 'none';
  // Only while the ease runs. A box easing upwards is briefly shorter than its
  // own content, which would otherwise paint its last line on top of whatever
  // sits below it. `clip` rather than `hidden`: clip creates no scroll
  // container, so the inline-block wrapper keeps its baseline (a scroll
  // container's baseline is its bottom margin edge, which would inflate the
  // line box around it for the length of the animation).
  element.style.overflowY = 'clip';
  element.style.height = `${fromPx}px`;
  // Force the start state to be flushed. Without this read the browser sees a
  // single style change from the natural height to `toPx` and no transition
  // runs at all.
  element.getBoundingClientRect();
  element.style.transition = `height ${durationMs}ms ease-out`;
  element.style.height = `${toPx}px`;

  element.addEventListener('transitionend', handleTransitionEnd);
  // Registered before the timeout is scheduled: `finish` refuses to run unless
  // it is the ease this element currently owns, so it has to be the owner
  // before anything can call it.
  activeEases.set(element, finish);
  timeoutId = window.setTimeout(finish, durationMs + TIMEOUT_SLACK_MS);
}
