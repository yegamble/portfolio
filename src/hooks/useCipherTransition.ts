import { useState, useEffect, useRef } from 'react';
import { getRandomCipherChar, isScramblable } from '@/lib/cipher-chars';

interface CipherTransitionResult {
  displayChars: string[];
  isAnimating: boolean;
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

    const baseDelay = 400;
    const spreadDuration = 1200;
    const jitter = 100;

    const resolveTimes: number[] = [];
    for (let i = 0; i < maxLen; i++) {
      const progress = maxLen > 1 ? i / (maxLen - 1) : 0;
      const randomJitter = (Math.random() - 0.5) * 2 * jitter;
      resolveTimes[i] = baseDelay + progress * spreadDuration + randomJitter;
    }
    resolveTimesRef.current = resolveTimes;

    let startTime: number | null = null;
    const updateInterval = 60;
    let lastUpdateTime = 0;
    let animStarted = false;

    const animate = (currentTime: number) => {
      if (startTime === null) {
        startTime = currentTime;
        // Initialize lastUpdateTime to allow the first frame to render immediately
        lastUpdateTime = currentTime - updateInterval;
      }

      if (!animStarted) {
        animStarted = true;
        setIsAnimating(true);
      }

      const timeSinceLastUpdate = currentTime - lastUpdateTime;

      // Only update the display if the interval has passed
      if (timeSinceLastUpdate >= updateInterval) {
        const elapsed = currentTime - startTime;
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

        setDisplayChars(chars);

        if (allResolved) {
          setIsAnimating(false);
          prevTextRef.current = text;
          return; // Stop the animation loop
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


  if (!isEnabled) {
    // Return a new object every render when disabled.
    // While this avoids useMemo overhead when active, it sacrifices reference stability
    // for the returned object and array when disabled.
    return { displayChars: Array.from(text), isAnimating: false as const };
  }

  return { displayChars, isAnimating };
}
