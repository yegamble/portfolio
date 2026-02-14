import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Footer from '@/components/Footer';

describe('Footer', () => {
  it('should render attribution text', () => {
    render(<Footer />);
    expect(screen.getByText(/coded in/i)).toBeInTheDocument();
  });

  it('should link to Visual Studio Code', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: /visual studio code/i });
    expect(link).toHaveAttribute('href', 'https://code.visualstudio.com/');
  });

  it('should link to Next.js', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: 'Next.js' });
    expect(link).toHaveAttribute('href', 'https://nextjs.org/');
  });

  it('should link to Tailwind CSS', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: /tailwind css/i });
    expect(link).toHaveAttribute('href', 'https://tailwindcss.com/');
  });

  it('should link to Inter typeface', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: 'Inter' });
    expect(link).toHaveAttribute('href', 'https://rsms.me/inter/');
  });
});
