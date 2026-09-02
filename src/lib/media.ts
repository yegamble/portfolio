/**
 * The media queries the motion code asks about, in one place.
 *
 * Both questions were hand-rolled at five call sites behind three different
 * guards: `useBlockHeightEase` and `CipherText` checked
 * `typeof window.matchMedia === 'function'`, `useCipherTransition` checked only
 * `typeof window`, and `Projects` and `ScrollHeader` checked nothing at all — so
 * the same question threw or answered depending on which component asked it.
 *
 * Everything here answers `false` when the question cannot be asked (no
 * `window`, no `matchMedia`), which is the full-motion desktop case every caller
 * already treated as normal, and is what the two unguarded call sites meant to
 * say before they could throw.
 */

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
export const COARSE_POINTER_QUERY = '(pointer: coarse)';
export const NARROW_VIEWPORT_QUERY = '(max-width: 768px)';

function matchesQuery(query: string): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(query).matches
  );
}

/** True when the visitor has asked their OS for reduced motion. */
export function prefersReducedMotion(): boolean {
  return matchesQuery(REDUCED_MOTION_QUERY);
}

/**
 * True for the cheaper "phone" profile — a coarse pointer OR a narrow viewport.
 * Either alone is enough: a phone in landscape is not narrow, and a half-width
 * desktop window has a fine pointer, and both want the shorter animation and the
 * lower long-text threshold.
 */
export function isCoarsePointerOrNarrow(): boolean {
  return matchesQuery(COARSE_POINTER_QUERY) || matchesQuery(NARROW_VIEWPORT_QUERY);
}
