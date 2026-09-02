interface MainRegionProps {
  children: React.ReactNode;
  /** Layout classes for this particular page; the focus ring is added here. */
  className?: string;
}

/**
 * The skip link's target, in one place.
 *
 * `SkipLink` renders `href="#main"` from the locale layout, which sits above
 * both the page and its error boundary — so both have to provide the target or
 * the link points at nothing on whichever one forgot. They did in fact carry
 * identical copies of this element.
 *
 * `tabIndex={-1}` is what moves focus here rather than only the viewport;
 * without it the next Tab press returns to the header. The outline tells a
 * keyboard user the jump landed, and `focus-visible` keeps it off a mouse click
 * into the same region.
 */
export default function MainRegion({ children, className = '' }: MainRegionProps) {
  return (
    <main
      id="main"
      tabIndex={-1}
      className={`focus-visible:outline-2 focus-visible:outline-primary ${className}`}
    >
      {children}
    </main>
  );
}
