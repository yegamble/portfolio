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
    if (!('fonts' in document)) return;
    await document.fonts.ready;

    // fonts.ready only settles the faces the CURRENT page actually uses. Heebo
    // is pulled in by `html:lang(he) body` in globals.css, so nothing requests
    // it until the very switch these specs measure — and a face finishing
    // mid-sample re-wraps a line and trips the layout envelope. Warm every
    // Heebo face up front (matched by name rather than by a literal family
    // string, since next/font may hash the family) and re-await.
    const pending = Array.from(document.fonts).filter((face) => face.family.includes('Heebo'));
    await Promise.all(pending.map((face) => face.load().catch(() => undefined)));
    await document.fonts.ready;
  });
}

/**
 * The brand block grows in over 500ms (`transition-all duration-500`) when the
 * sticky header flips to its scrolled state, and a visibility check resolves as
 * soon as it has a box — long before max-width has finished growing. Measuring
 * then reads a mid-transition clientWidth, which turns the "is the name
 * truncated?" assertion into a coin flip (observed clientWidth 51 and 113 on
 * the way to its settled width). Wait for the transition itself to finish.
 */
async function waitForHeaderTransition(page: Page) {
  const brand = page.locator('header [aria-hidden="false"]').first();
  await brand.waitFor({ state: 'visible' });
  await page.evaluate(async () => {
    const element = document.querySelector('header [aria-hidden="false"]');
    if (!element) return;
    // The transition object may not exist for a frame after the class flips.
    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
    for (let attempt = 0; attempt < 5; attempt++) {
      const running = element.getAnimations({ subtree: true });
      if (running.length === 0) return;
      await Promise.all(running.map((animation) => animation.finished.catch(() => undefined)));
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

    await waitForHeaderTransition(page);

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

  // Resting top for #experience. Chosen because it is where the regression this
  // guards against was largest: on a production build, sampling the pin's anchor
  // after the lang flip (which reflows on its own via the html:lang(he) font
  // stack) left the section at 141 instead of 112.
  //
  // NOTE: the config runs these against `next dev`, where React commits the i18n
  // store synchronously inside the click handler, so the drift the pin sees here
  // is far smaller than in production — which commits it in a microtask
  // afterwards and needs a +117px correction at this scroll position. The
  // assertion holds in both and was verified by hand against `next start`; once
  // CI runs this suite against a production build it becomes a real guard rather
  // than a smoke test.
  const EXPERIENCE_RESTING_TOP = 112;

  test('a scrolled reader keeps their place across a Hebrew to English switch', async ({
    page,
  }) => {
    test.slow();
    await page.setViewportSize({ width: 1280, height: 900 });
    await waitForPortfolioReady(page, '/he');

    await page.evaluate((restingTop) => {
      const section = document.querySelector('#experience');
      if (!section) throw new Error('Missing #experience');
      window.scrollTo({
        top: window.scrollY + section.getBoundingClientRect().top - restingTop,
        behavior: 'instant',
      });
    }, EXPERIENCE_RESTING_TOP);
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

    // Wait on the structure actually mounting rather than guessing a duration:
    // a slow frame can push the React commit past a fixed timeout and leave the
    // observer with nothing to report, which would fail as a false negative.
    await page.waitForFunction(
      () => (window as unknown as { __wordsSeen: number }).__wordsSeen > 20
    );
    await page.waitForTimeout(400);

    const counts = await page.evaluate(() => {
      const counters = window as unknown as { __flashes: number; __wordsSeen: number };
      return { flashes: counters.__flashes, wordsSeen: counters.__wordsSeen };
    });

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

/**
 * Sample one element's height across a language switch, every animation frame,
 * starting from the click itself. The click is issued from page script for the
 * same reason switchLanguageInPage does it: locator.click() scrolls its target
 * into view, and the trigger lives in a sticky header.
 */
async function sampleHeightThroughSwitch(
  page: Page,
  selector: string,
  locale: string,
  durationMs: number
) {
  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>('header button[aria-expanded]')?.click();
  });
  await page.locator(`header a[hreflang="${locale}"]`).waitFor({ state: 'attached' });

  return page.evaluate(
    async ({ selector: target, code, durationMs: duration }) => {
      const element = document.querySelector(target);
      if (!(element instanceof HTMLElement)) throw new Error(`Missing target: ${target}`);

      const readings: { elapsed: number; height: number }[] = [];
      const startedAt = performance.now();
      let running = true;
      const sample = () => {
        readings.push({
          elapsed: performance.now() - startedAt,
          height: element.getBoundingClientRect().height,
        });
        if (running) requestAnimationFrame(sample);
      };

      document.querySelector<HTMLAnchorElement>(`header a[hreflang="${code}"]`)?.click();
      sample();
      await new Promise((resolve) => window.setTimeout(resolve, duration));
      running = false;
      return readings;
    },
    { selector, code: locale, durationMs }
  );
}

/**
 * A block-mode CipherText wrapper eases its height (see src/lib/height-ease.ts),
 * so the step from one language's line count to another's is spread over ~300ms
 * of intermediate heights instead of landing in a single frame. The assertions
 * are the three things that separate an ease from a snap: intermediate values
 * exist, they only ever move towards the target, and they get there promptly.
 *
 * The ease begins at the height the reader was looking at when the new text was
 * committed, which is the sample furthest from where the height settles — not
 * necessarily the first one. Switching to Hebrew reflows twice: the selector
 * flips documentElement.lang synchronously, which re-wraps the still-English
 * text in Heebo's metrics (180 -> 240 here), and only then does the translation
 * commit and the ease carry that height down to the Hebrew one.
 */
function expectEasedHeightChange(
  readings: { elapsed: number; height: number }[],
  expected: { from: number; to: number }
) {
  const endHeight = readings[readings.length - 1].height;

  let startIndex = 0;
  readings.forEach((reading, index) => {
    if (Math.abs(reading.height - endHeight) > Math.abs(readings[startIndex].height - endHeight)) {
      startIndex = index;
    }
  });

  const eased = readings.slice(startIndex);
  const heights = eased.map((reading) => reading.height);
  const startHeight = heights[0];

  // Documented so the numbers this guards stay visible; the tolerance absorbs
  // font-rendering differences between the dev server and a production build.
  expect(startHeight, 'height the ease starts from').toBeGreaterThan(expected.from - 12);
  expect(startHeight, 'height the ease starts from').toBeLessThan(expected.from + 12);
  expect(endHeight, 'settled height').toBeGreaterThan(expected.to - 12);
  expect(endHeight, 'settled height').toBeLessThan(expected.to + 12);

  const low = Math.min(startHeight, endHeight);
  const high = Math.max(startHeight, endHeight);
  const intermediates = new Set(
    heights.filter((height) => height > low + 0.5 && height < high - 0.5).map((h) => h.toFixed(2))
  );
  expect(
    intermediates.size,
    `expected the height to pass through intermediate values, saw ${heights.join(', ')}`
  ).toBeGreaterThanOrEqual(3);

  const direction = Math.sign(endHeight - startHeight);
  for (let index = 1; index < heights.length; index++) {
    const delta = heights[index] - heights[index - 1];
    if (Math.abs(delta) <= 0.5) continue;
    expect(
      Math.sign(delta),
      `height reversed at ${Math.round(eased[index].elapsed)}ms (${heights.join(', ')})`
    ).toBe(direction);
  }

  const lastUnsettled = eased.reduce(
    (latest, reading) => (Math.abs(reading.height - endHeight) > 1 ? reading.elapsed : latest),
    eased[0].elapsed
  );
  expect(
    Math.round(lastUnsettled - eased[0].elapsed),
    'time to settle on the final height'
  ).toBeLessThanOrEqual(600);
}

test.describe('block height eases across a language switch', () => {
  test('the desktop hero tagline slides from the English height to the Hebrew one', async ({
    page,
  }) => {
    test.slow();
    await page.setViewportSize({ width: 1280, height: 900 });
    await waitForPortfolioReady(page);

    const readings = await sampleHeightThroughSwitch(page, LAYOUT_TARGETS.heroTagline, 'he', 900);

    await expect(page.locator('html')).toHaveAttribute('lang', 'he');

    expectEasedHeightChange(readings, { from: 240, to: 180 });
  });

  test('the mobile hero tagline slides from the English height to the Estonian one', async ({
    page,
  }) => {
    test.slow();
    await page.setViewportSize({ width: 390, height: 844 });
    await waitForPortfolioReady(page);

    const readings = await sampleHeightThroughSwitch(page, LAYOUT_TARGETS.heroTagline, 'et', 900);

    await expect(page.locator('html')).toHaveAttribute('lang', 'et');

    expectEasedHeightChange(readings, { from: 270, to: 225 });
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
