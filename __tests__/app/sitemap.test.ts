import { describe, it, expect } from 'vitest';
import sitemap from '@/app/sitemap';

const ALTERNATES = {
  en: 'https://yosefgamble.com/en',
  he: 'https://yosefgamble.com/he',
  ru: 'https://yosefgamble.com/ru',
  et: 'https://yosefgamble.com/et',
  'x-default': 'https://yosefgamble.com/en',
};

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

  it('declares every locale plus x-default as alternates of each entry', () => {
    sitemap().forEach((entry) => {
      expect(entry.alternates?.languages).toEqual(ALTERNATES);
    });
  });

  // Request time would mark the page as modified on every crawl, which tells a
  // crawler nothing; the constant only moves when the content does.
  it('reports a stable build-time lastModified rather than the current time', () => {
    const first = sitemap();
    const second = sitemap();

    expect(first[0].lastModified).toEqual(second[0].lastModified);
    expect(new Date(first[0].lastModified as Date).getTime()).toBeLessThan(Date.now());
    first.forEach((entry) => {
      expect(entry.lastModified).toEqual(first[0].lastModified);
    });
  });
});
