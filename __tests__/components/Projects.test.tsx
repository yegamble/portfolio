'use client';
import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/hooks/usePretextHeight', () => ({
  usePretextHeight: () => ({ ref: { current: null }, style: {} }),
}));

vi.mock('@/data/projects', () => ({
  projectEntries: [
    {
      id: 'proj-alpha',
      repos: [
        { name: 'proj-alpha-core', url: 'https://github.com/example/proj-alpha-core' },
        { name: 'proj-alpha-ui', url: '#' },
      ],
      technologies: ['Go', 'PostgreSQL', 'Docker'],
      icon: 'layers',
    },
    {
      id: 'proj-beta',
      repos: [
        { name: 'proj-beta', url: 'https://github.com/example/proj-beta' },
      ],
      technologies: ['Next.js', 'TypeScript'],
      icon: 'folder',
    },
    {
      id: 'proj-gamma',
      repos: [
        { name: 'proj-gamma-web', url: '#' },
        { name: 'proj-gamma-api', url: '#' },
      ],
      technologies: ['TypeScript', 'Go', 'Redis'],
      icon: 'folder',
    },
    {
      id: 'proj-delta',
      repos: [
        { name: 'proj-delta-web', url: '#' },
        { name: 'proj-delta-api', url: '#' },
      ],
      technologies: ['Next.js', 'Go'],
      icon: 'layers',
    },
  ],
}));

// IntersectionObserver mock
beforeEach(() => {
  window.IntersectionObserver = vi.fn(function (
    this: IntersectionObserver,
    _callback: IntersectionObserverCallback
  ) {
    return {
      observe: vi.fn(),
      disconnect: vi.fn(),
      unobserve: vi.fn(),
      root: null,
      rootMargin: '',
      thresholds: [],
      takeRecords: () => [],
    };
  }) as unknown as typeof IntersectionObserver;
});

import i18n from '@/lib/i18n';
import Projects from '@/components/Projects';

// Translation items keyed to match mock project IDs
const testProjectItems = [
  {
    id: 'proj-alpha',
    title: 'Project Alpha',
    description: 'A streaming backend in Go with ActivityPub federation.',
  },
  {
    id: 'proj-beta',
    title: 'Project Beta',
    description: 'A browser-based audio mastering app.',
  },
  {
    id: 'proj-gamma',
    title: 'Project Gamma',
    description: 'A full-stack image gallery platform.',
  },
  {
    id: 'proj-delta',
    title: 'Project Delta',
    description: 'A token creation platform.',
  },
];

beforeEach(() => {
  const bundle = i18n.getResourceBundle('en', 'translation');
  i18n.addResourceBundle(
    'en',
    'translation',
    { ...bundle, projects: { ...bundle.projects, items: testProjectItems } },
    false,
    true
  );
});

afterEach(() => {
  // Restore fixture translations (setup.ts will re-apply on next test)
  const bundle = i18n.getResourceBundle('en', 'translation');
  const originalFixture = i18n.getResourceBundle('en', 'translation');
  i18n.addResourceBundle('en', 'translation', originalFixture, false, true);
});

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
      render(<Projects />);
      const divider = screen.getByRole('separator');
      expect(divider).toBeInTheDocument();
    });
  });

  describe('Project cards — 4 projects', () => {
    it('should render exactly 4 project cards via h3 headings', () => {
      render(<Projects />);
      const headings = screen.getAllByRole('heading', { level: 3 });
      expect(headings).toHaveLength(4);
    });

    it('should render project titles from translation', () => {
      render(<Projects />);
      expect(screen.getByRole('heading', { level: 3, name: /project alpha/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: /project beta/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: /project gamma/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: /project delta/i })).toBeInTheDocument();
    });
  });

  describe('Carousel structure', () => {
    it('should render a carousel container with snap classes', () => {
      const { container } = render(<Projects />);
      const carousel = container.querySelector('.snap-x');
      expect(carousel).toBeInTheDocument();
    });

    it('should render snap-mandatory on carousel container', () => {
      const { container } = render(<Projects />);
      const carousel = container.querySelector('.snap-mandatory');
      expect(carousel).toBeInTheDocument();
    });

    it('should render overflow-x-auto on carousel container', () => {
      const { container } = render(<Projects />);
      const carousel = container.querySelector('.overflow-x-auto');
      expect(carousel).toBeInTheDocument();
    });

    it('should render 2-column grid class for md breakpoint', () => {
      const { container } = render(<Projects />);
      const el = container.querySelector('[class*="md:grid-cols-2"]');
      expect(el).toBeInTheDocument();
    });

    it('should render dot indicators for carousel', () => {
      render(<Projects />);
      const dots = screen.getAllByRole('button', { name: /go to project/i });
      expect(dots).toHaveLength(4);
    });
  });

  describe('Repo links', () => {
    it('should render repo links for each project', () => {
      render(<Projects />);
      // proj-alpha has 2, proj-beta has 1, proj-gamma has 2, proj-delta has 2 = 7 total
      const repoLinks = screen.getAllByRole('link', { name: /view .+ on github/i });
      expect(repoLinks.length).toBe(7);
    });

    it('should render public repo links that open in new tab', () => {
      render(<Projects />);
      const publicLinks = screen
        .getAllByRole('link', { name: /view .+ on github/i })
        .filter((l) => l.getAttribute('href') !== '#');
      publicLinks.forEach((link) => {
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noreferrer noopener');
      });
    });

    it('should render the repo name as link text', () => {
      render(<Projects />);
      expect(screen.getByRole('link', { name: /view proj-alpha-core on github/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /view proj-beta on github/i })).toBeInTheDocument();
    });
  });

  describe('Technology labels', () => {
    it('should render technology labels for each project', () => {
      render(<Projects />);
      const techLists = screen.getAllByRole('list', { name: /technologies used/i });
      expect(techLists).toHaveLength(4);
    });

    it('should render technologies for first project', () => {
      render(<Projects />);
      const techLists = screen.getAllByRole('list', { name: /technologies used/i });
      expect(within(techLists[0]).getByText('Go')).toBeInTheDocument();
      expect(within(techLists[0]).getByText('PostgreSQL')).toBeInTheDocument();
      expect(within(techLists[0]).getByText('Docker')).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('should render SVG icons for each project card', () => {
      const { container } = render(<Projects />);
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Empty projects', () => {
    it('should not render the section when projects array is empty', () => {
      const bundle = i18n.getResourceBundle('en', 'translation');
      i18n.addResourceBundle(
        'en',
        'translation',
        { ...bundle, projects: { ...bundle.projects, items: [] } },
        false,
        true
      );

      const { container } = render(<Projects />);
      expect(screen.queryByRole('region')).not.toBeInTheDocument();
      expect(container.innerHTML).toBe('');

      i18n.addResourceBundle(
        'en',
        'translation',
        { ...bundle, projects: { ...bundle.projects, items: testProjectItems } },
        false,
        true
      );
    });
  });

  describe('Data integrity', () => {
    it('should skip translation projects that do not have metadata entries', () => {
      const bundle = i18n.getResourceBundle('en', 'translation');
      const withUnknownEntry = [
        ...testProjectItems,
        {
          id: 'unknown-project',
          title: 'Ghost Project',
          description: 'Should not render without metadata.',
        },
      ];

      i18n.addResourceBundle(
        'en',
        'translation',
        { ...bundle, projects: { ...bundle.projects, items: withUnknownEntry } },
        false,
        true
      );

      try {
        render(<Projects />);
        expect(screen.queryByText('Ghost Project')).not.toBeInTheDocument();
      } finally {
        i18n.addResourceBundle(
          'en',
          'translation',
          { ...bundle, projects: { ...bundle.projects, items: testProjectItems } },
          false,
          true
        );
      }
    });
  });
});
