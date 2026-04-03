# Fix Build & Migrate to pnpm Implementation Plan

Created: 2026-04-02
Author: yegamble@gmail.com
Status: PENDING
Approved: Yes
Iterations: 0
Worktree: No
Type: Feature

## Summary

**Goal:** Fix the broken build and migrate from yarn to pnpm as the project's package manager, then commit and push all changes.

**Architecture:** Replace yarn (Corepack-managed) with pnpm (Corepack-managed). Remove yarn lockfile/config, generate pnpm lockfile, update CI workflow, verify OpenNext/Cloudflare build works.

**Tech Stack:** pnpm 10.33.0 (via Corepack), Node 22, GitHub Actions

## Scope

### In Scope

- Remove yarn lockfile, config, and `.yarn/` directory
- Update `packageManager` field in `package.json` to pnpm
- Generate `pnpm-lock.yaml`
- Update CI workflow (`.github/workflows/ci.yml`) from yarn to pnpm
- Update `.gitignore` for pnpm
- Verify `pnpm build` (including OpenNext/Cloudflare build) works locally
- Commit and push all changes

### Out of Scope

- Changing any application code
- Upgrading dependencies
- Changing CI job structure (keeping lint→test→build→e2e→deploy)
- Changing Cloudflare/wrangler configuration

## Approach

**Chosen:** Direct yarn-to-pnpm swap via Corepack

**Why:** pnpm is faster, more disk-efficient, and the project already uses Corepack for package manager management. The `packageManager` field in `package.json` makes the swap clean — just change the value and regenerate the lockfile.

**Alternatives considered:**
- **Install pnpm globally (no Corepack):** Simpler locally but less reproducible in CI; rejected because Corepack is already the project's pattern
- **Use `pnpm/action-setup` in CI:** More explicit but adds an extra action; rejected in favor of Corepack consistency between local and CI

## Context for Implementer

> Write for an implementer who has never seen the codebase.

- **Patterns to follow:** The project currently uses Corepack with `packageManager` field in `package.json:49` — maintain this pattern, just swap yarn→pnpm
- **Conventions:** CI uses `actions/setup-node@v4` — but `cache: 'pnpm'` requires pnpm on PATH first. Reorder: `corepack enable` BEFORE `setup-node`, or remove `cache` from `setup-node` and use `actions/cache@v4` separately
- **Key files:**
  - `package.json` — has `packageManager: "yarn@4.9.4+sha..."` on line 49
  - `.github/workflows/ci.yml` — all 5 jobs use `yarn install --immutable` and `yarn <script>`
  - `.gitignore` — has yarn-specific entries (`.yarn/*`, `!.yarn/patches`, etc.)
  - `.yarnrc.yml` — yarn config (`nodeLinker: node-modules`)
  - `yarn.lock` — yarn lockfile (to be deleted)
  - `.yarn/` — directory with `install-state.gz` (to be deleted)
- **Gotchas:**
  - OpenNext (`node_modules/@opennextjs/aws/dist/build/helper.js:51-75`) detects the package manager by walking up directories looking for lockfiles. It checks `pnpm-lock.yaml` → uses `pnpm build`. The `yarn.lock` MUST be deleted or OpenNext will still detect yarn.
  - `package-lock.json` is already in `.gitignore` — leave it there
  - Corepack blocks using the wrong package manager when `packageManager` is set — the `packageManager` field MUST be updated before running `pnpm install`
  - `pnpm install --frozen-lockfile` is the pnpm equivalent of `yarn install --immutable`
  - For pnpm, `pnpm <script>` works (no `run` needed), same as yarn
  - **CI step ordering:** `actions/setup-node@v4` `cache: 'pnpm'` requires pnpm to be on PATH to determine the store path. `corepack enable` must run BEFORE `setup-node`. Reorder steps: (1) checkout, (2) `corepack enable`, (3) `setup-node` with `cache: 'pnpm'`, (4) `pnpm install --frozen-lockfile`
  - **Cypress CI action:** `cypress-io/github-action@v6` runs its own `install` step by default. Since we install deps earlier, add `install: false` to prevent a second install with potentially misdetected package manager

## Runtime Environment

- **Start command:** `pnpm start` (port 3000)
- **Build command:** `pnpm build` → runs `next build && opennextjs-cloudflare build`
- **Deploy command:** `pnpm deploy` → runs `next build && opennextjs-cloudflare build && opennextjs-cloudflare deploy`

## Assumptions

- Corepack is enabled on the local machine and in CI — supported by current CI config using `corepack enable` — all tasks depend on this
- `pnpm-lock.yaml` generated from `package.json` will resolve all dependencies correctly — supported by `package.json` having standard npm registry deps — Tasks 1, 2 depend on this
- `actions/setup-node@v4` supports `cache: 'pnpm'` — supported by GitHub docs — Task 3 depends on this
- OpenNext will detect pnpm from `pnpm-lock.yaml` and use `pnpm build` — supported by `helper.js:60` — Task 2 depends on this

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| pnpm resolves dependencies differently than yarn, causing missing packages | Low | High | Run full test suite after install; pnpm is strict about peer deps — fix any that surface |
| OpenNext still tries yarn if `yarn.lock` not fully removed | Low | High | Verify `yarn.lock` is deleted before running `pnpm build`; confirm OpenNext detects pnpm |
| CI cache key mismatch on first run | Low | Low | First CI run will be a cache miss — subsequent runs will cache correctly |
| `setup-node` `cache: 'pnpm'` fails if pnpm not on PATH | Medium | High | Run `corepack enable` BEFORE `setup-node` in every CI job |
| `cypress-io/github-action` runs own install with wrong PM | Medium | Medium | Add `install: false` since deps are already installed |

## Goal Verification

### Truths

1. `pnpm build` completes successfully (exit 0), including the OpenNext/Cloudflare build step
2. `pnpm test` passes all unit tests
3. `pnpm lint` and `pnpm typecheck` pass
4. No yarn artifacts remain (`yarn.lock`, `.yarnrc.yml`, `.yarn/`, `packageManager: yarn` in `package.json`)
5. `pnpm-lock.yaml` is committed and tracked
6. CI workflow references only pnpm commands
7. All changes are committed and pushed

### Artifacts

- `package.json` — updated `packageManager` field
- `pnpm-lock.yaml` — new lockfile
- `.github/workflows/ci.yml` — updated for pnpm
- `.gitignore` — updated for pnpm

## Progress Tracking

- [x] Task 1: Remove yarn, configure pnpm
- [ ] Task 2: Verify build and tests
- [ ] Task 3: Update CI workflow
- [ ] Task 4: Update .gitignore and clean up
- [ ] Task 5: Commit and push

**Total Tasks:** 5 | **Completed:** 1 | **Remaining:** 4

## Implementation Tasks

### Task 1: Remove Yarn & Configure pnpm

**Objective:** Remove all yarn configuration and artifacts, set up pnpm as the package manager via Corepack, and install dependencies.
**Dependencies:** None

**Files:**

- Delete: `yarn.lock`
- Delete: `.yarnrc.yml`
- Delete: `.yarn/` (directory)
- Modify: `package.json` (update `packageManager` field)
- Create: `pnpm-lock.yaml` (generated by `pnpm install`)

**Key Decisions / Notes:**

- Delete `yarn.lock`, `.yarnrc.yml`, and `.yarn/` directory first
- Then update `packageManager` in `package.json:49`: remove the yarn value, set to `"pnpm@10.33.0"` (without hash initially)
- Run `corepack enable && corepack use pnpm@10.33.0` — Corepack will download pnpm and write the correct `packageManager` value WITH the verified sha512 hash to `package.json`
- Then run `pnpm install` to generate `pnpm-lock.yaml`
- Verify: `pnpm --version` must return `10.33.0` without integrity errors
- If pnpm reports peer dependency issues, resolve them (pnpm is stricter than yarn about peer deps)

**Definition of Done:**

- [ ] `yarn.lock`, `.yarnrc.yml`, `.yarn/` are deleted
- [ ] `package.json` has `packageManager` pointing to pnpm@10.33.0
- [ ] `pnpm-lock.yaml` exists and `node_modules/` is populated
- [ ] `pnpm install` exits cleanly (no errors)

**Verify:**

- `ls yarn.lock .yarnrc.yml .yarn/ 2>&1` → all "No such file"
- `cat package.json | grep packageManager` → shows pnpm
- `pnpm install --frozen-lockfile` → exits 0

---

### Task 2: Verify Build and Tests

**Objective:** Confirm that `pnpm build` (including OpenNext/Cloudflare), tests, lint, and typecheck all pass with pnpm.
**Dependencies:** Task 1

**Files:**

- None (verification only)

**Key Decisions / Notes:**

- `pnpm build` runs `next build && opennextjs-cloudflare build` — the OpenNext step must detect pnpm from `pnpm-lock.yaml` and NOT try yarn/bun
- Watch for the "Failed to get registry from yarn" or "bun: command not found" errors — these mean OpenNext is still detecting the wrong package manager
- Run in order: `pnpm typecheck` → `pnpm lint` → `pnpm test` → `pnpm build`

**Definition of Done:**

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` passes all tests
- [ ] `pnpm build` exits 0 (no yarn/bun errors in output)

**Verify:**

- `pnpm typecheck && pnpm lint && pnpm test && pnpm build`

---

### Task 3: Update CI Workflow

**Objective:** Update `.github/workflows/ci.yml` to use pnpm instead of yarn across all 5 jobs.
**Dependencies:** Task 1

**Files:**

- Modify: `.github/workflows/ci.yml`

**Key Decisions / Notes:**

- **Step ordering in every job** (critical — `setup-node` `cache: 'pnpm'` needs pnpm on PATH):
  1. `actions/checkout@v4`
  2. `Enable Corepack` step: `corepack enable`
  3. `actions/setup-node@v4` with `node-version: '22'` and `cache: 'pnpm'`
  4. `Install dependencies`: `pnpm install --frozen-lockfile`
  5. Remaining steps with `pnpm` commands
- Replace all yarn commands:
  - `yarn lint` → `pnpm lint`
  - `yarn typecheck` → `pnpm typecheck`
  - `yarn test` → `pnpm test`
  - `yarn build` → `pnpm build`
  - `yarn start` → `pnpm start`
  - `yarn deploy` → `pnpm deploy`
- In `e2e-tests` job: add `install: false` to `cypress-io/github-action@v6` (deps already installed), update `start: pnpm start`

**Definition of Done:**

- [ ] No references to `yarn` remain in `.github/workflows/ci.yml`
- [ ] All 5 jobs use `pnpm` commands
- [ ] `cache: 'pnpm'` is set in all `setup-node` steps
- [ ] `corepack enable` runs BEFORE `setup-node` in every job
- [ ] `cypress-io/github-action` has `install: false`

**Verify:**

- `grep yarn .github/workflows/ci.yml || echo "No yarn references (expected)"`
- `grep -c pnpm .github/workflows/ci.yml` → confirms pnpm references

---

### Task 4: Update .gitignore and Clean Up

**Objective:** Remove yarn-specific gitignore entries, add pnpm-specific entries if needed.
**Dependencies:** Task 1

**Files:**

- Modify: `.gitignore`

**Key Decisions / Notes:**

- Remove yarn-specific lines (`.gitignore:3-8`):
  ```
  /.pnp
  .pnp.*
  .yarn/*
  !.yarn/patches
  !.yarn/plugins
  !.yarn/releases
  !.yarn/versions
  ```
- Remove `yarn-debug.log*` and `yarn-error.log*` from debug section
- Keep `pnpm-debug.log*` (already present at line 36)
- Keep `package-lock.json` in `.gitignore` (line 49) to avoid npm generating a competing lockfile
- No need to add `pnpm-lock.yaml` to gitignore — it should be committed

**Definition of Done:**

- [ ] No yarn-specific entries in `.gitignore`
- [ ] `pnpm-debug.log*` is present
- [ ] `.gitignore` is clean and well-organized

**Verify:**

- `grep -i yarn .gitignore || echo "No yarn references (expected)"`
- `grep pnpm .gitignore` → shows `pnpm-debug.log*`
- `grep pnpm-lock .gitignore || echo "pnpm-lock.yaml is NOT gitignored (expected)"`

---

### Task 5: Commit and Push

**Objective:** Stage all changes, commit with a descriptive message, and push to origin.
**Dependencies:** Tasks 1-4

**Files:**

- All modified/created/deleted files from Tasks 1-4

**Key Decisions / Notes:**

- Commit message: `chore: migrate from yarn to pnpm`
- Body should list what changed: removed yarn config, added pnpm lockfile, updated CI, updated gitignore
- Push to current branch (main)
- ⚠️ This task requires explicit user permission per project rules (git write operations)

**Definition of Done:**

- [ ] `pnpm-lock.yaml` is staged/committed (verify with `git status` before committing)
- [ ] All changes committed
- [ ] Pushed to origin/main

**Verify:**

- `git status` → clean working tree
- `git log --oneline -1` → shows the commit
- `git show --stat HEAD` → includes `pnpm-lock.yaml` in changed files
