# Avatar Placeholder SVG Implementation Plan

Created: 2026-04-02
Author: yegamble@gmail.com
Status: VERIFIED
Approved: Yes
Iterations: 0
Worktree: No
Type: Feature

## Summary

**Goal:** Create a flexible, minified SVG avatar placeholder (generic head-and-shoulders silhouette) that shows when the profile image is missing or 404s, replacing the current broken alt-text state.

**Architecture:** The SVG is placed behind the `<Image>` using absolute positioning. When the image fails to load or is missing, the SVG naturally shows through — no JavaScript state, no onError handler. The SVG uses `currentColor` with opacity for colors so it adapts to any container/theme.

**Tech Stack:** Inline SVG in React component, `viewBox` for size flexibility, `currentColor` for theming.

## Scope

### In Scope

- Create a minified, flexible SVG avatar (head + shoulders silhouette)
- SVG uses `currentColor` with opacity — adapts to any background
- SVG uses `viewBox` — scales to fit any container (no fixed dimensions)
- Place SVG behind the Next.js Image in ProfilePicture component
- When image is missing/404, SVG shows through automatically
- Unit tests for fallback behavior

### Out of Scope

- Separate SVG file in `public/` or icon component in `icons/`
- Loading states or skeleton animations
- User-uploaded avatars or dynamic image sources

## Approach

**Chosen:** SVG behind image — no state, no onError

**Why:** The SVG sits absolutely positioned behind the `<Image>` element. When the image loads successfully, it covers the SVG completely. When it fails to load (404, missing file), the SVG shows through naturally. Zero JavaScript state, SSR-friendly, no flash of broken content.

**Alternatives considered:**
1. **onError state toggle** — `useState` + `onError` to swap between Image and SVG. More explicit but adds client-side state, a flash of broken image before fallback, and makes the component a client component (it already is, but adds complexity). Rejected for unnecessary complexity.
2. **Static SVG file in public/** — Cacheable but adds a network request for the fallback. Doesn't show instantly. Rejected.
3. **Icon in icons/ barrel export** — Over-engineered for a single-use component. Rejected.

## Context for Implementer

> Write for an implementer who has never seen the codebase.

- **Patterns to follow:**
  - Icons use `<svg>` with `viewBox`, `fill="currentColor"`, `aria-hidden="true"` — see `src/components/icons/index.tsx:12-24`
  - ProfilePicture is a client component using `useTranslation()` — see `src/components/ProfilePicture.tsx`

- **Key files:**
  - `src/components/ProfilePicture.tsx` — The component to modify. Currently renders a Next.js `<Image>` inside a rounded container with teal ring border and `bg-slate-800` background.
  - `src/components/icons/index.tsx` — Existing icon pattern (for reference, not to modify)
  - `__tests__/components/ProfilePicture.test.tsx` — Existing tests (need updating)

- **Gotchas:**
  - The container already has `bg-slate-800` and `overflow-hidden rounded-full`. The SVG will sit inside this container, absolutely positioned.
  - The container uses `ring-2 ring-primary/50` for the teal border — this stays on the outer div.
  - Next.js `<Image>` component may render differently in test (jsdom) vs browser. Tests should verify the SVG is present in the DOM as a sibling, not worry about visual layering.
  - The SVG must use `viewBox="0 0 100 100"` (or similar) with NO `width`/`height` attributes — it fills whatever container it's in via CSS `w-full h-full`.

- **SVG Design:**
  - Based on Image #2: a circle head centered above rounded shoulders
  - Colors: `currentColor` at different opacities (lighter background circle ~0.1, silhouette ~0.2)
  - Shapes: 1 circle (head), 1 ellipse or path (shoulders), 1 circle (background). Minified.
  - The SVG should look like a generic person silhouette — NOT a detailed face

## Runtime Environment

- **Start command:** `npm run dev` (Turbopack)
- **Port:** 3000

## Assumptions

- The `bg-slate-800` container background serves as the base behind the SVG — supported by `ProfilePicture.tsx:15`. Task 1 depends on this.
- Next.js `<Image>` with a missing `src` file will not render a visible image (the element exists but has no content) — supported by standard Next.js behavior. Task 1 depends on this.
- `overflow-hidden` on the container clips the SVG to the circular shape — supported by `ProfilePicture.tsx:15`. Task 1 depends on this.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Next.js Image renders a broken image icon before the SVG shows | Low | Medium | The `bg-slate-800` background and SVG are behind the image; the container's `overflow-hidden` clips content. If the broken icon shows, add `onError` handler to hide the Image element. |
| SVG silhouette doesn't look polished at small sizes (32px) | Low | Low | Use simple shapes (circle + ellipse) that scale well. Test at both 128px and 160px breakpoints. |

## Goal Verification

### Truths

1. When `/images/profile.jpg` is missing, the ProfilePicture component displays a generic avatar silhouette SVG instead of broken alt-text
2. The SVG avatar uses `currentColor` — it adapts to the container's text color
3. The SVG scales to any container size (tested at 128px and 160px)
4. The circular container clips the SVG properly (no overflow)
5. Unit tests pass
6. TS-001 passes end-to-end

### Artifacts

- `src/components/ProfilePicture.tsx` — modified with inline SVG fallback
- `__tests__/components/ProfilePicture.test.tsx` — updated tests

## E2E Test Scenarios

### TS-001: Avatar Fallback Displays When Image Missing
**Priority:** Critical
**Preconditions:** Dev server running, `/images/profile.jpg` does NOT exist
**Mapped Tasks:** Task 1

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to http://localhost:3000 | Page loads, hero section visible |
| 2 | Look at the profile picture area | A circular avatar with a generic person silhouette (head + shoulders) is visible, NOT broken alt text |
| 3 | Verify the avatar has the teal ring border | Ring border matches the rest of the design |

### TS-002: Avatar Shows Correctly At Different Sizes
**Priority:** High
**Preconditions:** Dev server running, `/images/profile.jpg` does NOT exist
**Mapped Tasks:** Task 1

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to http://localhost:3000 at desktop width | Profile picture area shows the avatar silhouette at ~160px |
| 2 | Resize browser to mobile width (375px) | Avatar scales down to ~128px, still looks correct |

## Progress Tracking

- [x] Task 1: Create SVG avatar fallback in ProfilePicture
      **Total Tasks:** 1 | **Completed:** 1 | **Remaining:** 0

## Implementation Tasks

### Task 1: Create SVG avatar fallback in ProfilePicture

**Objective:** Add an inline SVG avatar placeholder behind the Next.js Image in ProfilePicture. The SVG shows through when the image is missing/404. SVG uses `currentColor` with opacity, `viewBox` for flexibility, and is minified.
**Dependencies:** None
**Mapped Scenarios:** TS-001, TS-002

**Files:**

- Modify: `src/components/ProfilePicture.tsx`
- Modify: `__tests__/components/ProfilePicture.test.tsx`

**Key Decisions / Notes:**

- Make the container `relative` (add `relative` class to the inner div at line 15)
- Add SVG as a child of the container, positioned `absolute inset-0` so it fills the circular container
- SVG structure (minified):
  ```
  <svg viewBox="0 0 100 100" fill="currentColor" aria-hidden="true" class="absolute inset-0 h-full w-full">
    <circle cx="50" cy="50" r="50" opacity="0.1"/>   <!-- background circle -->
    <circle cx="50" cy="38" r="16" opacity="0.2"/>     <!-- head -->
    <ellipse cx="50" cy="80" rx="28" ry="20" opacity="0.2"/>  <!-- shoulders -->
  </svg>
  ```
- The `<Image>` renders on top of the SVG (normal flow). When the image loads, it covers the SVG. When it 404s, the SVG shows.
- Keep the `<Image>` component as-is — do not remove it. The image may exist in production; this is just a fallback.
- The SVG has `aria-hidden="true"` since the Image's alt text provides the accessible label.
- Exact opacity values may need visual tuning — `0.1` for background circle, `0.2` for silhouette is a starting point that works well on `bg-slate-800`.
- **Broken image icon mitigation:** Add `onError` handler to the Image: `onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}` — this hides the browser's native broken-image icon so only the SVG silhouette shows.

**Test updates:**
- Add test: "should render an SVG avatar placeholder" — query with `container.querySelector('svg')`
- Add test: "should render SVG with aria-hidden for accessibility" — `expect(svg).toHaveAttribute('aria-hidden', 'true')`
- Add test: "should render SVG with currentColor fill" — `expect(svg).toHaveAttribute('fill', 'currentColor')`
- Existing tests should still pass (Image element is still present)

**Definition of Done:**

- [ ] Inner container div has `relative` class added (required for SVG absolute positioning)
- [ ] SVG avatar placeholder renders inside the ProfilePicture container
- [ ] SVG uses `viewBox` with no fixed width/height — scales to container
- [ ] SVG uses `currentColor` with opacity for colors
- [ ] SVG is `aria-hidden="true"`
- [ ] Image element still renders with `onError` handler to hide broken-image icon
- [ ] All unit tests pass
- [ ] No diagnostics errors
- [ ] Dev server verification confirms NO broken-image icon overlaps the SVG silhouette when profile.jpg is missing

**Verify:**

- `npm run test -- __tests__/components/ProfilePicture.test.tsx`
- `npm run typecheck`

## E2E Results

| Scenario | Priority | Result | Fix Attempts | Notes |
|----------|----------|--------|--------------|-------|
| TS-001   | Critical | PASS   | 0            | Avatar silhouette displays cleanly, no broken image icon, teal ring visible |
| TS-002   | High     | PASS   | 0            | Scales correctly at desktop (~160px) and mobile 375px (~128px) |
