import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import '@/lib/i18n';

process.env.NEXT_PUBLIC_I18N_ENABLED = 'true';
process.env.NEXT_PUBLIC_CONTACT_EMAIL = 'yegamble@gmail.com';
process.env.NEXT_PUBLIC_SECURE_CONTACT_EMAIL = 'yosef.gamble@protonmail.com';

afterEach(() => {
  cleanup();
});
