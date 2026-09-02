import { describe, it, expect } from 'vitest';
import { DEFAULT_LOCALE, LOCALES, type AppLocale } from '@/lib/i18n';

import en from '../../public/locales/en/translation.json';
import he from '../../public/locales/he/translation.json';
import ru from '../../public/locales/ru/translation.json';
import et from '../../public/locales/et/translation.json';

import fixtureEn from '../fixtures/translations/en.json';
import fixtureHe from '../fixtures/translations/he.json';
import fixtureRu from '../fixtures/translations/ru.json';
import fixtureEt from '../fixtures/translations/et.json';

// Unlike the component suites (which run against generic fixtures), these tests
// assert on the production translation files themselves: structural parity
// between locales and content rules that are deliberately locale-specific.
//
// Locales are enumerated from LOCALES, and both maps below are typed
// Record<AppLocale, …>, so a fifth locale fails typecheck here before any test
// runs rather than quietly going uncovered.
//
// The JSON is imported directly and NOT read through getLocaleMessages():
// __tests__/setup.ts registers the fixtures over the production bundles, and
// i18next writes the merged bundle back into the very object that function
// returns. Inside Vitest, getLocaleMessages('he').hero is the FIXTURE hero, so
// using it here would assert the fixtures against themselves.
const PRODUCTION: Record<AppLocale, typeof en | typeof he | typeof ru | typeof et> = {
  en,
  he,
  ru,
  et,
};

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

const OTHER_LOCALES = LOCALES.filter((locale) => locale !== DEFAULT_LOCALE);

describe('production translation files', () => {
  OTHER_LOCALES.forEach((locale) => {
    it(`${locale} has the same key structure as ${DEFAULT_LOCALE}`, () => {
      expect(keyPaths(PRODUCTION[locale]).sort()).toEqual(
        keyPaths(PRODUCTION[DEFAULT_LOCALE]).sort()
      );
    });
  });

  // Google truncates a snippet around 155-160 characters, so anything past that
  // is invisible; ogDescription is separately capped for the social card.
  it('keeps every meta description short enough to survive a search snippet', () => {
    LOCALES.forEach((locale) => {
      const { description } = PRODUCTION[locale].meta;
      expect(
        description.length,
        `${locale} meta.description is ${description.length} characters`
      ).toBeLessThanOrEqual(155);
    });
  });

  // The repo link's accessible name is built as "<repo name> <onGitHub>
  // <opensInNewTab>", so an empty suffix would leave a bare repo name with no
  // hint of where the link goes.
  it('translates both halves of the repo link suffix in every locale', () => {
    LOCALES.forEach((locale) => {
      const { onGitHub, opensInNewTab, pagination } = PRODUCTION[locale].projects;
      expect(onGitHub.trim(), locale).not.toBe('');
      expect(opensInNewTab.trim(), locale).not.toBe('');
      expect(pagination.trim(), locale).not.toBe('');
    });
  });

  // Footer.tsx renders "<builtWith> <tailwind> <and> Inter <font>." and skips
  // the trailing word entirely when footer.font is empty — which is how locales
  // whose word for "font" has to precede the name (it rides on footer.and)
  // avoid "…and Inter font." in a language that cannot say that.
  //
  // The rule, not the wording: a translator may rewrite any of these strings,
  // but the result still has to read as one sentence.
  it('reads the footer attribution as a sentence in every locale', () => {
    LOCALES.forEach((locale) => {
      const { builtWith, tailwind, and, font } = PRODUCTION[locale].footer;
      const sentence = [builtWith, tailwind, and, 'Inter', font].filter(Boolean).join(' ') + '.';

      // The two things the sentence is about are names, so they survive
      // translation (Estonian declines the first: "Tailwind CSS-i").
      expect(sentence, locale).toContain('Tailwind CSS');
      expect(sentence, locale).toContain('Inter');
      expect(sentence, locale).toMatch(/\.$/);
      // Both would mean the filter(Boolean) above stopped covering an empty
      // footer.font, leaving "… Inter ." with a gap before the full stop.
      expect(sentence, locale).not.toMatch(/ {2}/);
      expect(sentence, locale).not.toMatch(/\s\./);
    });
  });

  // Tel Aviv is in the Hebrew hero line and nowhere else: it is there for the
  // readers that line is written for, and the other three locales list the two
  // cities the rest of the site talks about.
  it('lists Tel Aviv in the Hebrew hero location and no other', () => {
    const TEL_AVIV = /תל אביב|tel[\s-]?aviv/i;

    LOCALES.forEach((locale) => {
      const { location } = PRODUCTION[locale].hero;
      expect(location.trim(), `${locale} hero.location is empty`).not.toBe('');
      expect(TEL_AVIV.test(location), `${locale}: ${location}`).toBe(locale === 'he');
    });
  });
});

// The component suites assert against __tests__/fixtures/translations/*.json,
// registered over the production bundles in __tests__/setup.ts, so that a
// résumé edit cannot break them. The cost of that indirection is that a key
// added to production and forgotten in the fixtures is invisible: the
// components read the fixture, so the new key is simply never exercised, and
// `t('some.new.key')` renders its own key name in every test without failing
// one. This is the guard for that.
describe('test fixtures', () => {
  // Record<AppLocale, …> rather than a list: a fifth locale without a fixture
  // fails typecheck here, before any test runs.
  const FIXTURES: Record<AppLocale, unknown> = {
    en: fixtureEn,
    he: fixtureHe,
    ru: fixtureRu,
    et: fixtureEt,
  };

  // The fixtures cover what components render. Page metadata and the two
  // fallback pages read the production bundles directly (see
  // src/app/[locale]/layout.tsx and src/app/global-not-found.tsx), so those
  // three sections are deliberately absent from the fixtures.
  const FIXTURE_EXCLUDED_SECTIONS = ['meta', 'notFound', 'error'];

  const productionKeys = keyPaths(PRODUCTION[DEFAULT_LOCALE])
    .filter((path) => !FIXTURE_EXCLUDED_SECTIONS.includes(path.split(/[.[]/)[0]))
    .sort();

  LOCALES.forEach((locale) => {
    it(`the ${locale} fixture mirrors the production key structure`, () => {
      expect(keyPaths(FIXTURES[locale]).sort()).toEqual(productionKeys);
    });
  });

  it('excludes exactly the sections the fixtures are not expected to carry', () => {
    // Guards the filter above: if a section is renamed in production, this
    // fails rather than quietly widening the exclusion to nothing.
    FIXTURE_EXCLUDED_SECTIONS.forEach((section) => {
      expect(
        PRODUCTION[DEFAULT_LOCALE],
        `production ${DEFAULT_LOCALE} is missing the ${section} section`
      ).toHaveProperty(section);
      expect(
        FIXTURES[DEFAULT_LOCALE],
        `the ${DEFAULT_LOCALE} fixture unexpectedly carries ${section}`
      ).not.toHaveProperty(section);
    });
  });
});
