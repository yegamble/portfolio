# Portfolio

Production portfolio for [yosefgamble.com](https://yosefgamble.com), built as a multilingual Next.js application and deployed to Cloudflare Workers.

This repository is intentionally small in surface area and high in signal. It is not a throwaway landing page or a generic starter with personal copy dropped into it. The project is built to communicate technical depth, design care, operational discipline, and attention to details that usually get skipped in portfolio codebases.

## What this repo demonstrates

- Clear product positioning for an engineer working in Go, TypeScript, cloud infrastructure, video streaming, and real estate technology
- Production-grade frontend architecture using Next.js App Router, React 19, and Tailwind CSS v4
- Multilingual UX with English, Hebrew, Russian, and Estonian, including RTL support and locale-aware routing
- Motion design with performance guardrails, reduced-motion support, and layout-stability testing
- Security-conscious defaults including CSP, HSTS, X-Frame-Options, and related response headers
- SEO work that goes beyond metadata: canonical URLs, alternate language links, sitemap, robots, Open Graph, Twitter cards, and JSON-LD
- Automated quality gates in CI before deployment to Cloudflare Workers

## Experience goals

The site is designed around a few principles:

- Fast comprehension: a visitor should understand who Yosef is, what kind of systems he builds, and why that work matters within seconds
- Trust through implementation: interactions should feel polished, but the code should also hold up under review
- International readiness: language support is part of the architecture, not an afterthought
- Production realism: deployment, testing, SEO, and security are treated as first-class concerns

## Core features

- Sticky responsive header that condenses into a compact identity bar after scroll
- Animated cipher-style text transitions during language changes
- Locale routing via proxy (middleware) redirects: cookie, then `Accept-Language` negotiation, then English
- Statically prerendered locale routes served from cache at the edge
- English, Hebrew, Russian, and Estonian translations backed by `i18next`
- RTL-aware layout handling for Hebrew
- About, Experience, and Projects sections driven by structured content
- Contact surface with GitHub, LinkedIn, email, secure email, and optional PGP public key modal
- Search-engine friendly metadata and structured data generation
- Cloudflare Workers deployment via OpenNext

## Stack

| Layer | Technology |
| --- | --- |
| App framework | Next.js 16 App Router |
| UI | React 19 |
| Styling | Tailwind CSS v4 |
| Localization | `i18next`, `react-i18next` |
| Runtime target | Cloudflare Workers via `@opennextjs/cloudflare` |
| Deployment | Wrangler |
| Unit tests | Vitest + Testing Library + JSDOM |
| End-to-end tests | Cypress |
| Layout and animation verification | Playwright |
| Language | TypeScript |
| Package manager | pnpm 10 |

## Architecture at a glance

```text
src/
  app/              App Router: [locale]/ is the root layout, plus the global
                    404, metadata, robots, and sitemap
  components/       UI building blocks and interactive client components
  data/             Structured experience and project data
  hooks/            Custom animation and layout hooks
  lib/              locale primitives, i18n, cipher character sets, helpers
  proxy.ts          Locale redirect and cookie (must live under src/)

public/locales/     Translation files for en / he / ru / et
__tests__/          Unit and integration coverage
cypress/            Browser-level user journeys
playwright/         Performance and layout-stability checks
.github/workflows/  CI pipeline and deploy workflow
wrangler.jsonc      Cloudflare Workers configuration
open-next.config.ts OpenNext Cloudflare adapter configuration
```

## Notable implementation details

### Internationalization that affects routing, metadata, and layout

Locales are part of the URL structure (`/en`, `/he`, `/ru`, `/et`), not just client-side state. `src/proxy.ts` (Next 16's name for middleware) redirects a locale-less path to the visitor's preferred locale — a stored cookie first, then an `Accept-Language` negotiation with q-values, then English.

The cookie records what the visitor *chose*, and a locale in a URL is not a choice. It has exactly two writers: that locale-less redirect, and an explicit language change in the browser. An already-localized path is served as it is, so following an `/en` link from a CV shows English without overwriting a stored `he` — and HTML responses never carry `Set-Cookie`, which is what would stop a CDN caching them.

The locale segment's layout is the application's root layout: it owns `<html lang dir>` and derives everything from the route param rather than a per-request header, which is what lets all four locales prerender at build time and be served from cache on Cloudflare instead of re-rendering React per request. The document direction also switches correctly for Hebrew, and 404s render their own localized document with a translated title.

### Motion that is designed, measured, and constrained

The cipher transition is not just a visual flourish. The implementation includes viewport gating, reduced-motion handling, long-text optimizations, and explicit browser tests for animation cost and layout stability during language switches.

### Security and SEO are part of the app surface

The project ships with strict response headers, structured data, robots and sitemap generation, and localized canonical metadata. This is portfolio code written with the same care expected in production applications.

Response headers come from two places, because they reach different responses:

- `src/lib/security-headers.ts` holds the list once. `next.config.ts` applies it to everything the Next server answers, and `src/proxy.ts` re-applies it to the `/` → `/en` redirect, which short-circuits before that layer — HSTS preload requires the redirect itself to carry `Strict-Transport-Security`.
- `public/_headers` covers Cloudflare's static assets, which the ASSETS binding serves before the Worker runs. Hashed build output (`/_next/static/*`, including `next/font` woff2 files) is `immutable` for a year; hand-managed images and PWA icons get a week with a day of `stale-while-revalidate`; `/favicon.ico` gets a day.

Two CSP decisions are deliberate:

- `script-src` keeps `'unsafe-inline'`. The locale routes are prerendered, and their HTML carries Next's inline bootstrap plus the two JSON-LD blocks. A nonce has to be minted per request, which is exactly what would make those routes dynamic — trading a real caching win for a directive that `'strict-dynamic'` cannot rescue while the bootstrap is inline.
- `'unsafe-eval'` is added only when `NODE_ENV` is `development`, for the dev overlay and Fast Refresh. Production ships `'wasm-unsafe-eval'` instead, which is all openpgp's argon2 WASM needs and does not permit `eval()`. `static.cloudflareinsights.com` is allow-listed because the zone injects the Web Analytics beacon into the response itself.

### Optional secure contact workflow

If a public PGP key is configured, the UI exposes a modal that parses and displays key metadata client-side and supports copy-to-clipboard. The implementation also handles Cloudflare-friendly env-var formats by normalizing escaped newlines and base64-encoded values.

## Getting started

### Prerequisites

- Node.js 22
- pnpm 10

If you use `nvm`:

```bash
nvm use
```

### Local development

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

The proxy will redirect `/` to the active locale route, so expect local development to land on `/en` by default unless the locale cookie — or your browser's `Accept-Language` header — says otherwise.

## Environment variables

### Application variables

`.env.example` is the checked-in production build configuration: every value in it is public,
and CI copies it to `.env` (`cp .env.example .env`) before building, so it has to stay in sync
with what the app needs at build time. For local development, copy it to `.env.local` and
override values there — `.env` and `.env*.local` are git-ignored.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_CIPHER_TRANSITION` | Enables the text scramble transition during language changes |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Public contact email used in social links |
| `NEXT_PUBLIC_SECURE_CONTACT_EMAIL` | Secure contact email used in social links |
| `NEXT_PUBLIC_PGP_PUBLIC_KEY` | Optional PGP public key shown in the modal |

### Deploy-time Cloudflare variables

The `deploy` and `rollback` jobs expect these GitHub Actions secrets. They belong in the `Production` environment (see [Repository settings this pipeline assumes](#repository-settings-this-pipeline-assumes)) rather than at repository scope:

| Secret | Purpose |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Authenticates Wrangler / OpenNext deployment |
| `CLOUDFLARE_ACCOUNT_ID` | Selects the target Cloudflare account |

Minimal permission for the current configuration:

- `Account -> Workers Scripts -> Write`

If you later add route mappings or custom domains to the Worker configuration, also add:

- `Zone -> Workers Routes -> Write`

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Starts the Next.js dev server with Turbopack |
| `pnpm build` | Builds the Next.js app |
| `pnpm start` | Runs the production Next.js server |
| `pnpm lint` | Runs ESLint |
| `pnpm typecheck` | Runs TypeScript without emitting output |
| `pnpm test` | Runs the Vitest suite |
| `pnpm test:e2e` | Runs Cypress end-to-end tests |
| `pnpm test:playwright` | Runs Playwright layout and performance checks |
| `pnpm build:worker` | Generates the Cloudflare Worker build with OpenNext |
| `pnpm preview` | Builds and previews the Cloudflare Worker locally |
| `pnpm deploy` | Builds and deploys the Worker to Cloudflare |
| `node scripts/process-images.mjs` | Regenerates the avatar WebP sources, the favicon, the Apple touch icon and the PWA icons. Not part of any build — the output is committed. Run it on macOS: `src/app/icon.svg` sets its glyph in `system-ui`, so the rasterizer resolves the font against the host |

## Quality bar

This repository is tested at multiple levels:

- Unit and integration tests validate components, hooks, data modules, metadata generation, and i18n behavior
- Cypress covers major user-facing flows such as navigation, hero rendering, responsiveness, and the PGP modal
- Playwright verifies the more fragile parts of the experience: layout envelopes during language transitions, scroll-header stability, reduced-motion behavior, and animation performance characteristics

## Continuous integration

`.github/workflows/ci.yml` runs on every pull request and on every push to `main`:

```text
lint-and-typecheck ───────────────────┐
unit-tests ───────────────────────────┤
                                      ├──► deploy (push to main only)
build ──┬── e2e (Cypress) ────────────┤
        └── playwright (layout, perf) ┘
```

| Job | Gate |
| --- | --- |
| `lint-and-typecheck` | `pnpm lint`, `pnpm typecheck`, `pnpm format:check` |
| `unit-tests` | `pnpm test:coverage` (thresholds live in `vitest.config.ts`; the summary is published to the run page), then `pnpm audit --prod` — blocking at `critical`, plus a non-blocking full report |
| `build` | `pnpm build` against `.env.example`, uploaded as an artifact |
| `e2e` | Cypress against `pnpm start` serving that artifact |
| `playwright` | Layout-stability and animation-performance specs against `next start` serving that artifact — not `next dev`, whose frame budget is a different number entirely |
| `deploy` | `pnpm run deploy`, then a smoke test against the live site |

Both browser suites consume the `build` artifact instead of compiling their own, so what is measured is what ships. Every job carries a timeout, every action is pinned to a commit SHA, and the workflow's `GITHUB_TOKEN` is read-only — the deploy authenticates to Cloudflare with its own secrets. A pull request run is cancelled when a newer commit arrives; runs on `main` queue rather than cancel, and the deploy job holds a separate `production-deploy` lock, so two merges can never deploy at the same time.

Dependencies are updated weekly by Dependabot (`.github/dependabot.yml`). `next`, `eslint-config-next`, `@opennextjs/*` and `wrangler` arrive in a single pull request, because a version bump to any one of them alone cannot pass CI.

The audit gate blocks on `critical` rather than `high` deliberately: the advisories open today are all transitive under `next > styled-jsx > @babel/core`, with no published version to move to. A `high` gate would fail every run without anyone being able to fix it, which trains people to ignore it.

## Deployment

The app is configured for Cloudflare Workers using OpenNext.

Key files:

- `wrangler.jsonc` — the Worker's `workers_dev` setting and route bindings are managed in the Cloudflare dashboard, not in this file
- `open-next.config.ts`
- `.github/workflows/ci.yml`

Production deploys run automatically from `main` once the full pipeline succeeds. The deploy job:

1. Builds and deploys with `pnpm run deploy`
2. Records the Worker's `Current Version ID` in the run summary and as a job output — that id is the only handle a rollback accepts
3. Smoke-tests the live site with retries: `/en` answers 200 carrying `Strict-Transport-Security` and `Content-Security-Policy`, `/he` renders `dir="rtl"`, and `/` answers 307 to `/en`

### Rolling back

Run the **CI** workflow manually from the Actions tab (`Run workflow`) with `rollback_version_id` set to the version id of a known-good deploy. Every deploy prints its id in the job summary, and `pnpm exec wrangler versions list` lists them. Only the rollback job runs — the rest of the pipeline is skipped — and it takes the same `production-deploy` lock a deploy does.

### Repository settings this pipeline assumes

These live in GitHub settings rather than in the repository, so they are the owner's to apply:

- Add `e2e` and `playwright` to the required status checks on `main`. The existing `lint-and-typecheck`, `unit-tests` and `build` keep their names and keep reporting, so nothing already required breaks — but the two browser suites are new gates and are advisory until they are required.
- Include administrators (`enforce_admins`), and require at least one approving review with `require_last_push_approval`
- Move `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` out of repository secrets and into the `Production` environment, with a deployment branch policy limited to `main`, so a workflow running on any other branch cannot read them
- Enable Dependabot alerts. Without them `.github/dependabot.yml` opens version-update pull requests but never security ones

## Repo structure and ownership signals

A reviewer looking at this repository should see a few deliberate choices:

- Content is structured instead of hardcoded everywhere
- Translations are explicit and testable
- Animated UI behavior is backed by measurable quality checks
- Deployment is reproducible and automated
- The codebase favors straightforward modules over framework cleverness

That combination is the point of the project. The site is a portfolio, but the repository is also part of the portfolio.
