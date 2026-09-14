import { defineConfig } from '@playwright/test';

const PORT = 3100;
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './playwright',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    // The layout project has no retries by design, so `on-first-retry` would
    // never produce anything for the suite most likely to fail in CI and
    // nowhere else.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      // Geometry and accessibility: both are deterministic given a rendered
      // page, so deliberately no retries — a retry would let a real regression
      // that only reproduces sometimes pass as "flaky".
      name: 'layout',
      testMatch: /(layout-stability|a11y)\.spec\.ts/,
      retries: 0,
    },
    {
      // Frame-rate, long-task and animation-shape numbers are wall-clock
      // measurements taken in a browser that shares the machine with every
      // other worker, so what these specs need above all is the machine to
      // themselves (measured: 3/3 clean alone, 3/6 failing both attempts while
      // the 16 layout tests ran beside them). Locally that means running after
      // the layout project; in CI it means a runner of their own, which is what
      // the `playwright-perf` job is for. On that runner they also run one at a
      // time, and the retries are for whatever noise is left — which is also
      // what gives the trace setting above something to capture.
      name: 'perf',
      testMatch: /(cipher-performance|height-ease)\.spec\.ts/,
      // CI runs the two projects as two jobs on two runners, so the job split
      // already provides the separation — and declaring the dependency there
      // would make `--project=perf` re-run all sixteen layout specs first. A
      // local `pnpm test:playwright` runs both projects in one process, where
      // the dependency is the only thing keeping them off each other.
      dependencies: isCI ? [] : ['layout'],
      retries: isCI ? 2 : 1,
      workers: isCI ? 1 : undefined,
    },
  ],
  webServer: {
    // CI measures a production build of the commit under test: the browser
    // jobs download the `build` job's `.next` artifact and this serves it.
    // `next dev` recompiles per route and ships the dev overlay, so its frame
    // budget is a different number entirely. Locally the dev server stays,
    // because the edit -> rerun loop is the point.
    //
    // NEXT_PUBLIC_CIPHER_TRANSITION is inlined into the bundle at build time,
    // which is why the CI command does not set it: the value that matters was
    // fixed by `pnpm build` in the `build` job, from the tracked
    // `.env.production`. The dev server compiles on demand and never loads
    // that file (Next reads it for production builds only), so it is set here.
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
