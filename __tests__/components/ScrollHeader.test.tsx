import { render, screen, within, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('openpgp', () => ({
  readKey: vi.fn(() =>
    Promise.resolve({
      getFingerprint: () => 'abcd1234',
      getUserIDs: () => ['Test <test@example.com>'],
      getAlgorithmInfo: () => ({ algorithm: 'rsa', bits: 2048 }),
      getCreationTime: () => new Date('2016-01-01'),
      getKeyID: () => ({ toHex: () => 'deadbeef' }),
    })
  ),
}));

import ScrollHeader from '@/components/ScrollHeader';
import { stubIntersectionObserver, type IntersectionObserverStub } from '../helpers/observers';
import testEn from '../fixtures/translations/en.json';

const TEST_NAME = testEn.hero.name;
const TEST_TITLE = testEn.hero.title;

let sentinel: IntersectionObserverStub;

/** Report the hero sentinel as on- or off-screen, i.e. scroll past it or back. */
function scrollPastHero(isPastHero: boolean) {
  act(() => {
    sentinel.emit(!isPastHero);
  });
}

beforeEach(() => {
  sentinel = stubIntersectionObserver();
});

describe('ScrollHeader', () => {
  describe('Hero section', () => {
    it('should render the large name in the hero area', () => {
      render(<ScrollHeader />);
      const heroName = screen.getByText(TEST_NAME, {
        selector: 'section p',
      });
      expect(heroName).toBeInTheDocument();
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
      const img = screen.getByRole('img', {
        name: new RegExp(testEn.hero.profileAlt, 'i'),
      });
      expect(img).toBeInTheDocument();
      const heroSection = img.closest('section');
      expect(heroSection).toBeInTheDocument();
    });

    it('should render hero section as a section element', () => {
      render(<ScrollHeader />);
      const heroName = screen.getByText(TEST_NAME, {
        selector: 'section p',
      });
      expect(heroName.closest('section')).toBeInTheDocument();
    });
  });

  describe('Hero contact icons', () => {
    it('should render contact icons in the hero section', () => {
      render(<ScrollHeader />);
      const heroSection = screen.getByText(TEST_NAME, { selector: 'section p' }).closest('section');
      expect(heroSection).toBeInTheDocument();
      const emailLink = within(heroSection!).getByRole('link', {
        name: /^email$/i,
      });
      expect(emailLink).toBeInTheDocument();
    });

    it('should render PGP key button in the hero section', () => {
      render(<ScrollHeader />);
      const heroSection = screen.getByText(TEST_NAME, { selector: 'section p' }).closest('section');
      const pgpButton = within(heroSection!).getByRole('button', {
        name: /pgp key/i,
      });
      expect(pgpButton).toBeInTheDocument();
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
      const header = screen.getByRole('banner');
      const link = within(header).getByRole('link', { name: /^email$/i });
      expect(link).toHaveAttribute('href', expect.stringMatching(/^mailto:/));
    });

    it('should render secure email link', () => {
      render(<ScrollHeader />);
      const header = screen.getByRole('banner');
      const link = within(header).getByRole('link', { name: /secure email/i });
      expect(link).toHaveAttribute('href', expect.stringMatching(/^mailto:/));
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

      scrollPastHero(true);

      const header = screen.getByRole('banner');
      const navNameContainer = header.querySelector('[aria-hidden]');
      expect(navNameContainer).toHaveAttribute('aria-hidden', 'false');
    });

    it('should toggle back to hidden when scrolling back to top', () => {
      render(<ScrollHeader />);

      scrollPastHero(true);

      const header = screen.getByRole('banner');
      let navNameContainer = header.querySelector('[aria-hidden]');
      expect(navNameContainer).toHaveAttribute('aria-hidden', 'false');

      scrollPastHero(false);

      navNameContainer = header.querySelector('[aria-hidden]');
      expect(navNameContainer).toHaveAttribute('aria-hidden', 'true');
    });

    it('should make nav name link tabbable only when scrolled', () => {
      render(<ScrollHeader />);
      const header = screen.getByRole('banner');
      const navNameLink = header.querySelector('a[href="/en"]') as HTMLAnchorElement;
      expect(navNameLink).toHaveAttribute('tabIndex', '-1');

      scrollPastHero(true);

      expect(navNameLink).toHaveAttribute('tabIndex', '0');
    });

    it('should keep the collapsed brand link out of the accessibility tree', () => {
      render(<ScrollHeader />);
      const header = screen.getByRole('banner');
      const brandLink = header.querySelector('a[href="/en"]') as HTMLAnchorElement;

      // aria-hidden on the inner block left the link itself exposed, so a screen
      // reader announced a "Yosef Gamble" link that is not on screen.
      expect(brandLink).toHaveAttribute('aria-hidden', 'true');
      expect(brandLink).toHaveAttribute('inert');
      expect(
        within(header).queryByRole('link', { name: new RegExp(TEST_NAME, 'i') })
      ).not.toBeInTheDocument();
    });

    it('should expose the brand link named by its visible text once scrolled', () => {
      render(<ScrollHeader />);

      scrollPastHero(true);

      const header = screen.getByRole('banner');
      const brandLink = within(header).getByRole('link', {
        name: new RegExp(TEST_NAME, 'i'),
      });
      expect(brandLink).toHaveAttribute('href', '/en');
      expect(brandLink).toHaveAttribute('aria-hidden', 'false');
      expect(brandLink).not.toHaveAttribute('inert');
      // The visible name is the accessible name (WCAG 2.5.3), not an aria-label.
      expect(brandLink).not.toHaveAttribute('aria-label');
    });

    it('should set up IntersectionObserver on mount', () => {
      render(<ScrollHeader />);
      expect(sentinel.ctor).toHaveBeenCalledWith(expect.any(Function), {
        threshold: 0,
        rootMargin: '-64px 0px 0px 0px',
      });
      expect(sentinel.observe).toHaveBeenCalled();
    });

    it('should disconnect observer on unmount', () => {
      const { unmount } = render(<ScrollHeader />);
      unmount();
      expect(sentinel.disconnect).toHaveBeenCalled();
    });
  });

  describe('Sticky header', () => {
    it('should render a header element', () => {
      render(<ScrollHeader />);
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('should display the name in the nav area', () => {
      render(<ScrollHeader />);
      const header = screen.getByRole('banner');
      const navNameLink = header.querySelector('a[href="/en"]') as HTMLAnchorElement;
      expect(navNameLink).toBeInTheDocument();
      expect(navNameLink).toHaveAttribute('href', '/en');
    });

    it('should scroll to top when nav name is clicked', async () => {
      const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
      window.matchMedia = vi.fn().mockReturnValue({ matches: false });

      render(<ScrollHeader />);
      const header = screen.getByRole('banner');
      const navNameLink = header.querySelector('a[href="/en"]') as HTMLAnchorElement;

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
      const navNameLink = header.querySelector('a[href="/en"]') as HTMLAnchorElement;

      const user = (await import('@testing-library/user-event')).default.setup();
      await user.click(navNameLink);

      expect(scrollToSpy).toHaveBeenCalledWith({
        top: 0,
        behavior: 'auto',
      });

      scrollToSpy.mockRestore();
    });
  });
});
