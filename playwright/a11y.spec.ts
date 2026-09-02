import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Automated accessibility checks over the two locales that differ structurally:
 * `en` (left-to-right, Latin) and `he` (right-to-left, Hebrew), each at a
 * desktop and a phone width, because the header collapses its nav below `sm`
 * and the project grid becomes a swipe carousel.
 *
 * axe finds roughly a third of WCAG issues — it cannot tell whether a label
 * describes its control or whether a focus order makes sense — so this is a
 * floor, not a certificate. What it does catch is the class of regression that
 * arrives silently: a heading level skipped, contrast lost to a token change,
 * a control that stops being reachable. The rest stays with the unit suites'
 * role/name assertions and the keyboard specs in cypress/e2e/portfolio.cy.ts.
 *
 * `label-content-name-mismatch` (WCAG 2.5.3, the rule behind the brand link's
 * missing aria-label) is marked experimental by axe and therefore excluded from
 * a tag-based run like this one; __tests__/components/ScrollHeader.test.tsx
 * asserts that case directly.
 *
 * One consequence of asserting zero violations against a tag list rather than a
 * fixed rule set: a minor @axe-core/playwright bump can add a rule and turn a
 * page that passed yesterday into a failed deploy. That is the trade this file
 * makes deliberately — a new rule finding something is a real finding — and the
 * lockfile is what keeps it from happening unannounced: the version only moves
 * through a Dependabot PR that has to go green first.
 */

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const LOCALES = ['en', 'he'] as const;

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'phone', width: 390, height: 844 },
] as const;

async function waitForPageReady(page: Page, path: string) {
  await page.goto(path);
  // No networkidle wait: document.fonts.ready already covers the requests that
  // can change what axe measures (a face still swapping changes a text box's
  // size, and contrast is sampled from what is painted), and networkidle on top
  // of it only adds half a second of quiet-period per page.
  await page.evaluate(async () => {
    if ('fonts' in document) await document.fonts.ready;
  });
}

for (const locale of LOCALES) {
  for (const viewport of VIEWPORTS) {
    test(`/${locale} has no WCAG A/AA violations at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await waitForPageReady(page, `/${locale}`);

      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

      // An empty violation list also describes a run that never happened — a
      // failed injection, a page that did not load, a tag list that matches no
      // rule. Passing checks prove axe actually looked.
      expect(results.passes.length, 'axe evaluated no rules on this page').toBeGreaterThan(0);

      // The whole violation is the message: an id alone ("color-contrast") does
      // not say which node, which colours, or which rule descendant failed.
      expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
    });
  }
}
