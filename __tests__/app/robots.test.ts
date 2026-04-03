import { describe, it, expect } from 'vitest';
import robots from '@/app/robots';

describe('robots', () => {
  it('allows all crawlers', () => {
    const result = robots();
    expect(result.rules).toEqual({ userAgent: '*', allow: '/' });
  });

  it('references the sitemap', () => {
    const result = robots();
    expect(result.sitemap).toBe('https://yosefgamble.com/sitemap.xml');
  });
});
