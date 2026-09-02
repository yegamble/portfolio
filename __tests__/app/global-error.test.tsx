import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import GlobalError from '@/app/global-error';

describe('GlobalError', () => {
  beforeEach(() => {
    // Also swallows React's nesting warning for rendering <html> into a div.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders its own document shell, since it replaces the root layout', () => {
    const markup = renderToStaticMarkup(<GlobalError error={new Error('Boom')} reset={vi.fn()} />);

    expect(markup).toContain('<html lang="en" dir="ltr">');
    expect(markup).toContain('<body');
  });

  it('shows an English message in an alert region', () => {
    render(<GlobalError error={new Error('Boom')} reset={vi.fn()} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/something went wrong/i);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('offers a reload button that retries the render', async () => {
    const user = userEvent.setup();
    const reset = vi.fn();

    render(<GlobalError error={new Error('Boom')} reset={reset} />);

    await user.click(screen.getByRole('button', { name: /reload/i }));
    expect(reset).toHaveBeenCalledOnce();
  });

  it('logs the error for diagnostics', () => {
    const error = new Error('Boom');
    render(<GlobalError error={error} reset={vi.fn()} />);

    expect(console.error).toHaveBeenCalledWith(error);
  });
});
