import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Experience from '@/components/Experience';

describe('Experience', () => {
  it('should render the experience section with correct aria label', () => {
    render(<Experience />);
    expect(screen.getByRole('region', { name: /work experience/i })).toBeInTheDocument();
  });

  it('should render all three experience entries', () => {
    render(<Experience />);
    const section = screen.getByRole('region', { name: /work experience/i });
    expect(section).toHaveTextContent(/Independent/i);
    expect(section).toHaveTextContent(/realestate\.co\.nz/i);
    expect(section).toHaveTextContent(/ProStock/i);
  });

  it('should render date ranges for each position', () => {
    render(<Experience />);
    const section = screen.getByRole('region', { name: /work experience/i });
    expect(section).toHaveTextContent('2024 — Present');
    expect(section).toHaveTextContent('2021 — 2024');
    expect(section).toHaveTextContent('2019 — 2024');
  });

  it('should render technology tags', () => {
    render(<Experience />);
    const techLists = screen.getAllByRole('list', { name: /technologies used/i });
    expect(techLists).toHaveLength(3);
    expect(within(techLists[0]).getByText('Go')).toBeInTheDocument();
    expect(within(techLists[0]).getByText('Docker')).toBeInTheDocument();
  });

  it('should render the resume link with right arrow', () => {
    render(<Experience />);
    const section = screen.getByRole('region', { name: /work experience/i });
    const link = within(section).getByRole('link', { name: /view full/i });
    expect(link).toHaveAttribute('href', '/resume.pdf');
  });
});
