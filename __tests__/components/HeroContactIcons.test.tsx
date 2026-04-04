import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

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

// env vars CONTACT_EMAIL and SECURE_CONTACT_EMAIL are set in __tests__/setup.ts
// PGP key must be set before HeroContactIcons imports (module-level reads)
vi.hoisted(() => {
  process.env.NEXT_PUBLIC_PGP_PUBLIC_KEY =
    '-----BEGIN PGP PUBLIC KEY BLOCK-----\ntest\n-----END PGP PUBLIC KEY BLOCK-----';
});

import HeroContactIcons from '@/components/HeroContactIcons';

describe('HeroContactIcons', () => {
  describe('with all env vars set (module-level)', () => {
    it('should render email icon with mailto href', () => {
      render(<HeroContactIcons />);
      const link = screen.getByRole('link', { name: /^email$/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'mailto:test@example.com');
    });

    it('should render secure email icon with mailto href', () => {
      render(<HeroContactIcons />);
      const link = screen.getByRole('link', { name: /secure email/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'mailto:secure-test@example.com');
    });

    it('should render PGP key button', () => {
      render(<HeroContactIcons />);
      expect(screen.getByRole('button', { name: /pgp key/i })).toBeInTheDocument();
    });

    it('should open PGP modal when key button is clicked', async () => {
      const user = userEvent.setup();
      render(<HeroContactIcons />);
      const pgpButton = screen.getByRole('button', { name: /pgp key/i });
      await user.click(pgpButton);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have hover transition classes on icons', () => {
      render(<HeroContactIcons />);
      const emailLink = screen.getByRole('link', { name: /^email$/i });
      expect(emailLink.className).toContain('transition-colors');
    });

    it('should apply custom className', () => {
      const { container } = render(<HeroContactIcons className="mt-3" />);
      expect(container.firstChild).toHaveClass('mt-3');
    });

    it('should render all three icons', () => {
      render(<HeroContactIcons />);
      expect(screen.getByRole('link', { name: /^email$/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /secure email/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /pgp key/i })).toBeInTheDocument();
    });

    it('should have sr-only labels via aria-label', () => {
      render(<HeroContactIcons />);
      expect(screen.getByRole('link', { name: /^email$/i })).toHaveAttribute('aria-label');
      expect(screen.getByRole('link', { name: /secure email/i })).toHaveAttribute('aria-label');
      expect(screen.getByRole('button', { name: /pgp key/i })).toHaveAttribute('aria-label');
    });
  });

  describe('conditional rendering (dynamic import)', () => {
    it('should return null when no env vars are set', async () => {
      vi.resetModules();
      const origEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
      const origSecure = process.env.NEXT_PUBLIC_SECURE_CONTACT_EMAIL;
      const origPgp = process.env.NEXT_PUBLIC_PGP_PUBLIC_KEY;
      delete process.env.NEXT_PUBLIC_CONTACT_EMAIL;
      delete process.env.NEXT_PUBLIC_SECURE_CONTACT_EMAIL;
      delete process.env.NEXT_PUBLIC_PGP_PUBLIC_KEY;
      const { default: HCI } = await import('@/components/HeroContactIcons');
      const { container } = render(<HCI />);
      expect(container.firstChild).toBeNull();
      process.env.NEXT_PUBLIC_CONTACT_EMAIL = origEmail;
      process.env.NEXT_PUBLIC_SECURE_CONTACT_EMAIL = origSecure;
      process.env.NEXT_PUBLIC_PGP_PUBLIC_KEY = origPgp;
    });

    it('should not render email icon for invalid email', async () => {
      vi.resetModules();
      const origEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
      const origSecure = process.env.NEXT_PUBLIC_SECURE_CONTACT_EMAIL;
      const origPgp = process.env.NEXT_PUBLIC_PGP_PUBLIC_KEY;
      process.env.NEXT_PUBLIC_CONTACT_EMAIL = 'not-an-email';
      delete process.env.NEXT_PUBLIC_SECURE_CONTACT_EMAIL;
      delete process.env.NEXT_PUBLIC_PGP_PUBLIC_KEY;
      const { default: HCI } = await import('@/components/HeroContactIcons');
      const { container } = render(<HCI />);
      expect(container.firstChild).toBeNull();
      process.env.NEXT_PUBLIC_CONTACT_EMAIL = origEmail;
      process.env.NEXT_PUBLIC_SECURE_CONTACT_EMAIL = origSecure;
      process.env.NEXT_PUBLIC_PGP_PUBLIC_KEY = origPgp;
    });
  });
});
