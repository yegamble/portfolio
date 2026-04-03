import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import i18n from '@/lib/i18n';
import ScrollHeader from '@/components/ScrollHeader';
import About from '@/components/About';
import Experience from '@/components/Experience';
import Projects from '@/components/Projects';
import Footer from '@/components/Footer';

import testEn from '../fixtures/translations/en.json';
import testHe from '../fixtures/translations/he.json';
import testRu from '../fixtures/translations/ru.json';

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
      id: 'uber-proj',
      url: 'https://example.com/unicode-engine',
      technologies: ['C++', 'Rust', 'WASM'],
      icon: 'folder',
    },
    {
      id: 'nihon-proj',
      url: '#',
      technologies: ['Python', 'TensorFlow', 'FastAPI'],
      icon: 'layers',
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
    expect(screen.getByText(testEn.hero.name, { selector: 'section p' })).toBeInTheDocument();
    expect(screen.getByText(testEn.hero.title, { selector: 'section p' })).toBeInTheDocument();
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent(/Senior C\+\+, Rust & Go engineer/);
  });

  it('should render profile picture with English alt text', () => {
    render(<ScrollHeader />);
    const img = screen.getByRole('img', { name: new RegExp(testEn.hero.profileAlt, 'i') });
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
    expect(screen.getByText(/View Full Resume/)).toBeInTheDocument();
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
    expect(screen.getByText(testHe.hero.name, { selector: 'section p' })).toBeInTheDocument();
  });

  it('should render hero title in Hebrew', () => {
    render(<ScrollHeader />);
    expect(screen.getByText(testHe.hero.title, { selector: 'section p' })).toBeInTheDocument();
  });

  it('should render hero tagline in Hebrew', () => {
    render(<ScrollHeader />);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent(/C\+\+/);
    expect(h1).toHaveTextContent(/Rust/);
  });

  it('should render profile picture with Hebrew alt text', () => {
    render(<ScrollHeader />);
    const img = screen.getByRole('img', { name: new RegExp(testHe.hero.profileAlt) });
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
    expect(section).toHaveTextContent(/מהנדס\/ת ראשי\/ת/);
    expect(section).toHaveTextContent(/מתמחה עד מהנדס\/ת ביניים/);
  });

  it('should render Experience dates in Hebrew', () => {
    render(<Experience />);
    const section = screen.getByRole('region', { name: /ניסיון תעסוקתי/ });
    expect(section).toHaveTextContent(/2042 — הווה/);
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
    expect(section).toHaveTextContent(/מעבד טקסט בזמן-אמת/);
  });

  it('should render footer attribution in Hebrew', () => {
    render(<Footer />);
    expect(screen.getByText(/נכתב ב/)).toBeInTheDocument();
    expect(screen.getByText(/נבנה עם/)).toBeInTheDocument();
  });
});

describe('i18n Integration - Russian Mode', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('ru');
  });

  it('should render nav items in Russian', () => {
    render(<ScrollHeader />);
    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(within(nav).getByText('Обо мне')).toBeInTheDocument();
    expect(within(nav).getByText('Опыт')).toBeInTheDocument();
    expect(within(nav).getByText('Проекты')).toBeInTheDocument();
  });

  it('should render hero name in Russian', () => {
    render(<ScrollHeader />);
    expect(screen.getByText(testRu.hero.name, { selector: 'section p' })).toBeInTheDocument();
  });

  it('should render hero title in Russian', () => {
    render(<ScrollHeader />);
    expect(screen.getByText(testRu.hero.title, { selector: 'section p' })).toBeInTheDocument();
  });

  it('should render hero tagline in Russian', () => {
    render(<ScrollHeader />);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent(/Старший инженер C\+\+/);
  });

  it('should render About section heading in Russian', () => {
    render(<About />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Обо мне');
  });

  it('should render About section with Russian aria-label', () => {
    render(<About />);
    expect(screen.getByRole('region', { name: 'Обо мне' })).toBeInTheDocument();
  });

  it('should render Experience section heading in Russian', () => {
    render(<Experience />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Опыт');
  });

  it('should render Experience job titles in Russian', () => {
    render(<Experience />);
    const section = screen.getByRole('region', { name: /Опыт работы/ });
    expect(section).toHaveTextContent(/Главный инженер/);
    expect(section).toHaveTextContent(/Стажёр/);
  });

  it('should render resume link in Russian', () => {
    render(<Experience />);
    expect(screen.getByText(/Посмотреть полное резюме/)).toBeInTheDocument();
  });

  it('should render Projects section heading in Russian', () => {
    render(<Projects />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Проекты');
  });

  it('should render footer attribution in Russian', () => {
    render(<Footer />);
    expect(screen.getByText(/Написано в/)).toBeInTheDocument();
    expect(screen.getByText(/Создано с помощью/)).toBeInTheDocument();
  });

  it('should preserve company link to test-company in Russian About', () => {
    render(<About />);
    const link = screen.getByRole('link', { name: /test-company\.example\.com/i });
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('should preserve company URLs in Russian Experience', () => {
    render(<Experience />);
    const links = screen.getAllByRole('link').filter(
      (l) => l.getAttribute('target') === '_blank'
    );
    const hrefs = links.map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('https://example.com/edge-corp?q=test&lang=en#section');
    expect(hrefs).toContain('https://cafe-societe.example.com/');
  });

  it('should preserve technology tags in Russian Experience (not translated)', () => {
    render(<Experience />);
    const techLists = screen.getAllByRole('list', { name: /Используемые технологии/ });
    expect(techLists).toHaveLength(3);
    expect(within(techLists[0]).getByText('C++')).toBeInTheDocument();
    expect(within(techLists[0]).getByText('Rust')).toBeInTheDocument();
  });

  it('should render three experience entries in Russian', () => {
    render(<Experience />);
    const section = screen.getByRole('region', { name: /Опыт работы/ });
    const ol = section.querySelector('ol');
    const items = ol!.querySelectorAll(':scope > li');
    expect(items).toHaveLength(3);
  });

  it('should render two project cards in Russian', () => {
    render(<Projects />);
    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings).toHaveLength(2);
  });

  it('should render three about paragraphs in Russian', () => {
    render(<About />);
    const section = screen.getByRole('region', { name: 'Обо мне' });
    const paragraphs = section.querySelectorAll('p');
    expect(paragraphs).toHaveLength(3);
  });
});

describe('i18n Integration - Language Selector Flow', () => {
  it('should switch all content when selecting Hebrew via dropdown', async () => {
    const user = userEvent.setup();
    render(<ScrollHeader />);

    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(within(nav).getByText('About')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /select language/i }));
    await user.click(screen.getByRole('option', { name: /עברית/i }));

    expect(within(nav).getByText('אודות')).toBeInTheDocument();
    expect(within(nav).getByText('ניסיון')).toBeInTheDocument();
    expect(within(nav).getByText('פרויקטים')).toBeInTheDocument();
  });

  it('should switch to Russian via dropdown', async () => {
    const user = userEvent.setup();
    render(<ScrollHeader />);

    await user.click(screen.getByRole('button', { name: /select language/i }));
    await user.click(screen.getByRole('option', { name: /Русский/i }));

    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(within(nav).getByText('Обо мне')).toBeInTheDocument();
    expect(within(nav).getByText('Опыт')).toBeInTheDocument();
    expect(within(nav).getByText('Проекты')).toBeInTheDocument();
  });

  it('should switch back to English from Hebrew via dropdown', async () => {
    const user = userEvent.setup();
    await i18n.changeLanguage('he');
    render(<ScrollHeader />);

    await user.click(screen.getByRole('button', { name: /בחר שפה/i }));
    await user.click(screen.getByRole('option', { name: /English/i }));

    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(within(nav).getByText('About')).toBeInTheDocument();
  });

  it('should render language selector button in navbar', () => {
    render(<ScrollHeader />);
    expect(screen.getByRole('button', { name: /select language/i })).toBeInTheDocument();
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

  it('should preserve company link in Hebrew About', async () => {
    await i18n.changeLanguage('he');
    render(<About />);
    const link = screen.getByRole('link', { name: /test-company\.example\.com/i });
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('should preserve company URLs in Hebrew Experience', async () => {
    await i18n.changeLanguage('he');
    render(<Experience />);
    const links = screen.getAllByRole('link').filter(
      (l) => l.getAttribute('target') === '_blank'
    );
    const hrefs = links.map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('https://example.com/edge-corp?q=test&lang=en#section');
    expect(hrefs).toContain('https://cafe-societe.example.com/');
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
    expect(within(techLists[0]).getByText('C++')).toBeInTheDocument();
    expect(within(techLists[0]).getByText('Rust')).toBeInTheDocument();
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

  it('should keep social link hrefs as valid URLs in Hebrew', async () => {
    await i18n.changeLanguage('he');
    render(<Footer />);
    expect(screen.getByRole('link', { name: /github/i })).toHaveAttribute(
      'href',
      expect.stringContaining('github.com')
    );
    expect(screen.getByRole('link', { name: /linkedin/i })).toHaveAttribute(
      'href',
      expect.stringContaining('linkedin.com')
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
