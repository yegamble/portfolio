# Cipher Transition Effect Implementation Plan

Created: 2026-02-15
Status: COMPLETE
Approved: Yes
Iterations: 0
Worktree: Yes

> **Status Lifecycle:** PENDING → COMPLETE → VERIFIED
> **Iterations:** Tracks implement→verify cycles (incremented by verify phase)
>
> - PENDING: Initial state, awaiting implementation
> - COMPLETE: All tasks implemented
> - VERIFIED: All checks passed
>
> **Approval Gate:** Implementation CANNOT proceed until `Approved: Yes`
> **Worktree:** Set at plan creation (from dispatcher). `Yes` uses git worktree isolation; `No` works directly on current branch

## Summary

**Goal:** When the language toggle is clicked, every translated character on the page undergoes a "cipher decryption" animation — each character independently cycles through random characters from 10+ world scripts (Cyrillic, Katakana, CJK, Arabic, Hebrew, Devanagari, Latin, binary digits, etc.) before resolving to its final translated character. Characters resolve in a staggered wave, creating a spy/cipher decryption aesthetic. The effect is reusable for any target language and controlled via an environment variable.

**Architecture:** Custom React hook (`useCipherTransition`) + wrapper component (`CipherText`) that detects text prop changes (triggered by i18n language switch) and animates per-character using `requestAnimationFrame`. No external animation libraries — pure React + rAF for full control over Unicode character sets and timing. Follows the established pattern from [Craft of UI](https://craftofui.substack.com/p/muddling-your-words) and [React text scramble](https://medium.com/@mike-at-redspace/crafting-how-to-craft-a-captivating-scramble-effect-in-react-e043feb8b360) best practices.

**Tech Stack:** React 19 hooks, `requestAnimationFrame`, CSS transitions, `NEXT_PUBLIC_CIPHER_TRANSITION` env var

## Scope

### In Scope

- Cipher character sets utility with 10+ Unicode script pools
- `useCipherTransition` hook with rAF-based per-character animation
- `CipherText` wrapper component for translated text
- Integration into all page components (ScrollHeader, About, Experience, Projects, Footer, SectionHeader)
- Environment variable toggle (`NEXT_PUBLIC_CIPHER_TRANSITION`)
- `prefers-reduced-motion` accessibility support
- Screen reader accessibility (hidden scramble, visible real text via `sr-only`)
- CSS glow effect on character resolution for spy aesthetic
- Crossfade for `<Trans>` rich-text sections (About p2)
- Unit tests for all new code

### Out of Scope

- External animation library dependencies (GSAP, Framer Motion)
- Sound effects
- E2E Cypress tests for animation (visual animations are difficult to test in headless E2E)
- Animation on initial page load (only on language switch)
- New language translations (existing EN/HE only)

## Prerequisites

- None — all dependencies already exist in the project

## Context for Implementer

> This section is critical for cross-session continuity. Write it for an implementer who has never seen the codebase.

- **Patterns to follow:**
  - Components use `'use client'` directive and `useTranslation()` from `react-i18next` (see `src/components/About.tsx:1-8`)
  - i18n is configured in `src/lib/i18n.ts` with bundled JSON imports
  - `I18nProvider` wraps the app in `src/app/layout.tsx:46`, handling `lang`/`dir` attribute updates
  - `LanguageToggle` calls `i18n.changeLanguage()` directly in `src/components/LanguageToggle.tsx:9-10`
  - SectionHeader is a **server component** (no `'use client'`) that accepts `title: string` — needs to change to `ReactNode`
  - Test pattern: `__tests__/components/<Name>.test.tsx` with vitest + testing-library

- **Conventions:**
  - One component per file with default export
  - Design tokens in `src/app/globals.css` using Tailwind `@theme` (primary color: `#5eead4`)
  - RTL support via logical properties (`ps-`, `ms-`, `rtl:` prefixes)
  - Path alias: `@/*` maps to project root

- **Key files the implementer must read:**
  - `src/components/LanguageToggle.tsx` — the trigger point for language switch
  - `src/components/I18nProvider.tsx` — wraps app, handles lang/dir changes
  - `src/components/About.tsx` — uses `<Trans>` component (rich text, special handling)
  - `src/components/ScrollHeader.tsx` — hero section with large text, uses `t()` extensively
  - `src/components/SectionHeader.tsx` — server component, `title` prop type change needed
  - `src/app/globals.css` — design tokens and CSS additions

- **Gotchas:**
  - `SectionHeader` is a server component — passing `<CipherText>` as a prop works because server components can render client component children/props
  - `About.tsx` uses `<Trans>` for paragraph 2 which embeds a link — can't easily split into per-character spans, use CSS crossfade instead
  - `Experience.tsx` renders arrays of translated objects (`t('experience.jobs', { returnObjects: true })`) — need to wrap each text field individually
  - Spaces, numbers, and punctuation should NOT be scrambled — only alphabetic/script characters
  - `aria-label` attributes must NOT be wrapped in CipherText (screen reader only)
  - When the user clicks toggle rapidly, cancel any in-progress animation and restart

- **Domain context:** The portfolio is bilingual EN/HE with RTL support. When toggling language, i18next's `changeLanguage()` triggers React re-renders in all components using `useTranslation()`. This means all `CipherText` components will detect their text change simultaneously — perfect for a coordinated page-wide animation.

## Runtime Environment

- **Start command:** `npm run dev` (Turbopack)
- **Port:** 3000
- **Health check:** `curl http://localhost:3000`

## Progress Tracking

**MANDATORY: Update this checklist as tasks complete. Change `[ ]` to `[x]`.**

- [x] Task 1: Cipher character sets utility
- [x] Task 2: CipherText component with animation hook
- [x] Task 3: Integrate CipherText into all page components
- [x] Task 4: Update i18n integration tests and CSS polish

**Total Tasks:** 4 | **Completed:** 4 | **Remaining:** 0

## Implementation Tasks

### Task 1: Cipher Character Sets Utility

**Objective:** Create a utility module with Unicode character pools from 10+ world scripts and a function to select random cipher characters. This is the foundation for the scramble animation.

**Dependencies:** None

**Files:**

- Create: `src/lib/cipher-chars.ts`
- Test: `__tests__/lib/cipher-chars.test.ts`

**Key Decisions / Notes:**

- Define character pools as string arrays, one per script:
  - **Cyrillic:** `АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ` (uppercase)
  - **Katakana:** `アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン`
  - **CJK (Chinese):** `的一是不了人我在有他这中大来上个国到说们为子和你地出会也时要就可以` (common characters)
  - **Arabic:** `ابتثجحخدذرزسشصضطظعغفقكلمنهوي`
  - **Hebrew:** `אבגדהוזחטיכלמנסעפצקרשת`
  - **Devanagari (Sanskrit/Hindi):** `अआइईउऊएऐओऔकखगघचछजझटठडढणतथदधनपफबभमयरलवशषसह`
  - **Latin extended:** `ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝ`
  - **Binary/Numerals:** `01`
  - **Georgian:** `აბგდევზთიკლმნოპჟრსტუფქღყშჩცძწჭხჯჰ`
  - **Greek:** `ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ`
- Export a `getRandomCipherChar()` function that picks a random pool, then a random character from that pool
- Export a `isScramblable(char)` function that returns `true` for alphabetic characters (any script) and `false` for whitespace, digits, punctuation — these characters should not be scrambled
- Use `Array.from()` for proper Unicode handling (multi-byte characters)

**Definition of Done:**

- [ ] All tests pass (unit)
- [ ] No diagnostics errors
- [ ] `getRandomCipherChar()` returns characters from at least 10 different scripts
- [ ] `isScramblable(' ')` returns false; `isScramblable('A')` returns true; `isScramblable('א')` returns true
- [ ] Characters are properly handled as Unicode code points (no surrogate pair issues)

**Verify:**

- `npm run test -- __tests__/lib/cipher-chars.test.ts` — all tests pass
- `npm run typecheck` — no type errors

---

### Task 2: CipherText Component with Animation Hook

**Objective:** Build the `useCipherTransition` hook (rAF-based per-character scramble animation) and `CipherText` wrapper component. This is the core animation system.

**Dependencies:** Task 1

**Files:**

- Create: `src/hooks/useCipherTransition.ts`
- Create: `src/components/CipherText.tsx`
- Test: `__tests__/hooks/useCipherTransition.test.ts`
- Test: `__tests__/components/CipherText.test.tsx`

**Key Decisions / Notes:**

**`useCipherTransition(text: string)` hook:**
- Tracks previous text via `useRef`. On mount, stores text without animating.
- When `text` changes, starts rAF animation from old text → random cipher chars → new text
- Uses `requestAnimationFrame` with throttled updates (~60ms between character changes)
- Each character position has a staggered "resolve time":
  ```
  resolveTime[i] = baseDelay + (i / maxLen) * spreadDuration + random(-jitter, jitter)
  baseDelay = 400ms (all chars scramble for at least 400ms)
  spreadDuration = 1200ms (resolve wave takes ~1.2s)
  jitter = ±100ms (randomness in resolve order)
  ```
- Total animation: ~1.8-2.2 seconds
- Skips scrambling for non-scramblable characters (spaces, punctuation, digits)
- Returns `{ displayChars: string[], isAnimating: boolean }`
- Cancels in-progress animation if text changes again (rapid toggle support)
- Cleans up rAF on component unmount (return cleanup from useEffect to prevent memory leaks)
- Respects `prefers-reduced-motion`: if enabled, returns new text immediately (no animation)
- Checks `NEXT_PUBLIC_CIPHER_TRANSITION` env var: if not `'true'`, returns new text immediately
- Handles texts of different lengths (old text 5 chars, new text 12 chars) — pad shorter with empty, animate from index 0 to max length

**`CipherText` component:**
- Props: `children: string` (the translated text)
- Calls `useCipherTransition(children)` to get display characters
- Renders each character in an `<span>` with `display: inline-block` and `unicode-bidi: plaintext` (prevents bidi algorithm issues when mixing LTR/RTL script characters during animation)
- Screen reader accessibility: renders actual text in `<span className="sr-only">` and animation spans with `aria-hidden="true"`
- When a character resolves to its final form, apply a brief CSS `cipher-resolve` animation (teal glow flash using `--color-primary`)
- When NOT animating (env var off, reduced motion, or animation complete), render plain text without any spans — zero overhead
- Follow the pattern from `src/components/TechTag.tsx` for simple component structure

**CSS (add to `globals.css`):**
```css
@keyframes cipher-resolve {
  0% { color: #5eead4; text-shadow: 0 0 8px rgba(94, 234, 212, 0.6); }
  100% { color: inherit; text-shadow: none; }
}
.cipher-resolved {
  animation: cipher-resolve 400ms ease-out;
}
```

**Definition of Done:**

- [ ] All tests pass (unit)
- [ ] No diagnostics errors
- [ ] Hook animates from old text to new text over ~2 seconds
- [ ] Characters resolve in a staggered wave pattern (not all at once)
- [ ] Spaces and punctuation are not scrambled
- [ ] Animation is skipped when `prefers-reduced-motion` is set
- [ ] Animation is skipped when `NEXT_PUBLIC_CIPHER_TRANSITION` is not `'true'`
- [ ] Rapid text changes cancel previous animation and start fresh
- [ ] Screen readers get actual text, not scrambled characters
- [ ] Resolved characters get brief teal glow effect

**Verify:**

- `npm run test -- __tests__/hooks/useCipherTransition.test.ts __tests__/components/CipherText.test.ts` — all tests pass
- `npm run typecheck` — no type errors

---

### Task 3: Integrate CipherText into All Page Components

**Objective:** Wrap all visible translated text across the site with `<CipherText>` so the cipher effect triggers on language switch. Add CSS crossfade for `<Trans>` rich-text sections.

**Dependencies:** Task 2

**Files:**

- Modify: `src/components/SectionHeader.tsx` — change `title` prop from `string` to `React.ReactNode`
- Modify: `src/components/ScrollHeader.tsx` — wrap `t()` calls in `<CipherText>`
- Modify: `src/components/About.tsx` — wrap `t()` calls, add crossfade class to `<Trans>` wrapper
- Modify: `src/components/Experience.tsx` — wrap translated job fields in `<CipherText>`
- Modify: `src/components/Projects.tsx` — wrap translated project fields in `<CipherText>`
- Modify: `src/components/Footer.tsx` — wrap `t()` calls in `<CipherText>`
- Modify: `src/components/LanguageToggle.tsx` — wrap button text in `<CipherText>`
- Modify: `src/app/globals.css` — add `.cipher-crossfade` transition class
- Update: `__tests__/components/SectionHeader.test.tsx`
- Update: `__tests__/components/ScrollHeader.test.tsx`
- Update: `__tests__/components/About.test.tsx`
- Update: `__tests__/components/Experience.test.tsx`
- Update: `__tests__/components/Projects.test.tsx`
- Update: `__tests__/components/Footer.test.tsx`
- Update: `__tests__/components/LanguageToggle.test.tsx`

**Key Decisions / Notes:**

- **What gets CipherText:** All visible `t()` output that renders as text content
- **What does NOT get CipherText:** `aria-label` attributes (must remain plain strings for screen readers), `aria-hidden` values, `href` attributes
- **SectionHeader change:** Change `title: string` to `title: React.ReactNode`. This is safe because SectionHeader is a server component that just renders `{title}` in JSX — React can render ReactNode there. Callers (About, Experience, Projects) wrap the title: `<SectionHeader title={<CipherText>{t('heading')}</CipherText>} />`
- **Trans handling (About p2):** The `<Trans>` component renders rich text with embedded links. Wrap the entire `<Trans>` block in a `<span>` with a `.cipher-crossfade` class that does a CSS opacity crossfade on language change. The crossfade triggers via a React key change or a class toggle.
- **Experience jobs array:** Each field (`job.dates`, `job.title`, `job.company`, `job.description`) gets wrapped individually: `<CipherText>{job.title}</CipherText>`
- **Projects items array:** Each field (`project.title`, `project.description`) gets wrapped: `<CipherText>{project.title}</CipherText>`
- **Footer:** Wrap each `t()` call: `<CipherText>{t('footer.codedIn')}</CipherText>`
- **Test updates:** Existing tests query text with `getByText()`. When CipherText is active but env var is off (test default), CipherText renders plain text — tests should pass as-is. Ensure `NEXT_PUBLIC_CIPHER_TRANSITION` is NOT set in test environment so CipherText is a passthrough. Update any tests that break from the SectionHeader prop type change.

**CSS crossfade for Trans sections (add to `globals.css`):**
```css
.cipher-crossfade {
  transition: opacity 600ms ease-in-out;
}
.cipher-crossfade-out {
  opacity: 0;
}
```

**Definition of Done:**

- [ ] All tests pass (unit + existing i18n integration tests)
- [ ] No diagnostics errors
- [ ] Every visible `t()` output on the page is wrapped in `<CipherText>`
- [ ] `aria-label` attributes remain plain strings (not wrapped)
- [ ] SectionHeader accepts `ReactNode` for `title` prop
- [ ] `<Trans>` section in About has crossfade transition
- [ ] Dev server renders correctly in both EN and HE modes

**Verify:**

- `npm run test` — all tests pass (full suite)
- `npm run typecheck` — no type errors
- `npm run lint` — no lint errors
- `npm run dev` — verify page renders, toggle language, observe cipher effect

---

### Task 4: Update i18n Integration Tests and Final Polish

**Objective:** Update the i18n integration test suite to account for CipherText wrapping, add the env var to `.env.example`, and verify the complete feature end-to-end.

**Dependencies:** Task 3

**Files:**

- Update: `__tests__/components/i18n-integration.test.tsx` — ensure all assertions still pass with CipherText wrapping
- Create: `.env.example` (if not exists) or update it with `NEXT_PUBLIC_CIPHER_TRANSITION=true`
- Create: `.env.local` (add to `.gitignore` if needed) with `NEXT_PUBLIC_CIPHER_TRANSITION=true` for local dev

**Key Decisions / Notes:**

- The i18n integration tests verify text content across language switches. Since `NEXT_PUBLIC_CIPHER_TRANSITION` won't be set in the test environment, `CipherText` renders as a passthrough — existing assertions like `expect(heading).toHaveTextContent('About')` should pass without modification.
- If any tests fail due to the `ReactNode` wrapper around text (e.g., additional DOM elements), update the queries to use more flexible matchers.
- Add a test case that verifies CipherText integration doesn't break the language toggle flow.
- Verify `.env.local` with `NEXT_PUBLIC_CIPHER_TRANSITION=true` is in `.gitignore` (it should be by default in Next.js projects).

**Definition of Done:**

- [ ] All tests pass (full suite including i18n integration)
- [ ] No diagnostics errors
- [ ] `.env.example` documents the `NEXT_PUBLIC_CIPHER_TRANSITION` variable
- [ ] Dev server with `NEXT_PUBLIC_CIPHER_TRANSITION=true` shows cipher animation on language toggle
- [ ] Dev server without the env var shows instant language switch (no animation)
- [ ] `prefers-reduced-motion` in browser skips animation even with env var set
- [ ] Full build succeeds: `npm run build`

**Verify:**

- `npm run test` — full suite passes
- `npm run typecheck` — no type errors
- `npm run build` — production build succeeds
- Manual: toggle language in dev server with env var on, observe animation
- Manual: toggle language in dev server with env var off, observe instant switch

## Testing Strategy

- **Unit tests:** CipherText component rendering, useCipherTransition hook animation logic, cipher-chars utility functions
- **Integration tests:** i18n integration tests verify text renders correctly in both languages with CipherText wrapping
- **Manual verification:** Dev server with `NEXT_PUBLIC_CIPHER_TRANSITION=true` — toggle language, observe smooth per-character cipher animation with staggered resolution and teal glow

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Per-character spans cause layout jumpiness on long text | Medium | Medium | Use `display: inline-block` on character spans; only render spans during animation, plain text otherwise |
| Performance with 500+ simultaneous character animations | Low | Medium | rAF throttled to 60ms updates; spans only exist during ~2s animation window; no animation overhead when idle |
| CipherText breaks existing test assertions | Medium | Low | CipherText is a passthrough when env var is unset (test default); only render wrapper spans during active animation |
| Screen readers announce scrambled characters | Medium | High | Use `aria-hidden="true"` on animation spans + `sr-only` span with actual text |
| SectionHeader prop type change breaks callers | Low | Low | `ReactNode` is a superset of `string` — all existing string usages continue to work |

## Open Questions

- None — requirements are clear after user clarifications

### Deferred Ideas

- Sound effects (typewriter/cipher sounds) on character transitions
- Configurable animation speed per user preference
- Animation on initial page load (first visit reveal effect)
- Per-section staggered start (hero first, then about, etc.)
