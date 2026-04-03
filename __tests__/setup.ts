import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import i18n from '@/lib/i18n';

import testEn from './fixtures/translations/en.json';
import testHe from './fixtures/translations/he.json';
import testRu from './fixtures/translations/ru.json';

// Override i18n with generic test translations so production resume changes
// never break the test suite.
i18n.addResourceBundle('en', 'translation', testEn, false, true);
i18n.addResourceBundle('he', 'translation', testHe, false, true);
i18n.addResourceBundle('ru', 'translation', testRu, false, true);

process.env.NEXT_PUBLIC_I18N_ENABLED = 'true';
process.env.NEXT_PUBLIC_CONTACT_EMAIL = 'test@example.com';
process.env.NEXT_PUBLIC_SECURE_CONTACT_EMAIL = 'secure-test@example.com';

afterEach(() => {
  cleanup();
});
