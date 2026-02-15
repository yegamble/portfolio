# Production Best Practices Refactor Implementation Plan

Created: 2026-02-15
Status: VERIFIED
Approved: Yes
Iterations: 0
Worktree: No

> **Status Lifecycle:** PENDING → COMPLETE → VERIFIED
> **Iterations:** Tracks implement→verify cycles (incremented by verify phase)

## Summary

**Goal:** Refactor the portfolio codebase to follow production-grade engineering best practices — proper project structure, error handling, data/UI separation, and high-quality tests.

**Architecture:** Migrate to `src/` directory (Next.js convention), extract data from components into typed data modules, add App Router error boundaries, upgrade test infrastructure to use `userEvent` and semantic queries.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Vitest, Cypress

## Scope

### In Scope

- Migrate to `src/` directory structure (including fixing `@/public/` import paths)
- Add App Router error handling (`error.tsx`, `not-found.tsx`) with unit tests
- Add security headers to `next.config.ts`
- Extract data from components into `src/data/` modules
- Install `@testing-library/user-event` and migrate `fireEvent` usage
- Replace brittle CSS class-based test selectors with semantic queries across all 11 test files

### Out of Scope

- Content changes (translations, copy)
- New features or sections
- Deployment configuration
- Cypress E2E test refactoring (solid as-is)
- Icon component splitting (130 lines, acceptable)
- `.prettierrc` — already exists with project settings
- Performance optimizations — site is statically generated; `poweredByHeader: false` and `reactStrictMode: true` already configured

## Prerequisites

- Node 22 installed
- `npm ci` dependencies installed
- All tests currently passing

## Context for Implementer

- **Patterns to follow:** All section components use `'use client'` with `useTranslation()` hook. `SectionHeader` and `TechTag` omit the `'use client'` directive but are imported exclusively by client components, making them client components in practice. They are presentational with typed props interfaces.
- **Conventions:** Default exports, one component per file, `@/*` path aliases, Tailwind utility classes only, `aria-label` on all sections.
- **Key files:**
  - `app/layout.tsx` — Root layout with I18nProvider wrapper
  - `app/page.tsx` — Single page composing all sections
  - `lib/i18n.ts` — i18next config with bundled JSON imports (imports `@/public/locales/...` which MUST be changed during `src/` migration)
  - `vitest.config.ts` — Test config with jsdom, setup file, path aliases via `vite-tsconfig-paths`
  - `tsconfig.json` — Path aliases (`@/*` → `./*`, will become `./src/*`)
  - `__tests__/setup.ts` — Test setup with jest-dom matchers and i18n init (`@/lib/i18n` import resolves via tsconfig paths)
- **Gotchas:**
  - **CRITICAL:** `lib/i18n.ts` imports `@/public/locales/en/translation.json` and `@/public/locales/he/translation.json`. After `@/*` remaps to `./src/*`, these resolve to `./src/public/locales/...` which does NOT exist. Must change to relative imports.
  - `Experience.tsx` and `Projects.tsx` join translated content (from JSON) with non-translated metadata (in-component arrays) by array index — fragile
  - `fireEvent` is used in `LanguageToggle.test.tsx` and `i18n-integration.test.tsx`
  - 97 occurrences of CSS class assertions across 11 test files — `container.querySelector('.css-classes')` patterns are brittle; `toHaveClass` for behavioral CSS like `scroll-mt-24` is acceptable
  - `I18nProvider` already dynamically updates `document.documentElement.lang` and `dir` on language change — no accessibility fix needed

## Progress Tracking

**MANDATORY: Update this checklist as tasks complete. Change `[ ]` to `[x]`.**

- [x] Task 1: Migrate to `src/` directory
- [x] Task 2: Add App Router error handling and security headers
- [x] Task 3: Extract data layer from components
- [x] Task 4: Upgrade test interactions (`fireEvent` → `userEvent`)
- [x] Task 5: Replace brittle test selectors with semantic queries

**Total Tasks:** 5 | **Completed:** 5 | **Remaining:** 0

## Implementation Tasks

### Task 1: Migrate to `src/` directory

**Objective:** Move application code into `src/` following Next.js recommended structure. Fix all import paths that reference root-level directories through the `@/*` alias.

**Dependencies:** None

**Files:**

- Move: `app/` → `src/app/`
- Move: `components/` → `src/components/`
- Move: `lib/` → `src/lib/`
- Modify: `tsconfig.json` — update `@/*` path from `./*` to `./src/*`
- Modify: `src/lib/i18n.ts` — change `@/public/locales/...` imports to relative paths (`../../public/locales/...`) since `public/` stays at root
- Verify: `vitest.config.ts` — `setupFiles: './__tests__/setup.ts'` stays unchanged; `vite-tsconfig-paths` picks up the new alias automatically
- Verify: `eslint.config.mjs` — `eslint-config-next` auto-detects `src/` directory, no changes needed; ignores `['.next/', 'out/', 'build/']` remain valid

**Key Decisions / Notes:**

- Tests (`__tests__/`) stay at project root — standard Next.js convention for external test directories
- `public/` stays at project root — Next.js requires this
- `cypress/` stays at project root — Cypress convention
- The `@/*` path alias in `tsconfig.json` must change from `./*` to `./src/*`
- **CRITICAL:** `lib/i18n.ts` uses `@/public/locales/en/translation.json` and `@/public/locales/he/translation.json`. After the alias change, `@/public/` resolves to `./src/public/` which doesn't exist. These MUST be changed to relative imports: `../../public/locales/en/translation.json`
- All other `@/` imports (components, lib) resolve correctly after the alias change since those directories move into `src/`
- Verify the full import chain: `vitest.config.ts` → `__tests__/setup.ts` → `@/lib/i18n` → `src/lib/i18n` → `../../public/locales/...`

**Definition of Done:**

- [ ] All tests pass (`npm run test`)
- [ ] TypeScript compiles without errors (`npm run typecheck`)
- [ ] Linter passes (`npm run lint`)
- [ ] Dev server starts and renders correctly (`npm run dev`)
- [ ] No files remain in root `app/`, `components/`, or `lib/` directories
- [ ] `@/public/locales` imports in `src/lib/i18n.ts` use relative paths

**Verify:**

- `npm run test` — all unit tests pass
- `npm run typecheck` — no type errors
- `npm run lint` — no lint errors

### Task 2: Add App Router error handling and security headers

**Objective:** Add production error boundaries, a custom 404 page with unit tests, and security headers.

**Dependencies:** Task 1

**Files:**

- Create: `src/app/error.tsx` — client-side error boundary
- Create: `src/app/not-found.tsx` — custom 404 page
- Create: `__tests__/app/error.test.tsx` — tests for error boundary
- Create: `__tests__/app/not-found.test.tsx` — tests for 404 page
- Modify: `next.config.ts` — add security headers

**Key Decisions / Notes:**

- `error.tsx` must be a client component (`'use client'`) — Next.js requirement
- `error.tsx` receives `error` and `reset` props — display a user-friendly message with retry button
- `not-found.tsx` renders a simple "page not found" message with a link back home
- Both pages should match the existing dark theme using the same design tokens
- No `loading.tsx` needed — this is a single-page static site with no dynamic data fetching
- Security headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `error.test.tsx` should verify: renders error message, reset button calls the reset prop
- `not-found.test.tsx` should verify: renders 404 message, link back to home exists

**Definition of Done:**

- [ ] `error.tsx` exists with `reset` button for error recovery
- [ ] `not-found.tsx` exists with link back to home
- [ ] Unit tests exist for both pages and pass
- [ ] Security headers present in `next.config.ts`
- [ ] TypeScript compiles without errors
- [ ] All existing tests still pass
- [ ] `npm run build` succeeds

**Verify:**

- `npm run typecheck` — no type errors
- `npm run test` — all tests pass (including new error/not-found tests)
- `npm run build` — build succeeds

### Task 3: Extract data layer from components

**Objective:** Eliminate the fragile index-based join pattern by extracting experience and project data into typed data modules.

**Dependencies:** Task 1

**Files:**

- Create: `src/data/experience.ts` — typed experience metadata
- Create: `src/data/projects.ts` — typed project metadata (icons as string identifiers)
- Modify: `src/components/Experience.tsx` — import data from `src/data/experience.ts`
- Modify: `src/components/Projects.tsx` — import data from `src/data/projects.ts`, map icon identifiers to components

**Key Decisions / Notes:**

- **Experience data module** — export typed array identical to current `experiencesMeta`:
  ```ts
  // src/data/experience.ts
  export interface ExperienceEntry {
    companyUrl: string;
    technologies: string[];
  }
  export const experienceEntries: ExperienceEntry[] = [
    { companyUrl: 'https://github.com/yegamble', technologies: ['Go', 'ActivityPub', 'Docker', 'PostgreSQL', 'Redis', 'Cloudflare'] },
    { companyUrl: 'https://www.realestate.co.nz', technologies: ['AWS Lambda', 'CDK', 'EmberJS', 'PHP', 'Braze', 'New Relic'] },
    { companyUrl: '#', technologies: ['PHP', 'AngularJS', 'Android', 'Digital Ocean', 'REST APIs'] },
  ];
  ```
- **Projects data module** — store icon identifiers as strings instead of JSX to keep the data module pure:
  ```ts
  // src/data/projects.ts
  export interface ProjectEntry {
    url: string;
    technologies: string[];
    icon: 'folder' | 'layers';
  }
  export const projectEntries: ProjectEntry[] = [
    { url: '#', technologies: ['Rust', 'Kafka', 'AWS'], icon: 'folder' },
    { url: '#', technologies: ['React', 'Tailwind', 'A11y'], icon: 'layers' },
  ];
  ```
- `Projects.tsx` maps icon strings to components: `{ folder: <FolderIcon />, layers: <LayersIcon /> }`
- Components continue using `t('section.items', { returnObjects: true })` and zip with the data array by index — but now the data source is explicit, importable, and testable
- Exported arrays are structurally identical to current inline data — all existing tests pass unchanged

**Definition of Done:**

- [ ] `experiencesMeta` removed from `Experience.tsx` — data imported from `src/data/experience.ts`
- [ ] `projectsMeta` removed from `Projects.tsx` — data imported from `src/data/projects.ts`
- [ ] `src/data/projects.ts` contains no JSX — uses string identifiers for icons
- [ ] All existing Experience and Projects tests pass unchanged
- [ ] TypeScript compiles without errors

**Verify:**

- `npm run test` — all tests pass
- `npm run typecheck` — no type errors

### Task 4: Upgrade test interactions (`fireEvent` → `userEvent`)

**Objective:** Install `@testing-library/user-event` and migrate the two test files that use `fireEvent` for click events to the recommended `userEvent` API.

**Dependencies:** Task 1

**Files:**

- Modify: `package.json` — add `@testing-library/user-event` to devDependencies
- Modify: `__tests__/components/LanguageToggle.test.tsx` — replace `fireEvent.click` with `userEvent.click`
- Modify: `__tests__/components/i18n-integration.test.tsx` — replace `fireEvent.click` and `fireEvent` imports with `userEvent`

**Key Decisions / Notes:**

- `userEvent` simulates real user interactions (focus, keydown, keyup, click) rather than just dispatching DOM events
- Tests using `userEvent.click()` must be `async` with `await`
- Create `userEvent.setup()` instance per test or in `beforeEach`
- Only 2 files need migration — both use `fireEvent.click` for language toggle testing

**Definition of Done:**

- [ ] `@testing-library/user-event` installed as devDependency
- [ ] No `fireEvent` imports remain in any test file
- [ ] All tests pass with `userEvent` interactions
- [ ] Tests using `userEvent` are properly `async`/`await`

**Verify:**

- `npm run test` — all tests pass

### Task 5: Replace brittle test selectors with semantic queries

**Objective:** Replace fragile `container.querySelector('.css-class-combos')` patterns across all test files with semantic queries. Keep `toHaveClass` assertions for behavioral CSS. Add `role="separator"` to `SectionHeader`'s divider (correct semantics, improves accessibility).

**Dependencies:** Task 1

**Files:**

- Modify: `src/components/SectionHeader.tsx` — add `role="separator"` to divider `div` (semantically correct for a visual divider, also improves accessibility)
- Modify: `__tests__/components/About.test.tsx` — replace `container.querySelector('.h-px.flex-1.bg-slate-800')` and `container.querySelector('.space-y-6')`
- Modify: `__tests__/components/Experience.test.tsx` — replace `container.querySelector('.h-px.flex-1.bg-slate-800')`, `section.querySelector('ol')`, `ol.querySelectorAll(':scope > li')`
- Modify: `__tests__/components/SectionHeader.test.tsx` — replace CSS class-based queries with `getByRole('separator')`
- Modify: `__tests__/components/TechTag.test.tsx` — replace pure styling assertions (`rounded-full`, `text-xs`, `font-medium`) with behavioral assertions
- Modify: `__tests__/components/SocialLinks.test.tsx` — reduce CSS class assertions, use role/label queries
- Modify: `__tests__/components/icons.test.tsx` — reduce CSS class assertions
- Modify: `__tests__/components/ScrollHeader.test.tsx` — replace `container.querySelector('section .bg-primary')` and `container.querySelectorAll('section')`
- Modify: `__tests__/components/Footer.test.tsx` — replace `container.querySelectorAll('svg.h-6.w-6')`
- Modify: `__tests__/components/Projects.test.tsx` — replace `container.querySelectorAll('.rounded-2xl')` and `container.querySelector('.grid')`
- Modify: `__tests__/components/i18n-integration.test.tsx` — RTL tests using `container.querySelector` for `.sm\\:border-s`, `.ps-2`, `.rtl\\:rotate-180`, `.ms-1`

**Key Decisions / Notes:**

- **Replace:** `container.querySelector('.h-px.flex-1.bg-slate-800')` → `getByRole('separator')`
- **Replace:** `container.querySelector('.space-y-6')` → test paragraph count directly on the section
- **Replace:** `container.querySelector('.rounded-2xl')` → use `getAllByRole` or structural queries
- **Replace:** `container.querySelectorAll('svg.h-6.w-6')` → query SVGs by their parent link's `aria-label`
- **Keep:** `toHaveClass('scroll-mt-24')` — behavioral requirement (scroll offset for sticky header)
- **Keep:** Tests that check `aria-hidden`, `aria-label`, `target="_blank"` — accessibility/behavior tests
- **Keep:** RTL class tests in `i18n-integration.test.tsx` (`.rtl\\:rotate-180`, `.ms-1`, `.ps-2`, `.sm\\:border-s`) — these test behavioral RTL layout correctness, not styling. Document this decision explicitly.
- **Remove/Replace:** Pure styling assertions like `toHaveClass('rounded-full', 'text-xs', 'font-medium')` — break on design changes
- Adding `role="separator"` to `SectionHeader.tsx`'s divider is semantically correct (HTML `separator` role for visual dividers) and improves accessibility — not just a test convenience

**Definition of Done:**

- [ ] Zero `container.querySelector` calls that query by CSS class combinations (except RTL behavioral tests in i18n-integration which are documented as kept)
- [ ] Pure styling assertions replaced with behavioral assertions
- [ ] `role="separator"` added to `SectionHeader.tsx` divider
- [ ] All tests pass
- [ ] No reduction in test coverage — every removed assertion has a semantic replacement

**Verify:**

- `npm run test` — all tests pass
- `npm run typecheck` — no type errors

## Testing Strategy

- **Unit tests:** All existing tests must continue passing after each task. New error/404 pages get unit tests in `__tests__/app/`.
- **Integration tests:** i18n integration tests must pass after `src/` migration and `userEvent` migration.
- **Manual verification:** After Task 1, run `npm run dev` and verify the site renders. After Task 2, `npm run build && npm run start` and visit `/nonexistent` to verify 404 page.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `src/` migration breaks `@/public/locales` import resolution | High | High | **Known breakage:** `lib/i18n.ts` imports `@/public/locales/...` which breaks after alias change. Explicitly change to relative imports `../../public/locales/...` in Task 1. Run `npm run typecheck` immediately after. |
| ESLint/Next.js plugin confusion after move | Low | Medium | `eslint-config-next` auto-detects `src/`. Run `npm run lint` after Task 1. |
| `userEvent` changes test timing behavior | Low | Low | `userEvent` is async — ensure all click tests use `await`. Run full test suite after migration. |
| Data extraction changes component render output | Low | Medium | Data modules export structurally identical arrays. All existing tests serve as regression checks. |

## Open Questions

None — scope and approach are clear.
