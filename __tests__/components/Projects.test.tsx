import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Projects from '@/components/Projects';

describe('Projects', () => {
  it('should render the projects section with correct aria label', () => {
    render(<Projects />);
    expect(screen.getByRole('region', { name: /selected projects/i })).toBeInTheDocument();
  });

  it('should render project titles', () => {
    render(<Projects />);
    const section = screen.getByRole('region', { name: /selected projects/i });
    expect(section).toHaveTextContent(/project alpha/i);
    expect(section).toHaveTextContent(/neon ui kit/i);
  });

  it('should render project descriptions', () => {
    render(<Projects />);
    const section = screen.getByRole('region', { name: /selected projects/i });
    expect(section).toHaveTextContent(/distributed data processing engine/i);
    expect(section).toHaveTextContent(/open-source react component library/i);
  });

  it('should render technology tags for projects', () => {
    render(<Projects />);
    const techLists = screen.getAllByRole('list', { name: /technologies used/i });
    expect(techLists).toHaveLength(2);

    expect(within(techLists[0]).getByText('Rust')).toBeInTheDocument();
    expect(within(techLists[1]).getByText('Storybook')).toBeInTheDocument();
  });

  it('should render project links', () => {
    render(<Projects />);
    const section = screen.getByRole('region', { name: /selected projects/i });
    const links = within(section).getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(2);
  });
});
