# Portfolio

Production portfolio for [yosefgamble.com](https://yosefgamble.com), built as a multilingual Next.js application and deployed to Cloudflare Workers.

This repository is intentionally small in surface area and high in signal. It is not a throwaway landing page or a generic starter with personal copy dropped into it. The project is built to communicate technical depth, design care, operational discipline, and attention to details that usually get skipped in portfolio codebases.

## What this repo demonstrates

- Clear product positioning for an engineer working in Go, TypeScript, cloud infrastructure, video streaming, and real estate technology
- Production-grade frontend architecture using Next.js App Router, React 19, and Tailwind CSS v4
- Multilingual UX with English, Hebrew, and Russian, including RTL support and locale-aware routing
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
- Locale persistence via cookie-based middleware redirects
- English, Hebrew, and Russian translations backed by `i18next`
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
  app/              App Router layouts, pages, metadata, robots, sitemap
  components/       UI building blocks and interactive client components
  data/             Structured experience and project data
  hooks/            Custom animation and layout hooks
  lib/              i18n, cipher character sets, shared helpers

public/locales/     Translation files for en / he / ru
__tests__/          Unit and integration coverage
cypress/            Browser-level user journeys
playwright/         Performance and layout-stability checks
.github/workflows/  CI pipeline and deploy workflow
wrangler.jsonc      Cloudflare Workers configuration
open-next.config.ts OpenNext Cloudflare adapter configuration
```

## Notable implementation details

### Internationalization that affects routing, metadata, and layout

Locales are part of the URL structure (`/en`, `/he`, `/ru`), not just client-side state. Middleware redirects the root path to the preferred locale, persists the choice in a cookie, and injects locale context into the request pipeline. The document direction also switches correctly for Hebrew.

### Motion that is designed, measured, and constrained

The cipher transition is not just a visual flourish. The implementation includes viewport gating, reduced-motion handling, long-text optimizations, and explicit browser tests for animation cost and layout stability during language switches.

### Security and SEO are part of the app surface

The project ships with strict response headers, structured data, robots and sitemap generation, and localized canonical metadata. This is portfolio code written with the same care expected in production applications.

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

The middleware will redirect `/` to the active locale route, so expect local development to land on `/en` by default unless the locale cookie says otherwise.

## Environment variables

### Application variables

For local development, prefer `.env.local`.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_CIPHER_TRANSITION` | Enables the text scramble transition during language changes |
| `NEXT_PUBLIC_I18N_ENABLED` | Controls whether the language selector is shown |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Public contact email used in social links |
| `NEXT_PUBLIC_SECURE_CONTACT_EMAIL` | Secure contact email used in social links |
| `NEXT_PUBLIC_PGP_PUBLIC_KEY` | Optional PGP public key shown in the modal |

### Deploy-time Cloudflare variables

The CI deploy job expects these GitHub Actions secrets:

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

## Quality bar

This repository is tested at multiple levels:

- Unit and integration tests validate components, hooks, data modules, metadata generation, and i18n behavior
- Cypress covers major user-facing flows such as navigation, hero rendering, responsiveness, and the PGP modal
- Playwright verifies the more fragile parts of the experience: layout envelopes during language transitions, scroll-header stability, reduced-motion behavior, and animation performance characteristics

The CI pipeline enforces this sequence on every pull request:

1. Lint and typecheck
2. Unit tests
3. Production build
4. Cypress end-to-end tests
5. Cloudflare deploy on `main`

## Deployment

The app is configured for Cloudflare Workers using OpenNext.

Key files:

- `wrangler.jsonc`
- `open-next.config.ts`
- `.github/workflows/ci.yml`

Production deploys run automatically from `main` after the full CI pipeline succeeds.

## Repo structure and ownership signals

A reviewer looking at this repository should see a few deliberate choices:

- Content is structured instead of hardcoded everywhere
- Translations are explicit and testable
- Animated UI behavior is backed by measurable quality checks
- Deployment is reproducible and automated
- The codebase favors straightforward modules over framework cleverness

That combination is the point of the project. The site is a portfolio, but the repository is also part of the portfolio.
