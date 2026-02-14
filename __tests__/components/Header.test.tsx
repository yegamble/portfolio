import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Header from '@/components/Header';

describe('Header', () => {
  it('should render the name as a link', () => {
    render(<Header />);
    const link = screen.getByRole('link', { name: /yosef gamble/i });
    expect(link).toHaveAttribute('href', '/');
  });

  it('should render the job title', () => {
    render(<Header />);
    expect(screen.getByText(/senior full-stack engineer/i)).toBeInTheDocument();
  });

  it('should render navigation with section links', () => {
    render(<Header />);
    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    const links = within(nav).getAllByRole('link');
    expect(links).toHaveLength(3);
    expect(within(nav).getByText(/about/i)).toBeInTheDocument();
    expect(within(nav).getByText(/experience/i)).toBeInTheDocument();
    expect(within(nav).getByText(/projects/i)).toBeInTheDocument();
  });

  it('should render GitHub social link', () => {
    render(<Header />);
    const link = screen.getByRole('link', { name: /github/i });
    expect(link).toHaveAttribute('href', 'https://github.com/yegamble');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('should render LinkedIn social link', () => {
    render(<Header />);
    const link = screen.getByRole('link', { name: /linkedin/i });
    expect(link).toHaveAttribute('href', 'https://linkedin.com/in/yosefgamble');
    expect(link).toHaveAttribute('target', '_blank');
  });
});
