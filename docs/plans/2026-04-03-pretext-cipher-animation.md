# Pretext-Driven Cipher Animation Redesign Implementation Plan

Created: 2026-04-03
Author: yegamble@gmail.com
Status: COMPLETE
Approved: Yes
Iterations: 0
Worktree: No
Type: Feature

## Summary

**Goal:** Redesign the cipher text animation to use pretext's line-level APIs for line-aware scrambling with a per-line glow effect on resolve, and replace the absolute-position per-char overlay with pretext-measured character widths.

**Architecture:** Unify the two animation paths (per-char and ref-based) into a single pretext-powered path. Use `prepareWithSegments()` + `layoutWithLines()` to split text into visual lines, then animate each line's characters with independent resolve timing. When a line fully resolves, it gets the teal glow effect. Replace the `cipher-char-layout` hidden span hack with explicit pretext-measured character widths.

**Tech Stack:** React 19, TypeScript, @chenglou/pretext (already installed), Tailwind CSS v4

## Scope

### In Scope

- Replace both animation paths (per-char spans + ref-based DOM) with a single pretext-line-aware path
- Use `prepareWithSegments()` + `layoutWithLines()` to split text into visual lines
- Per-line glow: each line gets teal glow when all its characters resolve
- Replace `cipher-char-layout` (visibility: hidden) overlay with pretext-measured character widths
- Update `useCipherTransition` hook to return line-structured data instead of flat `displayChars`
- Update `CipherText` component rendering to use line-based structure
- Update CSS for per-line glow animation
- Update all existing tests
- Remove the short/long text threshold split (no more `CHAR_THRESHOLD_DESKTOP`/`MOBILE`)

### Out of Scope

- Changing the character pools or scramble charset (`cipher-chars.ts`)
- Changing the shared RAF scheduler architecture
- RTL/bidi-specific animation behavior (pretext handles bidi in measurement; animation stays LTR resolve order)
- Canvas/SVG rendering (staying with DOM spans)

## Approach

**Chosen:** Single unified pretext-line path

**Why:** Eliminates the dual-path complexity (per-char vs ref-based), leverages pretext for both measurement and line splitting, and enables per-line glow that wasn't possible with the flat character array. The cost is that pretext's `prepareWithSegments()` runs on every text change, but it's fast (~0.04ms per call) and already used for height measurement.

**Alternatives considered:**
- Keep dual paths, add pretext only to the long-text ref path — rejected because user wants both paths redesigned, and maintaining two paths is a source of bugs (as shown by the recent edge cases)
- Use pretext only for measurement, keep flat animation — rejected because it doesn't enable line-aware glow

## Context for Implementer

> Write for an implementer who has never seen the codebase.

- **Patterns to follow:**
  - Current hook: `src/hooks/useCipherTransition.ts` — shared RAF scheduler (`registerTick`/`unregisterTick`/`schedulerLoop`) is excellent and should be kept. The `calculateResolveTimes` and `generateFrameChars` pure functions should be adapted for line-awareness.
  - Current pretext usage: `src/hooks/usePretextHeight.ts` — shows how to call `prepare()`/`layout()` and get font/lineHeight from computed styles.
  - Current rendering: `src/components/CipherText.tsx` — the `CHAR_STYLE`, `CHAR_SLOT_STYLE` constants define the per-char overlay. These will be replaced with pretext-measured widths.

- **Conventions:**
  - One component per file, default exports
  - Tests in `__tests__/` mirroring source structure
  - Package manager: pnpm

- **Key files:**
  - `src/hooks/useCipherTransition.ts` — core animation logic. The shared RAF scheduler (lines 39-71) MUST be preserved — it batches all CipherText instances into a single frame loop.
  - `src/components/CipherText.tsx` — rendering component. Has viewport gating via IntersectionObserver (keep), short/long text threshold (remove), block prop for height reservation (keep, still uses `usePretextHeight`).
  - `src/hooks/usePretextHeight.ts` — already uses pretext `prepare()`/`layout()` for height. Will share the `getFont()`/`getLineHeight()`/`getWidth()` helpers with the new animation code.
  - `src/lib/cipher-chars.ts` — `getRandomCipherChar()` and `isScramblable()`. Unchanged.
  - `src/app/globals.css` — cipher animation CSS classes. Need updates for per-line glow.

- **Gotchas:**
  - `prepareWithSegments()` requires a font string (e.g., `'400 16px Inter'`) and needs access to the DOM element's computed style. This means it can only run in `useEffect` (client-side), not during SSR.
  - `layoutWithLines()` requires a `maxWidth` — get from the parent element's `clientWidth`. On resize, only re-run `layoutWithLines()` (not `prepareWithSegments()`).
  - The `CipherText` component is used ~30 times across the site. Some are short (nav links: "About", "Experience") and some are long paragraphs. The new unified path must handle both efficiently.
  - `usePretextHeight` already calls `prepare()` for height measurement. The animation hook should share the `prepareWithSegments()` result to avoid double measurement — OR merge the two hooks.
  - The `block` prop on CipherText still needs height reservation via pretext (current `usePretextHeight` behavior).

- **Domain context:**
  - Pretext `prepareWithSegments(text, font)` → measures text segments, returns opaque handle
  - `layoutWithLines(prepared, maxWidth, lineHeight)` → splits into `LayoutLine[]` where each line has `{ text, width, start, end }`
  - The animation scrambles characters within each line independently. When ALL characters in a line resolve to their targets, that line gets the teal glow CSS class.

## Feature Inventory

Since this replaces existing animation code, every current feature must be mapped:

| Current Feature | File:Line | Task # |
|----------------|-----------|--------|
| Per-char animation loop (`useCipherAnimationLoop`) | useCipherTransition.ts:131 | Task 2 (replaced) |
| Ref-based animation loop (`useCipherRefAnimationLoop`) | useCipherTransition.ts:240 | Task 2 (replaced) |
| Shared RAF scheduler | useCipherTransition.ts:39-71 | Preserved (not replaced) |
| `generateFrameChars` pure function | useCipherTransition.ts:99 | Task 2 (adapted) |
| `calculateResolveTimes` | useCipherTransition.ts:77 | Task 2 (adapted for per-line) |
| Short/long text threshold | CipherText.tsx:28-29, 77 | Task 3 (removed) |
| Per-char span rendering (cipher-char-slot) | CipherText.tsx:122-149 | Task 3 (replaced with pretext-width spans) |
| Ref-based textContent rendering | CipherText.tsx:107-119 | Task 3 (removed) |
| Viewport gating (IntersectionObserver) | CipherText.tsx:59-73 | Preserved |
| Block prop / height reservation | CipherText.tsx:84, 96-101, 152-158 | Preserved |
| cipher-text-scramble class (opacity 0.5) | globals.css:50-52 | Task 4 (replaced with per-line opacity) |
| cipher-char / cipher-resolved classes | globals.css:65-76 | Task 4 (updated for per-line glow) |
| cipher-glow-fade keyframe | globals.css:78-87 | Task 4 (adapted for per-line) |
| Reduced motion handling | useCipherTransition.ts:152-164, globals.css:89-98 | Preserved |
| Mobile profile (faster timing) | useCipherTransition.ts:28-33 | Preserved |
| `getFont()` / `getLineHeight()` / `getWidth()` helpers | usePretextHeight.ts:13-29 | Task 1 (extracted to shared util) |

## Assumptions

- `prepareWithSegments()` performance is acceptable to call on every text change (~0.04ms per batch of 500) — Task 2 depends on this
- `layoutWithLines()` returns stable line breaks for the same text+width+font — Task 2 depends on this
- Pretext handles Unicode/multilingual text (Arabic, Hebrew, Japanese, Cyrillic) correctly for line splitting — Task 2 depends on this (README confirms this)
- The shared RAF scheduler can handle the new line-structured state updates without performance regression — Task 2 depends on this

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Pretext line breaks don't match browser wrapping exactly | Medium | High | Use `overflow-wrap: break-word` CSS to match pretext defaults; test with various paragraph lengths and languages |
| Performance regression with pretext on every text change | Low | Medium | `prepareWithSegments` is fast; `layoutWithLines` is pure arithmetic. Profile if needed. |
| 30+ CipherText instances calling prepareWithSegments simultaneously | Medium | Medium | The shared RAF scheduler already batches; prepareWithSegments results can be cached per text+font pair |
| Resize causes line re-layout during animation | Low | Low | Only re-run `layoutWithLines` (cheap), keep `prepareWithSegments` cached |

## Goal Verification

### Truths

1. All CipherText instances use the pretext line-aware animation (no dual-path)
2. Characters scramble within lines; when a line fully resolves, it gets a teal glow flash
3. The `cipher-char-layout` hidden span hack is replaced with pretext-measured explicit widths
4. Short text (nav links, headings) and long text (paragraphs) use the same animation path
5. Height reservation still works via pretext (block prop)
6. Viewport gating and reduced motion preferences are preserved
7. All existing tests pass with updated assertions
8. TS-001 and TS-002 pass end-to-end

### Artifacts

- `src/lib/pretext-utils.ts` — shared font/measurement helpers extracted from usePretextHeight
- `src/hooks/useCipherTransition.ts` — rewritten with pretext line-aware animation
- `src/components/CipherText.tsx` — simplified rendering with line-based structure
- `src/hooks/usePretextHeight.ts` — updated to use shared helpers
- `src/app/globals.css` — updated cipher animation CSS

## E2E Test Scenarios

### TS-001: Cipher animation with language switch
**Priority:** Critical
**Preconditions:** Dev server running, cipher transition enabled
**Mapped Tasks:** Task 2, Task 3

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Load homepage in English | All text renders with full opacity, no animation artifacts |
| 2 | Switch language to Hebrew | Text scrambles with cipher chars, lines resolve with teal glow from top to bottom |
| 3 | Wait for animation to complete | All text fully resolved in Hebrew, uniform opacity, no foreign chars |
| 4 | Switch back to English | Animation plays again, all lines resolve cleanly |

### TS-002: Rapid language switching
**Priority:** High
**Preconditions:** Dev server running
**Mapped Tasks:** Task 2

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Switch to Russian | Animation starts |
| 2 | Immediately switch to Hebrew | Previous animation interrupted cleanly, new animation starts |
| 3 | Immediately switch to English | All text resolves to English, no artifacts from Russian or Hebrew |

## Progress Tracking

- [x] Task 1: Extract shared pretext utilities
- [x] Task 2: Rewrite useCipherTransition with pretext line-aware animation
- [x] Task 3: Update CipherText component rendering
- [x] Task 4: Update CSS for per-line glow
- [x] Task 5: Update tests
- [x] Task 6: Update usePretextHeight to use shared utilities

**Total Tasks:** 6 | **Completed:** 6 | **Remaining:** 0

## Implementation Tasks

### Task 1: Extract shared pretext utilities

**Objective:** Extract `getFont()`, `getLineHeight()`, and `getWidth()` from `usePretextHeight.ts` into a shared utility module that both the height hook and the new animation hook can use.
**Dependencies:** None
**Mapped Scenarios:** None (infrastructure)

**Files:**

- Create: `src/lib/pretext-utils.ts`
- Modify: `src/hooks/usePretextHeight.ts` — import from new shared module
- Test: `__tests__/hooks/usePretextHeight.test.ts` — verify no regression

**Key Decisions / Notes:**

- Extract `getFont()`, `getLineHeight()`, `getWidth()`, and the fallback constants (`FALLBACK_FONT`, `FALLBACK_LINE_HEIGHT`).
- Keep the module pure (no React hooks, no side effects).
- **Character widths:** Do NOT use canvas `measureText` for per-char widths — it won't match pretext's corrected measurements (emoji, CJK, ligatures). Instead, derive grapheme widths from the `prepareWithSegments` result. Store widths as a nested array per line (matching the line-structured data model) so rendering uses `lineCharWidths[lineIdx][charIdx]` directly.

**Definition of Done:**

- [ ] `src/lib/pretext-utils.ts` exports `getFont`, `getLineHeight`, `getWidth`
- [ ] `usePretextHeight.ts` imports from shared module
- [ ] All existing usePretextHeight tests pass
- [ ] No diagnostics errors

**Verify:**

- `pnpm test -- __tests__/hooks/usePretextHeight.test.ts`

---

### Task 2: Rewrite useCipherTransition with pretext line-aware animation

**Objective:** Replace the dual animation loops with a single pretext-powered loop that splits text into lines using `prepareWithSegments()` + `layoutWithLines()`, animates characters per-line, and tracks per-line resolve status for the glow effect.
**Dependencies:** Task 1 (shared utils)
**Mapped Scenarios:** TS-001, TS-002

**Files:**

- Modify: `src/hooks/useCipherTransition.ts`
- Test: `__tests__/hooks/useCipherTransition.test.ts`

**Key Decisions / Notes:**

- **Keep the shared RAF scheduler** (`registerTick`/`unregisterTick`/`schedulerLoop`) — it's well-designed and handles batching across all CipherText instances.
- **New hook signature:** `useCipherTransition(text, options)` returns `{ lines: CipherLine[], isAnimating: boolean }` where `CipherLine = { text: string, chars: string[], lineResolved: boolean }`. The `displayChars` flat array is replaced with structured line data.
- **New options:** Add `font: string`, `maxWidth: number`, `lineHeight: number` to options so the hook can call pretext. These come from the component measuring the DOM element.
- **Animation flow:**
  1. On text change: `prepareWithSegments(text, font)` → `layoutWithLines(prepared, maxWidth, lineHeight)` → get `LayoutLine[]`
  2. For each line, compute resolve times using `calculateResolveTimes(lineCharCount, profile)` with a per-line stagger offset
  3. Each tick: generate frame chars per line, track `lineResolved` boolean per line
  4. When all lines resolved → `isAnimating = false`
- **Fallback:** If `maxWidth` or `font` is not yet available (SSR, first render before DOM measurement), fall back to treating the entire text as a single line.
- **Remove:** `useCipherAnimationLoop`, `useCipherRefAnimationLoop`, `CHAR_THRESHOLD_DESKTOP`, `CHAR_THRESHOLD_MOBILE`, `getCharThreshold()`, the `elementRef` option.
- **Cleanup:** On interruption, reset `lines` to final text split into pretext lines (each fully resolved).

**Definition of Done:**

- [ ] Single animation path for all text lengths
- [ ] Returns `{ lines, isAnimating }` with per-line resolve tracking
- [ ] Shared RAF scheduler preserved
- [ ] Cleanup resets to target text
- [ ] Reduced motion handling preserved
- [ ] Viewport gating preserved (via `isVisible` option)
- [ ] Tests updated for new return shape

**Verify:**

- `pnpm test -- __tests__/hooks/useCipherTransition.test.ts`

---

### Task 3: Update CipherText component rendering

**Objective:** Update CipherText to consume the new line-based hook output, render per-line with pretext-measured character widths (replacing the hidden layout span), and apply per-line glow class when a line resolves.
**Dependencies:** Task 2 (new hook), Task 1 (shared utils for `measureCharWidths`)
**Mapped Scenarios:** TS-001

**Files:**

- Modify: `src/components/CipherText.tsx`
- Test: `__tests__/components/CipherText.test.tsx`

**Key Decisions / Notes:**

- **Remove:** `isLongText` check, `longTextRef`, `CHAR_THRESHOLD_*`, the ref-based rendering path, the `cipher-char-layout` hidden span.
- **New rendering structure:**
  ```tsx
  <span aria-hidden="true">
    {lines.map((line, lineIdx) => (
      <span key={lineIdx} className={`cipher-line${line.lineResolved ? ' cipher-line-resolved' : ''}`}>
        {line.chars.map((char, charIdx) => {
          const targetChar = line.targetChars[charIdx] ?? '';
          return (
            <span
              key={charIdx}
              className="cipher-char-slot"
              style={{ display: 'inline-block', width: `${line.charWidths[charIdx]}px` }}
            >
              <span className={`cipher-char${char === targetChar ? ' cipher-resolved' : ''}`}>
                {char || targetChar}
              </span>
            </span>
          );
        })}
      </span>
    ))}
  </span>
  ```
- **Character widths:** Derived from pretext's own measurement data (per-grapheme widths from `prepareWithSegments` result), stored as a nested array per line (`line.charWidths[charIdx]`). This replaces the `cipher-char-layout` hidden span overlay and guarantees measurement consistency with pretext's line breaking.
- **DOM measurement:** The component needs to measure its own width, font, and lineHeight to pass to the hook. Use a `useLayoutEffect` with a ref to measure on mount and on resize (via ResizeObserver).
- **sr-only text:** Keep the `<span className="sr-only">{text}</span>` for accessibility.
- **block prop:** Keep the `usePretextHeight` integration for height reservation.

**Definition of Done:**

- [ ] Renders per-line with `cipher-line` / `cipher-line-resolved` classes
- [ ] Character widths set via pretext measurement (no hidden layout span)
- [ ] No `cipher-char-layout` class in use
- [ ] sr-only accessibility text preserved
- [ ] Block prop height reservation preserved
- [ ] Viewport gating preserved
- [ ] ResizeObserver is disconnected in the useLayoutEffect cleanup function
- [ ] All CipherText tests updated and passing

**Verify:**

- `pnpm test -- __tests__/components/CipherText.test.tsx`

---

### Task 4: Update CSS for per-line glow

**Objective:** Add `.cipher-line-resolved` class with per-line teal glow animation. Update existing cipher CSS to work with the new structure.
**Dependencies:** Task 3 (new rendering structure)
**Mapped Scenarios:** TS-001

**Files:**

- Modify: `src/app/globals.css`

**Key Decisions / Notes:**

- Add `.cipher-line` class (base style for a line during animation).
- Add `.cipher-line-resolved` class — applies teal glow that fades out (reuse `cipher-glow-fade` keyframe or create a line-level variant).
- Keep `.cipher-char` (opacity: 0.35 during scramble, opacity: 1 when resolved) for per-character behavior within lines.
- **Remove:** `.cipher-text-scramble` (opacity: 0.5 for the old ref-based path), `.cipher-char-layout` (hidden layout span).
- **Per-line glow effect:** When `.cipher-line-resolved` is applied, the entire line gets `color: #5eead4; text-shadow: 0 0 8px rgba(94, 234, 212, 0.6)` that fades to `inherit` over 600ms.
- Keep reduced motion overrides: `.cipher-line-resolved` should also be suppressed with `prefers-reduced-motion: reduce`.

**Definition of Done:**

- [ ] `.cipher-line-resolved` class with teal glow animation
- [ ] `.cipher-text-scramble` and `.cipher-char-layout` removed
- [ ] Reduced motion overrides updated
- [ ] Mobile overrides updated
- [ ] Visually verified in browser: line resolves with teal glow that fades over ~600ms
- [ ] With prefers-reduced-motion: reduce, no glow animation fires

**Verify:**

- `pnpm run build` (CSS compiles)
- Visual verification during TS-001 E2E

---

### Task 5: Update tests

**Objective:** Update all cipher-related tests for the new line-based API and rendering structure.
**Dependencies:** Tasks 1-4
**Mapped Scenarios:** All

**Files:**

- Modify: `__tests__/hooks/useCipherTransition.test.ts`
- Modify: `__tests__/components/CipherText.test.tsx`
- Modify: `__tests__/components/cipher-integration.test.tsx`

**Key Decisions / Notes:**

- `useCipherTransition` tests: Update to expect `{ lines, isAnimating }` return shape instead of `{ displayChars, isAnimating }`.
- `CipherText` tests: Update mock of `useCipherTransition` to return line-structured data. Update assertions for `cipher-line` / `cipher-line-resolved` classes. Remove assertions for `cipher-char-layout`.
- cipher-integration tests: Verify language switching still works with new animation.
- Ensure all tests that mock `useCipherTransition` are updated to match new signature.

**Definition of Done:**

- [ ] All cipher-related tests pass
- [ ] No references to `displayChars` in tests (replaced with `lines`)
- [ ] No references to `cipher-char-layout` in tests
- [ ] Full test suite passes: `pnpm test`

**Verify:**

- `pnpm test`

---

### Task 6: Merge usePretextHeight with shared pretext data

**Objective:** Refactor `usePretextHeight` to accept an optional `PreparedTextWithSegments` from `useCipherTransition` to avoid double measurement. Import shared helpers from `pretext-utils.ts`.
**Dependencies:** Task 1, Task 2
**Mapped Scenarios:** None

**Files:**

- Modify: `src/hooks/usePretextHeight.ts`
- Modify: `src/components/CipherText.tsx` — wire shared prepared result between hooks
- Test: `__tests__/hooks/usePretextHeight.test.ts` — verify no regression

**Key Decisions / Notes:**

- Remove local definitions of `getFont`, `getLineHeight`, `getWidth`, `FALLBACK_FONT`, `FALLBACK_LINE_HEIGHT` — import from `@/lib/pretext-utils`.
- Add optional `prepared` parameter to `usePretextHeight`. When provided, call `layout(prepared, width, lineHeight)` on it directly (using the layout function that works with `PreparedTextWithSegments` since it's a superset of `PreparedText`). When not provided, fall back to calling `prepare()` internally (backward compat).
- In `CipherText`, `useCipherTransition` produces the `prepareWithSegments` result. Pass it to `usePretextHeight` to eliminate the second measurement pass.
- With 30+ CipherText instances, this halves the pretext measurement calls on every language switch.

**Definition of Done:**

- [ ] No local font/measurement helpers in usePretextHeight
- [ ] Imports from `@/lib/pretext-utils`
- [ ] Accepts optional `prepared` param to skip internal `prepare()` call
- [ ] CipherText wires shared pretext result between hooks
- [ ] All usePretextHeight tests pass

**Verify:**

- `pnpm test -- __tests__/hooks/usePretextHeight.test.ts`

## Open Questions

1. Should `prepareWithSegments` results be cached across renders to avoid re-computation when only width changes (e.g., resize)? — The hook can memoize the prepared result per text+font pair and only re-run `layoutWithLines` on width changes.
