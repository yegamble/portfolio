# CipherText Animation Edge Cases Fix Plan

Created: 2026-04-03
Author: yegamble@gmail.com
Status: VERIFIED
Approved: Yes
Iterations: 0
Worktree: No
Type: Bugfix

## Summary

**Symptom:** Two edge cases in CipherText animation: 1) Some text remains at lower opacity/transparent after animation should have completed — paragraphs appear faded. 2) Foreign characters (Japanese, Georgian, etc.) from the cipher animation's random character pool persist in the final rendered English text after language switching.

**Trigger:** Language switching while cipher animations are in-flight or rapid consecutive language switches. The ref-based (long text) animation path is most affected.

**Root Cause:** Two related issues in `src/hooks/useCipherTransition.ts`:

1. **Stale DOM content on interrupted animations (lines 244-249, 273, 307):** When `cleanup()` is called on animation interruption (new text arrives while animating), it only unregisters the RAF tick. It does NOT reset the DOM element's `textContent` back to the target text. The `elementRef.current` retains whatever scrambled characters were last written by line 307, including Japanese/Georgian/Arabic characters from `getRandomCipherChar()`.

2. **Opacity stuck at 0.5 after interrupted animation (CipherText.tsx:107-119, globals.css:50-52):** The long-text path renders with class `cipher-text-scramble` (opacity: 0.5) during animation. When `isAnimating` becomes false, the component re-renders without the scramble class. But if the ref-based DOM `textContent` was left in a scrambled state (bug 1), the text displays at full opacity but with wrong characters, OR if the state transition races, the opacity: 0.5 span persists visually.

## Investigation

- `useCipherTransition.ts:220` sets `prevTextRef.current = text` at effect start (before animation begins), and also at line 207/314 when animation completes. This dual-write is intentional for the `text === prevTextRef.current` guard on line 166/269 — but it means cleanup on interruption doesn't need to touch `prevTextRef`.
- The actual bug: `cleanup()` (lines 139-144, 244-249) only does `unregisterTick(tickRef.current)`. For the ref-based path, the DOM element (`elementRef.current`) still holds the last scrambled frame's text. When `isAnimating` flips to false, `CipherText.tsx:92-94` renders `{text}` as React children — but the `longTextRef` span from the previous render cycle may have its `textContent` overwritten by the stale scrambled value if React reuses the DOM node.
- The `About` component has multiple `<CipherText>` instances. The `block` prop instances use `usePretextHeight` for height reservation. The `about.p2_before`, `about.p2_link`, and `about.p2_after` are three separate short-text `<CipherText>` instances — the Japanese character artifact at "realestate.co.nz" comes from the short-text per-char path where `displayChars` retains scrambled characters if the component re-renders before the animation completes.
- `generateFrameChars` line 110: `const targetChar = i < newChars.length ? newChars[i] : ''` — when old text is longer than new text, extra indices get `''`. These empty chars are set into `displayChars`, but the per-char render at `CipherText.tsx:128` does `targetChars[index] ?? ''` — if `displayChars` has more entries than `targetChars`, extra cipher chars render with no target to resolve to.

## Fix Approach

**Chosen:** Reset DOM and state on cleanup

**Why:** The cleanup function needs to be defensive — when an animation is interrupted, it must leave the component in a clean final state (target text displayed, no scrambled characters, no stale opacity). This is a targeted fix at the cleanup boundary, not a rewrite of the animation logic.

**Files:** `src/hooks/useCipherTransition.ts`
**Strategy:**
1. In both `cleanup` callbacks, reset the DOM/state to the target text when interrupting an in-flight animation
2. For ref-based path: set `elementRef.current.textContent = text` in cleanup
3. For char-based path: set `displayChars` to `Array.from(text)` and `isAnimating` to false in cleanup
4. Ensure `generateFrameChars` never produces more chars than the target text length — clamp `maxLen` to `newChars.length` since we only care about resolving TO the new text, not animating away old chars that no longer exist

**Tests:** `__tests__/components/CipherText.test.tsx`, `__tests__/hooks/useCipherTransition.test.ts` (if exists)

## Verification Scenario

### TS-001: Language switch clears cipher artifacts
**Preconditions:** Site loaded in English with cipher transition enabled

| Step | Action | Expected Result (after fix) |
|------|--------|-----------------------------|
| 1 | Switch language to Russian | All text animates and resolves to Russian with full opacity |
| 2 | Immediately switch back to English | All text resolves to English — no Russian/Japanese/Georgian characters remain |
| 3 | Switch to Hebrew then immediately to English | All text resolves to English cleanly, no artifacts, uniform opacity |

## Progress

- [x] Task 1: Fix cleanup and frame generation
- [x] Task 2: Verify

**Tasks:** 2 | **Done:** 2

## Tasks

### Task 1: Fix cleanup and frame generation

**Objective:** Make animation cleanup defensive — reset DOM and state to target text on interruption. Clamp frame generation to target text length.
**Files:**
- Modify: `src/hooks/useCipherTransition.ts`
- Modify/Create: `__tests__/hooks/useCipherTransition.test.ts` or `__tests__/components/CipherText.test.tsx`

**TDD:** Write regression test for interrupted animation → verify characters resolve → implement fix → verify all pass

**Key changes:**
1. `useCipherAnimationLoop` cleanup: add `setDisplayChars(Array.from(text))` and `setIsAnimating(false)` — requires access to current `text` value, so pass it via a ref
2. `useCipherRefAnimationLoop` cleanup: add `elementRef.current.textContent = text` and `setIsAnimating(false)`
3. `generateFrameChars`: change `maxLen` usage — only iterate up to `newChars.length`, not the max of old and new. Characters beyond the new text length should not be generated.

**Verify:** `pnpm test`

### Task 2: Verify

**Objective:** Full suite + quality checks
**Verify:** `pnpm test && pnpm run typecheck && pnpm run lint`
