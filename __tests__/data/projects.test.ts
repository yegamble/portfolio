import { describe, it, expect } from 'vitest';
import { projectEntries } from '@/data/projects';

describe('Projects Data validation', () => {
  it('should be an array', () => {
    expect(Array.isArray(projectEntries)).toBe(true);
  });

  it('should have non-empty entries', () => {
    expect(projectEntries.length).toBeGreaterThan(0);
  });

  it('each entry should have a valid structure', () => {
    projectEntries.forEach((entry) => {
      // Validate id
      expect(entry.id, 'Entry id should be defined and non-empty').toBeDefined();
      expect(typeof entry.id).toBe('string');
      expect(entry.id.trim().length).toBeGreaterThan(0);

      // Validate url
      expect(entry.url, 'Entry url should be defined and non-empty').toBeDefined();
      expect(typeof entry.url).toBe('string');
      expect(entry.url.trim().length).toBeGreaterThan(0);

      // Validate technologies
      expect(entry.technologies, 'Entry technologies should be defined and a non-empty array').toBeDefined();
      expect(Array.isArray(entry.technologies)).toBe(true);
      expect(entry.technologies.length).toBeGreaterThan(0);
      entry.technologies.forEach((tech) => {
        expect(typeof tech).toBe('string');
        expect(tech.trim().length).toBeGreaterThan(0);
      });

      // Validate icon
      expect(entry.icon, 'Entry icon should be defined').toBeDefined();
      expect(typeof entry.icon).toBe('string');
    });
  });

  it('should have unique IDs', () => {
    const ids = projectEntries.map((entry) => entry.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
