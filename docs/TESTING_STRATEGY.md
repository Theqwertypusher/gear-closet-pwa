# Gear Closet — Testing Strategy

**Date:** 2026-05-29

---

## Recommended Approach: Layered Testing

Given that this is a solo-developed, offline-first PWA with no backend, the testing strategy should maximize coverage per unit of effort. The recommended approach is:

```
E2E tests (Playwright)          ← highest value, test real user flows
    ↑
Component tests (Vitest + @testing-library/svelte)  ← unit logic + UI
    ↑
Unit tests (Vitest)             ← pure functions (weightUtils, backup, schemas)
```

---

## Layer 1: Unit Tests (Vitest)

**What to test:**
- `weightUtils.ts` — all conversion functions (g→oz, oz→lbs, etc.), `formatWeight`, `computePackingListWeights`
- `backup.ts` — `exportBackup` shape, `importBackup` parsing, invalid JSON rejection
- `schemas.ts` (Zod) — valid/invalid data shapes for each entity

**Why Vitest:**
- Native to Vite — zero config, shares the same transform pipeline
- Fast (runs in memory, no browser)
- Works with TypeScript out of the box

**Setup:**
```bash
npm install -D vitest @vitest/ui
```

`package.json`:
```json
"scripts": {
  "test": "vitest",
  "test:ui": "vitest --ui"
}
```

**Example:**
```ts
// src/lib/weightUtils.test.ts
import { describe, it, expect } from 'vitest'
import { itemWeightIn } from './weightUtils'

describe('itemWeightIn', () => {
  it('converts grams to ounces', () => {
    expect(itemWeightIn({ weight: 100, weightUnit: 'g' }, 'oz')).toBeCloseTo(3.527)
  })
  it('returns same unit unchanged', () => {
    expect(itemWeightIn({ weight: 500, weightUnit: 'g' }, 'g')).toBe(500)
  })
})
```

---

## Layer 2: Component Tests (Vitest + Testing Library)

**What to test:**
- `GearItemModal` — renders with empty form, submits correct data, validates required fields
- `KitModal` — shows gear items, multi-select works, save emits correct payload
- `CreateListModal` — name input, submit fires, escape closes
- `Settings` — theme toggle fires update, tutorial toggle calls correct store methods
- `WelcomeScreen` — three options render, each calls the right handler

**Why @testing-library/svelte:**
- Tests components through the user's perspective (find by role, label, text)
- Svelte 5 support via `@testing-library/svelte` v5+
- Avoids testing implementation details (internal state), focuses on behavior

**Setup:**
```bash
npm install -D @testing-library/svelte @testing-library/jest-dom jsdom
```

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
```

**Mocking IndexedDB:**
Use `fake-indexeddb` to mock the database in tests:
```bash
npm install -D fake-indexeddb
```

```ts
// src/test/setup.ts
import 'fake-indexeddb/auto'
import '@testing-library/jest-dom'
```

---

## Layer 3: E2E Tests (Playwright) — Highest Value

**What to test (priority order):**

### Critical Path Flows
1. **Add a gear item** → appears in list → correct weight shown
2. **Create a kit** → select items → kit appears with correct weight
3. **Create a packing list** → add category → add item from picker → weight totals update
4. **Add a kit to a category** (empty category: renamed; non-empty: appended)
5. **Export backup** → JSON file downloads with correct structure
6. **Import backup** → data replaces correctly
7. **Tutorial mode on/off** → sample data appears/disappears

### Secondary Flows
8. **Theme toggle** → `dark` class added/removed on `<html>`
9. **Weight unit toggle** → all weights reformat correctly
10. **Keyboard navigation** — tab key moves focus correctly in modals
11. **Delete flows** — confirm step required, item/kit/list/category removed

### PWA / Offline
12. **Service worker registers** — Lighthouse installability check
13. **Offline mode** — disable network, reload, app still loads and data persists

**Why Playwright:**
- Best-in-class for modern web apps
- Mobile viewport emulation (test iPhone Safari layout)
- Network throttling and offline simulation built in
- Auto-wait (no flaky `sleep` hacks)
- Screenshots on failure

**Setup:**
```bash
npm install -D @playwright/test
npx playwright install chromium webkit  # webkit = Safari engine for iOS
```

`playwright.config.ts`:
```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'Desktop Chrome', use: { ...devices['Desktop Chrome'] } },
    { name: 'iPhone 14', use: { ...devices['iPhone 14'] } },
    { name: 'Safari', use: { ...devices['Desktop Safari'] } },
  ],
})
```

**Example E2E test:**
```ts
// e2e/gear.spec.ts
import { test, expect } from '@playwright/test'

test('add a gear item', async ({ page }) => {
  await page.goto('/')
  // Skip welcome screen
  await page.getByRole('button', { name: /start fresh/i }).click()
  
  // Navigate to Gear Closet
  await page.getByRole('button', { name: /gear closet/i }).click()
  
  // Open add item modal
  await page.getByRole('button', { name: /add item/i }).click()
  
  // Fill form
  await page.getByLabel(/name/i).fill('Enlightened Equipment Quilt')
  await page.getByLabel(/brand/i).fill('Enlightened Equipment')
  await page.getByLabel(/weight/i).fill('400')
  
  // Save
  await page.getByRole('button', { name: /save/i }).click()
  
  // Verify appears in list
  await expect(page.getByText('Enlightened Equipment Quilt')).toBeVisible()
  await expect(page.getByText('400')).toBeVisible()
})
```

---

## CI Integration

Add to GitHub Actions (`.github/workflows/test.yml`):

```yaml
name: Tests
on: [push, pull_request]

jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm test -- --run

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run build && npm run preview &
      - run: npx playwright test --project="Desktop Chrome"
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Priority Order for Implementation

1. **Vitest unit tests for `weightUtils`** — pure functions, trivial to test, high breakage risk
2. **Vitest unit test for `backup.ts`** — import parsing is the most likely source of bugs
3. **Playwright E2E: add gear item + create packing list** — core happy path
4. **Playwright E2E: export/import backup round-trip** — data integrity
5. **Playwright E2E: keyboard shortcuts** — regression-prone, hard to test manually
6. **Component tests for modals** — form validation, emit shapes

---

## What NOT to Test

- Svelte store internals (test through components/E2E instead)
- `idb` library itself (it's third-party)
- CSS/Tailwind classes (visual regression is better handled with Percy/Chromatic if needed)
- Tutorial data content (not business logic)
