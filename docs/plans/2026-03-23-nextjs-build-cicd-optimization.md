# Next.js Build, CI/CD & Cloudflare Workers Optimization Plan

Created: 2026-03-23
Status: VERIFIED
Approved: Yes
Iterations: 0
Worktree: No
Type: Feature

## Summary

**Goal:** Optimize the Next.js portfolio for faster build/run times, rewrite the GitHub Actions CI pipeline with best practices (Yarn 4, caching, deploy), and add auto-deploy to Cloudflare Workers on push to main.

**Architecture:** Rewrite `.github/workflows/ci.yml` to use Yarn 4 (via Corepack), add dependency and Next.js build caching, add a Wrangler deploy job gated on tests passing. Apply Next.js config optimizations (console stripping, package import optimization). Fix the pre-existing i18n test failure.

**Tech Stack:** Next.js 16.1, Yarn 4.9.4, GitHub Actions, Wrangler 4, @opennextjs/cloudflare, Vitest 4

## Scope

### In Scope

- Rewrite CI workflow: npm → Yarn 4, proper caching, parallel jobs
- Add Cloudflare Workers deploy job to CI (requires `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets)
- Next.js build optimizations in `next.config.ts`
- Fix pre-existing i18n test failure (Hebrew profile picture alt text)
- Update `.gitignore` for OpenNext build artifacts

### Out of Scope

- Bundle splitting / code splitting changes (site is already static, 3 pages)
- Image optimization pipeline (no images in public/ currently)
- Cypress E2E rewrite or new E2E tests
- Preview deploy environments for PRs (deferred idea)
- CDN/edge caching configuration on Cloudflare

## Context for Implementer

> Write for an implementer who has never seen the codebase.

- **Patterns to follow:**
  - `package.json:5-16` — existing scripts structure, add new scripts alongside
  - `next.config.ts:17-57` — NextConfig object with security headers; add build opts to same object
  - `.github/workflows/ci.yml` — complete rewrite, keep same job names for familiarity

- **Conventions:**
  - Yarn 4 with `nodeLinker: node-modules` (`.yarnrc.yml`)
  - `packageManager` field in `package.json` enforces Yarn version via Corepack
  - Path alias `@/*` → `./src/*`
  - Tests in `__tests__/` directory (mirrors `src/` structure)

- **Key files:**
  - `.github/workflows/ci.yml` — CI pipeline (currently broken: uses npm, project uses Yarn 4)
  - `next.config.ts` — Next.js configuration, security headers
  - `wrangler.jsonc` — Cloudflare Workers config (already created)
  - `package.json` — scripts, deps, packageManager field
  - `__tests__/components/i18n-integration.test.tsx:117-121` — failing test

- **Gotchas:**
  - CI currently uses `npm ci` but `package-lock.json` is in `.gitignore` — npm installs will fail or be non-deterministic
  - Yarn 4 in CI needs `corepack enable` before `yarn install`
  - `@opennextjs/cloudflare` build produces `.open-next/` directory that should be gitignored
  - Cloudflare deploy needs `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as GitHub repo secrets
  - The `.env` file exists locally but is not committed; CI needs env vars set via GitHub secrets or defaults

- **Domain context:** This is a personal portfolio site — single-page, static, bilingual (en/he). All pages are prerendered at build time (`○ (Static)`). No API routes, no dynamic data.

## Runtime Environment

- **Start command:** `yarn start` (port 3000)
- **Deploy command:** `yarn deploy` (`opennextjs-cloudflare build && opennextjs-cloudflare deploy`)
- **Build command:** `yarn build` (`next build`)

## Assumptions

- Cloudflare API token and account ID will be added as GitHub repo secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) — Task 3 depends on this
- The Cloudflare Pages auto-deploy (if configured) should be disabled after CI deploy is set up — user responsibility, not automated
- The Hebrew alt text test failure is caused by ProfilePicture not translating its alt text — Task 4 depends on this being the root cause
- `vite-tsconfig-paths` plugin works correctly at current versions; the deprecation warning is informational only (`resolve.tsconfigPaths` is a Vite 7 feature, not available in Vite 6/Vitest 4) — keeping the plugin as-is

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Cloudflare deploy fails in CI due to missing secrets | High (first run) | Deploy job fails, code still passes CI | Deploy job only runs on `main` push (not PRs), clear error message in job output. README note about required secrets. |
| Yarn cache key mismatch causes stale installs | Low | Wrong deps installed | Cache key includes `yarn.lock` hash; fallback to no cache on miss |
| OpenNext build incompatible with current Next.js config | Low | Deploy fails | `opennextjs-cloudflare build` runs after `next build`; if it fails, standard CI still passes |
| `opennextjs-cloudflare build` fails in deploy job | Low | Deploy fails, CI tests still pass | Deploy job does a full rebuild (`next build` + OpenNext wrap); if it fails, test/build jobs are unaffected |

## Goal Verification

### Truths

1. `yarn install --immutable` succeeds in CI (no lockfile modification)
2. All 349+ tests pass (0 failures, including the fixed Hebrew alt text test)
3. `yarn build` completes with `next build` in CI
4. Deploy job runs `opennextjs-cloudflare build && wrangler deploy` on main push
5. CI uses Yarn dependency caching (cache hit on unchanged `yarn.lock`)
6. `next.config.ts` includes `compiler.removeConsole` and `optimizePackageImports`
7. `.open-next/` directory is gitignored

### Artifacts

1. `.github/workflows/ci.yml` — rewritten CI pipeline
2. `next.config.ts` — build optimizations added
3. `__tests__/components/i18n-integration.test.tsx` or `src/components/ProfilePicture.tsx` — test fix
4. `.gitignore` — OpenNext artifacts added

## Progress Tracking

- [x] Task 1: Rewrite CI workflow for Yarn 4 with caching
- [x] Task 2: Add Next.js build optimizations
- [x] Task 3: Add Cloudflare Workers deploy job to CI
- [x] Task 4: Fix pre-existing i18n test failure
- [x] Task 5: Update .gitignore for OpenNext artifacts

**Total Tasks:** 5 | **Completed:** 5 | **Remaining:** 0

## Implementation Tasks

### Task 1: Rewrite CI Workflow for Yarn 4 with Caching

**Objective:** Replace the broken npm-based CI with a Yarn 4 pipeline that uses Corepack, proper dependency caching, and parallel lint/typecheck/test jobs.

**Dependencies:** None

**Files:**

- Modify: `.github/workflows/ci.yml`

**Key Decisions / Notes:**

- Enable Corepack (`corepack enable`) before any Yarn command — this reads `packageManager` from `package.json` and uses the correct Yarn version
- Cache Yarn dependencies using `actions/cache@v4` with key based on `yarn.lock` hash
- Keep existing job structure: `lint-and-typecheck` + `unit-tests` (parallel) → `build` → `e2e-tests`
- Use `actions/setup-node@v4` with `cache: 'yarn'` — this natively supports Yarn caching when Corepack is enabled
- Add `.env.example` copy step for builds that need env vars (or set defaults via `env:` in workflow)
- E2E job downloads the build artifact and starts the server, same pattern as current

**Definition of Done:**

- [ ] All tests pass
- [ ] No diagnostics errors
- [ ] `yarn install --immutable` works in CI (lockfile not modified)
- [ ] Dependency cache hits on repeated runs with unchanged `yarn.lock`
- [ ] lint, typecheck, and unit tests all run successfully with Yarn

**Verify:**

- `yarn install --immutable` (locally, to verify lockfile is clean)
- Review workflow YAML syntax: `actionlint` or manual review

---

### Task 2: Add Next.js Build Optimizations

**Objective:** Add build-time optimizations to `next.config.ts` that reduce bundle size and improve runtime performance.

**Dependencies:** None

**Files:**

- Modify: `next.config.ts`
- Modify: `__tests__/config/next-config.test.ts` (if it tests config properties)

**Key Decisions / Notes:**

- Add `compiler.removeConsole: { exclude: ['error', 'warn'] }` — strips `console.log` from production builds
- Add `optimizePackageImports: ['react-i18next', 'i18next']` — tree-shakes unused exports from these packages
- Do NOT add `output: 'standalone'` — OpenNext handles its own output format
- Keep all existing security headers unchanged

**Definition of Done:**

- [ ] All tests pass
- [ ] No diagnostics errors
- [ ] `yarn build` succeeds with new config options
- [ ] `console.log` calls are stripped from production output (verify via build output or grep `.next/`)

**Verify:**

- `yarn build`
- `yarn test`

---

### Task 3: Add Cloudflare Workers Deploy Job to CI

**Objective:** Add a deploy job to the CI workflow that builds with OpenNext and deploys to Cloudflare Workers using Wrangler, triggered only on push to main.

**Dependencies:** Task 1

**Files:**

- Modify: `.github/workflows/ci.yml`

**Key Decisions / Notes:**

- Deploy job runs after `e2e-tests` job passes, only on `push` to `main` (not on PRs)
- Use condition: `if: github.event_name == 'push' && github.ref == 'refs/heads/main'`
- **Rebuild strategy:** The deploy job does a full rebuild (checkout → install → `yarn deploy`). `yarn deploy` runs `opennextjs-cloudflare build` which internally runs `next build` then wraps it for Workers. This avoids artifact download complexity at the cost of ~90s extra build time — acceptable for a deploy that only runs on main push.
- Steps: checkout → setup-node → corepack enable → yarn install (cached) → copy `.env.example` to `.env` → `yarn deploy`
- Environment secrets: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` (read from GitHub repo secrets)
- If deploy fails, CI still shows green for the test/build jobs — deploy failure is separate

**Definition of Done:**

- [ ] All tests pass
- [ ] No diagnostics errors
- [ ] Deploy job appears in CI workflow, gated on e2e-tests and main branch
- [ ] Deploy job uses `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets
- [ ] Deploy job does NOT run on pull requests

**Verify:**

- Review workflow YAML for correct `if:` conditions and secret references
- `yarn deploy` (local dry-run to verify OpenNext build works)

---

### Task 4: Fix Pre-existing i18n Test Failure

**Objective:** Fix the failing test "should render profile picture with Hebrew alt text" in `__tests__/components/i18n-integration.test.tsx`.

**Dependencies:** None

**Files:**

- Modify: `src/components/ProfilePicture.tsx` or `__tests__/components/i18n-integration.test.tsx`
- Possibly modify: `public/locales/he/translation.json` (if Hebrew alt text is missing)

**Key Decisions / Notes:**

- The test at line 117-121 expects a Hebrew alt text (`/תמונת פרופיל של יוסף גמבל/`) but the rendered image has English alt text (`"Yosef Gamble profile photo"`)
- Root cause: either ProfilePicture doesn't use `t()` for its alt text, or the Hebrew translation key is missing
- Need to read `ProfilePicture.tsx` and the translation JSON to determine the fix
- Follow existing pattern: other components use `t('section.key')` for translated text

**Definition of Done:**

- [ ] All 349+ tests pass (0 failures)
- [ ] No diagnostics errors
- [ ] Hebrew mode renders the profile picture with Hebrew alt text
- [ ] English mode still renders the profile picture with English alt text

**Verify:**

- `yarn test`

---

### Task 5: Update .gitignore for OpenNext Artifacts

**Objective:** Add `.open-next/` to `.gitignore` to prevent OpenNext build artifacts from being committed.

**Dependencies:** None

**Files:**

- Modify: `.gitignore`

**Key Decisions / Notes:**

- `opennextjs-cloudflare build` creates a `.open-next/` directory with the Workers-ready build
- This is a build artifact, should not be committed (same as `.next/`)
- Add it near the existing `.next/` and `/out/` entries

**Definition of Done:**

- [ ] `.open-next/` is in `.gitignore`
- [ ] No diagnostics errors

**Verify:**

- `grep 'open-next' .gitignore`

---

## Deferred Ideas

- **PR preview deploys:** Use `wrangler deploy --env preview` on PRs for staging URLs
- **Lighthouse CI:** Add performance budget checks in CI using `@lhci/cli`
- **Dependency update automation:** Renovate or Dependabot for automated dep PRs
