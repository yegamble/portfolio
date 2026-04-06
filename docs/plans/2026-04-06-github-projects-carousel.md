# GitHub Projects Carousel Implementation Plan

Created: 2026-04-06
Author: yegamble@gmail.com
Status: VERIFIED
Approved: Yes
Iterations: 0
Worktree: No
Type: Feature

## Summary

**Goal:** Replace the placeholder projects section with 4 real GitHub projects (Vidra, Aurialis, GoImg, IOTA Token Creator) and add a responsive CSS scroll-snap carousel for mobile. Each card shows multiple repo links. All content translated in en, he, and ru.

**Architecture:** Update project data (`src/data/projects.ts`) and translation files with real content. Modify `Projects.tsx` to render a horizontal scroll-snap carousel on mobile (<768px) and a 2-column grid on md+. Add per-card repo links below tech tags. No new dependencies needed — pure CSS scroll-snap + React state for dot indicators.

**Tech Stack:** CSS scroll-snap, Tailwind CSS, React (useState for active dot tracking via IntersectionObserver)

## Scope

### In Scope

- Replace `src/data/projects.ts` with 4 real projects and their metadata (repos, technologies, icons)
- Replace project items in all 3 translation files (en, he, ru) + test fixtures
- Modify `Projects.tsx` for carousel on mobile, grid on md+
- Dot indicators for carousel position on mobile
- Multiple GitHub repo links per card
- Update all tests (unit, i18n integration, data validation)
- RTL support for Hebrew carousel (scroll direction reversal)

### Out of Scope

- JS carousel libraries (no Swiper, Embla, etc.)
- Previous/next arrow buttons
- Auto-play or auto-scroll
- Adding new icon types beyond existing `folder` and `layers`

## Approach

**Chosen:** CSS scroll-snap carousel with IntersectionObserver dot tracking
**Why:** Zero-dependency, native touch/swipe support, lightweight, RTL-compatible via CSS logical properties. Costs: no arrow buttons (user preference), manual IntersectionObserver wiring for dot indicators.
**Alternatives considered:**
- JS carousel library (Embla/Swiper) — heavier, adds dependency for simple use case
- CSS-only with `:has()` selector for dots — poor browser support, no Safari

## Context for Implementer

> Write for an implementer who has never seen the codebase.

- **Patterns to follow:** `src/data/experience.ts` (metadata separation pattern — non-translatable data like URLs, technologies stay in TS; translatable text in JSON). `src/components/Projects.tsx:21-35` shows the existing join-by-id pattern between metadata and translations.
- **Conventions:** Default exports for components, `'use client'` for hooks usage, Tailwind utility classes only, logical CSS properties for RTL (`ps-`, `pe-`, `ms-`, `me-`), `CipherText` wraps displayed text for animation.
- **Key files:**
  - `src/data/projects.ts` — project metadata (urls, technologies, icons)
  - `src/components/Projects.tsx` — Projects section component
  - `public/locales/{en,he,ru}/translation.json` — translation strings
  - `__tests__/fixtures/translations/{en,he,ru}.json` — test translation fixtures
  - `__tests__/components/Projects.test.tsx` — unit tests
  - `__tests__/data/projects.test.ts` — data validation tests
  - `__tests__/components/i18n-integration.test.tsx` — i18n integration tests
  - `src/components/icons/index.tsx` — icon components (has `GitHubIcon` at line 26)
- **Gotchas:**
  - The `ProjectEntry` interface needs a new `repos` field (array of `{name, url}`) replacing the single `url`
  - The card currently uses `a.before:absolute.before:inset-0` for full-card click — this must be removed since we now have multiple links per card
  - Test fixtures have DIFFERENT project data than production (`uber-proj` / `nihon-proj` in fixtures vs `project-alpha` / `neon-ui-kit` in production). Both need updating.
  - `i18n-integration.test.tsx` mocks `@/data/projects` at line 47-62 — mock must be updated
  - IntersectionObserver is already mocked in i18n tests (line 69-83)
  - Some repos are private — use `#` as placeholder URL
- **Domain context:** This portfolio uses a content-separation pattern where translatable text (titles, descriptions) lives in JSON files, and non-translatable metadata (URLs, tech lists) lives in TypeScript. They're joined by `id` at render time.

## Runtime Environment

- **Start command:** `pnpm dev` (Turbopack)
- **Port:** 3000
- **Build:** `pnpm build`

## Feature Inventory

Since we're replacing the existing projects section, here's the complete inventory:

| Current Item | Function | Mapped Task |
|---|---|---|
| `src/data/projects.ts` — `projectEntries` array | Metadata for 2 placeholder projects | Task 1 (replace) |
| `src/data/projects.ts` — `ProjectEntry` interface | Type definition (single `url`) | Task 1 (modify: add `repos` array) |
| `src/components/Projects.tsx` — `METADATA_BY_ID` | Join metadata to translations by id | Task 2 (keep pattern, adjust for repos) |
| `src/components/Projects.tsx` — grid layout | 2-col grid always | Task 2 (carousel on mobile, grid on md+) |
| `src/components/Projects.tsx` — card component | Icon + arrow + title link + description + tech list | Task 2 (modify: remove full-card link, add repo links) |
| `public/locales/en/translation.json` — `projects.items` | 2 placeholder projects | Task 3 (replace with 4 real) |
| `public/locales/he/translation.json` — `projects.items` | 2 placeholder projects (Hebrew) | Task 3 |
| `public/locales/ru/translation.json` — `projects.items` | 2 placeholder projects (Russian) | Task 3 |
| `__tests__/components/Projects.test.tsx` | Unit tests for Projects | Task 4 (rewrite) |
| `__tests__/data/projects.test.ts` | Data validation tests | Task 4 (update) |
| `__tests__/components/i18n-integration.test.tsx` | i18n tests including Projects | Task 4 (update mocks + assertions) |
| `__tests__/fixtures/translations/{en,he,ru}.json` | Test fixture translations | Task 4 (update projects section) |

## Assumptions

- CSS scroll-snap has sufficient browser support for this portfolio's audience (supported in all modern browsers since 2020) — all tasks depend on this
- The `GitHubIcon` component at `src/components/icons/index.tsx:26` is available and suitable for repo links — Task 2 depends on this
- The existing `CipherText` animation component works with the new card structure — Task 2 depends on this
- IntersectionObserver API is available in all target browsers — Task 2 depends on this
- Private repos can use `#` as placeholder URL per user instruction — Task 1 depends on this

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| RTL scroll-snap direction inconsistency across browsers | Low | Medium | Use `direction: rtl` on scroll container via Tailwind's `rtl:` modifier; test in both directions |
| IntersectionObserver not updating dots on fast swipe | Low | Low | Use `threshold: 0.5` and debounce-free observer; dots are enhancement only |
| CipherText animation on carousel scroll causes jank | Low | Medium | Only animate text within visible card; carousel cards outside viewport won't trigger animation |

## Goal Verification

### Truths

1. The projects section displays exactly 4 project cards (Vidra, Aurialis, GoImg, IOTA Token Creator) with real descriptions
2. On mobile (<768px), cards display in a horizontal scroll-snap carousel with dot indicators
3. On tablet+ (≥768px), cards display in a 2-column grid
4. Each card shows multiple GitHub repo links below the tech tags
5. All content appears correctly in English, Hebrew, and Russian
6. Hebrew mode shows correct RTL carousel scroll direction
7. All tests pass (unit, i18n integration, data validation)

### Artifacts

1. `src/data/projects.ts` — 4 project entries with repos arrays
2. `src/components/Projects.tsx` — carousel + grid layout with repo links
3. `public/locales/{en,he,ru}/translation.json` — translated project content
4. `__tests__/components/Projects.test.tsx` — updated unit tests
5. `__tests__/components/i18n-integration.test.tsx` — updated i18n assertions

## E2E Test Scenarios

### TS-001: Projects Grid Display on Desktop
**Priority:** Critical
**Preconditions:** Desktop viewport (≥768px), English language
**Mapped Tasks:** Task 1, Task 2, Task 3

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to localhost:3000 | Page loads, projects section visible |
| 2 | Scroll to #projects section | 4 project cards visible in 2x2 grid |
| 3 | Read first card (Vidra) | Shows title, description, tech tags, repo links |
| 4 | Click a repo link (vidra-core) | Opens GitHub URL in new tab |

### TS-002: Carousel on Mobile
**Priority:** Critical
**Preconditions:** Mobile viewport (375px), English language
**Mapped Tasks:** Task 2

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Set viewport to 375x812 | Page renders in mobile layout |
| 2 | Scroll to #projects section | First card visible, dot indicators show 4 dots with first active |
| 3 | Swipe left on carousel | Second card scrolls into view, second dot becomes active |
| 4 | Swipe to last card | Fourth card visible, fourth dot active |

### TS-003: Hebrew RTL Carousel
**Priority:** High
**Preconditions:** Mobile viewport (375px), Hebrew language
**Mapped Tasks:** Task 2, Task 3

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Switch to Hebrew via language selector | Page switches to RTL |
| 2 | Scroll to projects section | First card visible, carousel scrolls right-to-left |
| 3 | Swipe right (RTL natural direction) | Second card scrolls into view |

### TS-004: Russian Translation
**Priority:** High
**Preconditions:** Desktop viewport, Russian language
**Mapped Tasks:** Task 3

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Switch to Russian via language selector | Content switches to Russian |
| 2 | Scroll to projects section | Heading shows "Проекты", descriptions in Russian |

## E2E Results

| Scenario | Priority | Result | Fix Attempts | Notes |
|----------|----------|--------|--------------|-------|
| TS-001 | Critical | PASS | 0 | 4 cards, 7 repo links, snap-x + md:grid-cols-2, 4 dots |
| TS-002 | Critical | PASS | 0 | Mobile 375px: carousel scrollable, 4 dots, aria-current on first dot |
| TS-003 | High | PASS | 0 | dir=rtl, carousel scrollable, פרויקטים heading |
| TS-004 | High | PASS | 0 | lang=ru, Проекты heading, Russian descriptions |

## Progress Tracking

- [x] Task 1: Update project data
- [x] Task 2: Carousel + repo links in Projects component
- [x] Task 3: Update all translation files
- [x] Task 4: Update all tests
      **Total Tasks:** 4 | **Completed:** 4 | **Remaining:** 0

## Implementation Tasks

### Task 1: Update Project Data

**Objective:** Replace placeholder project entries with 4 real GitHub projects. Extend the `ProjectEntry` interface to support multiple repos per project.
**Dependencies:** None
**Mapped Scenarios:** TS-001

**Files:**

- Modify: `src/data/projects.ts`

**Key Decisions / Notes:**

- Extend `ProjectEntry` interface: replace `url: string` with `repos: { name: string; url: string }[]`
- Remove `icon` field constraint — keep `'folder' | 'layers'` union, assign icons: Vidra=`layers` (multi-layer platform), Aurialis=`layers` (audio processing layers), GoImg=`folder` (file management), IOTA=`folder` (token creation)
- Use `#` for repos that are private (per user instruction)
- Project IDs: `vidra`, `aurialis`, `goimg`, `iota-token-creator`
- Technologies derived from GitHub READMEs:
  - Vidra: `Go`, `ActivityPub`, `ATProto`, `PostgreSQL`, `Redis`, `Docker`
  - Aurialis: `Next.js`, `TypeScript`, `Web Audio API`, `Tailwind CSS`
  - GoImg: `Next.js`, `TypeScript`, `Go`, `PostgreSQL`, `S3`
  - IOTA Token Creator: `Next.js`, `TypeScript`, `Go`, `IOTA`

**Definition of Done:**

- [ ] `projectEntries` array has exactly 4 entries with unique IDs
- [ ] Each entry has a `repos` array with `{name, url}` objects
- [ ] No `url` field on `ProjectEntry` (replaced by `repos`)
- [ ] TypeScript compiles without errors

**Verify:**

```bash
pnpm typecheck
```

### Task 2: Carousel + Repo Links in Projects Component

**Objective:** Modify `Projects.tsx` to render a CSS scroll-snap carousel on mobile (<768px) with dot indicators, and a 2-column grid on md+. Add per-card GitHub repo links below tech tags.
**Dependencies:** Task 1
**Mapped Scenarios:** TS-001, TS-002, TS-003

**Files:**

- Modify: `src/components/Projects.tsx`

**Key Decisions / Notes:**

- **Carousel container:** `flex overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-2 md:overflow-visible` — flexbox scroll on mobile, grid on md+
- **Card snap:** `snap-center shrink-0 w-[85vw] md:w-auto` — each card snaps to center on mobile, auto-width on grid
- **Dot indicators:** Render below carousel, only visible on mobile (`md:hidden`). Use `IntersectionObserver` with `threshold: 0.5` on each card to track active index.
- **Hide scrollbar:** Use Tailwind's `scrollbar-hide` utility or CSS `scrollbar-width: none` + `::-webkit-scrollbar { display: none }`
- **Repo links:** Below the `<ul>` tech list, add a `<div>` with `GitHubIcon` + repo name as links. Each link opens in new tab. Remove the full-card `a.before:absolute.before:inset-0` pattern — card is no longer one big link.
- **RTL support:** CSS scroll-snap natively respects `direction: rtl`. The `I18nProvider` already sets `dir="rtl"` on `<html>`. No extra work needed beyond testing.
- **Performance:** IntersectionObserver is cleaned up in useEffect return. Observer only created on mobile (check with `matchMedia` or just let it observe — dots hidden on md+ anyway so updates are harmless).
- Reference: `src/components/Projects.tsx:51` current grid layout to replace

**Definition of Done:**

- [ ] Mobile (<768px): cards in horizontal scroll-snap carousel
- [ ] Mobile: dot indicators show active card
- [ ] Tablet+ (≥768px): cards in 2-column grid
- [ ] Each card shows GitHub repo links with `GitHubIcon` below tech tags
- [ ] Card no longer has full-card click-through link
- [ ] No scrollbar visible on carousel
- [ ] Diagnostics clean

**Verify:**

```bash
pnpm typecheck && pnpm lint
```

### Task 3: Update All Translation Files

**Objective:** Replace placeholder project content in all 3 production translation files and 3 test fixture files with real project data.
**Dependencies:** Task 1 (need project IDs to match)
**Mapped Scenarios:** TS-001, TS-003, TS-004

**Files:**

- Modify: `public/locales/en/translation.json`
- Modify: `public/locales/he/translation.json`
- Modify: `public/locales/ru/translation.json`
- Modify: `__tests__/fixtures/translations/en.json`
- Modify: `__tests__/fixtures/translations/he.json`
- Modify: `__tests__/fixtures/translations/ru.json`

**Key Decisions / Notes:**

- Production translations get real descriptions derived from GitHub READMEs:
  - **Vidra (en):** "PeerTube-compatible video streaming backend in Go with P2P distribution, live streaming, and multi-protocol federation via ActivityPub and ATProto."
  - **Aurialis (en):** "Browser-based audio mastering application with genre presets, parametric EQ, compressor, limiter, and real-time LUFS metering — all running in AudioWorklets."
  - **GoImg (en):** "Full-stack image gallery platform with a Go backend and Next.js frontend. Photo upload, album management, sharing controls, and S3-compatible storage."
  - **IOTA Token Creator (en):** "Token creation platform for the IOTA distributed ledger with a Next.js frontend and Go API backend."
- Hebrew and Russian descriptions should be natural translations (not machine-literal)
- Test fixture translations use simplified/different text (matching existing fixture pattern where test data differs from production)
- Add `projects.viewRepos` key: "View repositories" / "צפה במאגרים" / "Просмотреть репозитории" for aria-label on repo links section

**Definition of Done:**

- [ ] All 3 production translation files have 4 project items with matching IDs (`vidra`, `aurialis`, `goimg`, `iota-token-creator`)
- [ ] All 3 test fixture files have corresponding entries
- [ ] Hebrew translations are natural, not machine-literal
- [ ] Russian translations are natural, not machine-literal
- [ ] JSON is valid in all 6 files

**Verify:**

```bash
python3 -c "import json; [json.load(open(f)) for f in ['public/locales/en/translation.json','public/locales/he/translation.json','public/locales/ru/translation.json']]" && echo "Valid JSON"
```

### Task 4: Update All Tests

**Objective:** Update unit tests, data validation tests, and i18n integration tests for the new project data and carousel behavior.
**Dependencies:** Task 1, Task 2, Task 3
**Mapped Scenarios:** TS-001, TS-002, TS-003, TS-004

**Files:**

- Modify: `__tests__/components/Projects.test.tsx`
- Modify: `__tests__/data/projects.test.ts`
- Modify: `__tests__/components/i18n-integration.test.tsx`

**Key Decisions / Notes:**

- **Projects.test.tsx:** Rewrite to test:
  - 4 project cards rendered (not 2)
  - Carousel container classes on mobile
  - Grid classes present
  - Dot indicators rendered (4 dots)
  - Repo links per card (not full-card link)
  - Empty projects still returns null
  - Data integrity (unknown id skipped, reorder preserves metadata)
  - Update the `vi.mock('@/data/projects')` to have 4 entries with `repos` arrays
- **projects.test.ts:** Update validation to check for `repos` array instead of `url` string
- **i18n-integration.test.tsx:** Update the `vi.mock('@/data/projects')` at line 47 to match new structure. Update assertions:
  - Line 333 `'should render two project cards in Russian'` → 4 cards
  - Line 464 `'should render two project cards in Hebrew'` → 4 cards
  - Lines checking for specific project text need updating
- Mock `IntersectionObserver` in Projects.test.tsx (already mocked in i18n tests)

**Definition of Done:**

- [ ] All tests pass: `pnpm test`
- [ ] Projects.test.tsx tests 4 cards, carousel structure, repo links, dot indicators
- [ ] projects.test.ts validates `repos` array
- [ ] i18n-integration.test.tsx assertions updated for 4 projects
- [ ] No skipped or `.todo` tests

**Verify:**

```bash
pnpm test
```

## Open Questions

None — all clarified through user Q&A.

### Deferred Ideas

- Arrow buttons for carousel navigation (user preferred scroll-snap only)
- Auto-play carousel
- Fetching GitHub star counts dynamically
