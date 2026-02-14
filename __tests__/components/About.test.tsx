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

  it('should contain the origin story about Central Washington University', () => {
    render(<About />);
    const section = screen.getByRole('region', { name: /about me/i });
    expect(section).toHaveTextContent(/Central Washington University/i);
    expect(section).toHaveTextContent(/2013/);
  });

  it('should mention key career milestones', () => {
    render(<About />);
    const section = screen.getByRole('region', { name: /about me/i });
    expect(section).toHaveTextContent(/realestate\.co\.nz/i);
    expect(section).toHaveTextContent(/industry-first/i);
    expect(section).toHaveTextContent(/Boeing Scholarship/i);
  });

  it('should describe current focus on open-source Go development', () => {
    render(<About />);
    const section = screen.getByRole('region', { name: /about me/i });
    expect(section).toHaveTextContent(/open-source/i);
    expect(section).toHaveTextContent(/video streaming/i);
    expect(section).toHaveTextContent(/ActivityPub/i);
  });
});
