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
    expect(section).toHaveTextContent(/techcorp/i);
    expect(section).toHaveTextContent(/realestate\.co\.nz/i);
    expect(section).toHaveTextContent(/proactiv/i);
  });

  it('should render date ranges for each position', () => {
    render(<Experience />);
    const section = screen.getByRole('region', { name: /work experience/i });
    expect(section).toHaveTextContent('2020 — Present');
    expect(section).toHaveTextContent('2018 — 2020');
    expect(section).toHaveTextContent('2016 — 2018');
  });

  it('should render technology tags', () => {
    render(<Experience />);
    const techLists = screen.getAllByRole('list', { name: /technologies used/i });
    expect(techLists).toHaveLength(3);

    const firstTechList = techLists[0];
    expect(within(firstTechList).getByText('Go')).toBeInTheDocument();
    expect(within(firstTechList).getByText('Kubernetes')).toBeInTheDocument();
  });

  it('should render the resume link', () => {
    render(<Experience />);
    const section = screen.getByRole('region', { name: /work experience/i });
    const link = within(section).getByRole('link', { name: /view full/i });
    expect(link).toHaveAttribute('href', '/resume.pdf');
  });
});
