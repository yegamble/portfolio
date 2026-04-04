/**
 * Shared pretext measurement utilities.
 * Used by useCipherTransition (animation) and usePretextHeight (height reservation).
 */

export const FALLBACK_FONT = '400 16px Inter, Heebo, sans-serif';
export const FALLBACK_LINE_HEIGHT = 26;

export function getFont(el: HTMLElement): string {
  const computed = getComputedStyle(el).font;
  if (!computed || computed.includes('var(')) return FALLBACK_FONT;
  return computed;
}

export function getLineHeight(el: HTMLElement): number {
  const raw = getComputedStyle(el).lineHeight;
  const parsed = parseFloat(raw);
  if (!isNaN(parsed) && parsed > 0) return parsed;
  return FALLBACK_LINE_HEIGHT;
}

export function getWidth(el: HTMLElement): number {
  const parent = el.parentElement;
  return parent ? parent.clientWidth : el.clientWidth;
}
