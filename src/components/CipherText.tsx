'use client';

import { useEffect, useRef, useState } from 'react';
import { useCipherTransition } from '@/hooks/useCipherTransition';
import { usePretextHeight } from '@/hooks/usePretextHeight';

interface CipherTextProps {
  children?: string;
  block?: boolean;
}

/**
 * Component that wraps text and applies a cipher/decryption animation effect when the text changes.
 * Uses pretext's line-level APIs to split text into visual lines, then animates each line's
 * characters independently. When a line fully resolves, it gets a teal glow effect.
 *
 * Performance optimizations:
 * - Viewport gating: off-screen instances skip animation entirely
 * - Shared RAF scheduler batches all instances into one frame loop
 *
 * When block={true}, wraps content in a height-reserved span using pretext
 * to prevent layout jumps during language transitions.
 */
export default function CipherText({ children, block = false }: CipherTextProps) {
  const text = children || '';
  const isCipherEnabled = process.env.NEXT_PUBLIC_CIPHER_TRANSITION === 'true';
  const isI18nEnabled = process.env.NEXT_PUBLIC_I18N_ENABLED === 'true';

  // --- Viewport gating via IntersectionObserver ---
  const observerRef = useRef<HTMLSpanElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!isCipherEnabled) return;
    const el = observerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setIsVisible(e.isIntersecting),
      { rootMargin: '200px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [isCipherEnabled]);

  // --- DOM measurement for pretext line splitting ---
  const [, setMeasureTick] = useState(0);

  useEffect(() => {
    const el = measureRef.current;
    if (!el || !isCipherEnabled) return;
    const observer = new ResizeObserver(() => {
      setMeasureTick(t => t + 1);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [isCipherEnabled]);

  // --- Animation hook ---
  const { lines, isAnimating } = useCipherTransition(text, {
    isVisible,
    elementRef: measureRef,
  });
  const { ref, style } = usePretextHeight(text, block && isI18nEnabled);

  // --- Render helper: wrap with observer ref when cipher is enabled ---
  const wrapObserver = (content: React.ReactNode): React.ReactNode =>
    isCipherEnabled ? <span ref={observerRef}>{content}</span> : <>{content}</>;

  // --- Not animating ---
  if (!isAnimating && !block) {
    return wrapObserver(<span ref={measureRef}>{text}</span>);
  }

  if (!isAnimating && block) {
    return wrapObserver(
      <span ref={ref} style={style}>
        <span ref={measureRef}>{text}</span>
      </span>
    );
  }

  // --- Animating: line-based rendering ---
  const animationContent = (
    <>
      <span className="sr-only">{text}</span>
      <span ref={measureRef} aria-hidden="true">
        {lines.map((line, lineIdx) => (
          <span
            key={lineIdx}
            className={`cipher-line${line.lineResolved ? ' cipher-line-resolved' : ''}`}
          >
            {line.chars.map((char, charIdx) => {
              const targetChar = line.targetChars[charIdx] ?? '';
              const isResolved = char === targetChar;

              return (
                <span
                  key={charIdx}
                  className="cipher-char-slot"
                  style={{
                    display: 'inline',
                    unicodeBidi: 'plaintext' as const,
                    whiteSpace: 'pre' as const,
                  }}
                >
                  <span
                    className={`cipher-char${isResolved ? ' cipher-resolved' : ''}`}
                  >
                    {char || targetChar}
                  </span>
                </span>
              );
            })}
          </span>
        ))}
      </span>
    </>
  );

  if (block) {
    return wrapObserver(
      <span ref={ref} style={style}>
        {animationContent}
      </span>
    );
  }

  return wrapObserver(animationContent);
}
