# Gear Closet — Technical RFC

**Version:** 1.0  
**Date:** 2026-05-29  
**Status:** Implemented

---

## 1. Problem Statement

Build a gear management PWA that:
- Works fully offline (no backend)
- Persists data across sessions on-device
- Installs as a native-feeling app on iOS and Android
- Ships fast and stays maintainable by a solo developer
- Requires zero infrastructure cost to run

---

## 2. Tech Stack Decision

### Chosen: Svelte 5 + Vite + Tailwind CSS v4 + IndexedDB (idb)

#### Why Svelte 5

| Consideration | Svelte 5 | React | Vue 3 |
|---|---|---|---|
| Bundle size | ~10 KB runtime | ~45 KB | ~35 KB |
| Boilerplate | Minimal (runes = fine-grained reactivity) | High (hooks, memoization) | Medium |
| Compiler | Compiles to vanilla JS, no VDOM overhead | Virtual DOM diffing | Virtual DOM diffing |
| TypeScript | First-class | First-class | First-class |
| DX for solo dev | Excellent — fewer abstractions | Verbose | Good |
| Ecosystem | Growing, lucide + dnd-action available | Massive | Large |

Svelte 5's rune system (`$state`, `$derived`, `$effect`, `$props`) provides fine-grained reactivity with compile-time optimizations. For a CRUD PWA with no complex async state, this is ideal — no need for Redux/Zustand/Pinia.

**Key Svelte 5 patterns used in this codebase:**
- `$state` — local reactive state (replaces `let` + `$:`)
- `$derived` — computed values (replaces `$: derived = ...`)
- `$effect` — side effects / event listeners (replaces `onMount` + `$:`)
- `$props` — typed component props (replaces `export let`)
- `$state.snapshot()` — deep clone of reactive state (for local copy pattern)
- Svelte actions (`use:focusTrap`) — reusable DOM behavior

#### Why Vite

- Best-in-class HMR for Svelte
- Native ESM in dev, optimized rollup build in prod
- `vite-plugin-pwa` integrates Workbox service worker generation with zero config
- Build times under 2s for this project size

#### Why Tailwind CSS v4

- Utility-first removes the need for a CSS architecture decision
- v4's Vite plugin eliminates the PostCSS config step
- Dark mode via `dark:` class prefix (toggled on `<html>`) — simple and reliable
- No runtime CSS-in-JS overhead

#### Why IndexedDB (via `idb`)

| Storage Option | Max Size | Structured Data | Offline | Indexed Queries |
|---|---|---|---|---|
| localStorage | ~5 MB | No (string only) | Yes | No |
| sessionStorage | ~5 MB | No | No | No |
| IndexedDB | 50+ MB (quota-based) | Yes | Yes | Yes |
| OPFS | Very large | Binary | Yes | No |

IndexedDB is the right choice for a gear catalog that could grow to hundreds of items. The `idb` wrapper provides a Promise-based API over the native callback hell.

**Object stores:**
- `gearItems` — keyed by `id`
- `kits` — keyed by `id`
- `packingLists` — keyed by `id`
- `settings` — keyed by `key` (single-row style)

---

## 3. Architecture

```
src/
├── App.svelte              # Root: tab routing, global keyboard shortcuts, theme
├── components/
│   ├── GearCloset.svelte   # Gear inventory list + tag filter bar
│   ├── GearItemModal.svelte # Add/edit gear item
│   ├── GearItemRow.svelte  # Single gear item display
│   ├── Kits.svelte         # Kit list + empty guard
│   ├── KitCard.svelte      # Single kit display with delete confirm
│   ├── KitModal.svelte     # Add/edit kit (gear item multi-select)
│   ├── PackingLists.svelte # List of packing lists
│   ├── PackingListDetail.svelte # Full list view with categories/items
│   ├── CreateListModal.svelte   # New list name input
│   ├── Settings.svelte     # All settings + data management
│   └── WelcomeScreen.svelte     # First-run onboarding
├── lib/
│   ├── stores/
│   │   ├── gearStore.svelte.ts    # Svelte 5 class-based reactive store
│   │   ├── kitStore.svelte.ts
│   │   ├── packingListStore.svelte.ts
│   │   └── settingsStore.svelte.ts
│   ├── db.ts              # IndexedDB schema + CRUD operations
│   ├── backup.ts          # Export/import JSON backup logic
│   ├── focusTrap.ts       # Svelte action for modal focus management
│   ├── schemas.ts         # Zod validation schemas (used on import)
│   ├── tutorialData.ts    # In-memory sample data for tutorial mode
│   ├── types.ts           # TypeScript type definitions
│   └── weightUtils.ts     # Weight conversion + formatting
```

### State Management Pattern

Each store is a Svelte 5 class with `$state` fields:

```ts
class GearStore {
  items = $state<GearItem[]>([])
  loaded = $state(false)
  
  async load() { /* reads from IndexedDB */ }
  async addItem(data) { /* writes to IndexedDB, updates $state */ }
  // ...
}
export const gearStore = new GearStore()
```

Stores are singletons instantiated at module load. Components import and read from stores directly — no prop drilling for global data.

### Cross-Component Communication

Rather than prop drilling or a global event bus, cross-component navigation uses `CustomEvent` on `window`:

```ts
// Dispatch (from any component):
window.dispatchEvent(new CustomEvent('navigate:tab', { detail: 'kits' }))

// Listen (in App.svelte):
window.addEventListener('navigate:tab', e => activeTab = e.detail)
```

Keyboard shortcut events follow the same pattern (`shortcut:add`, `shortcut:escape`, `shortcut:add-item-next`, etc.), allowing App.svelte to remain the single source of truth for key state while child components handle their own shortcut responses.

### Tutorial Mode

Tutorial data never touches IndexedDB. Each store has a `tutorialMode` flag that causes `load()` and `reset()` to return in-memory fixtures instead of querying the database. Turning off tutorial mode flips the flag and calls `reset()` to reload real data.

---

## 4. PWA Configuration

### Service Worker (Workbox via vite-plugin-pwa)

- `registerType: 'autoUpdate'` — SW updates automatically in background, new version activates on next navigation
- Workbox `generateSW` strategy precaches all built assets
- App shell (index.html + JS/CSS) served from cache on repeat loads

### Web App Manifest

```json
{
  "name": "Gear Closet",
  "short_name": "Gear Closet",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#1a1a1a",
  "background_color": "#ffffff",
  "start_url": "/",
  "icons": [
    { "src": "pwa-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "pwa-512x512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "pwa-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

**Known gap:** The maskable icon uses the same PNG as the standard icon. A proper maskable icon should have a safe zone (inner 80% contains artwork, outer 20% is bleed). This affects how the icon renders on Android.

### index.html Gaps (Lighthouse impact)

Current `index.html` is missing several meta tags that affect Lighthouse and installability:

```html
<!-- Missing / needs update: -->
<title>Gear Closet</title>  <!-- currently "gear-closet-pwa" -->
<meta name="description" content="Manage your outdoor gear, kits, and packing lists — offline.">
<meta name="theme-color" content="#1a1a1a">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
```

---

## 5. Data Storage Alternatives Considered

### Option A: localStorage (rejected)
- 5 MB limit too restrictive for large gear catalogs
- No structured querying
- Synchronous API blocks the main thread on large reads

### Option B: IndexedDB with raw API (rejected)
- Callback-based API is verbose and error-prone
- `idb` wrapper provides identical capability with Promise API

### Option C: SQLite via WASM (considered, rejected for v1)
- `sql.js` or `sqlite-wasm` would enable complex queries
- Adds 500 KB+ to bundle
- Unnecessary complexity for CRUD with <1000 records
- Would be reconsidered if querying/reporting needs grow significantly

### Option D: Remote database (Supabase, Firebase, PocketBase)
- Requires auth, network, infrastructure cost
- Defeats the offline-first, no-signup goal
- Would be the right choice if multi-device sync becomes a requirement

### Option E: OPFS (Origin Private File System)
- Best for large binary files
- No advantage for structured JSON-like records
- Worse browser compatibility than IndexedDB

---

## 6. Deployment: Releasing on Vercel

Gear Closet is a pure static SPA — no server needed. Vercel's static hosting is ideal.

### One-time Setup

1. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/<you>/gear-closet-pwa.git
   git push -u origin main
   ```

2. **Import on Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository" → select `gear-closet-pwa`
   - Vercel auto-detects Vite. Confirm settings:
     - **Framework Preset:** Vite
     - **Build Command:** `npm run build`
     - **Output Directory:** `dist`
     - **Install Command:** `npm install`
   - Click **Deploy**

3. **Custom domain** (optional)
   - In Vercel dashboard → Settings → Domains → add your domain
   - Update DNS CNAME to `cname.vercel-dns.com`

### Continuous Deployment

Every push to `main` triggers a new build and deploy automatically. Preview deployments are created for every pull request branch.

### Environment Variables

This app has no environment variables — all config is build-time or runtime (IndexedDB). No `.env` file needed.

### SPA Routing

Since Gear Closet uses no client-side router (tab state is in-memory `$state`, not URL-based), there are no 404 issues for deep links. If a URL router is added later, add a `vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### PWA on Vercel

Vercel serves all files with correct MIME types and HTTPS by default — both required for PWA installability and service workers. No additional configuration needed.

### Build Verification

Before deploying, verify the production build locally:
```bash
npm run build
npm run preview
# Open http://localhost:4173
# Check: install prompt appears, offline mode works, no console errors
```

---

## 7. Known Technical Debt

| Item | Impact | Effort |
|---|---|---|
| `index.html` title is "gear-closet-pwa" | Lighthouse SEO, branding | Trivial |
| Missing `<meta name="description">` | Lighthouse SEO | Trivial |
| Missing `<meta name="theme-color">` | Lighthouse PWA | Trivial |
| Maskable icon not properly designed | Android icon appearance | Low |
| No `apple-touch-icon` in `public/` | iOS add-to-home-screen | Low |
| No automated tests | Regression risk | High |
| `PackingListDetail.svelte` is very large (~900 lines) | Maintainability | Medium |
| `lucide-svelte` and `@lucide/svelte` both in package.json | Bundle bloat | Low |
| `bits-ui` in dependencies but usage unclear | Bundle bloat | Low |
| Tutorial mode: stores reload on every `settingsStore.loaded` change | Minor perf | Low |
| Weight unit in both header button and Settings (two sources of truth for toggle) | UX confusion | Low |

---

## 8. Future Architecture Considerations

### If multi-device sync is needed
- Add Supabase (Postgres + Auth + Realtime) as backend
- Keep IndexedDB as local cache, sync on connect
- Conflict resolution: last-write-wins by `updatedAt` timestamp

### If native mobile is needed
- Capacitor can wrap this Svelte app as an iOS/Android native app with minimal changes
- IndexedDB maps to Capacitor's SQLite plugin

### If list sharing is needed
- Generate a shareable JSON URL (base64-encoded, read-only import)
- Or add a backend with short-lived share links

### If testing is added (recommended)
See the Testing Strategy section in `TESTING_STRATEGY.md`.
