import { defineConfig } from '@playwright/test';

const PORT = 3100;

export default defineConfig({
  testDir: './playwright',
  fullyParallel: true,
  // The frame-rate and long-task specs are wall-clock measurements taken inside
  // a browser that shares the machine with the other workers, so a busy run can
  // starve one of them. A retry separates that contention noise from a real
  // regression, which fails every attempt — and it makes the trace setting below
  // (on-first-retry) actually produce something.
  retries: process.env.CI ? 2 : 1,
  reporter: 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
  },
  webServer: {
    command:
      `NEXT_PUBLIC_CIPHER_TRANSITION=true ` +
      `pnpm exec next dev --turbopack --hostname 127.0.0.1 --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
