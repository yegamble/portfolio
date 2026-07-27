import { describe, it, expect } from 'vitest';
import sitemap from '@/app/sitemap';

describe('sitemap', () => {
  it('returns an entry for each localized homepage', () => {
    const result = sitemap();
    expect(result).toHaveLength(4);
    expect(result.map((entry) => entry.url)).toEqual([
      'https://yosefgamble.com/en',
      'https://yosefgamble.com/he',
      'https://yosefgamble.com/ru',
      'https://yosefgamble.com/et',
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
    result.slice(1).forEach((entry) => {
      expect(entry.priority).toBe(0.8);
    });
  });
});
