# Hero Contact Icons & PGP Key Modal Implementation Plan

Created: 2026-04-03
Author: yegamble@gmail.com
Status: VERIFIED
Approved: Yes
Iterations: 1
Worktree: No
Type: Feature

## Summary

**Goal:** Add conditional contact icons (email, secure email, PGP key) below the hero subtitle in the hero section, with hover highlighting, custom SVG icons, and a PGP key modal that parses the key client-side to display fingerprint, user ID, algorithm, and creation date — all translated to the active language.

**Architecture:** New `HeroContactIcons` component renders icons conditionally based on `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_SECURE_CONTACT_EMAIL`, and `NEXT_PUBLIC_PGP_PUBLIC_KEY` env vars. New `PgpKeyModal` component uses `openpgp` (lightweight build) to parse the key client-side and display metadata. Two new SVG icons (envelope+lock overlay, key) added to the icons barrel.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, openpgp (lightweight), i18next

## Scope

### In Scope

- New `SecureEmailIcon` SVG (envelope + lock overlay) replacing the existing padlock-only icon
- New `KeyIcon` SVG for PGP key
- `HeroContactIcons` component with conditional rendering based on env vars
- Hover highlighting on all icons (teal primary color)
- `PgpKeyModal` component with:
  - Full PGP key display in a code block with copy-to-clipboard
  - Parsed key metadata: fingerprint, user ID, algorithm, creation date, key ID
  - Client-side parsing via `openpgp/lightweight`
  - Full i18n support (EN, HE, RU)
  - Accessible modal (focus trap, Escape to close, aria attributes)
- `NEXT_PUBLIC_PGP_PUBLIC_KEY` environment variable
- Translation keys for modal text in all 3 languages
- Unit tests for all new components
- Updated icon tests, ScrollHeader tests, i18n integration tests

### Out of Scope

- PGP key signing/encryption functionality
- Keyserver lookup integration
- Downloadable `.asc` file
- Private key handling

## Approach

**Chosen:** Single `HeroContactIcons` component embedded in `ScrollHeader`'s hero section, with a separate `PgpKeyModal` component rendered via React portal/inline.

**Why:** Keeps the hero section clean by extracting icon logic into a focused component. The modal is a separate component for testability and single responsibility. Using `openpgp/lightweight` (~45KB gzip) for client-side key parsing avoids any server dependency — it only loads the crypto modules needed for key reading, not encryption.

**Alternatives considered:**
- Inline icons directly in ScrollHeader — rejected because it adds too much conditional logic to an already complex component
- Server-side key parsing via API route — rejected because the key is public and client-side parsing is simpler, no server needed
- Using a simpler PGP parser — rejected because openpgp.js (maintained by ProtonMail) is the gold standard for browser PGP and the user's key is from ProtonMail

## Context for Implementer

> Write for an implementer who has never seen the codebase.

- **Patterns to follow:**
  - Icons: `src/components/icons/index.tsx` — all icons use `BaseIcon` wrapper with `viewBox`, `fill="currentColor"`, `aria-hidden="true"`. Export named functions. Default className `'h-5 w-5'`.
  - Conditional env-based rendering: `src/components/SocialLinks.tsx:18-28` — uses `getMailtoHref()` to validate emails, spreads into array conditionally. Same pattern for PGP key presence.
  - i18n: `useTranslation()` hook with `t('key')`. Translations in `public/locales/{en,he,ru}/translation.json`.
  - Component structure: `'use client'` directive, default export, props interface above component.
  - Hover transitions: `transition-colors hover:text-primary` (see `SocialLinks.tsx:73`)

- **Conventions:**
  - One component per file in `src/components/`
  - Tests in `__tests__/components/<Name>.test.tsx`
  - Test fixtures in `__tests__/fixtures/translations/{en,he,ru}.json`
  - Package manager: pnpm
  - Design tokens: `text-primary` (#5eead4 teal), `text-text-muted` (#64748b), `bg-bg-dark` (#0f172a)

- **Key files:**
  - `src/components/ScrollHeader.tsx` — Hero section lives at lines 98-115. The `<div ref={sentinelRef}>` (lines 102-109) contains name + subtitle. The `<h1>` tagline (line 111) is OUTSIDE and AFTER that div. Icons go BETWEEN the sentinelRef div and the `<h1>` — i.e., after line 109, before line 111.
  - `src/components/icons/index.tsx` — All SVG icons. Add new icons here.
  - `src/components/SocialLinks.tsx` — Reference for conditional env-var rendering pattern.
  - `__tests__/setup.ts` — Sets test env vars. Add `NEXT_PUBLIC_PGP_PUBLIC_KEY` here.
  - `__tests__/fixtures/translations/{en,he,ru}.json` — Test translation fixtures. Add new keys.

- **Gotchas:**
  - The existing `SecureEmailIcon` (icons/index.tsx:51-61) is just a padlock. It needs to be replaced with an envelope+lock design. The `SocialLinks` component already imports and uses `SecureEmailIcon`, so the change propagates automatically.
  - `CipherText` wraps text in the hero section for the scramble animation — don't wrap the icons in CipherText.
  - RTL support: use logical properties (`ps-`, `ms-`, `gap-`) — the icons row with `flex` and `gap` handles RTL automatically.
  - The env var `NEXT_PUBLIC_PGP_PUBLIC_KEY` will contain a multi-line PGP key block. In `.env.local`, multi-line values should be quoted.
  - For Cloudflare deployment, multi-line env vars may not work. The `PgpKeyModal` component should handle both raw armored key format and base64-encoded format — check if the value starts with `-----BEGIN` and if not, attempt `atob()` decode before passing to openpgp.
  - `@/*` path alias maps to `./src/*` (confirmed in `tsconfig.json`). All imports use `@/components/...`.
  - Russian (RU) locale is fully set up: `public/locales/ru/translation.json` exists, registered in `lib/i18n.ts`, and `__tests__/fixtures/translations/ru.json` exists.

- **Domain context:**
  - PGP (Pretty Good Privacy) public keys are used for encrypted email. The modal displays the key so visitors can encrypt messages to the site owner.
  - Key fingerprint is a hash of the public key — used to verify key authenticity out-of-band.
  - openpgp.js `readKey({ armoredKey })` parses the ASCII-armored key and returns an object with `.getFingerprint()`, `.getUserIDs()`, `.getAlgorithmInfo()`, `.getCreationTime()`, `.getKeyID()`.

## Assumptions

- openpgp.js v6 `readKey` API works with the v1 key format (OpenPGP.js v1.2.0 generated key provided by user) — supported since openpgp.js handles RFC 4880. Task 3 depends on this.
- The `openpgp/lightweight` build is tree-shakeable and only `readKey` will be bundled since we don't use encryption/signing — Task 3 depends on this.
- Multi-line env vars work in Next.js `.env.local` when properly quoted — Task 1 depends on this.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| openpgp.js lightweight build too large for a portfolio site | Low | Medium | Use dynamic import so it only loads when the modal opens; measure bundle impact |
| Old PGP key format (v1.2.0) not parsed by openpgp.js v6 | Low | High | Test parsing the actual key during implementation; fall back to displaying raw key if parsing fails |
| Multi-line env var issues in deployment (Cloudflare) | Medium | Medium | PgpKeyModal detects format: if value starts with `-----BEGIN`, use as-is; otherwise attempt `atob()` decode. Supports both raw and base64-encoded env vars. |

## Goal Verification

### Truths

1. When `NEXT_PUBLIC_CONTACT_EMAIL` is set, an email icon appears below the hero subtitle with `mailto:` href
2. When `NEXT_PUBLIC_SECURE_CONTACT_EMAIL` is set, a secure email icon (envelope+lock) appears below the hero subtitle with `mailto:` href
3. When `NEXT_PUBLIC_PGP_PUBLIC_KEY` is set, a key icon appears below the hero subtitle
4. When no env vars are set, no icons render (no empty row)
5. All icons highlight to teal (#5eead4) on hover
6. Clicking the PGP key icon opens a modal showing the full key and parsed metadata (fingerprint, user ID, algorithm, creation date)
7. The modal is fully translated when switching languages
8. TS-001 through TS-003 pass end-to-end

### Artifacts

- `src/components/icons/index.tsx` — new `SecureEmailIcon` (redesigned) and `KeyIcon`
- `src/components/HeroContactIcons.tsx` — conditional icon rendering
- `src/components/PgpKeyModal.tsx` — PGP key display modal with verification
- `src/components/ScrollHeader.tsx` — modified to include `HeroContactIcons`
- `public/locales/{en,he,ru}/translation.json` — new `pgp.*` translation keys
- `__tests__/components/HeroContactIcons.test.tsx` — unit tests
- `__tests__/components/PgpKeyModal.test.tsx` — unit tests

## E2E Test Scenarios

### TS-001: Contact Icons Conditional Rendering
**Priority:** Critical
**Preconditions:** Dev server running with all 3 env vars set (CONTACT_EMAIL, SECURE_CONTACT_EMAIL, PGP_PUBLIC_KEY)
**Mapped Tasks:** Task 1, Task 4

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to homepage | Hero section visible with name, subtitle, and contact icons row |
| 2 | Inspect icons below subtitle | Three icons visible: email envelope, envelope+lock, key |
| 3 | Hover over each icon | Each icon transitions to teal color (#5eead4) |
| 4 | Click email icon | Browser opens mailto: handler |

### TS-002: PGP Key Modal
**Priority:** Critical
**Preconditions:** Dev server running with NEXT_PUBLIC_PGP_PUBLIC_KEY set
**Mapped Tasks:** Task 3, Task 4

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click the key icon in hero section | Modal opens with PGP key information |
| 2 | Read modal content | Shows: fingerprint (formatted hex), user ID, algorithm, creation date, full key block |
| 3 | Click copy button | Key copied to clipboard, button shows confirmation |
| 4 | Press Escape key | Modal closes |
| 5 | Click key icon again, then click backdrop | Modal closes |

### TS-003: Modal i18n Support
**Priority:** High
**Preconditions:** Dev server running with PGP key set
**Mapped Tasks:** Task 3, Task 5

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Switch language to Hebrew | Page renders RTL |
| 2 | Click key icon | Modal opens with Hebrew text labels |
| 3 | Verify modal direction | Modal renders RTL-aware layout |
| 4 | Switch to English | Modal labels update to English |

## Progress Tracking

- [x] Task 1: SVG Icons (SecureEmailIcon redesign + KeyIcon)
- [x] Task 2: HeroContactIcons component
- [x] Task 3: PgpKeyModal component with openpgp.js
- [x] Task 4: Integrate into ScrollHeader
- [x] Task 5: i18n translations (EN, HE, RU)
- [x] Task 6: Test setup and unit tests

**Total Tasks:** 6 | **Completed:** 6 | **Remaining:** 0

## Implementation Tasks

### Task 1: SVG Icons (SecureEmailIcon Redesign + KeyIcon)

**Objective:** Replace the existing padlock-only `SecureEmailIcon` with an envelope+lock overlay design, and add a new `KeyIcon` for the PGP key button.
**Dependencies:** None
**Mapped Scenarios:** TS-001

**Files:**

- Modify: `src/components/icons/index.tsx`
- Test: `__tests__/components/icons.test.tsx`
- Verify: `__tests__/components/SocialLinks.test.tsx` (must still pass after SecureEmailIcon redesign)

**Key Decisions / Notes:**

- `SecureEmailIcon`: Combine an envelope shape (similar to existing `EmailIcon`) with a small lock overlay in the bottom-right. Use `viewBox="0 0 24 24"` to match existing icons. The lock should be proportionally small (~8x8 within the 24x24 viewBox).
- `KeyIcon`: Classic key shape, `viewBox="0 0 24 24"`, `fill="currentColor"`. Default className `'h-5 w-5'`.
- Both icons use the existing `BaseIcon` wrapper pattern.
- Update `ICONS_CONFIG` in the test file to include `KeyIcon`.
- Update the `SecureEmailIcon` specific test (line 92-97) since the SVG structure will change (new design won't use `clip-rule`).
- Verify `SocialLinks.test.tsx` still passes — it imports `SecureEmailIcon` and any icon-specific assertions must match the new SVG structure.

**Definition of Done:**

- [ ] `SecureEmailIcon` renders an envelope with a lock overlay
- [ ] `KeyIcon` renders a key shape
- [ ] All existing icon tests pass (including SocialLinks)
- [ ] New icon tests for `KeyIcon` pass
- [ ] Updated `SecureEmailIcon` tests pass

**Verify:**

- `pnpm test -- __tests__/components/icons.test.tsx __tests__/components/SocialLinks.test.tsx`

---

### Task 2: HeroContactIcons Component

**Objective:** Create a `HeroContactIcons` component that conditionally renders email, secure email, and PGP key icons based on environment variables.
**Dependencies:** Task 1 (icons must exist)
**Mapped Scenarios:** TS-001

**Files:**

- Create: `src/components/HeroContactIcons.tsx`
- Test: `__tests__/components/HeroContactIcons.test.tsx`

**Key Decisions / Notes:**

- Follow the env-var conditional pattern from `SocialLinks.tsx:18-28` — read `process.env.NEXT_PUBLIC_*` at module level, conditionally include items.
- Use `getMailtoHref()` pattern for email validation (extract to shared util or duplicate — prefer duplication since it's 3 lines).
- The component renders a `<div>` with `flex items-center gap-3` containing icon links/buttons.
- Email and secure email icons are `<a>` tags with `mailto:` hrefs.
- PGP key icon is a `<button>` that triggers the modal (receives `onPgpClick` callback prop or manages modal state internally).
- If no env vars are set, the component returns `null` — no empty row.
- Hover effect: `text-text-muted transition-colors hover:text-primary` matching `SocialLinks` pattern.
- Each icon gets an `aria-label` using `t()` for accessibility.
- The component should accept a `className` prop for positioning flexibility.
- **PGP key button manages modal internally** — simpler, no prop drilling. The `PgpKeyModal` renders inside this component.

**Definition of Done:**

- [ ] Email icon renders only when `NEXT_PUBLIC_CONTACT_EMAIL` is set and valid
- [ ] Secure email icon renders only when `NEXT_PUBLIC_SECURE_CONTACT_EMAIL` is set and valid
- [ ] PGP key icon renders only when `NEXT_PUBLIC_PGP_PUBLIC_KEY` is set
- [ ] Returns `null` when no env vars are set
- [ ] Icons have hover transition to teal
- [ ] Each icon has translated `aria-label`
- [ ] All tests pass

**Verify:**

- `pnpm test -- __tests__/components/HeroContactIcons.test.tsx`

---

### Task 3: PgpKeyModal Component with openpgp.js

**Objective:** Create a modal that displays the PGP public key with parsed metadata (fingerprint, user ID, algorithm, creation date) using openpgp.js for client-side parsing.
**Dependencies:** None (can be built independently)
**Mapped Scenarios:** TS-002, TS-003

**Files:**

- Create: `src/components/PgpKeyModal.tsx`
- Create: `__tests__/components/PgpKeyModal.test.tsx`

**Key Decisions / Notes:**

- Install `openpgp` as a production dependency: `pnpm add openpgp`
- Use `import { readKey } from 'openpgp/lightweight'` for smaller bundle.
- **Dynamic import**: Load openpgp only when modal opens to avoid blocking initial page load. Use `const { readKey } = await import('openpgp/lightweight')` inside a `useEffect` triggered when `isOpen` becomes true. Do NOT use `React.lazy` — it's for component code-splitting, not library function imports.
- Modal structure:
  - Backdrop: `fixed inset-0 z-50 bg-black/60 backdrop-blur-sm`
  - Content: `bg-slate-900 border border-slate-700 rounded-lg p-6 max-w-lg mx-auto`
  - Title: translated "PGP Public Key"
  - Metadata section: fingerprint (formatted as 4-char hex groups), user ID, algorithm, creation date, key ID
  - Code block: `<pre>` with the full armored key, scrollable
  - Copy button: copies full key to clipboard, shows "Copied!" feedback
  - Close button (X) and Escape key handler
- Props: `isOpen: boolean`, `onClose: () => void`, `armoredKey: string`
- Focus management: focus the modal on open, trap focus within, restore focus on close.
- Use `useEffect` to handle Escape key and body scroll lock.
- Key parsing happens in a `useEffect` with loading/error states — show "Loading key details..." while parsing, show error message if parsing fails (fallback to raw key display).
- **Mock openpgp.js in tests** — use `vi.mock('openpgp/lightweight')` to return predictable key metadata. Use a test PGP key in test fixtures.
- i18n: all text labels use `t('pgp.*')` keys.

**Definition of Done:**

- [ ] Modal opens/closes correctly
- [ ] Displays parsed key metadata (fingerprint, user ID, algorithm, creation date)
- [ ] Shows full armored key in scrollable code block
- [ ] Copy-to-clipboard works with feedback
- [ ] Escape key and backdrop click close modal
- [ ] All text is translated via i18n
- [ ] Accessible: focus trap, aria-modal, aria-labelledby
- [ ] openpgp.js is dynamically imported (not in initial bundle)
- [ ] Tests pass with mocked openpgp

**Verify:**

- `pnpm test -- __tests__/components/PgpKeyModal.test.tsx`

---

### Task 4: Integrate HeroContactIcons into ScrollHeader

**Objective:** Add the `HeroContactIcons` component to the hero section in `ScrollHeader`, positioned below the subtitle.
**Dependencies:** Task 2 (HeroContactIcons must exist)
**Mapped Scenarios:** TS-001, TS-002

**Files:**

- Modify: `src/components/ScrollHeader.tsx`
- Modify: `__tests__/components/ScrollHeader.test.tsx`

**Key Decisions / Notes:**

- Import `HeroContactIcons` in `ScrollHeader.tsx`.
- Insert `<HeroContactIcons className="mt-3" />` AFTER the closing `</div>` of the sentinelRef block (after line 109) and BEFORE the `<h1>` tagline (line 111). This places icons between the subtitle and the tagline, outside the IntersectionObserver sentinel.
- Add ScrollHeader tests that verify:
  - When env vars are set, contact icons render in the hero section
  - When env vars are unset, no contact icons render
- The env vars are already set in `__tests__/setup.ts` for email. Add `NEXT_PUBLIC_PGP_PUBLIC_KEY` to setup.

**Definition of Done:**

- [ ] HeroContactIcons renders below the subtitle in the hero section
- [ ] ScrollHeader tests verify icon presence
- [ ] All existing ScrollHeader tests still pass

**Verify:**

- `pnpm test -- __tests__/components/ScrollHeader.test.tsx`

---

### Task 5: i18n Translations (EN, HE, RU)

**Objective:** Add all translation keys for the PGP modal and hero contact icon labels across all 3 languages.
**Dependencies:** None (can be done in parallel)
**Mapped Scenarios:** TS-003

**Files:**

- Modify: `public/locales/en/translation.json`
- Modify: `public/locales/he/translation.json`
- Modify: `public/locales/ru/translation.json`
- Modify: `__tests__/fixtures/translations/en.json`
- Modify: `__tests__/fixtures/translations/he.json`
- Modify: `__tests__/fixtures/translations/ru.json`

**Key Decisions / Notes:**

- New keys to add under `"pgp"` namespace:
  - `pgp.title` — "PGP Public Key" / "מפתח PGP ציבורי" / "Публичный ключ PGP"
  - `pgp.fingerprint` — "Fingerprint" / "טביעת אצבע" / "Отпечаток"
  - `pgp.userId` — "User ID" / "מזהה משתמש" / "Идентификатор"
  - `pgp.algorithm` — "Algorithm" / "אלגוריתם" / "Алгоритм"
  - `pgp.created` — "Created" / "נוצר" / "Создан"
  - `pgp.keyId` — "Key ID" / "מזהה מפתח" / "ID ключа"
  - `pgp.copyKey` — "Copy Key" / "העתק מפתח" / "Копировать ключ"
  - `pgp.copied` — "Copied!" / "!הועתק" / "Скопировано!"
  - `pgp.close` — "Close" / "סגור" / "Закрыть"
  - `pgp.loading` — "Loading key details..." / "...טוען פרטי מפתח" / "Загрузка данных ключа..."
  - `pgp.error` — "Could not parse key details" / "לא ניתן לנתח פרטי מפתח" / "Не удалось разобрать данные ключа"
  - `pgp.verifyNotice` — "Verify this fingerprint through a trusted channel before use." / "אמת את טביעת האצבע דרך ערוץ מהימן לפני שימוש." / "Проверьте отпечаток через доверенный канал перед использованием."
- Also add under `"social"`:
  - `social.pgpKey` — "PGP Key" / "מפתח PGP" / "Ключ PGP"
- Test fixture translations can be simplified versions of the real translations.

**Definition of Done:**

- [ ] All 3 production translation files updated with pgp.* and social.pgpKey keys
- [ ] All 3 test fixture translation files updated
- [ ] No missing keys across languages

**Verify:**

- `pnpm test -- __tests__/components/i18n-integration.test.tsx`

---

### Task 6: Test Setup and Comprehensive Unit Tests

**Objective:** Add test PGP key to fixtures, update test setup with env var, update i18n integration tests, and ensure full test suite passes.
**Dependencies:** Tasks 1-5 (all implementation complete)
**Mapped Scenarios:** All

**Files:**

- Modify: `__tests__/setup.ts`
- Modify: `__tests__/components/i18n-integration.test.tsx`
- Modify: `__tests__/components/SocialLinks.test.tsx`
- Modify: `cypress/e2e/portfolio.cy.ts` — add hero contact icons + PGP modal E2E assertions

**Key Decisions / Notes:**

- Add `process.env.NEXT_PUBLIC_PGP_PUBLIC_KEY` to `__tests__/setup.ts` with a **test PGP key** (generate a simple one or use a well-known test key — NOT the user's real key).
- Add i18n integration tests that verify:
  - PGP modal text switches between EN/HE/RU
  - PGP key icon label translates correctly
- Verify SocialLinks tests still pass after the `SecureEmailIcon` SVG change.
- Add Cypress E2E assertions to `cypress/e2e/portfolio.cy.ts` covering:
  - Contact icons visible in hero section (TS-001)
  - PGP modal opens on key icon click, displays content, closes on Escape (TS-002)
- Run full test suite to confirm zero regressions.

**Definition of Done:**

- [ ] Test PGP key in setup.ts
- [ ] i18n integration tests cover PGP modal language switching
- [ ] Cypress E2E spec updated with hero contact icon and modal assertions
- [ ] Full test suite passes: `pnpm test`
- [ ] No regressions in existing tests

**Verify:**

- `pnpm test`

## Open Questions

None — all questions resolved during planning.
