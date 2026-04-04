# Pretext CipherText Animation — Height Clamping Plan

Created: 2026-04-04
Author: yegamble@gmail.com
Status: VERIFIED
Approved: Yes
Iterations: 0
Worktree: No
Type: Feature

## Summary

**Goal:** Use pretext's `prepare()` + `layout()` to clamp both `minHeight` AND `maxHeight` on block CipherText elements during animation, eliminating height shifts caused by scrambled characters wrapping to different line counts than target text.

**Architecture:** Enhance the existing `usePretextHeight` hook to predict both old and new text heights via pretext, apply bidirectional height clamping (`minHeight` + `maxHeight` + `overflow: hidden`) during animation, and release constraints when animation completes — reacting to actual `isAnimating` state instead of a fixed 1800ms timeout.

**Tech Stack:** `@chenglou/pretext` (already installed v0.0.4), existing `useCipherTransition` hook's `isAnimating` signal.

## Scope

### In Scope

- Enhance `usePretextHeight` to accept `isAnimating` and apply height clamping
- Measure both old and new text heights with pretext (not `el.offsetHeight`)
- Replace fixed 1800ms timeout with reactive animation-state tracking
- Wire `isAnimating` from `useCipherTransition` through CipherText to the hook
- Unit tests for enhanced hook behavior
- Playwright verification of eliminated shifts

### Out of Scope

- Width-matched cipher character selection (future improvement)
- Inline (non-block) CipherText dimension reservation
- Changes to the cipher animation methodology or visual flow
- Pretext `layoutWithLines()` integration (future opportunity for line-level control)

## Approach

**Chosen:** Reactive height clamping with pretext dual-measurement

**Why:** Pretext's `prepare()` + `layout()` accurately predicts text height via pure arithmetic (no DOM reflow). By measuring BOTH old and new text, we compute the exact height envelope. Applying `maxHeight` = `minHeight` = `max(oldHeight, newHeight)` with `overflow: hidden` prevents both shrinking AND growing during animation. Reacting to `isAnimating` state gives precise timing without hardcoded durations.

**Alternatives considered:**
1. **Width-matched cipher chars** — Use pretext canvas measurement to select scramble chars with similar width to target chars. More complex, addresses root cause (word overflow) rather than symptom (height shift). Deferred as future smoothness improvement.
2. **Line-break-aware animation** — Use `layoutWithLines()` to determine target line breaks and force them during animation. Highly complex, changes animation rendering architecture. Rejected for scope.
3. **Fixed maxHeight with tolerance** — Just add `maxHeight` with a tolerance buffer. Simpler but doesn't react to actual animation state; requires tuning the tolerance. Rejected in favor of reactive approach.

## Context for Implementer

> Write for an implementer who has never seen the codebase.

- **Patterns to follow:**
  - `src/hooks/usePretextHeight.ts:31-98` — existing hook to enhance (the primary target)
  - `src/hooks/useCipherTransition.ts:349-373` — `useCipherTransition` hook that provides `isAnimating`
  - `src/components/CipherText.tsx:80-84` — where both hooks are called and wired together

- **Conventions:**
  - Hooks in `src/hooks/`, tests in `__tests__/hooks/`
  - `'use client'` for components with hooks
  - `@/*` path aliases for all imports
  - `npm run test` for Vitest, `npx playwright test` for E2E

- **Key files:**
  - `src/hooks/usePretextHeight.ts` — the hook to enhance
  - `src/components/CipherText.tsx` — component that wires both hooks
  - `__tests__/hooks/usePretextHeight.test.ts` — existing hook tests
  - `__tests__/components/CipherText.test.tsx` — existing component tests
  - `playwright/layout-stability.spec.ts` — E2E layout stability test
  - `src/app/globals.css:55-58` — `.cipher-char-slot` CSS (no changes needed)

- **Gotchas:**
  - `usePretextHeight` returns `style: {}` when disabled — callers spread this into style props
  - The `ANIMATION_DURATION` constant (1800ms) currently drives the setTimeout — remove it entirely in favor of reactive `isAnimating` tracking
  - `prepare()` caches segment metrics per font string — two `prepare()` calls for old/new text reuse the same cache, so overhead is minimal
  - `block` CipherText wraps content in a `<span ref={ref} style={style}>` — the ref MUST stay attached across animating/non-animating states for DOM reads to work
  - The `getWidth()` helper reads parent width (`parent.clientWidth`), which is stable during animation

- **Domain context:**
  - Block CipherText = multi-line text (paragraphs, descriptions, tagline) that uses pretext height reservation
  - Long text (>80 chars) uses ref-based DOM updates (no per-char spans) — scrambled text flows naturally → different line breaks → height oscillation
  - The heroTagline oscillates between 240px and 300px during HE→EN animation because scrambled CJK/Arabic chars create wider "words" that wrap to extra lines

## Assumptions

- Pretext's `prepare()` + `layout()` accuracy matches actual rendered height within ±5px for Inter/Heebo fonts — supported by STATUS.md benchmark data and existing test passing
- `isAnimating` from `useCipherTransition` goes false in the same React render cycle as the text resolving to its final value — supported by reading `useCipherTransition.ts:204-209`
- Two `prepare()` calls per text change have negligible performance impact due to pretext's segment metric cache — supported by pretext README ("keep relayout cheap")
- Block text width is stable during animation (parent container doesn't resize) — supported by Playwright measurement showing constant 704px width

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Pretext height prediction off by >5px | Low | Minor visual jump on clamp release | CSS transition (500ms ease-out) smooths any minor discrepancy |
| `overflow: hidden` clips important content during animation | Low | Text visually cut off | Clamp at max(old, new) — content that fits naturally in either language fits in the envelope |
| Rapid language toggling creates stale clamping state | Low | Brief height inconsistency | Each text change recalculates clamp from fresh pretext measurements; `isAnimating` resets per cycle |

## Goal Verification

### Truths

1. heroTagline height stays ≤ max(EN height, HE height) during HE→EN animation — no 60px overshoot
2. aboutP1 height does not shrink during EN→HE animation until animation completes
3. All block CipherText elements stay within the max(old, new) height envelope during animation
4. Height transitions smoothly (via CSS transition) after animation completion — no abrupt snap
5. Existing layout-stability Playwright test passes with ≤ 8px tolerance
6. TS-001 and TS-002 pass end-to-end

### Artifacts

- `src/hooks/usePretextHeight.ts` — enhanced hook with clamping logic
- `src/components/CipherText.tsx` — updated to pass `isAnimating`
- `__tests__/hooks/usePretextHeight.test.ts` — tests for clamping behavior
- `playwright/layout-stability.spec.ts` — verification of eliminated shifts

## E2E Test Scenarios

### TS-001: HE→EN hero tagline height clamping
**Priority:** Critical
**Preconditions:** App loaded, language set to Hebrew
**Mapped Tasks:** Task 1, Task 2

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to http://localhost:3000 | Page loads in English |
| 2 | Open language selector, switch to Hebrew | Animation runs, page settles in Hebrew |
| 3 | Wait 3s for animation to complete | All text fully resolved |
| 4 | Open language selector, switch to English | Animation starts |
| 5 | Sample `header + section h1` height every 50ms for 2.5s | Height never exceeds max(HE height, EN height) + 5px tolerance |
| 6 | After animation completes | Height settles to EN natural height (240px ± 5px) |

### TS-002: EN→HE about paragraph height stability
**Priority:** High
**Preconditions:** App loaded in English
**Mapped Tasks:** Task 1, Task 2

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to http://localhost:3000 | Page loads in English |
| 2 | Open language selector, switch to Hebrew | Animation starts |
| 3 | Sample `#about > div:last-child > p:first-child` height every 50ms for 2.5s | Height never drops below min(EN height, HE height) during animation |
| 4 | After animation completes | Height smoothly transitions to HE natural height |

### TS-003: Rapid language toggle stability
**Priority:** Medium
**Preconditions:** App loaded in English
**Mapped Tasks:** Task 1

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Switch to Hebrew, immediately switch back to English within 200ms | Animation restarts, no crash or layout corruption |
| 2 | Sample hero tagline height for 3s | Height stays within max(EN, HE) envelope |

## Progress Tracking

- [x] Task 1: Enhance `usePretextHeight` with height clamping
- [x] Task 2: Wire `isAnimating` through CipherText
- [x] Task 3: Update unit tests
- [x] Task 4: Playwright layout stability verification
      **Total Tasks:** 4 | **Completed:** 4 | **Remaining:** 0

## Implementation Tasks

### Task 1: Enhance `usePretextHeight` with height clamping

**Objective:** Add bidirectional height clamping using pretext dual-measurement and reactive animation-state tracking.
**Dependencies:** None
**Mapped Scenarios:** TS-001, TS-002, TS-003

**Files:**

- Modify: `src/hooks/usePretextHeight.ts`

**Key Decisions / Notes:**

- Add third parameter `isAnimating: boolean` (default `false`) to the hook signature
- On text change: measure BOTH `prevTextRef.current` (old) and `text` (new) via `prepare()` + `layout()`. Use `max(oldHeight, newHeight)` as the clamped height. Store `newHeight` in a ref (`targetHeightRef`) for release.
- While `isAnimating` is true: apply `maxHeight` = `minHeight` = clampedHeight, `overflow: hidden`
- When `isAnimating` transitions true→false: set `minHeight` to `targetHeightRef.current`, remove `maxHeight` and `overflow`. CSS transition smooths the change.
- Update the `transition` style property from `'min-height 500ms ease-out'` to `'min-height 500ms ease-out, max-height 500ms ease-out'` so that `maxHeight` removal is also animated smoothly.
- Remove the `ANIMATION_DURATION` constant (1800ms) and the `setTimeout`-based release entirely — replaced by reactive `isAnimating` tracking.
- Use a `wasAnimatingRef` to detect the true→false transition in a `useEffect` on `isAnimating`. The `useEffect` dependency array MUST include `[text, isEnabled, isAnimating]` — omitting `isAnimating` would prevent the clamp-release effect from firing when animation ends.
- Keep the `timerRef` cleanup in unmount for safety, but it should no longer be set.

**Definition of Done:**

- [ ] Hook accepts `isAnimating` parameter
- [ ] Both old and new text heights are measured via pretext (no `el.offsetHeight` for comparison)
- [ ] `maxHeight` and `overflow: hidden` applied during animation
- [ ] Transition covers both `min-height` and `max-height`
- [ ] `isAnimating` is in the useEffect dependency array
- [ ] Constraints released when `isAnimating` goes false
- [ ] Fixed 1800ms timeout removed
- [ ] All existing hook tests still pass
- [ ] No TypeScript errors

**Verify:**

- `npm run test -- __tests__/hooks/usePretextHeight.test.ts`
- `npm run typecheck`

---

### Task 2: Wire `isAnimating` through CipherText

**Objective:** Pass the `isAnimating` state from `useCipherTransition` to `usePretextHeight` in the CipherText component.
**Dependencies:** Task 1
**Mapped Scenarios:** TS-001, TS-002

**Files:**

- Modify: `src/components/CipherText.tsx`

**Key Decisions / Notes:**

- At `CipherText.tsx:80-84`, the component already destructures `{ displayChars, isAnimating }` from `useCipherTransition` and `{ ref, style }` from `usePretextHeight`.
- Change `usePretextHeight(text, block && isI18nEnabled)` to `usePretextHeight(text, block && isI18nEnabled, isAnimating)`.
- This is a one-line change. No other modifications to CipherText.
- The `usePretextHeight` hook must be called with a stable `isAnimating` reference — since it comes from `useCipherTransition`'s return value, it's a boolean state variable and stable.

**Definition of Done:**

- [ ] `isAnimating` passed to `usePretextHeight`
- [ ] Existing CipherText tests still pass
- [ ] No TypeScript errors

**Verify:**

- `npm run test -- __tests__/components/CipherText.test.tsx`
- `npm run typecheck`

---

### Task 3: Update unit tests

**Objective:** Add tests for the new clamping behavior and update existing tests for the changed interface.
**Dependencies:** Task 1, Task 2
**Mapped Scenarios:** None (test infrastructure)

**Files:**

- Modify: `__tests__/hooks/usePretextHeight.test.ts`
- Modify: `__tests__/components/CipherText.test.tsx`

**Key Decisions / Notes:**

- **usePretextHeight tests to add:**
  1. `should apply maxHeight and overflow hidden when isAnimating is true and text changes` — render with text A, set isAnimating=true, rerender with text B, verify style has maxHeight = max(heightA, heightB) and overflow = 'hidden'
  2. `should release maxHeight and set minHeight to target when isAnimating goes false` — continue from above, set isAnimating=false, verify maxHeight is undefined and minHeight equals targetHeight
  3. `should measure both old and new text heights via pretext` — verify `prepare()` called twice on text change (once for old text, once for new)
  4. `should not use ANIMATION_DURATION setTimeout` — verify no setTimeout-based release (the constant should be removed)

- **usePretextHeight tests to update:**
  - Existing tests that check `setTimeout`-based release need updating since that mechanism is removed
  - Test `should transition minHeight to target after animation duration` → replace with the reactive `isAnimating` version
  - **Critical mock change:** Since the implementation now calls `prepare()` + `layout()` for BOTH old and new text (not `el.offsetHeight`), the `mockLayout` must return DIFFERENT values for successive calls. Use `mockLayout.mockReturnValueOnce({ height: 100, lineCount: 4 }).mockReturnValueOnce({ height: 120, lineCount: 5 })` to simulate old-text vs new-text heights. Remove all `offsetHeight` from mock elements since the implementation no longer reads it for height comparison.
  - The `should use max of current and target height to prevent shrink` test needs `mockLayout.mockReturnValueOnce({ height: 100, lineCount: 4 }).mockReturnValueOnce({ height: 60, lineCount: 3 })` — the `max(100, 60) = 100` assertion now comes from pretext's old-text height, not `el.offsetHeight`.

- **CipherText tests:**
  - Verify mock of `usePretextHeight` is updated to accept the third `isAnimating` parameter
  - No behavioral changes needed in CipherText tests

- Use `vi.mocked(prepare)` to verify call args. Mock `layout` to return different heights for successive calls to simulate old-text vs new-text measurement.

**Definition of Done:**

- [ ] New clamping tests pass
- [ ] Existing tests updated for new interface
- [ ] Full test suite passes: `npm run test`
- [ ] Coverage maintained ≥ 80%

**Verify:**

- `npm run test`

---

### Task 4: Playwright layout stability verification

**Objective:** Verify that height shifts are eliminated using browser automation.
**Dependencies:** Task 1, Task 2, Task 3
**Mapped Scenarios:** TS-001, TS-002, TS-003

**Files:**

- Modify (if tolerance improvement confirmed): `playwright/layout-stability.spec.ts`

**Key Decisions / Notes:**

- Build the app (`npm run build`) and start (`npm run start`) before running Playwright
- Run existing `layout-stability.spec.ts` test — it already measures width/height envelopes during EN→HE transition with 8px tolerance
- Additionally, run the specific TS-001 scenario manually via `playwright-cli`:
  1. Load page, switch to Hebrew, wait 3s
  2. Switch to English, sample heroTagline height every 50ms for 2.5s
  3. Verify max height ≤ max(EN, HE) + 5px
- If existing test tolerance needs adjustment after fix (shifts should be SMALLER), tighten from 8px to 5px
- Run on both desktop (1280×900) and mobile (390×844) viewports

**Definition of Done:**

- [ ] `npx playwright test playwright/layout-stability.spec.ts` passes
- [ ] TS-001: heroTagline height overshoot eliminated (≤ 5px tolerance)
- [ ] TS-002: aboutP1 height stable during animation
- [ ] TS-003: Rapid toggle does not crash or corrupt layout
- [ ] If measured max shift ≤ 5px, tighten tolerance in spec from 8px to 5px

**Verify:**

- `npm run build && npm run start` (in background)
- `npx playwright test playwright/layout-stability.spec.ts`

## Open Questions

None — all design decisions resolved.

### Deferred Ideas

- **Width-matched cipher characters**: Use pretext's `getMeasureContext()` + `getSegmentMetrics()` to measure target character widths, then select scramble characters with similar widths from the cipher pools. This would address the root cause of height oscillation (scrambled words being wider) rather than clamping the symptom. More complex but would also improve visual smoothness.
- **Line-level animation control**: Use `prepareWithSegments()` + `layoutWithLines()` to determine exact target line breaks and force them during animation. Would prevent all reflow during scramble but requires significant rendering architecture changes.
- **Inline CipherText width reservation**: Use pretext to predict natural width of inline text (nav items, headings) and reserve it during animation. Lower priority since inline text shifts are less noticeable.
