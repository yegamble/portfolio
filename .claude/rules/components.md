## Component Conventions

### File Structure

- One component per file in `src/components/`
- Default exports only
- Props interface defined above the component in the same file
- Icons and flag icons barrel-exported from `src/components/icons/index.tsx`
- Reusable logic in `src/hooks/`; non-translatable content metadata in `src/data/`

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
- Respect reduced motion: `motion-reduce:duration-0`; an imperative animation has to check `matchMedia('(prefers-reduced-motion: reduce)')` itself
- Animations that need a measurement (the block-mode `CipherText` height ease) belong in `src/lib/` as a pure element-in/element-out helper — `src/lib/height-ease.ts` — with the measure-and-call glue in a hook (`src/hooks/useBlockHeightEase.ts`) so the component stays at composition level. Measure in a `useLayoutEffect` (fall back to `useEffect` when there is no `window`, or React warns during SSR), never during render, and take the settled size from a `ResizeObserver` so nothing forces a reflow on the hot path
- An element carrying imperative inline styles must be the *same DOM node* across every render branch that can produce it — same element type, same position, no key — or React remounts it mid-animation and the styles vanish (see the `block` wrapper in `CipherText`)
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
- Never let an `aria-label` replace a control's visible text — put the description in the control's own content behind `sr-only` so the accessible name contains the visible label (WCAG 2.5.3). This covers the new-tab notice on external links (`Experience`) and the language trigger's label (`LanguageSelector`); an aria-label is only for a control with no visible text of its own (an icon button, a carousel dot)
- Never bake a word of English into a label that every locale renders — the description belongs in a translation key, not in a template string
- Where the notice goes depends on what the link sits inside. A link that *is* the whole content of a heading renames that heading, so point `aria-describedby` at one shared `sr-only` element instead (see `Experience`). A link that stands among near-identical siblings keeps the suffix in its content, where it becomes part of the name and tells the links apart (see the repo links in `Projects`) — visible text first, so the name still starts with what the reader can see
- A menu that unmounts on selection must hand focus back to its trigger, and an in-place change with no navigation needs a `role="status" aria-live="polite"` region to announce it (see `LanguageSelector`)
- Anything that resolves after the view is already on screen has to be announced, not merely rendered: `role="status"` for progress and success, `role="alert"` for failure (see `PgpKeyModal`). Keep the region outside the control it describes, and mount it empty rather than alongside its first message
- `SkipLink` is the first focusable element in the body; a new landmark that a keyboard user has to reach past the sticky header belongs behind it. `<main>` carries `id="main"` and `tabIndex={-1}` so following the link moves focus, not just the viewport, plus a `focus-visible` outline so the landing is visible. Every route that renders under the locale layout needs that target — `error.tsx` included — or the link points at nothing
- Interactive targets are at least 24×24px (WCAG 2.5.8). A small visual (an 8px carousel dot) goes inside a `h-6 w-6 flex items-center justify-center` button with the visual marked `aria-hidden`. Assert the size in Cypress from a real box, not by matching class strings in a unit test; contrast is Lighthouse's job
- Non-text UI (dots, borders, icons that carry meaning) needs 3:1 against its background: `bg-slate-500` clears it on `bg-dark`, `bg-slate-600` does not
- Content that stays English on every locale — the technology tags and repo names sourced from `src/data/*` — carries `lang="en"` so a screen reader does not read it with the surrounding language's phonetics (WCAG 3.1.2)
- Hiding a control means hiding the control: put `aria-hidden` and `inert` on the interactive element itself, not on a wrapper inside it, or the element stays in the accessibility tree (see the collapsed brand link in `ScrollHeader`)
- A scroll container with nothing focusable inside is unreachable from the keyboard on WebKit — give it `tabIndex={0}` and a `role`/`aria-label` (see the key block in `PgpKeyModal`)
