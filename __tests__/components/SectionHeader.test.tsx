import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SectionHeader from '@/components/SectionHeader';

describe('SectionHeader', () => {
  it('should render the title text', () => {
    render(<SectionHeader title="About" />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('About');
  });

  it('should render an h2 element', () => {
    render(<SectionHeader title="Experience" />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading.tagName).toBe('H2');
  });

  it('should render the horizontal divider line', () => {
    const { container } = render(<SectionHeader title="Projects" />);
    const divider = container.querySelector('.h-px.flex-1.bg-slate-800');
    expect(divider).toBeInTheDocument();
  });

  it('should apply custom className when provided', () => {
    const { container } = render(
      <SectionHeader title="Test" className="mb-12" />
    );
    const wrapper = container.firstElementChild;
    expect(wrapper).toHaveClass('mb-12');
  });

  it('should apply default flex layout classes', () => {
    const { container } = render(<SectionHeader title="Test" />);
    const wrapper = container.firstElementChild;
    expect(wrapper).toHaveClass('flex', 'items-center', 'gap-4');
  });

  it('should render uppercase tracking-widest title styling', () => {
    render(<SectionHeader title="About" />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveClass(
      'text-sm',
      'font-bold',
      'uppercase',
      'tracking-widest'
    );
  });

  it('should render different titles correctly', () => {
    const { rerender } = render(<SectionHeader title="About" />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('About');

    rerender(<SectionHeader title="Experience" />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Experience');

    rerender(<SectionHeader title="Projects" />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Projects');
  });

  it('should work without className prop', () => {
    const { container } = render(<SectionHeader title="Test" />);
    const wrapper = container.firstElementChild;
    expect(wrapper).toBeInTheDocument();
  });
});
