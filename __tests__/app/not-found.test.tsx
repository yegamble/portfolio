import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import NotFound from '@/app/not-found';

describe('NotFound', () => {
  it('should render 404 message', () => {
    render(<NotFound />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/404/i);
    expect(screen.getByText(/page not found/i)).toBeInTheDocument();
  });

  it('should render descriptive text', () => {
    render(<NotFound />);

    expect(screen.getByText(/page you.+looking for doesn.+t exist/i)).toBeInTheDocument();
  });

  it('should have link back to home', () => {
    render(<NotFound />);

    const homeLink = screen.getByRole('link', { name: /home|back/i });
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('should use main landmark element', () => {
    render(<NotFound />);

    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
