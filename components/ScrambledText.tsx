'use client';

import { useRef, useLayoutEffect } from 'react';
import { scrambleTransition } from '@/lib/scramble';
import type { ScrambleOptions } from '@/lib/scramble';

export interface ScrambledTextProps {
  /** The text to display (and animate toward when it changes). */
  children: string;
  /** Optional scramble options forwarded to the animation engine. */
  scrambleOptions?: ScrambleOptions;
  /** Extra class names forwarded to the wrapping `<span>`. */
  className?: string;
}

/**
 * Renders a `<span>` whose text content transitions through a cipher /
 * encryption animation whenever `children` changes.
 *
 * On first mount the text is rendered instantly (no animation).
 * Respects `prefers-reduced-motion` — animation is skipped entirely when
 * the user has opted out of motion.
 *
 * Usage:
 * ```tsx
 * <ScrambledText>{t('nav.about')}</ScrambledText>
 * ```
 */
export default function ScrambledText({
  children,
  scrambleOptions,
  className,
}: ScrambledTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const prevTextRef = useRef(children);
  const cancelRef = useRef<(() => void) | null>(null);
  const mounted = useRef(false);

  useLayoutEffect(() => {
    const el = ref.current;
    const from = prevTextRef.current;
    const to = children;

    // Always keep the ref in sync
    prevTextRef.current = to;

    // No animation on initial mount
    if (!mounted.current) {
      mounted.current = true;
      return;
    }

    // Nothing changed
    if (from === to || !el) return;

    // Respect prefers-reduced-motion
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    // Cancel any in-flight animation
    cancelRef.current?.();
    cancelRef.current = scrambleTransition(el, from, to, scrambleOptions);

    return () => {
      cancelRef.current?.();
      cancelRef.current = null;
    };
  }, [children, scrambleOptions]);

  return (
    <span ref={ref} className={className}>
      {children}
    </span>
  );
}
