import { fireEvent, createEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import i18n from '@/lib/i18n';
import LanguageSelector from '@/components/LanguageSelector';
import { pinViewportDuringReflow } from '@/lib/viewport-pin';

vi.mock('next/navigation', () => ({
  usePathname: () => '/en/projects',
}));

// The pin's own behaviour is covered directly in __tests__/lib/viewport-pin.test.ts;
// what matters here is that the selector calls it, and calls it before the
// mutations that reflow the page.
let langAtPinTime: string | null = null;
vi.mock('@/lib/viewport-pin', () => ({
  pinViewportDuringReflow: vi.fn(() => {
    langAtPinTime = document.documentElement.lang;
  }),
}));

beforeEach(async () => {
  vi.mocked(pinViewportDuringReflow).mockClear();
  langAtPinTime = null;
  await i18n.changeLanguage('en');
  window.history.replaceState({}, '', '/en/projects');
  document.documentElement.lang = 'en';
  document.documentElement.dir = 'ltr';
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('LanguageSelector', () => {
  it('renders a trigger button with the current language initials', () => {
    render(<LanguageSelector />);

    const trigger = screen.getByRole('button', { name: /select language/i });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent('EN');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('names the trigger with its own visible text so speech input can target it', () => {
    render(<LanguageSelector />);

    const trigger = screen.getByRole('button', { name: /select language/i });
    // WCAG 2.5.3: the accessible name must contain the visible label ("EN"),
    // which a bare aria-label of "Select language" did not.
    expect(trigger).toHaveAccessibleName(/select language:\s*EN/i);
    expect(trigger).not.toHaveAttribute('aria-label');
  });

  it('does not render the language navigation initially', () => {
    render(<LanguageSelector />);

    expect(screen.queryByRole('navigation', { name: /select language/i })).not.toBeInTheDocument();
  });

  it('opens a plain navigation list instead of a listbox', async () => {
    const user = userEvent.setup();
    render(<LanguageSelector />);

    await user.click(screen.getByRole('button', { name: /select language/i }));

    const menu = screen.getByRole('navigation', { name: /select language/i });
    const links = within(menu).getAllByRole('link');

    expect(menu).toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(links).toHaveLength(4);
  });

  it('marks the active locale link with aria-current', async () => {
    const user = userEvent.setup();
    render(<LanguageSelector />);

    await user.click(screen.getByRole('button', { name: /select language/i }));

    const menu = screen.getByRole('navigation', { name: /select language/i });
    expect(within(menu).getByRole('link', { name: /english/i })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  it('builds locale-aware hrefs from the current pathname alone', async () => {
    const user = userEvent.setup();
    render(<LanguageSelector />);

    await user.click(screen.getByRole('button', { name: /select language/i }));

    const menu = screen.getByRole('navigation', { name: /select language/i });
    expect(within(menu).getByRole('link', { name: /english/i })).toHaveAttribute(
      'href',
      '/en/projects'
    );
    expect(within(menu).getByRole('link', { name: /עברית/i })).toHaveAttribute(
      'href',
      '/he/projects'
    );
    expect(within(menu).getByRole('link', { name: /русский/i })).toHaveAttribute(
      'href',
      '/ru/projects'
    );
    expect(within(menu).getByRole('link', { name: /eesti/i })).toHaveAttribute(
      'href',
      '/et/projects'
    );
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    render(<LanguageSelector />);

    await user.click(screen.getByRole('button', { name: /select language/i }));
    expect(screen.getByRole('navigation', { name: /select language/i })).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('navigation', { name: /select language/i })).not.toBeInTheDocument();
  });

  it('closes when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <button type="button">Outside</button>
        <LanguageSelector />
      </div>
    );

    await user.click(screen.getByRole('button', { name: /select language/i }));
    expect(screen.getByRole('navigation', { name: /select language/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Outside' }));

    expect(screen.queryByRole('navigation', { name: /select language/i })).not.toBeInTheDocument();
  });

  it('updates the current language initials immediately when selecting a different locale', async () => {
    const user = userEvent.setup();
    render(<LanguageSelector />);

    await user.click(screen.getByRole('button', { name: /select language/i }));
    await user.click(screen.getByRole('link', { name: /русский/i }));

    expect(screen.getByRole('button', { name: /выбрать язык/i })).toHaveTextContent('RU');
    expect(screen.queryByRole('navigation', { name: /выбрать язык/i })).not.toBeInTheDocument();
  });

  it('flips the document language and direction synchronously on selection', async () => {
    const user = userEvent.setup();
    render(<LanguageSelector />);

    await user.click(screen.getByRole('button', { name: /select language/i }));
    await user.click(screen.getByRole('link', { name: /עברית/i }));

    expect(document.documentElement.lang).toBe('he');
    expect(document.documentElement.dir).toBe('rtl');
  });

  it('replaces the URL with the localized pathname, preserving query and hash', async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, '', '/en/projects?tab=featured#contact');
    const replaceState = vi.spyOn(window.history, 'replaceState');

    render(<LanguageSelector />);

    await user.click(screen.getByRole('button', { name: /select language/i }));
    await user.click(screen.getByRole('link', { name: /русский/i }));

    expect(replaceState).toHaveBeenCalled();
    expect(replaceState.mock.calls[0][2]).toBe('/ru/projects?tab=featured#contact');
  });

  it('announces the new language in a polite live region', async () => {
    const user = userEvent.setup();
    render(<LanguageSelector />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toBeEmptyDOMElement();

    await user.click(screen.getByRole('button', { name: /select language/i }));
    await user.click(screen.getByRole('link', { name: /eesti/i }));

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Praegune keel: Eesti')
    );
  });

  it('lets modifier and middle clicks fall through to the browser', async () => {
    const user = userEvent.setup();
    render(<LanguageSelector />);

    await user.click(screen.getByRole('button', { name: /select language/i }));
    const link = screen.getByRole('link', { name: /русский/i });

    // jsdom logs "Not implemented: navigation to another Document" for these two
    // clicks — that notice is the proof the default action was left intact.
    const modifierClick = createEvent.click(link, { ctrlKey: true });
    fireEvent(link, modifierClick);
    expect(modifierClick.defaultPrevented).toBe(false);

    const middleClick = createEvent.click(link, { button: 1 });
    fireEvent(link, middleClick);
    expect(middleClick.defaultPrevented).toBe(false);

    expect(i18n.language).toBe('en');
  });

  describe('keyboard support', () => {
    it('moves focus into the menu when it is opened from the keyboard', async () => {
      const user = userEvent.setup();
      render(<LanguageSelector />);

      screen.getByRole('button', { name: /select language/i }).focus();
      await user.keyboard('{ArrowDown}');

      expect(screen.getByRole('link', { name: /english/i })).toHaveFocus();
    });

    it('moves focus between items with the arrow keys, wrapping at the ends', async () => {
      const user = userEvent.setup();
      render(<LanguageSelector />);

      screen.getByRole('button', { name: /select language/i }).focus();
      await user.keyboard('{ArrowDown}');

      await user.keyboard('{ArrowDown}');
      expect(screen.getByRole('link', { name: /עברית/i })).toHaveFocus();

      await user.keyboard('{ArrowUp}');
      expect(screen.getByRole('link', { name: /english/i })).toHaveFocus();

      await user.keyboard('{ArrowUp}');
      expect(screen.getByRole('link', { name: /eesti/i })).toHaveFocus();
    });

    it('jumps to the first and last item with Home and End', async () => {
      const user = userEvent.setup();
      render(<LanguageSelector />);

      screen.getByRole('button', { name: /select language/i }).focus();
      await user.keyboard('{ArrowDown}');

      await user.keyboard('{End}');
      expect(screen.getByRole('link', { name: /eesti/i })).toHaveFocus();

      await user.keyboard('{Home}');
      expect(screen.getByRole('link', { name: /english/i })).toHaveFocus();
    });

    it('returns focus to the trigger after selecting with the keyboard', async () => {
      const user = userEvent.setup();
      render(<LanguageSelector />);

      const trigger = screen.getByRole('button', { name: /select language/i });
      trigger.focus();
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');
      expect(screen.getByRole('link', { name: /עברית/i })).toHaveFocus();

      await user.keyboard('{Enter}');

      // The menu unmounts the focused link; without an explicit hand-back,
      // focus lands on <body> and keyboard users lose their place.
      expect(screen.getByRole('button', { name: /בחירת שפה/i })).toHaveFocus();
    });

    it('returns focus to the trigger on Escape', async () => {
      const user = userEvent.setup();
      render(<LanguageSelector />);

      const trigger = screen.getByRole('button', { name: /select language/i });
      await user.click(trigger);
      await user.keyboard('{Escape}');

      expect(trigger).toHaveFocus();
    });
  });

  describe('viewport pinning', () => {
    it('pins the viewport before it mutates anything, and only for a real switch', async () => {
      const user = userEvent.setup();
      render(<LanguageSelector />);

      await user.click(screen.getByRole('button', { name: /select language/i }));
      await user.click(screen.getByRole('link', { name: /русский/i }));

      // The pin samples its anchor synchronously (see viewport-pin.test.ts), so
      // it has to run before the lang flip — that flip alone reflows the page,
      // because globals.css keys the font stack off html:lang(he).
      expect(pinViewportDuringReflow).toHaveBeenCalledTimes(1);
      expect(langAtPinTime).toBe('en');
    });

    it('does not pin when the chosen language is already current', async () => {
      const user = userEvent.setup();
      render(<LanguageSelector />);

      await user.click(screen.getByRole('button', { name: /select language/i }));
      await user.click(screen.getByRole('link', { name: /english/i }));

      expect(pinViewportDuringReflow).not.toHaveBeenCalled();
    });
  });
});
