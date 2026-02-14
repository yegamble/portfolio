import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import About from '@/components/About';

describe('About', () => {
  it('should render the about section with correct aria label', () => {
    render(<About />);
    expect(screen.getByRole('region', { name: /about me/i })).toBeInTheDocument();
  });

  it('should render section heading with horizontal line', () => {
    render(<About />);
    const section = screen.getByRole('region', { name: /about me/i });
    const heading = within(section).getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent(/about/i);
  });

  it('should contain the origin story about 2012', () => {
    render(<About />);
    const section = screen.getByRole('region', { name: /about me/i });
    expect(section).toHaveTextContent(/back in 2012/i);
  });

  it('should mention building software for different companies', () => {
    render(<About />);
    const section = screen.getByRole('region', { name: /about me/i });
    expect(section).toHaveTextContent(/advertising agency/i);
    expect(section).toHaveTextContent(/start-up/i);
    expect(section).toHaveTextContent(/huge corporation/i);
  });

  it('should describe current focus at TechCorp', () => {
    render(<About />);
    const section = screen.getByRole('region', { name: /about me/i });
    expect(section).toHaveTextContent(/techcorp/i);
    expect(section).toHaveTextContent(/accessible, inclusive products/i);
  });
});
