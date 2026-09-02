import { vi, type Mock } from 'vitest';

/**
 * jsdom implements neither IntersectionObserver nor ResizeObserver, and its
 * matchMedia never matches anything an application actually asks about. Five
 * suites were each carrying their own copy of the same three stubs, which is
 * how they drifted: one returned `takeRecords`, another did not; one captured
 * the observer callback so a test could deliver an entry, another discarded it
 * and could only assert that the constructor ran.
 *
 * Each stub here installs itself over the global, hands back the callbacks it
 * captured plus an `emit` for delivering an entry, and restores what was there
 * before. Call `restore()` in an afterEach when a suite has tests that need the
 * real (absent) global back.
 */

export interface IntersectionObserverStub {
  /** The constructor itself, for asserting the options a component passes. */
  ctor: Mock;
  observe: Mock;
  unobserve: Mock;
  disconnect: Mock;
  /** Every callback handed to a constructor since the stub was installed. */
  callbacks: IntersectionObserverCallback[];
  /** Deliver one entry to every observer. Wrap in `act()` if React listens. */
  emit(isIntersecting: boolean): void;
  restore(): void;
}

export function stubIntersectionObserver(): IntersectionObserverStub {
  const previous = globalThis.IntersectionObserver;
  const callbacks: IntersectionObserverCallback[] = [];
  const observe = vi.fn();
  const unobserve = vi.fn();
  const disconnect = vi.fn();

  const ctor = vi.fn(function (this: IntersectionObserver, callback: IntersectionObserverCallback) {
    callbacks.push(callback);
    return {
      observe,
      unobserve,
      disconnect,
      root: null,
      rootMargin: '',
      thresholds: [],
      takeRecords: () => [],
    };
  });

  globalThis.IntersectionObserver = ctor as unknown as typeof IntersectionObserver;

  return {
    ctor,
    observe,
    unobserve,
    disconnect,
    callbacks,
    emit(isIntersecting: boolean) {
      callbacks.forEach((callback) =>
        callback([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver)
      );
    },
    restore() {
      globalThis.IntersectionObserver = previous;
    },
  };
}

export interface ResizeObserverStub {
  ctor: Mock;
  observe: Mock;
  unobserve: Mock;
  disconnect: Mock;
  callbacks: ResizeObserverCallback[];
  /** Report a settled border-box height to every observer. */
  emit(blockSize: number): void;
  restore(): void;
}

export function stubResizeObserver(): ResizeObserverStub {
  const previous = globalThis.ResizeObserver;
  const callbacks: ResizeObserverCallback[] = [];
  const observe = vi.fn();
  const unobserve = vi.fn();
  const disconnect = vi.fn();

  const ctor = vi.fn(function (this: ResizeObserver, callback: ResizeObserverCallback) {
    callbacks.push(callback);
    return { observe, unobserve, disconnect };
  });

  globalThis.ResizeObserver = ctor as unknown as typeof ResizeObserver;

  return {
    ctor,
    observe,
    unobserve,
    disconnect,
    callbacks,
    emit(blockSize: number) {
      const entry = {
        borderBoxSize: [{ blockSize, inlineSize: 0 }],
        contentRect: { height: blockSize },
      } as unknown as ResizeObserverEntry;
      callbacks.forEach((callback) => callback([entry], {} as ResizeObserver));
    },
    restore() {
      globalThis.ResizeObserver = previous;
    },
  };
}

/**
 * Install a matchMedia that answers `matches` per query — the default says no
 * to everything, which is the desktop, full-motion case every component treats
 * as normal. Pass a predicate for the others:
 *
 *   stubMatchMedia((query) => query === REDUCED_MOTION_QUERY)
 */
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
export const COARSE_POINTER_QUERY = '(pointer: coarse)';
export const NARROW_VIEWPORT_QUERY = '(max-width: 768px)';

export interface MatchMediaStub {
  ctor: Mock;
  restore(): void;
}

export function stubMatchMedia(matches: (query: string) => boolean = () => false): MatchMediaStub {
  const previous = globalThis.matchMedia;

  const ctor = vi.fn((query: string) => ({
    matches: matches(query),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

  globalThis.matchMedia = ctor as unknown as typeof matchMedia;

  return {
    ctor,
    restore() {
      globalThis.matchMedia = previous;
    },
  };
}
