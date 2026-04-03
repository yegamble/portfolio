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
    expect(person.name).toBe('Yosef Gamble');
    expect(person.jobTitle).toBe('Senior Software Engineer');
    expect(person.url).toBe('https://yosefgamble.com');
    expect(person.image).toBe('https://yosefgamble.com/images/og-image.jpg');
  });

  it('includes sameAs with GitHub and LinkedIn', () => {
    const schemas = getSchemas();
    const person = schemas.find((s: any) => s['@type'] === 'Person') as any;
    expect(person.sameAs).toContain('https://github.com/yegamble');
    expect(person.sameAs).toContain('https://linkedin.com/in/yosefgamble');
  });

  it('includes knowsAbout with key technologies', () => {
    const schemas = getSchemas();
    const person = schemas.find((s: any) => s['@type'] === 'Person') as any;
    expect(person.knowsAbout).toContain('Go');
    expect(person.knowsAbout).toContain('Golang');
    expect(person.knowsAbout).toContain('TypeScript');
    expect(person.knowsAbout).toContain('Video Streaming');
    expect(person.knowsAbout).toContain('Real Estate Technology');
  });

  it('includes workLocation with New York and Auckland', () => {
    const schemas = getSchemas();
    const person = schemas.find((s: any) => s['@type'] === 'Person') as any;
    const locations = person.workLocation as Array<{ '@type': string; name: string }>;
    expect(locations).toHaveLength(2);
    expect(locations.find((l) => l.name === 'New York')).toBeDefined();
    expect(locations.find((l) => l.name === 'Auckland')).toBeDefined();
  });

  it('includes alumniOf with universities', () => {
    const schemas = getSchemas();
    const person = schemas.find((s: any) => s['@type'] === 'Person') as any;
    const alumni = person.alumniOf as Array<{ '@type': string; name: string }>;
    expect(alumni).toHaveLength(2);
    expect(alumni.find((a) => a.name === 'University of Auckland')).toBeDefined();
    expect(alumni.find((a) => a.name === 'Central Washington University')).toBeDefined();
  });

  it('includes a WebSite schema with name and url', () => {
    const schemas = getSchemas();
    const website = schemas.find((s: any) => s['@type'] === 'WebSite') as any;
    expect(website).toBeDefined();
    expect(website['@context']).toBe('https://schema.org');
    expect(website.name).toBe('Yosef Gamble');
    expect(website.url).toBe('https://yosefgamble.com');
  });
});
