import { describe, it, expect } from 'vitest';
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
