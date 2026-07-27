# Project: Portfolio — yosefgamble.com

**Last Updated:** 2026-07-27

## Overview

Personal portfolio for Yosef Gamble — Senior Software Engineer (NYC / Auckland). Single-page site with sticky scroll header, hero, about, experience, projects, and footer sections. Multilingual (English/Hebrew/Russian/Estonian) with RTL support and locale-aware routing (`/en`, `/he`, `/ru`, `/et`). Deployed to Cloudflare via OpenNext.

## Technology Stack

- **Framework:** Next.js 16.x (App Router, React 19, Turbopack) with `middleware.ts` for locale routing
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4 with `@theme` custom variables
- **i18n:** i18next + react-i18next (bundled JSON, no backend) — see `i18n.md`
- **Testing:** Vitest + Testing Library (unit), Cypress (E2E), Playwright (animation/layout-stability specs)
- **Linting:** ESLint (next config + prettier), Prettier
- **Deploy:** Cloudflare Workers via `@opennextjs/cloudflare` (`wrangler.jsonc`, `open-next.config.ts`)
- **CI:** GitHub Actions (Node 22, pnpm via Corepack)

## Directory Structure

```
src/app/            # App Router: layout, [locale]/ segment, error/not-found,
                    # sitemap.ts, robots.ts, json-ld.tsx
src/components/     # React components (one per file, default exports)
  icons/            # SVG icon + flag components (barrel export)
src/lib/            # i18n config, cipher character sets, contact helpers
src/hooks/          # useCipherTransition, usePretextHeight
src/data/           # Non-translatable content metadata (experience, projects)
middleware.ts       # Locale redirect + cookie + x-locale header
public/locales/     # Translation JSON (en/, he/, ru/, et/)
__tests__/          # Vitest unit tests (mirrors src/) + fixtures/translations/
cypress/e2e/        # Cypress E2E specs
playwright/         # Playwright perf/layout-stability specs
scripts/            # Asset tooling (process-images.mjs)
.github/workflows   # CI pipeline (ci.yml)
```

## Commands (pnpm)

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Dev server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm start` | Serve production build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest (single run) |
| `pnpm test:watch` | Vitest (watch) |
| `pnpm test:e2e` | Cypress headless (needs a running server) |
| `pnpm test:e2e:open` | Cypress interactive |
| `pnpm test:playwright` | Playwright specs |
| `pnpm build:worker` | OpenNext Cloudflare build |
| `pnpm deploy` / `pnpm preview` | Cloudflare deploy / local preview |

## Path Aliases

`@/*` maps to `src/*`:

```tsx
import SectionHeader from '@/components/SectionHeader';
import i18n from '@/lib/i18n';
```

## Design Tokens (globals.css)

Dark theme with teal accent. All colors defined via Tailwind `@theme`:

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#5eead4` | Accent color, links, highlights |
| `text-primary` | `#e2e8f0` | Headings, names |
| `text-secondary` | `#94a3b8` | Body text |
| `text-muted` | `#64748b` | Labels, dates |
| `bg-dark` | `#0f172a` | Page background |
| `bg-card` / `bg-card-hover` | `rgba(30,41,59,0.3/0.5)` | Project cards |

## CI Pipeline (.github/workflows/ci.yml)

```
lint-and-typecheck ──┐
unit-tests ──────────┤──► build ──► e2e-tests ──► deploy
```

All jobs on `ubuntu-latest`, Node 22, pnpm via Corepack. The build job copies `.env.example` to `.env`.
