import { defineConfig } from '@playwright/test';

const PORT = 3100;
const isCI = !!process.env.CI;

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
      // Frame-rate, long-task and animation-shape numbers are wall-clock
      // measurements taken in a browser that shares the machine with every
      // other worker. Running them
      // after the layout project rather than alongside it is what actually makes
      // them stable (measured: 3/3 clean alone, 3/6 failing both attempts while
      // the 12 layout tests ran beside them); the retry is then only there for
      // whatever noise is left, and it gives the trace setting above something
      // to capture.
      // The same reasoning applies inside the project on a CI runner, which is
      // smaller and busier than a laptop: there these specs run one at a time.
      name: 'perf',
      testMatch: /(cipher-performance|height-ease)\.spec\.ts/,
      dependencies: ['layout'],
      retries: isCI ? 2 : 1,
      workers: isCI ? 1 : undefined,
    },
  ],
  webServer: {
    // CI measures the production bundle, which is what these specs were tuned
    // against and what ships: the `playwright` job downloads the `build` job's
    // `.next` artifact and this serves it. `next dev` recompiles per route and
    // ships the dev overlay, so its frame budget is a different number
    // entirely. Locally the dev server stays, because the edit -> rerun loop is
    // the point. NEXT_PUBLIC_CIPHER_TRANSITION is inlined at build time, so the
    // production server reads it from `.env` (CI copies `.env.example`, which
    // enables it) rather than from this command line.
    command: isCI
      ? `pnpm exec next start -p ${PORT}`
      : `NEXT_PUBLIC_CIPHER_TRANSITION=true ` +
        `pnpm exec next dev --turbopack --hostname 127.0.0.1 --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    // Never inherit a server in CI: it would be a stale build from a previous
    // step, and the measurements would describe code that is not under test.
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
