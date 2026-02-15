## Project: Portfolio — yosefgamble.com

**Last Updated:** 2026-02-15

### Overview

Personal portfolio for Yosef Gamble — NYC-based Senior Full-Stack Engineer. Single-page site with sticky scroll header, hero, about, experience, projects, and footer sections. Bilingual (English/Hebrew) with RTL support.

### Technology Stack

- **Framework:** Next.js 16.1.6 (App Router, React 19, Turbopack)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4 with `@theme` custom variables
- **i18n:** i18next + react-i18next (bundled JSON, no backend)
- **Testing:** Vitest + Testing Library (unit), Cypress 15 (E2E)
- **Linting:** ESLint (next config + prettier), Prettier
- **CI:** GitHub Actions (Node 22) — lint → typecheck → test → build → E2E

### Directory Structure

```
app/              # Next.js App Router (layout, page, globals.css)
components/       # React components (one per file, default exports)
  icons/          # SVG icon components (barrel export)
lib/              # Utilities (i18n config)
public/locales/   # Translation JSON files (en/, he/)
__tests__/        # Vitest unit tests (mirrors components/)
cypress/e2e/      # Cypress E2E specs
.github/workflows # CI pipeline
```

### Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest (single run) |
| `npm run test:watch` | Vitest (watch mode) |
| `npm run test:e2e` | Cypress headless |
| `npm run test:e2e:open` | Cypress interactive |

### Path Aliases

`@/*` maps to project root. Use for all imports:

```tsx
import SectionHeader from '@/components/SectionHeader';
import i18n from '@/lib/i18n';
```

### Design Tokens (globals.css)

Dark theme with teal accent. All colors defined via Tailwind `@theme`:

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#5eead4` | Accent color, links, highlights |
| `text-primary` | `#e2e8f0` | Headings, names |
| `text-secondary` | `#94a3b8` | Body text |
| `text-muted` | `#64748b` | Labels, dates |
| `bg-dark` | `#0f172a` | Page background |
| `bg-card` / `bg-card-hover` | `rgba(30,41,59,0.3/0.5)` | Project cards |

### CI Pipeline (GitHub Actions)

```
lint-and-typecheck ──┐
unit-tests ──────────┤──► build ──► e2e-tests
```

All jobs run on `ubuntu-latest` with Node 22.
