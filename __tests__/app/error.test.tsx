import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import ErrorPage from '@/app/error';

describe('ErrorPage', () => {
  it('should render error message', () => {
    const mockError = new Error('Test error');
    const mockReset = vi.fn();

    render(<ErrorPage error={mockError} reset={mockReset} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/something went wrong/i);
  });

  it('should render reset button that calls reset prop when clicked', async () => {
    const user = userEvent.setup();
    const mockError = new Error('Test error');
    const mockReset = vi.fn();

    render(<ErrorPage error={mockError} reset={mockReset} />);

    const resetButton = screen.getByRole('button', { name: /try again/i });
    expect(resetButton).toBeInTheDocument();

    await user.click(resetButton);
    expect(mockReset).toHaveBeenCalledOnce();
  });

  it('should have alert role for screen reader announcement', () => {
    const mockError = new Error('Test error');
    const mockReset = vi.fn();

    render(<ErrorPage error={mockError} reset={mockReset} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should use main landmark element', () => {
    const mockError = new Error('Test error');
    const mockReset = vi.fn();

    render(<ErrorPage error={mockError} reset={mockReset} />);

    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
