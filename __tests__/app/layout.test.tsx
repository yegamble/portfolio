import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('next/font/google', () => ({
  Inter: () => ({
    variable: '--font-inter',
  }),
  Heebo: () => ({
    variable: '--font-heebo',
  }),
}));

vi.mock('@/components/I18nProvider', () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

import RootLayout from '@/app/layout';

describe('RootLayout', () => {
  it('renders children inside the layout shell', () => {
    const markup = renderToStaticMarkup(
      <RootLayout>
        <div>Smoke Child</div>
      </RootLayout>
    );

    expect(markup).toContain('Smoke Child');
    expect(markup).toContain('lang="en"');
    expect(markup).toContain('pointer-events-none');
  });
});
