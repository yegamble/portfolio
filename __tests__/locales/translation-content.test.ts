import { describe, it, expect } from 'vitest';
import en from '../../public/locales/en/translation.json';
import he from '../../public/locales/he/translation.json';
import ru from '../../public/locales/ru/translation.json';
import et from '../../public/locales/et/translation.json';

// Unlike the component suites (which run against generic fixtures), these tests
// assert on the production translation files themselves: structural parity
// between locales and content rules that are deliberately locale-specific.

function keyPaths(value: unknown, prefix = ''): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => keyPaths(item, `${prefix}[${index}]`));
  }
  if (value !== null && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
      keyPaths(child, prefix ? `${prefix}.${key}` : key)
    );
  }
  return [prefix];
}

describe('production translation files', () => {
  (
    [
      ['he', he],
      ['ru', ru],
      ['et', et],
    ] as const
  ).forEach(([code, translation]) => {
    it(`${code} has the same key structure as en`, () => {
      expect(keyPaths(translation).sort()).toEqual(keyPaths(en).sort());
    });
  });

  // Google truncates a snippet around 155-160 characters, so anything past that
  // is invisible; ogDescription is separately capped for the social card.
  it('keeps every meta description short enough to survive a search snippet', () => {
    (
      [
        ['en', en],
        ['he', he],
        ['ru', ru],
        ['et', et],
      ] as const
    ).forEach(([code, translation]) => {
      expect(
        translation.meta.description.length,
        `${code} meta.description is ${translation.meta.description.length} characters`
      ).toBeLessThanOrEqual(155);
    });
  });

  it('keeps the {{name}} interpolation placeholder in every locale', () => {
    [en, he, ru, et].forEach((translation) => {
      expect(translation.projects.viewOnGitHub).toContain('{{name}}');
    });
  });

  // Footer.tsx renders "<builtWith> <tailwind> <and> Inter <font>.". Locales
  // where the word for "font" has to precede the name carry it in footer.and
  // and leave footer.font empty, which the component branches on.
  it('reads the footer attribution as a sentence in every locale', () => {
    const sentences = (
      [
        ['en', en],
        ['he', he],
        ['ru', ru],
        ['et', et],
      ] as const
    ).map(([code, translation]) => {
      const { builtWith, tailwind, and, font } = translation.footer;
      return [code, [builtWith, tailwind, and, 'Inter', font].filter(Boolean).join(' ') + '.'];
    });

    expect(Object.fromEntries(sentences)).toEqual({
      en: 'Built with Tailwind CSS and Inter font.',
      he: 'נבנה עם Tailwind CSS ועם הפונט Inter.',
      ru: 'Создано с помощью Tailwind CSS и шрифта Inter.',
      et: 'Loodud Tailwind CSS-i ja Inter fondiga.',
    });
  });

  it('lists Tel Aviv between New York and Auckland in the Hebrew hero location', () => {
    expect(he.hero.location).toBe('ניו יורק | תל אביב | אוקלנד');
  });

  it('does not list Tel Aviv in the English, Russian, or Estonian hero locations', () => {
    expect(en.hero.location).toBe('NYC | Auckland');
    expect(ru.hero.location).toBe('Нью-Йорк | Окленд');
    expect(et.hero.location).toBe('New York | Auckland');
  });
});
