import { useRef, useState, useEffect, type CSSProperties, type RefObject } from 'react';
import { prepare, layout } from '@chenglou/pretext';
import { getFont, getLineHeight, getWidth } from '@/lib/pretext-utils';

interface UsePretextHeightResult {
  ref: RefObject<HTMLSpanElement | null>;
  style: CSSProperties;
}

const ANIMATION_DURATION = 1800;

export function usePretextHeight(
  text: string,
  isEnabled: boolean
): UsePretextHeightResult {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [minHeight, setMinHeight] = useState<number | undefined>(undefined);
  const prevTextRef = useRef(text);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isEnabled) return;

    const el = ref.current;
    if (!el) {
      prevTextRef.current = text;
      return;
    }

    if (text !== prevTextRef.current) {
      const width = getWidth(el);
      if (width > 0) {
        const currentHeight = el.offsetHeight;
        const font = getFont(el);
        const lineHeight = getLineHeight(el);

        const prepared = prepare(text, font);
        const { height: targetHeight } = layout(prepared, width, lineHeight);

        const maxHeight = Math.max(currentHeight, targetHeight);
        setMinHeight(maxHeight);

        if (timerRef.current !== null) {
          clearTimeout(timerRef.current);
        }

        timerRef.current = setTimeout(() => {
          setMinHeight(targetHeight);
          timerRef.current = null;
        }, ANIMATION_DURATION);
      }

      prevTextRef.current = text;
    }

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [text, isEnabled]);

  if (!isEnabled) {
    return { ref, style: {} };
  }

  const style: CSSProperties = {
    display: 'inline-block',
    width: '100%',
    transition: 'min-height 500ms ease-out',
  };

  if (minHeight !== undefined) {
    style.minHeight = `${minHeight}px`;
  }

  return { ref, style };
}
