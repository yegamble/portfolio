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

    it('should contain the origin story about Central Washington University', () => {
      render(<About />);
      const section = screen.getByRole('region', { name: /about me/i });
      expect(section).toHaveTextContent(/Central Washington University/i);
      expect(section).toHaveTextContent(/2013/);
    });

    it('should mention Student Government President role', () => {
      render(<About />);
      const section = screen.getByRole('region', { name: /about me/i });
      expect(section).toHaveTextContent(/Student Government President/i);
    });

    it('should mention key career milestones', () => {
      render(<About />);
      const section = screen.getByRole('region', { name: /about me/i });
      expect(section).toHaveTextContent(/realestate\.co\.nz/i);
      expect(section).toHaveTextContent(/industry-first/i);
      expect(section).toHaveTextContent(/Boeing Scholarship/i);
    });

    it('should mention University of Auckland', () => {
      render(<About />);
      const section = screen.getByRole('region', { name: /about me/i });
      expect(section).toHaveTextContent(/University of Auckland/i);
    });

    it('should describe current focus on open-source Go development', () => {
      render(<About />);
      const section = screen.getByRole('region', { name: /about me/i });
      expect(section).toHaveTextContent(/open-source/i);
      expect(section).toHaveTextContent(/video streaming/i);
      expect(section).toHaveTextContent(/ActivityPub/i);
    });

    it('should mention ATProto and decentralized content', () => {
      render(<About />);
      const section = screen.getByRole('region', { name: /about me/i });
      expect(section).toHaveTextContent(/ATProto/i);
      expect(section).toHaveTextContent(/decentralized content sharing/i);
    });

    it('should mention Cloudflare CDN and Backblaze B2', () => {
      render(<About />);
      const section = screen.getByRole('region', { name: /about me/i });
      expect(section).toHaveTextContent(/Cloudflare CDN/i);
      expect(section).toHaveTextContent(/Backblaze B2/i);
    });

    it('should mention New Zealand', () => {
      render(<About />);
      const section = screen.getByRole('region', { name: /about me/i });
      expect(section).toHaveTextContent(/New Zealand/i);
    });
  });

  describe('Links', () => {
    it('should contain a link to realestate.co.nz', () => {
      render(<About />);
      const link = screen.getByRole('link', { name: /realestate\.co\.nz/i });
      expect(link).toHaveAttribute('href', 'https://www.realestate.co.nz');
    });

    it('should open realestate.co.nz link in new tab', () => {
      render(<About />);
      const link = screen.getByRole('link', { name: /realestate\.co\.nz/i });
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
