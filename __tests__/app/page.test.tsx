import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('@/components/ScrollHeader', () => ({
  default: () => <div data-testid="scroll-header">Mock ScrollHeader</div>,
}));

vi.mock('@/components/About', () => ({
  default: () => <div data-testid="about">Mock About</div>,
}));

vi.mock('@/components/Experience', () => ({
  default: () => <div data-testid="experience">Mock Experience</div>,
}));

vi.mock('@/components/Projects', () => ({
  default: () => <div data-testid="projects">Mock Projects</div>,
}));

vi.mock('@/components/Footer', () => ({
  default: () => <div data-testid="footer">Mock Footer</div>,
}));

import Home from '@/app/page';

describe('Home Page', () => {
  it('renders all sections successfully', () => {
    const markup = renderToStaticMarkup(<Home />);

    expect(markup).toContain('Mock ScrollHeader');
    expect(markup).toContain('Mock About');
    expect(markup).toContain('Mock Experience');
    expect(markup).toContain('Mock Projects');
    expect(markup).toContain('Mock Footer');

    // Verify layout container class
    expect(markup).toContain('mx-auto w-full max-w-3xl px-6 pb-24 lg:px-8');
  });
});
