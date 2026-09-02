import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/data/projects', () => ({
  projectEntries: [
    {
      id: 'proj-alpha',
      repos: [
        {
          name: 'proj-alpha-core',
          url: 'https://github.com/example/proj-alpha-core',
        },
        { name: 'proj-alpha-ui', url: '#' },
      ],
      technologies: ['Go', 'PostgreSQL', 'Docker'],
      icon: 'layers',
    },
    {
      id: 'proj-beta',
      repos: [{ name: 'proj-beta', url: 'https://github.com/example/proj-beta' }],
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

// Every scroll-behaviour decision reads this query, so the specs drive it
// directly rather than through a global jsdom stub.
function mockReducedMotion(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query === '(prefers-reduced-motion: reduce)' ? matches : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

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

// Snapshot the fixture bundle BEFORE any test mutates it: `afterEach` used to
// read the bundle it was restoring, so it wrote the mutated one back.
const fixtureBundle = i18n.getResourceBundle('en', 'translation');

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
  i18n.addResourceBundle(
    'en',
    'translation',
    {
      ...fixtureBundle,
      projects: { ...fixtureBundle.projects, items: testProjectItems },
    },
    false,
    true
  );
});

afterEach(() => {
  i18n.addResourceBundle('en', 'translation', fixtureBundle, false, true);
});

describe('Projects', () => {
  describe('Section structure', () => {
    it('should render the projects section with correct aria label', () => {
      render(<Projects />);
      expect(screen.getByRole('region', { name: /selected projects/i })).toBeInTheDocument();
    });

    it('should have the correct section id for anchor navigation', () => {
      render(<Projects />);
      const section = screen.getByRole('region', {
        name: /selected projects/i,
      });
      expect(section).toHaveAttribute('id', 'projects');
    });
  });

  describe('Section header', () => {
    it('should render the "Projects" heading via SectionHeader', () => {
      render(<Projects />);
      const section = screen.getByRole('region', {
        name: /selected projects/i,
      });
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
    it('should render dot indicators for carousel', () => {
      render(<Projects />);
      const dots = within(screen.getByRole('group', { name: /project pagination/i })).getAllByRole(
        'button'
      );
      expect(dots).toHaveLength(4);
    });
  });

  describe('Carousel dots', () => {
    const dot = (name: RegExp) => screen.getByRole('button', { name });

    const originalMatchMedia = window.matchMedia;
    const originalScrollIntoView = Element.prototype.scrollIntoView;

    afterEach(() => {
      window.matchMedia = originalMatchMedia;
      Element.prototype.scrollIntoView = originalScrollIntoView;
    });

    it('should name each dot after the card it scrolls to', () => {
      render(<Projects />);
      expect(dot(/project alpha/i)).toBeInTheDocument();
      expect(dot(/project beta/i)).toBeInTheDocument();
      expect(dot(/project gamma/i)).toBeInTheDocument();
      expect(dot(/project delta/i)).toBeInTheDocument();
    });

    it('should group the dots under a name of their own', () => {
      render(<Projects />);
      // Not the section's name — the group is the pagination, not the projects.
      const group = screen.getByRole('group', { name: /project pagination/i });
      expect(within(group).getAllByRole('button')).toHaveLength(4);
    });

    // The 24px target itself is measured from a real box in
    // cypress/e2e/portfolio.cy.ts, and the dot's contrast is Lighthouse's job.
    it('should keep the dot itself out of the accessible name', () => {
      render(<Projects />);
      const button = dot(/project alpha/i);

      expect(button.querySelector('span')).toHaveAttribute('aria-hidden', 'true');
      expect(button).toHaveAccessibleName('Project Alpha');
    });

    it('should mark the visible card with aria-current', () => {
      render(<Projects />);
      expect(dot(/project alpha/i)).toHaveAttribute('aria-current', 'true');
      expect(dot(/project beta/i)).not.toHaveAttribute('aria-current');
    });

    it('should scroll the chosen card into view smoothly by default', async () => {
      const user = userEvent.setup();
      const scrollIntoView = vi.fn();
      Element.prototype.scrollIntoView = scrollIntoView;
      mockReducedMotion(false);

      render(<Projects />);
      await user.click(dot(/project gamma/i));

      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    });

    it('should jump instead of animating when the reader asks for reduced motion', async () => {
      const user = userEvent.setup();
      const scrollIntoView = vi.fn();
      Element.prototype.scrollIntoView = scrollIntoView;
      mockReducedMotion(true);

      render(<Projects />);
      await user.click(dot(/project gamma/i));

      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: 'auto',
        block: 'nearest',
        inline: 'center',
      });
    });
  });

  describe('Repo links', () => {
    it('should render repo links for each project', () => {
      render(<Projects />);
      // proj-alpha has 2, proj-beta has 1, proj-gamma has 2, proj-delta has 2 = 7 total
      const repoLinks = screen.getAllByRole('link', { name: /on github/i });
      expect(repoLinks.length).toBe(7);
    });

    it('should render public repo links that open in new tab', () => {
      render(<Projects />);
      const publicLinks = screen
        .getAllByRole('link', { name: /on github/i })
        .filter((l) => l.getAttribute('href') !== '#');
      publicLinks.forEach((link) => {
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noreferrer noopener');
      });
    });

    it('should lead the accessible name with the visible repo name', () => {
      render(<Projects />);
      // An aria-label would have replaced the visible name outright — and taken
      // the lang="en" marking with it.
      const link = screen.getByRole('link', {
        name: 'proj-alpha-core on GitHub (opens in a new tab)',
      });
      expect(link).not.toHaveAttribute('aria-label');
      expect(within(link).getByText('proj-alpha-core')).toHaveAttribute('lang', 'en');
    });

    it('should leave the new-tab notice off a link that stays in this tab', () => {
      render(<Projects />);
      const sameTab = screen.getByRole('link', { name: 'proj-alpha-ui on GitHub' });
      expect(sameTab).toHaveAttribute('href', '#');
      expect(sameTab).not.toHaveAttribute('target');
    });
  });

  describe('Technology labels', () => {
    it('should render technology labels for each project', () => {
      render(<Projects />);
      const techLists = screen.getAllByRole('list', {
        name: /technologies used/i,
      });
      expect(techLists).toHaveLength(4);
    });

    it('should mark the untranslated technology names as English', () => {
      render(<Projects />);
      const techLists = screen.getAllByRole('list', {
        name: /technologies used/i,
      });
      within(techLists[0])
        .getAllByRole('listitem')
        .forEach((item) => {
          expect(item).toHaveAttribute('lang', 'en');
        });
    });

    it('should mark the untranslated repo names as English', () => {
      render(<Projects />);
      const repoLink = screen.getByRole('link', { name: /^proj-alpha-core on github/i });
      expect(within(repoLink).getByText('proj-alpha-core')).toHaveAttribute('lang', 'en');
    });

    it('should render technologies for first project', () => {
      render(<Projects />);
      const techLists = screen.getAllByRole('list', {
        name: /technologies used/i,
      });
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
        {
          ...bundle,
          projects: { ...bundle.projects, items: testProjectItems },
        },
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
        {
          ...bundle,
          projects: { ...bundle.projects, items: withUnknownEntry },
        },
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
          {
            ...bundle,
            projects: { ...bundle.projects, items: testProjectItems },
          },
          false,
          true
        );
      }
    });
  });
});
