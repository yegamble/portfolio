'use client';

import { useCipherTransition } from '@/hooks/useCipherTransition';

interface CipherTextProps {
  children?: string;
}

const CHAR_STYLE = {
  display: 'inline-block',
  unicodeBidi: 'plaintext',
} as const;

/**
 * Component that wraps text and applies a cipher/decryption animation effect when the text changes.
 * Each character cycles through random scripts before resolving to the final character.
 * Animation is controlled by NEXT_PUBLIC_CIPHER_TRANSITION env var.
 */
export default function CipherText({ children }: CipherTextProps) {
  const text = children || '';
  const { displayChars, isAnimating } = useCipherTransition(text);

  if (!isAnimating) {
    return <>{text}</>;
  }

  const targetChars = Array.from(text);

  return (
    <>
      {/* Screen reader gets the actual text */}
      <span className="sr-only">{text}</span>

      {/* Visual animation (hidden from screen readers) */}
      <span aria-hidden="true">
        {displayChars.map((char, index) => {
          const isResolved = char === targetChars[index];

          return (
            <span
              key={index}
              className={isResolved ? 'cipher-resolved' : ''}
              style={CHAR_STYLE}
            >
              {char}
            </span>
          );
        })}
      </span>
    </>
  );
}
