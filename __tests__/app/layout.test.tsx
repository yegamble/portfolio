import type { ReactNode } from 'react';
import type { Metadata } from 'next';
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

import RootLayout, { metadata } from '@/app/layout';

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

describe('metadata', () => {
  it('has SEO-optimized title with name and keywords', () => {
    expect(metadata.title).toContain('Yosef Gamble');
    expect(metadata.title).toContain('Senior Software Engineer');
  });

  it('has keyword-rich description covering all target terms', () => {
    const desc = metadata.description as string;
    expect(desc).toContain('Yosef Gamble');
    expect(desc).toContain('Senior Software Engineer');
    expect(desc).toContain('New York');
    expect(desc).toContain('Auckland');
    expect(desc).toContain('Go');
    expect(desc).toContain('Golang');
    expect(desc.toLowerCase()).toContain('real estate');
    expect(desc).toContain('video streaming');
  });

  it('has Open Graph metadata with image', () => {
    const og = metadata.openGraph as Record<string, unknown>;
    expect(og).toBeDefined();
    expect(og.title).toContain('Yosef Gamble');
    expect(og.type).toBe('website');
    expect(og.images).toBeDefined();

    const images = og.images as Array<{ url: string; width: number; height: number }>;
    expect(images).toHaveLength(1);
    expect(images[0].url).toBe('/images/og-image.jpg');
    expect(images[0].width).toBe(1200);
    expect(images[0].height).toBe(630);
  });

  it('has Twitter Card set to summary_large_image', () => {
    const twitter = metadata.twitter as Record<string, unknown>;
    expect(twitter).toBeDefined();
    expect(twitter.card).toBe('summary_large_image');
    expect(twitter.title).toContain('Yosef Gamble');
  });

  it('has canonical URL in alternates', () => {
    const alternates = metadata.alternates as NonNullable<Metadata['alternates']>;
    expect(alternates).toBeDefined();
    expect(alternates.canonical).toBe('https://yosefgamble.com');
  });

  it('has keywords array with target terms', () => {
    const keywords = metadata.keywords as string[];
    expect(keywords).toBeDefined();
    expect(keywords).toContain('Yosef Gamble');
    expect(keywords).toContain('Golang');
    expect(keywords).toContain('senior software engineer');
  });
});
