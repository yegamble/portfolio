import { defineConfig } from '@playwright/test';

const PORT = 3100;

export default defineConfig({
  testDir: './playwright',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      // Deliberately no retries. These assert geometry, which is deterministic;
      // a retry would let a real layout regression that only reproduces
      // sometimes pass as "flaky".
      name: 'layout',
      testMatch: /layout-stability\.spec\.ts/,
      retries: 0,
    },
    {
      // Frame-rate and long-task numbers are wall-clock measurements taken in a
      // browser that shares the machine with every other worker. Running them
      // after the layout project rather than alongside it is what actually makes
      // them stable (measured: 3/3 clean alone, 3/6 failing both attempts while
      // the 12 layout tests ran beside them); the retry is then only there for
      // whatever noise is left, and it gives the trace setting above something
      // to capture.
      name: 'perf',
      testMatch: /cipher-performance\.spec\.ts/,
      dependencies: ['layout'],
      retries: process.env.CI ? 2 : 1,
    },
  ],
  webServer: {
    command:
      `NEXT_PUBLIC_CIPHER_TRANSITION=true ` +
      `pnpm exec next dev --turbopack --hostname 127.0.0.1 --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
