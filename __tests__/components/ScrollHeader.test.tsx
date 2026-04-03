import { render, screen, within, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/hooks/usePretextHeight', () => ({
  usePretextHeight: () => ({ ref: { current: null }, style: {} }),
}));

import ScrollHeader from '@/components/ScrollHeader';
import testEn from '../fixtures/translations/en.json';

const TEST_NAME = testEn.hero.name;
const TEST_TITLE = testEn.hero.title;

let observerCallback: IntersectionObserverCallback;
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

beforeEach(() => {
  mockObserve.mockClear();
  mockDisconnect.mockClear();

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
      const heroName = screen.getByText(TEST_NAME, {
        selector: 'section p',
      });
      expect(heroName).toBeInTheDocument();
      expect(heroName.className).toContain('text-3xl');
    });

    it('should render the job title in the hero area', () => {
      render(<ScrollHeader />);
      const title = screen.getByText(TEST_TITLE, {
        selector: 'section p',
      });
      expect(title).toBeInTheDocument();
    });

    it('should render the h1 tagline', () => {
      render(<ScrollHeader />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent(/Senior C\+\+, Rust & Go engineer/i);
      expect(heading).toHaveTextContent(/Tokyo \| Sao Paulo/i);
    });

    it('should mention key skills in tagline', () => {
      render(<ScrollHeader />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent(/C\+\+, Rust & Go/);
      expect(heading).toHaveTextContent(/Unicode processing/i);
      expect(heading).toHaveTextContent(/edge cases/i);
    });

    it('should render the profile picture in the hero area', () => {
      render(<ScrollHeader />);
      const img = screen.getByRole('img', { name: new RegExp(testEn.hero.profileAlt, 'i') });
      expect(img).toBeInTheDocument();
      const heroSection = img.closest('section');
      expect(heroSection).toBeInTheDocument();
    });

    it('should render the profile picture with circular styling', () => {
      render(<ScrollHeader />);
      const img = screen.getByRole('img', { name: new RegExp(testEn.hero.profileAlt, 'i') });
      const circleContainer = img.closest('.rounded-full');
      expect(circleContainer).toBeInTheDocument();
    });

    it('should render the teal accent bar', () => {
      render(<ScrollHeader />);
      const heroName = screen.getByText(TEST_NAME, {
        selector: 'section p',
      });
      const heroSection = heroName.closest('section');
      expect(heroSection).toBeInTheDocument();
      const accentBar = heroSection!.querySelector('[class*="bg-primary"]');
      expect(accentBar).toBeInTheDocument();
    });

    it('should render hero section as a section element', () => {
      render(<ScrollHeader />);
      const heroName = screen.getByText(TEST_NAME, {
        selector: 'section p',
      });
      expect(heroName.closest('section')).toBeInTheDocument();
    });

    it('should render the hero name with bold tracking-tight styling', () => {
      render(<ScrollHeader />);
      const heroName = screen.getByText(TEST_NAME, {
        selector: 'section p',
      });
      expect(heroName).toHaveClass('font-bold', 'tracking-tight');
    });

    it('should render the job title with uppercase tracking-widest styling', () => {
      render(<ScrollHeader />);
      const title = screen.getByText(TEST_TITLE, {
        selector: 'section p',
      });
      expect(title).toHaveClass('uppercase', 'tracking-widest');
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

    it('should render navigation links with correct href anchors', () => {
      render(<ScrollHeader />);
      const nav = screen.getByRole('navigation', { name: /main navigation/i });
      const links = within(nav).getAllByRole('link');
      expect(links[0]).toHaveAttribute('href', '#about');
      expect(links[1]).toHaveAttribute('href', '#experience');
      expect(links[2]).toHaveAttribute('href', '#projects');
    });

    it('should render nav links with uppercase tracking-widest styling', () => {
      render(<ScrollHeader />);
      const nav = screen.getByRole('navigation', { name: /main navigation/i });
      const links = within(nav).getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveClass('uppercase', 'tracking-widest', 'text-xs');
      });
    });

    it('should have a navigation element with aria-label', () => {
      render(<ScrollHeader />);
      const nav = screen.getByRole('navigation', { name: /main navigation/i });
      expect(nav).toBeInTheDocument();
    });
  });

  describe('Social links via SocialLinks component', () => {
    it('should render GitHub social link', () => {
      render(<ScrollHeader />);
      const link = screen.getByRole('link', { name: /github/i });
      expect(link).toHaveAttribute('href', expect.stringContaining('github.com'));
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('should render LinkedIn social link', () => {
      render(<ScrollHeader />);
      const link = screen.getByRole('link', { name: /linkedin/i });
      expect(link).toHaveAttribute('href', expect.stringContaining('linkedin.com'));
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('should render email link', () => {
      render(<ScrollHeader />);
      const link = screen.getByRole('link', { name: /^email$/i });
      expect(link).toHaveAttribute('href', expect.stringMatching(/^mailto:/));
    });

    it('should render secure email link', () => {
      render(<ScrollHeader />);
      const link = screen.getByRole('link', { name: /secure email/i });
      expect(link).toHaveAttribute('href', expect.stringMatching(/^mailto:/));
    });

    it('should render social links with sr-only labels', () => {
      render(<ScrollHeader />);
      expect(screen.getByText('GitHub')).toHaveClass('sr-only');
      expect(screen.getByText('LinkedIn')).toHaveClass('sr-only');
      expect(screen.getByText('Email')).toHaveClass('sr-only');
      expect(screen.getByText('Secure email')).toHaveClass('sr-only');
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

    it('should toggle back to hidden when scrolling back to top', () => {
      render(<ScrollHeader />);

      act(() => {
        observerCallback(
          [{ isIntersecting: false } as IntersectionObserverEntry],
          {} as IntersectionObserver
        );
      });

      const header = screen.getByRole('banner');
      let navNameContainer = header.querySelector('[aria-hidden]');
      expect(navNameContainer).toHaveAttribute('aria-hidden', 'false');

      act(() => {
        observerCallback(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          {} as IntersectionObserver
        );
      });

      navNameContainer = header.querySelector('[aria-hidden]');
      expect(navNameContainer).toHaveAttribute('aria-hidden', 'true');
    });

    it('should make nav name link tabbable only when scrolled', () => {
      render(<ScrollHeader />);
      const header = screen.getByRole('banner');
      const navNameLink = header.querySelector('a[href="/"]') as HTMLAnchorElement;
      expect(navNameLink).toHaveAttribute('tabIndex', '-1');

      act(() => {
        observerCallback(
          [{ isIntersecting: false } as IntersectionObserverEntry],
          {} as IntersectionObserver
        );
      });

      expect(navNameLink).toHaveAttribute('tabIndex', '0');
    });

    it('should apply pointer-events-none when not scrolled', () => {
      render(<ScrollHeader />);
      const header = screen.getByRole('banner');
      const navNameContainer = header.querySelector('[aria-hidden]');
      expect(navNameContainer?.className).toContain('pointer-events-none');
    });

    it('should remove pointer-events-none when scrolled', () => {
      render(<ScrollHeader />);

      act(() => {
        observerCallback(
          [{ isIntersecting: false } as IntersectionObserverEntry],
          {} as IntersectionObserver
        );
      });

      const header = screen.getByRole('banner');
      const navNameContainer = header.querySelector('[aria-hidden]');
      expect(navNameContainer?.className).not.toContain('pointer-events-none');
    });

    it('should apply backdrop-blur when scrolled', () => {
      render(<ScrollHeader />);

      act(() => {
        observerCallback(
          [{ isIntersecting: false } as IntersectionObserverEntry],
          {} as IntersectionObserver
        );
      });

      const header = screen.getByRole('banner');
      expect(header.className).toContain('backdrop-blur-md');
    });

    it('should apply justify-between when scrolled', () => {
      render(<ScrollHeader />);

      act(() => {
        observerCallback(
          [{ isIntersecting: false } as IntersectionObserverEntry],
          {} as IntersectionObserver
        );
      });

      const header = screen.getByRole('banner');
      const innerDiv = header.firstElementChild;
      expect(innerDiv?.className).toContain('justify-between');
    });

    it('should apply justify-center when not scrolled', () => {
      render(<ScrollHeader />);
      const header = screen.getByRole('banner');
      const innerDiv = header.firstElementChild;
      expect(innerDiv?.className).toContain('justify-center');
    });

    it('should set up IntersectionObserver on mount', () => {
      render(<ScrollHeader />);
      expect(window.IntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        { threshold: 0, rootMargin: '-64px 0px 0px 0px' }
      );
      expect(mockObserve).toHaveBeenCalled();
    });

    it('should disconnect observer on unmount', () => {
      const { unmount } = render(<ScrollHeader />);
      unmount();
      expect(mockDisconnect).toHaveBeenCalled();
    });
  });

  describe('Sticky header', () => {
    it('should render a header element', () => {
      render(<ScrollHeader />);
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('should have sticky positioning', () => {
      render(<ScrollHeader />);
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('sticky', 'top-0', 'z-50');
    });

    it('should display the name in the nav area', () => {
      render(<ScrollHeader />);
      const header = screen.getByRole('banner');
      const navNameLink = header.querySelector('a[href="/"]') as HTMLAnchorElement;
      expect(navNameLink).toBeInTheDocument();
      expect(navNameLink).toHaveAttribute('href', '/');
    });

    it('should scroll to top when nav name is clicked', async () => {
      const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
      window.matchMedia = vi.fn().mockReturnValue({ matches: false });

      render(<ScrollHeader />);
      const header = screen.getByRole('banner');
      const navNameLink = header.querySelector('a[href="/"]') as HTMLAnchorElement;

      const user = (await import('@testing-library/user-event')).default.setup();
      await user.click(navNameLink);

      expect(scrollToSpy).toHaveBeenCalledWith({
        top: 0,
        behavior: 'smooth',
      });

      scrollToSpy.mockRestore();
    });

    it('should use instant scroll when prefers-reduced-motion is enabled', async () => {
      const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
      window.matchMedia = vi.fn().mockReturnValue({ matches: true });

      render(<ScrollHeader />);
      const header = screen.getByRole('banner');
      const navNameLink = header.querySelector('a[href="/"]') as HTMLAnchorElement;

      const user = (await import('@testing-library/user-event')).default.setup();
      await user.click(navNameLink);

      expect(scrollToSpy).toHaveBeenCalledWith({
        top: 0,
        behavior: 'auto',
      });

      scrollToSpy.mockRestore();
    });
  });

  describe('Motion preference', () => {
    it('should include motion-reduce duration overrides', () => {
      render(<ScrollHeader />);
      const header = screen.getByRole('banner');
      expect(header.className).toContain('motion-reduce:duration-0');
    });
  });
});
