import { render, screen, within, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import i18n from '@/lib/i18n';
import LanguageSelector from '@/components/LanguageSelector';

beforeEach(async () => {
  await i18n.changeLanguage('en');
  process.env.NEXT_PUBLIC_I18N_ENABLED = 'true';
});

afterEach(() => {
  process.env.NEXT_PUBLIC_I18N_ENABLED = 'true';
});

describe('LanguageSelector', () => {
  describe('Rendering', () => {
    it('should render a trigger button', () => {
      render(<LanguageSelector />);
      expect(screen.getByRole('button', { name: /select language/i })).toBeInTheDocument();
    });

    it('should show current language initials in trigger', () => {
      render(<LanguageSelector />);
      const trigger = screen.getByRole('button', { name: /select language/i });
      expect(trigger).toHaveTextContent('EN');
    });

    it('should not show dropdown panel initially', () => {
      render(<LanguageSelector />);
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('should have aria-expanded=false initially', () => {
      render(<LanguageSelector />);
      expect(screen.getByRole('button', { name: /select language/i })).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Opening and closing', () => {
    it('should open dropdown on click', async () => {
      const user = userEvent.setup();
      render(<LanguageSelector />);
      await user.click(screen.getByRole('button', { name: /select language/i }));
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('should set aria-expanded=true when open', async () => {
      const user = userEvent.setup();
      render(<LanguageSelector />);
      await user.click(screen.getByRole('button', { name: /select language/i }));
      expect(screen.getByRole('button', { name: /select language/i })).toHaveAttribute('aria-expanded', 'true');
    });

    it('should show three language options when open', async () => {
      const user = userEvent.setup();
      render(<LanguageSelector />);
      await user.click(screen.getByRole('button', { name: /select language/i }));
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(3);
    });

    it('should close on Escape key', async () => {
      const user = userEvent.setup();
      render(<LanguageSelector />);
      await user.click(screen.getByRole('button', { name: /select language/i }));
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('should close when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <div data-testid="outside">Outside</div>
          <LanguageSelector />
        </div>
      );
      await user.click(screen.getByRole('button', { name: /select language/i }));
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      await user.click(screen.getByTestId('outside'));
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('should toggle closed when trigger is clicked while open', async () => {
      const user = userEvent.setup();
      render(<LanguageSelector />);
      const trigger = screen.getByRole('button', { name: /select language/i });
      await user.click(trigger);
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      await user.click(trigger);
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('Language switching', () => {
    it('should switch to Hebrew when Hebrew option is clicked', async () => {
      const user = userEvent.setup();
      render(<LanguageSelector />);
      await user.click(screen.getByRole('button', { name: /select language/i }));
      const listbox = screen.getByRole('listbox');
      const hebrewOption = within(listbox).getByRole('option', { name: /עברית/i });
      await user.click(hebrewOption);
      expect(i18n.language).toBe('he');
    });

    it('should switch to Russian when Russian option is clicked', async () => {
      const user = userEvent.setup();
      render(<LanguageSelector />);
      await user.click(screen.getByRole('button', { name: /select language/i }));
      const listbox = screen.getByRole('listbox');
      const russianOption = within(listbox).getByRole('option', { name: /Русский/i });
      await user.click(russianOption);
      expect(i18n.language).toBe('ru');
    });

    it('should close dropdown after selecting a language', async () => {
      const user = userEvent.setup();
      render(<LanguageSelector />);
      await user.click(screen.getByRole('button', { name: /select language/i }));
      const listbox = screen.getByRole('listbox');
      await user.click(within(listbox).getByRole('option', { name: /Русский/i }));
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('should update trigger text after switching language', async () => {
      const user = userEvent.setup();
      render(<LanguageSelector />);
      await user.click(screen.getByRole('button', { name: /select language/i }));
      const listbox = screen.getByRole('listbox');
      await user.click(within(listbox).getByRole('option', { name: /Русский/i }));
      const trigger = screen.getByRole('button', { name: /выбрать язык/i });
      expect(trigger).toHaveTextContent('RU');
    });
  });

  describe('Auto-close on mouse leave', () => {
    it('should auto-close after mouse leaves for 1.5 seconds', () => {
      vi.useFakeTimers();
      render(<LanguageSelector />);
      const trigger = screen.getByRole('button', { name: /select language/i });

      // Open dropdown
      act(() => { fireEvent.click(trigger); });
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      // Simulate mouse leave
      const container = trigger.parentElement!;
      act(() => { fireEvent.mouseLeave(container); });

      // Not closed yet
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      // Advance past the 1.5s timer
      act(() => { vi.advanceTimersByTime(1600); });
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      vi.useRealTimers();
    });

    it('should cancel auto-close when mouse re-enters', () => {
      vi.useFakeTimers();
      render(<LanguageSelector />);
      const trigger = screen.getByRole('button', { name: /select language/i });

      act(() => { fireEvent.click(trigger); });
      const container = trigger.parentElement!;

      act(() => { fireEvent.mouseLeave(container); });
      act(() => { vi.advanceTimersByTime(500); });
      act(() => { fireEvent.mouseEnter(container); });

      // Wait past the original timer
      act(() => { vi.advanceTimersByTime(1200); });
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      vi.useRealTimers();
    });
  });

  describe('Environment variable control', () => {
    it('should not render when NEXT_PUBLIC_I18N_ENABLED is not set', () => {
      delete process.env.NEXT_PUBLIC_I18N_ENABLED;
      const { container } = render(<LanguageSelector />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(container.innerHTML).toBe('');
    });

    it('should not render when NEXT_PUBLIC_I18N_ENABLED is "false"', () => {
      process.env.NEXT_PUBLIC_I18N_ENABLED = 'false';
      const { container } = render(<LanguageSelector />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(container.innerHTML).toBe('');
    });

    it('should render when NEXT_PUBLIC_I18N_ENABLED is "true"', () => {
      process.env.NEXT_PUBLIC_I18N_ENABLED = 'true';
      render(<LanguageSelector />);
      expect(screen.getByRole('button', { name: /select language/i })).toBeInTheDocument();
    });
  });
});
