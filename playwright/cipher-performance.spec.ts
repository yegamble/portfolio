import { expect, test, type Page } from '@playwright/test';

/**
 * Performance tests for the cipher text animation during language switching.
 * Measures frame rates, long tasks, and verifies no animation triggers on reload.
 */

async function waitForPortfolioReady(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    if ('fonts' in document) {
      await document.fonts.ready;
    }
  });
}

/** Open the language dropdown and click the target language option. */
async function switchLanguage(page: Page, langLabel: string) {
  await page.getByRole('button', { name: /select language/i }).click();
  await page.getByRole('link', { name: langLabel }).click();
}

test.describe('cipher animation performance', () => {
  test('no cipher animation fires on page reload with stored language', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await waitForPortfolioReady(page);

    // Switch to Hebrew to store the language preference
    await switchLanguage(page, 'עברית');
    await expect(page.locator('html')).toHaveAttribute('lang', 'he');

    // Wait for animation to complete
    await page.waitForTimeout(2500);

    // Inject a mutation observer before reload to detect any cipher animation
    // We'll set it up via an addInitScript so it runs on the reloaded page
    await page.addInitScript(() => {
      (window as unknown as Record<string, unknown>).__cipherAnimationDetected =
        false;
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'characterData' || mutation.type === 'childList') {
            const target =
              mutation.type === 'characterData'
                ? (mutation.target.parentElement as HTMLElement | null)
                : (mutation.target as HTMLElement);
            if (target?.classList?.contains('cipher-char')) {
              (
                window as unknown as Record<string, unknown>
              ).__cipherAnimationDetected = true;
            }
          }
        }
      });
      // Start observing once DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          observer.observe(document.body, {
            characterData: true,
            childList: true,
            subtree: true,
          });
        });
      } else {
        observer.observe(document.body, {
          characterData: true,
          childList: true,
          subtree: true,
        });
      }
    });

    // Reload the page — language should be restored from localStorage
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify language is still Hebrew (restored from localStorage)
    await expect(page.locator('html')).toHaveAttribute('lang', 'he');

    // Wait a bit to see if any animation triggers
    await page.waitForTimeout(1500);

    // Check that no cipher animation was detected after reload
    const animationDetected = await page.evaluate(
      () =>
        (window as unknown as Record<string, unknown>).__cipherAnimationDetected
    );

    expect(
      animationDetected,
      'Cipher animation should NOT fire on page reload when language is already stored'
    ).toBe(false);
  });

  test('language switch animation maintains acceptable frame rate', async ({
    page,
  }) => {
    test.slow();
    await page.setViewportSize({ width: 1280, height: 900 });
    await waitForPortfolioReady(page);

    // Start collecting performance metrics via Long Task API
    await page.evaluate(() => {
      const tasks: PerformanceEntry[] = [];
      const observer = new PerformanceObserver((list) => {
        tasks.push(...list.getEntries());
      });
      observer.observe({ type: 'longtask', buffered: false });

      (window as unknown as Record<string, unknown>).__longTaskObserver =
        observer;
      (window as unknown as Record<string, unknown>).__longTasks = tasks;
    });

    // Trigger language switch animation
    await switchLanguage(page, 'עברית');

    // Wait for animation to fully complete (BASE_DELAY + SPREAD_DURATION + buffer)
    await page.waitForTimeout(2500);

    // Collect long task results
    const results = await page.evaluate(() => {
      const tasks = (
        window as unknown as Record<string, unknown[]>
      ).__longTasks as PerformanceEntry[];
      const observer = (
        window as unknown as Record<string, PerformanceObserver>
      ).__longTaskObserver;
      observer?.disconnect();

      const longTaskCount = tasks.length;
      const totalBlockingTime = tasks.reduce((sum, task) => {
        return sum + Math.max(0, task.duration - 50);
      }, 0);

      return { longTaskCount, totalBlockingTime };
    });

    // Assertions: animation should not cause excessive long tasks
    expect(
      results.longTaskCount,
      `Animation caused ${results.longTaskCount} long tasks (>50ms). Expected fewer than 5.`
    ).toBeLessThan(5);

    expect(
      results.totalBlockingTime,
      `Total blocking time was ${results.totalBlockingTime}ms. Expected less than 200ms.`
    ).toBeLessThan(200);
  });

  test('mobile language switch does not freeze', async ({ page }) => {
    test.slow();
    await page.setViewportSize({ width: 375, height: 812 });
    await waitForPortfolioReady(page);

    // Set up long task observer
    await page.evaluate(() => {
      const tasks: PerformanceEntry[] = [];
      const observer = new PerformanceObserver((list) => {
        tasks.push(...list.getEntries());
      });
      observer.observe({ type: 'longtask', buffered: false });

      (window as unknown as Record<string, unknown>).__longTaskObserver =
        observer;
      (window as unknown as Record<string, unknown>).__longTasks = tasks;
    });

    // Trigger language switch
    await switchLanguage(page, 'עברית');

    // Wait for animation to complete
    await page.waitForTimeout(3000);

    // Collect results
    const results = await page.evaluate(() => {
      const tasks = (
        window as unknown as Record<string, unknown[]>
      ).__longTasks as PerformanceEntry[];
      const observer = (
        window as unknown as Record<string, PerformanceObserver>
      ).__longTaskObserver;
      observer?.disconnect();

      const longTaskCount = tasks.length;
      const totalBlockingTime = tasks.reduce((sum, task) => {
        return sum + Math.max(0, task.duration - 50);
      }, 0);

      return { longTaskCount, totalBlockingTime };
    });

    // Mobile should have minimal long tasks after optimization
    expect(
      results.longTaskCount,
      `Mobile: ${results.longTaskCount} long tasks. Expected fewer than 3.`
    ).toBeLessThan(3);

    expect(
      results.totalBlockingTime,
      `Mobile: ${results.totalBlockingTime}ms blocking time. Expected less than 100ms.`
    ).toBeLessThan(100);
  });

  test('frame rate stays above threshold during animation', async ({
    page,
  }) => {
    test.slow();
    await page.setViewportSize({ width: 1280, height: 900 });
    await waitForPortfolioReady(page);

    // Set up frame rate measurement
    await page.evaluate(() => {
      (window as unknown as Record<string, unknown>).__frameTimes = [];
      (window as unknown as Record<string, unknown>).__measuring = true;

      const frameTimes = (
        window as unknown as Record<string, number[]>
      ).__frameTimes;

      function measure(time: number) {
        if (
          (window as unknown as Record<string, boolean>).__measuring
        ) {
          frameTimes.push(time);
          requestAnimationFrame(measure);
        }
      }
      requestAnimationFrame(measure);
    });

    // Trigger language switch
    await switchLanguage(page, 'עברית');

    // Wait for animation to complete
    await page.waitForTimeout(2500);

    // Stop measuring and calculate FPS
    const fpsData = await page.evaluate(() => {
      (window as unknown as Record<string, boolean>).__measuring = false;

      const frameTimes = (
        window as unknown as Record<string, number[]>
      ).__frameTimes;

      if (frameTimes.length < 2) return { avgFps: 0, minFps: 0, droppedFrames: 0 };

      const deltas: number[] = [];
      for (let i = 1; i < frameTimes.length; i++) {
        deltas.push(frameTimes[i] - frameTimes[i - 1]);
      }

      const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
      const avgFps = 1000 / avgDelta;

      // Find the worst 100ms window for min FPS
      const windowSize = 100; // ms
      let worstFps = Infinity;
      for (let i = 0; i < deltas.length; i++) {
        let windowDuration = 0;
        let frameCount = 0;
        for (let j = i; j < deltas.length && windowDuration < windowSize; j++) {
          windowDuration += deltas[j];
          frameCount++;
        }
        if (windowDuration >= windowSize) {
          const fps = (frameCount / windowDuration) * 1000;
          worstFps = Math.min(worstFps, fps);
        }
      }

      // Count frames that took > 33.3ms (< 30fps)
      const droppedFrames = deltas.filter((d) => d > 33.3).length;

      return {
        avgFps: Math.round(avgFps),
        minFps: Math.round(worstFps === Infinity ? avgFps : worstFps),
        droppedFrames,
      };
    });

    // Average FPS should stay above 30
    expect(
      fpsData.avgFps,
      `Average FPS was ${fpsData.avgFps}. Expected at least 30.`
    ).toBeGreaterThanOrEqual(30);

    // Dropped frames (< 30fps) should be minimal
    expect(
      fpsData.droppedFrames,
      `${fpsData.droppedFrames} frames dropped below 30fps.`
    ).toBeLessThan(10);
  });
});
