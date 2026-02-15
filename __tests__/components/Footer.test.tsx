import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Footer from '@/components/Footer';

describe('Footer', () => {
  describe('Structure', () => {
    it('should render a footer element', () => {
      render(<Footer />);
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('should have a top border separator', () => {
      render(<Footer />);
      const footer = screen.getByRole('contentinfo');
      expect(footer.className).toContain('border-t');
    });

    it('should be centered text', () => {
      render(<Footer />);
      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveClass('text-center');
    });
  });

  describe('Social links via SocialLinks component', () => {
    it('should render GitHub link with correct href', () => {
      render(<Footer />);
      expect(screen.getByRole('link', { name: /github/i })).toHaveAttribute(
        'href',
        'https://github.com/yegamble'
      );
    });

    it('should render LinkedIn link with correct href', () => {
      render(<Footer />);
      expect(screen.getByRole('link', { name: /linkedin/i })).toHaveAttribute(
        'href',
        'https://linkedin.com/in/yosefgamble'
      );
    });

    it('should render email link with correct href', () => {
      render(<Footer />);
      expect(screen.getByRole('link', { name: /^email$/i })).toHaveAttribute(
        'href',
        'mailto:yegamble@gmail.com'
      );
    });

    it('should render secure email link with correct href', () => {
      render(<Footer />);
      expect(screen.getByRole('link', { name: /secure email/i })).toHaveAttribute(
        'href',
        'mailto:yosef.gamble@protonmail.com'
      );
    });

    it('should render all four social links with icons', () => {
      render(<Footer />);
      const socialLinks = [
        screen.getByRole('link', { name: /github/i }),
        screen.getByRole('link', { name: /linkedin/i }),
        screen.getByRole('link', { name: /^email$/i }),
        screen.getByRole('link', { name: /secure email/i }),
      ];
      socialLinks.forEach((link) => {
        const svg = link.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });
  });

  describe('Attribution text', () => {
    it('should render attribution text', () => {
      render(<Footer />);
      expect(screen.getByText(/coded in/i)).toBeInTheDocument();
    });

    it('should mention "Built with"', () => {
      render(<Footer />);
      expect(screen.getByText(/built with/i)).toBeInTheDocument();
    });
  });

  describe('Tool links', () => {
    it('should link to Visual Studio Code', () => {
      render(<Footer />);
      const link = screen.getByRole('link', { name: /visual studio code/i });
      expect(link).toHaveAttribute('href', 'https://code.visualstudio.com/');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noreferrer noopener');
    });

    it('should link to Tailwind CSS', () => {
      render(<Footer />);
      const link = screen.getByRole('link', { name: /tailwind css/i });
      expect(link).toHaveAttribute('href', 'https://tailwindcss.com/');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noreferrer noopener');
    });

    it('should link to Inter font', () => {
      render(<Footer />);
      const link = screen.getByRole('link', { name: 'Inter' });
      expect(link).toHaveAttribute('href', 'https://fonts.google.com/specimen/Inter');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noreferrer noopener');
    });
  });

  describe('Accessibility', () => {
    it('should have sr-only labels for social icons', () => {
      render(<Footer />);
      expect(screen.getByText('GitHub')).toHaveClass('sr-only');
      expect(screen.getByText('LinkedIn')).toHaveClass('sr-only');
      expect(screen.getByText('Email')).toHaveClass('sr-only');
      expect(screen.getByText('Secure email')).toHaveClass('sr-only');
    });

    it('should have all external links with noreferrer noopener', () => {
      render(<Footer />);
      const externalLinks = screen.getAllByRole('link').filter(
        (link) => link.getAttribute('target') === '_blank'
      );
      externalLinks.forEach((link) => {
        expect(link).toHaveAttribute('rel', 'noreferrer noopener');
      });
    });
  });
});
