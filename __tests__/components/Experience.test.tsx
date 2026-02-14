import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Experience from '@/components/Experience';

describe('Experience', () => {
  describe('Section structure', () => {
    it('should render the experience section with correct aria label', () => {
      render(<Experience />);
      expect(screen.getByRole('region', { name: /work experience/i })).toBeInTheDocument();
    });

    it('should have the correct section id for anchor navigation', () => {
      render(<Experience />);
      const section = screen.getByRole('region', { name: /work experience/i });
      expect(section).toHaveAttribute('id', 'experience');
    });

    it('should have scroll-mt-24 class for fixed header offset', () => {
      render(<Experience />);
      const section = screen.getByRole('region', { name: /work experience/i });
      expect(section).toHaveClass('scroll-mt-24');
    });

    it('should have a top border separator', () => {
      render(<Experience />);
      const section = screen.getByRole('region', { name: /work experience/i });
      expect(section.className).toContain('border-t');
    });
  });

  describe('Section header', () => {
    it('should render the "Experience" heading via SectionHeader', () => {
      render(<Experience />);
      const section = screen.getByRole('region', { name: /work experience/i });
      const heading = within(section).getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent(/experience/i);
    });

    it('should render divider line in header', () => {
      const { container } = render(<Experience />);
      const divider = container.querySelector('.h-px.flex-1.bg-slate-800');
      expect(divider).toBeInTheDocument();
    });
  });

  describe('Experience entries', () => {
    it('should render all three experience entries', () => {
      render(<Experience />);
      const section = screen.getByRole('region', { name: /work experience/i });
      expect(section).toHaveTextContent(/Independent/i);
      expect(section).toHaveTextContent(/realestate\.co\.nz/i);
      expect(section).toHaveTextContent(/ProStock/i);
    });

    it('should render experience items as an ordered list', () => {
      render(<Experience />);
      const section = screen.getByRole('region', { name: /work experience/i });
      const ol = section.querySelector('ol');
      expect(ol).toBeInTheDocument();
    });

    it('should render three list items', () => {
      render(<Experience />);
      const section = screen.getByRole('region', { name: /work experience/i });
      const ol = section.querySelector('ol');
      const items = ol!.querySelectorAll(':scope > li');
      expect(items).toHaveLength(3);
    });

    it('should render date ranges for each position', () => {
      render(<Experience />);
      const section = screen.getByRole('region', { name: /work experience/i });
      expect(section).toHaveTextContent('2024 — Present');
      expect(section).toHaveTextContent('2021 — 2024');
      expect(section).toHaveTextContent('2019 — 2024');
    });

    it('should render job titles for each position', () => {
      render(<Experience />);
      const section = screen.getByRole('region', { name: /work experience/i });
      expect(section).toHaveTextContent(/Full Stack Engineer/);
      expect(section).toHaveTextContent(/Software Developer/);
    });
  });

  describe('Company links', () => {
    it('should render links for each company', () => {
      render(<Experience />);
      const independentLink = screen.getByRole('link', {
        name: /full stack engineer at independent/i,
      });
      expect(independentLink).toHaveAttribute('href', 'https://github.com/yegamble');

      const realestateLink = screen.getByRole('link', {
        name: /full stack engineer at realestate\.co\.nz/i,
      });
      expect(realestateLink).toHaveAttribute('href', 'https://www.realestate.co.nz');
    });

    it('should open company links in new tabs', () => {
      render(<Experience />);
      const link = screen.getByRole('link', {
        name: /full stack engineer at independent/i,
      });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noreferrer noopener');
    });

    it('should have descriptive aria-labels on company links', () => {
      render(<Experience />);
      expect(
        screen.getByRole('link', {
          name: /full stack engineer at independent \(opens in a new tab\)/i,
        })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', {
          name: /software developer at prostock \(opens in a new tab\)/i,
        })
      ).toBeInTheDocument();
    });
  });

  describe('Technology tags', () => {
    it('should render technology tags for each position', () => {
      render(<Experience />);
      const techLists = screen.getAllByRole('list', { name: /technologies used/i });
      expect(techLists).toHaveLength(3);
    });

    it('should render specific technologies for the Independent position', () => {
      render(<Experience />);
      const techLists = screen.getAllByRole('list', { name: /technologies used/i });
      expect(within(techLists[0]).getByText('Go')).toBeInTheDocument();
      expect(within(techLists[0]).getByText('Docker')).toBeInTheDocument();
      expect(within(techLists[0]).getByText('PostgreSQL')).toBeInTheDocument();
      expect(within(techLists[0]).getByText('Redis')).toBeInTheDocument();
      expect(within(techLists[0]).getByText('Cloudflare')).toBeInTheDocument();
      expect(within(techLists[0]).getByText('ActivityPub')).toBeInTheDocument();
    });

    it('should render specific technologies for the realestate.co.nz position', () => {
      render(<Experience />);
      const techLists = screen.getAllByRole('list', { name: /technologies used/i });
      expect(within(techLists[1]).getByText('AWS Lambda')).toBeInTheDocument();
      expect(within(techLists[1]).getByText('CDK')).toBeInTheDocument();
      expect(within(techLists[1]).getByText('EmberJS')).toBeInTheDocument();
      expect(within(techLists[1]).getByText('PHP')).toBeInTheDocument();
    });

    it('should render specific technologies for the ProStock position', () => {
      render(<Experience />);
      const techLists = screen.getAllByRole('list', { name: /technologies used/i });
      expect(within(techLists[2]).getByText('AngularJS')).toBeInTheDocument();
      expect(within(techLists[2]).getByText('Android')).toBeInTheDocument();
      expect(within(techLists[2]).getByText('REST APIs')).toBeInTheDocument();
    });

    it('should use TechTag component with pill styling', () => {
      render(<Experience />);
      const techLists = screen.getAllByRole('list', { name: /technologies used/i });
      const goTag = within(techLists[0]).getByText('Go');
      expect(goTag).toHaveClass('rounded-full', 'text-xs', 'font-medium');
    });
  });

  describe('Descriptions', () => {
    it('should include description for Independent position', () => {
      render(<Experience />);
      const section = screen.getByRole('region', { name: /work experience/i });
      expect(section).toHaveTextContent(/PeerTube-compatible video streaming/i);
    });

    it('should include description for realestate.co.nz position', () => {
      render(<Experience />);
      const section = screen.getByRole('region', { name: /work experience/i });
      expect(section).toHaveTextContent(/instant price change alerts/i);
      expect(section).toHaveTextContent(/serverless notification system/i);
    });

    it('should include description for ProStock position', () => {
      render(<Experience />);
      const section = screen.getByRole('region', { name: /work experience/i });
      expect(section).toHaveTextContent(/warehouse management system/i);
    });
  });

  describe('Resume link', () => {
    it('should render the resume link with correct href', () => {
      render(<Experience />);
      const section = screen.getByRole('region', { name: /work experience/i });
      const link = within(section).getByRole('link', { name: /view full/i });
      expect(link).toHaveAttribute('href', '/resume.pdf');
    });

    it('should have descriptive aria-label on resume link', () => {
      render(<Experience />);
      const link = screen.getByRole('link', { name: /view full résumé/i });
      expect(link).toBeInTheDocument();
    });

    it('should contain arrow right icon', () => {
      render(<Experience />);
      const link = screen.getByRole('link', { name: /view full résumé/i });
      const svg = link.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Date header accessibility', () => {
    it('should render date headers with aria-label', () => {
      render(<Experience />);
      const section = screen.getByRole('region', { name: /work experience/i });
      const dateHeaders = section.querySelectorAll('header[aria-label]');
      expect(dateHeaders).toHaveLength(3);
      expect(dateHeaders[0]).toHaveAttribute('aria-label', '2024 — Present');
      expect(dateHeaders[1]).toHaveAttribute('aria-label', '2021 — 2024');
      expect(dateHeaders[2]).toHaveAttribute('aria-label', '2019 — 2024');
    });
  });
});
