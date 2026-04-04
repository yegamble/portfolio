'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useCipherTransition } from '@/hooks/useCipherTransition';
import { usePretextHeight } from '@/hooks/usePretextHeight';

interface CipherTextProps {
  children?: string;
  block?: boolean;
}

const CHAR_STYLE = {
  position: 'absolute',
  inset: 0,
  unicodeBidi: 'plaintext',
  whiteSpace: 'pre',
  pointerEvents: 'none',
} as const;

const CHAR_SLOT_STYLE = {
  position: 'relative',
  display: 'inline-block',
  unicodeBidi: 'plaintext',
  whiteSpace: 'pre',
  verticalAlign: 'baseline',
} as const;

const CHAR_THRESHOLD_DESKTOP = 80;
const CHAR_THRESHOLD_MOBILE = 40;

function getCharThreshold(): number {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return CHAR_THRESHOLD_DESKTOP;
  }
  const isMobile =
    window.matchMedia('(pointer: coarse)').matches ||
    window.matchMedia('(max-width: 768px)').matches;
  return isMobile ? CHAR_THRESHOLD_MOBILE : CHAR_THRESHOLD_DESKTOP;
}

/**
 * Component that wraps text and applies a cipher/decryption animation effect when the text changes.
 * Each character cycles through random scripts before resolving to the final character.
 * Animation is controlled by NEXT_PUBLIC_CIPHER_TRANSITION env var.
 *
 * Performance optimizations:
 * - Viewport gating: off-screen instances skip animation entirely
 * - Long text (>80 chars desktop, >40 mobile): uses direct DOM textContent updates
 *   instead of per-character <span> elements, reducing DOM nodes from thousands to one
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

  // --- Long text: ref for direct DOM updates (bypasses React) ---
  const longTextRef = useRef<HTMLSpanElement>(null);
  const isLongText = Array.from(text).length > getCharThreshold();

  // --- Animation hook ---
  const { displayChars, isAnimating } = useCipherTransition(text, {
    isVisible,
    elementRef: isLongText ? longTextRef : undefined,
  });
  const { ref, style } = usePretextHeight(text, block && isI18nEnabled, isAnimating);
  const targetChars = useMemo(() => Array.from(text), [text]);

  // --- Render helper: wrap with observer ref when cipher is enabled ---
  const wrapObserver = (content: React.ReactNode): React.ReactNode =>
    isCipherEnabled ? <span ref={observerRef}>{content}</span> : <>{content}</>;

  // --- Not animating ---
  if (!isAnimating && !block) {
    return wrapObserver(text);
  }

  if (!isAnimating && block) {
    return wrapObserver(
      <span ref={ref} style={style}>
        {text}
      </span>
    );
  }

  // --- Animating: choose rendering path ---
  let animationContent: React.ReactNode;

  if (isLongText) {
    // Long text: single ref'd span, textContent updated directly by the hook
    animationContent = (
      <>
        <span className="sr-only">{text}</span>
        <span
          ref={longTextRef}
          aria-hidden="true"
          className="cipher-text-scramble"
        >
          {text}
        </span>
      </>
    );
  } else {
    // Short text: per-char spans with individual resolve glow
    animationContent = (
      <>
        <span className="sr-only">{text}</span>
        <span aria-hidden="true">
          {displayChars.map((char, index) => {
            const targetChar = targetChars[index] ?? '';
            const isResolved = char === targetChar;

            return (
              <span
                key={index}
                className="cipher-char-slot"
                style={CHAR_SLOT_STYLE}
              >
                <span className="cipher-char-layout">{targetChar}</span>
                <span
                  className={`cipher-char${isResolved ? ' cipher-resolved' : ''}`}
                  style={CHAR_STYLE}
                >
                  {char || targetChar}
                </span>
              </span>
            );
          })}
        </span>
      </>
    );
  }

  if (block) {
    return wrapObserver(
      <span ref={ref} style={style}>
        {animationContent}
      </span>
    );
  }

  return wrapObserver(animationContent);
}
