import { expect, test, type Page } from '@playwright/test';

const LAYOUT_TARGETS = {
  header: 'header > div',
  hero: 'header + section',
  heroTagline: 'header + section h1',
  about: '#about',
  aboutCopy: '#about > div:last-child',
  experience: '#experience',
  experienceList: '#experience ol',
  projects: '#projects',
  projectGrid: '#projects > div',
  footer: 'footer',
} as const;

type RectSnapshot = Record<
  keyof typeof LAYOUT_TARGETS,
  {
    width: number;
    height: number;
  }
>;

const LANGUAGES = [
  { code: 'he', label: '\u05e2\u05d1\u05e8\u05d9\u05ea' },
  { code: 'ru', label: '\u0420\u0443\u0441\u0441\u043a\u0438\u0439' },
  { code: 'et', label: 'Eesti' },
] as const;

async function waitForPortfolioReady(page: Page, path = '/') {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    if ('fonts' in document) {
      await document.fonts.ready;
    }
  });
}

/**
 * Switch language entirely from page script. locator.click() scrolls its target
 * into view first, and the trigger lives in a sticky header, so Playwright's own
 * click perturbs the very scroll position these specs measure. The menu links
 * only exist while the menu is open, hence the wait in between.
 */
async function switchLanguageInPage(page: Page, locale: string) {
  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>('header button[aria-expanded]')?.click();
  });
  await page.locator(`header a[hreflang="${locale}"]`).waitFor({ state: 'attached' });
  await page.evaluate((code) => {
    document.querySelector<HTMLAnchorElement>(`header a[hreflang="${code}"]`)?.click();
  }, locale);
}

async function readRects(page: Page): Promise<RectSnapshot> {
  return page.evaluate((targets) => {
    const entries = Object.entries(targets).map(([name, selector]) => {
      const element = document.querySelector(selector);
      if (!(element instanceof HTMLElement)) {
        throw new Error(`Missing layout target: ${name} (${selector})`);
      }

      const rect = element.getBoundingClientRect();

      return [
        name,
        {
          width: rect.width,
          height: rect.height,
        },
      ];
    });

    return Object.fromEntries(entries);
  }, LAYOUT_TARGETS) as Promise<RectSnapshot>;
}

async function sampleRects(
  page: Page,
  durationMs: number,
  intervalMs: number
): Promise<RectSnapshot[]> {
  return page.evaluate(
    async ({ targets, durationMs: duration, intervalMs: interval }) => {
      const read = () => {
        const entries = Object.entries(targets).map(([name, selector]) => {
          const element = document.querySelector(selector);
          if (!(element instanceof HTMLElement)) {
            throw new Error(`Missing layout target: ${name} (${selector})`);
          }

          const rect = element.getBoundingClientRect();

          return [
            name,
            {
              width: rect.width,
              height: rect.height,
            },
          ];
        });

        return Object.fromEntries(entries);
      };

      const snapshots = [read()];
      const startedAt = performance.now();

      while (performance.now() - startedAt < duration) {
        await new Promise((resolve) => window.setTimeout(resolve, interval));
        snapshots.push(read());
      }

      return snapshots;
    },
    { targets: LAYOUT_TARGETS, durationMs, intervalMs }
  ) as Promise<RectSnapshot[]>;
}

function expectWithinEnvelope(
  snapshots: RectSnapshot[],
  start: RectSnapshot,
  end: RectSnapshot,
  tolerancePx: number
) {
  for (const [targetName] of Object.entries(LAYOUT_TARGETS)) {
    const key = targetName as keyof typeof LAYOUT_TARGETS;
    const maxWidth = Math.max(start[key].width, end[key].width) + tolerancePx;
    const minWidth = Math.min(start[key].width, end[key].width) - tolerancePx;
    const maxHeight = Math.max(start[key].height, end[key].height) + tolerancePx;
    const minHeight = Math.min(start[key].height, end[key].height) - tolerancePx;

    snapshots.forEach((snapshot, index) => {
      expect(
        snapshot[key].width,
        `${targetName} width sample ${index} exceeded the expected animation envelope`
      ).toBeLessThanOrEqual(maxWidth);
      expect(
        snapshot[key].width,
        `${targetName} width sample ${index} fell below the expected animation envelope`
      ).toBeGreaterThanOrEqual(minWidth);
      expect(
        snapshot[key].height,
        `${targetName} height sample ${index} exceeded the expected animation envelope`
      ).toBeLessThanOrEqual(maxHeight);
      expect(
        snapshot[key].height,
        `${targetName} height sample ${index} fell below the expected animation envelope`
      ).toBeGreaterThanOrEqual(minHeight);
    });
  }
}

test.describe('language toggle layout stability', () => {
  test('scrolled desktop header keeps the brand clear of the nav controls', async ({ page }) => {
    await page.setViewportSize({ width: 1120, height: 900 });
    await waitForPortfolioReady(page);

    await page.evaluate(() => {
      window.scrollTo({ top: 260, behavior: 'instant' });
    });

    const brand = page.locator('header [aria-hidden="false"]').first();
    await expect(brand).toBeVisible();

    const controls = page.locator('header > div > div:last-child');
    const brandBox = await brand.boundingBox();
    const controlsBox = await controls.boundingBox();
    const brandMetrics = await brand.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));

    expect(brandBox).not.toBeNull();
    expect(controlsBox).not.toBeNull();
    expect(brandBox!.x + brandBox!.width).toBeLessThanOrEqual(controlsBox!.x - 12);
    expect(brandMetrics.scrollWidth).toBeLessThanOrEqual(brandMetrics.clientWidth + 1);
  });

  // The assertions below are direction-agnostic, so every language the selector
  // offers is worth covering: an LTR target reflows just as much as the RTL one.
  for (const language of LANGUAGES) {
    test(`desktop transition to ${language.code} avoids width and height overshoot`, async ({
      page,
    }) => {
      test.slow();
      await page.setViewportSize({ width: 1280, height: 900 });
      await waitForPortfolioReady(page);

      const startRects = await readRects(page);

      await switchLanguageInPage(page, language.code);

      const samples = await sampleRects(page, 2200, 100);

      await expect(page.locator('html')).toHaveAttribute('lang', language.code);

      const endRects = await readRects(page);

      expectWithinEnvelope(samples, startRects, endRects, 8);
    });

    test(`text blocks hold a steady height while the ${language.code} scramble runs`, async ({
      page,
    }) => {
      test.slow();
      await page.setViewportSize({ width: 1280, height: 900 });
      await waitForPortfolioReady(page);

      await switchLanguageInPage(page, language.code);

      // Skip the initial reflow window (React commit + direction flip), then
      // watch the long-copy containers for the rest of the scramble. Their
      // height may move once (the eased settle) but must not oscillate with the
      // glyph cycling.
      await page.waitForTimeout(250);
      const samples = await sampleRects(page, 1600, 80);

      const textBlocks = ['aboutCopy', 'experienceList', 'projectGrid'] as const;

      for (const key of textBlocks) {
        const heights = samples.map((sample) => sample[key].height);
        let reversals = 0;
        let direction = 0;

        for (let index = 1; index < heights.length; index++) {
          const delta = heights[index] - heights[index - 1];
          if (Math.abs(delta) <= 1) continue;
          const sign = Math.sign(delta);
          if (direction !== 0 && sign !== direction) reversals++;
          direction = sign;
        }

        expect(
          reversals,
          `${key} height oscillated during the cipher animation (heights: ${heights.join(', ')})`
        ).toBeLessThanOrEqual(1);
      }
    });
  }

  test('a scrolled reader keeps their place across a Hebrew to English switch', async ({
    page,
  }) => {
    test.slow();
    await page.setViewportSize({ width: 1280, height: 900 });
    await waitForPortfolioReady(page, '/he');

    await page.evaluate(() => {
      const section = document.querySelector('#experience');
      if (!section) throw new Error('Missing #experience');
      window.scrollTo({
        top: window.scrollY + section.getBoundingClientRect().top + 80,
        behavior: 'instant',
      });
    });
    await page.waitForTimeout(150);

    const before = await page.evaluate(
      () => document.querySelector('#experience')!.getBoundingClientRect().top
    );

    await switchLanguageInPage(page, 'en');

    const samples = await page.evaluate(async () => {
      const readings: { elapsed: number; top: number }[] = [];
      const startedAt = performance.now();
      while (performance.now() - startedAt < 2200) {
        await new Promise((resolve) => window.setTimeout(resolve, 50));
        readings.push({
          elapsed: performance.now() - startedAt,
          top: document.querySelector('#experience')!.getBoundingClientRect().top,
        });
      }
      return readings;
    });

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    // The pin compensates within the first frames; after that the section the
    // reader is looking at must not have moved.
    for (const sample of samples.filter((reading) => reading.elapsed > 100)) {
      expect(
        Math.abs(sample.top - before),
        `#experience moved ${sample.top - before}px at ${Math.round(sample.elapsed)}ms`
      ).toBeLessThan(3);
    }
  });

  test('long-text overlays never mount showing the finished translation', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await waitForPortfolioReady(page);

    // Watch every .cipher-word as it is inserted: if its text already equals its
    // own ghost (the target word) the reader is being shown the answer before
    // the scramble starts.
    await page.evaluate(() => {
      const counters = window as unknown as { __flashes: number; __wordsSeen: number };
      counters.__flashes = 0;
      counters.__wordsSeen = 0;
      const hasLetter = /\p{L}/u;

      const inspect = (element: HTMLElement) => {
        const text = element.textContent ?? '';
        if (!hasLetter.test(text)) return;
        counters.__wordsSeen += 1;
        const ghost =
          element.parentElement?.querySelector('.cipher-char-layout')?.textContent ?? '';
        if (text === ghost) counters.__flashes += 1;
      };

      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          mutation.addedNodes.forEach((node) => {
            if (!(node instanceof HTMLElement)) return;
            if (node.classList.contains('cipher-word')) {
              inspect(node);
              return;
            }
            node.querySelectorAll<HTMLElement>('.cipher-word').forEach(inspect);
          });
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });

    await switchLanguageInPage(page, 'he');
    await page.waitForTimeout(1200);

    const counts = await page.evaluate(() => {
      const counters = window as unknown as { __flashes: number; __wordsSeen: number };
      return { flashes: counters.__flashes, wordsSeen: counters.__wordsSeen };
    });

    expect(counts.wordsSeen, 'no word overlays were observed at all').toBeGreaterThan(20);
    expect(
      counts.flashes,
      `${counts.flashes} of ${counts.wordsSeen} word overlays mounted showing the final word`
    ).toBe(0);
  });

  test('reduced motion stays inside the same envelope without scramble overshoot', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 390, height: 844 });
    await waitForPortfolioReady(page);

    const startRects = await readRects(page);

    await switchLanguageInPage(page, 'he');

    const samples = await sampleRects(page, 250, 25);

    await expect(page.locator('html')).toHaveAttribute('lang', 'he');

    const endRects = await readRects(page);

    expectWithinEnvelope(samples, startRects, endRects, 3);
  });
});

test.describe('mobile viewport stability', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  async function sampleViewport(page: Page, durationMs: number, intervalMs: number) {
    return page.evaluate(
      async ({ durationMs: duration, intervalMs: interval }) => {
        const read = () => ({
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
        });

        const samples = [read()];
        const startedAt = performance.now();
        while (performance.now() - startedAt < duration) {
          await new Promise((resolve) => window.setTimeout(resolve, interval));
          samples.push(read());
        }
        return samples;
      },
      { durationMs, intervalMs }
    );
  }

  // Scramble overlays sit in slots sized to the final glyph, so a wider cipher
  // glyph used to spill out and widen the document to 500-570px on a 390px
  // phone, which made the browser rescale the layout viewport (a visible
  // zoom in/out) for about a second.
  for (const [from, to] of [
    ['/', 'et'],
    ['/he', 'en'],
  ] as const) {
    test(`switching ${from} to ${to} never widens the document past the viewport`, async ({
      page,
    }) => {
      test.slow();
      await waitForPortfolioReady(page, from);

      await switchLanguageInPage(page, to);

      const samples = await sampleViewport(page, 1600, 50);

      await expect(page.locator('html')).toHaveAttribute('lang', to);

      const baselineHeight = samples[0].innerHeight;
      samples.forEach((sample, index) => {
        expect(
          sample.scrollWidth,
          `sample ${index}: document widened to ${sample.scrollWidth}px in a ${sample.innerWidth}px viewport`
        ).toBeLessThanOrEqual(sample.innerWidth);
        expect(
          sample.innerHeight,
          `sample ${index}: layout viewport rescaled (height ${sample.innerHeight} vs ${baselineHeight})`
        ).toBe(baselineHeight);
      });
    });
  }
});
