import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import CipherText from '@/components/CipherText';

describe('CipherText', () => {
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

    it('should not have animation spans when env var is off', () => {
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
    afterEach(() => {
      vi.restoreAllMocks();
      delete process.env.NEXT_PUBLIC_CIPHER_TRANSITION;
    });

    it('should render sr-only span with actual text when animating', () => {
      vi.doMock('@/hooks/useCipherTransition', () => ({
        useCipherTransition: () => ({
          displayChars: ['X', 'Y', 'Z', 'l', 'o'],
          isAnimating: true,
        }),
      }));

      process.env.NEXT_PUBLIC_CIPHER_TRANSITION = 'true';

      const { default: MockedCipherText } =
        require('@/components/CipherText') as typeof import('@/components/CipherText');

      const { container } = render(<MockedCipherText>Hello</MockedCipherText>);

      const srOnly = container.querySelector('.sr-only');
      expect(srOnly).toBeInTheDocument();
      expect(srOnly).toHaveTextContent('Hello');

      vi.doUnmock('@/hooks/useCipherTransition');
    });

    it('should render aria-hidden span wrapping animation characters', () => {
      vi.doMock('@/hooks/useCipherTransition', () => ({
        useCipherTransition: () => ({
          displayChars: ['X', 'Y', 'Z', 'l', 'o'],
          isAnimating: true,
        }),
      }));

      process.env.NEXT_PUBLIC_CIPHER_TRANSITION = 'true';

      const { default: MockedCipherText } =
        require('@/components/CipherText') as typeof import('@/components/CipherText');

      const { container } = render(<MockedCipherText>Hello</MockedCipherText>);

      const ariaHidden = container.querySelector('[aria-hidden="true"]');
      expect(ariaHidden).toBeInTheDocument();
      expect(ariaHidden?.querySelectorAll('span').length).toBe(5);

      vi.doUnmock('@/hooks/useCipherTransition');
    });

    it('should apply cipher-resolved class to resolved characters', () => {
      vi.doMock('@/hooks/useCipherTransition', () => ({
        useCipherTransition: () => ({
          displayChars: ['H', 'X', 'l', 'l', 'o'],
          isAnimating: true,
        }),
      }));

      process.env.NEXT_PUBLIC_CIPHER_TRANSITION = 'true';

      const { default: MockedCipherText } =
        require('@/components/CipherText') as typeof import('@/components/CipherText');

      const { container } = render(<MockedCipherText>Hello</MockedCipherText>);

      const ariaHidden = container.querySelector('[aria-hidden="true"]');
      const charSpans = ariaHidden?.querySelectorAll('span');

      expect(charSpans?.[0]).toHaveClass('cipher-resolved');
      expect(charSpans?.[1]).not.toHaveClass('cipher-resolved');
      expect(charSpans?.[2]).toHaveClass('cipher-resolved');

      vi.doUnmock('@/hooks/useCipherTransition');
    });
  });
});
