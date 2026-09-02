'use client';

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useCipherTransition } from '@/hooks/useCipherTransition';
import { getRandomCipherChar, isScramblable } from '@/lib/cipher-chars';

interface CipherTextProps {
  children?: string;
  block?: boolean;
}

const BLOCK_STYLE = {
  display: 'inline-block',
  width: '100%',
} as const;

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

// Word slots reuse CHAR_SLOT_STYLE. A slot is sized to the FINAL glyph, so a
// wider scramble glyph spills out of it; globals.css clips that with
// `overflow-x: clip` on the slot classes. It must stay `clip` and stay on one
// axis: `hidden` (or clipping both axes) makes the slot a scroll container,
// which moves an inline-block's baseline to its bottom edge and inflates every
// line box for the length of the animation.

// Stable identity for the non-animating case so the memo below never churns.
const NO_SEED: string[] = [];

const RTL_CHAR_REGEX = /[\u0590-\u07BF\u08A0-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
const LETTER_REGEX = /\p{L}/u;

// Inline-block slots are direction-neutral objects for the bidi algorithm, so
// runs of them get ordered by paragraph direction — mirroring "Go" into "oG"
// inside RTL text mid-animation. Zero-width strong marks (LRM/RLM) on BOTH
// sides of each slot rebuild the plain text's bidi run structure without
// affecting layout. Both sides matter: with a leading mark only, the last
// slot of a run sits between its own mark and the next run's opposite mark,
// resolves to the paragraph direction, and jumps across the run.
//
// Only letter-bearing text ever gets a slot (digits and punctuation stay plain
// text, so they keep their neutral bidi class and are not mirrored), so a mark
// is always emitted here.
function directionMark(text: string): string {
  return RTL_CHAR_REGEX.test(text) ? '\u200F' : '\u200E';
}

interface WordSegment {
  text: string;
  start: number;
  end: number;
  scramble: boolean;
}

// Split into words and whitespace runs, indexed in code points so slices line
// up with the animation's char arrays. Whitespace renders as plain text nodes,
// so the browser breaks lines exactly where the final text will.
function segmentWords(chars: string[]): WordSegment[] {
  const segments: WordSegment[] = [];
  let start = 0;
  while (start < chars.length) {
    const isSpace = /\s/.test(chars[start]);
    let end = start + 1;
    while (end < chars.length && /\s/.test(chars[end]) === isSpace) end++;
    segments.push({
      text: chars.slice(start, end).join(''),
      start,
      end,
      scramble: !isSpace,
    });
    start = end;
  }
  return segments;
}

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
 * - Long text (>80 chars desktop, >40 mobile): per-WORD slots instead of
 *   per-character spans (an order of magnitude fewer nodes); a hidden ghost of
 *   the target text pins layout so scramble frames never reflow the page, and
 *   the hook writes overlay text via the DOM, bypassing React reconciliation
 *
 * When block={true}, wraps content in a full-width inline-block span so the
 * text behaves as its own paragraph box. Layout stability during transitions
 * comes from the ghost layers above (per-char and per-word), which pin the
 * box to the final text's geometry for the whole animation.
 */
export default function CipherText({ children, block = false }: CipherTextProps) {
  const text = children || '';
  const isCipherEnabled = process.env.NEXT_PUBLIC_CIPHER_TRANSITION === 'true';

  // --- Viewport gating via IntersectionObserver ---
  const observerRef = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!isCipherEnabled) return;
    const el = observerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setIsVisible(e.isIntersecting), {
      rootMargin: '200px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, [isCipherEnabled]);

  // --- Long text: ref for direct DOM updates (bypasses React) ---
  const longTextRef = useRef<HTMLSpanElement>(null);
  const targetChars = useMemo(() => Array.from(text), [text]);

  // Resolve the long-text threshold on the client (and on viewport changes) instead
  // of calling matchMedia in the render body — which would run on every animation
  // frame for every instance. Starts at the desktop value so SSR and the first
  // client render agree; animation never runs on that first frame anyway.
  const [charThreshold, setCharThreshold] = useState(CHAR_THRESHOLD_DESKTOP);
  useEffect(() => {
    const update = () => setCharThreshold(getCharThreshold());
    update();
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const queries = [
      window.matchMedia('(pointer: coarse)'),
      window.matchMedia('(max-width: 768px)'),
    ].filter((query) => typeof query?.addEventListener === 'function');
    queries.forEach((query) => query.addEventListener('change', update));
    return () => {
      queries.forEach((query) => query.removeEventListener('change', update));
    };
  }, []);
  const isLongText = targetChars.length > charThreshold;

  // --- Animation hook ---
  const { displayChars, isAnimating } = useCipherTransition(text, {
    isVisible,
    elementRef: isLongText ? longTextRef : undefined,
  });

  // Overlays must never mount showing the final word: they appear on the render
  // that flips isAnimating, one or two painted frames before the first scramble
  // write lands, and a readable translation in that window reads as a flash of
  // the answer. Seeding them with cipher glyphs closes the gap.
  //
  // Gated on isAnimating so Math.random never runs on the server or on any
  // non-animating render: both SSR and the first client render take the
  // non-animating branch, so they produce identical markup and hydration is
  // unaffected. Keyed on targetChars too, so a language switch reseeds.
  const scrambleSeed = useMemo(
    () =>
      isAnimating
        ? targetChars.map((char) => (isScramblable(char) ? getRandomCipherChar(char) : char))
        : NO_SEED,
    [isAnimating, targetChars]
  );

  // --- Render helper: wrap with observer ref when cipher is enabled ---
  const wrapObserver = (content: React.ReactNode): React.ReactNode =>
    isCipherEnabled ? <span ref={observerRef}>{content}</span> : <>{content}</>;

  // --- Not animating ---
  if (!isAnimating && !block) {
    return wrapObserver(text);
  }

  if (!isAnimating && block) {
    return wrapObserver(<span style={BLOCK_STYLE}>{text}</span>);
  }

  // --- Animating: choose rendering path ---
  let animationContent: React.ReactNode;

  if (isLongText) {
    // Long text: hidden ghost words pin the layout (line breaks and height
    // match the final text from the first frame), while the hook writes the
    // scramble into absolutely-positioned per-word overlays. Wrapping never
    // changes mid-animation, so surrounding content doesn't shift.
    animationContent = (
      <>
        <span className="sr-only">{text}</span>
        <span ref={longTextRef} aria-hidden="true" data-cipher-text={text}>
          {segmentWords(targetChars).map((segment) =>
            // A segment with no letters (a bare year, an em dash) stays plain
            // text so it keeps its neutral bidi class and its digits are not
            // reordered by an RTL paragraph.
            segment.scramble && LETTER_REGEX.test(segment.text) ? (
              <Fragment key={segment.start}>
                {directionMark(segment.text)}
                <span className="cipher-word-slot" style={CHAR_SLOT_STYLE}>
                  <span className="cipher-char-layout">{segment.text}</span>
                  <span
                    className="cipher-word"
                    data-start={segment.start}
                    data-end={segment.end}
                    style={CHAR_STYLE}
                  >
                    {scrambleSeed.slice(segment.start, segment.end).join('')}
                  </span>
                </span>
                {directionMark(segment.text)}
              </Fragment>
            ) : (
              segment.text
            )
          )}
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

            // Digits, punctuation, dashes and spaces render as plain text
            // nodes: an inline-block slot is bidi-neutral, so a digit run made
            // of slots is laid out by paragraph direction and "2024" shows up
            // as "4202" inside Hebrew copy.
            if (!isScramblable(targetChar)) {
              return <Fragment key={index}>{targetChar}</Fragment>;
            }

            const isResolved = char === targetChar;

            return (
              <Fragment key={index}>
                {directionMark(targetChar)}
                <span className="cipher-char-slot" style={CHAR_SLOT_STYLE}>
                  <span className="cipher-char-layout">{targetChar}</span>
                  <span
                    className={`cipher-char${isResolved ? ' cipher-resolved' : ''}`}
                    style={CHAR_STYLE}
                  >
                    {char || scrambleSeed[index]}
                  </span>
                </span>
                {directionMark(targetChar)}
              </Fragment>
            );
          })}
        </span>
      </>
    );
  }

  if (block) {
    return wrapObserver(<span style={BLOCK_STYLE}>{animationContent}</span>);
  }

  return wrapObserver(animationContent);
}
