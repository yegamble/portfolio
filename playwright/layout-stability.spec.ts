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

async function waitForPortfolioReady(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    if ('fonts' in document) {
      await document.fonts.ready;
    }
  });
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
  test('desktop transition avoids width and height overshoot during animation', async ({
    page,
  }) => {
    test.slow();
    await page.setViewportSize({ width: 1280, height: 900 });
    await waitForPortfolioReady(page);

    const startRects = await readRects(page);

    await page.getByRole('button', { name: /select language/i }).click();
    await page.getByRole('link', { name: 'עברית' }).click();

    const samples = await sampleRects(page, 2200, 100);

    await expect(page.locator('html')).toHaveAttribute('lang', 'he');

    const endRects = await readRects(page);

    expectWithinEnvelope(samples, startRects, endRects, 8);
  });

  test('reduced motion stays inside the same envelope without scramble overshoot', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 390, height: 844 });
    await waitForPortfolioReady(page);

    const startRects = await readRects(page);

    await page.getByRole('button', { name: /select language/i }).click();
    await page.getByRole('link', { name: 'עברית' }).click();

    const samples = await sampleRects(page, 250, 25);

    await expect(page.locator('html')).toHaveAttribute('lang', 'he');

    const endRects = await readRects(page);

    expectWithinEnvelope(samples, startRects, endRects, 3);
  });
});
