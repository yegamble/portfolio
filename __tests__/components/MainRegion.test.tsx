import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import MainRegion from '@/components/MainRegion';

describe('MainRegion', () => {
  it('should expose its children inside the main landmark', () => {
    render(
      <MainRegion>
        <p>Page body</p>
      </MainRegion>
    );

    expect(screen.getByRole('main')).toHaveTextContent('Page body');
  });

  // The skip link in the locale layout is `href="#main"`, and focus only follows
  // it to an element that can hold focus.
  it('should be the skip link target and be able to take focus', () => {
    render(<MainRegion>body</MainRegion>);
    const main = screen.getByRole('main');

    expect(main).toHaveAttribute('id', 'main');
    expect(main).toHaveAttribute('tabindex', '-1');

    main.focus();
    expect(main).toHaveFocus();
  });

  it('should keep the focus ring while taking the page layout from its caller', () => {
    render(<MainRegion className="mx-auto max-w-3xl">body</MainRegion>);
    const main = screen.getByRole('main');

    expect(main).toHaveClass('focus-visible:outline-2', 'focus-visible:outline-primary');
    expect(main).toHaveClass('mx-auto', 'max-w-3xl');
  });
});
