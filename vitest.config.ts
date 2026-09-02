import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: './__tests__/setup.ts',
    include: ['__tests__/**/*.test.{ts,tsx}'],
    css: false,
    coverage: {
      provider: 'v8',
      include: ['src/**', 'middleware.ts'],
      reporter: ['text-summary', 'json-summary'],
      thresholds: {
        lines: 88,
        branches: 80,
        functions: 90,
        statements: 88,
      },
    },
  },
});
