import { describe, it, expect } from 'vitest';
import { experienceEntries } from '@/data/experience';

describe('Experience Data validation', () => {
  it('should be an array', () => {
    expect(Array.isArray(experienceEntries)).toBe(true);
  });

  it('should have non-empty entries', () => {
    expect(experienceEntries.length).toBeGreaterThan(0);
  });

  it('each entry should have a valid structure', () => {
    experienceEntries.forEach((entry) => {
      // Validate id
      expect(entry.id, 'Entry id should be defined and non-empty').toBeDefined();
      expect(typeof entry.id).toBe('string');
      expect(entry.id.trim().length).toBeGreaterThan(0);

      // Validate companyUrl
      expect(entry.companyUrl, 'Entry companyUrl should be defined and non-empty').toBeDefined();
      expect(typeof entry.companyUrl).toBe('string');
      expect(entry.companyUrl.trim().length).toBeGreaterThan(0);

      // Validate technologies
      expect(entry.technologies, 'Entry technologies should be defined and a non-empty array').toBeDefined();
      expect(Array.isArray(entry.technologies)).toBe(true);
      expect(entry.technologies.length).toBeGreaterThan(0);
      entry.technologies.forEach((tech) => {
        expect(typeof tech).toBe('string');
        expect(tech.trim().length).toBeGreaterThan(0);
      });
    });
  });

  it('should have unique IDs', () => {
    const ids = experienceEntries.map((entry) => entry.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
