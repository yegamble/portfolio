import { afterEach, describe, expect, it } from 'vitest';
import {
  COARSE_POINTER_QUERY,
  isCoarsePointerOrNarrow,
  NARROW_VIEWPORT_QUERY,
  prefersReducedMotion,
  REDUCED_MOTION_QUERY,
} from '@/lib/media';
import { stubMatchMedia, type MatchMediaStub } from '../helpers/observers';

let matchMedia: MatchMediaStub | undefined;

afterEach(() => {
  matchMedia?.restore();
  matchMedia = undefined;
});

describe('prefersReducedMotion', () => {
  it('should report the visitor asked for reduced motion', () => {
    matchMedia = stubMatchMedia((query) => query === REDUCED_MOTION_QUERY);
    expect(prefersReducedMotion()).toBe(true);
  });

  it('should report full motion when nothing matches', () => {
    matchMedia = stubMatchMedia();
    expect(prefersReducedMotion()).toBe(false);
  });
});

describe('isCoarsePointerOrNarrow', () => {
  it('should report the phone profile for a coarse pointer on a wide screen', () => {
    matchMedia = stubMatchMedia((query) => query === COARSE_POINTER_QUERY);
    expect(isCoarsePointerOrNarrow()).toBe(true);
  });

  it('should report the phone profile for a narrow window with a fine pointer', () => {
    matchMedia = stubMatchMedia((query) => query === NARROW_VIEWPORT_QUERY);
    expect(isCoarsePointerOrNarrow()).toBe(true);
  });

  it('should report the desktop profile for a wide window with a fine pointer', () => {
    matchMedia = stubMatchMedia();
    expect(isCoarsePointerOrNarrow()).toBe(false);
  });
});

describe('without matchMedia', () => {
  // The two call sites this module replaced in Projects and ScrollHeader called
  // window.matchMedia unguarded, so an environment without it threw rather than
  // falling back to full motion. Both questions now answer for that environment.
  it('should answer both questions instead of throwing', () => {
    const previous = globalThis.matchMedia;
    // @ts-expect-error — deleting the global is exactly the case under test.
    delete globalThis.matchMedia;

    try {
      expect(prefersReducedMotion()).toBe(false);
      expect(isCoarsePointerOrNarrow()).toBe(false);
    } finally {
      globalThis.matchMedia = previous;
    }
  });
});
