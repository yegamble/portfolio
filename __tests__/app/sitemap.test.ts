import { describe, it, expect } from 'vitest';
import sitemap from '@/app/sitemap';

describe('sitemap', () => {
  it('returns an entry for each localized homepage', () => {
    const result = sitemap();
    expect(result).toHaveLength(3);
    expect(result.map((entry) => entry.url)).toEqual([
      'https://yosefgamble.com/en',
      'https://yosefgamble.com/he',
      'https://yosefgamble.com/ru',
    ]);
  });

  it('sets changeFrequency to monthly', () => {
    const result = sitemap();
    result.forEach((entry) => {
      expect(entry.changeFrequency).toBe('monthly');
    });
  });

  it('prioritizes the English page highest', () => {
    const result = sitemap();
    expect(result[0].priority).toBe(1);
    expect(result[1].priority).toBe(0.8);
    expect(result[2].priority).toBe(0.8);
  });
});
