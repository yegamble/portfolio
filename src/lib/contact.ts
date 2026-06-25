/**
 * Shared contact-channel helpers.
 *
 * The email hrefs and PGP key are derived once at module load from public env
 * vars so both HeroContactIcons and SocialLinks resolve them identically (no
 * drift between two copies of the same validation logic).
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns a `mailto:` href for a valid email, or null for empty/invalid input. */
export function validateMailto(email: string | undefined): string | null {
  const trimmed = email?.trim();
  if (!trimmed) return null;
  return EMAIL_PATTERN.test(trimmed) ? `mailto:${trimmed}` : null;
}

export const primaryEmailHref = validateMailto(process.env.NEXT_PUBLIC_CONTACT_EMAIL);
export const secureEmailHref = validateMailto(process.env.NEXT_PUBLIC_SECURE_CONTACT_EMAIL);
export const pgpPublicKey = process.env.NEXT_PUBLIC_PGP_PUBLIC_KEY?.trim() || null;
