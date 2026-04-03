'use client';

import { useMemo } from 'react';
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

/**
 * Component that wraps text and applies a cipher/decryption animation effect when the text changes.
 * Each character cycles through random scripts before resolving to the final character.
 * Animation is controlled by NEXT_PUBLIC_CIPHER_TRANSITION env var.
 *
 * When block={true}, wraps content in a height-reserved span using pretext
 * to prevent layout jumps during language transitions.
 */
export default function CipherText({ children, block = false }: CipherTextProps) {
  const text = children || '';
  const { displayChars, isAnimating } = useCipherTransition(text);
  const isHebrewEnabled = process.env.NEXT_PUBLIC_HEBREW_ENABLED === 'true';
  const { ref, style } = usePretextHeight(text, block && isHebrewEnabled);
  const targetChars = useMemo(() => Array.from(text), [text]);

  if (!isAnimating && !block) {
    return <>{text}</>;
  }

  if (!isAnimating && block) {
    return (
      <span ref={ref} style={style}>
        {text}
      </span>
    );
  }

  const animationContent = (
    <>
      {/* Screen reader gets the actual text */}
      <span className="sr-only">{text}</span>

      {/* Visual animation (hidden from screen readers) */}
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

  if (block) {
    return (
      <span ref={ref} style={style}>
        {animationContent}
      </span>
    );
  }

  return animationContent;
}
