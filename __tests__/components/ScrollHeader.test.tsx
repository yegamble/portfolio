import { render, screen, within, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ScrollHeader from '@/components/ScrollHeader';

let observerCallback: IntersectionObserverCallback;
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

beforeEach(() => {
  window.IntersectionObserver = vi.fn(function (
    this: IntersectionObserver,
    callback: IntersectionObserverCallback
  ) {
    observerCallback = callback;
    return {
      observe: mockObserve,
      disconnect: mockDisconnect,
      unobserve: vi.fn(),
      root: null,
      rootMargin: '',
      thresholds: [],
      takeRecords: () => [],
    };
  }) as unknown as typeof IntersectionObserver;
});

describe('ScrollHeader', () => {
  describe('Hero section', () => {
    it('should render the large name in the hero area', () => {
      render(<ScrollHeader />);
      const heroName = screen.getByText('Yosef Gamble', {
        selector: 'section p',
      });
      expect(heroName).toBeInTheDocument();
      expect(heroName.className).toContain('text-3xl');
    });

    it('should render the job title in the hero area', () => {
      render(<ScrollHeader />);
      const title = screen.getByText('Senior Full-Stack Engineer', {
        selector: 'section p',
      });
      expect(title).toBeInTheDocument();
    });

    it('should render the h1 tagline', () => {
      render(<ScrollHeader />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent(/nyc based/i);
      expect(heading).toHaveTextContent(/pixel-perfect digital experiences/i);
    });

    it('should render the teal accent bar', () => {
      const { container } = render(<ScrollHeader />);
      const bar = container.querySelector('section .bg-primary');
      expect(bar).toBeInTheDocument();
    });
  });

  describe('Navigation bar', () => {
    it('should render navigation links', () => {
      render(<ScrollHeader />);
      const nav = screen.getByRole('navigation', { name: /main navigation/i });
      const links = within(nav).getAllByRole('link');
      expect(links).toHaveLength(3);
      expect(within(nav).getByText(/about/i)).toBeInTheDocument();
      expect(within(nav).getByText(/experience/i)).toBeInTheDocument();
      expect(within(nav).getByText(/projects/i)).toBeInTheDocument();
    });

    it('should render GitHub social link', () => {
      render(<ScrollHeader />);
      const link = screen.getByRole('link', { name: /github/i });
      expect(link).toHaveAttribute('href', 'https://github.com/yegamble');
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('should render LinkedIn social link', () => {
      render(<ScrollHeader />);
      const link = screen.getByRole('link', { name: /linkedin/i });
      expect(link).toHaveAttribute('href', 'https://linkedin.com/in/yosefgamble');
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('should render email link', () => {
      render(<ScrollHeader />);
      const link = screen.getByRole('link', { name: /^email$/i });
      expect(link).toHaveAttribute('href', 'mailto:yegamble@gmail.com');
    });

    it('should render secure email link', () => {
      render(<ScrollHeader />);
      const link = screen.getByRole('link', { name: /secure email/i });
      expect(link).toHaveAttribute('href', 'mailto:yosef.gamble@protonmail.com');
    });
  });

  describe('Scroll behavior', () => {
    it('should hide nav name when hero is visible', () => {
      render(<ScrollHeader />);
      const header = screen.getByRole('banner');
      const navNameContainer = header.querySelector('[aria-hidden]');
      expect(navNameContainer).toHaveAttribute('aria-hidden', 'true');
    });

    it('should show nav name when scrolled past hero', () => {
      render(<ScrollHeader />);

      act(() => {
        observerCallback(
          [{ isIntersecting: false } as IntersectionObserverEntry],
          {} as IntersectionObserver
        );
      });

      const header = screen.getByRole('banner');
      const navNameContainer = header.querySelector('[aria-hidden]');
      expect(navNameContainer).toHaveAttribute('aria-hidden', 'false');
    });

    it('should make nav name link tabbable only when scrolled', () => {
      render(<ScrollHeader />);
      const navNameLink = screen.getByRole('link', { name: /yosef gamble/i, hidden: true });
      expect(navNameLink).toHaveAttribute('tabIndex', '-1');

      act(() => {
        observerCallback(
          [{ isIntersecting: false } as IntersectionObserverEntry],
          {} as IntersectionObserver
        );
      });

      expect(navNameLink).toHaveAttribute('tabIndex', '0');
    });

    it('should set up IntersectionObserver on mount', () => {
      render(<ScrollHeader />);
      expect(window.IntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        { threshold: 0 }
      );
      expect(mockObserve).toHaveBeenCalled();
    });

    it('should disconnect observer on unmount', () => {
      const { unmount } = render(<ScrollHeader />);
      unmount();
      expect(mockDisconnect).toHaveBeenCalled();
    });
  });
});
