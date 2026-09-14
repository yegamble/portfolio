/**
 * Viewport pinning for in-place content swaps (the language selector).
 *
 * Different languages have different text lengths, so content above the fold
 * grows or shrinks and would otherwise jerk the whole page up or down under the
 * reader. We pin the landmark currently under the viewport centre and scroll to
 * cancel its drift for the duration of the transition.
 */

// Landmarks worth pinning: the hero, the content sections and the footer. The
// sticky page header is excluded (it never drifts) and so are the per-job
// <header> elements inside Experience, which are far too small to anchor on.
const ANCHOR_SELECTOR = 'header + section, main section, footer';

// The window has to outlast the whole cipher animation. The last reflow is the
// animating ghost structure unmounting when the scramble finishes (~1.6s after
// the click), and the loop only sees it if it is still polling.
const DEFAULT_DURATION_MS = 2000;

// Two loops running at once would fight over the scroll position, each holding
// its own startTop, so a new pin always supersedes the one in flight.
let cancelActivePin: (() => void) | null = null;

/**
 * Hold the reader's view steady while the page reflows.
 *
 * MUST be called before whatever mutation triggers the reflow, not after:
 * `startTop` is sampled synchronously. In the language selector, setting
 * documentElement.lang alone already reflows the page (globals.css swaps the
 * font stack on `html:lang(he)`, so the still-untranslated Hebrew text re-wraps
 * in Inter's metrics). Measured on a production build, he->en with #experience
 * at top 112: the lang flip on its own moved it to 141.25, so sampling
 * afterwards pinned the page 29px from where the reader left it.
 *
 * Cancels immediately on any user scroll/keypress so it never fights the reader.
 */
export function pinViewportDuringReflow(durationMs = DEFAULT_DURATION_MS) {
  if (typeof window === 'undefined' || typeof requestAnimationFrame !== 'function') {
    return;
  }

  cancelActivePin?.();

  const centerY = window.innerHeight / 2;
  let anchor: HTMLElement | undefined;
  for (const el of document.querySelectorAll<HTMLElement>(ANCHOR_SELECTOR)) {
    const rect = el.getBoundingClientRect();
    if (rect.top <= centerY && rect.bottom >= centerY) {
      anchor = el;
      break;
    }
  }
  if (!anchor) return;

  const startTop = anchor.getBoundingClientRect().top;
  const deadline = performance.now() + durationMs;
  let active = true;

  const stop = () => {
    active = false;
    window.removeEventListener('wheel', stop);
    window.removeEventListener('touchstart', stop);
    window.removeEventListener('keydown', stop);
    if (cancelActivePin === stop) {
      cancelActivePin = null;
    }
  };

  cancelActivePin = stop;
  window.addEventListener('wheel', stop, { passive: true });
  window.addEventListener('touchstart', stop, { passive: true });
  window.addEventListener('keydown', stop);

  const compensate = (now: number) => {
    if (!active) return;
    const drift = anchor.getBoundingClientRect().top - startTop;
    // Poll for the whole window and scroll only when there is drift to cancel.
    // Settling early on still frames is not safe here: the reflow arrives in
    // bursts (a production build commits the i18n store in a microtask after
    // the handler, and the scramble structure unmounts ~1.6s later), so a loop
    // that stops after the first quiet frames abandons the later ones. A rect
    // read per frame is far cheaper than the animation it rides alongside.
    if (Math.abs(drift) >= 1) {
      // behavior:'instant' is required. Per CSSOM View, 'auto' defers to the
      // element's CSS scroll-behavior, which globals.css sets to `smooth`, so
      // each correction would ease over 7-16 frames and the page would visibly
      // glide back instead of never appearing to move. On a production build
      // one instant correction is all it takes (+117px desktop he->en and
      // en->ru, +263px mobile en->ru, in a single frame ~90ms after the click).
      window.scrollBy({ top: drift, behavior: 'instant' });
    }
    if (now < deadline) {
      requestAnimationFrame(compensate);
    } else {
      stop();
    }
  };
  requestAnimationFrame(compensate);
}
