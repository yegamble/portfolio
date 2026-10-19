import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { observeCipherVisibility } from '@/lib/cipher-visibility';
import { stubIntersectionObserver } from '../helpers/observers';

describe('shared cipher visibility', () => {
  let viewport: ReturnType<typeof stubIntersectionObserver>;
  let cleanups: (() => void)[];

  beforeEach(() => {
    viewport = stubIntersectionObserver();
    cleanups = [];
  });

  afterEach(() => {
    cleanups.forEach((cleanup) => cleanup());
    viewport.restore();
  });

  it('routes a batch to the correct subscribers and keeps observing surviving instances', () => {
    const first = document.createElement('span');
    const second = document.createElement('span');
    const onFirst = vi.fn();
    const onSecond = vi.fn();
    const stopFirst = observeCipherVisibility(first, onFirst);
    cleanups.push(stopFirst, observeCipherVisibility(second, onSecond));
    expect(viewport.ctor).toHaveBeenCalledTimes(1);
    expect(viewport.ctor).toHaveBeenCalledWith(expect.any(Function), { rootMargin: '200px' });

    const emit = () =>
      viewport.callbacks[0](
        [
          { target: first, isIntersecting: false },
          { target: second, isIntersecting: true },
        ] as unknown as IntersectionObserverEntry[],
        {} as IntersectionObserver
      );
    emit();
    expect(onFirst).toHaveBeenCalledWith(false);
    expect(onSecond).toHaveBeenCalledWith(true);

    stopFirst();
    cleanups.shift();
    expect(viewport.unobserve).toHaveBeenCalledWith(first);
    expect(viewport.disconnect).not.toHaveBeenCalled();
    emit(); // Queued entries for an unmounted element are ignored.
    expect(onFirst).toHaveBeenCalledTimes(1);
    expect(onSecond).toHaveBeenCalledTimes(2);
  });

  it('disconnects after the last unmount and recreates the observer on remount', () => {
    const element = document.createElement('span');
    observeCipherVisibility(element, vi.fn())();
    expect(viewport.disconnect).toHaveBeenCalledTimes(1);
    const onChange = vi.fn();
    cleanups.push(observeCipherVisibility(element, onChange));
    expect(viewport.ctor).toHaveBeenCalledTimes(2);
    viewport.emit(true);
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
