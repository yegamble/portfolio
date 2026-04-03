import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import i18n from '@/lib/i18n';
import ScrollHeader from '@/components/ScrollHeader';
import About from '@/components/About';
import Experience from '@/components/Experience';
import Projects from '@/components/Projects';
import Footer from '@/components/Footer';

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

describe('i18n Integration - English Mode', () => {
  it('should render nav items in English', () => {
    render(<ScrollHeader />);
    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(within(nav).getByText('About')).toBeInTheDocument();
    expect(within(nav).getByText('Experience')).toBeInTheDocument();
    expect(within(nav).getByText('Projects')).toBeInTheDocument();
  });

  it('should render hero content in English', () => {
    render(<ScrollHeader />);
    expect(screen.getByText('Yosef Gamble', { selector: 'section p' })).toBeInTheDocument();
    expect(screen.getByText('Senior Software Engineer', { selector: 'section p' })).toBeInTheDocument();
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent(/Senior Go & TypeScript engineer/);
  });

  it('should render profile picture with English alt text', () => {
    render(<ScrollHeader />);
    const img = screen.getByRole('img', { name: /yosef gamble profile photo/i });
    expect(img).toBeInTheDocument();
  });

  it('should render About section heading in English', () => {
    render(<About />);
    const section = screen.getByRole('region', { name: /about me/i });
    const heading = within(section).getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('About');
  });

  it('should render Experience section heading in English', () => {
    render(<Experience />);
    const section = screen.getByRole('region', { name: /work experience/i });
    const heading = within(section).getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Experience');
  });

  it('should render Projects section heading in English', () => {
    render(<Projects />);
    const section = screen.getByRole('region', { name: /selected projects/i });
    const heading = within(section).getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Projects');
  });

  it('should render resume link text in English', () => {
    render(<Experience />);
    expect(screen.getByText(/View Full Résumé/)).toBeInTheDocument();
  });

  it('should render footer attribution in English', () => {
    render(<Footer />);
    expect(screen.getByText(/Coded in/)).toBeInTheDocument();
    expect(screen.getByText(/Built with/)).toBeInTheDocument();
  });
});

describe('i18n Integration - Hebrew Mode', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('he');
  });

  it('should render nav items in Hebrew', () => {
    render(<ScrollHeader />);
    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(within(nav).getByText('אודות')).toBeInTheDocument();
    expect(within(nav).getByText('ניסיון')).toBeInTheDocument();
    expect(within(nav).getByText('פרויקטים')).toBeInTheDocument();
  });

  it('should render hero name in Hebrew', () => {
    render(<ScrollHeader />);
    expect(screen.getByText('יוסף גמבל', { selector: 'section p' })).toBeInTheDocument();
  });

  it('should render hero title in Hebrew', () => {
    render(<ScrollHeader />);
    expect(screen.getByText('מהנדס תוכנה בכיר', { selector: 'section p' })).toBeInTheDocument();
  });

  it('should render hero tagline in Hebrew', () => {
    render(<ScrollHeader />);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent(/מהנדס Go ו-TypeScript בכיר/);
  });

  it('should render profile picture with Hebrew alt text', () => {
    render(<ScrollHeader />);
    const img = screen.getByRole('img', { name: /תמונת פרופיל של יוסף גמבל/ });
    expect(img).toBeInTheDocument();
  });

  it('should render About section heading in Hebrew', () => {
    render(<About />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('אודות');
  });

  it('should render About section with Hebrew aria-label', () => {
    render(<About />);
    expect(screen.getByRole('region', { name: 'אודותיי' })).toBeInTheDocument();
  });

  it('should render Experience section heading in Hebrew', () => {
    render(<Experience />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('ניסיון');
  });

  it('should render Experience job titles in Hebrew', () => {
    render(<Experience />);
    const section = screen.getByRole('region', { name: /ניסיון תעסוקתי/ });
    expect(section).toHaveTextContent(/מהנדס פול סטק/);
    expect(section).toHaveTextContent(/מפתח תוכנה/);
  });

  it('should render Experience dates in Hebrew', () => {
    render(<Experience />);
    const section = screen.getByRole('region', { name: /ניסיון תעסוקתי/ });
    expect(section).toHaveTextContent(/2024 — הווה/);
  });

  it('should render resume link in Hebrew', () => {
    render(<Experience />);
    expect(screen.getByText(/צפה בקורות חיים מלאים/)).toBeInTheDocument();
  });

  it('should render Projects section heading in Hebrew', () => {
    render(<Projects />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('פרויקטים');
  });

  it('should render project descriptions in Hebrew', () => {
    render(<Projects />);
    const section = screen.getByRole('region', { name: /פרויקטים נבחרים/ });
    expect(section).toHaveTextContent(/מנוע עיבוד נתונים מבוזר/);
  });

  it('should render footer attribution in Hebrew', () => {
    render(<Footer />);
    expect(screen.getByText(/נכתב ב/)).toBeInTheDocument();
    expect(screen.getByText(/נבנה עם/)).toBeInTheDocument();
  });
});

describe('i18n Integration - Language Toggle Flow', () => {
  it('should switch all content when toggling language', async () => {
    render(<ScrollHeader />);

    // Verify English
    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(within(nav).getByText('About')).toBeInTheDocument();

    // Toggle to Hebrew
    const user = userEvent.setup();
    const toggleBtn = screen.getByRole('button', { name: /switch to hebrew/i });
    await user.click(toggleBtn);

    // Verify Hebrew
    expect(within(nav).getByText('אודות')).toBeInTheDocument();
    expect(within(nav).getByText('ניסיון')).toBeInTheDocument();
    expect(within(nav).getByText('פרויקטים')).toBeInTheDocument();
  });

  it('should toggle back to English from Hebrew', async () => {
    const user = userEvent.setup();
    await i18n.changeLanguage('he');
    render(<ScrollHeader />);

    const toggleBtn = screen.getByRole('button', { name: /עבור לאנגלית/i });
    await user.click(toggleBtn);

    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(within(nav).getByText('About')).toBeInTheDocument();
  });

  it('should render language toggle button in navbar', () => {
    render(<ScrollHeader />);
    expect(screen.getByRole('button', { name: /switch to hebrew/i })).toBeInTheDocument();
  });
});

describe('i18n Regression - Structural integrity across languages', () => {
  it('should preserve anchor hrefs when switching to Hebrew', async () => {
    render(<ScrollHeader />);
    await i18n.changeLanguage('he');
    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    const links = within(nav).getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '#about');
    expect(links[1]).toHaveAttribute('href', '#experience');
    expect(links[2]).toHaveAttribute('href', '#projects');
  });

  it('should preserve realestate.co.nz link in Hebrew About', async () => {
    await i18n.changeLanguage('he');
    render(<About />);
    const link = screen.getByRole('link', { name: /realestate\.co\.nz/i });
    expect(link).toHaveAttribute('href', 'https://www.realestate.co.nz');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('should preserve company URLs in Hebrew Experience', async () => {
    await i18n.changeLanguage('he');
    render(<Experience />);
    const links = screen.getAllByRole('link').filter(
      (l) => l.getAttribute('target') === '_blank'
    );
    const hrefs = links.map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('https://github.com/yegamble');
    expect(hrefs).toContain('https://www.realestate.co.nz');
  });

  it('should preserve resume link href in Hebrew Experience', async () => {
    await i18n.changeLanguage('he');
    render(<Experience />);
    const resumeLink = screen.getByRole('link', { name: /צפה בקורות חיים מלאים/ });
    expect(resumeLink).toHaveAttribute('href', '/resume.pdf');
  });

  it('should preserve technology tags in Hebrew Experience (not translated)', async () => {
    await i18n.changeLanguage('he');
    render(<Experience />);
    const techLists = screen.getAllByRole('list', { name: /טכנולוגיות בשימוש/ });
    expect(techLists).toHaveLength(3);
    expect(within(techLists[0]).getByText('Go')).toBeInTheDocument();
    expect(within(techLists[0]).getByText('Docker')).toBeInTheDocument();
  });

  it('should preserve project URLs in Hebrew Projects', async () => {
    await i18n.changeLanguage('he');
    render(<Projects />);
    const projectLinks = screen.getAllByRole('link');
    expect(projectLinks.length).toBeGreaterThanOrEqual(2);
  });

  it('should preserve footer tool links in Hebrew', async () => {
    await i18n.changeLanguage('he');
    render(<Footer />);
    const vscodeLink = screen.getByRole('link', { name: /visual studio code/i });
    expect(vscodeLink).toHaveAttribute('href', 'https://code.visualstudio.com/');
    const tailwindLink = screen.getByRole('link', { name: /tailwind css/i });
    expect(tailwindLink).toHaveAttribute('href', 'https://tailwindcss.com/');
  });

  it('should render three experience entries in Hebrew', async () => {
    await i18n.changeLanguage('he');
    render(<Experience />);
    const section = screen.getByRole('region', { name: /ניסיון תעסוקתי/ });
    const ol = section.querySelector('ol');
    const items = ol!.querySelectorAll(':scope > li');
    expect(items).toHaveLength(3);
  });

  it('should render two project cards in Hebrew', async () => {
    await i18n.changeLanguage('he');
    render(<Projects />);
    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings).toHaveLength(2);
  });

  it('should render three about paragraphs in Hebrew', async () => {
    await i18n.changeLanguage('he');
    render(<About />);
    const section = screen.getByRole('region', { name: 'אודותיי' });
    const paragraphs = section.querySelectorAll('p');
    expect(paragraphs).toHaveLength(3);
  });

  it('should keep social link hrefs unchanged in Hebrew', async () => {
    await i18n.changeLanguage('he');
    render(<Footer />);
    expect(screen.getByRole('link', { name: /github/i })).toHaveAttribute(
      'href',
      'https://github.com/yegamble'
    );
    expect(screen.getByRole('link', { name: /linkedin/i })).toHaveAttribute(
      'href',
      'https://linkedin.com/in/yosefgamble'
    );
  });
});

describe('i18n Regression - RTL design classes', () => {
  it('should use logical border property (border-s) on social links in ScrollHeader', () => {
    render(<ScrollHeader />);
    const { container } = render(<ScrollHeader />);
    const socialContainer = container.querySelector('.sm\\:border-s');
    expect(socialContainer).toBeInTheDocument();
  });

  it('should use logical padding (ps-) on social links in ScrollHeader', () => {
    const { container } = render(<ScrollHeader />);
    const socialContainer = container.querySelector('.ps-2');
    expect(socialContainer).toBeInTheDocument();
  });

  it('should apply rtl:rotate-180 on resume arrow icon', () => {
    const { container } = render(<Experience />);
    const rtlRotated = container.querySelector('.rtl\\:rotate-180');
    expect(rtlRotated).toBeInTheDocument();
  });

  it('should apply ms-1 (logical margin) on experience arrow icons', () => {
    const { container } = render(<Experience />);
    const arrows = container.querySelectorAll('.ms-1');
    expect(arrows.length).toBeGreaterThan(0);
  });
});
