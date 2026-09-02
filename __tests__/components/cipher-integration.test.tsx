import { act, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/lib/i18n';
import ScrollHeader from '@/components/ScrollHeader';
import About from '@/components/About';
import Experience from '@/components/Experience';

import {
  stubIntersectionObserver,
  stubMatchMedia,
  type MatchMediaStub,
} from '../helpers/observers';

import testEn from '../fixtures/translations/en.json';
import testHe from '../fixtures/translations/he.json';

// Async factory: a vi.mock factory is hoisted above the imports, so it has to
// pull the fixture in itself rather than close over a top-level binding.
vi.mock('@/data/experience', async () => ({
  experienceEntries: (await import('../fixtures/test-data')).testExperienceEntries,
}));

beforeEach(async () => {
  await i18n.changeLanguage('en');
  document.documentElement.lang = 'en';
  document.documentElement.dir = 'ltr';

  stubIntersectionObserver();
});

describe('Cipher Integration - DOM structure consistency across languages', () => {
  describe('About section', () => {
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
    it('should render all three items including the first after switching to Hebrew', async () => {
      await i18n.changeLanguage('he');
      render(<Experience />);
      const section = screen.getByRole('region', { name: /ניסיון תעסוקתי/ });
      expect(section).toHaveTextContent('Edge Corp');
      expect(section).toHaveTextContent('Cafe Societe');
      expect(section).toHaveTextContent('Open-Source Foundation');
    });

    it('should preserve three date headers in both languages', async () => {
      const { unmount } = render(<Experience />);
      let section = screen.getByRole('region', { name: /work experience/i });
      let dateHeaders = section.querySelectorAll('header');
      expect(dateHeaders).toHaveLength(3);
      unmount();

      await i18n.changeLanguage('he');
      render(<Experience />);
      section = screen.getByRole('region', { name: /ניסיון תעסוקתי/ });
      dateHeaders = section.querySelectorAll('header');
      expect(dateHeaders).toHaveLength(3);
    });
  });

  describe('ScrollHeader section', () => {
    it('should render hero elements in both languages', async () => {
      const { unmount } = render(<ScrollHeader />);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      unmount();

      await i18n.changeLanguage('he');
      render(<ScrollHeader />);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });
});

/**
 * Everything above runs with NEXT_PUBLIC_CIPHER_TRANSITION unset, which is the
 * path a visitor gets when the flag is off — CipherText renders plain text and
 * the hook never schedules a frame. The animated path is the one that swaps the
 * DOM out for scramble overlays mid-switch, and until now no test drove it.
 *
 * It needs three things jsdom does not provide by itself: the env var (read on
 * every render), a matchMedia to answer the reduced-motion and mobile-profile
 * queries, and a frame clock, since the shared scheduler in
 * src/hooks/useCipherTransition.ts advances only when requestAnimationFrame
 * fires.
 *
 * The frame clock is where this differs from
 * __tests__/hooks/useCipherTransition.test.ts: that suite's stub counts calls
 * and throws the callbacks away, which is enough to assert that a frame was
 * requested but never runs one. Here the callbacks are queued and replayed on a
 * scripted clock, so the animation actually advances and finishes.
 */
describe('Cipher Integration - the animated language switch', () => {
  const FRAME_MS = 16;
  const SCRAMBLE_SELECTOR = '.cipher-char, .cipher-word';

  const originalRequestAnimationFrame = global.requestAnimationFrame;
  const originalCancelAnimationFrame = global.cancelAnimationFrame;

  let frames: FrameRequestCallback[] = [];
  let matchMedia: MatchMediaStub;
  let randomState = 0;

  // A seeded generator rather than a pinned constant. Math.random() === 0.42 on
  // every call gives every character the same cipher glyph and every character
  // the same reveal jitter, which hides anything that only goes wrong when the
  // glyphs differ — a slot sized to the wrong one, a resolve check comparing
  // the wrong pair. This is just as reproducible and actually varies.
  // (Numerical Recipes' LCG, mod 2^32.)
  function seededRandom(): number {
    randomState = (randomState * 1664525 + 1013904223) >>> 0;
    return randomState / 0x1_0000_0000;
  }

  beforeEach(() => {
    process.env.NEXT_PUBLIC_CIPHER_TRANSITION = 'true';
    frames = [];

    global.requestAnimationFrame = ((callback: FrameRequestCallback) =>
      frames.push(callback)) as unknown as typeof requestAnimationFrame;
    global.cancelAnimationFrame = vi.fn() as unknown as typeof cancelAnimationFrame;

    // Desktop, full motion: the hook refuses to animate under
    // prefers-reduced-motion and picks a shorter profile on a coarse pointer.
    matchMedia = stubMatchMedia();

    randomState = 0x5eed;
    vi.spyOn(Math, 'random').mockImplementation(seededRandom);
  });

  afterEach(async () => {
    // Back to English inside the frame clock, so the transition that the switch
    // starts is finished here rather than left running into the next test.
    await act(async () => {
      await i18n.changeLanguage('en');
    });
    runFrames();

    delete process.env.NEXT_PUBLIC_CIPHER_TRANSITION;
    global.requestAnimationFrame = originalRequestAnimationFrame;
    global.cancelAnimationFrame = originalCancelAnimationFrame;
    matchMedia.restore();
    vi.restoreAllMocks();
  });

  /**
   * Drive the shared scheduler until nothing reschedules (or the budget runs
   * out). Returns the clock it stopped at, so a caller can carry on from there.
   */
  function runFrames(fromMs = 0, untilMs = 4000): number {
    let now = fromMs;
    while (frames.length > 0 && now < untilMs) {
      const queued = frames;
      frames = [];
      now += FRAME_MS;
      act(() => {
        queued.forEach((callback) => callback(now));
      });
    }
    return now;
  }

  function scrambleNodeCount(): number {
    return document.querySelectorAll(SCRAMBLE_SELECTOR).length;
  }

  async function switchTo(locale: string) {
    await act(async () => {
      await i18n.changeLanguage(locale);
    });
  }

  it('should decrypt the About copy into Hebrew and leave no scramble node behind', async () => {
    render(<About />);
    expect(screen.getByText(testEn.about.p1)).toBeInTheDocument();

    await switchTo('he');

    // Two frames in, the section is mid-scramble: the overlays are mounted and
    // carrying cipher glyphs.
    const mid = runFrames(0, 2 * FRAME_MS);
    expect(scrambleNodeCount()).toBeGreaterThan(0);

    // ...and the finished Hebrew paragraph is already there, while the layer
    // carrying the glyphs is aria-hidden — so a screen reader reads the
    // translation rather than a wall of cipher characters. The English
    // paragraph it replaced is gone in the same commit.
    const section = screen.getByRole('region', {
      name: testHe.about.ariaLabel,
    });
    expect(within(section).getByText(testHe.about.p1)).toBeInTheDocument();
    expect(within(section).queryByText(testEn.about.p1)).not.toBeInTheDocument();

    // Once the reveal wave has passed the last character every overlay is gone
    // and the paragraph is plain Hebrew text again.
    runFrames(mid);
    expect(scrambleNodeCount()).toBe(0);
    expect(within(section).getByText(testHe.about.p1)).toBeInTheDocument();
    expect(within(section).getByText(testHe.about.p3)).toBeInTheDocument();
  });

  it('should scramble the short Experience strings per character and resolve them', async () => {
    render(<Experience />);
    // The <h3> shows "<title> · <company>" as one string, so that is the one
    // CipherText instance and the one thing to look for.
    const [enJob] = testEn.experience.jobs;
    const enHeading = `${enJob.title} · ${enJob.company}`;
    expect(screen.getAllByText(enHeading).length).toBeGreaterThan(0);

    await switchTo('he');

    const mid = runFrames(0, 2 * FRAME_MS);
    // A job title is short enough to take the per-character path, so the
    // scramble is React-rendered `.cipher-char` spans rather than word overlays.
    expect(document.querySelectorAll('.cipher-char').length).toBeGreaterThan(0);

    const [heJob] = testHe.experience.jobs;
    const heHeading = `${heJob.title} · ${heJob.company}`;
    const section = screen.getByRole('region', {
      name: testHe.experience.ariaLabel,
    });
    expect(within(section).getAllByText(heHeading).length).toBeGreaterThan(0);

    runFrames(mid);
    expect(scrambleNodeCount()).toBe(0);
    expect(within(section).getAllByText(heHeading).length).toBeGreaterThan(0);
    expect(within(section).getByText(heJob.dates)).toBeInTheDocument();
    // Every job still has a heading of its own after the animation.
    expect(within(section).getAllByRole('heading', { level: 3 })).toHaveLength(
      testHe.experience.jobs.length
    );
  });

  // The browser-side half of this claim is
  // playwright/layout-stability.spec.ts › "long-text overlays never mount
  // showing the finished translation", which watches real mutations over a real
  // animation. Two layers on purpose: that one can only observe what a
  // MutationObserver happens to catch between paints, while this one inspects
  // the exact markup React commits on the frame the overlays appear.
  it('should never paint the finished translation before the scramble starts', async () => {
    render(<About />);

    await switchTo('he');

    // The overlays mount on the render that flips isAnimating, one or two
    // painted frames before the first scramble write lands; seeded cipher
    // glyphs are what keeps the answer from flashing in that window.
    runFrames(0, FRAME_MS);

    const overlays = Array.from(
      document.querySelectorAll<HTMLElement>('.cipher-word, .cipher-char')
    );
    expect(overlays.length).toBeGreaterThan(0);

    const flashed = overlays.filter((overlay) => {
      const ghost = overlay.parentElement?.querySelector('.cipher-char-layout');
      const target = ghost?.textContent ?? '';
      return /\p{L}/u.test(target) && overlay.textContent === target;
    });
    expect(flashed).toHaveLength(0);
  });
});
