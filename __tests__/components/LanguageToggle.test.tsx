import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import i18n from '@/lib/i18n';
import LanguageToggle from '@/components/LanguageToggle';

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

afterEach(() => {
  process.env.NEXT_PUBLIC_HEBREW_ENABLED = 'true';
});

describe('LanguageToggle', () => {
  describe('Rendering', () => {
    it('should render a button element', () => {
      render(<LanguageToggle />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should display Hebrew toggle text when in English mode', () => {
      render(<LanguageToggle />);
      expect(screen.getByRole('button')).toHaveTextContent('עב');
    });

    it('should have an aria-label describing the action', () => {
      render(<LanguageToggle />);
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        'Switch to Hebrew'
      );
    });

    it('should have proper styling classes', () => {
      render(<LanguageToggle />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('rounded-md', 'border', 'text-xs', 'font-bold');
    });
  });

  describe('Language switching', () => {
    it('should switch to Hebrew when clicked in English mode', async () => {
      const user = userEvent.setup();
      render(<LanguageToggle />);
      await user.click(screen.getByRole('button'));
      expect(i18n.language).toBe('he');
    });

    it('should switch back to English when clicked in Hebrew mode', async () => {
      const user = userEvent.setup();
      await i18n.changeLanguage('he');
      render(<LanguageToggle />);
      await user.click(screen.getByRole('button'));
      expect(i18n.language).toBe('en');
    });

    it('should display EN text when in Hebrew mode', async () => {
      await i18n.changeLanguage('he');
      render(<LanguageToggle />);
      expect(screen.getByRole('button')).toHaveTextContent('EN');
    });

    it('should update aria-label when in Hebrew mode', async () => {
      await i18n.changeLanguage('he');
      render(<LanguageToggle />);
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        'עבור לאנגלית'
      );
    });
  });

  describe('Environment variable control', () => {
    it('should not render when NEXT_PUBLIC_HEBREW_ENABLED is not set', () => {
      delete process.env.NEXT_PUBLIC_HEBREW_ENABLED;
      const { container } = render(<LanguageToggle />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(container.innerHTML).toBe('');
    });

    it('should not render when NEXT_PUBLIC_HEBREW_ENABLED is "false"', () => {
      process.env.NEXT_PUBLIC_HEBREW_ENABLED = 'false';
      const { container } = render(<LanguageToggle />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(container.innerHTML).toBe('');
    });

    it('should render when NEXT_PUBLIC_HEBREW_ENABLED is "true"', () => {
      process.env.NEXT_PUBLIC_HEBREW_ENABLED = 'true';
      render(<LanguageToggle />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
});
