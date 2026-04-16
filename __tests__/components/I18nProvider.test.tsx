import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import I18nProvider from '@/components/I18nProvider';

describe('I18nProvider', () => {
  beforeEach(() => {
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
    document.cookie = '';
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

  it('persists the locale in a cookie', async () => {
    render(
      <I18nProvider locale="he">
        <div />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(document.cookie).toContain('locale=he');
    });
  });
});
