import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CipherText from '@/components/CipherText';

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
  let observeMock: ReturnType<typeof vi.fn>;
  let disconnectMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockResult.displayChars = [];
    mockResult.isAnimating = false;

    observeMock = vi.fn();
    disconnectMock = vi.fn();
    global.IntersectionObserver = vi.fn(function (
      this: IntersectionObserver,
      _callback: IntersectionObserverCallback
    ) {
      return {
        observe: observeMock,
        unobserve: vi.fn(),
        disconnect: disconnectMock,
        root: null,
        rootMargin: '',
        thresholds: [],
        takeRecords: () => [],
      };
    }) as unknown as typeof IntersectionObserver;

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_CIPHER_TRANSITION;
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
    it('should render sr-only span with actual text when animating', () => {
      mockResult.displayChars = ['X', 'Y', 'Z', 'l', 'o'];
      mockResult.isAnimating = true;

      const { container } = render(<CipherText>Hello</CipherText>);

      const srOnly = container.querySelector('.sr-only');
      expect(srOnly).toBeInTheDocument();
      expect(srOnly).toHaveTextContent('Hello');
    });

    it('should render aria-hidden span wrapping animation characters', () => {
      mockResult.displayChars = ['X', 'Y', 'Z', 'l', 'o'];
      mockResult.isAnimating = true;

      const { container } = render(<CipherText>Hello</CipherText>);

      const ariaHidden = container.querySelector('[aria-hidden="true"]');
      expect(ariaHidden).toBeInTheDocument();
      expect(ariaHidden?.querySelectorAll('.cipher-char-slot').length).toBe(5);
    });

    it('should apply cipher-resolved class to resolved characters', () => {
      mockResult.displayChars = ['H', 'X', 'l', 'l', 'o'];
      mockResult.isAnimating = true;

      const { container } = render(<CipherText>Hello</CipherText>);

      const ariaHidden = container.querySelector('[aria-hidden="true"]');
      const charSpans = ariaHidden?.querySelectorAll('.cipher-char');

      expect(charSpans?.[0]).toHaveClass('cipher-resolved');
      expect(charSpans?.[1]).not.toHaveClass('cipher-resolved');
      expect(charSpans?.[2]).toHaveClass('cipher-resolved');
    });

    it('should apply cipher-char base class to all character spans', () => {
      mockResult.displayChars = ['H', 'X', 'l', 'l', 'o'];
      mockResult.isAnimating = true;

      const { container } = render(<CipherText>Hello</CipherText>);

      const ariaHidden = container.querySelector('[aria-hidden="true"]');
      const charSpans = ariaHidden!.querySelectorAll('.cipher-char');

      charSpans.forEach((span) => {
        expect(span).toHaveClass('cipher-char');
      });
    });

    it('should have both cipher-char and cipher-resolved on resolved characters', () => {
      mockResult.displayChars = ['H', 'X', 'l', 'l', 'o'];
      mockResult.isAnimating = true;

      const { container } = render(<CipherText>Hello</CipherText>);

      const ariaHidden = container.querySelector('[aria-hidden="true"]');
      const charSpans = ariaHidden!.querySelectorAll('.cipher-char');

      expect(charSpans[0]).toHaveClass('cipher-char', 'cipher-resolved');
      expect(charSpans[1]).toHaveClass('cipher-char');
      expect(charSpans[1]).not.toHaveClass('cipher-resolved');
    });
  });

  describe('layout stability during animation', () => {
    it('should apply display inline-block to each character slot', () => {
      mockResult.displayChars = ['X', 'Y', 'Z', 'l', 'o'];
      mockResult.isAnimating = true;

      const { container } = render(<CipherText>Hello</CipherText>);

      const ariaHidden = container.querySelector('[aria-hidden="true"]');
      const charSpans = ariaHidden!.querySelectorAll('.cipher-char-slot');

      charSpans.forEach((span) => {
        const charSlot = span as HTMLElement;
        expect(charSlot.style.display).toBe('inline-block');
      });
    });

    it('should apply unicode-bidi plaintext to each character slot', () => {
      mockResult.displayChars = ['X', 'Y', 'Z', 'l', 'o'];
      mockResult.isAnimating = true;

      const { container } = render(<CipherText>Hello</CipherText>);

      const ariaHidden = container.querySelector('[aria-hidden="true"]');
      const charSpans = ariaHidden!.querySelectorAll('.cipher-char-slot');

      charSpans.forEach((span) => {
        const charSlot = span as HTMLElement;
        expect(charSlot.style.unicodeBidi).toBe('plaintext');
      });
    });

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

    it('should absolutely position visual characters over the reserved layout', () => {
      mockResult.displayChars = ['X', 'Y', 'Z', 'l', 'o'];
      mockResult.isAnimating = true;

      const { container } = render(<CipherText>Hello</CipherText>);

      const ariaHidden = container.querySelector('[aria-hidden="true"]');
      const charSpans = ariaHidden!.querySelectorAll('.cipher-char');

      charSpans.forEach((span) => {
        const charVisual = span as HTMLElement;
        expect(charVisual.style.position).toBe('absolute');
        expect(charVisual.style.inset).toBe('0px');
      });
    });

    it('should render one slot per scramblable character, skipping whitespace', () => {
      const text = 'Hello World';
      mockResult.displayChars = Array.from(text).map(() => 'X');
      mockResult.isAnimating = true;

      const { container } = render(<CipherText>{text}</CipherText>);

      const ariaHidden = container.querySelector('[aria-hidden="true"]');
      const charSpans = ariaHidden!.querySelectorAll('.cipher-char-slot');
      expect(charSpans).toHaveLength(10);
    });

    it('should not render wrapper spans when not animating', () => {
      const { container } = render(<CipherText>Hello</CipherText>);

      expect(container.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument();
      expect(container.querySelector('.sr-only')).not.toBeInTheDocument();
    });

    it('should preserve text content in sr-only span during animation', () => {
      const text = 'Test content';
      mockResult.displayChars = Array.from(text).map(() => 'X');
      mockResult.isAnimating = true;

      const { container } = render(<CipherText>{text}</CipherText>);

      const srOnly = container.querySelector('.sr-only');
      expect(srOnly).toHaveTextContent(text);
    });
  });

  describe('block prop', () => {
    it('should render wrapper span when block is true and not animating', () => {
      const { container } = render(<CipherText block>Block text</CipherText>);

      const wrapper = container.querySelector('span');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveTextContent('Block text');
      expect(wrapper?.style.display).toBe('inline-block');
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

      // Should have wrapper span containing sr-only and aria-hidden
      const wrapper = container.firstElementChild as HTMLElement;
      expect(wrapper?.tagName).toBe('SPAN');
      expect(wrapper?.style.display).toBe('inline-block');
      expect(wrapper?.querySelector('.sr-only')).toBeInTheDocument();
      expect(wrapper?.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    });

    it('should render a full-width inline-block wrapper when block is true', () => {
      const { container } = render(<CipherText block>Tall text</CipherText>);

      const wrapper = container.querySelector('span');
      expect(wrapper?.style.display).toBe('inline-block');
      expect(wrapper?.style.width).toBe('100%');
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

      expect(global.IntersectionObserver).toHaveBeenCalled();
      expect(observeMock).toHaveBeenCalled();
    });

    it('should disconnect IntersectionObserver on unmount', () => {
      process.env.NEXT_PUBLIC_CIPHER_TRANSITION = 'true';

      const { unmount } = render(<CipherText>Hello</CipherText>);
      unmount();

      expect(disconnectMock).toHaveBeenCalled();
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

    it('should still render sr-only text for accessibility during long text animation', () => {
      const longText = 'A'.repeat(100);
      mockResult.displayChars = Array.from(longText);
      mockResult.isAnimating = true;

      const { container } = render(<CipherText>{longText}</CipherText>);

      const srOnly = container.querySelector('.sr-only');
      expect(srOnly).toBeInTheDocument();
      expect(srOnly).toHaveTextContent(longText);
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
    let resizeCallbacks: ResizeObserverCallback[];
    let originalResizeObserver: typeof ResizeObserver | undefined;

    /**
     * jsdom reports a zero rect for everything, so the wrapper's height is
     * scripted. Each render pass reads it twice (the height an in-flight ease
     * is at, then the natural height React just committed), so the values are
     * queued and the last one repeats.
     */
    function stubHeights(element: HTMLElement, ...heights: number[]) {
      const queue = [...heights];
      // Inline height in effect at each read: the ease pins its start height
      // and then forces a reflow, so this records what it pinned.
      const inlineHeightAtRead: string[] = [];
      element.getBoundingClientRect = vi.fn(() => {
        inlineHeightAtRead.push(element.style.height);
        const height = queue.length > 1 ? queue.shift()! : queue[0];
        return { height, width: 0, top: 0, bottom: height, left: 0, right: 0 } as DOMRect;
      });
      return inlineHeightAtRead;
    }

    /** The settled height a ResizeObserver would have reported after layout. */
    function reportSettledHeight(height: number) {
      resizeCallbacks.forEach((callback) =>
        callback(
          [{ contentRect: { height } } as unknown as ResizeObserverEntry],
          {} as ResizeObserver
        )
      );
    }

    function blockWrapper(container: HTMLElement) {
      // The observer span carries no style attribute, so the first styled span
      // in document order is the block wrapper.
      return container.querySelector<HTMLElement>('span[style]')!;
    }

    function endHeightTransition(element: HTMLElement) {
      const event = new Event('transitionend', { bubbles: true });
      Object.defineProperty(event, 'propertyName', { value: 'height' });
      element.dispatchEvent(event);
    }

    beforeEach(() => {
      process.env.NEXT_PUBLIC_CIPHER_TRANSITION = 'true';
      resizeCallbacks = [];
      originalResizeObserver = global.ResizeObserver;
      global.ResizeObserver = vi.fn(function (
        this: ResizeObserver,
        callback: ResizeObserverCallback
      ) {
        resizeCallbacks.push(callback);
        return {
          observe: vi.fn(),
          unobserve: vi.fn(),
          disconnect: vi.fn(),
        };
      }) as unknown as typeof ResizeObserver;
    });

    afterEach(() => {
      global.ResizeObserver = originalResizeObserver as typeof ResizeObserver;
    });

    it('should ease the wrapper from the height the reader saw to the new one', () => {
      const { container, rerender } = render(<CipherText block>Alpha</CipherText>);
      const wrapper = blockWrapper(container);

      reportSettledHeight(240);
      const inlineHeightAtRead = stubHeights(wrapper, 180);
      rerender(<CipherText block>Beta</CipherText>);

      // Pinned to the height the reader was looking at, then transitioned away.
      expect(inlineHeightAtRead).toContain('240px');
      expect(wrapper.style.height).toBe('180px');
      expect(wrapper.style.transition).toBe('height 300ms ease-out');
      // A box easing upwards is briefly shorter than its own content.
      expect(wrapper.style.overflowY).toBe('clip');
    });

    it('should hand the wrapper back to natural sizing when the ease ends', () => {
      const { container, rerender } = render(<CipherText block>Alpha</CipherText>);
      const wrapper = blockWrapper(container);

      reportSettledHeight(240);
      stubHeights(wrapper, 180);
      rerender(<CipherText block>Beta</CipherText>);
      endHeightTransition(wrapper);

      expect(wrapper.style.height).toBe('');
      expect(wrapper.style.transition).toBe('');
      expect(wrapper.style.overflowY).toBe('');
    });

    it('should animate the same DOM node the animating branch renders into', () => {
      const { container, rerender } = render(<CipherText block>Alpha</CipherText>);
      const wrapper = blockWrapper(container);

      reportSettledHeight(240);
      stubHeights(wrapper, 180);

      // The switch that matters: new text AND the branch flip to the animating
      // markup, in one commit. Both branches emit the same wrapper element, so
      // React reuses this node and the inline styles the ease just wrote to it
      // survive.
      mockResult.displayChars = ['X', 'Y', 'Z', 'A'];
      mockResult.isAnimating = true;
      rerender(<CipherText block>Beta</CipherText>);

      expect(blockWrapper(container)).toBe(wrapper);
      expect(wrapper.querySelector('.sr-only')).toHaveTextContent('Beta');
      expect(wrapper.style.height).toBe('180px');
    });

    it('should restart cleanly from the rendered height when the text changes mid-ease', () => {
      const { container, rerender } = render(<CipherText block>Alpha</CipherText>);
      const wrapper = blockWrapper(container);

      reportSettledHeight(240);
      stubHeights(wrapper, 180);
      rerender(<CipherText block>Beta</CipherText>);
      expect(wrapper.style.height).toBe('180px');

      // Mid-flight: the box has animated down to 210 and the next translation
      // is taller again. The ease must pick up from 210, not from 180 (where it
      // was heading) and not from 240 (where it started).
      const inlineHeightAtRead = stubHeights(wrapper, 210, 260);
      rerender(<CipherText block>Gamma</CipherText>);

      expect(inlineHeightAtRead).toContain('210px');
      expect(wrapper.style.height).toBe('260px');

      endHeightTransition(wrapper);
      expect(wrapper.style.height).toBe('');
    });

    it('should skip the ease when the reader prefers reduced motion', () => {
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { container, rerender } = render(<CipherText block>Alpha</CipherText>);
      const wrapper = blockWrapper(container);

      reportSettledHeight(240);
      stubHeights(wrapper, 180);
      rerender(<CipherText block>Beta</CipherText>);

      expect(wrapper.style.height).toBe('');
      expect(wrapper.style.transition).toBe('');
    });

    it('should skip the ease when the environment has no ResizeObserver', () => {
      // @ts-expect-error deliberately removing the API the ease depends on
      delete global.ResizeObserver;

      const { container, rerender } = render(<CipherText block>Alpha</CipherText>);
      const wrapper = blockWrapper(container);

      stubHeights(wrapper, 180);
      rerender(<CipherText block>Beta</CipherText>);

      expect(wrapper.style.height).toBe('');
    });

    it('should skip the ease for a sub-pixel height change', () => {
      const { container, rerender } = render(<CipherText block>Alpha</CipherText>);
      const wrapper = blockWrapper(container);

      reportSettledHeight(240);
      stubHeights(wrapper, 240.5);
      rerender(<CipherText block>Beta</CipherText>);

      expect(wrapper.style.height).toBe('');
    });

    it('should not observe or ease anything in inline (non-block) mode', () => {
      const { rerender } = render(<CipherText>Alpha</CipherText>);

      rerender(<CipherText>Beta</CipherText>);

      expect(global.ResizeObserver).not.toHaveBeenCalled();
    });

    it('should stop observing and drop any inline height on unmount', () => {
      const { container, rerender, unmount } = render(<CipherText block>Alpha</CipherText>);
      const wrapper = blockWrapper(container);

      reportSettledHeight(240);
      stubHeights(wrapper, 180);
      rerender(<CipherText block>Beta</CipherText>);

      unmount();

      expect(wrapper.style.height).toBe('');
      expect(wrapper.style.transition).toBe('');
    });
  });
});
