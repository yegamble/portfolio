# Project: Portfolio — yosefgamble.com

**Last Updated:** 2026-09-02

## Overview

Personal portfolio for Yosef Gamble — Senior Software Engineer (NYC / Auckland). Single-page site with sticky scroll header, hero, about, experience, projects, and footer sections. Multilingual (English/Hebrew/Russian/Estonian) with RTL support and locale-aware routing (`/en`, `/he`, `/ru`, `/et`). Deployed to Cloudflare via OpenNext.

## Technology Stack

- **Framework:** Next.js 16.x (App Router, React 19, Turbopack) with `src/proxy.ts` for locale routing (Next 16 renamed the `middleware` file convention to `proxy`). It has to live under `src/`: with a `src/` directory present, `next dev --turbopack` silently ignores a project-root file (production builds find it either way), so the locale redirect simply did not run in dev
- **Build config:** `next.config.ts` sets `agentRules: false` (Next 16.3's `next dev` otherwise writes `AGENTS.md` and `CLAUDE.md` into the project root, and a root `CLAUDE.md` is picked up as agent instructions for this repo) and `images.unoptimized` (there is no IMAGES binding on this deployment, so `/_next/image` is a pass-through: same bytes, no `Cache-Control`, one extra Worker hop). Nothing imports `next/image`
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4 with `@theme` custom variables
- **i18n:** i18next + react-i18next (bundled JSON, no backend) — see `i18n.md`
- **Testing:** Vitest + Testing Library (unit), Cypress (E2E), Playwright — layout-stability geometry and `@axe-core/playwright` accessibility in the deploy-gating `layout` project, animation wall-clock budgets in the advisory `perf` project
- **Linting:** ESLint (next config + prettier), Prettier
- **Deploy:** Cloudflare Workers via `@opennextjs/cloudflare` (`wrangler.jsonc`, `open-next.config.ts`). The four locale routes are prerendered (`● /en /he /ru /et`), and `open-next.config.ts` uses the `static-assets-incremental-cache` override with `enableCacheInterception: true` so the Worker serves that prerendered HTML (`x-opennext-cache: HIT`) instead of re-rendering React per request. `opennextjs-cloudflare deploy` / `preview` populate `.open-next/assets/cdn-cgi/_next_cache` — a bare `wrangler deploy` would not
- **CI:** GitHub Actions. Node from `.nvmrc`, pnpm from the `packageManager` pin via `pnpm/action-setup` (not Corepack), every action pinned to a commit SHA

## Directory Structure

```
src/app/            # App Router. [locale]/layout.tsx IS the root layout (owns
                    # <html>/<body>) and [locale]/page.tsx is the single page
                    # every locale renders; there is no src/app/layout.tsx or
                    # src/app/page.tsx.
                    # global-not-found.tsx, global-error.tsx, fonts.ts,
                    # [locale]/error.tsx, sitemap.ts, robots.ts, json-ld.tsx,
                    # manifest.ts (/manifest.webmanifest). Icon files here each
                    # become a <link rel="icon"> in the head: icon.svg is the
                    # source of truth, favicon.ico and apple-icon.png are
                    # rasterized from it by scripts/process-images.mjs
src/components/     # React components (one per file, default exports)
  icons/            # SVG icon + flag components (barrel export)
src/lib/            # locales.ts (import-free locale primitives + SITE_URL, the
                    # canonical origin — the only thing src/proxy.ts may import
                    # besides security-headers.ts), i18n.ts (i18next + JSON,
                    # re-exports locales.ts), security-headers.ts (import-free;
                    # shared by next.config.ts and the proxy), cipher character
                    # sets, contact helpers, media.ts (the reduced-motion and
                    # phone-profile media queries, asked in one place),
                    # viewport-pin.ts (hold the reader's anchor across a
                    # language switch), height-ease.ts (FLIP height transition)
src/hooks/          # useCipherTransition, useBlockHeightEase
src/data/           # Non-translatable content metadata (experience, projects)
src/proxy.ts        # Locale redirect (cookie -> Accept-Language -> en). Writes
                    # the cookie ONLY on that redirect; localized paths get an
                    # x-locale request header instead. Must be under src/ or
                    # Turbopack dev never runs it
public/_headers     # Cloudflare Workers static-asset response headers. OpenNext
                    # copies public/ into .open-next/assets, so this ships as
                    # .open-next/assets/_headers
public/images/      # og-image.jpg, profile.jpg (the <img> fallback) and the
                    # profile-256/320.webp avatar sources
public/icons/       # PWA icons the manifest points at (192, 512, maskable-512).
                    # Not in src/app/, or Next would add a <link rel="icon"> for
                    # each one
public/locales/     # Translation JSON (en/, he/, ru/, et/)
__tests__/          # Vitest unit tests (mirrors src/) + fixtures/translations/
cypress/e2e/        # Cypress E2E specs
playwright/         # Playwright specs: layout-stability + a11y (layout
                    # project, deploy-gating), cipher-performance + height-ease
                    # (perf project, advisory)
scripts/            # Asset tooling (process-images.mjs — run by hand on macOS,
                    # output committed; see the header comment)
.github/workflows   # CI pipeline (ci.yml)
.github/scripts/    # smoke.sh — post-deploy verification, shared by the deploy
                    # and rollback jobs
.github/actions/    # setup/action.yml — the shared pnpm + Node + install
                    # sequence every job runs after its own checkout (a local
                    # composite action cannot check out the repo holding it)
.github/dependabot.yml
```

## Commands (pnpm)

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Dev server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm start` | Serve production build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm format` | Prettier, writing fixes |
| `pnpm format:check` | Prettier, failing instead of writing — **CI gates on this** |
| `pnpm test` | Vitest (single run) |
| `pnpm test:watch` | Vitest (watch) |
| `pnpm test:coverage` | Vitest with the coverage floors in `vitest.config.ts` (96/90/97/97) — **this is what `unit-tests` runs**, not `pnpm test` |
| `pnpm test:e2e` | Cypress headless (needs a running server) |
| `pnpm test:e2e:open` | Cypress interactive |
| `pnpm test:playwright` | Playwright, both projects, against `next dev`. Set `CI=1` to reproduce what the pipeline measures (`next start`, no server reuse) and `--project=layout` / `--project=perf` to run one |
| `pnpm build:worker` | OpenNext Cloudflare build — CI runs it in the `build` job |
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

## Response Headers

Two tiers, because they reach different responses. Do not add a header in one
tier assuming it covers the other.

| Tier | Source | Reaches |
|------|--------|---------|
| HTML / route responses | `next.config.ts` `headers()`, from the shared list in `src/lib/security-headers.ts` | Everything the Next server answers — **including** the prerendered HTML that OpenNext's cache interception serves without running React (`x-opennext-cache: HIT`) |
| The `/` → `/en` redirect | `src/proxy.ts`, applying the same shared list | Only that redirect. The proxy short-circuits before `headers()` runs, and HSTS preload requires `Strict-Transport-Security` on the redirect itself |
| Static assets | `public/_headers` | `/_next/static/*`, `/images/*`, `/icons/*`, `/favicon.ico` — served by the Workers ASSETS binding **before** the Worker runs, so `next.config.ts` cannot touch them |

`/icon.svg` and `/apple-icon.png` are routes, not assets, so their `Cache-Control`
lives in `next.config.ts`; `/favicon.ico` is an asset, so its rule is in
`public/_headers`. A test in `__tests__/config/next-config.test.ts` pins that split.

Verify a header change end to end rather than trusting `next start`:

```bash
pnpm build:worker
pnpm exec opennextjs-cloudflare populateCache local
pnpm exec wrangler dev --port 8788
curl -sD - -o /dev/null http://127.0.0.1:8788/en          # expect x-opennext-cache: HIT + the full set
curl -sD - -o /dev/null http://127.0.0.1:8788/            # the redirect, incl. Strict-Transport-Security
curl -sD - -o /dev/null http://127.0.0.1:8788/_next/static/chunks/<hash>.js
```

Remove `.wrangler/` afterwards; it is gitignored build state.

## SEO

`src/app/sitemap.ts` reports a **hand-maintained** `LAST_MODIFIED` constant, not
`new Date()`: request time marked every page as modified at the moment of the
crawl, which tells a crawler nothing. Bump it when the résumé or the copy
actually changes. Each entry also carries the full hreflang alternate set (four
locales plus `x-default`), matching `alternates.languages` in the locale layout.

There is deliberately no `keywords` meta tag. Meta descriptions are capped at 155
characters, enforced by `__tests__/locales/translation-content.test.ts`.

## CI Pipeline (.github/workflows/ci.yml)

```
lint-and-typecheck ───────────────────┐
unit-tests ───────────────────────────┤
                                      ├──► deploy (push to main only)
build ──┬── e2e (Cypress) ────────────┤
        ├── playwright (layout + axe) ┘
        └── playwright-perf (advisory, continue-on-error, NOT in deploy's needs)

rollback — workflow_dispatch from main with a non-empty rollback_version_id;
           nothing else runs, and it has its own concurrency group so it never
           queues behind the pipeline run that shipped the bad version
```

- `lint-and-typecheck`: lint, typecheck, `format:check`
- `unit-tests`: `test:coverage` (summary appended to `$GITHUB_STEP_SUMMARY`), then
  `pnpm audit --prod --audit-level=critical` blocking plus a non-blocking full
  `pnpm audit --prod`. **`critical`, not `high`**: today's three advisories are
  transitive under `next > styled-jsx > @babel/core` with nothing to upgrade to, so a
  `high` gate would fail every run for reasons nobody can fix
- `build`: `cp .env.example .env` then `pnpm build`, uploading `.next` (minus
  `.next/cache`) as an artifact. All three browser jobs download it, so they exercise a
  production build **of the same commit** — not the deployed bytes, since `pnpm run
  deploy` rebuilds through `opennextjs-cloudflare build`, but the same source at the
  same settings. Then `pnpm build:worker`, which is the only thing in the pipeline that
  runs `opennextjs-cloudflare build` before the deploy does: `next build` cannot
  exercise `open-next.config.ts`, `wrangler.jsonc` or the adapter version, so without
  it an OpenNext regression surfaces as a red deploy on `main` rather than a red pull
  request. `.open-next/` is not uploaded — the browser jobs serve `.next` through
  `next start`, and keeping the bundle would only invite someone to mistake it for the
  deployed bytes. Two builds is also why this job's timeout is 15 minutes
- `playwright` / `playwright-perf`: `playwright.config.ts` switches
  `webServer.command` to `next start` when `CI` is set and refuses to reuse an existing
  server. The two projects run as two jobs: `layout` is deterministic geometry **plus**
  the axe accessibility specs (`playwright/a11y.spec.ts`), 16 tests in total, and gates
  the deploy — which is why the CI step is named "Run layout and accessibility specs";
  `perf` is wall-clock budgets tuned on a laptop, so it runs `continue-on-error` on a
  runner of its own (one worker) and is not in `deploy`'s `needs`.
  `dependencies: ['layout']` on the perf project therefore applies **only** outside CI,
  where a single `pnpm test:playwright` runs both projects in one process — in CI it
  would just re-run the 16 layout specs inside the perf job
- `deploy`: `environment: Production`, its own `production-deploy` concurrency group
  (`cancel-in-progress: false`, so two merges cannot deploy at once — that is how
  production went backwards on 2026-08-16), records the Worker's `Current Version ID`
  (validated against a UUID regex, and exposed as a job output so `gh run view` and the
  REST API can read it without scraping the log), then runs `.github/scripts/smoke.sh`: `/en` (200 + HSTS + CSP), `/he`
  (`dir="rtl"`) and `/` (307 to `/en`)
- `rollback`: `pnpm exec wrangler rollback <id> -y`, same environment and lock, guarded
  on `github.ref == 'refs/heads/main'` (the Production environment has no protection
  rules and the secrets are repository-scoped, so the ref check is the guard), then the
  **same** smoke script — an unverified rollback is a hope

All jobs on `ubuntu-latest` with a `timeout-minutes`, Node from `.nvmrc`, pnpm from the
`packageManager` pin, `permissions: contents: read` at the top level, and every action
pinned to a full commit SHA with a version comment.

**A job id is its status check name.** `lint-and-typecheck`, `unit-tests` and `build`
therefore keep the ids branch protection already requires — splitting the quality work
into two jobs was not a style choice. `e2e` and `playwright` are new checks the owner
should add to the rule; `playwright-perf` must stay out of it.
