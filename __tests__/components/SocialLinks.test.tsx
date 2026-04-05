import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SocialLinks from '@/components/SocialLinks';

describe('SocialLinks', () => {
  describe('Rendering all links', () => {
    it('should render GitHub link with a github.com href', () => {
      render(<SocialLinks />);
      const link = screen.getByRole('link', { name: /github/i });
      expect(link).toHaveAttribute('href', expect.stringContaining('github.com'));
    });

    it('should render LinkedIn link with a linkedin.com href', () => {
      render(<SocialLinks />);
      const link = screen.getByRole('link', { name: /linkedin/i });
      expect(link).toHaveAttribute('href', expect.stringContaining('linkedin.com'));
    });

    it('should render Email link with a mailto href', () => {
      render(<SocialLinks />);
      const link = screen.getByRole('link', { name: /^email$/i });
      expect(link).toHaveAttribute('href', expect.stringMatching(/^mailto:/));
    });

    it('should render Secure email link with a mailto href', () => {
      render(<SocialLinks />);
      const link = screen.getByRole('link', { name: /secure email/i });
      expect(link).toHaveAttribute('href', expect.stringMatching(/^mailto:/));
    });

    it('should render exactly four social links', () => {
      render(<SocialLinks />);
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(4);
    });
  });

  describe('Accessibility', () => {
    it('should have sr-only labels for all links', () => {
      render(<SocialLinks />);
      expect(screen.getByText('GitHub')).toHaveClass('sr-only');
      expect(screen.getByText('LinkedIn')).toHaveClass('sr-only');
      expect(screen.getByText('Email')).toHaveClass('sr-only');
      expect(screen.getByText('Secure email')).toHaveClass('sr-only');
    });

    it('should render SVG icons with aria-hidden', () => {
      const { container } = render(<SocialLinks />);
      const svgs = container.querySelectorAll('svg');
      expect(svgs).toHaveLength(4);
      svgs.forEach((svg) => {
        expect(svg).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('External link attributes', () => {
    it('should open GitHub in new tab', () => {
      render(<SocialLinks />);
      const link = screen.getByRole('link', { name: /github/i });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noreferrer noopener');
    });

    it('should open LinkedIn in new tab', () => {
      render(<SocialLinks />);
      const link = screen.getByRole('link', { name: /linkedin/i });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noreferrer noopener');
    });

    it('should not add target _blank to email links', () => {
      render(<SocialLinks />);
      const emailLink = screen.getByRole('link', { name: /^email$/i });
      expect(emailLink).not.toHaveAttribute('target');
      const secureEmailLink = screen.getByRole('link', { name: /secure email/i });
      expect(secureEmailLink).not.toHaveAttribute('target');
    });
  });

  describe('Conditional rendering (dynamic import)', () => {
    it('should not render email links when no env vars are set', async () => {
      vi.resetModules();
      const origEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
      const origSecure = process.env.NEXT_PUBLIC_SECURE_CONTACT_EMAIL;
      delete process.env.NEXT_PUBLIC_CONTACT_EMAIL;
      delete process.env.NEXT_PUBLIC_SECURE_CONTACT_EMAIL;

      const { default: SocialLinksDynamic } = await import('@/components/SocialLinks');
      render(<SocialLinksDynamic />);

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2); // GitHub and LinkedIn
      expect(screen.queryByRole('link', { name: /^email$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /secure email/i })).not.toBeInTheDocument();

      process.env.NEXT_PUBLIC_CONTACT_EMAIL = origEmail;
      process.env.NEXT_PUBLIC_SECURE_CONTACT_EMAIL = origSecure;
    });

    it('should not render email links for invalid email', async () => {
      vi.resetModules();
      const origEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
      const origSecure = process.env.NEXT_PUBLIC_SECURE_CONTACT_EMAIL;
      process.env.NEXT_PUBLIC_CONTACT_EMAIL = 'not-an-email';
      process.env.NEXT_PUBLIC_SECURE_CONTACT_EMAIL = 'invalid-secure-email';

      const { default: SocialLinksDynamic } = await import('@/components/SocialLinks');
      render(<SocialLinksDynamic />);

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);
      expect(screen.queryByRole('link', { name: /^email$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /secure email/i })).not.toBeInTheDocument();

      process.env.NEXT_PUBLIC_CONTACT_EMAIL = origEmail;
      process.env.NEXT_PUBLIC_SECURE_CONTACT_EMAIL = origSecure;
    });

    it('should not render email links when email is an empty string', async () => {
      vi.resetModules();
      const origEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
      const origSecure = process.env.NEXT_PUBLIC_SECURE_CONTACT_EMAIL;
      process.env.NEXT_PUBLIC_CONTACT_EMAIL = '';
      process.env.NEXT_PUBLIC_SECURE_CONTACT_EMAIL = '';

      const { default: SocialLinksDynamic } = await import('@/components/SocialLinks');
      render(<SocialLinksDynamic />);

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);
      expect(screen.queryByRole('link', { name: /^email$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /secure email/i })).not.toBeInTheDocument();

      process.env.NEXT_PUBLIC_CONTACT_EMAIL = origEmail;
      process.env.NEXT_PUBLIC_SECURE_CONTACT_EMAIL = origSecure;
    });

    it('should not render email links when email is a string of spaces', async () => {
      vi.resetModules();
      const origEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
      const origSecure = process.env.NEXT_PUBLIC_SECURE_CONTACT_EMAIL;
      process.env.NEXT_PUBLIC_CONTACT_EMAIL = '   ';
      process.env.NEXT_PUBLIC_SECURE_CONTACT_EMAIL = '   ';

      const { default: SocialLinksDynamic } = await import('@/components/SocialLinks');
      render(<SocialLinksDynamic />);

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);
      expect(screen.queryByRole('link', { name: /^email$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /secure email/i })).not.toBeInTheDocument();

      process.env.NEXT_PUBLIC_CONTACT_EMAIL = origEmail;
      process.env.NEXT_PUBLIC_SECURE_CONTACT_EMAIL = origSecure;
    });
  });

  describe('Customization props', () => {
    it('should apply custom iconSize', () => {
      const { container } = render(<SocialLinks iconSize="h-6 w-6" />);
      const svgs = container.querySelectorAll('svg');
      svgs.forEach((svg) => {
        expect(svg).toHaveClass('h-6', 'w-6');
      });
    });

    it('should apply default iconSize of h-5 w-5', () => {
      const { container } = render(<SocialLinks />);
      const svgs = container.querySelectorAll('svg');
      svgs.forEach((svg) => {
        expect(svg).toHaveClass('h-5', 'w-5');
      });
    });

    it('should apply custom gap class', () => {
      const { container } = render(<SocialLinks gap="gap-8" />);
      expect(container.firstElementChild).toHaveClass('gap-8');
    });

    it('should apply default gap-3', () => {
      const { container } = render(<SocialLinks />);
      expect(container.firstElementChild).toHaveClass('gap-3');
    });

    it('should apply custom className', () => {
      const { container } = render(<SocialLinks className="mb-8 justify-center" />);
      expect(container.firstElementChild).toHaveClass('mb-8', 'justify-center');
    });

    it('should apply custom linkClassName', () => {
      render(<SocialLinks linkClassName="custom-link-class" />);
      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveClass('custom-link-class');
      });
    });
  });
});
