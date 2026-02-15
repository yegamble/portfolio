import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import '@/lib/i18n';

process.env.NEXT_PUBLIC_HEBREW_ENABLED = 'true';

afterEach(() => {
  cleanup();
});
