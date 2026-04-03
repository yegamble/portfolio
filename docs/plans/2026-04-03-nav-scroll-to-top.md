# Nav Name Scroll-to-Top Implementation Plan

Created: 2026-04-03
Author: yegamble@gmail.com
Status: VERIFIED
Approved: Yes
Iterations: 0
Worktree: No
Type: Feature

## Summary

**Goal:** When the user clicks the name/title in the sticky nav bar, the page smooth-scrolls to the top instead of triggering a full page navigation.

**Architecture:** Add an `onClick` handler to the existing `<Link href="/">` in the nav bar that prevents default navigation and calls `window.scrollTo({ top: 0, behavior: 'smooth' })`.

**Tech Stack:** React event handler, native `window.scrollTo` API

## Scope

### In Scope

- Add scroll-to-top onClick to the nav name `<Link>` in `ScrollHeader.tsx`
- Add unit test for the new scroll behavior
- E2E verification that clicking the name scrolls to top

### Out of Scope

- Making the job title span clickable (only the name link)
- Changing scroll behavior of other nav links (About, Experience, Projects)
- Adding a separate "scroll to top" button

## Approach

**Chosen:** Add onClick handler to existing `<Link>`

**Why:** Preserves the `<a href="/">` semantics (right-click, crawlers, accessibility) while adding smooth scroll behavior. Zero impact on existing tests — the `href="/"` assertion at `ScrollHeader.test.tsx:349` still passes.

**Alternatives considered:**
- Replace `<Link>` with `<button>` + `scrollTo` — changes element role, breaks existing tests, loses link semantics (right-click → open in new tab). Rejected.
- Use `<a href="#top">` with a top anchor — requires adding an anchor element to the DOM, doesn't provide smooth scrolling natively. Rejected.

## Context for Implementer

> Write for an implementer who has never seen the codebase.

- **Key file:** `src/components/ScrollHeader.tsx` — the nav name `<Link>` is at line 53-59
- **Pattern:** The `Link` component from `next/link` accepts standard React event handlers. Add `onClick` with `e.preventDefault()` to override navigation.
- **Conventions:** This component already uses `'use client'` and React hooks. Event handlers follow the `handle*` naming convention internally.
- **Gotchas:**
  - The `<Link>` has `tabIndex={isScrolled ? 0 : -1}` — scroll-to-top should only work when the link is visible/tabbable (when `isScrolled` is true). Since the container has `pointer-events-none` when not scrolled, this is already handled by CSS.
  - `behavior: 'smooth'` should respect `prefers-reduced-motion` — use `window.matchMedia('(prefers-reduced-motion: reduce)').matches` to fall back to `'auto'`.
  - Test at `ScrollHeader.test.tsx:343-350` asserts `href="/"` — this must continue to pass.
  - Test at `ScrollHeader.test.tsx:242-254` asserts `tabIndex` behavior — unaffected.

## Assumptions

- `window.scrollTo` with `behavior: 'smooth'` is available in all target browsers — supported by all modern browsers. Task 1 depends on this.
- The nav name `Link` click handler won't conflict with Next.js routing — `e.preventDefault()` stops the navigation. Task 1 depends on this.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Smooth scroll not supported in old browsers | Very Low | Low | Fall back to `behavior: 'auto'` (instant scroll) — still achieves the goal |
| `e.preventDefault()` breaks Next.js Link internals | Very Low | Medium | Standard React pattern — Next.js Link supports onClick with preventDefault |

## Goal Verification

### Truths

1. Clicking the nav name when scrolled down smooth-scrolls the page to the top
2. The page does NOT perform a full navigation/reload when the name is clicked
3. The `href="/"` attribute is preserved on the link
4. The link respects `prefers-reduced-motion` (instant scroll when reduced motion preferred)
5. All unit tests pass with 0 failures
6. TS-001 passes end-to-end

### Artifacts

- `src/components/ScrollHeader.tsx` — modified Link with onClick handler
- `__tests__/components/ScrollHeader.test.tsx` — new test for scroll-to-top behavior

## E2E Test Scenarios

### TS-001: Nav Name Scrolls to Top
**Priority:** Critical
**Preconditions:** Dev server running at localhost:3000, viewport 1280x740
**Mapped Tasks:** Task 1

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `http://localhost:3000` | Page loads |
| 2 | Scroll down 1000px | Page is scrolled, nav bar shows name |
| 3 | Evaluate JS: confirm `window.scrollY > 500` | Page is scrolled past hero |
| 4 | Click the nav name link ("Yosef Gamble") | Page scrolls |
| 5 | Wait 1 second for smooth scroll animation | Scroll completes |
| 6 | Evaluate JS: `window.scrollY` | Scroll position is 0 (top of page) |

## E2E Results

| Scenario | Priority | Result | Fix Attempts | Notes |
|----------|----------|--------|--------------|-------|
| TS-001   | Critical | PASS   | 0            | scrollY went from 1000 to 0 after clicking nav name, no page reload |

## Progress Tracking

- [x] Task 1: Add scroll-to-top onClick handler and test

**Total Tasks:** 1 | **Completed:** 1 | **Remaining:** 0

## Implementation Tasks

### Task 1: Add Scroll-to-Top onClick Handler

**Objective:** Add an onClick handler to the nav name `<Link>` that prevents default navigation and smooth-scrolls to the top, respecting reduced motion preferences.
**Dependencies:** None
**Mapped Scenarios:** TS-001

**Files:**

- Modify: `src/components/ScrollHeader.tsx`
- Modify: `__tests__/components/ScrollHeader.test.tsx`

**Key Decisions / Notes:**

- Add `onClick` handler to the `<Link>` at line 53:
  ```tsx
  onClick={(e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  }}
  ```
- Add a new test in the "Sticky header" or "Scroll behavior" describe block that:
  1. Renders ScrollHeader
  2. Gets the nav name link
  3. Mocks `window.scrollTo`
  4. Clicks the link
  5. Asserts `window.scrollTo` was called with `{ top: 0, behavior: 'smooth' }`
- Existing test at line 349 (`href="/"`) must still pass — do not change the `href`

**Definition of Done:**

- [ ] Clicking the nav name link calls `window.scrollTo({ top: 0, behavior: 'smooth' })`
- [ ] `href="/"` is preserved on the link
- [ ] Reduced motion is respected (`behavior: 'auto'` when `prefers-reduced-motion: reduce`)
- [ ] New unit test verifies scroll-to-top on click
- [ ] All existing unit tests pass with 0 failures
- [ ] No diagnostics errors

**Verify:**

- `npm run test -- --silent`
- `npm run typecheck`
