import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Header from '@/components/Header';

describe('Header', () => {
  it('should render the name as a heading', () => {
    render(<Header />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent(/yosef gamble/i);
  });

  it('should render the job title', () => {
    render(<Header />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent(/senior full-stack engineer/i);
  });

  it('should render the tagline', () => {
    render(<Header />);
    expect(screen.getByText(/nyc based\./i)).toBeInTheDocument();
  });

  it('should render navigation with section links', () => {
    render(<Header />);
    const nav = screen.getByRole('navigation', { name: /in-page jump links/i });
    expect(nav).toBeInTheDocument();

    const links = within(nav).getAllByRole('link');
    expect(links).toHaveLength(3);

    const aboutLink = within(nav).getByText(/about/i);
    expect(aboutLink.closest('a')).toHaveAttribute('href', '#about');
  });

  it('should render GitHub social link', () => {
    render(<Header />);
    const socialList = screen.getByRole('list', { name: /social media/i });
    const githubLink = within(socialList).getByLabelText(/github/i);
    expect(githubLink).toHaveAttribute('href', 'https://github.com/yegamble');
    expect(githubLink).toHaveAttribute('target', '_blank');
  });

  it('should render LinkedIn social link', () => {
    render(<Header />);
    const socialList = screen.getByRole('list', { name: /social media/i });
    const linkedinLink = within(socialList).getByLabelText(/linkedin/i);
    expect(linkedinLink).toHaveAttribute('href', 'https://linkedin.com/in/yosefgamble');
    expect(linkedinLink).toHaveAttribute('target', '_blank');
  });
});
