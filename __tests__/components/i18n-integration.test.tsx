import { render, screen, within } from '@testing-library/react';
import { waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import i18n from '@/lib/i18n';
import ScrollHeader from '@/components/ScrollHeader';
import About from '@/components/About';
import Experience from '@/components/Experience';
import Projects from '@/components/Projects';
import Footer from '@/components/Footer';
import SkipLink from '@/components/SkipLink';

import { projectEntries } from '@/data/projects';

import { stubIntersectionObserver } from '../helpers/observers';

import testEn from '../fixtures/translations/en.json';
import testHe from '../fixtures/translations/he.json';
import testRu from '../fixtures/translations/ru.json';
import testEt from '../fixtures/translations/et.json';

vi.mock('openpgp', () => ({
  readKey: vi.fn(() =>
    Promise.resolve({
      getFingerprint: () => 'abcd1234',
      getUserIDs: () => ['Test <test@example.com>'],
      getAlgorithmInfo: () => ({ algorithm: 'rsa', bits: 2048 }),
      getCreationTime: () => new Date('2016-01-01'),
      getKeyID: () => ({ toHex: () => 'deadbeef' }),
    })
  ),
}));

// Async factories: a vi.mock factory is hoisted above the imports, so it has to
// pull the fixture in itself rather than close over a top-level binding.
vi.mock('@/data/experience', async () => ({
  experienceEntries: (await import('../fixtures/test-data')).testExperienceEntries,
}));

vi.mock('@/data/projects', async () => ({
  projectEntries: (await import('../fixtures/test-data')).testProjectEntries,
}));

beforeEach(async () => {
  await i18n.changeLanguage('en');
  document.documentElement.lang = 'en';
  document.documentElement.dir = 'ltr';

  stubIntersectionObserver();
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
    const img = screen.getByRole('img', {
      name: new RegExp(testEn.hero.profileAlt, 'i'),
    });
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

  it('should render the skip link in English', () => {
    render(<SkipLink />);
    expect(screen.getByRole('link', { name: testEn.nav.skipToContent })).toHaveAttribute(
      'href',
      '#main'
    );
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
    const img = screen.getByRole('img', {
      name: new RegExp(testHe.hero.profileAlt),
    });
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
    expect(section).toHaveTextContent(/2042 — היום/);
  });

  it('should render resume link in Hebrew', () => {
    render(<Experience />);
    expect(screen.getByText(/לצפייה בקורות החיים המלאים/)).toBeInTheDocument();
  });

  it('should render Projects section heading in Hebrew', () => {
    render(<Projects />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('פרויקטים');
  });

  it('should render project descriptions in Hebrew', () => {
    render(<Projects />);
    const section = screen.getByRole('region', { name: /פרויקטים נבחרים/ });
    expect(section).toHaveTextContent(/Vidra/);
  });

  it('should render the skip link in Hebrew', () => {
    render(<SkipLink />);
    expect(screen.getByRole('link', { name: testHe.nav.skipToContent })).toHaveAttribute(
      'href',
      '#main'
    );
  });

  it('should render footer attribution in Hebrew', () => {
    render(<Footer />);
    expect(screen.getByText(/נכתב באמצעות/)).toBeInTheDocument();
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

  it('should render the skip link in Russian', () => {
    render(<SkipLink />);
    expect(screen.getByRole('link', { name: testRu.nav.skipToContent })).toHaveAttribute(
      'href',
      '#main'
    );
  });

  it('should render footer attribution in Russian', () => {
    render(<Footer />);
    expect(screen.getByText(/Написано в/)).toBeInTheDocument();
    expect(screen.getByText(/Создано с помощью/)).toBeInTheDocument();
  });

  it('should preserve company link to test-company in Russian About', () => {
    render(<About />);
    const link = screen.getByRole('link', {
      name: /test-company\.example\.com/i,
    });
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('should preserve company URLs in Russian Experience', () => {
    render(<Experience />);
    const links = screen.getAllByRole('link').filter((l) => l.getAttribute('target') === '_blank');
    const hrefs = links.map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('https://example.com/edge-corp?q=test&lang=en#section');
    expect(hrefs).toContain('https://cafe-societe.example.com/');
  });

  it('should preserve technology tags in Russian Experience (not translated)', () => {
    render(<Experience />);
    const techLists = screen.getAllByRole('list', {
      name: /Используемые технологии/,
    });
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

  it('should render four project cards in Russian', () => {
    render(<Projects />);
    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings).toHaveLength(4);
  });

  it('should render three about paragraphs in Russian', () => {
    render(<About />);
    const section = screen.getByRole('region', { name: 'Обо мне' });
    const paragraphs = section.querySelectorAll('p');
    expect(paragraphs).toHaveLength(3);
  });
});

describe('i18n Integration - Estonian Mode', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('et');
  });

  it('should render nav items in Estonian', () => {
    render(<ScrollHeader />);
    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(within(nav).getByText('Minust')).toBeInTheDocument();
    expect(within(nav).getByText('Kogemus')).toBeInTheDocument();
    expect(within(nav).getByText('Projektid')).toBeInTheDocument();
  });

  it('should render hero name in Estonian', () => {
    render(<ScrollHeader />);
    expect(screen.getByText(testEt.hero.name, { selector: 'section p' })).toBeInTheDocument();
  });

  it('should render hero title in Estonian', () => {
    render(<ScrollHeader />);
    expect(screen.getByText(testEt.hero.title, { selector: 'section p' })).toBeInTheDocument();
  });

  it('should render hero tagline in Estonian', () => {
    render(<ScrollHeader />);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent(/Vanem C\+\+/);
    expect(h1).toHaveTextContent(/Rusti/);
  });

  it('should render About section heading in Estonian', () => {
    render(<About />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Minust');
  });

  it('should render About section with Estonian aria-label', () => {
    render(<About />);
    expect(screen.getByRole('region', { name: 'Minu kohta' })).toBeInTheDocument();
  });

  it('should render Experience section heading in Estonian', () => {
    render(<Experience />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Kogemus');
  });

  it('should render Experience job titles in Estonian', () => {
    render(<Experience />);
    const section = screen.getByRole('region', { name: /Töökogemus/ });
    expect(section).toHaveTextContent(/Peainsener ja arhitekt/);
    expect(section).toHaveTextContent(/Praktikandist keskastme insenerini/);
  });

  it('should render resume link in Estonian', () => {
    render(<Experience />);
    expect(screen.getByText(/Vaata täielikku CV-d/)).toBeInTheDocument();
  });

  it('should render Projects section heading in Estonian', () => {
    render(<Projects />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Projektid');
  });

  it('should render the skip link in Estonian', () => {
    render(<SkipLink />);
    expect(screen.getByRole('link', { name: testEt.nav.skipToContent })).toHaveAttribute(
      'href',
      '#main'
    );
  });

  it('should render footer attribution in Estonian', () => {
    render(<Footer />);
    expect(screen.getByText(/Kirjutatud redaktoris/)).toBeInTheDocument();
    expect(screen.getByText(/Loodud/)).toBeInTheDocument();
  });

  it('should preserve company link to test-company in Estonian About', () => {
    render(<About />);
    const link = screen.getByRole('link', {
      name: /test-company\.example\.com/i,
    });
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('should preserve company URLs in Estonian Experience', () => {
    render(<Experience />);
    const links = screen.getAllByRole('link').filter((l) => l.getAttribute('target') === '_blank');
    const hrefs = links.map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('https://example.com/edge-corp?q=test&lang=en#section');
    expect(hrefs).toContain('https://cafe-societe.example.com/');
  });

  it('should preserve technology tags in Estonian Experience (not translated)', () => {
    render(<Experience />);
    const techLists = screen.getAllByRole('list', {
      name: /Kasutatud tehnoloogiad/,
    });
    expect(techLists).toHaveLength(3);
    expect(within(techLists[0]).getByText('C++')).toBeInTheDocument();
    expect(within(techLists[0]).getByText('Rust')).toBeInTheDocument();
  });

  it('should render three experience entries in Estonian', () => {
    render(<Experience />);
    const section = screen.getByRole('region', { name: /Töökogemus/ });
    const ol = section.querySelector('ol');
    const items = ol!.querySelectorAll(':scope > li');
    expect(items).toHaveLength(3);
  });

  it('should render four project cards in Estonian', () => {
    render(<Projects />);
    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings).toHaveLength(4);
  });

  it('should render three about paragraphs in Estonian', () => {
    render(<About />);
    const section = screen.getByRole('region', { name: 'Minu kohta' });
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
    await user.click(screen.getByRole('link', { name: /עברית/i }));

    await waitFor(() => {
      expect(within(nav).getByText('אודות')).toBeInTheDocument();
      expect(within(nav).getByText('ניסיון')).toBeInTheDocument();
      expect(within(nav).getByText('פרויקטים')).toBeInTheDocument();
    });
  });

  it('should switch to Russian via dropdown', async () => {
    const user = userEvent.setup();
    render(<ScrollHeader />);

    await user.click(screen.getByRole('button', { name: /select language/i }));
    await user.click(screen.getByRole('link', { name: /Русский/i }));

    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    await waitFor(() => {
      expect(within(nav).getByText('Обо мне')).toBeInTheDocument();
      expect(within(nav).getByText('Опыт')).toBeInTheDocument();
      expect(within(nav).getByText('Проекты')).toBeInTheDocument();
    });
  });

  it('should switch to Estonian via dropdown', async () => {
    const user = userEvent.setup();
    render(<ScrollHeader />);

    await user.click(screen.getByRole('button', { name: /select language/i }));
    await user.click(screen.getByRole('link', { name: /eesti/i }));

    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    await waitFor(() => {
      expect(within(nav).getByText('Minust')).toBeInTheDocument();
      expect(within(nav).getByText('Kogemus')).toBeInTheDocument();
      expect(within(nav).getByText('Projektid')).toBeInTheDocument();
    });
  });

  it('should switch back to English from Hebrew via dropdown', async () => {
    const user = userEvent.setup();
    await i18n.changeLanguage('he');
    render(<ScrollHeader />);

    await user.click(screen.getByRole('button', { name: /בחירת שפה/i }));
    await user.click(screen.getByRole('link', { name: /English/i }));

    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    await waitFor(() => {
      expect(within(nav).getByText('About')).toBeInTheDocument();
    });
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
    const link = screen.getByRole('link', {
      name: /test-company\.example\.com/i,
    });
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('should preserve company URLs in Hebrew Experience', async () => {
    await i18n.changeLanguage('he');
    render(<Experience />);
    const links = screen.getAllByRole('link').filter((l) => l.getAttribute('target') === '_blank');
    const hrefs = links.map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('https://example.com/edge-corp?q=test&lang=en#section');
    expect(hrefs).toContain('https://cafe-societe.example.com/');
  });

  it('should preserve resume link href in Hebrew Experience', async () => {
    await i18n.changeLanguage('he');
    render(<Experience />);
    const resumeLink = screen.getByRole('link', {
      name: /לצפייה בקורות החיים המלאים/,
    });
    expect(resumeLink).toHaveAttribute('href', 'https://www.linkedin.com/in/yosefgamble/');
  });

  it('should preserve technology tags in Hebrew Experience (not translated)', async () => {
    await i18n.changeLanguage('he');
    render(<Experience />);
    const techLists = screen.getAllByRole('list', {
      name: /טכנולוגיות בשימוש/,
    });
    expect(techLists).toHaveLength(3);
    expect(within(techLists[0]).getByText('C++')).toBeInTheDocument();
    expect(within(techLists[0]).getByText('Rust')).toBeInTheDocument();
  });

  it('should mark the English technology names as such inside the Hebrew page', async () => {
    await i18n.changeLanguage('he');
    render(<Experience />);
    const techLists = screen.getAllByRole('list', {
      name: /טכנולוגיות בשימוש/,
    });
    expect(within(techLists[0]).getByText('C++')).toHaveAttribute('lang', 'en');
  });

  it('should keep the English repo name at the head of the link name in Hebrew', async () => {
    await i18n.changeLanguage('he');
    render(<Projects />);
    // The old aria-label made the whole name one Hebrew string, so the repo
    // name lost its lang="en" and was announced with Hebrew phonetics.
    const link = screen.getByRole('link', {
      name: `vidra-core ${testHe.projects.onGitHub} ${testHe.projects.opensInNewTab}`,
    });
    expect(within(link).getByText('vidra-core')).toHaveAttribute('lang', 'en');
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
    const vscodeLink = screen.getByRole('link', {
      name: /visual studio code/i,
    });
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

  it('should render four project cards in Hebrew', async () => {
    await i18n.changeLanguage('he');
    render(<Projects />);
    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings).toHaveLength(4);
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

// Technology names come from src/data/projects.ts, which is never translated:
// every locale shows the same English strings, each marked lang="en" so a
// Hebrew, Russian or Estonian screen reader switches voice for them instead of
// reading "PostgreSQL" in the page language.
describe('i18n Integration - Project technology lists', () => {
  const LOCALES = [
    ['en', testEn],
    ['he', testHe],
    ['ru', testRu],
    ['et', testEt],
  ] as const;

  LOCALES.forEach(([code, messages]) => {
    it(`should list each project's technologies untranslated in ${code}`, async () => {
      await i18n.changeLanguage(code);
      render(<Projects />);

      const techLists = screen.getAllByRole('list', {
        name: messages.projects.techAriaLabel,
      });
      expect(techLists).toHaveLength(messages.projects.items.length);

      messages.projects.items.forEach((item) => {
        const metadata = projectEntries.find((entry) => entry.id === item.id);
        expect(metadata, `no metadata for ${item.id}`).toBeDefined();

        // Scope to the card, so each list is checked against its own project
        // rather than against whatever happens to be at the same index.
        const card = screen.getByRole('heading', { level: 3, name: item.title }).closest('div')!;
        const techList = within(card).getByRole('list', {
          name: messages.projects.techAriaLabel,
        });

        expect(within(techList).getAllByRole('listitem')).toHaveLength(
          metadata!.technologies.length
        );
        metadata!.technologies.forEach((technology) => {
          expect(within(techList).getByText(technology)).toHaveAttribute('lang', 'en');
        });
      });
    });
  });
});

// The block above switches language and then renders. A visitor does the
// opposite: the tree is already mounted and i18next swaps every string inside
// it in place — the path that can drop a node or strand an href, and the one
// the cipher animation runs on.
describe('i18n Regression - Structure survives a switch on a mounted tree', () => {
  const hrefs = () =>
    screen
      .getAllByRole('link')
      .map((link) => link.getAttribute('href'))
      .sort();

  it('should keep every project card, technology list and repo href through a switch', async () => {
    render(<Projects />);

    const englishHrefs = hrefs();
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(4);
    expect(screen.getAllByRole('list', { name: testEn.projects.techAriaLabel })).toHaveLength(4);

    await i18n.changeLanguage('he');

    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(4);
    expect(screen.getAllByRole('list', { name: testHe.projects.techAriaLabel })).toHaveLength(4);
    expect(hrefs()).toEqual(englishHrefs);
    // The technology names are not translated, so they are the same nodes on
    // both sides of the switch.
    projectEntries[0].technologies.forEach((technology) => {
      expect(screen.getAllByText(technology).length).toBeGreaterThan(0);
    });
  });

  it('should keep every footer social and tool link through a switch', async () => {
    render(<Footer />);

    const englishHrefs = hrefs();
    expect(englishHrefs.length).toBeGreaterThanOrEqual(7);

    await i18n.changeLanguage('he');

    expect(hrefs()).toEqual(englishHrefs);
    // Still four social links and three tool links, now under Hebrew names.
    expect(screen.getByRole('link', { name: /github/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /linkedin/i })).toBeInTheDocument();
    // Anchored: the secure-email label contains the plain one.
    expect(
      screen.getByRole('link', { name: new RegExp(`^${testHe.social.email}$`) })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: new RegExp(testHe.social.secureEmail) })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /visual studio code/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /tailwind css/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Inter' })).toBeInTheDocument();
  });

  it('should keep the About paragraph count and company link through a switch', async () => {
    render(<About />);

    const section = () => screen.getByRole('region', { name: /.+/ });
    expect(section().querySelectorAll('p')).toHaveLength(3);
    const englishHref = screen
      .getByRole('link', { name: /test-company\.example\.com/i })
      .getAttribute('href');

    await i18n.changeLanguage('he');

    expect(section().querySelectorAll('p')).toHaveLength(3);
    expect(screen.getByRole('link', { name: /test-company\.example\.com/i })).toHaveAttribute(
      'href',
      englishHref
    );
  });

  it('should keep the Experience entries and company hrefs through a switch', async () => {
    render(<Experience />);

    const jobItems = () =>
      screen
        .getByRole('region', { name: /.+/ })
        .querySelector('ol')!
        .querySelectorAll(':scope > li');

    expect(jobItems()).toHaveLength(3);
    const englishHrefs = hrefs();

    await i18n.changeLanguage('he');

    expect(jobItems()).toHaveLength(3);
    expect(hrefs()).toEqual(englishHrefs);
  });
});

describe('i18n Integration - PGP Key Icon Labels', () => {
  it('should render PGP key button with English label', () => {
    render(<ScrollHeader />);
    const heroSection = screen
      .getByText(testEn.hero.name, { selector: 'section p' })
      .closest('section');
    expect(within(heroSection!).getByRole('button', { name: 'PGP Key' })).toBeInTheDocument();
  });

  it('should render PGP key button with Hebrew label', async () => {
    await i18n.changeLanguage('he');
    render(<ScrollHeader />);
    const heroSection = screen
      .getByText(testHe.hero.name, { selector: 'section p' })
      .closest('section');
    expect(within(heroSection!).getByRole('button', { name: 'מפתח PGP' })).toBeInTheDocument();
  });

  it('should render PGP key button with Russian label', async () => {
    await i18n.changeLanguage('ru');
    render(<ScrollHeader />);
    const heroSection = screen
      .getByText(testRu.hero.name, { selector: 'section p' })
      .closest('section');
    expect(within(heroSection!).getByRole('button', { name: 'Ключ PGP' })).toBeInTheDocument();
  });

  it('should render PGP key button with Estonian label', async () => {
    await i18n.changeLanguage('et');
    render(<ScrollHeader />);
    const heroSection = screen
      .getByText(testEt.hero.name, { selector: 'section p' })
      .closest('section');
    expect(within(heroSection!).getByRole('button', { name: 'PGP-võti' })).toBeInTheDocument();
  });

  it('should render email icon label in Hebrew', async () => {
    await i18n.changeLanguage('he');
    render(<ScrollHeader />);
    const heroSection = screen
      .getByText(testHe.hero.name, { selector: 'section p' })
      .closest('section');
    expect(within(heroSection!).getByRole('link', { name: 'אימייל' })).toBeInTheDocument();
  });

  it('should render secure email icon label in Hebrew', async () => {
    await i18n.changeLanguage('he');
    render(<ScrollHeader />);
    const heroSection = screen
      .getByText(testHe.hero.name, { selector: 'section p' })
      .closest('section');
    expect(within(heroSection!).getByRole('link', { name: 'אימייל מאובטח' })).toBeInTheDocument();
  });
});
