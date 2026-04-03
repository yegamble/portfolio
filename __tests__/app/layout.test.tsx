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
  it('has a non-empty title', () => {
    expect(typeof metadata.title).toBe('string');
    expect((metadata.title as string).length).toBeGreaterThan(0);
  });

  it('has a non-empty description', () => {
    const desc = metadata.description as string;
    expect(typeof desc).toBe('string');
    expect(desc.length).toBeGreaterThan(0);
  });

  it('has Open Graph metadata with image', () => {
    const og = metadata.openGraph as Record<string, unknown>;
    expect(og).toBeDefined();
    expect(typeof og.title).toBe('string');
    expect(og.type).toBe('website');
    expect(og.images).toBeDefined();

    const images = og.images as Array<{ url: string; width: number; height: number }>;
    expect(images).toHaveLength(1);
    expect(images[0].url).toMatch(/\.(jpg|png|webp)$/);
    expect(images[0].width).toBe(1200);
    expect(images[0].height).toBe(630);
  });

  it('has Twitter Card set to summary_large_image', () => {
    const twitter = metadata.twitter as Record<string, unknown>;
    expect(twitter).toBeDefined();
    expect(twitter.card).toBe('summary_large_image');
    expect(typeof twitter.title).toBe('string');
  });

  it('has canonical URL in alternates', () => {
    const alternates = metadata.alternates as NonNullable<Metadata['alternates']>;
    expect(alternates).toBeDefined();
    expect(typeof alternates.canonical).toBe('string');
    expect((alternates.canonical as string)).toMatch(/^https:\/\//);
  });

  it('has keywords array with relevant terms', () => {
    const keywords = metadata.keywords as string[];
    expect(keywords).toBeDefined();
    expect(Array.isArray(keywords)).toBe(true);
    expect(keywords.length).toBeGreaterThan(0);
    keywords.forEach((kw) => {
      expect(typeof kw).toBe('string');
      expect(kw.length).toBeGreaterThan(0);
    });
  });
});
