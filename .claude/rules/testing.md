## Testing — Vitest + Cypress

### Testing Strategy (Layered)

| Layer | Tool | What to Test |
|-------|------|--------------|
| Unit | Vitest + Testing Library | Component rendering, props, user interactions |
| Integration | Vitest + i18n tests | Language switching, component composition |
| E2E | Cypress | Full page flows, scroll behavior, responsive layout |

### Unit Tests (Vitest + Testing Library)

**Location:** `__tests__/components/<ComponentName>.test.tsx`
**Setup:** `__tests__/setup.ts` — imports `jest-dom/vitest` matchers, i18n config, and runs `cleanup()` after each test.

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

it('should toggle language', async () => {
  const user = userEvent.setup();
  render(<LanguageToggle />);
  await user.click(screen.getByRole('button'));
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

### i18n Integration Tests

`__tests__/components/i18n-integration.test.tsx` — tests language switching across all components. When adding a new translatable component, add assertions here.

### E2E Tests (Cypress)

**Location:** `cypress/e2e/portfolio.cy.ts`
**Config:** `cypress.config.ts` (baseUrl: `http://localhost:3000`, viewport: 1280x720)

**Running E2E locally:**
1. Build: `npm run build`
2. Start: `npm run start`
3. Run: `npm run test:e2e` (headless) or `npm run test:e2e:open` (interactive)

**E2E covers:**
- Page load, navigation, anchor links
- Scroll header behavior (IntersectionObserver)
- Responsive layout across mobile (375), tablet (768), desktop (1280) viewports
- Social links, footer attribution

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
