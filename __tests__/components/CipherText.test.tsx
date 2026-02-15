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
  beforeEach(() => {
    mockResult.displayChars = [];
    mockResult.isAnimating = false;
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
      expect(ariaHidden?.querySelectorAll('span').length).toBe(5);
    });

    it('should apply cipher-resolved class to resolved characters', () => {
      mockResult.displayChars = ['H', 'X', 'l', 'l', 'o'];
      mockResult.isAnimating = true;

      const { container } = render(<CipherText>Hello</CipherText>);

      const ariaHidden = container.querySelector('[aria-hidden="true"]');
      const charSpans = ariaHidden?.querySelectorAll('span');

      expect(charSpans?.[0]).toHaveClass('cipher-resolved');
      expect(charSpans?.[1]).not.toHaveClass('cipher-resolved');
      expect(charSpans?.[2]).toHaveClass('cipher-resolved');
    });
  });
});
