# Pretext Translation & Animation Implementation Plan

Created: 2026-04-02
Author: yegamble@gmail.com
Status: VERIFIED
Approved: Yes
Iterations: 0
Worktree: No
Type: Feature

## Summary

**Goal:** Re-enable bilingual translation (EN/HE) and cipher animation, using `@chenglou/pretext` to pre-compute target text heights and prevent layout jumps during language transitions.

**Architecture:** Layer pretext height reservation on top of the existing cipher scramble animation. A new `usePretextHeight` hook computes target text height via pretext's `prepare()` + `layout()` (pure arithmetic, no DOM reflow). CipherText gains an optional `block` prop that activates height reservation for multi-line text blocks. Feature flags remain but flip to `true`.

**Tech Stack:** `@chenglou/pretext` for text measurement, existing `useCipherTransition` for cipher animation, Inter font (already present) + Heebo for Hebrew subset support.

## Scope

### In Scope

- Enable `NEXT_PUBLIC_HEBREW_ENABLED=true` and `NEXT_PUBLIC_CIPHER_TRANSITION=true` in `.env`
- Install `@chenglou/pretext`
- Add Hebrew font support (Heebo via next/font/google — Inter lacks a Hebrew subset)
- Create `usePretextHeight` hook for DOM-free height pre-computation
- Add `block` prop to CipherText for height-reserved rendering
- Apply `block` prop to multi-line text instances (paragraphs, descriptions, tagline)
- Unit tests for the new hook and updated CipherText
- E2E verification of language switching + animation

### Out of Scope

- Removing env var feature flags (user chose to keep them)
- Replacing the cipher scramble animation (keeping it, layering pretext on top)
- New languages beyond EN/HE
- Pretext for inline text fragments (e.g., fragments inside a mixed paragraph with links)

## Approach

**Chosen:** Layer pretext height reservation via a wrapper hook + `block` prop on CipherText

**Why:** Preserves the existing cipher animation effect (which works well visually) while solving the height-jump problem. Pretext's `prepare()` + `layout()` computes height via pure arithmetic after a one-time canvas measurement — no DOM reflow triggered. The `block` prop makes height reservation opt-in, so inline fragments (nav items, link text) are unaffected.

**Alternatives considered:**
1. **Replace cipher with pretext entirely** — Would lose the distinctive cipher scramble visual. Rejected per user preference.
2. **Context provider** — Centralized PretextProvider pre-measuring all translation keys. More complex with questionable benefit; each component already knows its own text. Rejected for over-engineering.
3. **Automatic detection** — Detect block vs inline context automatically. Too fragile (depends on computed styles, parent element types). Explicit `block` prop is simpler and clearer.

## Context for Implementer

> Write for an implementer who has never seen the codebase.

- **Patterns to follow:**
  - Hooks live in `src/hooks/` — see `src/hooks/useCipherTransition.ts:68-182` for the existing animation hook pattern
  - Components in `src/components/` with one component per file, default exports
  - Tests in `__tests__/` mirroring source structure
  - All components using `useTranslation()` are client components (`'use client'`)

- **Conventions:**
  - Tailwind for styling, design tokens from `src/app/globals.css`
  - Path aliases: `@/*` maps to project root
  - Package manager: npm (see `package-lock.json`)

- **Key files:**
  - `src/components/CipherText.tsx` — The main component to modify. Currently renders inline, wraps `useCipherTransition`.
  - `src/hooks/useCipherTransition.ts` — Cipher scramble animation hook. Uses rAF loop with staggered resolve times. Animation duration is approximately `BASE_DELAY(400) + SPREAD_DURATION(1200) + JITTER(100) = ~1700ms`.
  - `src/lib/cipher-chars.ts` — Character pool utility for the scramble effect.
  - `src/app/layout.tsx` — Root layout with Inter font config. Font is `Inter` with `subsets: ['latin', 'latin-ext']`.
  - `src/components/I18nProvider.tsx` — Wraps app in `I18nextProvider`, updates `lang`/`dir` on language change.
  - `src/components/LanguageToggle.tsx` — Gated by `NEXT_PUBLIC_HEBREW_ENABLED` env var.
  - `.env` — Currently has both feature flags set to `false`.

- **Gotchas:**
  - **Inter has no Hebrew subset.** Google Fonts Inter supports: cyrillic, cyrillic-ext, greek, greek-ext, latin, latin-ext, vietnamese. For Hebrew text, we must add a separate font (Heebo recommended — same geometric sans-serif style).
  - **Pretext needs canvas.** `prepare()` uses canvas for measurement. On SSR (Next.js server render), canvas is unavailable. The hook must guard against SSR — skip height reservation on server, apply on client only.
  - **CipherText is inline.** Currently renders `<>text</>` or `<><span sr-only/><span aria-hidden/></>`. Adding a wrapper `<span>` with `display: inline-block` changes flow behavior. For `block` mode, set `width: 100%` so it fills the parent. For non-block mode, no wrapper changes needed.
  - **Animation timing.** The cipher animation runs ~1700ms. Height transition should match — use CSS `transition: min-height 500ms ease-out` so height settles before animation ends.
  - **Font string for pretext.** `prepare(text, font)` needs a CSS font shorthand (e.g., `"400 16px Inter, Heebo, sans-serif"`). Read from `getComputedStyle(element).font` to get the actual computed font.
  - **Line height.** `layout(prepared, width, lineHeight)` needs numeric line-height. The body uses Tailwind's `leading-relaxed` (1.625). Compute from `getComputedStyle`.

- **Domain context:** This is a personal portfolio site. Language toggle switches between English (LTR) and Hebrew (RTL). The cipher animation scrambles characters through various Unicode scripts before resolving to the target text — a distinctive visual effect.

## Runtime Environment

- **Start command:** `npm run dev` (Turbopack)
- **Port:** 3000
- **Health check:** `curl http://localhost:3000`

## Assumptions

- `@chenglou/pretext` works in a Next.js client component context (canvas available in browser) — supported by pretext being a browser-targeted library. Tasks 2, 3 depend on this.
- Heebo is available on Google Fonts and compatible with `next/font/google` — supported by Google Fonts listing. Task 1 depends on this.
- The `prepare()` + `layout()` computation is fast enough to run synchronously on language change without noticeable delay — supported by pretext benchmarks (~19ms for 500 texts). Tasks 2, 3 depend on this.
- Setting `display: inline-block; width: 100%` on CipherText's block wrapper doesn't break parent layouts — need to verify during implementation. Task 3 depends on this.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Pretext `prepare()` fails on SSR | Medium | High | Guard with `typeof window !== 'undefined'` check; return undefined height on server (no reservation) |
| `display: inline-block` wrapper breaks layout in some contexts | Low | Medium | Only apply to `block` instances; test each component visually. Fallback: use `<div>` wrapper for block instances instead of `<span>` |
| Computed font string from DOM doesn't match actual rendered font (Heebo not loaded yet) | Low | Medium | Use `document.fonts.ready` promise before first measurement; or accept slight initial mismatch |
| Hebrew text height measurement inaccurate with fallback font before Heebo loads | Low | Low | Heebo uses `display: 'swap'` — measurement happens after font load in most cases. On first paint, accept system font measurement as close enough. |

## Goal Verification

### Truths

1. Language toggle button is visible and functional — clicking switches between EN and HE
2. Cipher scramble animation plays on language switch (characters cycle through scripts before resolving)
3. Multi-line text blocks (About paragraphs, job descriptions, project descriptions, hero tagline) do NOT jump in height during language transition — height transitions smoothly
4. Hebrew text renders in Heebo font, English in Inter
5. RTL layout activates when Hebrew is selected (`dir="rtl"`)
6. All unit tests pass with ≥80% coverage
7. TS-001 and TS-002 pass end-to-end

### Artifacts

- `src/hooks/usePretextHeight.ts` — new hook
- `src/components/CipherText.tsx` — modified with block prop
- `src/app/layout.tsx` — Heebo font added
- `.env` — flags set to true
- `__tests__/hooks/usePretextHeight.test.ts` — new tests
- `__tests__/components/CipherText.test.tsx` — updated tests

## E2E Test Scenarios

### TS-001: Language Toggle with Smooth Height Transition
**Priority:** Critical
**Preconditions:** Dev server running, English default language
**Mapped Tasks:** Task 1, Task 2, Task 3, Task 4, Task 5

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to http://localhost:3000 | Page loads in English, language toggle button (עב) is visible in header |
| 2 | Scroll to About section | About section visible with English paragraphs |
| 3 | Note the current height of the About section | Baseline height recorded |
| 4 | Click language toggle button | Cipher animation starts — characters scramble through various scripts |
| 5 | Observe About section during animation | Section height does NOT jump or flicker — transitions smoothly |
| 6 | Wait for animation to complete (~2s) | Hebrew text fully resolved, layout stable, page direction is RTL |
| 7 | Click language toggle again | Cipher animation plays, transitions back to English smoothly |

### TS-002: Hebrew Font and RTL Layout
**Priority:** High
**Preconditions:** Dev server running
**Mapped Tasks:** Task 1, Task 5

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to http://localhost:3000 | Page loads in English with Inter font |
| 2 | Click language toggle | Page switches to Hebrew |
| 3 | Inspect Hebrew text font | Hebrew text renders in Heebo font (not system fallback) |
| 4 | Check page direction | `html` element has `dir="rtl"` and `lang="he"` |
| 5 | Verify nav links are right-aligned | Navigation layout mirrors for RTL |

### TS-003: Reduced Motion Preference
**Priority:** Medium
**Preconditions:** System preference set to reduce motion
**Mapped Tasks:** Task 3

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Set prefers-reduced-motion: reduce in browser | Motion preference active |
| 2 | Navigate to http://localhost:3000 | Page loads normally |
| 3 | Click language toggle | Text switches instantly (no cipher animation), no height jump |

## Progress Tracking

- [x] Task 1: Install pretext + Hebrew font setup
- [x] Task 2: Create usePretextHeight hook
- [x] Task 3: Integrate pretext into CipherText with block prop
- [x] Task 4: Apply block prop to multi-line content across components
- [x] Task 5: Enable feature flags
      **Total Tasks:** 5 | **Completed:** 5 | **Remaining:** 0

## Implementation Tasks

### Task 1: Install pretext + Hebrew font setup

**Objective:** Install `@chenglou/pretext` and add Heebo as a Hebrew companion font alongside Inter.
**Dependencies:** None
**Mapped Scenarios:** TS-002

**Files:**

- Modify: `package.json` (add @chenglou/pretext dependency)
- Modify: `src/app/layout.tsx` (add Heebo font, include Hebrew subset)
- Modify: `__tests__/app/layout.test.tsx` (update if font assertions exist)

**Key Decisions / Notes:**

- Use `npm install @chenglou/pretext` to add the dependency
- **After install, verify the actual API:** `cat node_modules/@chenglou/pretext/dist/index.d.ts` — confirm exact function names, parameter types, and return types for `prepare` and `layout`. Update Task 2 implementation if they differ from plan assumptions.
- Import Heebo from `next/font/google` alongside Inter: `import { Inter, Heebo } from 'next/font/google'`
- Configure Heebo: `subsets: ['hebrew', 'latin']`, `display: 'swap'`, `variable: '--font-heebo'`
- Update body className to include both font variables: `font-[family-name:var(--font-inter),var(--font-heebo)]`
- This ensures Hebrew characters use Heebo while Latin characters continue using Inter

**Definition of Done:**

- [ ] `@chenglou/pretext` is in `package.json` dependencies
- [ ] Heebo font loads via next/font/google with Hebrew subset
- [ ] Body element uses both Inter and Heebo font families
- [ ] `npm run build` succeeds
- [ ] No diagnostics errors

**Verify:**

- `npm run build`
- `npm run typecheck`

---

### Task 2: Create usePretextHeight hook

**Objective:** Create a hook that uses pretext's `prepare()` + `layout()` to compute target text height without DOM reflow, returning a ref and style object for height reservation.
**Dependencies:** Task 1
**Mapped Scenarios:** TS-001

**Files:**

- Create: `src/hooks/usePretextHeight.ts`
- Create: `__tests__/hooks/usePretextHeight.test.ts`

**Key Decisions / Notes:**

- Hook signature: `usePretextHeight(text: string, isEnabled: boolean): { ref: RefObject<HTMLSpanElement>, style: CSSProperties }`
- **`isEnabled` should be `true` when language switching is active** (`NEXT_PUBLIC_HEBREW_ENABLED === 'true'`), NOT when cipher animation is on. Height reservation prevents jumps regardless of whether cipher animation is active — a plain language switch without animation also changes text height.
- On text change (language switch):
  1. Read `ref.current.offsetHeight` for current content height (one DOM read)
  2. Read `getComputedStyle(ref.current).font` and `.lineHeight` for font parameters
  3. Read `ref.current.parentElement.clientWidth` (or `ref.current.clientWidth`) for container width
  4. Call `prepare(text, font)` then `layout(prepared, width, lineHeight)` — pure arithmetic, no DOM reflow
  5. Set `minHeight` to `max(currentHeight, targetHeight)` immediately (prevents shrink during animation)
  6. After animation duration (~1700ms), transition `minHeight` to `targetHeight` only
- SSR guard: if `typeof window === 'undefined'`, return empty style (no height reservation)
- Return style includes: `{ display: 'inline-block', width: '100%', minHeight: 'Xpx', transition: 'min-height 500ms ease-out' }`
- **Font string fallback:** If `getComputedStyle().font` returns empty or contains `var(`, construct the font string explicitly as `'400 16px Inter, Heebo, sans-serif'` using known constants. CSS variable references may not resolve in computed style in all browsers.
- Memoize the `prepare()` result — only re-run when text changes (it's the expensive part)
- **Graceful null-ref handling:** When ref is attached but element has zero width (e.g., hidden element), return empty style rather than throwing
- For unit tests: mock pretext's `prepare` and `layout` functions; mock DOM measurements via ref. **Include test case:** "should return valid style when ref is attached but text has not changed" — verifying graceful fallback with null/zero clientWidth

**Definition of Done:**

- [ ] Hook correctly computes height using pretext prepare + layout
- [ ] Returns ref and style with minHeight during transitions
- [ ] SSR-safe (no errors on server render)
- [ ] Unit tests pass with mocked pretext + DOM
- [ ] No diagnostics errors

**Verify:**

- `npm run test -- __tests__/hooks/usePretextHeight.test.ts`

---

### Task 3: Integrate pretext into CipherText with block prop

**Objective:** Add optional `block` prop to CipherText. When `block={true}`, wrap content with a height-reserved span using `usePretextHeight`. When false (default), render as before.
**Dependencies:** Task 2
**Mapped Scenarios:** TS-001, TS-003

**Files:**

- Modify: `src/components/CipherText.tsx`
- Modify: `__tests__/components/CipherText.test.tsx`

**Key Decisions / Notes:**

- Add `block?: boolean` to `CipherTextProps` interface (default `false`)
- When `block={true}`:
  - Call `usePretextHeight(text, isEnabled)` where `isEnabled` = language switching is on (`NEXT_PUBLIC_HEBREW_ENABLED === 'true'`)
  - **ALWAYS render the wrapper span** (with the ref) — even in the non-animating state. This is critical: CipherText has an early return at line 25-27 (`if (!isAnimating) return <>{text}</>`) that bypasses any wrapper. When `block={true}`, replace that early return with `<span ref={ref} style={style}>{text}</span>` so the ref stays attached for height measurement on the next language switch.
  - The wrapper span gets `display: inline-block; width: 100%` to fill parent width
- When `block={false}`:
  - Render exactly as before (no wrapper, no height hook)
  - The early return path remains unchanged: `if (!isAnimating) return <>{text}</>;`
- The cipher scramble animation (`useCipherTransition`) continues unchanged — pretext only handles height
- Reduced motion: when motion is reduced, `useCipherTransition` skips animation. `usePretextHeight` can also skip (no animation = no height jump to prevent)
- See existing CipherText at `src/components/CipherText.tsx:20-52` for current render logic

**Definition of Done:**

- [ ] CipherText accepts `block` prop
- [ ] `block={true}` renders with height-reserved wrapper
- [ ] `block={false}` (default) renders identically to current behavior
- [ ] Updated unit tests cover both block and non-block modes
- [ ] No diagnostics errors

**Verify:**

- `npm run test -- __tests__/components/CipherText.test.tsx`

---

### Task 4: Apply block prop to multi-line content across components

**Objective:** Add `block` prop to CipherText instances that render multi-line text (paragraphs, descriptions, tagline) across all section components.
**Dependencies:** Task 3
**Mapped Scenarios:** TS-001

**Files:**

- Modify: `src/components/ScrollHeader.tsx` (hero tagline)
- Modify: `src/components/About.tsx` (paragraphs p1, p3)
- Modify: `src/components/Experience.tsx` (job descriptions)
- Modify: `src/components/Projects.tsx` (project descriptions)
- Modify: `__tests__/components/ScrollHeader.test.tsx`
- Modify: `__tests__/components/About.test.tsx`
- Modify: `__tests__/components/Experience.test.tsx`
- Modify: `__tests__/components/Projects.test.tsx`

**Key Decisions / Notes:**

- **Add `block` to these CipherText instances:**
  - `ScrollHeader.tsx:100` — `<CipherText block>{t('hero.tagline')}</CipherText>` (multi-line heading)
  - `About.tsx:22` — `<CipherText block>{t('about.p1')}</CipherText>` (long paragraph)
  - `About.tsx:37` — `<CipherText block>{t('about.p3')}</CipherText>` (long paragraph)
  - `Experience.tsx:73` — `<CipherText block>{job.description}</CipherText>` (job descriptions)
  - `Projects.tsx:74` — `<CipherText block>{project.description}</CipherText>` (project descriptions)
- **Do NOT add `block` to these (inline or single-line):**
  - Nav links, hero name/title, section headings, dates, footer fragments, link text
  - `About.tsx:25,32,34` — p2 fragments (inline with link, mixed content)
- Tests: existing tests may need minor updates if they query CipherText output structure (the wrapper span is new for block instances)

**Definition of Done:**

- [ ] All multi-line CipherText instances have `block` prop
- [ ] Inline/single-line instances remain unchanged
- [ ] All component unit tests pass
- [ ] No diagnostics errors

**Verify:**

- `npm run test`

---

### Task 5: Enable feature flags

**Objective:** Flip both feature flags to `true` in `.env` to enable translation toggle and cipher animation.
**Dependencies:** Task 4
**Mapped Scenarios:** TS-001, TS-002

**Files:**

- Modify: `.env` (flip both flags to true)

**Key Decisions / Notes:**

- Change `NEXT_PUBLIC_CIPHER_TRANSITION=false` → `NEXT_PUBLIC_CIPHER_TRANSITION=true`
- Change `NEXT_PUBLIC_HEBREW_ENABLED=false` → `NEXT_PUBLIC_HEBREW_ENABLED=true`
- `.env.example` already has both set to `true` — no change needed there
- Test setup at `__tests__/setup.ts` already sets `NEXT_PUBLIC_HEBREW_ENABLED = 'true'` — no change needed

**Definition of Done:**

- [ ] `.env` has `NEXT_PUBLIC_CIPHER_TRANSITION=true`
- [ ] `.env` has `NEXT_PUBLIC_HEBREW_ENABLED=true`
- [ ] Full test suite passes
- [ ] Dev server shows language toggle button
- [ ] Clicking toggle triggers cipher animation with smooth height transitions

**Verify:**

- `npm run test`
- `npm run build`

## E2E Results

| Scenario | Priority | Result | Fix Attempts | Notes |
|----------|----------|--------|--------------|-------|
| TS-001   | Critical | PASS   | 0            | Language toggle works, cipher animation plays, content switches EN↔HE, block wrapper spans present |
| TS-002   | High     | PASS   | 0            | dir="rtl" lang="he" confirmed, Heebo font loaded via next/font/google |
| TS-003   | Medium   | NOT_TESTED | 0        | Requires OS-level reduced motion setting; code path covered by unit tests |

## Open Questions

- **Heebo font weight matching:** Inter is used at weights 400 (body), 500 (medium), 600 (semibold), 700 (bold). Heebo supports the same weights. Should we load all matching weights or just variable weight? Recommend: variable weight (default for next/font/google).

## Deferred Ideas

- **Pretext for inline fragments:** The mixed-content paragraph in About (p2 with embedded link) doesn't get height reservation. Could add a `PretextParagraph` wrapper component in the future if height jumps are noticeable there.
- **Pretext caching across components:** Currently each CipherText with `block` runs its own `prepare()`. Could share a cache if performance becomes a concern (unlikely — pretext is fast).
- **Three or more languages:** Adding a third language would require updating `LanguageToggle` to cycle through options and adding another translation JSON. No structural changes needed.
