import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CipherText from '@/components/CipherText';
import type { CSSProperties, RefObject } from 'react';
import type { CipherLine } from '@/hooks/useCipherTransition';

const mockResult = { lines: [] as CipherLine[], isAnimating: false };
vi.mock('@/hooks/useCipherTransition', () => ({
  useCipherTransition: (text: string) => {
    if (mockResult.lines.length === 0) {
      const chars = Array.from(text);
      return {
        lines: [{ text, chars, targetChars: chars, lineResolved: true }],
        isAnimating: false,
      };
    }
    return mockResult;
  },
}));

const mockPretextStyle: { style: CSSProperties } = { style: {} };
vi.mock('@/hooks/usePretextHeight', () => ({
  usePretextHeight: () => ({
    ref: { current: null } as RefObject<HTMLSpanElement | null>,
    style: mockPretextStyle.style,
  }),
}));

describe('CipherText', () => {
  let observeMock: ReturnType<typeof vi.fn>;
  let disconnectMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockResult.lines = [];
    mockResult.isAnimating = false;
    mockPretextStyle.style = { display: 'inline-block', width: '100%', transition: 'min-height 500ms ease-out' };

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

    global.ResizeObserver = vi.fn(function () {
      return {
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      };
    }) as unknown as typeof ResizeObserver;

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
    it('should render text when not animating', () => {
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
      mockResult.lines = [{
        text: 'Hello',
        chars: ['X', 'Y', 'Z', 'l', 'o'],
        targetChars: ['H', 'e', 'l', 'l', 'o'],
        lineResolved: false,
      }];
      mockResult.isAnimating = true;

      const { container } = render(<CipherText>Hello</CipherText>);

      const srOnly = container.querySelector('.sr-only');
      expect(srOnly).toBeInTheDocument();
      expect(srOnly).toHaveTextContent('Hello');
    });

    it('should render aria-hidden span wrapping animation characters', () => {
      mockResult.lines = [{
        text: 'Hello',
        chars: ['X', 'Y', 'Z', 'l', 'o'],
        targetChars: ['H', 'e', 'l', 'l', 'o'],
        lineResolved: false,
      }];
      mockResult.isAnimating = true;

      const { container } = render(<CipherText>Hello</CipherText>);

      const ariaHidden = container.querySelector('[aria-hidden="true"]');
      expect(ariaHidden).toBeInTheDocument();
    });

    it('should render cipher-line spans for each line', () => {
      mockResult.lines = [{
        text: 'Hello',
        chars: ['X', 'Y', 'Z', 'l', 'o'],
        targetChars: ['H', 'e', 'l', 'l', 'o'],
        lineResolved: false,
      }];
      mockResult.isAnimating = true;

      const { container } = render(<CipherText>Hello</CipherText>);

      const lineSpans = container.querySelectorAll('.cipher-line');
      expect(lineSpans).toHaveLength(1);
    });

    it('should apply cipher-line-resolved class when line is resolved', () => {
      mockResult.lines = [{
        text: 'Hello',
        chars: ['H', 'e', 'l', 'l', 'o'],
        targetChars: ['H', 'e', 'l', 'l', 'o'],
        lineResolved: true,
      }];
      mockResult.isAnimating = true;

      const { container } = render(<CipherText>Hello</CipherText>);

      const lineSpan = container.querySelector('.cipher-line');
      expect(lineSpan).toHaveClass('cipher-line-resolved');
    });

    it('should not apply cipher-line-resolved class when line is not resolved', () => {
      mockResult.lines = [{
        text: 'Hello',
        chars: ['X', 'Y', 'Z', 'l', 'o'],
        targetChars: ['H', 'e', 'l', 'l', 'o'],
        lineResolved: false,
      }];
      mockResult.isAnimating = true;

      const { container } = render(<CipherText>Hello</CipherText>);

      const lineSpan = container.querySelector('.cipher-line');
      expect(lineSpan).not.toHaveClass('cipher-line-resolved');
    });

    it('should apply cipher-resolved class to resolved characters', () => {
      mockResult.lines = [{
        text: 'Hello',
        chars: ['H', 'X', 'l', 'l', 'o'],
        targetChars: ['H', 'e', 'l', 'l', 'o'],
        lineResolved: false,
      }];
      mockResult.isAnimating = true;

      const { container } = render(<CipherText>Hello</CipherText>);

      const charSpans = container.querySelectorAll('.cipher-char');
      expect(charSpans[0]).toHaveClass('cipher-resolved');
      expect(charSpans[1]).not.toHaveClass('cipher-resolved');
      expect(charSpans[2]).toHaveClass('cipher-resolved');
    });

    it('should render multiple lines', () => {
      mockResult.lines = [
        { text: 'Hello', chars: ['H', 'e', 'l', 'l', 'o'], targetChars: ['H', 'e', 'l', 'l', 'o'], lineResolved: true },
        { text: 'World', chars: ['X', 'Y', 'Z', 'l', 'd'], targetChars: ['W', 'o', 'r', 'l', 'd'], lineResolved: false },
      ];
      mockResult.isAnimating = true;

      const { container } = render(<CipherText>Hello World</CipherText>);

      const lineSpans = container.querySelectorAll('.cipher-line');
      expect(lineSpans).toHaveLength(2);
      expect(lineSpans[0]).toHaveClass('cipher-line-resolved');
      expect(lineSpans[1]).not.toHaveClass('cipher-line-resolved');
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

    it('should render wrapper span with animation content when block is true and animating', () => {
      mockResult.lines = [{
        text: 'Hey',
        chars: ['X', 'Y', 'Z'],
        targetChars: ['H', 'e', 'y'],
        lineResolved: false,
      }];
      mockResult.isAnimating = true;

      const { container } = render(<CipherText block>Hey</CipherText>);

      const wrapper = container.firstElementChild as HTMLElement;
      expect(wrapper?.tagName).toBe('SPAN');
      expect(wrapper?.style.display).toBe('inline-block');
      expect(wrapper?.querySelector('.sr-only')).toBeInTheDocument();
      expect(wrapper?.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
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

  describe('ResizeObserver', () => {
    it('should set up ResizeObserver when cipher is enabled', () => {
      process.env.NEXT_PUBLIC_CIPHER_TRANSITION = 'true';

      render(<CipherText>Hello</CipherText>);

      expect(global.ResizeObserver).toHaveBeenCalled();
    });

    it('should disconnect ResizeObserver on unmount', () => {
      process.env.NEXT_PUBLIC_CIPHER_TRANSITION = 'true';
      const disconnectSpy = vi.fn();
      global.ResizeObserver = vi.fn(function () {
        return { observe: vi.fn(), unobserve: vi.fn(), disconnect: disconnectSpy };
      }) as unknown as typeof ResizeObserver;

      const { unmount } = render(<CipherText>Hello</CipherText>);
      unmount();

      expect(disconnectSpy).toHaveBeenCalled();
    });
  });
});
