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

  it('should stay out of the way until it is focused', async () => {
    const user = userEvent.setup();
    render(<SkipLink />);
    const link = screen.getByRole('link', { name: testEn.nav.skipToContent });

    expect(link).toHaveClass('sr-only');
    expect(link.className).toContain('focus:not-sr-only');

    await user.tab();
    expect(link).toHaveFocus();
  });

  it('should pin itself to the start edge so it follows text direction', () => {
    render(<SkipLink />);
    const link = screen.getByRole('link', { name: testEn.nav.skipToContent });
    expect(link.className).toContain('focus:start-4');
    expect(link.className).toContain('focus:top-4');
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
