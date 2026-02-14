import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TechTag from '@/components/TechTag';

describe('TechTag', () => {
  it('should render the label text', () => {
    render(
      <ul>
        <TechTag label="React" />
      </ul>
    );
    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('should render as a list item', () => {
    const { container } = render(
      <ul>
        <TechTag label="Go" />
      </ul>
    );
    const li = container.querySelector('li');
    expect(li).toBeInTheDocument();
  });

  it('should apply pill styling classes', () => {
    render(
      <ul>
        <TechTag label="Docker" />
      </ul>
    );
    const pill = screen.getByText('Docker');
    expect(pill).toHaveClass('rounded-full', 'px-3', 'py-1', 'text-xs', 'font-medium');
  });

  it('should apply border and background classes', () => {
    render(
      <ul>
        <TechTag label="AWS" />
      </ul>
    );
    const pill = screen.getByText('AWS');
    expect(pill).toHaveClass('border', 'border-border-subtle');
  });

  it('should render different technology labels correctly', () => {
    const { rerender } = render(
      <ul>
        <TechTag label="TypeScript" />
      </ul>
    );
    expect(screen.getByText('TypeScript')).toBeInTheDocument();

    rerender(
      <ul>
        <TechTag label="PostgreSQL" />
      </ul>
    );
    expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
  });

  it('should render with text-primary color class', () => {
    render(
      <ul>
        <TechTag label="Redis" />
      </ul>
    );
    expect(screen.getByText('Redis')).toHaveClass('text-primary');
  });
});
