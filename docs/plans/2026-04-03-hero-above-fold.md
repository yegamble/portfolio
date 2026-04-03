# Hero Above the Fold Implementation Plan

Created: 2026-04-03
Author: yegamble@gmail.com
Status: VERIFIED
Approved: Yes
Iterations: 0
Worktree: No
Type: Feature

## Summary

**Goal:** Reduce hero section vertical footprint so the full tagline, avatar, name, subtitle, and accent line fit within a standard browser viewport (740–900px height) without scrolling.

**Architecture:** Four targeted Tailwind class changes across two components — reduce hero section padding, cap tagline font size, and reduce avatar dimensions on the `sm` breakpoint.

**Tech Stack:** Tailwind CSS v4 utility classes, Next.js Image component

## Scope

### In Scope

- Reduce hero section top/bottom padding on `md` breakpoint
- Cap tagline H1 at `text-5xl` (remove `lg:text-6xl`)
- Reduce avatar from 160px (`sm:h-40 sm:w-40`) to 128px (remove `sm:` responsive upsize)
- Update unit tests that assert on changed class names
- Visual verification via browser automation

### Out of Scope

- Mobile viewport adjustments (base sizes `pt-16 pb-16` and `h-32 w-32` are unchanged)
- Other sections' padding
- Typography changes beyond the H1 tagline
- Any layout restructuring

## Approach

**Chosen:** Direct Tailwind class adjustment (4 targeted edits)

**Why:** This is the simplest, most surgical approach — each change is a single class swap in the source. No new dependencies, no structural changes, fully reversible.

**Alternatives considered:** None viable — the problem is purely excessive spacing/sizing values. Restructuring the hero layout or using CSS clamp/viewport units would add complexity for no benefit.

## Context for Implementer

> Write for an implementer who has never seen the codebase.

- **Patterns to follow:** Components use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`) for breakpoint-specific sizing
- **Conventions:** Default export per component, `'use client'` directive on components with hooks
- **Key files:**
  - `src/components/ScrollHeader.tsx` — hero section with padding + H1 tagline (line 89 for section, line 99 for H1)
  - `src/components/ProfilePicture.tsx` — avatar sizing (line 15)
  - `__tests__/components/ScrollHeader.test.tsx` — hero unit tests (no class assertions affected)
  - `__tests__/components/ProfilePicture.test.tsx` — size assertions on lines 60-73 that must be updated
- **Gotchas:**
  - `ProfilePicture.test.tsx` lines 68-72 assert `sm:h-40` and `sm:w-40` — these must be removed/updated when the avatar stops upsizing
  - The `Image` component `width`/`height` props (160/160) are intrinsic size hints for Next.js, not display dimensions — they can stay at 160 since CSS controls the actual rendered size
  - `page.test.tsx:37` asserts `pb-24` on the **main** container, not the hero — unaffected

## Assumptions

- Standard viewport height is 740px (Playwright default) to 900px — supported by initial measurements showing 740px viewport height. All tasks depend on this.
- The `sm` breakpoint (640px width) is where most desktop users land, so removing `sm:h-40 sm:w-40` means the avatar stays at 128px (`h-32 w-32`) at all breakpoints. Tasks 1-2 depend on this.
- No E2E tests assert on the specific Tailwind classes being changed — confirmed by grep of `cypress/` directory. Task 2 depends on this.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Hero looks cramped on very large viewports (1440p+) | Low | Low | `md:pt-16 md:pb-16` still provides 64px padding on each side — generous for content sections |
| Avatar appears too small on large screens | Low | Low | 128px is still a standard profile photo size; the name/subtitle provide identity context |
| Tagline wraps awkwardly at intermediate widths | Low | Medium | `text-5xl` (48px) at `sm` is well-tested across portfolio sites; verify with browser automation |

## Goal Verification

### Truths

1. The full hero content (avatar, name, subtitle, tagline, accent line) is visible without scrolling on a 740px viewport height
2. The tagline H1 renders at max 48px (`text-5xl`) on all breakpoints
3. The avatar renders at 128px on all breakpoints (no responsive upsize)
4. The hero section has 64px top/bottom padding on `md` breakpoint (reduced from 96px)
5. All unit tests pass with 0 failures
6. TS-001 passes end-to-end — accent line is above the viewport fold

### Artifacts

- `src/components/ScrollHeader.tsx` — modified section + H1 classes
- `src/components/ProfilePicture.tsx` — modified avatar size classes
- `__tests__/components/ProfilePicture.test.tsx` — updated size assertions

## E2E Test Scenarios

### TS-001: Hero Content Fully Visible on Load
**Priority:** Critical
**Preconditions:** Dev server running at localhost:3000, viewport 1280x740
**Mapped Tasks:** Task 1, Task 2

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `http://localhost:3000` | Page loads with hero section visible |
| 2 | Evaluate JS: measure accent line (`[class*="bg-primary"]`) bottom position | Accent line bottom is < viewport height (740px) — fully above the fold |
| 3 | Evaluate JS: measure H1 tagline bottom position | Tagline bottom is < viewport height |
| 4 | Evaluate JS: measure avatar height | Avatar renders at 128px (h-32 = 8rem) |
| 5 | Take viewport screenshot | Visual confirmation — full hero visible without scrolling |

### TS-002: Hero Visual Quality on Large Viewport
**Priority:** Medium
**Preconditions:** Dev server running at localhost:3000
**Mapped Tasks:** Task 1, Task 2

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Resize viewport to 1920x1080 | Viewport resized |
| 2 | Navigate to `http://localhost:3000` | Page loads |
| 3 | Take viewport screenshot | Hero has adequate whitespace, doesn't look cramped, text is readable |

## E2E Results

| Scenario | Priority | Result | Fix Attempts | Notes |
|----------|----------|--------|--------------|-------|
| TS-001   | Critical | PASS   | 0            | Accent line at 597px, tagline at 561px — both within 740px viewport (143px headroom) |
| TS-002   | Medium   | PASS   | 0            | 1920x1080: generous whitespace, avatar+name side-by-side, About section visible above fold |

## Progress Tracking

- [x] Task 1: Reduce hero section padding and tagline font size
- [x] Task 2: Move name/subtitle beside avatar (horizontal layout)

**Total Tasks:** 2 | **Completed:** 2 | **Remaining:** 0

## Implementation Tasks

### Task 1: Reduce Hero Padding and Tagline Font Size

**Objective:** Reduce hero section vertical padding and cap the H1 tagline at `text-5xl` to reclaim ~140px of vertical space.
**Dependencies:** None
**Mapped Scenarios:** TS-001, TS-002

**Files:**

- Modify: `src/components/ScrollHeader.tsx`

**Key Decisions / Notes:**

- Line 89: Change `md:pb-24 md:pt-24` → `md:pb-16 md:pt-16` (96px → 64px each, saves 64px total)
- Line 99: Change `sm:text-5xl lg:text-6xl` → `sm:text-5xl` (remove `lg:text-6xl`, caps at 48px instead of 60px)
- Base mobile sizes (`pb-16 pt-16` and `text-4xl`) are unchanged

**Definition of Done:**

- [ ] Hero section has classes `pt-16 md:pt-16` and `pb-16 md:pb-16`
- [ ] H1 tagline has classes `text-4xl sm:text-5xl` (no `lg:text-6xl`)
- [ ] All existing unit tests pass (no class assertions on these values)
- [ ] No diagnostics errors

**Verify:**

- `npm run test -- --silent`
- `npm run typecheck`

---

### Task 2: Move Name/Subtitle Beside Avatar (Horizontal Layout)

**Objective:** Place the avatar and name/subtitle in a horizontal flex row to reclaim vertical space. Avatar size stays unchanged.
**Dependencies:** None (can be done in parallel with Task 1)
**Mapped Scenarios:** TS-001, TS-002

**Files:**

- Modify: `src/components/ScrollHeader.tsx`
- Modify: `__tests__/components/ScrollHeader.test.tsx` (if layout assertions need updating)

**Key Decisions / Notes:**

- Wrap `<ProfilePicture>` and the sentinel `<div>` (name + subtitle) in a `flex items-center gap-6` container
- Remove `mb-8` from `<ProfilePicture className="mb-8">` since flex gap handles spacing
- On mobile, stack vertically (`flex-col`) and switch to horizontal on `sm` (`sm:flex-row sm:items-center`)
- This collapses ~130px of vertical space (avatar-to-name gap + name height becomes parallel)
- Avatar (`ProfilePicture.tsx`) and its tests are NOT modified — keep `sm:h-40 sm:w-40`

**Definition of Done:**

- [ ] Avatar and name/subtitle render side-by-side on `sm`+ breakpoints
- [ ] Mobile layout remains stacked vertically
- [ ] All existing unit tests pass with 0 failures
- [ ] No diagnostics errors

**Verify:**

- `npm run test -- --silent`
- `npm run typecheck`
