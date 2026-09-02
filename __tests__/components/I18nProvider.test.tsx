import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { useTranslation } from 'react-i18next';
import I18nProvider from '@/components/I18nProvider';
import { LOCALE_COOKIE_NAME } from '@/lib/i18n';

/** Stands in for the language selector: changes language from inside the provider. */
function LanguageSwitcher({ to }: { to: string }) {
  const { i18n } = useTranslation();

  return (
    <button type="button" onClick={() => void i18n.changeLanguage(to)}>
      switch
    </button>
  );
}

function clearLocaleCookie() {
  document.cookie = `${LOCALE_COOKIE_NAME}=; Path=/; Max-Age=0`;
}

describe('I18nProvider', () => {
  beforeEach(() => {
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
    clearLocaleCookie();
  });

  it('renders children', () => {
    const { getByText } = render(
      <I18nProvider locale="en">
        <div>Test child</div>
      </I18nProvider>
    );

    expect(getByText('Test child')).toBeInTheDocument();
  });

  it('applies html lang and dir for English', async () => {
    render(
      <I18nProvider locale="en">
        <div />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(document.documentElement.lang).toBe('en');
      expect(document.documentElement.dir).toBe('ltr');
    });
  });

  it('applies html lang and dir for Hebrew', async () => {
    render(
      <I18nProvider locale="he">
        <div />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(document.documentElement.lang).toBe('he');
      expect(document.documentElement.dir).toBe('rtl');
    });
  });

  it('applies html lang and dir for Russian', async () => {
    render(
      <I18nProvider locale="ru">
        <div />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(document.documentElement.lang).toBe('ru');
      expect(document.documentElement.dir).toBe('ltr');
    });
  });

  it('applies html lang and dir for Estonian', async () => {
    render(
      <I18nProvider locale="et">
        <div />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(document.documentElement.lang).toBe('et');
      expect(document.documentElement.dir).toBe('ltr');
    });
  });

  it('does not write the locale cookie just because a locale route rendered', async () => {
    // Following an /en link from a CV must not overwrite a visitor's stored
    // choice, so only an explicit language change persists anything.
    render(
      <I18nProvider locale="he">
        <div />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(document.documentElement.lang).toBe('he');
    });
    expect(document.cookie).not.toContain(`${LOCALE_COOKIE_NAME}=`);
  });

  it('persists the locale in a cookie when the visitor changes language', async () => {
    const user = userEvent.setup();

    render(
      <I18nProvider locale="en">
        <LanguageSwitcher to="ru" />
      </I18nProvider>
    );

    await user.click(screen.getByRole('button', { name: 'switch' }));

    await waitFor(() => {
      expect(document.cookie).toContain(`${LOCALE_COOKIE_NAME}=ru`);
    });
    expect(document.documentElement.lang).toBe('ru');
  });
});
