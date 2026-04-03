# Hebrew Translation Polish Implementation Plan

Created: 2026-04-03
Author: yegamble@gmail.com
Status: PENDING
Approved: Yes
Iterations: 0
Worktree: No
Type: Feature

## Summary

**Goal:** Rewrite the Hebrew translation (`public/locales/he/translation.json`) so it reads like a native Israeli senior software engineer's portfolio — professional-confident tone, masculine gender, natural Modern Hebrew phrasing, with English kept for tech terms.

**Architecture:** Single-file change to `public/locales/he/translation.json`. Tests use separate fixture translations (`__tests__/fixtures/translations/he.json`) decoupled from production, so no test changes needed.

**Tech Stack:** i18next JSON translation file, no code changes.

## Scope

### In Scope

- Full rewrite of all Hebrew translation strings in `public/locales/he/translation.json`
- Fix unnatural English calques and literal translations
- Apply consistent masculine gender throughout
- Use professional-confident Israeli tech tone
- Keep tech terms in English (serverless, Docker, CI/CD, etc.)
- Allow localized phrasing that diverges from English for natural flow (same core facts)

### Out of Scope

- English translation changes
- Russian translation changes
- Component code changes
- Test fixture translation changes (tests are decoupled from production)
- Adding new translation keys

## Approach

**Chosen:** Full rewrite of the Hebrew translation file guided by a detailed audit of each section.

**Why:** The current translation has numerous English calques, inconsistent tone, and phrases that no Israeli engineer would write on their LinkedIn/CV. A section-by-section rewrite is the cleanest approach for a single JSON file.

**Alternatives considered:**
- Incremental fixes (patch individual phrases) — rejected because the issues are systemic (tone, calques, flow) not isolated
- AI translation service — rejected because the task requires domain expertise in Israeli tech culture, not just language fluency

## Context for Implementer

> Write for an implementer who has never seen the codebase.

- **File to modify:** `public/locales/he/translation.json` — the Hebrew translation JSON
- **Reference file:** `public/locales/en/translation.json` — the English source
- **i18n config:** `src/lib/i18n.ts` — loads all translations at build time (bundled, no backend)
- **Key pattern:** Nested keys like `hero.name`, `experience.jobs[0].description`
- **Component usage:** Components use `useTranslation()` hook with `t('key')` — see `src/components/About.tsx`, `Experience.tsx`, `Projects.tsx`, `ScrollHeader.tsx`
- **Tests are decoupled:** `__tests__/fixtures/translations/he.json` has its own generic test data. Production translation changes do NOT break tests.
- **RTL:** Hebrew activates RTL via `I18nProvider`. Logical CSS properties (`ps-`, `ms-`, `border-s`) are already in place.

**Gotchas:**
- The `experience.jobs` and `projects.items` arrays must preserve their `id` fields exactly — components join translations with metadata by ID
- The `about.p2_link` value appears as link text in the About section — the href is hardcoded in `About.tsx`
- `language.toggle` and `language.label` control the language switcher UI — these should stay as-is

## Detailed Audit & Translation Guide

### Section: hero

| Key | Current Hebrew | Issue | Fix |
|-----|---------------|-------|-----|
| `name` | יוסף גמבל | Fine — Hebrew transliteration of name | Keep |
| `title` | מהנדס תוכנה בכיר | Good | Keep |
| `tagline` | מהנדס Go ו-TypeScript בכיר. סטרימינג וידאו, פורטלי נדל"ן ותשתיות ענן. ניו יורק \| אוקלנד. | `סטרימינג וידאו` is transliteration — Israeli devs say `Video Streaming` in English or `הזרמת וידאו`. `פורטלי` is unusual plural. | Use `הזרמת וידאו` or keep `Video Streaming` in English. Use `פורטלים` or `פלטפורמות נדל"ן`. |
| `profileAlt` | תמונת פרופיל של יוסף גמבל | Fine | Keep |

### Section: about

| Key | Current Hebrew | Issue | Fix |
|-----|---------------|-------|-----|
| `p1` | הדרך שלי לקחה אותי מעבר לאוקיינוס השקט | English calque "my path took me" — unnatural in Hebrew | Rephrase: `עברתי לניו זילנד` or `המשכתי לניו זילנד` |
| `p1` | שם שימשתי כנשיא אגודת הסטודנטים | `שימשתי כ` is fine but `נשיא אגודת הסטודנטים` is a bit formal | Consider `יו"ר מועצת הסטודנטים` — more natural Israeli phrasing |
| `p1` | שבנה מערכות שהגיעו למיליוני משתמשים | Good — impactful | Keep |
| `p2_after` | הפכתי למהנדס מפתח | Good Israeli tech phrasing | Keep |
| `p2_after` | השקתי תכונות ראשונות בתעשייה | `תכונות` is weak for "features" in tech context | Use `יכולות` or `פיצ'רים חדשניים` |
| `p2_after` | התראות מיידיות על שינויי מחירים והיסטוריית מחירים שקופה | Good — clear and impactful | Keep core, tighten phrasing |
| `p2_after` | שמתחרים העתיקו חודשים אחר כך | Excellent — confident and impactful | Keep |
| `p2_after` | תכננתי מערכת התראות serverless | Good mix of Hebrew + English tech | Keep pattern |
| `p2_after` | הובלתי סדנאות בכל החברה | Good — `הובלתי` is common Israeli CV verb | Keep |
| `p3` | כעת חזרתי לניו יורק | Not in English — but user allows localized phrasing | Keep if it flows naturally |
| `p3` | אכפת לי מערכות סקיילביליות | `סקיילביליות` is awkward transliteration | Use `scalable` in English or rephrase as `מערכות שמתרחבות` |
| `p3` | אוטומציית תשתיות, והאינטרנט הפתוח | Good | Keep |

### Section: experience.jobs

| Job | Issue | Fix |
|-----|-------|-----|
| Independent | `מכולל ב-Docker` — awkward translation of "containerized" | Use `Dockerized` or `ב-containers עם Docker` |
| Independent | `מקטינה עלויות רוחב פס` — feminine verb but we need masculine | Fix to `מקטין` (but first-person past: `הקטנתי`) |
| Independent | `למטמון והגבלת קצב` — `מטמון` (cache) is good but `הגבלת קצב` for rate-limiting could use `rate limiting` in English | Use `caching ו-rate limiting` or keep Hebrew |
| realestate | Generally well-written | Tighten phrasing, ensure masculine consistency |
| realestate | `תרמתי לבניית מחדש של הפרונטאנד ב-EmberJS שקיבל משוב חיובי מסוכנים ומשתמשים ברחבי הארץ` | `תרמתי` is weak — be more assertive. `סוכנים` needs context (real estate agents) | Use `השתתפתי בהובלת` or `לקחתי חלק מרכזי ב`. Add `סוכני נדל"ן` for clarity. |
| ProStock | `בניתי את הפלטפורמה המרכזית של מערכת ניהול מחסנים` | Good | Keep |
| ProStock | `פרסתי אפליקציית סורק אנדרואיד` — `פרסתי` is good Israeli tech verb | Good | Keep |
| ProStock | `העברתי תשתית ל-Digital Ocean` — `העברתי` (migrated) is correct | Good | Keep |

### Section: experience (UI strings)

| Key | Current | Issue | Fix |
|-----|---------|-------|-----|
| `viewResume` | צפה בקורות חיים מלאים | Fine but `צפייה` might be more natural as imperative | Keep — imperative `צפה` is correct |

### Section: projects

| Key | Issue | Fix |
|-----|-------|-----|
| Titles | Stay in English | Correct — keep |
| Descriptions | Generally fine translations | Minor tightening |

### Section: footer, social, language

These are UI labels — current translations are fine. No changes needed except minor consistency.

## Gender Consistency Check

The current translation mixes perspectives. Some descriptions use third-person feminine (`בנתה`, `שילבה`, `שיגרה`, `תכננה`, `הובילה`, `תרמה`, `תיקנה`, `פרסה`) — these need to be rewritten in first-person masculine past tense (`בניתי`, `שילבתי`, `שיגרתי`, `תכננתי`, `הובלתי`, `תרמתי`, `תיקנתי`, `פרסתי`).

Wait — re-reading the Hebrew, the job descriptions actually use third-person forms. Let me re-check... The English uses first-person implicit ("Building an open-source..."), while Hebrew uses explicit forms. Israeli CVs typically use first-person: `בניתי`, `פיתחתי`, `הובלתי`. The current Hebrew seems to use a mix. This needs to be consistent — first-person masculine throughout.

## Assumptions

- Translation IDs (`id` fields in jobs/projects arrays) must NOT change — `src/data/experience.ts` and `src/data/projects.ts` join by ID — all tasks depend on this
- The `about.p2_link` text is used as the visible link text in the About component — Task 1 depends on this
- Tests use `__tests__/fixtures/translations/he.json` (separate from production) — confirmed by earlier session work — no test changes needed

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Breaking JSON syntax | Low | High — site won't load | Validate JSON after edit with `node -e "require('./public/locales/he/translation.json')"` |
| Changing an `id` field accidentally | Low | High — experience/project items vanish | Verify IDs unchanged: diff before/after, check `id` fields match exactly |
| Gender inconsistency missed | Medium | Low — awkward reading | Grep for feminine past-tense patterns after rewrite |

## Goal Verification

### Truths

1. `public/locales/he/translation.json` is valid JSON and loads without error
2. All `id` fields in `experience.jobs` and `projects.items` are unchanged
3. All translation keys present in `en/translation.json` are also present in `he/translation.json`
4. No English calques remain (specifically: "הדרך שלי לקחה אותי", "סקיילביליות", "מכולל ב-Docker")
5. Verbs in job descriptions use first-person masculine past tense consistently
6. Tech terms are kept in English (serverless, Docker, CI/CD, etc.)
7. The site renders correctly in Hebrew with RTL layout

### Artifacts

1. `public/locales/he/translation.json` — the rewritten translation

## Progress Tracking

- [ ] Task 1: Rewrite Hebrew translation
      **Total Tasks:** 1 | **Completed:** 0 | **Remaining:** 1

## Implementation Tasks

### Task 1: Rewrite Hebrew Translation

**Objective:** Rewrite all Hebrew translation strings in `public/locales/he/translation.json` to sound like a native Israeli senior software engineer's portfolio. Fix English calques, apply consistent masculine first-person, use professional-confident tone, keep tech terms in English.

**Dependencies:** None
**Mapped Scenarios:** None (no UI code changes — translation-only)

**Files:**

- Modify: `public/locales/he/translation.json`

**Key Decisions / Notes:**

- **Gender:** Masculine first-person throughout (`בניתי`, `פיתחתי`, `הובלתי`)
- **Tone:** Professional-confident, Israeli startup/scale-up style — direct, impact-focused, no fluff
- **Tech terms:** Keep in English when Israeli devs use them in English (serverless, Docker, CI/CD, full-stack, open-source, Kubernetes, etc.)
- **Faithfulness:** Localized phrasing allowed — same core facts, natural Hebrew flow. Small additions for context are OK.
- **Calques to fix:**
  - `הדרך שלי לקחה אותי` → natural Hebrew phrasing
  - `סקיילביליות` → use English "scalable" or rephrase
  - `מכולל ב-Docker` → `ב-Docker containers` or `Dockerized`
  - `תכונות ראשונות בתעשייה` → `יכולות חדשניות` or `פיצ'רים ראשונים בתעשייה`
- **ID fields:** DO NOT change any `id` values — `independent`, `realestate`, `prostock`, `project-alpha`, `neon-ui-kit`
- **p2_link:** Keep as `realestate.co.nz` — this is the visible link text
- **language section:** Keep as-is — controls UI behavior
- **Pattern:** Follow the English structure exactly for keys. Only change values.

**Definition of Done:**

- [ ] Valid JSON — `node -e "require('./public/locales/he/translation.json')"` exits 0
- [ ] All `id` fields match English exactly
- [ ] All keys from English file present in Hebrew file
- [ ] No feminine verb forms in job/project descriptions
- [ ] No English calques listed above remain
- [ ] Tech terms kept in English
- [ ] `npm run build` succeeds
- [ ] Site renders correctly in Hebrew (visual check with browser automation)

**Verify:**

- `node -e "require('./public/locales/he/translation.json'); console.log('Valid JSON')"`
- `npm run build`
- Visual browser check at `http://localhost:3000` with Hebrew language selected

## Open Questions

None — all decisions made.
