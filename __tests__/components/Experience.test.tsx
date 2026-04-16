import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/hooks/usePretextHeight', () => ({
  usePretextHeight: () => ({ ref: { current: null }, style: {} }),
}));

vi.mock('@/data/experience', () => ({
  experienceEntries: [
    {
      id: 'edge-corp',
      companyUrl: 'https://example.com/edge-corp?q=test&lang=en#section',
      technologies: ['C++', 'Rust', 'Go', 'PostgreSQL', 'Redis', 'gRPC'],
    },
    {
      id: 'cafe-societe',
      companyUrl: 'https://cafe-societe.example.com/',
      technologies: ['TypeScript', 'React', 'Node.js', 'GraphQL', 'Stripe'],
    },
    {
      id: 'open-src',
      companyUrl: null,
      technologies: ['Python', 'Kotlin', 'Swift', 'Unicode', 'CI/CD'],
    },
  ],
}));

import Experience from '@/components/Experience';
import i18n from '@/lib/i18n';

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
      render(<Experience />);
      const divider = screen.getByRole('separator');
      expect(divider).toBeInTheDocument();
    });
  });

  describe('Experience entries', () => {
    it('should render all three experience entries', () => {
      render(<Experience />);
      const section = screen.getByRole('region', { name: /work experience/i });
      expect(section).toHaveTextContent(/Edge Corp/i);
      expect(section).toHaveTextContent(/Cafe Societe/i);
      expect(section).toHaveTextContent(/Open-Source Foundation/i);
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
      expect(section).toHaveTextContent('2042 - Present');
      expect(section).toHaveTextContent('2038 - 2042');
      expect(section).toHaveTextContent('2035 - 2038');
    });

    it('should render job titles for each position', () => {
      render(<Experience />);
      const section = screen.getByRole('region', { name: /work experience/i });
      expect(section).toHaveTextContent(/Principal Engineer/);
      expect(section).toHaveTextContent(/Intern to Mid-Level/);
    });
  });

  describe('Company links', () => {
    it('should render links only for entries with valid company URLs', () => {
      render(<Experience />);
      const edgeLink = screen.getByRole('link', {
        name: /principal engineer.*at edge corp/i,
      });
      expect(edgeLink).toHaveAttribute('href', 'https://example.com/edge-corp?q=test&lang=en#section');

      const cafeLink = screen.getByRole('link', {
        name: /full-stack developer at cafe societe/i,
      });
      expect(cafeLink).toHaveAttribute('href', 'https://cafe-societe.example.com/');

      expect(
        screen.queryByRole('link', {
          name: /intern to mid-level engineer at open-source foundation/i,
        })
      ).not.toBeInTheDocument();
    });

    it('should open company links in new tabs', () => {
      render(<Experience />);
      const link = screen.getByRole('link', {
        name: /principal engineer.*at edge corp/i,
      });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noreferrer noopener');
    });

    it('should have descriptive aria-labels on company links', () => {
      render(<Experience />);
      expect(
        screen.getByRole('link', {
          name: /principal engineer.*at edge corp \(opens in a new tab\)/i,
        })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('link', {
          name: /intern to mid-level engineer at open-source foundation \(opens in a new tab\)/i,
        })
      ).not.toBeInTheDocument();
    });
  });

  describe('Technology tags', () => {
    it('should render technology tags for each position', () => {
      render(<Experience />);
      const techLists = screen.getAllByRole('list', { name: /technologies used/i });
      expect(techLists).toHaveLength(3);
    });

    it('should render specific technologies for the Edge Corp position', () => {
      render(<Experience />);
      const techLists = screen.getAllByRole('list', { name: /technologies used/i });
      expect(within(techLists[0]).getByText('C++')).toBeInTheDocument();
      expect(within(techLists[0]).getByText('Rust')).toBeInTheDocument();
      expect(within(techLists[0]).getByText('Go')).toBeInTheDocument();
      expect(within(techLists[0]).getByText('PostgreSQL')).toBeInTheDocument();
      expect(within(techLists[0]).getByText('Redis')).toBeInTheDocument();
      expect(within(techLists[0]).getByText('gRPC')).toBeInTheDocument();
    });

    it('should render specific technologies for the Cafe Societe position', () => {
      render(<Experience />);
      const techLists = screen.getAllByRole('list', { name: /technologies used/i });
      expect(within(techLists[1]).getByText('TypeScript')).toBeInTheDocument();
      expect(within(techLists[1]).getByText('React')).toBeInTheDocument();
      expect(within(techLists[1]).getByText('Node.js')).toBeInTheDocument();
      expect(within(techLists[1]).getByText('GraphQL')).toBeInTheDocument();
    });

    it('should render specific technologies for the Open-Source Foundation position', () => {
      render(<Experience />);
      const techLists = screen.getAllByRole('list', { name: /technologies used/i });
      expect(within(techLists[2]).getByText('Python')).toBeInTheDocument();
      expect(within(techLists[2]).getByText('Kotlin')).toBeInTheDocument();
      expect(within(techLists[2]).getByText('Swift')).toBeInTheDocument();
    });

    it('should render TechTag components within tech lists', () => {
      render(<Experience />);
      const techLists = screen.getAllByRole('list', { name: /technologies used/i });
      const goTag = within(techLists[0]).getByText('Go');
      expect(goTag).toBeInTheDocument();
      expect(goTag.closest('li')).toBeInTheDocument();
    });
  });

  describe('Descriptions', () => {
    it('should include description for Edge Corp position', () => {
      render(<Experience />);
      const section = screen.getByRole('region', { name: /work experience/i });
      expect(section).toHaveTextContent(/distributed system/i);
    });

    it('should include description for Cafe Societe position', () => {
      render(<Experience />);
      const section = screen.getByRole('region', { name: /work experience/i });
      expect(section).toHaveTextContent(/N-tier architecture/i);
      expect(section).toHaveTextContent(/POS system/i);
    });

    it('should include description for Open-Source Foundation position', () => {
      render(<Experience />);
      const section = screen.getByRole('region', { name: /work experience/i });
      expect(section).toHaveTextContent(/Unicode Sanitizer/i);
    });
  });

  describe('Resume link', () => {
    it('should render the resume link with correct href', () => {
      render(<Experience />);
      const section = screen.getByRole('region', { name: /work experience/i });
      const link = within(section).getByRole('link', { name: /view full/i });
      expect(link).toHaveAttribute('href', 'https://www.linkedin.com/in/yosefgamble/');
    });

    it('should have descriptive aria-label on resume link', () => {
      render(<Experience />);
      const link = screen.getByRole('link', { name: /view full resume/i });
      expect(link).toBeInTheDocument();
    });

    it('should contain arrow right icon', () => {
      render(<Experience />);
      const link = screen.getByRole('link', { name: /view full resume/i });
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
      expect(dateHeaders[0]).toHaveAttribute('aria-label', '2042 - Present');
      expect(dateHeaders[1]).toHaveAttribute('aria-label', '2038 - 2042');
      expect(dateHeaders[2]).toHaveAttribute('aria-label', '2035 - 2038');
    });
  });

  describe('Data integrity', () => {
    it('should skip translation jobs that do not have metadata entries', () => {
      const original = i18n.getResourceBundle('en', 'translation');
      const jobs = original.experience.jobs as Array<Record<string, string>>;
      const withUnknownEntry = [
        ...jobs,
        {
          id: 'unknown-role',
          dates: '2000 - 2001',
          title: 'Ghost Role',
          company: 'Ghost Co',
          description: 'Should never render without metadata.',
        },
      ];

      i18n.addResourceBundle(
        'en',
        'translation',
        {
          ...original,
          experience: { ...original.experience, jobs: withUnknownEntry },
        },
        false,
        true
      );

      try {
        render(<Experience />);
        expect(screen.queryByText('Ghost Role')).not.toBeInTheDocument();
      } finally {
        i18n.addResourceBundle('en', 'translation', original, false, true);
      }
    });

    it('should preserve company URLs when translation order changes', () => {
      const original = i18n.getResourceBundle('en', 'translation');
      const jobs = original.experience.jobs as Array<Record<string, string>>;
      const reordered = [jobs[2], jobs[0], jobs[1]];

      i18n.addResourceBundle(
        'en',
        'translation',
        {
          ...original,
          experience: { ...original.experience, jobs: reordered },
        },
        false,
        true
      );

      try {
        render(<Experience />);
        expect(
          screen.getByRole('link', { name: /principal engineer.*at edge corp/i })
        ).toHaveAttribute('href', 'https://example.com/edge-corp?q=test&lang=en#section');
        expect(
          screen.getByRole('link', { name: /full-stack developer at cafe societe/i })
        ).toHaveAttribute('href', 'https://cafe-societe.example.com/');
        expect(
          screen.queryByRole('link', { name: /intern to mid-level engineer at open-source foundation/i })
        ).not.toBeInTheDocument();
      } finally {
        i18n.addResourceBundle('en', 'translation', original, false, true);
      }
    });
  });
});
