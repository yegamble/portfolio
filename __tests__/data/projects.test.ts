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

      // Validate repos array (replaces single url)
      expect(entry.repos, 'Entry repos should be a non-empty array').toBeDefined();
      expect(Array.isArray(entry.repos)).toBe(true);
      expect(entry.repos.length).toBeGreaterThan(0);
      entry.repos.forEach((repo) => {
        expect(typeof repo.name).toBe('string');
        expect(repo.name.trim().length).toBeGreaterThan(0);
        expect(typeof repo.url).toBe('string');
        expect(repo.url.trim().length).toBeGreaterThan(0);
      });

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
      expect(['folder', 'layers']).toContain(entry.icon);
    });
  });

  it('should have unique IDs', () => {
    const ids = projectEntries.map((entry) => entry.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should have exactly 4 project entries', () => {
    expect(projectEntries).toHaveLength(4);
  });

  it('should contain the 4 expected projects', () => {
    const ids = projectEntries.map((e) => e.id);
    expect(ids).toContain('vidra');
    expect(ids).toContain('aurialis');
    expect(ids).toContain('goimg');
    expect(ids).toContain('iota-token-creator');
  });
});
