import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CipherText from '@/components/CipherText';
import type { CSSProperties, RefObject } from 'react';

const mockResult = {
  containerRef: { current: null } as RefObject<HTMLSpanElement | null>,
  isAnimating: false,
};
vi.mock('@/hooks/useCipherTransition', () => ({
  useCipherTransition: () => mockResult,
}));

vi.mock('@/lib/cipher-chars', () => ({
  getRandomCipherChar: () => 'X',
  isScramblable: (char: string) => /^\p{L}$/u.test(char),
}));

const mockPretextStyle: { style: CSSProperties } = { style: {} };
vi.mock('@/hooks/usePretextHeight', () => ({
  usePretextHeight: () => ({
    ref: { current: null } as RefObject<HTMLSpanElement | null>,
    style: mockPretextStyle.style,
  }),
}));

describe('CipherText', () => {
  beforeEach(() => {
    mockResult.containerRef = { current: null };
    mockResult.isAnimating = false;
    mockPretextStyle.style = {
      display: 'inline-block',
      width: '100%',
      transition: 'min-height 500ms ease-out',
    };
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_CIPHER_TRANSITION;
  });

  describe('rendering', () => {
    it('should render text as plain string when not animating', () => {
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
      mockResult.isAnimating = true;

      const { container } = render(<CipherText>Hello</CipherText>);

      const srOnly = container.querySelector('.sr-only');
      expect(srOnly).toBeInTheDocument();
      expect(srOnly).toHaveTextContent('Hello');
    });

    it('should render aria-hidden span wrapping animation characters', () => {
      mockResult.isAnimating = true;

      const { container } = render(<CipherText>Hello</CipherText>);

      const ariaHidden = container.querySelector('[aria-hidden="true"]');
      expect(ariaHidden).toBeInTheDocument();
      expect(ariaHidden?.querySelectorAll('.cipher-char-slot').length).toBe(5);
    });

    it('should render initial scrambled characters for letters', () => {
      mockResult.isAnimating = true;

      const { container } = render(<CipherText>Hello</CipherText>);

      const ariaHidden = container.querySelector('[aria-hidden="true"]');
      const charSpans = ariaHidden?.querySelectorAll('.cipher-char');

      // All letter characters should show scrambled 'X' (from mocked getRandomCipherChar)
      charSpans?.forEach((span) => {
        expect(span.textContent).toBe('X');
      });
    });

    it('should preserve non-letter characters without scrambling', () => {
      mockResult.isAnimating = true;

      const { container } = render(<CipherText>Hi 1!</CipherText>);

      const ariaHidden = container.querySelector('[aria-hidden="true"]');
      const charSpans = ariaHidden?.querySelectorAll('.cipher-char');

      // 'H' and 'i' are letters → scrambled to 'X'
      expect(charSpans?.[0].textContent).toBe('X');
      expect(charSpans?.[1].textContent).toBe('X');
      // ' ', '1', '!' are not letters → preserved
      expect(charSpans?.[2].textContent).toBe(' ');
      expect(charSpans?.[3].textContent).toBe('1');
      expect(charSpans?.[4].textContent).toBe('!');
    });

    it('should not have cipher-resolved class on initial animation render', () => {
      mockResult.isAnimating = true;

      const { container } = render(<CipherText>Hello</CipherText>);

      const ariaHidden = container.querySelector('[aria-hidden="true"]');
      const charSpans = ariaHidden?.querySelectorAll('.cipher-char');

      charSpans?.forEach((span) => {
        expect(span).not.toHaveClass('cipher-resolved');
      });
    });

    it('should apply cipher-char base class to all character spans', () => {
      mockResult.isAnimating = true;

      const { container } = render(<CipherText>Hello</CipherText>);

      const ariaHidden = container.querySelector('[aria-hidden="true"]');
      const charSpans = ariaHidden!.querySelectorAll('.cipher-char');

      charSpans.forEach((span) => {
        expect(span).toHaveClass('cipher-char');
      });
    });
  });

  describe('layout stability during animation', () => {
    it('should apply display inline-block to each character slot', () => {
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
      mockResult.isAnimating = true;

      const { container } = render(<CipherText>Hello</CipherText>);

      const ariaHidden = container.querySelector('[aria-hidden="true"]');
      const charSpans = ariaHidden!.querySelectorAll('.cipher-char-slot');

      charSpans.forEach((span) => {
        const charSlot = span as HTMLElement;
        expect(charSlot.style.unicodeBidi).toBe('plaintext');
      });
    });

    it('should reserve layout with one hidden target span per character', () => {
      const text = 'Hello World';
      mockResult.isAnimating = true;

      const { container } = render(<CipherText>{text}</CipherText>);

      const ariaHidden = container.querySelector('[aria-hidden="true"]');
      const layoutSpans = ariaHidden!.querySelectorAll('.cipher-char-layout');

      expect(layoutSpans).toHaveLength(Array.from(text).length);
      expect(layoutSpans[0]).toHaveTextContent('H');
      expect(layoutSpans[5]?.textContent).toBe(' ');
    });

    it('should absolutely position visual characters over the reserved layout', () => {
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

    it('should render one span per character matching text length', () => {
      const text = 'Hello World';
      mockResult.isAnimating = true;

      const { container } = render(<CipherText>{text}</CipherText>);

      const ariaHidden = container.querySelector('[aria-hidden="true"]');
      const charSpans = ariaHidden!.querySelectorAll('.cipher-char-slot');
      expect(charSpans).toHaveLength(Array.from(text).length);
    });

    it('should not render wrapper spans when not animating', () => {
      const { container } = render(<CipherText>Hello</CipherText>);

      expect(
        container.querySelector('[aria-hidden="true"]')
      ).not.toBeInTheDocument();
      expect(container.querySelector('.sr-only')).not.toBeInTheDocument();
    });

    it('should preserve text content in sr-only span during animation', () => {
      const text = 'Test content';
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
      mockResult.isAnimating = true;

      const { container } = render(<CipherText block>Hey</CipherText>);

      // Should have wrapper span containing sr-only and aria-hidden
      const wrapper = container.firstElementChild as HTMLElement;
      expect(wrapper?.tagName).toBe('SPAN');
      expect(wrapper?.style.display).toBe('inline-block');
      expect(wrapper?.querySelector('.sr-only')).toBeInTheDocument();
      expect(
        wrapper?.querySelector('[aria-hidden="true"]')
      ).toBeInTheDocument();
    });

    it('should apply pretext height style to wrapper when block is true', () => {
      mockPretextStyle.style = {
        display: 'inline-block',
        width: '100%',
        minHeight: '120px',
        transition: 'min-height 500ms ease-out',
      };

      const { container } = render(<CipherText block>Tall text</CipherText>);

      const wrapper = container.querySelector('span');
      expect(wrapper?.style.minHeight).toBe('120px');
    });

    it('should keep ref attached when switching between animating and non-animating states', () => {
      const { container, rerender } = render(
        <CipherText block>Text A</CipherText>
      );

      // Non-animating: wrapper span exists
      const wrapperBefore = container.querySelector('span');
      expect(wrapperBefore).toBeInTheDocument();

      // Switch to animating
      mockResult.isAnimating = true;
      rerender(<CipherText block>Text B</CipherText>);

      // Wrapper span still exists
      const wrapperDuring = container.firstElementChild as HTMLElement;
      expect(wrapperDuring?.tagName).toBe('SPAN');

      // Switch back to non-animating
      mockResult.isAnimating = false;
      rerender(<CipherText block>Text B</CipherText>);

      // Wrapper span still exists (ref stays attached)
      const wrapperAfter = container.querySelector('span');
      expect(wrapperAfter).toBeInTheDocument();
    });
  });
});
