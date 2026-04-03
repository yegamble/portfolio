import { render, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import i18n from '@/lib/i18n';
import I18nProvider from '@/components/I18nProvider';

beforeEach(async () => {
  await i18n.changeLanguage('en');
  document.documentElement.lang = 'en';
  document.documentElement.dir = 'ltr';
  localStorage.clear();
});

describe('I18nProvider', () => {
  it('should render children', () => {
    const { getByText } = render(
      <I18nProvider>
        <div>Test child</div>
      </I18nProvider>
    );
    expect(getByText('Test child')).toBeInTheDocument();
  });

  it('should set html lang attribute to en initially', () => {
    render(
      <I18nProvider>
        <div />
      </I18nProvider>
    );
    expect(document.documentElement.lang).toBe('en');
  });

  it('should set html dir attribute to ltr initially', () => {
    render(
      <I18nProvider>
        <div />
      </I18nProvider>
    );
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('should update html lang to he when language changes', async () => {
    render(
      <I18nProvider>
        <div />
      </I18nProvider>
    );

    await act(async () => {
      await i18n.changeLanguage('he');
    });

    expect(document.documentElement.lang).toBe('he');
  });

  it('should update html dir to rtl when switching to Hebrew', async () => {
    render(
      <I18nProvider>
        <div />
      </I18nProvider>
    );

    await act(async () => {
      await i18n.changeLanguage('he');
    });

    expect(document.documentElement.dir).toBe('rtl');
  });

  it('should revert html dir to ltr when switching back to English', async () => {
    render(
      <I18nProvider>
        <div />
      </I18nProvider>
    );

    await act(async () => {
      await i18n.changeLanguage('he');
    });
    expect(document.documentElement.dir).toBe('rtl');

    await act(async () => {
      await i18n.changeLanguage('en');
    });
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('should set dir to ltr for Russian', async () => {
    render(
      <I18nProvider>
        <div />
      </I18nProvider>
    );

    await act(async () => {
      await i18n.changeLanguage('ru');
    });

    expect(document.documentElement.lang).toBe('ru');
    expect(document.documentElement.dir).toBe('ltr');
  });
});

describe('I18nProvider - localStorage persistence', () => {
  it('should save language to localStorage on language change', async () => {
    render(
      <I18nProvider>
        <div />
      </I18nProvider>
    );

    await act(async () => {
      await i18n.changeLanguage('he');
    });

    expect(localStorage.getItem('language')).toBe('he');
  });

  it('should save Russian language to localStorage', async () => {
    render(
      <I18nProvider>
        <div />
      </I18nProvider>
    );

    await act(async () => {
      await i18n.changeLanguage('ru');
    });

    expect(localStorage.getItem('language')).toBe('ru');
  });

  it('should restore language from localStorage on mount', async () => {
    localStorage.setItem('language', 'ru');

    render(
      <I18nProvider>
        <div />
      </I18nProvider>
    );

    // Give the effect time to run
    await act(async () => {});

    expect(i18n.language).toBe('ru');
  });

  it('should ignore invalid localStorage values', async () => {
    localStorage.setItem('language', 'invalid');

    render(
      <I18nProvider>
        <div />
      </I18nProvider>
    );

    await act(async () => {});

    expect(i18n.language).toBe('en');
  });

  it('should default to English when localStorage is empty', async () => {
    render(
      <I18nProvider>
        <div />
      </I18nProvider>
    );

    await act(async () => {});

    expect(i18n.language).toBe('en');
  });
});
