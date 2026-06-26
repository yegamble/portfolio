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
  /** Minimum time (ms) every character keeps scrambling before the first one resolves. */
  scrambleDuration: number;
  /** Extra time (ms) over which the remaining characters resolve, left to right. */
  revealStagger: number;
  /** Random ± variance (ms) applied per character so the reveal wave feels organic. */
  jitter: number;
  /** How often (ms) scramble glyphs re-roll and the DOM repaints — the flicker rate. */
  updateInterval: number;
}

// Timeline (desktop): char 0 resolves at ~scrambleDuration (650ms), the last char at
// ~scrambleDuration + revealStagger (~1.35s). With updateInterval 45ms every character
// re-rolls ~14–30 times before locking in, so the scramble is clearly readable rather
// than snapping to the final text almost instantly.
const DESKTOP_PROFILE: AnimationProfile = {
  scrambleDuration: 650,
  revealStagger: 700,
  jitter: 90,
  updateInterval: 45,
};

// Mobile keeps the same per-frame work as before (a re-roll touches the same nodes)
// but uses a ~15fps flicker and a shorter reveal so the total commit count stays low
// and the work is spread evenly — no single long frame that could stutter on a phone.
const MOBILE_PROFILE: AnimationProfile = {
  scrambleDuration: 420,
  revealStagger: 360,
  jitter: 45,
  updateInterval: 65,
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
      profile.scrambleDuration + progress * profile.revealStagger + randomJitter;
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
// Shared animation driver
// ---------------------------------------------------------------------------
// Owns the RAF tick lifecycle, the reduced-motion settle and the interruption
// reset. The per-char and ref-based loops differ only in WHERE each frame goes,
// so one passes a React state setter (`setChars`) and the other a DOM ref
// (`elementRef`); the write itself happens inside the effect, where side
// effects are allowed. This removes ~100 lines of duplicated tick logic.

function useCipherLoop(
  text: string,
  isEnabled: boolean,
  setChars: ((chars: string[]) => void) | undefined,
  elementRef: RefObject<HTMLElement | null> | undefined
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
    // Build the per-frame writers inside the effect so the DOM mutation (ref
    // mode) stays out of render-phase code.
    const commitFrame = (chars: string[]) => {
      if (setChars) {
        setChars(chars);
        return;
      }
      const el = elementRef?.current;
      if (el) el.textContent = chars.join('');
    };
    const commitFinal = (value: string) => {
      if (setChars) {
        setChars(Array.from(value));
        return;
      }
      const el = elementRef?.current;
      if (el) el.textContent = value;
    };
    // Char mode defers the reduced-motion settle one RAF so React commits the
    // resolved text once; ref mode writes the DOM synchronously.
    const deferReducedMotion = setChars != null;

    if (!isEnabled) {
      prevTextRef.current = text;
      return;
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      prevTextRef.current = text;
      if (deferReducedMotion) {
        // Update in the next frame so React commits the resolved text once.
        const id = requestAnimationFrame(() => {
          commitFinal(text);
          setIsAnimating(false);
        });
        return () => cancelAnimationFrame(id);
      }
      commitFinal(text);
      return;
    }

    if (text === prevTextRef.current) {
      return;
    }

    // Clean up any in-flight animation
    cleanup();

    const newChars = Array.from(text);
    const maxLen = newChars.length;
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

        commitFrame(chars);

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

    return () => {
      cleanup();
      // Reset to the target text on interruption so stale cipher glyphs never linger.
      commitFinal(text);
      setIsAnimating(false);
    };
    // setChars/elementRef are stable; elementRef changing (ref mode swapping the
    // target span) restarts the loop, which is correct.
  }, [text, isEnabled, cleanup, setChars, elementRef]);

  // Cleanup on unmount
  useEffect(() => cleanup, [cleanup]);

  return { isAnimating };
}

// ---------------------------------------------------------------------------
// Per-char animation loop (short text) — per-character React state + glow
// ---------------------------------------------------------------------------

function useCipherAnimationLoop(text: string, isEnabled: boolean) {
  const [displayChars, setDisplayChars] = useState<string[]>(() =>
    Array.from(text)
  );

  const { isAnimating } = useCipherLoop(text, isEnabled, setDisplayChars, undefined);

  return { displayChars, isAnimating };
}

// ---------------------------------------------------------------------------
// Ref-based animation loop (long text) — one span updated via textContent,
// bypassing React reconciliation.
// ---------------------------------------------------------------------------

function useCipherRefAnimationLoop(
  text: string,
  elementRef: RefObject<HTMLElement | null> | undefined,
  isEnabled: boolean
): { isAnimating: boolean } {
  // The ref is read lazily inside the loop's effect each frame, so a span that
  // mounts after the first animation frame still receives live updates.
  return useCipherLoop(text, isEnabled, undefined, elementRef);
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
