// All CipherText instances use the same viewport margin, so one observer can
// dispatch visibility changes to their individual subscribers.
const subscribers = new Map<Element, (visible: boolean) => void>();
let observer: IntersectionObserver | null = null;

export function observeCipherVisibility(element: Element, onChange: (visible: boolean) => void) {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          subscribers.get(entry.target)?.(entry.isIntersecting);
        }
      },
      { rootMargin: '200px' }
    );
  }

  subscribers.set(element, onChange);
  observer.observe(element);

  return () => {
    subscribers.delete(element);
    observer?.unobserve(element);
    if (subscribers.size === 0) {
      observer?.disconnect();
      observer = null;
    }
  };
}
