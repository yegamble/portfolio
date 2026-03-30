import { useState, useEffect, useRef } from 'react';
import { getRandomCipherChar, isScramblable } from '@/lib/cipher-chars';

interface CipherTransitionResult {
  displayChars: string[];
  isAnimating: boolean;
}

const BASE_DELAY = 400;
const SPREAD_DURATION = 1200;
const JITTER = 100;
const UPDATE_INTERVAL = 60;

/**
 * Calculates the stagger and jitter resolve times for each character index.
 * @param maxLen The maximum length of characters to animate.
 * @returns An array of resolve times in milliseconds.
 */
function calculateResolveTimes(maxLen: number): number[] {
  const resolveTimes: number[] = [];
  for (let i = 0; i < maxLen; i++) {
    const progress = maxLen > 1 ? i / (maxLen - 1) : 0;
    const randomJitter = (Math.random() - 0.5) * 2 * JITTER;
    resolveTimes[i] = BASE_DELAY + progress * SPREAD_DURATION + randomJitter;
  }
  return resolveTimes;
}

/**
 * Generates the frame characters given the elapsed time.
 * @param maxLen Maximum string length.
 * @param newChars Array of the target characters.
 * @param resolveTimes Array of resolve times for each index.
 * @param elapsed Elapsed time in milliseconds.
 * @returns Object with chars array and allResolved flag.
 */
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

/**
 * Custom hook to handle the animation loop lifecycle and React state logic for the cipher effect.
 */
function useCipherAnimationLoop(text: string, isEnabled: boolean) {
  const [displayChars, setDisplayChars] = useState<string[]>(() =>
    Array.from(text)
  );
  const [isAnimating, setIsAnimating] = useState(false);
  const prevTextRef = useRef(text);
  const rafIdRef = useRef<number | null>(null);
  const resolveTimesRef = useRef<number[]>([]);

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
      rafIdRef.current = requestAnimationFrame(() => {
        setDisplayChars(Array.from(text));
        setIsAnimating(false);
      });
      return () => {
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
      };
    }

    if (text === prevTextRef.current) {
      return;
    }

    const oldChars = Array.from(prevTextRef.current);
    const newChars = Array.from(text);
    const maxLen = Math.max(oldChars.length, newChars.length);

    const resolveTimes = calculateResolveTimes(maxLen);
    resolveTimesRef.current = resolveTimes;

    let startTime: number | null = null;
    let lastUpdateTime = 0;
    let animStarted = false;

    const animate = (currentTime: number) => {
      if (startTime === null) {
        startTime = currentTime;
        lastUpdateTime = currentTime - UPDATE_INTERVAL;
      }

      if (!animStarted) {
        animStarted = true;
        setIsAnimating(true);
      }

      const timeSinceLastUpdate = currentTime - lastUpdateTime;

      if (timeSinceLastUpdate >= UPDATE_INTERVAL) {
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
          return;
        }

        lastUpdateTime = currentTime;
      }

      rafIdRef.current = requestAnimationFrame(animate);
    };

    rafIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [text, isEnabled]);

  return { displayChars, isAnimating };
}

/**
 * Hook for animating text transitions with a cipher/decryption effect.
 * Each character cycles through random characters from various scripts before resolving to the final character.
 * Staggered timing creates a wave effect.
 *
 * @param text - The current text to display
 * @returns Object with displayChars array and isAnimating flag
 */
export function useCipherTransition(text: string): CipherTransitionResult {
  const isEnabled = process.env.NEXT_PUBLIC_CIPHER_TRANSITION === 'true';
  const { displayChars, isAnimating } = useCipherAnimationLoop(text, isEnabled);

  if (!isEnabled) {
    return { displayChars: Array.from(text), isAnimating: false as const };
  }

  return { displayChars, isAnimating };
}
