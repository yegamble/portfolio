import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import About from '@/components/About';

describe('About', () => {
  it('should render the about section with correct aria label', () => {
    render(<About />);
    expect(screen.getByRole('region', { name: /about me/i })).toBeInTheDocument();
  });

  it('should render section heading', () => {
    render(<About />);
    const section = screen.getByRole('region', { name: /about me/i });
    const headings = within(section).getAllByRole('heading', { level: 2 });
    expect(headings.length).toBeGreaterThanOrEqual(1);
    expect(headings[0]).toHaveTextContent(/about/i);
  });

  it('should contain the origin story about 2012', () => {
    render(<About />);
    const section = screen.getByRole('region', { name: /about me/i });
    expect(section).toHaveTextContent(/back in 2012/i);
  });

  it('should render the real estate marketplace link', () => {
    render(<About />);
    const section = screen.getByRole('region', { name: /about me/i });
    const link = within(section).getByRole('link', { name: /real estate marketplace/i });
    expect(link).toHaveAttribute('href', 'https://www.realestate.co.nz');
  });

  it('should describe current focus', () => {
    render(<About />);
    const section = screen.getByRole('region', { name: /about me/i });
    expect(section).toHaveTextContent(/main focus these days/i);
  });
});
