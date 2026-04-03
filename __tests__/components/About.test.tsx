import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/hooks/usePretextHeight', () => ({
  usePretextHeight: () => ({ ref: { current: null }, style: {} }),
}));

import About from '@/components/About';

describe('About', () => {
  describe('Section structure', () => {
    it('should render the about section with correct aria label', () => {
      render(<About />);
      expect(screen.getByRole('region', { name: /about me/i })).toBeInTheDocument();
    });

    it('should have the correct section id for anchor navigation', () => {
      render(<About />);
      const section = screen.getByRole('region', { name: /about me/i });
      expect(section).toHaveAttribute('id', 'about');
    });

    it('should have scroll-mt-24 class for fixed header offset', () => {
      render(<About />);
      const section = screen.getByRole('region', { name: /about me/i });
      expect(section).toHaveClass('scroll-mt-24');
    });

    it('should have a top border separator', () => {
      render(<About />);
      const section = screen.getByRole('region', { name: /about me/i });
      expect(section.className).toContain('border-t');
    });
  });

  describe('Section header', () => {
    it('should render section heading with text "About"', () => {
      render(<About />);
      const section = screen.getByRole('region', { name: /about me/i });
      const heading = within(section).getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent(/about/i);
    });

    it('should use SectionHeader component with divider line', () => {
      render(<About />);
      const divider = screen.getByRole('separator');
      expect(divider).toBeInTheDocument();
    });
  });

  describe('Content paragraphs', () => {
    it('should render exactly three paragraphs of bio text', () => {
      render(<About />);
      const section = screen.getByRole('region', { name: /about me/i });
      const paragraphs = section.querySelectorAll('p');
      expect(paragraphs).toHaveLength(3);
    });

    it('should contain the origin story about the university', () => {
      render(<About />);
      const section = screen.getByRole('region', { name: /about me/i });
      expect(section).toHaveTextContent(/University of Nowhere/i);
      expect(section).toHaveTextContent(/2042/);
    });

    it('should mention the scholarship', () => {
      render(<About />);
      const section = screen.getByRole('region', { name: /about me/i });
      expect(section).toHaveTextContent(/Lorem Ipsum/i);
    });

    it('should mention key career milestones', () => {
      render(<About />);
      const section = screen.getByRole('region', { name: /about me/i });
      expect(section).toHaveTextContent(/test-company\.example\.com/i);
      expect(section).toHaveTextContent(/42 countries/i);
      expect(section).toHaveTextContent(/edge case/i);
    });

    it('should mention the user count', () => {
      render(<About />);
      const section = screen.getByRole('region', { name: /about me/i });
      expect(section).toHaveTextContent(/10M users/i);
    });

    it('should describe current focus on open-source development', () => {
      render(<About />);
      const section = screen.getByRole('region', { name: /about me/i });
      expect(section).toHaveTextContent(/open-source/i);
      expect(section).toHaveTextContent(/Unicode/i);
      expect(section).toHaveTextContent(/text processor/i);
    });

    it('should mention bidirectional text handling', () => {
      render(<About />);
      const section = screen.getByRole('region', { name: /about me/i });
      expect(section).toHaveTextContent(/bidirectional text/i);
      expect(section).toHaveTextContent(/RTL/);
    });

    it('should mention i18n and l10n', () => {
      render(<About />);
      const section = screen.getByRole('region', { name: /about me/i });
      expect(section).toHaveTextContent(/i18n/);
      expect(section).toHaveTextContent(/l10n/);
    });

    it('should handle special characters in content', () => {
      render(<About />);
      const section = screen.getByRole('region', { name: /about me/i });
      // Apostrophes, ampersands, dollar signs
      expect(section).toHaveTextContent(/apostrophe/i);
      expect(section).toHaveTextContent(/\$1,000,000/);
    });
  });

  describe('Links', () => {
    it('should contain a link to the company', () => {
      render(<About />);
      const link = screen.getByRole('link', { name: /test-company\.example\.com/i });
      expect(link).toHaveAttribute('href');
    });

    it('should open company link in new tab', () => {
      render(<About />);
      const link = screen.getByRole('link', { name: /test-company\.example\.com/i });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noreferrer noopener');
    });
  });

  describe('Content structure', () => {
    it('should have proper text container for body content', () => {
      render(<About />);
      const section = screen.getByRole('region', { name: /about me/i });
      const paragraphs = section.querySelectorAll('p');
      expect(paragraphs.length).toBeGreaterThan(0);
    });
  });
});
