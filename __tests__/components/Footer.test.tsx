import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Footer from '@/components/Footer';

describe('Footer', () => {
  it('should render attribution text', () => {
    render(<Footer />);
    expect(screen.getByText(/coded in/i)).toBeInTheDocument();
  });

  it('should render social links (GitHub, LinkedIn, Email, Secure Email)', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: /github/i })).toHaveAttribute(
      'href',
      'https://github.com/yegamble'
    );
    expect(screen.getByRole('link', { name: /linkedin/i })).toHaveAttribute(
      'href',
      'https://linkedin.com/in/yosefgamble'
    );
    expect(screen.getByRole('link', { name: /^email$/i })).toHaveAttribute(
      'href',
      'mailto:yegamble@gmail.com'
    );
    expect(screen.getByRole('link', { name: /secure email/i })).toHaveAttribute(
      'href',
      'mailto:yosef.gamble@protonmail.com'
    );
  });

  it('should link to Tailwind CSS', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: /tailwind css/i });
    expect(link).toHaveAttribute('href', 'https://tailwindcss.com/');
  });

  it('should link to Inter font', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: 'Inter' });
    expect(link).toHaveAttribute('href', 'https://fonts.google.com/specimen/Inter');
  });
});
