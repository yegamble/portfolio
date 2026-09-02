## Testing — Vitest + Cypress

### Testing Strategy (Layered)

| Layer | Tool | What to Test |
|-------|------|--------------|
| Unit | Vitest + Testing Library | Component rendering, props, user interactions |
| Integration | Vitest + i18n tests | Language switching, component composition |
| E2E | Cypress | Full page flows, scroll behavior, responsive layout |
| Browser perf | Playwright (`playwright/`) | Cipher animation cost, layout stability during language switches |
| Accessibility | Playwright + `@axe-core/playwright` (`playwright/a11y.spec.ts`) | Zero WCAG 2.0/2.1/2.2 A and AA violations on `/en` and `/he` at 1280×900 and 390×844 |

### Unit Tests (Vitest + Testing Library)

**Location:** `__tests__/components/<ComponentName>.test.tsx` (also `__tests__/app/`, `__tests__/lib/`, `__tests__/hooks/`, `__tests__/data/`, `__tests__/config/`, and `__tests__/locales/` — which asserts the **production** translation files and the fixtures' parity with them, and is the one place that must import `public/locales/*.json` directly: `setup.ts` registers the fixtures over the shared bundles, so `getLocaleMessages()` returns fixture content inside Vitest)
**Setup:** `__tests__/setup.ts` — imports `jest-dom/vitest` matchers, registers the **fixture translations** from `__tests__/fixtures/translations/{lng}.json` over the production bundles (so production résumé edits never break tests — assert against fixture text, not production text), sets test env vars, and runs `cleanup()` after each test.

Three files sit outside that mirror and are easy to miss:

| File | What it is |
|------|------------|
| `__tests__/proxy.test.ts` | `src/proxy.ts` at the root of `src/`, so its test is at the root of `__tests__/`: the locale-less redirect, `Accept-Language` negotiation, the cookie writers, `x-locale`, and the security headers on the redirect |
| `__tests__/helpers/observers.ts` | `stubIntersectionObserver`, `stubResizeObserver` and `stubMatchMedia` — jsdom implements none of the three. It re-exports the media query strings from `src/lib/media.ts`, so a stub cannot answer a question the app no longer asks. Use these rather than assigning over a global; each hands back a `restore()` for an `afterEach` |
| `__tests__/fixtures/test-data.ts` | Non-translatable fixtures (`testExperienceEntries`, `testProjectEntries`) mirroring `src/data/*`, including the edge cases production no longer has — a `companyUrl: '#'`, a URL with query and hash |

**Every component has a corresponding test file.** Maintain 1:1 mapping.

**Test structure:**
```tsx
import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Component from '@/components/Component';

describe('Component', () => {
  it('should render heading', () => {
    render(<Component />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Expected');
  });
});
```

### Best Practices — Unit Tests

**Test behavior, not implementation:**
- Test what users see and do, not internal state or methods
- If refactoring doesn't change behavior, tests shouldn't break
- Focus on inputs (props, interactions) and outputs (rendered DOM, callbacks)

**Query priority (accessibility-first):**
1. `getByRole` — buttons, headings, links, navigation
2. `getByLabelText` — form inputs
3. `getByText` — static content
4. `getByTestId` — last resort only

**Use `screen` for queries** — not destructured `container`:
```tsx
// Good
render(<Component />);
expect(screen.getByRole('heading')).toBeInTheDocument();

// Avoid
const { container } = render(<Component />);
container.querySelector('.heading'); // brittle
```

**Use `userEvent` over `fireEvent` for interactions:**
```tsx
import userEvent from '@testing-library/user-event';

it('should switch language', async () => {
  const user = userEvent.setup();
  render(<LanguageSelector />);
  await user.click(screen.getByRole('button', { name: /select language/i }));
  await user.click(screen.getByRole('link', { name: /eesti/i }));
  // assert language changed
});
```

**Use `within()` to scope queries:**
```tsx
const section = screen.getByRole('region', { name: /experience/i });
expect(within(section).getAllByRole('listitem')).toHaveLength(3);
```

**Name tests descriptively — describe user behavior:**
```tsx
// Good
it('should display all three job entries with dates and titles')
it('should show technology tags for each position')

// Avoid
it('renders correctly')
it('works')
```

### Gates CI Runs (and the local commands that match them)

`lint-and-typecheck` runs `pnpm lint`, `pnpm typecheck` **and `pnpm format:check`**.
Formatting alone fails the job; `pnpm format` writes the fixes.

`unit-tests` runs **`pnpm test:coverage`**, not `pnpm test`, so a change that passes
locally can still fail CI on coverage. The floors live in `vitest.config.ts` and are
ratcheted to just under the measured numbers:

| Metric | Floor |
|--------|-------|
| Statements | 96 |
| Branches | 90 |
| Functions | 97 |
| Lines | 97 |

`include: ['src/**']`, with no exclusions. Raise a floor when the real number moves up;
never lower one to make a change fit.

### Playwright: two projects, and `testMatch` is a closed list

`playwright.config.ts` splits the specs into two projects, and **each one matches its
spec files by name**:

| Project | `testMatch` | Runs | Gates the deploy? |
|---------|-------------|------|-------------------|
| `layout` | `/(layout-stability\|a11y)\.spec\.ts/` | 16 tests — geometry and axe | Yes (`playwright` job) |
| `perf` | `/(cipher-performance\|height-ease)\.spec\.ts/` | 6 tests — frame rate, long tasks, animation shape | No (`playwright-perf`, `continue-on-error`) |

Those regexes are closed lists, not patterns: **a new `playwright/<name>.spec.ts` matches
no project and silently never runs**, locally or in CI. Add its basename to whichever
regex fits — deterministic geometry or accessibility goes in `layout`, anything measuring
wall-clock time goes in `perf`. They stay closed deliberately: `layout` blocks the
deploy, so a spec must be classified on purpose rather than land there by being new.

Locally `pnpm test:playwright` runs both projects in one process against `next dev`
(the perf project declares `dependencies: ['layout']` so the two never share the
machine). Under `CI` the config switches `webServer.command` to `next start`, refuses to
reuse a server, and the two projects run as two jobs on two runners — which is why the
dependency is dropped there.

### i18n Integration Tests

`__tests__/components/i18n-integration.test.tsx` — tests language switching across all components, with one describe block per language plus selector-flow and structural-integrity blocks. When adding a new translatable component, add assertions here. When adding a new language, follow the checklist in `i18n.md`.

### E2E Tests (Cypress)

**Location:** `cypress/e2e/portfolio.cy.ts`
**Config:** `cypress.config.ts` (baseUrl: `http://localhost:3000`, viewport: 1280x720)

**Running E2E locally:**
1. Build: `pnpm build`
2. Start: `pnpm start`
3. Run: `pnpm test:e2e` (headless) or `pnpm test:e2e:open` (interactive)

Note: `src/proxy.ts` redirects `/` to the locale route (`/en` by default, or whatever `Accept-Language` asks for), so specs land on localized URLs.

**E2E covers:**
- Page load, navigation, anchor links
- Scroll header behavior (IntersectionObserver)
- Responsive layout across mobile (375), tablet (768), desktop (1280) viewports
- Social links, footer attribution
- Locale routing and 404s (via `cy.request`, so status codes and headers are asserted directly): the `Accept-Language` redirect, the absence of `Set-Cookie` on `/en`, and the localized `global-not-found` document for `/en/does-not-exist` and `/he/does-not-exist`

### Best Practices — E2E

**Use `data-*` or `aria-*` selectors over CSS classes:**
```tsx
// Good — resilient to style changes
cy.get('[aria-label="Main navigation"]')
cy.get('#experience')

// Avoid — breaks when CSS changes
cy.get('.sticky-header .nav-link')
```

**Keep E2E focused on critical user flows:**
- Don't duplicate unit test coverage in E2E
- E2E tests are slower — test happy paths and critical interactions
- Use unit tests for edge cases and error states

**Test responsive behavior explicitly:**
```tsx
const viewports = [['mobile', 375, 812], ['tablet', 768, 1024], ['desktop', 1280, 900]];
viewports.forEach(([name, w, h]) => {
  describe(`${name}`, () => {
    beforeEach(() => { cy.viewport(w, h); cy.visit('/'); });
    // assertions
  });
});
```

**Avoid `cy.wait()` with arbitrary timeouts** — use `cy.get()` with `{ timeout }` for element-based waits.

### When Adding a New Component

1. Create unit test in `__tests__/components/<Name>.test.tsx`
2. If component uses `t()`, add language toggle assertions to `i18n-integration.test.tsx`
3. If component is a new section, add E2E assertions to `cypress/e2e/portfolio.cy.ts`
4. Test accessibility: roles, aria labels, heading levels, keyboard navigation
5. If it needs a **Playwright** spec, add the new file's basename to one of the two
   `testMatch` regexes in `playwright.config.ts` — a spec matched by neither project
   never runs and never reports

Before pushing: `pnpm lint && pnpm typecheck && pnpm format:check && pnpm test:coverage`
is the set the pipeline gates on.
