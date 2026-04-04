# Cipher Text Animation Performance Fix Plan

Created: 2026-04-03
Author: yegamble@gmail.com
Status: VERIFIED
Approved: Yes
Iterations: 0
Worktree: No
Type: Bugfix

## Summary

**Symptom:** Cipher text transition animation is sluggish on desktop and freezes/hangs for several seconds on mobile browser devices when switching languages.

**Trigger:** Clicking the language toggle (e.g., English → Hebrew) triggers all ~30 CipherText instances to animate simultaneously.

**Root Cause:** `src/hooks/useCipherTransition.ts:197` — `setDisplayChars(chars)` triggers React re-renders on every animation tick across all instances. `src/components/CipherText.tsx:62-80` creates **3 nested `<span>` elements per character** during animation. Combined: ~3,200 characters × 3 spans = **~9,500 DOM nodes** created simultaneously, each with CSS transitions (`opacity`, `color`, `text-shadow`). 93% of these nodes are below the fold and invisible to the user. Mobile CPUs cannot reconcile this DOM churn within the 90ms update interval, causing multi-second freezes.

## Investigation

- **DOM node count**: ~30 CipherText instances with total ~3,200 characters. Each animated char creates 3 spans (`.cipher-char-slot` > `.cipher-char-layout` + `.cipher-char`), producing ~9,500 DOM nodes.
- **Above-the-fold instances**: Only ~200 chars (~600 spans) are visible on initial page load (hero section + nav items). The remaining 93% (about, experience, projects, footer) are below the fold.
- **React re-render overhead**: The shared RAF scheduler batches RAF callbacks, but each CipherText instance independently calls `setDisplayChars()` which triggers React reconciliation. With ~30 instances updating every 50-90ms, React reconciles ~9,500 span elements per frame.
- **CSS transition burden**: Every `.cipher-char` has `transition: opacity 400ms, color 400ms, text-shadow 400ms` (reduced to 200ms on mobile but still applied to all ~9,500 nodes). The `text-shadow` property is particularly expensive as it triggers paint operations.
- **Research confirms**: Industry best practice for text scramble effects is direct DOM manipulation via refs (bypassing React), not per-char `<span>` + `useState`. Libraries like GSAP ScrambleTextPlugin and Motion ScrambleText operate outside React's render cycle for this reason.
- **Existing Playwright perf tests** (`playwright/cipher-performance.spec.ts`) test desktop viewport only — no mobile viewport coverage exists.

## Fix Approach

**Chosen:** Viewport gating + ref-based long-text rendering

**Why:** Addresses both root causes (unnecessary off-screen animation AND per-char DOM overhead for paragraphs) with minimal visual impact. Short text (headers, nav, names) keeps the full per-char glow effect. Long text (paragraphs, descriptions) uses direct DOM updates, eliminating ~8,000 unnecessary span nodes. No new dependencies.

**Alternatives considered:**
- *Viewport gating only* — Simpler but doesn't fix desktop sluggishness for visible long text. Paragraphs in the about section (if scrolled into view) still create ~3,000+ spans.
- *GSAP ScrambleTextPlugin* — Best theoretical performance but adds a ~40KB dependency, requires full rewrite of animation layer, and the per-char teal glow resolve effect would need recreation.

**Files:**
- `src/hooks/useCipherTransition.ts` — add visibility parameter, add ref-based mode for long text
- `src/components/CipherText.tsx` — add IntersectionObserver, threshold-based rendering (per-char vs ref-based)
- `src/app/globals.css` — add `.cipher-text-fade` class for long-text resolve transition

**Strategy:**

1. **Viewport gating** via IntersectionObserver in CipherText: off-screen instances skip animation entirely (instant text swap). Uses a generous rootMargin (`200px`) so animation starts slightly before scrolling into view.

2. **Threshold-based rendering** (80-char threshold):
   - **Short text (≤ 80 chars)**: Current per-char `<span>` animation with resolve glow. These are names, headings, nav items, dates, titles — manageable DOM count.
   - **Long text (> 80 chars)**: Hook updates a ref'd DOM element's `textContent` directly via `useRef` + RAF (no `setState`, no per-char spans). On resolve, a CSS fade transition on the whole span gives visual feedback.

3. **Mobile optimization**: On `pointer: coarse` / narrow viewport, raise the threshold to apply ref-based mode even more aggressively (threshold lowered to 40 chars).

**Tests:**
- `__tests__/hooks/useCipherTransition.test.ts` — update for new visibility parameter
- `__tests__/components/CipherText.test.tsx` — add viewport gating tests, long-text rendering tests
- `playwright/cipher-performance.spec.ts` — add mobile viewport (375×812) perf test

## Verification Scenario

### TS-001: Mobile language switch no longer freezes
**Preconditions:** App loaded on mobile viewport (375×812)

| Step | Action | Expected Result (after fix) |
|------|--------|-----------------------------|
| 1 | Open page, switch language to Hebrew | Animation runs smoothly, no visible freeze or hang. Long task count < 3, total blocking time < 100ms |
| 2 | Switch back to English | Same smooth animation, no freeze |
| 3 | Scroll to experience section, switch language | Visible section animates, previously off-screen sections don't trigger animation |

### TS-002: Desktop animation remains smooth
**Preconditions:** App loaded on desktop viewport (1280×900)

| Step | Action | Expected Result (after fix) |
|------|--------|-----------------------------|
| 1 | Switch language to Hebrew | Average FPS ≥ 45, dropped frames < 5 |
| 2 | Per-char glow visible on hero name, nav items, section headings | Short text retains full visual effect |
| 3 | Long text (about paragraphs, job descriptions) resolves with fade | No per-char spans visible in DOM during animation |

## Progress

- [x] Task 1: Write regression and performance tests
- [x] Task 2: Implement viewport gating + ref-based long-text rendering
- [x] Task 3: Verify full suite and Playwright performance
      **Tasks:** 3 | **Done:** 3

## Tasks

### Task 1: Write regression and performance tests

**Objective:** Add mobile viewport perf test to Playwright suite, add unit tests for viewport gating and long-text rendering behavior
**Files:**
- `playwright/cipher-performance.spec.ts` — add mobile viewport test (375×812) measuring long tasks and blocking time
- `__tests__/components/CipherText.test.tsx` — add tests for: off-screen CipherText renders text without animation spans; long text (>80 chars) doesn't create per-char spans during animation
- `__tests__/hooks/useCipherTransition.test.ts` — add test for visibility=false returning static text
**TDD:** Write tests → verify they FAIL against current implementation (mobile perf test may pass loosely on desktop CI — threshold tuning needed) → proceed to Task 2
**Verify:** `npm run test -- --silent` and `npx playwright test`

### Task 2: Implement viewport gating + ref-based long-text rendering

**Objective:** Reduce animated DOM nodes from ~9,500 to ~600 by gating off-screen instances and using direct DOM updates for long text
**Files:**
- `src/hooks/useCipherTransition.ts` — accept `isVisible` param; add `useCipherRefAnimation` path for long text that updates a ref'd element's textContent directly (no setState during scramble); export char threshold constant
- `src/components/CipherText.tsx` — add IntersectionObserver (rootMargin: 200px); pass visibility to hook; render single `<span ref>` for long-text mode; keep per-char spans for short text
- `src/app/globals.css` — add `.cipher-text-resolve` class with opacity + color transition for long-text resolve effect
**TDD:** Implement → verify tests from Task 1 pass → verify existing tests still pass
**Verify:** `npm run test -- --silent && npm run typecheck && npm run lint`

### Task 3: Verify full suite and Playwright performance

**Objective:** Full test suite, Playwright perf tests (desktop + mobile), lint, type check
**Verify:** `npm run test -- --silent && npm run typecheck && npm run lint && npx playwright test`
