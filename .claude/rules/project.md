# Project: Portfolio — yosefgamble.com

**Last Updated:** 2026-09-02

## Overview

Personal portfolio for Yosef Gamble — Senior Software Engineer (NYC / Auckland). Single-page site with sticky scroll header, hero, about, experience, projects, and footer sections. Multilingual (English/Hebrew/Russian/Estonian) with RTL support and locale-aware routing (`/en`, `/he`, `/ru`, `/et`). Deployed to Cloudflare via OpenNext.

## Technology Stack

- **Framework:** Next.js 16.x (App Router, React 19, Turbopack) with `src/middleware.ts` for locale routing. It has to live under `src/`: with a `src/` directory present, `next dev --turbopack` silently ignores a project-root `middleware.ts` (production builds find it either way), so the locale redirect simply did not run in dev
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4 with `@theme` custom variables
- **i18n:** i18next + react-i18next (bundled JSON, no backend) — see `i18n.md`
- **Testing:** Vitest + Testing Library (unit), Cypress (E2E), Playwright (animation/layout-stability specs)
- **Linting:** ESLint (next config + prettier), Prettier
- **Deploy:** Cloudflare Workers via `@opennextjs/cloudflare` (`wrangler.jsonc`, `open-next.config.ts`). The four locale routes are prerendered (`● /en /he /ru /et`), and `open-next.config.ts` uses the `static-assets-incremental-cache` override with `enableCacheInterception: true` so the Worker serves that prerendered HTML (`x-opennext-cache: HIT`) instead of re-rendering React per request. `opennextjs-cloudflare deploy` / `preview` populate `.open-next/assets/cdn-cgi/_next_cache` — a bare `wrangler deploy` would not
- **CI:** GitHub Actions (Node 22, pnpm via Corepack)

## Directory Structure

```
src/app/            # App Router. [locale]/layout.tsx IS the root layout (owns
                    # <html>/<body>); there is no src/app/layout.tsx or page.tsx.
                    # global-not-found.tsx, [locale]/error.tsx, sitemap.ts,
                    # robots.ts, json-ld.tsx
src/components/     # React components (one per file, default exports)
  icons/            # SVG icon + flag components (barrel export)
src/lib/            # locales.ts (import-free locale primitives — the only thing
                    # src/middleware.ts may import), i18n.ts (i18next + JSON,
                    # re-exports locales.ts), cipher character sets, contact
                    # helpers, viewport-pin.ts (hold the reader's anchor across a
                    # language switch), height-ease.ts (FLIP height transition)
src/hooks/          # useCipherTransition, useBlockHeightEase
src/data/           # Non-translatable content metadata (experience, projects)
src/middleware.ts   # Locale redirect (cookie -> Accept-Language -> en) and
                    # cookie persistence; no request-header injection. Must be
                    # under src/ or Turbopack dev never runs it
public/locales/     # Translation JSON (en/, he/, ru/, et/)
__tests__/          # Vitest unit tests (mirrors src/) + fixtures/translations/
cypress/e2e/        # Cypress E2E specs
playwright/         # Playwright specs: layout-stability (layout project),
                    # cipher-performance + height-ease (perf project)
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
| `text-muted` | `#7d8ba1` | Labels, dates |
| `bg-dark` | `#0f172a` | Page background |
| `bg-card` / `bg-card-hover` | `rgba(30,41,59,0.3/0.5)` | Project cards |

## CI Pipeline (.github/workflows/ci.yml)

```
lint-and-typecheck ──┐
unit-tests ──────────┤──► build ──► e2e-tests ──► deploy
```

All jobs on `ubuntu-latest`, Node 22, pnpm via Corepack. The build job copies `.env.example` to `.env`.
