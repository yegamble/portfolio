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
      include: ['src/**'],
      reporter: ['text-summary', 'json-summary'],
      // Ratcheted to just under the measured numbers (97.5 statements, 92.5
      // branches, 98.5 functions, 98.1 lines), close enough that deleting a
      // suite fails the build and far enough that one refactor does not.
      // Raise these when the real numbers move up; never lower them to make a
      // change fit.
      thresholds: {
        lines: 97,
        branches: 90,
        functions: 97,
        statements: 96,
      },
    },
  },
});
