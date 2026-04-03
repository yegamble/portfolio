import { useState, useEffect, useRef, useCallback } from 'react';
import { getRandomCipherChar, isScramblable } from '@/lib/cipher-chars';

export interface CipherTransitionResult {
  containerRef: React.RefObject<HTMLSpanElement | null>;
  isAnimating: boolean;
}

const BASE_DELAY = 400;
const SPREAD_DURATION = 1200;
const JITTER = 100;
const UPDATE_INTERVAL = 60;

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
// Shared IntersectionObserver — tracks which CipherText host elements are
// currently visible. Off-screen instances skip animation entirely and resolve
// to final text immediately, avoiding thousands of unnecessary DOM writes.
// ---------------------------------------------------------------------------

const visibleElements = new WeakSet<Element>();
let sharedObserver: IntersectionObserver | null = null;

function getObserver(): IntersectionObserver | null {
  if (
    typeof window === 'undefined' ||
    typeof IntersectionObserver === 'undefined'
  )
    return null;
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visibleElements.add(entry.target);
          } else {
            visibleElements.delete(entry.target);
          }
        }
      },
      { rootMargin: '100px' }
    );
  }
  return sharedObserver;
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

function calculateResolveTimes(maxLen: number): number[] {
  const resolveTimes: number[] = [];
  for (let i = 0; i < maxLen; i++) {
    const progress = maxLen > 1 ? i / (maxLen - 1) : 0;
    const randomJitter = (Math.random() - 0.5) * 2 * JITTER;
    resolveTimes[i] = BASE_DELAY + progress * SPREAD_DURATION + randomJitter;
  }
  return resolveTimes;
}

// ---------------------------------------------------------------------------
// Hook — updates DOM directly via containerRef instead of React state,
// eliminating per-frame re-renders across all CipherText instances.
// Off-screen instances skip animation via IntersectionObserver.
// ---------------------------------------------------------------------------

function useCipherAnimationLoop(text: string, isEnabled: boolean) {
  const containerRef = useRef<HTMLSpanElement | null>(null);
  const hostRef = useRef<Element | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevTextRef = useRef(text);
  const tickRef = useRef<TickFn | null>(null);

  const cleanup = useCallback(() => {
    if (tickRef.current) {
      unregisterTick(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  // Observe the nearest parent element for visibility
  useEffect(() => {
    if (!isEnabled) return;
    const observer = getObserver();
    if (!observer) return;

    // Defer to find the host element after mount
    const id = requestAnimationFrame(() => {
      const container = containerRef.current;
      const host =
        container?.closest('section') ?? container?.parentElement ?? null;
      if (host) {
        hostRef.current = host;
        observer.observe(host);
      }
    });

    return () => {
      cancelAnimationFrame(id);
      if (hostRef.current) {
        observer.unobserve(hostRef.current);
        hostRef.current = null;
      }
    };
  }, [isEnabled]);

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
      return;
    }

    if (text === prevTextRef.current) {
      return;
    }

    // Clean up any in-flight animation
    cleanup();

    // Skip animation for off-screen instances
    const host = hostRef.current;
    if (host && !visibleElements.has(host)) {
      prevTextRef.current = text;
      return;
    }

    const newChars = Array.from(text);
    const maxLen = Math.max(
      Array.from(prevTextRef.current).length,
      newChars.length
    );
    const resolveTimes = calculateResolveTimes(maxLen);

    let startTime: number | null = null;
    let lastUpdateTime = 0;
    let started = false;

    const tick: TickFn = (currentTime) => {
      // First tick: trigger React render to mount animation spans
      if (!started) {
        started = true;
        setIsAnimating(true);
        return true; // wait for React to commit the render
      }

      const container = containerRef.current;
      if (!container) return true; // wait for ref to attach

      if (startTime === null) {
        startTime = currentTime;
        lastUpdateTime = currentTime - UPDATE_INTERVAL;
      }

      if (currentTime - lastUpdateTime < UPDATE_INTERVAL) return true;

      const elapsed = currentTime - startTime;
      const slots = container.children;
      let allResolved = true;

      for (let i = 0; i < maxLen; i++) {
        const resolveTime = resolveTimes[i];
        const targetChar = i < newChars.length ? newChars[i] : '';
        const slot = slots[i] as HTMLElement | undefined;
        if (!slot) continue;

        const charSpan = slot.lastElementChild as HTMLElement;
        if (!charSpan) continue;

        if (elapsed >= resolveTime) {
          if (charSpan.textContent !== targetChar) {
            charSpan.textContent = targetChar;
          }
          if (!charSpan.classList.contains('cipher-resolved')) {
            charSpan.classList.add('cipher-resolved');
          }
        } else {
          allResolved = false;
          if (targetChar && isScramblable(targetChar)) {
            charSpan.textContent = getRandomCipherChar();
          }
        }
      }

      if (allResolved) {
        setIsAnimating(false);
        prevTextRef.current = text;
        tickRef.current = null;
        return false; // done — unregister from scheduler
      }

      lastUpdateTime = currentTime;
      return true; // keep running
    };

    tickRef.current = tick;
    registerTick(tick);
    prevTextRef.current = text;

    return cleanup;
  }, [text, isEnabled, cleanup]);

  // Cleanup on unmount
  useEffect(() => cleanup, [cleanup]);

  return { containerRef, isAnimating };
}

/**
 * Hook for animating text transitions with a cipher/decryption effect.
 * Uses a shared RAF scheduler so all instances animate in a single frame loop.
 * Updates the DOM directly via containerRef — only two React renders per
 * animation (start and end) instead of one per tick (~26 renders eliminated).
 * Off-screen instances skip animation entirely via a shared IntersectionObserver.
 */
export function useCipherTransition(text: string): CipherTransitionResult {
  const isEnabled = process.env.NEXT_PUBLIC_CIPHER_TRANSITION === 'true';
  const { containerRef, isAnimating } = useCipherAnimationLoop(text, isEnabled);

  return { containerRef, isAnimating: isEnabled ? isAnimating : false };
}
