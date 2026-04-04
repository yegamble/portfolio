import { useRef, useState, useEffect, useLayoutEffect, type CSSProperties, type RefObject } from 'react';
import { prepare, layout } from '@chenglou/pretext';

interface UsePretextHeightResult {
  ref: RefObject<HTMLSpanElement | null>;
  style: CSSProperties;
}

const FALLBACK_FONT = '400 16px Inter, Heebo, sans-serif';
const FALLBACK_LINE_HEIGHT = 26;

function getFont(el: HTMLElement): string {
  const computed = getComputedStyle(el).font;
  if (!computed || computed.includes('var(')) return FALLBACK_FONT;
  return computed;
}

function getLineHeight(el: HTMLElement): number {
  const raw = getComputedStyle(el).lineHeight;
  const parsed = parseFloat(raw);
  if (!isNaN(parsed) && parsed > 0) return parsed;
  return FALLBACK_LINE_HEIGHT;
}

// Returns 0 if element and all ancestors have no layout width (e.g. hidden subtree) — measurement skipped.
function getWidth(el: HTMLElement): number {
  if (el.clientWidth > 0) return el.clientWidth;
  let current = el.parentElement;
  while (current) {
    if (current.clientWidth > 0) return current.clientWidth;
    current = current.parentElement;
  }
  return 0;
}

export function usePretextHeight(
  text: string,
  isEnabled: boolean,
  isAnimating: boolean = false
): UsePretextHeightResult {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [maxHeightClamp, setMaxHeightClamp] = useState<number | undefined>(undefined);
  const [minHeight, setMinHeight] = useState<number | undefined>(undefined);
  const prevTextRef = useRef(text);
  const targetHeightRef = useRef<number | undefined>(undefined);
  const wasAnimatingRef = useRef(false);

  // Measure and set max-height clamp on text change (layout effect to apply before paint)
  useLayoutEffect(() => {
    if (!isEnabled) return;

    const el = ref.current;
    if (!el) {
      prevTextRef.current = text;
      return;
    }

    if (text !== prevTextRef.current) {
      const width = getWidth(el);
      if (width > 0) {
        const font = getFont(el);
        const lineHeight = getLineHeight(el);

        // Measure BOTH old and new text with pretext
        const oldPrepared = prepare(prevTextRef.current, font);
        const { height: oldHeight } = layout(oldPrepared, width, lineHeight);
        const newPrepared = prepare(text, font);
        const { height: newHeight } = layout(newPrepared, width, lineHeight);

        // Clamp at max of both — prevents overshoot during animation
        setMaxHeightClamp(Math.max(oldHeight, newHeight));
        targetHeightRef.current = newHeight;
      }

      prevTextRef.current = text;
    }
  }, [text, isEnabled, isAnimating]);

  // Release clamp and set target minHeight when animation completes.
  // This synchronizes React state with the external animation lifecycle —
  // the extra render is intentional to remove the clamp in the same frame.
  useEffect(() => {
    if (wasAnimatingRef.current && !isAnimating) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMaxHeightClamp(undefined);
      if (targetHeightRef.current !== undefined) {
        setMinHeight(targetHeightRef.current);
      }
    }
    wasAnimatingRef.current = isAnimating;
  }, [isAnimating]);

  if (!isEnabled) {
    return { ref, style: {} };
  }

  const style: CSSProperties = {
    display: 'inline-block',
    width: '100%',
    transition: 'min-height 500ms ease-out',
  };

  if (isAnimating && maxHeightClamp !== undefined) {
    style.maxHeight = `${maxHeightClamp}px`;
    style.overflow = 'hidden';
  }

  if (minHeight !== undefined) {
    style.minHeight = `${minHeight}px`;
  }

  return { ref, style };
}
