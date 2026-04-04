import { useState, useEffect, useRef, useCallback } from 'react';
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext';
import { getRandomCipherChar, isScramblable } from '@/lib/cipher-chars';
import { getFont, getLineHeight, getWidth, FALLBACK_FONT, FALLBACK_LINE_HEIGHT } from '@/lib/pretext-utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CipherLine {
  text: string;
  chars: string[];
  targetChars: string[];
  lineResolved: boolean;
}

export interface CipherTransitionResult {
  lines: CipherLine[];
  isAnimating: boolean;
}

export interface CipherTransitionOptions {
  isVisible?: boolean;
  elementRef?: React.RefObject<HTMLElement | null>;
}

interface AnimationProfile {
  baseDelay: number;
  spreadDuration: number;
  jitter: number;
  updateInterval: number;
  lineStagger: number;
}

const DESKTOP_PROFILE: AnimationProfile = {
  baseDelay: 180,
  spreadDuration: 700,
  jitter: 60,
  updateInterval: 50,
  lineStagger: 80,
};

const MOBILE_PROFILE: AnimationProfile = {
  baseDelay: 80,
  spreadDuration: 420,
  jitter: 35,
  updateInterval: 90,
  lineStagger: 50,
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
// Pure helpers
// ---------------------------------------------------------------------------

function getAnimationProfile(): AnimationProfile {
  if (typeof window === 'undefined') {
    return DESKTOP_PROFILE;
  }

  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const isNarrowViewport = window.matchMedia('(max-width: 768px)').matches;

  return isCoarsePointer || isNarrowViewport ? MOBILE_PROFILE : DESKTOP_PROFILE;
}

function calculateResolveTimes(charCount: number, profile: AnimationProfile, lineOffset: number): number[] {
  const resolveTimes: number[] = [];
  for (let i = 0; i < charCount; i++) {
    const progress = charCount > 1 ? i / (charCount - 1) : 0;
    const randomJitter = (Math.random() - 0.5) * 2 * profile.jitter;
    resolveTimes[i] =
      lineOffset + profile.baseDelay + progress * profile.spreadDuration + randomJitter;
  }
  return resolveTimes;
}

function textToLines(text: string, font: string, maxWidth: number, lineHeight: number): string[] {
  if (!text) return [''];
  try {
    const prepared = prepareWithSegments(text, font);
    const result = layoutWithLines(prepared, maxWidth, lineHeight);
    return result.lines.map(l => l.text);
  } catch {
    return [text];
  }
}

function makeFinalLines(text: string, lineTexts: string[]): CipherLine[] {
  return lineTexts.map(lineText => {
    const chars = Array.from(lineText);
    return {
      text: lineText,
      chars,
      targetChars: chars,
      lineResolved: true,
    };
  });
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCipherTransition(
  text: string,
  options?: CipherTransitionOptions
): CipherTransitionResult {
  const isEnabled = process.env.NEXT_PUBLIC_CIPHER_TRANSITION === 'true';
  const isVisible = options?.isVisible ?? true;
  const elementRef = options?.elementRef;

  const [lines, setLines] = useState<CipherLine[]>(() => makeFinalLines(text, [text]));
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
    if (!isEnabled || !isVisible) {
      prevTextRef.current = text;
      return;
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Measure from DOM
    const el = elementRef?.current;
    const font = el ? getFont(el) : FALLBACK_FONT;
    const lh = el ? getLineHeight(el) : FALLBACK_LINE_HEIGHT;
    const width = el ? getWidth(el) : 600;

    if (prefersReducedMotion) {
      prevTextRef.current = text;
      const lineTexts = textToLines(text, font, width, lh);
      const id = requestAnimationFrame(() => {
        setLines(makeFinalLines(text, lineTexts));
        setIsAnimating(false);
      });
      return () => cancelAnimationFrame(id);
    }

    if (text === prevTextRef.current) {
      return;
    }

    cleanup();

    const lineTexts = textToLines(text, font, width, lh);
    const profile = getAnimationProfile();

    // Build per-line resolve times
    const lineResolveTimes: number[][] = lineTexts.map((lineText, lineIdx) => {
      const charCount = Array.from(lineText).length;
      const lineOffset = lineIdx * profile.lineStagger;
      return calculateResolveTimes(charCount, profile, lineOffset);
    });

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
        let allLinesResolved = true;

        const newLines: CipherLine[] = lineTexts.map((lineText, lineIdx) => {
          const targetChars = Array.from(lineText);
          const resolveTimes = lineResolveTimes[lineIdx];
          const chars: string[] = [];
          let lineAllResolved = true;

          for (let i = 0; i < targetChars.length; i++) {
            const resolveTime = resolveTimes[i];
            const targetChar = targetChars[i];

            if (elapsed >= resolveTime) {
              chars[i] = targetChar;
            } else {
              lineAllResolved = false;
              if (targetChar && isScramblable(targetChar)) {
                chars[i] = getRandomCipherChar();
              } else {
                chars[i] = targetChar;
              }
            }
          }

          if (!lineAllResolved) allLinesResolved = false;

          return {
            text: lineText,
            chars,
            targetChars,
            lineResolved: lineAllResolved,
          };
        });

        setLines(newLines);

        if (allLinesResolved) {
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

    return () => {
      cleanup();
      setLines(makeFinalLines(text, lineTexts));
    };
  }, [text, isEnabled, isVisible, cleanup, elementRef]);

  useEffect(() => cleanup, [cleanup]);

  if (!isEnabled || !isVisible) {
    return { lines: makeFinalLines(text, [text]), isAnimating: false };
  }

  return { lines, isAnimating };
}
