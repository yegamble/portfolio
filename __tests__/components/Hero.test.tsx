import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Hero from '@/components/Hero';

describe('Hero', () => {
  it('should render the hero heading', () => {
    render(<Hero />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent(/nyc based/i);
  });

  it('should mention key technologies', () => {
    render(<Hero />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent(/go, typescript/i);
    expect(heading).toHaveTextContent(/aws/i);
  });

  it('should render the teal accent bar', () => {
    const { container } = render(<Hero />);
    const bar = container.querySelector('.bg-primary');
    expect(bar).toBeInTheDocument();
  });
});
