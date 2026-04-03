# SEO & LinkedIn Sharing Optimization Plan

Created: 2026-04-03
Author: yegamble@gmail.com
Status: VERIFIED
Approved: Yes
Iterations: 0
Worktree: No
Type: Feature

## Summary

**Goal:** Maximize the portfolio's visibility in Google searches for key terms (Yosef Gamble, senior software engineers in NYC/Auckland, Go/Golang, real estate portal engineers, video streaming experts) and make LinkedIn shares display a rich, compelling preview card.

**Architecture:** All SEO enhancements live in the Next.js App Router metadata system (`layout.tsx`), structured data via a JSON-LD script component, and App Router file conventions for `robots.txt` and `sitemap.xml`. Visible content updates go through the i18n translation JSON files.

**Tech Stack:** Next.js Metadata API, JSON-LD (schema.org Person + WebSite), sharp (image processing), Next.js App Router `robots.ts`/`sitemap.ts` conventions.

## Scope

### In Scope

- Enhanced meta title/description with target keywords
- Open Graph metadata with image for LinkedIn/social sharing
- Twitter Card metadata
- JSON-LD structured data (Person + WebSite schemas)
- OG image processing (compress user's headshot to 1200x630)
- Updated hero tagline (expertise-focused, keyword-rich)
- Subtle keyword enrichment in About section translation text
- `robots.txt` and `sitemap.xml` via Next.js App Router conventions
- Canonical URL configuration
- Both English and Hebrew translation updates

### Out of Scope

- Dynamic OG image generation (using static image)
- Google Search Console setup
- Google Analytics / tracking
- Page speed optimization (separate concern)
- New pages or routes
- Favicon changes

## Approach

**Chosen:** Static metadata enrichment via Next.js Metadata API + JSON-LD script injection

**Why:** Leverages Next.js's built-in metadata system (already partially used in `layout.tsx`), requires zero new dependencies for metadata, and produces the most search-engine-friendly output. Static structured data is simpler and more reliable than dynamic generation for a single-page portfolio.

**Alternatives considered:**
- *Dynamic OG image generation via `opengraph-image.tsx`*: More flexible but adds complexity for a static portfolio site. The user's professional headshot is a stronger visual than generated text.
- *Third-party SEO plugin/library*: Unnecessary overhead — Next.js Metadata API covers everything needed.

## Context for Implementer

> Write for an implementer who has never seen the codebase.

- **Patterns to follow:** The existing `metadata` export in `src/app/layout.tsx:18-36` is the base to extend. Translation files at `public/locales/{en,he}/translation.json` follow nested key conventions documented in `.claude/rules/i18n.md`.
- **Conventions:** One component per file, default exports, `'use client'` only when hooks are needed. JSON-LD can be a server component (no hooks needed).
- **Key files:**
  - `src/app/layout.tsx` — Root layout with existing Metadata export
  - `public/locales/en/translation.json` — English translations (hero tagline, about text)
  - `public/locales/he/translation.json` — Hebrew translations
  - `src/components/ScrollHeader.tsx` — Contains the hero `<h1>` tagline
  - `src/components/About.tsx` — About section component
  - `public/images/` — Image assets directory
- **Gotchas:**
  - The `metadataBase` is already set to `https://yosefgamble.com` — all relative URLs resolve against this.
  - `sharp` is a transitive dependency of Next.js — available for image processing scripts without explicit install.
  - The hero tagline is the `<h1>` element (in `ScrollHeader.tsx:111`) — it reads from `t('hero.tagline')`, so changes go in translation JSON, not the component.
  - The profile image is already at `public/images/profile.jpg` (24KB). The OG image is a *separate* asset at 1200x630 dimensions.
- **Domain context:** LinkedIn reads `og:title`, `og:description`, `og:image`, and `og:url` for its link preview cards. Google uses JSON-LD `Person` schema for Knowledge Panel results. The `@type: WebSite` schema helps with sitelinks and brand searches.

## Assumptions

- The high-resolution headshot is at `public/images/profile2.png` (18MB PNG) — confirmed by `ls -la` — Task 1 depends on this
- `sharp` is available as a transitive Next.js dependency for the image processing script — supported by Next.js 16.x using sharp internally — Task 1 depends on this
- The site is deployed at `https://yosefgamble.com` — supported by `metadataBase` in `layout.tsx:22` — Tasks 2, 3, 5 depend on this
- The user's LinkedIn profile URL is `https://linkedin.com/in/yosefgamble` — supported by `SocialLinks.tsx:39` — Task 3 depends on this
- The user's GitHub profile URL is `https://github.com/yegamble` — supported by `SocialLinks.tsx:34` — Task 3 depends on this

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Source headshot deleted before script runs | Low | Medium (Task 1 fails) | Script checks for file existence before processing |
| `sharp` not available in project environment | Low | Medium | Script falls back to `cp` if sharp unavailable; image works but at suboptimal size |
| LinkedIn cache shows old metadata after deploy | High | Low | Document that user should use LinkedIn Post Inspector to clear cache after deploy |
| Hebrew tagline translation doesn't read naturally | Medium | Medium | Flag for user review during verification; provide literal + natural translation options |

## Goal Verification

### Truths

1. `<meta name="description">` contains all target keywords: "Yosef Gamble", "senior software engineer", "New York", "Auckland", "Go", "Golang", "real estate portal", "video streaming"
2. Open Graph tags render a rich preview when the URL is pasted into LinkedIn Post Inspector — title, description, and image all display
3. Twitter Card tags produce a `summary_large_image` card preview
4. JSON-LD `Person` schema is valid (passes Google Rich Results Test format) and includes `jobTitle`, `knowsAbout`, `sameAs`, and `workLocation`
5. JSON-LD `WebSite` schema includes `name` and `url`
6. `robots.txt` at `/robots.txt` allows all crawlers and references sitemap
7. `sitemap.xml` at `/sitemap.xml` lists the homepage URL
8. The `<h1>` hero tagline mentions Go, TypeScript, video streaming, real estate, NYC, Auckland
9. OG image at `public/images/og-image.jpg` is approximately 1200x630 and under 300KB

### Artifacts

- `src/app/layout.tsx` — enhanced Metadata export with description, OG, Twitter, alternates
- `src/app/json-ld.tsx` — JSON-LD structured data component (Person + WebSite)
- `src/app/robots.ts` — robots.txt generator
- `src/app/sitemap.ts` — sitemap.xml generator
- `public/images/og-image.jpg` — compressed 1200x630 OG image
- `public/locales/en/translation.json` — updated tagline + about text
- `public/locales/he/translation.json` — updated Hebrew tagline + about text
- `scripts/process-images.mjs` — one-time image processing script (OG + avatar)

## E2E Test Scenarios

### TS-001: LinkedIn Share Preview Verification
**Priority:** Critical
**Preconditions:** Site built and running locally
**Mapped Tasks:** Task 1, Task 2

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `http://localhost:3000` | Page loads with updated hero tagline |
| 2 | View page source or inspect `<head>` | `og:title`, `og:description`, `og:image`, `og:url` tags present with correct values |
| 3 | Verify `og:image` URL resolves | Image loads at 1200x630 dimensions |
| 4 | Verify `twitter:card` is `summary_large_image` | Twitter Card meta tag present |

### TS-002: JSON-LD Structured Data
**Priority:** Critical
**Preconditions:** Site built and running locally
**Mapped Tasks:** Task 3

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `http://localhost:3000` | Page loads |
| 2 | View page source, search for `application/ld+json` | Two JSON-LD scripts present (Person + WebSite) |
| 3 | Validate Person schema has `name`, `jobTitle`, `knowsAbout`, `sameAs`, `workLocation` | All required fields present with correct values |
| 4 | Validate WebSite schema has `name`, `url` | Both fields present |

### TS-003: Technical SEO Files
**Priority:** High
**Preconditions:** Site built and running locally
**Mapped Tasks:** Task 5

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `http://localhost:3000/robots.txt` | Robots.txt loads, allows all crawlers |
| 2 | Check robots.txt contains `Sitemap:` directive | Sitemap URL is `https://yosefgamble.com/sitemap.xml` |
| 3 | Navigate to `http://localhost:3000/sitemap.xml` | Valid XML sitemap with homepage URL |

### TS-004: Updated Hero Tagline
**Priority:** High
**Preconditions:** Site running locally
**Mapped Tasks:** Task 4

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `http://localhost:3000` | Page loads |
| 2 | Read the `<h1>` hero tagline | Contains "Go", "TypeScript", "Video streaming", "real estate", "NYC", "Auckland" |
| 3 | Switch to Hebrew via language toggle | Hebrew tagline displays, content is RTL |

## Progress Tracking

- [x] Task 1: Image Processing (OG Image + Avatar Replacement)
- [x] Task 2: Enhanced Metadata (Title, Description, OG, Twitter Card)
- [x] Task 3: JSON-LD Structured Data (Person + WebSite)
- [x] Task 4: Hero Tagline + Visible Content Keyword Enrichment
- [x] Task 5: robots.txt + sitemap.xml

**Total Tasks:** 5 | **Completed:** 5 | **Remaining:** 0

## Implementation Tasks

### Task 1: Image Processing (OG Image + Avatar Replacement)

**Objective:** Create a web-optimized 1200x630 OG image for social sharing AND a compressed avatar to replace the existing `profile.jpg`, both from the user's 18MB headshot.
**Dependencies:** None (`public/images/profile2.png` already exists)
**Mapped Scenarios:** TS-001

**Files:**

- Create: `scripts/process-images.mjs`
- Create: `public/images/og-image.jpg` (output — 1200x630 OG image)
- Modify: `public/images/profile.jpg` (output — replace with compressed avatar from new headshot)
- Delete: `public/images/profile2.png` (18MB source — must not ship to production)

**Key Decisions / Notes:**

- Use `sharp` (available as Next.js transitive dep) for both outputs from `public/images/profile2.png` (18MB PNG)
- **OG image:** Resize to 1200x630 with `cover` fit, center gravity (crops top/bottom of portrait to landscape). JPEG quality 85, target ~100-200KB.
- **Avatar:** Resize to 320x320 (retina-ready for the 160px display size in `ProfilePicture.tsx`), `cover` fit. JPEG quality 85, target ~20-40KB.
- Script produces both outputs in one run, then deletes the 18MB source
- The existing `profile.jpg` (24KB) is replaced — same path, no component changes needed
- Script is one-time-use, stored in `scripts/` for reproducibility

**Definition of Done:**

- [ ] `scripts/process-images.mjs` runs successfully
- [ ] `public/images/og-image.jpg` exists at 1200x630 dimensions, under 300KB
- [ ] `public/images/profile.jpg` is replaced with new compressed avatar at 320x320, under 50KB
- [ ] `public/images/profile2.png` is deleted (18MB source removed)
- [ ] No diagnostics errors

**Verify:**

- `node scripts/process-images.mjs && file public/images/og-image.jpg public/images/profile.jpg && ls -la public/images/`

---

### Task 2: Enhanced Metadata (Title, Description, OG, Twitter Card)

**Objective:** Enrich the Next.js Metadata export with keyword-dense description, complete Open Graph tags with image, Twitter Card, and canonical URL.
**Dependencies:** Task 1 (OG image must exist)
**Mapped Scenarios:** TS-001

**Files:**

- Modify: `src/app/layout.tsx`
- Test: `__tests__/app/layout.test.tsx`

**Key Decisions / Notes:**

- Extend the existing `metadata` export at `src/app/layout.tsx:18-36`
- New meta description target (~155 chars): "Yosef Gamble — Senior Software Engineer in New York & Auckland. Go (Golang), TypeScript, AWS specialist. Real estate portals, video streaming platforms, and scalable cloud systems."
- Add `twitter` metadata object with `card: 'summary_large_image'`, `title`, `description`
- Add `openGraph.images` array pointing to `/images/og-image.jpg` with `width: 1200, height: 630`
- Add `alternates.canonical: 'https://yosefgamble.com'`
- Add `keywords` array for supplementary signal (still used by some engines)
- Keep existing `robots` configuration
- Title format: "Yosef Gamble | Senior Software Engineer — Go, TypeScript, AWS"

**Definition of Done:**

- [ ] Meta description contains all target keywords
- [ ] Open Graph includes `images` array with correct dimensions
- [ ] Twitter Card set to `summary_large_image`
- [ ] Canonical URL set via `alternates`
- [ ] Keywords array includes all target terms
- [ ] All existing layout tests still pass
- [ ] New test assertions verify metadata structure

**Verify:**

- `pnpm test -- --reporter=dot __tests__/app/layout.test.tsx`

---

### Task 3: JSON-LD Structured Data (Person + WebSite)

**Objective:** Add JSON-LD structured data to the page for Google Knowledge Panel eligibility and rich search results.
**Dependencies:** None
**Mapped Scenarios:** TS-002

**Files:**

- Create: `src/app/json-ld.tsx`
- Modify: `src/app/layout.tsx` (import and render JsonLd)
- Create: `__tests__/app/json-ld.test.tsx`

**Key Decisions / Notes:**

- Create a server component `JsonLd` (no `'use client'` — no hooks needed) that renders `<script type="application/ld+json">` tags
- **Person schema** fields:
  - `@type: "Person"`
  - `name: "Yosef Gamble"`
  - `jobTitle: "Senior Software Engineer"`
  - `url: "https://yosefgamble.com"`
  - `image: "https://yosefgamble.com/images/og-image.jpg"`
  - `sameAs: ["https://github.com/yegamble", "https://linkedin.com/in/yosefgamble"]`
  - `knowsAbout: ["Go", "Golang", "TypeScript", "AWS", "Video Streaming", "Real Estate Technology", "ActivityPub", "Docker", "PostgreSQL"]`
  - `workLocation: [{ "@type": "City", "name": "New York" }, { "@type": "City", "name": "Auckland" }]`
  - `alumniOf: [{ "@type": "CollegeOrUniversity", "name": "University of Auckland" }, { "@type": "CollegeOrUniversity", "name": "Central Washington University" }]`
- **WebSite schema** fields:
  - `@type: "WebSite"`
  - `name: "Yosef Gamble"`
  - `url: "https://yosefgamble.com"`
- Follow pattern: single component, two `<script>` tags, or one with `@graph` array
- Render in `layout.tsx` inside `<head>` (Next.js allows `<script>` in body too for JSON-LD)

**Definition of Done:**

- [ ] `src/app/json-ld.tsx` renders valid JSON-LD with Person + WebSite schemas
- [ ] Component is imported and rendered in `layout.tsx`
- [ ] Person schema includes all specified fields
- [ ] JSON-LD is valid JSON (no syntax errors)
- [ ] Test verifies schema structure and required fields
- [ ] No diagnostics errors

**Verify:**

- `pnpm test -- --reporter=dot __tests__/app/json-ld.test.tsx`

---

### Task 4: Hero Tagline + Visible Content Keyword Enrichment

**Objective:** Update the hero tagline to the expertise-focused version and subtly enrich the About section with additional target keywords in both English and Hebrew.
**Dependencies:** None
**Mapped Scenarios:** TS-004

**Files:**

- Modify: `public/locales/en/translation.json`
- Modify: `public/locales/he/translation.json`
- Test: `__tests__/components/i18n-integration.test.tsx` (verify new tagline renders)

**Key Decisions / Notes:**

- **New English tagline** (`hero.tagline`): `"Senior Go & TypeScript engineer. Video streaming, real estate portals, and cloud infrastructure. NYC | Auckland."`
- **New Hebrew tagline** (`hero.tagline`): `"מהנדס Go ו-TypeScript בכיר. סטרימינג וידאו, פורטלי נדל\"ן ותשתיות ענן. ניו יורק | אוקלנד."`
- **About p3 enrichment** — add "Golang" parenthetical for search: change "video streaming backend in Go" → "video streaming backend in Go (Golang)" in both EN and HE
- **About p1 enrichment** — add "senior software engineer" mention: after "into the tech industry" add "as a software engineer" for natural keyword injection
- Keep all changes minimal and natural-sounding — no keyword stuffing
- Update `hero.title` from "Senior Full-Stack Engineer" to "Senior Software Engineer" for broader search match (aligns with target keywords)

**Definition of Done:**

- [ ] English tagline contains: Go, TypeScript, video streaming, real estate, NYC, Auckland
- [ ] Hebrew tagline is a natural translation of the English version
- [ ] About section mentions "Golang" and "software engineer" naturally
- [ ] `hero.title` updated to "Senior Software Engineer" in both languages
- [ ] i18n integration tests pass with updated content
- [ ] No broken translation keys

**Verify:**

- `pnpm test -- --reporter=dot __tests__/components/i18n-integration.test.tsx`

---

### Task 5: robots.txt + sitemap.xml

**Objective:** Add robots.txt and sitemap.xml using Next.js App Router file conventions for search engine discoverability.
**Dependencies:** None
**Mapped Scenarios:** TS-003

**Files:**

- Create: `src/app/robots.ts`
- Create: `src/app/sitemap.ts`
- Create: `__tests__/app/robots.test.ts`
- Create: `__tests__/app/sitemap.test.ts`

**Key Decisions / Notes:**

- Use Next.js App Router conventions: export default functions that return the appropriate objects
- `robots.ts` pattern (from Next.js docs):
  ```ts
  import type { MetadataRoute } from 'next';
  export default function robots(): MetadataRoute.Robots {
    return { rules: { userAgent: '*', allow: '/' }, sitemap: 'https://yosefgamble.com/sitemap.xml' };
  }
  ```
- `sitemap.ts` pattern:
  ```ts
  import type { MetadataRoute } from 'next';
  export default function sitemap(): MetadataRoute.Sitemap {
    return [{ url: 'https://yosefgamble.com', lastModified: new Date(), changeFrequency: 'monthly', priority: 1 }];
  }
  ```
- Simple single-page site — sitemap has one entry
- These are server-side generated files — no client component needed

**Definition of Done:**

- [ ] `/robots.txt` serves valid robots.txt with sitemap reference
- [ ] `/sitemap.xml` serves valid XML sitemap with homepage URL
- [ ] Tests verify the function return values
- [ ] No diagnostics errors

**Verify:**

- `pnpm test -- --reporter=dot __tests__/app/robots.test.ts __tests__/app/sitemap.test.ts`

---

## Open Questions

None — all inputs are available.

### Deferred Ideas

- Dynamic OG image generation with `opengraph-image.tsx` (text overlay with name/title on branded background)
- Multi-language OG metadata (separate OG descriptions per locale)
- Google Search Console verification meta tag
- Favicon/app icon optimization
- Structured data for individual projects (CreativeWork schema)
