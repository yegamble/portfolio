import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import i18n from '@/lib/i18n';
import ScrollHeader from '@/components/ScrollHeader';
import About from '@/components/About';
import Experience from '@/components/Experience';
import Projects from '@/components/Projects';
import Footer from '@/components/Footer';

import testEn from '../fixtures/translations/en.json';
import testHe from '../fixtures/translations/he.json';

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
      companyUrl: '#',
      technologies: ['Python', 'Kotlin', 'Swift', 'Unicode', 'CI/CD'],
    },
  ],
}));

vi.mock('@/data/projects', () => ({
  projectEntries: [
    {
      id: 'vidra',
      repos: [
        { name: 'vidra-core', url: 'https://github.com/yegamble/vidra-core' },
        { name: 'vidra-user', url: '#' },
      ],
      technologies: ['Go', 'ActivityPub', 'Docker'],
      icon: 'layers',
    },
    {
      id: 'aurialis',
      repos: [
        { name: 'Aurialis', url: 'https://github.com/yegamble/Aurialis' },
      ],
      technologies: ['Next.js', 'TypeScript'],
      icon: 'layers',
    },
    {
      id: 'goimg',
      repos: [
        { name: 'goimg-user', url: '#' },
        { name: 'goimg-datalayer', url: '#' },
      ],
      technologies: ['Go', 'PostgreSQL'],
      icon: 'folder',
    },
    {
      id: 'iota-token-creator',
      repos: [
        { name: 'iota-token-creator-web', url: '#' },
        { name: 'iota-token-creator-api', url: '#' },
      ],
      technologies: ['Next.js', 'Go'],
      icon: 'folder',
    },
  ],
}));

beforeEach(async () => {
  await i18n.changeLanguage('en');
  document.documentElement.lang = 'en';
  document.documentElement.dir = 'ltr';

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

describe('Cipher Integration - DOM structure consistency across languages', () => {
  describe('About section', () => {
    it('should render three paragraphs in English', () => {
      render(<About />);
      const section = screen.getByRole('region', { name: /about me/i });
      const paragraphs = section.querySelectorAll('p');
      expect(paragraphs).toHaveLength(3);
    });

    it('should render three paragraphs in Hebrew', async () => {
      await i18n.changeLanguage('he');
      render(<About />);
      const section = screen.getByRole('region', { name: 'אודותיי' });
      const paragraphs = section.querySelectorAll('p');
      expect(paragraphs).toHaveLength(3);
    });

    it('should render the company link in paragraph 2 in English', () => {
      render(<About />);
      const link = screen.getByRole('link', { name: /test-company\.example\.com/i });
      expect(link).toHaveAttribute('href');
      const section = screen.getByRole('region', { name: /about me/i });
      const paragraphs = section.querySelectorAll('p');
      expect(paragraphs[1]).toContainElement(link);
    });

    it('should render the company link in paragraph 2 in Hebrew', async () => {
      await i18n.changeLanguage('he');
      render(<About />);
      const link = screen.getByRole('link', { name: /test-company\.example\.com/i });
      expect(link).toHaveAttribute('href');
      const section = screen.getByRole('region', { name: 'אודותיי' });
      const paragraphs = section.querySelectorAll('p');
      expect(paragraphs[1]).toContainElement(link);
    });

    it('should render p2 as prefix text + link + suffix text in English', () => {
      render(<About />);
      const section = screen.getByRole('region', { name: /about me/i });
      const paragraphs = section.querySelectorAll('p');
      const p2 = paragraphs[1];
      expect(p2).toHaveTextContent(/^At\s+test-company\.example\.com/);
      expect(p2).toHaveTextContent(/became lead engineer/);
    });

    it('should render p2 as prefix text + link + suffix text in Hebrew', async () => {
      await i18n.changeLanguage('he');
      render(<About />);
      const section = screen.getByRole('region', { name: 'אודותיי' });
      const paragraphs = section.querySelectorAll('p');
      const p2 = paragraphs[1];
      expect(p2).toHaveTextContent(/ב-/);
      expect(p2).toHaveTextContent(/test-company\.example\.com/);
      expect(p2).toHaveTextContent(/הפכתי למהנדס/);
    });

    it('should have one heading in English and Hebrew', async () => {
      const { unmount } = render(<About />);
      const enSection = screen.getByRole('region', { name: /about me/i });
      expect(within(enSection).getAllByRole('heading', { level: 2 })).toHaveLength(1);
      unmount();

      await i18n.changeLanguage('he');
      render(<About />);
      const heSection = screen.getByRole('region', { name: 'אודותיי' });
      expect(within(heSection).getAllByRole('heading', { level: 2 })).toHaveLength(1);
    });
  });

  describe('Experience section', () => {
    it('should render three list items in English', () => {
      render(<Experience />);
      const section = screen.getByRole('region', { name: /work experience/i });
      const ol = section.querySelector('ol');
      const items = ol!.querySelectorAll(':scope > li');
      expect(items).toHaveLength(3);
    });

    it('should render three list items in Hebrew', async () => {
      await i18n.changeLanguage('he');
      render(<Experience />);
      const section = screen.getByRole('region', { name: /ניסיון תעסוקתי/ });
      const ol = section.querySelector('ol');
      const items = ol!.querySelectorAll(':scope > li');
      expect(items).toHaveLength(3);
    });

    it('should render all three items including the first after switching to Hebrew', async () => {
      await i18n.changeLanguage('he');
      render(<Experience />);
      const section = screen.getByRole('region', { name: /ניסיון תעסוקתי/ });
      expect(section).toHaveTextContent('Edge Corp');
      expect(section).toHaveTextContent('Cafe Societe');
      expect(section).toHaveTextContent('Open-Source Foundation');
    });

    it('should preserve three technology tag lists in both languages', async () => {
      const { unmount } = render(<Experience />);
      const enTechLists = screen.getAllByRole('list', { name: /technologies used/i });
      expect(enTechLists).toHaveLength(3);
      unmount();

      await i18n.changeLanguage('he');
      render(<Experience />);
      const heTechLists = screen.getAllByRole('list', { name: /טכנולוגיות בשימוש/ });
      expect(heTechLists).toHaveLength(3);
    });

    it('should preserve three date headers in both languages', async () => {
      const { unmount } = render(<Experience />);
      let section = screen.getByRole('region', { name: /work experience/i });
      let dateHeaders = section.querySelectorAll('header[aria-label]');
      expect(dateHeaders).toHaveLength(3);
      unmount();

      await i18n.changeLanguage('he');
      render(<Experience />);
      section = screen.getByRole('region', { name: /ניסיון תעסוקתי/ });
      dateHeaders = section.querySelectorAll('header[aria-label]');
      expect(dateHeaders).toHaveLength(3);
    });

    it('should preserve the two external company links in both languages', async () => {
      const { unmount } = render(<Experience />);
      let section = screen.getByRole('region', { name: /work experience/i });
      let companyLinks = within(section).getAllByRole('link').filter(
        (l) => l.getAttribute('target') === '_blank'
      );
      expect(companyLinks).toHaveLength(2);
      unmount();

      await i18n.changeLanguage('he');
      render(<Experience />);
      section = screen.getByRole('region', { name: /ניסיון תעסוקתי/ });
      companyLinks = within(section).getAllByRole('link').filter(
        (l) => l.getAttribute('target') === '_blank'
      );
      expect(companyLinks).toHaveLength(2);
    });
  });

  describe('ScrollHeader section', () => {
    it('should render three nav links in both languages', async () => {
      const { unmount } = render(<ScrollHeader />);
      let nav = screen.getByRole('navigation', { name: /main navigation/i });
      expect(within(nav).getAllByRole('link')).toHaveLength(3);
      unmount();

      await i18n.changeLanguage('he');
      render(<ScrollHeader />);
      nav = screen.getByRole('navigation', { name: /main navigation/i });
      expect(within(nav).getAllByRole('link')).toHaveLength(3);
    });

    it('should render hero elements in both languages', async () => {
      const { unmount } = render(<ScrollHeader />);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      unmount();

      await i18n.changeLanguage('he');
      render(<ScrollHeader />);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });

  describe('Projects section', () => {
    it('should render four project cards in both languages', async () => {
      const { unmount } = render(<Projects />);
      expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(4);
      unmount();

      await i18n.changeLanguage('he');
      render(<Projects />);
      expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(4);
    });

    it('should preserve four technology lists in both languages', async () => {
      const { unmount } = render(<Projects />);
      let techLists = screen.getAllByRole('list', { name: /technologies used/i });
      expect(techLists).toHaveLength(4);
      unmount();

      await i18n.changeLanguage('he');
      render(<Projects />);
      techLists = screen.getAllByRole('list', { name: /טכנולוגיות בשימוש/ });
      expect(techLists).toHaveLength(4);
    });

    it('should preserve project repo links in both languages', async () => {
      const { unmount } = render(<Projects />);
      expect(screen.getAllByRole('link').length).toBeGreaterThanOrEqual(4);
      unmount();

      await i18n.changeLanguage('he');
      render(<Projects />);
      expect(screen.getAllByRole('link').length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Footer section', () => {
    it('should render four social links in both languages', async () => {
      const { unmount } = render(<Footer />);
      const enLinks = [
        screen.getByRole('link', { name: /github/i }),
        screen.getByRole('link', { name: /linkedin/i }),
        screen.getByRole('link', { name: /^email$/i }),
        screen.getByRole('link', { name: /secure email/i }),
      ];
      expect(enLinks).toHaveLength(4);
      unmount();

      await i18n.changeLanguage('he');
      render(<Footer />);
      const heLinks = [
        screen.getByRole('link', { name: /github/i }),
        screen.getByRole('link', { name: /linkedin/i }),
        screen.getByRole('link', { name: /אימייל$/i }),
        screen.getByRole('link', { name: /אימייל מאובטח/i }),
      ];
      expect(heLinks).toHaveLength(4);
    });

    it('should preserve three tool links in both languages', async () => {
      const { unmount } = render(<Footer />);
      let vscodeLink = screen.getByRole('link', { name: /visual studio code/i });
      let tailwindLink = screen.getByRole('link', { name: /tailwind css/i });
      let interLink = screen.getByRole('link', { name: 'Inter' });
      expect(vscodeLink).toBeInTheDocument();
      expect(tailwindLink).toBeInTheDocument();
      expect(interLink).toBeInTheDocument();
      unmount();

      await i18n.changeLanguage('he');
      render(<Footer />);
      vscodeLink = screen.getByRole('link', { name: /visual studio code/i });
      tailwindLink = screen.getByRole('link', { name: /tailwind css/i });
      interLink = screen.getByRole('link', { name: 'Inter' });
      expect(vscodeLink).toBeInTheDocument();
      expect(tailwindLink).toBeInTheDocument();
      expect(interLink).toBeInTheDocument();
    });
  });
});

describe('Cipher Integration - Language switch preserves structure', () => {
  it('should preserve About paragraph count after switching language', async () => {
    render(<About />);

    let section = screen.getByRole('region', { name: /about me/i });
    expect(section.querySelectorAll('p')).toHaveLength(3);

    await i18n.changeLanguage('he');

    section = screen.getByRole('region', { name: 'אודותיי' });
    expect(section.querySelectorAll('p')).toHaveLength(3);
  });

  it('should preserve Experience list item count after switching language', async () => {
    render(<Experience />);

    let section = screen.getByRole('region', { name: /work experience/i });
    let items = section.querySelector('ol')!.querySelectorAll(':scope > li');
    expect(items).toHaveLength(3);

    await i18n.changeLanguage('he');

    section = screen.getByRole('region', { name: /ניסיון תעסוקתי/ });
    items = section.querySelector('ol')!.querySelectorAll(':scope > li');
    expect(items).toHaveLength(3);
  });

  it('should preserve Projects card count after switching language', async () => {
    render(<Projects />);

    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(4);

    await i18n.changeLanguage('he');

    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(4);
  });

  it('should preserve About p2 link after switching language', async () => {
    render(<About />);

    let link = screen.getByRole('link', { name: /test-company\.example\.com/i });
    expect(link).toHaveAttribute('href');

    await i18n.changeLanguage('he');

    link = screen.getByRole('link', { name: /test-company\.example\.com/i });
    expect(link).toHaveAttribute('href');
  });

  it('should preserve all Experience company link hrefs after switching language', async () => {
    render(<Experience />);

    let section = screen.getByRole('region', { name: /work experience/i });
    let companyLinks = within(section).getAllByRole('link').filter(
      (l) => l.getAttribute('target') === '_blank'
    );
    const enHrefs = companyLinks.map((l) => l.getAttribute('href')).sort();

    await i18n.changeLanguage('he');

    section = screen.getByRole('region', { name: /ניסיון תעסוקתי/ });
    companyLinks = within(section).getAllByRole('link').filter(
      (l) => l.getAttribute('target') === '_blank'
    );
    const heHrefs = companyLinks.map((l) => l.getAttribute('href')).sort();

    expect(heHrefs).toEqual(enHrefs);
  });

  it('should preserve Footer tool link hrefs after switching language', async () => {
    render(<Footer />);

    const getToolHrefs = () =>
      screen.getAllByRole('link')
        .filter((l) => l.getAttribute('target') === '_blank')
        .map((l) => l.getAttribute('href'))
        .sort();

    const enHrefs = getToolHrefs();

    await i18n.changeLanguage('he');

    const heHrefs = getToolHrefs();
    expect(heHrefs).toEqual(enHrefs);
  });
});
