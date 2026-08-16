import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateMailto } from '@/lib/contact';

describe('validateMailto', () => {
  it('returns a mailto href for a valid email', () => {
    expect(validateMailto('user@example.com')).toBe('mailto:user@example.com');
  });

  it('trims surrounding whitespace before building the href', () => {
    expect(validateMailto('  user@example.com  ')).toBe('mailto:user@example.com');
  });

  it('returns null for empty or whitespace-only input', () => {
    expect(validateMailto('')).toBeNull();
    expect(validateMailto('   ')).toBeNull();
    expect(validateMailto(undefined)).toBeNull();
  });

  it('returns null for strings that are not valid emails', () => {
    expect(validateMailto('not-an-email')).toBeNull();
    expect(validateMailto('missing@domain')).toBeNull();
    expect(validateMailto('@example.com')).toBeNull();
    expect(validateMailto('spaces in@example.com')).toBeNull();
  });
});

describe('environment variables resolution', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('resolves constants correctly when env vars are valid', async () => {
    process.env.NEXT_PUBLIC_CONTACT_EMAIL = 'primary@example.com';
    process.env.NEXT_PUBLIC_SECURE_CONTACT_EMAIL = 'secure@example.com';
    process.env.NEXT_PUBLIC_PGP_PUBLIC_KEY = '  ssh-rsa AAAAB3NzaC1yc...  ';

    const contact = await import('@/lib/contact');

    expect(contact.primaryEmailHref).toBe('mailto:primary@example.com');
    expect(contact.secureEmailHref).toBe('mailto:secure@example.com');
    expect(contact.pgpPublicKey).toBe('ssh-rsa AAAAB3NzaC1yc...');
  });

  it('resolves constants to null when env vars are empty, undefined, or invalid', async () => {
    process.env.NEXT_PUBLIC_CONTACT_EMAIL = '  ';
    process.env.NEXT_PUBLIC_SECURE_CONTACT_EMAIL = 'invalid-email';
    delete process.env.NEXT_PUBLIC_PGP_PUBLIC_KEY;

    const contact = await import('@/lib/contact');

    expect(contact.primaryEmailHref).toBeNull();
    expect(contact.secureEmailHref).toBeNull();
    expect(contact.pgpPublicKey).toBeNull();
  });
});
