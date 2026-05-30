# Gear Closet — Product Specification

**Version:** 1.0  
**Date:** 2026-05-29  
**Status:** Active

---

## Overview

Gear Closet is a Progressive Web App (PWA) for outdoor enthusiasts to manage their physical gear inventory, build reusable gear kits, and create weight-aware packing lists for trips. It works fully offline, requires no account, and stores all data locally on the device.

**Core value proposition:** A fast, offline-first gear organizer that lives on your phone like a native app — no signup, no cloud dependency, no subscription.

---

## Target Users

| Persona | Description |
|---|---|
| Weekend hiker | Wants a checklist for day/overnight trips, track what they own |
| Thru-hiker | Obsessive about weight, needs kit reuse across many trips |
| Backpacker | Plans multiple annual trips, wants to remember what they bring |
| Gear collector | Wants a catalog of their outdoor gear with weights and categories |

---

## Main Functional Areas

### 1. Gear Closet (Inventory)

**Purpose:** A master catalog of everything the user owns, with weights and categorization.

**Features:**
- Add gear items with: name, brand, weight (with unit), item type/tag, notes
- Edit and delete items
- Filter items by category (All, or a specific item type tag)
- Sort items by name, weight, or date added
- Drag to reorder items within a category view
- Weight unit toggle: grams (g), ounces (oz), pounds (lbs), kilograms (kg) — persistent across sessions
- Tags: user-defined item types (e.g. sleep, shelter, cooking, clothing). Tags can be created inline when adding/editing an item. Existing tags are shown as selectable pills. Tags are derived from items in the store (no separate tag management).
- Gear count shown in sub-header

**Constraints:**
- Tags cannot be explicitly deleted; they disappear when no item uses them
- No per-item image support (out of scope for v1)

---

### 2. Kits

**Purpose:** Reusable groupings of gear items that can be added to packing lists as a unit.

**Features:**
- Create kits with a name and a curated subset of gear items
- Each kit shows: item count, total weight
- Edit kit (rename, change item selection)
- Delete kit (with confirm step)
- Drag to reorder kits
- Guard: cannot create a kit if Gear Closet is empty — prompts user to add gear first

**Key behavior:**
- Adding a kit to a packing list category: if the category is empty, the category is renamed to match the kit and populated with the kit's items. If the category already has items, the kit's items are appended (duplicates skipped).
- Kits are independent of packing lists — editing a kit does not retroactively update lists that already imported it.

---

### 3. Packing Lists

**Purpose:** Trip-specific gear selection organized by category, with weight tracking and packing-mode check-off.

**Features:**

**List Management:**
- Create packing lists with a name
- Delete lists
- Rename lists inline
- Trip notes (free-text field per list)

**List Modes:**
- **Draft mode:** Planning phase. Add/remove items freely. No check-off.
- **Final mode:** Locked-in list. Weight summary shown. Can switch to Packing Mode.
- **Packing mode** (within Final): Check off items as you pack. Clear all checks button. Weight of checked vs. unchecked items shown.

**Categories:**
- Add categories manually (prepended to top, auto-focused for naming)
- Rename categories inline
- Delete categories (with confirm)
- Collapse/expand categories
- Drag to reorder categories
- Drag to reorder items within a category

**Items within a category:**
- Add items via item picker (modal, search by name, multi-select)
- Add kit items via kit picker (modal, lists available kits)
- Increase/decrease item quantity
- Remove item from category
- Items show: name, brand, weight (per unit × qty), item type tag

**Weight Summary:**
- Per-category weight shown in category header
- Total list weight shown in list header
- In packing mode: packed weight vs. remaining weight

**Guards:**
- Adding a kit when no kits exist → prompts to create kits first (with navigation to Kits tab)
- Adding items when Gear Closet is empty → prompts to add gear first

---

### 4. Settings

**Features:**
- **Theme toggle:** Dark / Light mode (persisted)
- **Weight unit toggle:** Also accessible globally via header button
- **Tutorial mode:** Loads sample gear, kits, and packing lists for exploration. Runs fully in-memory; turning it off clears tutorial data and restores real data. A banner appears app-wide while active.
- **Export backup:** Downloads a JSON file of all data (gear, kits, lists, settings)
- **Import backup:** Replaces all current data from a JSON backup file. Warning shown before import.
- **Clear all data:** Permanently deletes everything (confirmation dialog)
- **Keyboard shortcuts reference:** Displayed for power users

---

### 5. Onboarding

**Welcome Screen** (shown on first launch):
- Shown when `hasSeenWelcome` is false in settings
- Options: Start Fresh, Import Existing Backup, Try Tutorial Mode
- On completion, sets `hasSeenWelcome = true`

**Legacy import banner:**
- Shown if user has seen the welcome screen but has no gear and no lists
- Allows importing a backup without going to Settings

---

## Keyboard Shortcuts

| Key(s) | Action |
|---|---|
| `1` | Go to Packing Lists |
| `2` | Go to Kits |
| `3` | Go to Gear Closet |
| `4` | Go to Settings |
| `A` (tap) | Add new item / list / kit / category (context-aware by active tab) |
| `A` + `I` | Cycle focus through "Add item" buttons in packing list |
| `A` + `K` | Cycle focus through "Add kit" buttons in packing list |
| `C` + `⌫` | Cycle through and trigger category delete in packing list |
| `I` + `⌫` | Cycle through and trigger item delete in packing list |
| `Esc` | Close modal / dismiss overlay (priority chain) |
| `⌫` / `Delete` | Go back / navigate up |

Shortcuts are disabled when an input, textarea, or select is focused.

---

## Data Model

### GearItem
```
id: string (uuid)
name: string
brand?: string
weight: number
weightUnit: WeightUnit ('g' | 'oz' | 'lbs' | 'kg')
itemType?: string  // user-defined tag
notes?: string
createdAt: string (ISO)
updatedAt: string (ISO)
sortOrder: number
```

### Kit
```
id: string
name: string
itemIds: string[]  // ordered list of gear item IDs
createdAt: string
updatedAt: string
sortOrder: number
```

### PackingList
```
id: string
name: string
tripNotes?: string
listMode: 'draft' | 'final'
isPackingMode: boolean
categories: PackingListCategory[]
createdAt: string
updatedAt: string
sortOrder: number
```

### PackingListCategory
```
id: string
name: string
items: PackingListItem[]
sortOrder: number
```

### PackingListItem
```
id: string (local to category, not a gear item ID)
gearItemId: string
quantity: number
checked: boolean
```

### Settings
```
theme: 'dark' | 'light'
weightUnit: WeightUnit
hasSeenWelcome: boolean
tutorialMode: boolean
lastExportDate?: string
```

---

## Out of Scope (v1)

- Cloud sync / account system
- Sharing lists with others
- Per-item photos
- Cost tracking
- Gear condition tracking (new, used, worn out)
- Multiple users / profiles
- Native mobile apps (iOS/Android)
- Push notifications

---

## Success Metrics

Since this is a personal/offline app with no telemetry, success is measured qualitatively:
- App installs as PWA correctly on iOS Safari and Android Chrome
- Full offline functionality (add, edit, delete gear, kits, lists)
- Backup/restore round-trip works without data loss
- Lighthouse PWA score ≥ 90
- All core user flows completable without a mouse (keyboard-only)
