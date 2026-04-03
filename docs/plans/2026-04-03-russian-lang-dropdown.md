# Russian Language Support & Flag Dropdown Selector Plan

Created: 2026-04-03
Author: yegamble@gmail.com
Status: VERIFIED
Approved: Yes
Iterations: 0
Worktree: No
Type: Feature

## Summary

**Goal:** Add Russian language support and replace the text-based language toggle button with a dropdown selector displaying SVG flag icons + language initials (EN/עב/RU) for English (US flag), Hebrew (Israeli flag), and Russian (Russian flag). Include comprehensive tests.

**Architecture:** New Russian translation JSON file, updated i18n config to register 3 languages, new `LanguageSelector` dropdown component replacing `LanguageToggle`, SVG flag components in the icons barrel export, and updated I18nProvider for RTL handling with 3 languages. Gated behind new `NEXT_PUBLIC_I18N_ENABLED` env var.

**Tech Stack:** React 19, i18next, react-i18next, Tailwind CSS, SVG flag icons

## Scope

### In Scope

- Russian translation file (`public/locales/ru/translation.json`) — direct translation of English
- i18n config updated to register Russian resource
- New SVG flag icon components (US, Israel, Russia)
- New `LanguageSelector` dropdown component replacing `LanguageToggle`
- Click-to-open, click-outside-to-close, auto-close on mouse-leave (1.5s delay)
- Dropdown styled to match dark theme (slate borders, teal accent)
- `NEXT_PUBLIC_I18N_ENABLED` env var replacing `NEXT_PUBLIC_HEBREW_ENABLED`
- I18nProvider RTL logic updated (only `he` is RTL; `en` and `ru` are LTR)
- Unit tests for LanguageSelector, i18n config, i18n integration
- Updated existing tests that reference LanguageToggle

### Out of Scope

- Browser language auto-detection
- Persist language choice to localStorage (included in Task 6)
- SEO metadata per language (separate feature)
- Animated transitions between languages
- Language-specific fonts (Russian uses Inter which supports Cyrillic)

## Approach

**Chosen:** Replace LanguageToggle with new LanguageSelector component

**Why:** Clean separation — the new dropdown has fundamentally different UX (3 options, open/close state, mouse-leave timer) vs the old binary toggle. Replacing rather than extending avoids conditional complexity.

**Alternatives considered:**
- *Extend existing LanguageToggle with dropdown mode*: Would require heavy refactoring of a simple toggle into a complex dropdown. More code churn, harder to test incrementally.
- *Third-party dropdown component*: Unnecessary dependency for a 3-item selector. Custom component is simpler and matches the exact design.

## Context for Implementer

> Write for an implementer who has never seen the codebase.

- **Patterns to follow:**
  - `src/components/LanguageToggle.tsx` — current toggle being replaced (reference for styling/integration point)
  - `src/components/icons/index.tsx` — barrel export pattern for SVG icons. All icons use `BaseIcon` wrapper with `viewBox`, `fill="currentColor"`, `aria-hidden="true"`
  - `public/locales/en/translation.json` — translation structure to replicate for Russian
  - `src/lib/i18n.ts` — i18n config showing how to register new language resources
- **Conventions:**
  - One component per file, default exports, `'use client'` when hooks are needed
  - Icons barrel-exported from `components/icons/index.tsx`
  - Translation JSON files follow nested key convention: `section.subkey`
  - Tests in `__tests__/` mirror `src/` structure
- **Key files:**
  - `src/components/LanguageToggle.tsx` — being replaced by `LanguageSelector`
  - `src/components/ScrollHeader.tsx:92` — imports and renders `LanguageToggle`
  - `src/lib/i18n.ts` — i18n config (add Russian resource)
  - `src/components/I18nProvider.tsx:19` — RTL logic (`lang === 'he'` check)
  - `src/components/icons/index.tsx` — add flag icon exports
  - `.env` / `.env.example` — env var definitions
  - `__tests__/setup.ts:6` — sets `NEXT_PUBLIC_HEBREW_ENABLED` for tests
- **Gotchas:**
  - `NEXT_PUBLIC_HEBREW_ENABLED` is referenced in `LanguageToggle.tsx`, `CipherText.tsx`, and `__tests__/setup.ts`. The CipherText usage must be checked — if it only uses the var to decide whether CipherText is active, it may need updating to the new env var name.
  - Inter font (already loaded in `layout.tsx`) supports Cyrillic subset — but the current config only loads `latin` and `latin-ext`. Must add `cyrillic` subset to Inter font config.
  - The `language.toggle` and `language.label` translation keys are toggle-specific. The dropdown needs different keys per language option.
  - Russian uses LTR direction like English. Only Hebrew is RTL. The `I18nProvider` check `lang === 'he'` is already correct and doesn't need changing for Russian.
- **Domain context:** Flag icons should be small (16x12 or similar) proportional rectangles. Standard flag aspect ratio is 3:2. The dropdown appears in the nav bar next to social links, inside a flex container with `gap-6 md:gap-8`.

## Runtime Environment

- **Start command:** `pnpm run build && pnpm run start`
- **Port:** 3000
- **Health check:** `curl http://localhost:3000`

## Assumptions

- Inter font supports Cyrillic at the `cyrillic` subset level — supported by Google Fonts Inter page — Task 1 depends on this
- `NEXT_PUBLIC_HEBREW_ENABLED` in `CipherText.tsx` controls cipher animation independently and should be kept or renamed — need to verify — Task 4 depends on this
- Russian translations are a direct translation of English content — confirmed by user — Task 2 depends on this
- The dropdown should show the CURRENT language's flag (not the next language) — standard UX — Task 3 depends on this

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| CipherText depends on HEBREW_ENABLED env var for cipher animation | High | Medium | Check CipherText.tsx and update env var reference if needed; keep cipher animation working |
| Russian translation quality | Medium | Low | Direct translation; user can review and adjust after implementation |
| Flag SVGs too large or rendering inconsistently | Low | Low | Use simplified flag SVGs (3-5 path elements max); test across browsers |
| Dropdown z-index conflicts with sticky header | Medium | Medium | Use z-50+ on dropdown panel; test with scrolled state |
| Auto-close timer interfering with accessibility | Low | High | 1.5s delay, clear focus management, Escape key to close, keep dropdown open while any child has focus |

## Goal Verification

### Truths

1. Dropdown shows current language's flag + initials (e.g., 🇺🇸 EN for English)
2. Clicking the dropdown reveals 3 options: English (US flag), Hebrew (Israel flag), Russian (Russia flag)
3. Selecting Russian switches all content to Russian (nav, hero, about, experience, projects, footer)
4. Selecting Hebrew switches content to Hebrew with RTL layout
5. Selecting English returns to English with LTR layout
6. Dropdown closes on click outside, Escape key, or 1.5s after mouse leaves
7. Russian translation file contains all keys present in English translation
8. Setting `NEXT_PUBLIC_I18N_ENABLED=false` hides the language selector
9. Inter font loads Cyrillic subset for Russian text rendering
10. TS-001 through TS-004 pass end-to-end

### Artifacts

- `public/locales/ru/translation.json` — complete Russian translations
- `src/components/LanguageSelector.tsx` — new dropdown component
- `src/components/icons/index.tsx` — US, Israel, Russia flag SVG components
- `src/lib/i18n.ts` — updated with Russian resource
- `src/components/I18nProvider.tsx` — updated RTL logic (if needed)
- `src/components/ScrollHeader.tsx` — import LanguageSelector instead of LanguageToggle
- `src/app/layout.tsx` — Inter font cyrillic subset
- `.env` / `.env.example` — new env var
- `__tests__/setup.ts` — updated env var
- `__tests__/components/LanguageSelector.test.tsx` — comprehensive tests
- `__tests__/lib/i18n.test.ts` — updated for Russian resource
- `__tests__/components/i18n-integration.test.tsx` — Russian mode tests

## E2E Test Scenarios

### TS-001: Language Dropdown Basic Interaction
**Priority:** Critical
**Preconditions:** Site running locally, English is default
**Mapped Tasks:** Task 3, Task 4

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `http://localhost:3000` | Page loads, dropdown shows US flag + "EN" |
| 2 | Click the language dropdown trigger | Dropdown opens with 3 options (EN, עב, RU) each with flag |
| 3 | Click "RU" option | Dropdown closes, content switches to Russian, nav shows Russian labels |
| 4 | Click dropdown trigger again | Dropdown opens, RU option is highlighted as current |
| 5 | Click "עב" option | Content switches to Hebrew, page is RTL |
| 6 | Click dropdown, then click outside | Dropdown closes without changing language |

### TS-002: Russian Content Verification
**Priority:** Critical
**Preconditions:** Site running locally
**Mapped Tasks:** Task 2, Task 3

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Switch to Russian via dropdown | All visible content is in Russian |
| 2 | Verify hero section | Name shows "Йосеф Гэмбл", title in Russian, tagline in Russian |
| 3 | Verify About section | Heading "О Себе", about paragraphs in Russian |
| 4 | Verify Experience section | Job titles, dates, descriptions in Russian |
| 5 | Verify navigation | Nav links show Russian labels |

### TS-003: Auto-Close Behavior
**Priority:** High
**Preconditions:** Site running locally
**Mapped Tasks:** Task 3

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click dropdown to open | Dropdown is visible |
| 2 | Press Escape key | Dropdown closes |
| 3 | Click dropdown to open again | Dropdown is visible |
| 4 | Move mouse outside dropdown, wait 2 seconds | Dropdown auto-closes |

### TS-004: Feature Gate
**Priority:** High
**Preconditions:** `NEXT_PUBLIC_I18N_ENABLED=false` in env
**Mapped Tasks:** Task 4

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to site | No language selector visible in nav bar |

## Progress Tracking

- [x] Task 1: Russian Translation File + i18n Config + Font Subset
- [x] Task 2: SVG Flag Icon Components
- [x] Task 3: LanguageSelector Dropdown Component
- [x] Task 4: Integration (ScrollHeader, Env Vars, I18nProvider) + Cleanup
- [x] Task 5: Test Updates (LanguageSelector, i18n, i18n-integration)
- [x] Task 6: Persist Language Choice to localStorage

**Total Tasks:** 6 | **Completed:** 6 | **Remaining:** 0

## Implementation Tasks

### Task 1: Russian Translation File + i18n Config + Font Subset

**Objective:** Create the complete Russian translation file, register it in i18n config, and add Cyrillic font subset.
**Dependencies:** None
**Mapped Scenarios:** TS-002

**Files:**

- Create: `public/locales/ru/translation.json`
- Modify: `src/lib/i18n.ts`
- Modify: `src/app/layout.tsx` (Inter font subsets — add `'cyrillic'`)
- Test: `__tests__/lib/i18n.test.ts`

**Key Decisions / Notes:**

- Direct translation of `public/locales/en/translation.json` to Russian
- Russian nav: "О Себе" (About), "Опыт" (Experience), "Проекты" (Projects)
- Russian hero.name: "Йосеф Гэмбл" (phonetic transliteration)
- Russian hero.title: "Старший инженер-программист" (Senior Software Engineer)
- Add `language` section with keys for the new dropdown: `language.selectLabel` (aria-label for dropdown), `language.current` (screen reader text for current lang)
- Add `import ru from '../../public/locales/ru/translation.json'` and register in `i18n.ts` resources
- Add `'cyrillic'` to Inter font `subsets` array in `layout.tsx:7`
- Update `__tests__/lib/i18n.test.ts` to verify Russian resource bundle exists

**Definition of Done:**

- [ ] `public/locales/ru/translation.json` has all keys matching English
- [ ] `i18n.hasResourceBundle('ru', 'translation')` returns true
- [ ] Inter font loads with cyrillic subset
- [ ] All existing i18n tests pass + new Russian resource test passes
- [ ] No diagnostics errors

**Verify:**

- `pnpm test -- --reporter=dot __tests__/lib/i18n.test.ts`

---

### Task 2: SVG Flag Icon Components

**Objective:** Create US, Israel, and Russia flag SVG icon components in the icons barrel export.
**Dependencies:** None
**Mapped Scenarios:** TS-001

**Files:**

- Modify: `src/components/icons/index.tsx`
- Test: `__tests__/components/icons.test.tsx`

**Key Decisions / Notes:**

- Follow existing `BaseIcon` pattern but flags need different dimensions — flags are 3:2 aspect ratio not square. Use a `BaseFlagIcon` wrapper with `viewBox="0 0 36 24"` (or similar), `aria-hidden="true"`, and no `fill="currentColor"` (flags have specific colors).
- **US flag:** Simplified version — blue canton with white dots (stars), red and white stripes. 3-5 SVG elements max.
- **Israel flag:** Two blue horizontal stripes top and bottom on white background, blue Star of David in center.
- **Russia flag:** Three horizontal stripes — white, blue, red (top to bottom). 3 rect elements.
- Each flag component: `USFlagIcon`, `IsraelFlagIcon`, `RussiaFlagIcon`
- Default className: `h-4 w-6` (flag proportions)
- Export from barrel: add to existing `index.tsx` exports
- Add test assertions in existing `icons.test.tsx` for new flag components

**Definition of Done:**

- [ ] Three flag components render correct SVG elements
- [ ] Flags have proper aspect ratio (3:2)
- [ ] Flags use `aria-hidden="true"`
- [ ] Icons test file includes assertions for new flags
- [ ] No diagnostics errors

**Verify:**

- `pnpm test -- --reporter=dot __tests__/components/icons.test.tsx`

---

### Task 3: LanguageSelector Dropdown Component

**Objective:** Build the new dropdown component with flag + initials, click-to-open, click-outside-to-close, auto-close on mouse-leave (1.5s), Escape to close.
**Dependencies:** Task 2 (flag icons)
**Mapped Scenarios:** TS-001, TS-003

**Files:**

- Create: `src/components/LanguageSelector.tsx`
- Create: `__tests__/components/LanguageSelector.test.tsx`

**Key Decisions / Notes:**

- `'use client'` — uses hooks (useState, useEffect, useRef, useTranslation)
- Component structure:
  ```
  <div> (relative container, onMouseLeave starts timer, onMouseEnter clears timer)
    <button> (trigger — shows current flag + initials)
    {isOpen && (
      <div> (dropdown panel — absolute positioned below trigger)
        <button> per language (flag + label + initials)
      </div>
    )}
  </div>
  ```
- Languages config array: `[{ code: 'en', label: 'English', initials: 'EN', Flag: USFlagIcon }, ...]`
- Current language highlighted with teal text/border
- Gated by `NEXT_PUBLIC_I18N_ENABLED` env var (return null if not "true")
- Styling: matches dark theme — `bg-slate-800 border border-slate-700` panel, `hover:bg-slate-700` items, `text-primary` for current
- Auto-close: `setTimeout(1500ms)` on mouse leave, cleared on mouse enter or manual close
- Escape key: `useEffect` with `keydown` listener when open
- Click outside: `useRef` on container + `mousedown` listener on document
- Focus management: when opened, first option receives focus; Tab cycles through options; focus leaving last option closes dropdown
- Accessibility: `role="listbox"` on panel, `role="option"` on items, `aria-expanded` on trigger, `aria-activedescendant` for current selection

**Definition of Done:**

- [ ] Dropdown opens on click, closes on click-outside/Escape/mouse-leave
- [ ] Shows current language flag + initials in trigger
- [ ] Three language options with flags
- [ ] Selecting a language changes i18n language and closes dropdown
- [ ] Auto-close after 1.5s mouse leave
- [ ] Accessible: keyboard navigation, aria attributes, focus management
- [ ] Hidden when `NEXT_PUBLIC_I18N_ENABLED` is not "true"
- [ ] Comprehensive unit tests cover all interactions
- [ ] No diagnostics errors

**Verify:**

- `pnpm test -- --reporter=dot __tests__/components/LanguageSelector.test.tsx`

---

### Task 4: Integration (ScrollHeader, Env Vars, I18nProvider) + Cleanup

**Objective:** Wire the new LanguageSelector into ScrollHeader, update env vars, check CipherText dependency, and remove old LanguageToggle.
**Dependencies:** Task 3
**Mapped Scenarios:** TS-001, TS-004

**Files:**

- Modify: `src/components/ScrollHeader.tsx` (import LanguageSelector instead of LanguageToggle)
- Delete: `src/components/LanguageToggle.tsx`
- Modify: `.env` (rename HEBREW_ENABLED → I18N_ENABLED)
- Modify: `.env.example` (same rename)
- Modify: `src/components/CipherText.tsx` (update env var reference if it uses HEBREW_ENABLED)
- Modify: `__tests__/setup.ts` (update env var name)
- Modify: `src/components/I18nProvider.tsx` (verify RTL logic handles 3 languages — `he` is RTL, others LTR)

**Key Decisions / Notes:**

- In `ScrollHeader.tsx:7`, change `import LanguageToggle from '@/components/LanguageToggle'` to `import LanguageSelector from '@/components/LanguageSelector'`
- In `ScrollHeader.tsx:92`, change `<LanguageToggle />` to `<LanguageSelector />`
- Check `CipherText.tsx` for `NEXT_PUBLIC_HEBREW_ENABLED` — if it's used for cipher animation, rename to `NEXT_PUBLIC_I18N_ENABLED` (same meaning: "is i18n active?"). If it's used differently, keep separate.
- In `.env`, rename var and update comment
- In `__tests__/setup.ts:6`, change to `NEXT_PUBLIC_I18N_ENABLED = 'true'`
- I18nProvider RTL check: current `lang === 'he'` is correct — Russian is LTR. No change needed unless we want to make it data-driven (unnecessary for now).
- Delete `src/components/LanguageToggle.tsx` and `__tests__/components/LanguageToggle.test.tsx`

**Definition of Done:**

- [ ] ScrollHeader renders LanguageSelector instead of LanguageToggle
- [ ] Old LanguageToggle files deleted
- [ ] `NEXT_PUBLIC_I18N_ENABLED` env var works correctly
- [ ] CipherText still functions correctly with renamed env var
- [ ] I18nProvider RTL works for Hebrew, LTR for English and Russian
- [ ] All tests pass
- [ ] No diagnostics errors

**Verify:**

- `pnpm test -- --reporter=dot`

---

### Task 5: Test Updates (i18n-integration for Russian)

**Objective:** Add Russian language integration tests to the existing i18n-integration test file, covering all sections rendering in Russian.
**Dependencies:** Tasks 1-4
**Mapped Scenarios:** TS-002

**Files:**

- Modify: `__tests__/components/i18n-integration.test.tsx`

**Key Decisions / Notes:**

- Add a new `describe('i18n Integration - Russian Mode')` block following the Hebrew mode pattern
- Test: nav items in Russian, hero content in Russian, About heading in Russian, Experience heading/jobs in Russian, Projects heading in Russian, footer in Russian
- Add Russian regression tests: anchor hrefs preserved, company URLs preserved, technology tags unchanged, resume link intact
- Update the language toggle flow test to use the new dropdown interaction pattern

**Definition of Done:**

- [ ] Russian mode tests cover all sections (nav, hero, about, experience, projects, footer)
- [ ] Russian regression tests verify structural integrity (links, hrefs, tech tags)
- [ ] Language toggle flow test updated for dropdown interaction
- [ ] All i18n integration tests pass
- [ ] No diagnostics errors

**Verify:**

- `pnpm test -- --reporter=dot __tests__/components/i18n-integration.test.tsx`

---

### Task 6: Persist Language Choice to localStorage

**Objective:** Save the user's language selection to localStorage so it persists across page reloads and return visits.
**Dependencies:** Task 3 (LanguageSelector must exist)
**Mapped Scenarios:** None (unit-testable)

**Files:**

- Modify: `src/components/I18nProvider.tsx` (read from localStorage on mount, subscribe to language changes to save)
- Modify: `__tests__/components/I18nProvider.test.tsx`

**Key Decisions / Notes:**

- On mount: check `localStorage.getItem('language')`. If it's a valid language code (`en`, `he`, `ru`), call `i18n.changeLanguage(stored)`.
- On language change: `localStorage.setItem('language', newLang)` inside the `languageChanged` event handler already in `HtmlLangUpdater`.
- Guard with `typeof window !== 'undefined'` for SSR safety (Next.js).
- If stored value is invalid or missing, fall back to `'en'` (current default behavior).
- This is lightweight — no new files, just 3-4 lines added to I18nProvider.

**Definition of Done:**

- [ ] Language choice persists across page reloads
- [ ] Invalid/missing localStorage value falls back to English
- [ ] SSR-safe (no `window` access during server render)
- [ ] Tests verify localStorage read/write behavior
- [ ] No diagnostics errors

**Verify:**

- `pnpm test -- --reporter=dot __tests__/components/I18nProvider.test.tsx`

---

## Open Questions

None — all inputs are available.

### Deferred Ideas

- Browser language auto-detection (detect `navigator.language` and pre-select matching locale)
- Per-language OG metadata (separate `og:locale:alternate` tags)
- Animated flag transitions in the dropdown
- Additional languages in the future (Arabic RTL, etc.)
