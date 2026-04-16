import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import i18n from '@/lib/i18n';
import LanguageSelector from '@/components/LanguageSelector';

vi.mock('next/navigation', () => ({
  usePathname: () => '/en/projects',
  useSearchParams: () => new URLSearchParams('tab=featured'),
}));

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('LanguageSelector', () => {
  it('renders a trigger button with the current language initials', () => {
    render(<LanguageSelector />);

    const trigger = screen.getByRole('button', { name: /select language/i });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent('EN');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
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
    expect(links).toHaveLength(3);
  });

  it('marks the active locale link with aria-current', async () => {
    const user = userEvent.setup();
    render(<LanguageSelector />);

    await user.click(screen.getByRole('button', { name: /select language/i }));

    const menu = screen.getByRole('navigation', { name: /select language/i });
    expect(within(menu).getByRole('link', { name: /english/i })).toHaveAttribute('aria-current', 'page');
  });

  it('builds locale-aware hrefs that preserve the current path and query string', async () => {
    const user = userEvent.setup();
    render(<LanguageSelector />);

    await user.click(screen.getByRole('button', { name: /select language/i }));

    const menu = screen.getByRole('navigation', { name: /select language/i });
    expect(within(menu).getByRole('link', { name: /english/i })).toHaveAttribute('href', '/en/projects?tab=featured');
    expect(within(menu).getByRole('link', { name: /עברית/i })).toHaveAttribute('href', '/he/projects?tab=featured');
    expect(within(menu).getByRole('link', { name: /русский/i })).toHaveAttribute('href', '/ru/projects?tab=featured');
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
});
