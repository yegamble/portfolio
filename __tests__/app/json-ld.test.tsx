import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import JsonLd from '@/app/json-ld';

describe('JsonLd', () => {
  function getSchemas(): unknown[] {
    const markup = renderToStaticMarkup(<JsonLd />);
    const matches = [...markup.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/g)];
    return matches.map((m) => JSON.parse(m[1]));
  }

  it('renders two JSON-LD script tags', () => {
    const schemas = getSchemas();
    expect(schemas).toHaveLength(2);
  });

  it('includes a Person schema with required fields', () => {
    const schemas = getSchemas();
    const person = schemas.find((s: any) => s['@type'] === 'Person') as any;
    expect(person).toBeDefined();
    expect(person['@context']).toBe('https://schema.org');
    expect(typeof person.name).toBe('string');
    expect(person.name.length).toBeGreaterThan(0);
    expect(typeof person.jobTitle).toBe('string');
    expect(person.jobTitle.length).toBeGreaterThan(0);
    expect(typeof person.url).toBe('string');
    expect(typeof person.image).toBe('string');
  });

  it('includes sameAs with social profile URLs', () => {
    const schemas = getSchemas();
    const person = schemas.find((s: any) => s['@type'] === 'Person') as any;
    expect(Array.isArray(person.sameAs)).toBe(true);
    expect(person.sameAs.length).toBeGreaterThan(0);
    person.sameAs.forEach((url: string) => {
      expect(url).toMatch(/^https:\/\//);
    });
  });

  it('includes knowsAbout with technologies', () => {
    const schemas = getSchemas();
    const person = schemas.find((s: any) => s['@type'] === 'Person') as any;
    expect(Array.isArray(person.knowsAbout)).toBe(true);
    expect(person.knowsAbout.length).toBeGreaterThan(0);
  });

  it('includes workLocation with City entries', () => {
    const schemas = getSchemas();
    const person = schemas.find((s: any) => s['@type'] === 'Person') as any;
    const locations = person.workLocation as Array<{ '@type': string; name: string }>;
    expect(Array.isArray(locations)).toBe(true);
    expect(locations.length).toBeGreaterThan(0);
    locations.forEach((loc) => {
      expect(loc['@type']).toBe('City');
      expect(typeof loc.name).toBe('string');
    });
  });

  it('includes alumniOf with university entries', () => {
    const schemas = getSchemas();
    const person = schemas.find((s: any) => s['@type'] === 'Person') as any;
    const alumni = person.alumniOf as Array<{ '@type': string; name: string }>;
    expect(Array.isArray(alumni)).toBe(true);
    expect(alumni.length).toBeGreaterThan(0);
    alumni.forEach((org) => {
      expect(org['@type']).toBe('CollegeOrUniversity');
      expect(typeof org.name).toBe('string');
    });
  });

  it('includes a WebSite schema with name and url', () => {
    const schemas = getSchemas();
    const website = schemas.find((s: any) => s['@type'] === 'WebSite') as any;
    expect(website).toBeDefined();
    expect(website['@context']).toBe('https://schema.org');
    expect(typeof website.name).toBe('string');
    expect(website.name.length).toBeGreaterThan(0);
    expect(typeof website.url).toBe('string');
    expect(website.url).toMatch(/^https:\/\//);
  });
});
