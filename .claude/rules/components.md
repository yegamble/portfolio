## Component Conventions

### File Structure

- One component per file in `components/`
- Default exports only
- Props interface defined above the component in the same file
- Icons barrel-exported from `components/icons/index.tsx`

### Client vs Server Components

Most components use `'use client'` because they depend on `useTranslation()` or browser APIs.

**Server components** (no directive needed): `SectionHeader`, `TechTag` — pure presentational, no hooks.

When creating new components, only add `'use client'` if the component uses hooks, event handlers, or browser APIs.

### Props Pattern

```tsx
interface ComponentProps {
  title: string;
  className?: string;  // Allow parent to add Tailwind classes
}

export default function Component({ title, className = '' }: ComponentProps) {
  return <div className={`base-classes ${className}`}>{title}</div>;
}
```

### Styling

- Tailwind utility classes only — no CSS modules or styled-components
- Use design tokens from `globals.css`: `text-primary`, `text-text-muted`, `bg-bg-card`, etc.
- Transitions: `transition-colors`, `transition-transform`, `transition-all` with `duration-500 ease-out`
- Respect reduced motion: `motion-reduce:duration-0`
- Hover states on interactive elements: `hover:text-primary`, `hover:border-primary`

### Section Component Pattern

Each main section follows this structure:

```tsx
'use client';
import { useTranslation } from 'react-i18next';
import SectionHeader from '@/components/SectionHeader';

export default function SectionName() {
  const { t } = useTranslation();
  return (
    <section
      id="section-id"
      className="scroll-mt-24 border-t border-slate-800/30 py-16 md:py-24"
      aria-label={t('section.ariaLabel')}
    >
      <SectionHeader title={t('section.heading')} className="mb-12" />
      {/* Content */}
    </section>
  );
}
```

### Accessibility

- Semantic HTML: `<nav>`, `<header>`, `<footer>`, `<section>`, `<ol>`, `<ul>`
- `aria-label` on all sections and landmark elements
- `aria-hidden` for decorative/conditionally visible elements
- `sr-only` class for screen-reader-only text (social link labels)
- External links: `target="_blank" rel="noreferrer noopener"`
- `tabIndex={isScrolled ? 0 : -1}` for conditional focusability
