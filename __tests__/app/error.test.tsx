import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import i18n from '@/lib/i18n';
import ErrorPage from '@/app/[locale]/error';

describe('ErrorPage', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await i18n.changeLanguage('en');
  });

  it('should render error message', () => {
    render(<ErrorPage error={new Error('Test error')} reset={vi.fn()} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/something went wrong/i);
  });

  it('should render reset button that calls reset prop when clicked', async () => {
    const user = userEvent.setup();
    const mockReset = vi.fn();

    render(<ErrorPage error={new Error('Test error')} reset={mockReset} />);

    const resetButton = screen.getByRole('button', { name: /try again/i });
    expect(resetButton).toBeInTheDocument();

    await user.click(resetButton);
    expect(mockReset).toHaveBeenCalledOnce();
  });

  it('should have alert role for screen reader announcement', () => {
    render(<ErrorPage error={new Error('Test error')} reset={vi.fn()} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should use main landmark element', () => {
    render(<ErrorPage error={new Error('Test error')} reset={vi.fn()} />);

    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('should log the boundary error for diagnostics', () => {
    const error = new Error('Test error');
    render(<ErrorPage error={error} reset={vi.fn()} />);

    expect(console.error).toHaveBeenCalledWith(error);
  });

  it('should follow the active language rather than a cookie read after mount', async () => {
    await i18n.changeLanguage('he');
    render(<ErrorPage error={new Error('Test error')} reset={vi.fn()} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      i18n.t('error.title') as string
    );
    expect(screen.getByRole('heading', { level: 1 })).not.toHaveTextContent(
      /something went wrong/i
    );
  });
});
