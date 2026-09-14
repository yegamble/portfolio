import { expect, test, type Page } from '@playwright/test';

/**
 * The block-mode CipherText wrapper eases its height across a language switch
 * (src/lib/height-ease.ts, useBlockHeightEase). These assertions are about the
 * SHAPE of that animation over time — how many intermediate frames it paints
 * and how long it takes to settle — rather than about resting geometry, so they
 * live in the `perf` project with the frame-rate specs: they share the same
 * sensitivity to a machine that is busy, and the same need for a retry, and
 * they would be a foreign body in the layout project's deliberate no-retry
 * determinism.
 */

const HERO_TAGLINE = 'header + section h1';

async function waitForPortfolioReady(page: Page, path = '/') {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    if (!('fonts' in document)) return;
    await document.fonts.ready;

    // fonts.ready only settles the faces the CURRENT page actually uses. Heebo
    // is pulled in by `html:lang(he) body` in globals.css, so nothing requests
    // it until the very switch these specs measure — and a face finishing
    // mid-sample re-wraps a line and moves the height being sampled.
    const pending = Array.from(document.fonts).filter((face) => face.family.includes('Heebo'));
    await Promise.all(pending.map((face) => face.load().catch(() => undefined)));
    await document.fonts.ready;
  });
}

/**
 * Sample one element's height across a language switch, every animation frame.
 *
 * The click is issued from inside the sampling loop, a couple of frames in, for
 * two reasons. The obvious one is switchLanguageInPage's: locator.click()
 * scrolls its target into view and the trigger lives in a sticky header. The
 * subtle one is that reading a rect straight after a synchronous click() forces
 * a layout the reader never sees — the selector flips documentElement.lang in
 * the handler, so a read in that same task already reports the post-flip
 * geometry even though the frame on screen still shows the old one. Sampling
 * from rAF only ever reads state that was actually painted.
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
      let frame = 0;
      const sample = () => {
        readings.push({
          elapsed: performance.now() - startedAt,
          height: element.getBoundingClientRect().height,
        });
        frame++;
        if (frame === 2) {
          document.querySelector<HTMLAnchorElement>(`header a[hreflang="${code}"]`)?.click();
        }
        if (running) requestAnimationFrame(sample);
      };

      requestAnimationFrame(sample);
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
 * necessarily the first one, since the switch can reflow more than once. On
 * en->he the selector's synchronous documentElement.lang flip re-wraps the
 * still-English text in Heebo's metrics, which already lands on the Hebrew
 * height; the ease then carries the box down from the English one the reader
 * had on screen.
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
  ).toBeGreaterThanOrEqual(1);

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

    const readings = await sampleHeightThroughSwitch(page, HERO_TAGLINE, 'he', 900);

    await expect(page.locator('html')).toHaveAttribute('lang', 'he');

    expectEasedHeightChange(readings, { from: 240, to: 180 });
  });

  test('the mobile hero tagline slides from the English height to the Estonian one', async ({
    page,
  }) => {
    test.slow();
    await page.setViewportSize({ width: 390, height: 844 });
    await waitForPortfolioReady(page);

    const readings = await sampleHeightThroughSwitch(page, HERO_TAGLINE, 'et', 900);

    await expect(page.locator('html')).toHaveAttribute('lang', 'et');

    expectEasedHeightChange(readings, { from: 270, to: 225 });
  });
});
