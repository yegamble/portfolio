import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ScrambledText from '@/components/ScrambledText';

// ---------------------------------------------------------------------------
// Setup: mock requestAnimationFrame with fake timers
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.useFakeTimers();
  let id = 0;
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    id += 1;
    setTimeout(() => cb(performance.now()), 0);
    return id;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((frameId) => {
    clearTimeout(frameId);
  });
  // Default: allow motion
  vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
    matches: false, // prefers-reduced-motion: reduce → false (motion allowed)
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ScrambledText', () => {
  it('should render the children text on initial mount', () => {
    render(<ScrambledText>Hello World</ScrambledText>);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('should render as a <span> element', () => {
    const { container } = render(<ScrambledText>Test</ScrambledText>);
    expect(container.querySelector('span')).toBeInTheDocument();
    expect(container.querySelector('span')?.textContent).toBe('Test');
  });

  it('should forward className to the span', () => {
    const { container } = render(
      <ScrambledText className="custom-class">Text</ScrambledText>
    );
    expect(container.querySelector('span.custom-class')).toBeInTheDocument();
  });

  it('should NOT animate on initial mount', () => {
    render(<ScrambledText>Initial</ScrambledText>);
    // requestAnimationFrame may be called, but the text should remain the same
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByText('Initial')).toBeInTheDocument();
  });

  it('should start animation when children change', () => {
    const { rerender } = render(<ScrambledText>Before</ScrambledText>);

    act(() => {
      rerender(<ScrambledText>After!</ScrambledText>);
    });

    // After a very short time, the text should be in a scrambled state
    act(() => {
      vi.advanceTimersByTime(50);
    });

    const span = screen.getByText((_content, element) => {
      return element?.tagName === 'SPAN' && element.textContent !== 'Before';
    });
    expect(span).toBeInTheDocument();
  });

  it('should settle on the final text after animation completes', () => {
    const { rerender, container } = render(
      <ScrambledText>Start</ScrambledText>
    );

    act(() => {
      rerender(<ScrambledText>End!!</ScrambledText>);
    });

    // Advance well past the default duration (1200ms)
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    const span = container.querySelector('span');
    expect(span?.textContent).toBe('End!!');
  });

  it('should cancel previous animation when children change again mid-animation', () => {
    const { rerender, container } = render(
      <ScrambledText>First</ScrambledText>
    );

    act(() => {
      rerender(<ScrambledText>Second</ScrambledText>);
    });

    // Mid-animation, change again
    act(() => {
      vi.advanceTimersByTime(100);
    });

    act(() => {
      rerender(<ScrambledText>Third</ScrambledText>);
    });

    // Complete the animation
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    const span = container.querySelector('span');
    expect(span?.textContent).toBe('Third');
  });

  it('should skip animation when prefers-reduced-motion is set', () => {
    // Override matchMedia to indicate reduced motion preference
    vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { rerender, container } = render(
      <ScrambledText>Before</ScrambledText>
    );

    act(() => {
      rerender(<ScrambledText>After</ScrambledText>);
    });

    // With reduced motion, the span should show the React-rendered children
    // immediately (no scramble override)
    const span = container.querySelector('span');
    expect(span?.textContent).toBe('After');
  });

  it('should not animate when children do not actually change', () => {
    const { rerender, container } = render(
      <ScrambledText>Same</ScrambledText>
    );

    act(() => {
      rerender(<ScrambledText>Same</ScrambledText>);
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    const span = container.querySelector('span');
    expect(span?.textContent).toBe('Same');
  });

  it('should handle empty string children', () => {
    const { container } = render(<ScrambledText>{''}</ScrambledText>);
    const span = container.querySelector('span');
    expect(span?.textContent).toBe('');
  });

  it('should handle transition to empty string', () => {
    const { rerender, container } = render(
      <ScrambledText>Content</ScrambledText>
    );

    act(() => {
      rerender(<ScrambledText>{''}</ScrambledText>);
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    const span = container.querySelector('span');
    expect(span?.textContent).toBe('');
  });

  it('should handle Hebrew text as children', () => {
    render(<ScrambledText>{'אודות'}</ScrambledText>);
    expect(screen.getByText('אודות')).toBeInTheDocument();
  });

  it('should animate from English to Hebrew when children change', () => {
    const { rerender, container } = render(
      <ScrambledText>About</ScrambledText>
    );

    act(() => {
      rerender(<ScrambledText>{'אודות'}</ScrambledText>);
    });

    // Complete animation
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    const span = container.querySelector('span');
    expect(span?.textContent).toBe('אודות');
  });

  it('should clean up animation on unmount', () => {
    const { rerender, unmount } = render(
      <ScrambledText>Before</ScrambledText>
    );

    act(() => {
      rerender(<ScrambledText>After</ScrambledText>);
    });

    // Unmount during animation
    unmount();

    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });

  it('should pass custom scrambleOptions through to the engine', () => {
    const { rerender, container } = render(
      <ScrambledText scrambleOptions={{ duration: 100 }}>Quick</ScrambledText>
    );

    act(() => {
      rerender(
        <ScrambledText scrambleOptions={{ duration: 100 }}>Done!</ScrambledText>
      );
    });

    // With duration=100, completing by 300ms should be safe
    act(() => {
      vi.advanceTimersByTime(300);
    });

    const span = container.querySelector('span');
    expect(span?.textContent).toBe('Done!');
  });
});
