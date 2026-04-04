import { useState, useEffect, useRef, useCallback, type RefObject } from 'react';
import { getRandomCipherChar, isScramblable } from '@/lib/cipher-chars';

interface CipherTransitionResult {
  displayChars: string[];
  isAnimating: boolean;
}

interface CipherTransitionOptions {
  isVisible?: boolean;
  elementRef?: RefObject<HTMLElement | null>;
}

interface AnimationProfile {
  baseDelay: number;
  spreadDuration: number;
  jitter: number;
  updateInterval: number;
}

const DESKTOP_PROFILE: AnimationProfile = {
  baseDelay: 180,
  spreadDuration: 700,
  jitter: 60,
  updateInterval: 50,
};

const MOBILE_PROFILE: AnimationProfile = {
  baseDelay: 80,
  spreadDuration: 420,
  jitter: 35,
  updateInterval: 90,
};

// ---------------------------------------------------------------------------
// Shared RAF scheduler — one loop drives all CipherText instances so React
// can batch every setState into a single commit per frame.
// ---------------------------------------------------------------------------
type TickFn = (time: number) => boolean; // return true to keep running

const activeTicks = new Set<TickFn>();
let rafId: number | null = null;

function schedulerLoop(time: number) {
  const done: TickFn[] = [];
  for (const fn of activeTicks) {
    if (!fn(time)) done.push(fn);
  }
  for (const fn of done) activeTicks.delete(fn);

  if (activeTicks.size > 0) {
    rafId = requestAnimationFrame(schedulerLoop);
  } else {
    rafId = null;
  }
}

function registerTick(fn: TickFn) {
  activeTicks.add(fn);
  if (rafId === null) {
    rafId = requestAnimationFrame(schedulerLoop);
  }
}

function unregisterTick(fn: TickFn) {
  activeTicks.delete(fn);
  if (activeTicks.size === 0 && rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

// ---------------------------------------------------------------------------
// Pure helpers (unchanged logic, no side-effects)
// ---------------------------------------------------------------------------

function calculateResolveTimes(maxLen: number, profile: AnimationProfile): number[] {
  const resolveTimes: number[] = [];
  for (let i = 0; i < maxLen; i++) {
    const progress = maxLen > 1 ? i / (maxLen - 1) : 0;
    const randomJitter = (Math.random() - 0.5) * 2 * profile.jitter;
    resolveTimes[i] =
      profile.baseDelay + progress * profile.spreadDuration + randomJitter;
  }
  return resolveTimes;
}

function getAnimationProfile(): AnimationProfile {
  if (typeof window === 'undefined') {
    return DESKTOP_PROFILE;
  }

  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const isNarrowViewport = window.matchMedia('(max-width: 768px)').matches;

  return isCoarsePointer || isNarrowViewport ? MOBILE_PROFILE : DESKTOP_PROFILE;
}

function generateFrameChars(
  maxLen: number,
  newChars: string[],
  resolveTimes: number[],
  elapsed: number
): { chars: string[]; allResolved: boolean } {
  const chars: string[] = [];
  let allResolved = true;

  for (let i = 0; i < maxLen; i++) {
    const resolveTime = resolveTimes[i];
    const targetChar = i < newChars.length ? newChars[i] : '';

    if (elapsed >= resolveTime) {
      chars[i] = targetChar;
    } else {
      allResolved = false;
      if (targetChar && isScramblable(targetChar)) {
        chars[i] = getRandomCipherChar();
      } else {
        chars[i] = targetChar;
      }
    }
  }

  return { chars, allResolved };
}

// ---------------------------------------------------------------------------
// Per-char animation loop (existing — for short text)
// ---------------------------------------------------------------------------

function useCipherAnimationLoop(text: string, isEnabled: boolean) {
  const [displayChars, setDisplayChars] = useState<string[]>(() =>
    Array.from(text)
  );
  const [isAnimating, setIsAnimating] = useState(false);
  const prevTextRef = useRef(text);
  const tickRef = useRef<TickFn | null>(null);

  const cleanup = useCallback(() => {
    if (tickRef.current) {
      unregisterTick(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isEnabled) {
      prevTextRef.current = text;
      return;
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      prevTextRef.current = text;
      // Use a single RAF to update in the next frame
      const id = requestAnimationFrame(() => {
        setDisplayChars(Array.from(text));
        setIsAnimating(false);
      });
      return () => cancelAnimationFrame(id);
    }

    if (text === prevTextRef.current) {
      return;
    }

    // Clean up any in-flight animation
    cleanup();

    const newChars = Array.from(text);
    const maxLen = Math.max(Array.from(prevTextRef.current).length, newChars.length);
    const profile = getAnimationProfile();
    const resolveTimes = calculateResolveTimes(maxLen, profile);

    let startTime: number | null = null;
    let lastUpdateTime = 0;
    let started = false;

    const tick: TickFn = (currentTime) => {
      if (startTime === null) {
        startTime = currentTime;
        lastUpdateTime = currentTime - profile.updateInterval;
      }

      if (!started) {
        started = true;
        setIsAnimating(true);
      }

      const timeSinceLastUpdate = currentTime - lastUpdateTime;
      if (timeSinceLastUpdate >= profile.updateInterval) {
        const elapsed = currentTime - startTime;
        const { chars, allResolved } = generateFrameChars(
          maxLen,
          newChars,
          resolveTimes,
          elapsed
        );

        setDisplayChars(chars);

        if (allResolved) {
          setIsAnimating(false);
          prevTextRef.current = text;
          tickRef.current = null;
          return false; // done — unregister from scheduler
        }

        lastUpdateTime = currentTime;
      }

      return true; // keep running
    };

    tickRef.current = tick;
    registerTick(tick);
    prevTextRef.current = text;

    return cleanup;
  }, [text, isEnabled, cleanup]);

  // Cleanup on unmount
  useEffect(() => cleanup, [cleanup]);

  return { displayChars, isAnimating };
}

// ---------------------------------------------------------------------------
// Ref-based animation loop (new — for long text, bypasses React reconciliation)
// ---------------------------------------------------------------------------

function useCipherRefAnimationLoop(
  text: string,
  elementRef: RefObject<HTMLElement | null> | undefined,
  isEnabled: boolean
): { isAnimating: boolean } {
  const [isAnimating, setIsAnimating] = useState(false);
  const prevTextRef = useRef(text);
  const tickRef = useRef<TickFn | null>(null);

  const cleanup = useCallback(() => {
    if (tickRef.current) {
      unregisterTick(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isEnabled) {
      prevTextRef.current = text;
      return;
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      prevTextRef.current = text;
      if (elementRef?.current) {
        elementRef.current.textContent = text;
      }
      return;
    }

    if (text === prevTextRef.current) {
      return;
    }

    cleanup();

    const newChars = Array.from(text);
    const maxLen = Math.max(Array.from(prevTextRef.current).length, newChars.length);
    const profile = getAnimationProfile();
    const resolveTimes = calculateResolveTimes(maxLen, profile);

    let startTime: number | null = null;
    let lastUpdateTime = 0;
    let started = false;

    const tick: TickFn = (currentTime) => {
      if (startTime === null) {
        startTime = currentTime;
        lastUpdateTime = currentTime - profile.updateInterval;
      }

      if (!started) {
        started = true;
        setIsAnimating(true);
      }

      const timeSinceLastUpdate = currentTime - lastUpdateTime;
      if (timeSinceLastUpdate >= profile.updateInterval) {
        const elapsed = currentTime - startTime;
        const { chars, allResolved } = generateFrameChars(
          maxLen,
          newChars,
          resolveTimes,
          elapsed
        );

        // Direct DOM update — bypasses React reconciliation
        if (elementRef?.current) {
          elementRef.current.textContent = chars.join('');
        }

        if (allResolved) {
          setIsAnimating(false);
          prevTextRef.current = text;
          tickRef.current = null;
          return false;
        }

        lastUpdateTime = currentTime;
      }

      return true;
    };

    tickRef.current = tick;
    registerTick(tick);
    prevTextRef.current = text;

    return cleanup;
  }, [text, isEnabled, cleanup, elementRef]);

  useEffect(() => cleanup, [cleanup]);

  return { isAnimating };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Hook for animating text transitions with a cipher/decryption effect.
 * Uses a shared RAF scheduler so all instances animate in a single frame loop,
 * allowing React to batch state updates into one render pass.
 *
 * Options:
 * - isVisible: when false, skips animation (for viewport-gated instances)
 * - elementRef: when provided, uses direct DOM textContent updates instead of
 *   React state (for long text that would create too many per-char spans)
 */
export function useCipherTransition(
  text: string,
  options?: CipherTransitionOptions
): CipherTransitionResult {
  const isEnabled = process.env.NEXT_PUBLIC_CIPHER_TRANSITION === 'true';
  const isVisible = options?.isVisible ?? true;
  const elementRef = options?.elementRef;

  const useRefMode = isEnabled && isVisible && elementRef != null;
  const useCharMode = isEnabled && isVisible && elementRef == null;

  // Both hooks always called (React rules of hooks), but only one is active
  const charResult = useCipherAnimationLoop(text, useCharMode);
  const refResult = useCipherRefAnimationLoop(text, elementRef, useRefMode);

  if (!isEnabled || !isVisible) {
    return { displayChars: Array.from(text), isAnimating: false };
  }

  if (useRefMode) {
    return { displayChars: Array.from(text), isAnimating: refResult.isAnimating };
  }

  return charResult;
}
