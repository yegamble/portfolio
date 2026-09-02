import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CipherText from '@/components/CipherText';
import {
  stubIntersectionObserver,
  stubMatchMedia,
  stubResizeObserver,
  type IntersectionObserverStub,
  type MatchMediaStub,
  type ResizeObserverStub,
} from '../helpers/observers';

const mockResult = { displayChars: [] as string[], isAnimating: false };
vi.mock('@/hooks/useCipherTransition', () => ({
  useCipherTransition: (text: string) => {
    if (mockResult.displayChars.length === 0) {
      return { displayChars: Array.from(text), isAnimating: false };
    }
    return mockResult;
  },
}));

describe('CipherText', () => {
  let viewport: IntersectionObserverStub;
  let matchMedia: MatchMediaStub;

  beforeEach(() => {
    mockResult.displayChars = [];
    mockResult.isAnimating = false;

    viewport = stubIntersectionObserver();
    // Desktop: the long-text threshold is 80 characters rather than 40.
    matchMedia = stubMatchMedia();
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_CIPHER_TRANSITION;
    viewport.restore();
    matchMedia.restore();
  });

  describe('rendering', () => {
    it('should render text as plain string when env var is not set', () => {
      render(<CipherText>Hello World</CipherText>);

      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    it('should handle empty string', () => {
      const { container } = render(<CipherText></CipherText>);

      expect(container).toBeInTheDocument();
    });

    it('should render special characters', () => {
      render(<CipherText>Hello, World! 123</CipherText>);

      expect(screen.getByText('Hello, World! 123')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should provide screen reader accessible text', () => {
      render(<CipherText>Screen Reader Text</CipherText>);

      expect(screen.getByText('Screen Reader Text')).toBeInTheDocument();
    });

    it('should not draw cipher glyphs on a render that is not animating', () => {
      const random = vi.spyOn(Math, 'random');

      render(
        <CipherText>{'a fairly long sentence to exercise the ref path '.repeat(3)}</CipherText>
      );

      // The scramble seed is only needed by the animating branch. Drawing it
      // unconditionally would run Math.random once per character on the server
      // and on every idle render.
      expect(random).not.toHaveBeenCalled();

      random.mockRestore();
    });

    it('should not have animation spans when not animating', () => {
      const { container } = render(<CipherText>Hello</CipherText>);

      const spans = container.querySelectorAll('span');

      expect(spans.length).toBeLessThanOrEqual(1);
    });
  });

  describe('text updates', () => {
    it('should update when children prop changes', () => {
      const { rerender } = render(<CipherText>Original</CipherText>);

      expect(screen.getByText('Original')).toBeInTheDocument();

      rerender(<CipherText>Updated</CipherText>);

      expect(screen.getByText('Updated')).toBeInTheDocument();
      expect(screen.queryByText('Original')).not.toBeInTheDocument();
    });
  });

  describe('animated rendering path', () => {
    it('should keep the finished text readable while the glyphs scramble', () => {
      mockResult.displayChars = ['X', 'Y', 'Z', 'l', 'o'];
      mockResult.isAnimating = true;

      render(<CipherText>Hello</CipherText>);

      // The scrambling layer is hidden from assistive technology, so the only
      // text left in the accessibility tree is the finished string.
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    it('should hide the scrambling glyphs from assistive technology', () => {
      mockResult.displayChars = ['X', 'Y', 'Z', 'l', 'o'];
      mockResult.isAnimating = true;

      const { container } = render(<CipherText>Hello</CipherText>);

      const ariaHidden = container.querySelector('[aria-hidden="true"]');
      expect(ariaHidden).toBeInTheDocument();
      // The mid-flight glyphs exist only inside that hidden layer, so nothing
      // announces "XYZlo" on the way to "Hello".
      expect(ariaHidden?.textContent).toContain('X');
      expect(ariaHidden?.textContent).toContain('Y');
      expect(screen.queryByText('XYZlo')).not.toBeInTheDocument();
    });
  });

  describe('layout stability during animation', () => {
    it('should reserve layout with one hidden target span per scramblable character', () => {
      const text = 'Hello World';
      mockResult.displayChars = Array.from(text).map(() => 'X');
      mockResult.isAnimating = true;

      const { container } = render(<CipherText>{text}</CipherText>);

      const ariaHidden = container.querySelector('[aria-hidden="true"]');
      const layoutSpans = ariaHidden!.querySelectorAll('.cipher-char-layout');

      // The space is a plain text node, not a slot — inline-block slots are
      // bidi-neutral, so only letters may become one.
      expect(layoutSpans).toHaveLength(10);
      expect(layoutSpans[0]).toHaveTextContent('H');
      expect(layoutSpans[5]?.textContent).toBe('W');

      // The space survives as a direct text node between the two word runs.
      const plainTextNodes = Array.from(ariaHidden!.childNodes)
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent);
      expect(plainTextNodes).toContain(' ');
    });

    it('should not render a hidden animation layer when not animating', () => {
      render(<CipherText>Hello</CipherText>);

      // Idle text is a single readable node: no duplicate of it for screen
      // readers, and nothing hidden from them either.
      expect(screen.getAllByText('Hello')).toHaveLength(1);
      expect(document.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument();
    });

    it('should keep the whole target text readable during animation', () => {
      const text = 'Test content';
      mockResult.displayChars = Array.from(text).map(() => 'X');
      mockResult.isAnimating = true;

      render(<CipherText>{text}</CipherText>);

      expect(screen.getByText(text)).toBeInTheDocument();
    });
  });

  describe('block prop', () => {
    it('should render wrapper span when block is true and not animating', () => {
      const { container } = render(<CipherText block>Block text</CipherText>);

      const wrapper = container.querySelector('span');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveTextContent('Block text');
    });

    it('should not render wrapper span when block is false (default)', () => {
      const { container } = render(<CipherText>Inline text</CipherText>);

      // Without block, non-animating renders plain text node (no wrapper span)
      expect(container.querySelector('span')).not.toBeInTheDocument();
      expect(screen.getByText('Inline text')).toBeInTheDocument();
    });

    it('should render wrapper span with animation content when block is true and animating', () => {
      mockResult.displayChars = ['X', 'Y', 'Z'];
      mockResult.isAnimating = true;

      const { container } = render(<CipherText block>Hey</CipherText>);

      // One wrapper span carrying both the readable text and the hidden
      // scrambling layer.
      const wrapper = container.firstElementChild as HTMLElement;
      expect(wrapper?.tagName).toBe('SPAN');
      expect(within(wrapper).getByText('Hey')).toBeInTheDocument();
      expect(wrapper?.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    });

    it('should keep the block wrapper when switching between animating and non-animating states', () => {
      const { container, rerender } = render(<CipherText block>Text A</CipherText>);

      // Non-animating: wrapper span exists
      const wrapperBefore = container.querySelector('span');
      expect(wrapperBefore).toBeInTheDocument();

      // Switch to animating
      mockResult.displayChars = ['X', 'Y', 'Z', 'A', 'B'];
      mockResult.isAnimating = true;
      rerender(<CipherText block>Text B</CipherText>);

      // Wrapper span still exists
      const wrapperDuring = container.firstElementChild as HTMLElement;
      expect(wrapperDuring?.tagName).toBe('SPAN');

      // Switch back to non-animating
      mockResult.displayChars = [];
      mockResult.isAnimating = false;
      rerender(<CipherText block>Text B</CipherText>);

      // Wrapper span still exists (ref stays attached)
      const wrapperAfter = container.querySelector('span');
      expect(wrapperAfter).toBeInTheDocument();
    });
  });

  describe('viewport gating', () => {
    it('should set up IntersectionObserver for viewport detection', () => {
      process.env.NEXT_PUBLIC_CIPHER_TRANSITION = 'true';

      render(<CipherText>Hello</CipherText>);

      expect(viewport.ctor).toHaveBeenCalled();
      expect(viewport.observe).toHaveBeenCalled();
    });

    it('should disconnect IntersectionObserver on unmount', () => {
      process.env.NEXT_PUBLIC_CIPHER_TRANSITION = 'true';

      const { unmount } = render(<CipherText>Hello</CipherText>);
      unmount();

      expect(viewport.disconnect).toHaveBeenCalled();
    });
  });

  describe('long text optimization', () => {
    it('should not create per-char spans for text longer than 80 characters during animation', () => {
      const longText = 'A'.repeat(100);
      mockResult.displayChars = Array.from(longText);
      mockResult.isAnimating = true;

      const { container } = render(<CipherText>{longText}</CipherText>);

      // Long text should NOT use per-char spans — uses ref-based text update instead
      expect(container.querySelectorAll('.cipher-char-slot').length).toBe(0);
    });

    it('should emit zero-width direction marks so slot runs keep bidi order', () => {
      const longText = `${'מערכת התראות serverless על AWS Lambda '.repeat(3)}סוף`;
      mockResult.displayChars = Array.from(longText);
      mockResult.isAnimating = true;

      const { container } = render(<CipherText>{longText}</CipherText>);

      const animationLayer = container.querySelector('[aria-hidden="true"]');
      // RLM before Hebrew words, LRM before Latin words
      expect(animationLayer?.textContent).toContain('‏');
      expect(animationLayer?.textContent).toContain('‎');

      const slots = Array.from(container.querySelectorAll('.cipher-word-slot'));
      const latinSlot = slots.find(
        (slot) => slot.querySelector('.cipher-char-layout')?.textContent === 'AWS'
      );
      expect(latinSlot?.previousSibling?.textContent).toBe('‎');
      const hebrewSlot = slots.find(
        (slot) => slot.querySelector('.cipher-char-layout')?.textContent === 'מערכת'
      );
      expect(hebrewSlot?.previousSibling?.textContent).toBe('‏');
    });

    it('should render ghost word slots that pin layout to the target text during animation', () => {
      const longText = 'alpha beta gamma '.repeat(10).trim();
      mockResult.displayChars = Array.from(longText);
      mockResult.isAnimating = true;

      const { container } = render(<CipherText>{longText}</CipherText>);

      const slots = container.querySelectorAll('.cipher-word-slot');
      expect(slots.length).toBe(30);

      // Hidden ghost carries the target word (owns the layout)
      const firstGhost = slots[0].querySelector('.cipher-char-layout');
      expect(firstGhost).toHaveTextContent('alpha');

      // Overlay carries code-point indices for the frame writer
      const firstOverlay = slots[0].querySelector('.cipher-word');
      expect(firstOverlay).toHaveAttribute('data-start', '0');
      expect(firstOverlay).toHaveAttribute('data-end', '5');

      const secondOverlay = slots[1].querySelector('.cipher-word');
      expect(secondOverlay).toHaveAttribute('data-start', '6');
      expect(secondOverlay).toHaveAttribute('data-end', '10');
    });

    it('should still keep long text readable to a screen reader while animating', () => {
      // Multi-word, so the hidden ghost is split per word and the only node
      // carrying the whole sentence is the one a screen reader reads.
      const longText = 'alpha beta gamma delta '.repeat(6).trim();
      mockResult.displayChars = Array.from(longText);
      mockResult.isAnimating = true;

      render(<CipherText>{longText}</CipherText>);

      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('should render one slot for a long word with nowhere to break', () => {
      // 100 characters and no whitespace: segmentWords produces a single
      // segment, so one ghost and one overlay have to cover the whole string.
      // The multi-word case above passes whether or not that boundary is right.
      const longWord = 'A'.repeat(100);
      mockResult.displayChars = Array.from(longWord);
      mockResult.isAnimating = true;

      const { container } = render(<CipherText>{longWord}</CipherText>);

      const slots = container.querySelectorAll('.cipher-word-slot');
      expect(slots).toHaveLength(1);
      expect(slots[0].querySelector('.cipher-char-layout')).toHaveTextContent(longWord);

      const overlay = slots[0].querySelector('.cipher-word');
      expect(overlay).toHaveAttribute('data-start', '0');
      expect(overlay).toHaveAttribute('data-end', String(longWord.length));
      expect(container.querySelectorAll('.cipher-char-slot')).toHaveLength(0);
    });

    it('should still create per-char spans for short text during animation', () => {
      mockResult.displayChars = ['X', 'Y', 'Z', 'l', 'o'];
      mockResult.isAnimating = true;

      const { container } = render(<CipherText>Hello</CipherText>);

      // Short text keeps per-char span animation
      expect(container.querySelectorAll('.cipher-char-slot').length).toBe(5);
    });

    it('should leave digits, dashes and spaces outside the bidi-neutral slots', () => {
      const text = '2024 — היום';
      mockResult.displayChars = Array.from(text);
      mockResult.isAnimating = true;

      const { container } = render(<CipherText>{text}</CipherText>);

      // A run of inline-block slots is laid out by paragraph direction, so a
      // digit inside one is mirrored ("2024" renders as "4202") in Hebrew.
      const layouts = Array.from(container.querySelectorAll('.cipher-char-layout'));
      expect(layouts.every((span) => !/[0-9]/.test(span.textContent ?? ''))).toBe(true);

      // Only the four Hebrew letters get a slot; the rest is plain text.
      expect(container.querySelectorAll('.cipher-char-slot')).toHaveLength(4);
      expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent('2024');
    });

    it('should emit long-text word slots only for segments that contain letters', () => {
      const longText = `${'\u05d4\u05e7\u05de\u05ea \u05de\u05e2\u05e8\u05db\u05ea \u05d4\u05ea\u05e8\u05d0\u05d5\u05ea '.repeat(6)}2024 \u2014 \u05d4\u05d9\u05d5\u05dd`;
      mockResult.displayChars = Array.from(longText);
      mockResult.isAnimating = true;

      const { container } = render(<CipherText>{longText}</CipherText>);

      const layouts = Array.from(container.querySelectorAll('.cipher-char-layout'));
      expect(layouts.length).toBeGreaterThan(0);
      expect(layouts.every((span) => !/[0-9]/.test(span.textContent ?? ''))).toBe(true);
      expect(layouts.some((span) => span.textContent === '\u2014')).toBe(false);
      expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent('2024');
    });

    it('should mount long-text overlays already scrambled so the answer never flashes', () => {
      const longText = 'systeme alertes serverless sur AWS Lambda et DynamoDB '.repeat(3).trim();
      mockResult.displayChars = Array.from(longText);
      mockResult.isAnimating = true;

      const { container } = render(<CipherText>{longText}</CipherText>);

      const slots = Array.from(container.querySelectorAll('.cipher-word-slot'));
      expect(slots.length).toBeGreaterThan(10);

      const flashing = slots.filter((slot) => {
        const overlay = slot.querySelector('.cipher-word')?.textContent ?? '';
        const ghost = slot.querySelector('.cipher-char-layout')?.textContent ?? '';
        return /\p{L}/u.test(ghost) && overlay === ghost;
      });

      expect(flashing).toHaveLength(0);
    });

    it('should mount short-text overlays already scrambled when no frame has landed', () => {
      const text = 'Hello';
      mockResult.displayChars = ['', '', '', '', ''];
      mockResult.isAnimating = true;

      const { container } = render(<CipherText>{text}</CipherText>);

      const chars = Array.from(container.querySelectorAll('.cipher-char'));
      expect(chars).toHaveLength(5);
      expect(chars.map((span) => span.textContent).join('')).not.toBe(text);
    });

    it('should emit per-char direction marks in short mode for mixed-direction text', () => {
      const text = 'שלום Go';
      mockResult.displayChars = Array.from(text);
      mockResult.isAnimating = true;

      const { container } = render(<CipherText>{text}</CipherText>);

      const slots = Array.from(container.querySelectorAll('.cipher-char-slot'));
      const latinSlot = slots.find(
        (slot) => slot.querySelector('.cipher-char-layout')?.textContent === 'G'
      );
      expect(latinSlot?.previousSibling?.textContent).toBe('‎');
      const hebrewSlot = slots.find(
        (slot) => slot.querySelector('.cipher-char-layout')?.textContent === 'ש'
      );
      expect(hebrewSlot?.previousSibling?.textContent).toBe('‏');

      // The run-final slot needs a trailing mark too, or it resolves to the
      // paragraph direction and jumps across its run
      const lastLatinSlot = slots.find(
        (slot) => slot.querySelector('.cipher-char-layout')?.textContent === 'o'
      );
      expect(lastLatinSlot?.nextSibling?.textContent).toBe('‎');
    });
  });
  describe('block-mode height ease', () => {
    let resize: ResizeObserverStub;

    /**
     * jsdom reports a zero rect for everything, so the wrapper's height is
     * scripted. The mechanics of the ease itself are covered in
     * __tests__/hooks/useBlockHeightEase.test.ts; what matters here is that the
     * component hands the hook the right element and the right visibility.
     */
    function stubHeight(element: HTMLElement, height: number) {
      element.getBoundingClientRect = vi.fn(
        () => ({ height, width: 0, top: 0, bottom: height, left: 0, right: 0 }) as DOMRect
      );
    }

    function reportSettledHeight(height: number) {
      resize.emit(height);
    }

    function reportVisibility(isIntersecting: boolean) {
      viewport.emit(isIntersecting);
    }

    function blockWrapper(container: HTMLElement) {
      // The observer span carries no style attribute, so the first styled span
      // in document order is the block wrapper.
      return container.querySelector<HTMLElement>('span[style]')!;
    }

    beforeEach(() => {
      process.env.NEXT_PUBLIC_CIPHER_TRANSITION = 'true';
      resize = stubResizeObserver();

      // jsdom has a CSS namespace but no CSS.supports, and the ease refuses to
      // run without `overflow-y: clip` support.
      (globalThis.CSS as unknown as { supports?: () => boolean }).supports = () => true;
    });

    afterEach(() => {
      delete (globalThis.CSS as unknown as { supports?: () => boolean }).supports;
      resize.restore();
    });

    it('should ease the block wrapper when the text changes', () => {
      const { container, rerender } = render(<CipherText block>Alpha</CipherText>);
      const wrapper = blockWrapper(container);

      reportSettledHeight(240);
      stubHeight(wrapper, 180);
      rerender(<CipherText block>Beta</CipherText>);

      expect(wrapper.style.height).toBe('180px');
      expect(wrapper.style.transition).toBe('height 300ms ease-out');
    });

    it('should animate the same DOM node the animating branch renders into', () => {
      const { container, rerender } = render(<CipherText block>Alpha</CipherText>);
      const wrapper = blockWrapper(container);

      reportSettledHeight(240);
      stubHeight(wrapper, 180);

      // The switch that matters: new text AND the branch flip to the animating
      // markup, in one commit. Both branches emit the same wrapper element, so
      // React reuses this node and the inline styles the ease just wrote to it
      // survive.
      mockResult.displayChars = ['X', 'Y', 'Z', 'A'];
      mockResult.isAnimating = true;
      rerender(<CipherText block>Beta</CipherText>);

      expect(blockWrapper(container)).toBe(wrapper);
      expect(within(wrapper).getByText('Beta')).toBeInTheDocument();
      expect(wrapper.style.height).toBe('180px');
    });

    it('should not ease an instance the viewport observer reports as off-screen', () => {
      const { container, rerender } = render(<CipherText block>Alpha</CipherText>);
      const wrapper = blockWrapper(container);

      reportSettledHeight(240);
      reportVisibility(false);
      stubHeight(wrapper, 180);
      rerender(<CipherText block>Beta</CipherText>);

      expect(wrapper.style.height).toBe('');
    });

    it('should not observe anything in inline (non-block) mode', () => {
      const { rerender } = render(<CipherText>Alpha</CipherText>);

      rerender(<CipherText>Beta</CipherText>);

      expect(resize.ctor).not.toHaveBeenCalled();
    });
  });
});
