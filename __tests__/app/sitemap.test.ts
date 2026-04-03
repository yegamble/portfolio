import { describe, it, expect } from 'vitest';
import sitemap from '@/app/sitemap';

describe('sitemap', () => {
  it('returns an array with the homepage entry', () => {
    const result = sitemap();
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe('https://yosefgamble.com');
  });

  it('sets changeFrequency to monthly', () => {
    const result = sitemap();
    expect(result[0].changeFrequency).toBe('monthly');
  });

  it('sets priority to 1', () => {
    const result = sitemap();
    expect(result[0].priority).toBe(1);
  });
});
