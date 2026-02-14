import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Projects from '@/components/Projects';

describe('Projects', () => {
  describe('Section structure', () => {
    it('should render the projects section with correct aria label', () => {
      render(<Projects />);
      expect(screen.getByRole('region', { name: /selected projects/i })).toBeInTheDocument();
    });

    it('should have the correct section id for anchor navigation', () => {
      render(<Projects />);
      const section = screen.getByRole('region', { name: /selected projects/i });
      expect(section).toHaveAttribute('id', 'projects');
    });

    it('should have scroll-mt-24 class for fixed header offset', () => {
      render(<Projects />);
      const section = screen.getByRole('region', { name: /selected projects/i });
      expect(section).toHaveClass('scroll-mt-24');
    });

    it('should have a top border separator', () => {
      render(<Projects />);
      const section = screen.getByRole('region', { name: /selected projects/i });
      expect(section.className).toContain('border-t');
    });
  });

  describe('Section header', () => {
    it('should render the "Projects" heading via SectionHeader', () => {
      render(<Projects />);
      const section = screen.getByRole('region', { name: /selected projects/i });
      const heading = within(section).getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent(/projects/i);
    });

    it('should render divider line in header', () => {
      const { container } = render(<Projects />);
      const divider = container.querySelector('.h-px.flex-1.bg-slate-800');
      expect(divider).toBeInTheDocument();
    });
  });

  describe('Project cards', () => {
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

    it('should render Project Alpha description details', () => {
      render(<Projects />);
      expect(screen.getByText(/petabytes of logs in real-time/i)).toBeInTheDocument();
    });

    it('should render Neon UI Kit description details', () => {
      render(<Projects />);
      expect(screen.getByText(/accessibility and dark mode/i)).toBeInTheDocument();
    });

    it('should render exactly two project cards via h3 headings', () => {
      render(<Projects />);
      const headings = screen.getAllByRole('heading', { level: 3 });
      expect(headings).toHaveLength(2);
    });
  });

  describe('Project links', () => {
    it('should render project links with correct aria-labels', () => {
      render(<Projects />);
      expect(
        screen.getByRole('link', { name: /project alpha \(opens in a new tab\)/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /neon ui kit \(opens in a new tab\)/i })
      ).toBeInTheDocument();
    });

    it('should open project links in new tabs', () => {
      render(<Projects />);
      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noreferrer noopener');
      });
    });

    it('should render at least two links', () => {
      render(<Projects />);
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Technology labels', () => {
    it('should render technology labels for each project', () => {
      render(<Projects />);
      const techLists = screen.getAllByRole('list', { name: /technologies used/i });
      expect(techLists).toHaveLength(2);
    });

    it('should render Project Alpha technologies', () => {
      render(<Projects />);
      const techLists = screen.getAllByRole('list', { name: /technologies used/i });
      expect(within(techLists[0]).getByText('Rust')).toBeInTheDocument();
      expect(within(techLists[0]).getByText('Kafka')).toBeInTheDocument();
      expect(within(techLists[0]).getByText('AWS')).toBeInTheDocument();
    });

    it('should render Neon UI Kit technologies', () => {
      render(<Projects />);
      const techLists = screen.getAllByRole('list', { name: /technologies used/i });
      expect(within(techLists[1]).getByText('React')).toBeInTheDocument();
      expect(within(techLists[1]).getByText('Tailwind')).toBeInTheDocument();
      expect(within(techLists[1]).getByText('A11y')).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('should render SVG icons for each project card', () => {
      const { container } = render(<Projects />);
      const svgs = container.querySelectorAll('svg');
      // Each card has: project icon + arrow icon = 2 per card * 2 cards = 4
      expect(svgs.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Card styling', () => {
    it('should render cards with rounded borders', () => {
      const { container } = render(<Projects />);
      const cards = container.querySelectorAll('.rounded-2xl');
      expect(cards).toHaveLength(2);
    });

    it('should have grid layout for cards', () => {
      const { container } = render(<Projects />);
      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });
  });
});
