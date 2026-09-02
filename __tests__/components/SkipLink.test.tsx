import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, afterEach } from 'vitest';
import i18n from '@/lib/i18n';
import SkipLink from '@/components/SkipLink';

import testEn from '../fixtures/translations/en.json';
import testHe from '../fixtures/translations/he.json';
import testRu from '../fixtures/translations/ru.json';
import testEt from '../fixtures/translations/et.json';

describe('SkipLink', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('should render a link that targets the main landmark', () => {
    render(<SkipLink />);
    const link = screen.getByRole('link', { name: testEn.nav.skipToContent });
    expect(link).toHaveAttribute('href', '#main');
  });

  // What it looks like once focused — that it leaves the 1px sr-only box and
  // lands above the sticky header — is asserted from real computed styles in
  // cypress/e2e/portfolio.cy.ts. Here we only care that it is reachable.
  it('should be the first thing a Tab press reaches', async () => {
    const user = userEvent.setup();
    render(<SkipLink />);

    await user.tab();
    expect(screen.getByRole('link', { name: testEn.nav.skipToContent })).toHaveFocus();
  });

  it.each([
    ['he', testHe.nav.skipToContent],
    ['ru', testRu.nav.skipToContent],
    ['et', testEt.nav.skipToContent],
  ])('should translate its label into %s', async (locale, label) => {
    await i18n.changeLanguage(locale);
    render(<SkipLink />);
    expect(screen.getByRole('link', { name: label })).toHaveAttribute('href', '#main');
  });
});
