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
  webServer: {
    command:
      `NEXT_PUBLIC_HEBREW_ENABLED=true ` +
      `NEXT_PUBLIC_CIPHER_TRANSITION=true ` +
      `npx -y node@20 ./node_modules/next/dist/bin/next dev --turbopack --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
