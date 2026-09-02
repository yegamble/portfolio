import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import JsonLd from '@/app/json-ld';
import type { AppLocale } from '@/lib/i18n';

describe('JsonLd', () => {
  function getSchemas(locale: AppLocale = 'en'): unknown[] {
    const markup = renderToStaticMarkup(<JsonLd locale={locale} />);
    const matches = [
      ...markup.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/g),
    ];
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

  it('points Person.image at the portrait rather than the Open Graph banner', () => {
    const schemas = getSchemas();
    const person = schemas.find((s: any) => s['@type'] === 'Person') as any;
    expect(person.image).toBe('https://yosefgamble.com/images/profile.jpg');
    expect(person.image).not.toContain('og-image');
  });

  it('points Person.mainEntityOfPage at the localized route', () => {
    const person = getSchemas('he').find((s: any) => s['@type'] === 'Person') as any;
    expect(person.mainEntityOfPage).toBe('https://yosefgamble.com/he');
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
    const locations = person.workLocation as Array<{
      '@type': string;
      name: string;
    }>;
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

  it('declares every supported language on the WebSite schema', () => {
    const schemas = getSchemas();
    const website = schemas.find((s: any) => s['@type'] === 'WebSite') as any;
    expect(website.inLanguage).toEqual(['en', 'he', 'ru', 'et']);
  });

  // Every value in the payload is a literal today, so the locale prop is the
  // only way a `<` reaches it — and it stands in here for the first translated
  // string anyone drops into a schema. Unescaped, the `</script>` inside it ends
  // the block early and the rest of the payload is parsed as markup.
  it('escapes < so no value can close the script block early', () => {
    const hostile = '</script><script>alert(1)</script>' as AppLocale;
    const markup = renderToStaticMarkup(<JsonLd locale={hostile} />);

    expect(markup).not.toContain('<script>alert(1)');
    expect(markup).toContain('\\u003c');
    // The two blocks this component renders, and no third one opened by a value.
    expect(markup.match(/<script/g)).toHaveLength(2);
    expect(markup.match(/<\/script>/g)).toHaveLength(2);
  });

  it('escapes losslessly, so a crawler still reads the original value', () => {
    const hostile = '</script>' as AppLocale;
    const person = getSchemas(hostile).find((s: any) => s['@type'] === 'Person') as any;
    expect(person.mainEntityOfPage).toBe('https://yosefgamble.com/</script>');
  });
});
