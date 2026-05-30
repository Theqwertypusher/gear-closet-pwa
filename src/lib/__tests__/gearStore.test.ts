/**
 * gearStore tests
 *
 * Strategy: run every operation in tutorial mode (isTutorial = true) so the
 * store never touches IndexedDB.  We still mock the DB module so the initial
 * `load()` call (which does `getSettings()`) doesn't throw.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock the DB layer before any store import ─────────────────────────────────
vi.mock('../db', () => ({
  getAllGearItems: vi.fn().mockResolvedValue([]),
  putGearItem:    vi.fn().mockResolvedValue(undefined),
  deleteGearItem: vi.fn().mockResolvedValue(undefined),
  getSettings:    vi.fn().mockResolvedValue(undefined), // no tutorialMode in settings
}))

vi.mock('../tutorialData', () => ({
  TUTORIAL_GEAR_ITEMS: [],
  TUTORIAL_KITS: [],
  TUTORIAL_PACKING_LISTS: [],
}))

import { setGearStoreTutorialMode } from '../stores/gearStore.svelte'
import type { GearItem } from '../types'

// ── helpers ───────────────────────────────────────────────────────────────────

function makeData(overrides: Partial<Omit<GearItem, 'id' | 'createdAt' | 'updatedAt'>> = {}) {
  return {
    name: 'Tent',
    brand: 'MSR',
    weight: 1200,
    weightUnit: 'g' as const,
    weightCategory: 'base' as const,
    notes: '',
    itemType: 'Shelter',
    ...overrides,
  }
}

// ── Create a fresh store instance for each test ───────────────────────────────
// We can't re-import the singleton; instead we exercise the exported singleton
// after seeding it with `loadShared([])`.

async function freshStore() {
  // Import here so mocks are in place
  const { gearStore } = await import('../stores/gearStore.svelte')
  setGearStoreTutorialMode(true)
  gearStore.loadShared([])          // reset to empty, stays in-memory only
  return gearStore
}

// ─────────────────────────────────────────────────────────────────────────────

describe('gearStore (tutorial / in-memory mode)', () => {
  beforeEach(() => {
    setGearStoreTutorialMode(true)
  })

  // ── addItem ─────────────────────────────────────────────────────────────────

  describe('addItem', () => {
    it('adds an item and returns it in the items array', async () => {
      const store = await freshStore()
      await store.addItem(makeData())
      expect(store.items).toHaveLength(1)
      expect(store.items[0].name).toBe('Tent')
    })

    it('generates a unique id for each item', async () => {
      const store = await freshStore()
      await store.addItem(makeData())
      await store.addItem(makeData({ name: 'Bag' }))
      const [a, b] = store.items
      expect(a.id).toBeTruthy()
      expect(b.id).toBeTruthy()
      expect(a.id).not.toBe(b.id)
    })

    it('sets createdAt and updatedAt to ISO strings', async () => {
      const store = await freshStore()
      await store.addItem(makeData())
      const item = store.items[0]
      expect(() => new Date(item.createdAt)).not.toThrow()
      expect(() => new Date(item.updatedAt)).not.toThrow()
    })

    it('does NOT call putGearItem in tutorial mode', async () => {
      const { putGearItem } = await import('../db')
      const store = await freshStore()
      await store.addItem(makeData())
      expect(putGearItem).not.toHaveBeenCalled()
    })
  })

  // ── updateItem ──────────────────────────────────────────────────────────────

  describe('updateItem', () => {
    it('merges partial data into the existing item', async () => {
      const store = await freshStore()
      await store.addItem(makeData())
      const id = store.items[0].id
      await store.updateItem(id, { name: 'Updated Tent', weight: 900 })
      expect(store.items[0].name).toBe('Updated Tent')
      expect(store.items[0].weight).toBe(900)
    })

    it('is a no-op when the id does not exist', async () => {
      const store = await freshStore()
      await store.addItem(makeData())
      await store.updateItem('nonexistent-id', { name: 'Ghost' })
      expect(store.items[0].name).toBe('Tent') // unchanged
    })

    it('updates the updatedAt timestamp', async () => {
      const store = await freshStore()
      await store.addItem(makeData())
      const before = store.items[0].updatedAt
      // small delay to ensure timestamp differs
      await new Promise((r) => setTimeout(r, 2))
      await store.updateItem(store.items[0].id, { weight: 800 })
      expect(store.items[0].updatedAt).not.toBe(before)
    })
  })

  // ── deleteItem ──────────────────────────────────────────────────────────────

  describe('deleteItem', () => {
    it('removes the item from the array', async () => {
      const store = await freshStore()
      await store.addItem(makeData())
      const id = store.items[0].id
      await store.deleteItem(id)
      expect(store.items).toHaveLength(0)
    })

    it('only removes the targeted item when multiple exist', async () => {
      const store = await freshStore()
      await store.addItem(makeData({ name: 'Tent' }))
      await store.addItem(makeData({ name: 'Pad' }))
      const idToDelete = store.items[0].id
      await store.deleteItem(idToDelete)
      expect(store.items).toHaveLength(1)
      expect(store.items[0].name).toBe('Pad')
    })
  })

  // ── filteredItems ────────────────────────────────────────────────────────────

  describe('filteredItems', () => {
    it("returns all items when category is 'all'", async () => {
      const store = await freshStore()
      await store.addItem(makeData({ weightCategory: 'base' }))
      await store.addItem(makeData({ weightCategory: 'wearable' }))
      expect(store.filteredItems('all')).toHaveLength(2)
    })

    it('filters by base category', async () => {
      const store = await freshStore()
      await store.addItem(makeData({ weightCategory: 'base' }))
      await store.addItem(makeData({ weightCategory: 'wearable' }))
      const result = store.filteredItems('base')
      expect(result).toHaveLength(1)
      expect(result[0].weightCategory).toBe('base')
    })

    it('filters by wearable category', async () => {
      const store = await freshStore()
      await store.addItem(makeData({ weightCategory: 'wearable' }))
      await store.addItem(makeData({ weightCategory: 'consumable' }))
      expect(store.filteredItems('wearable')).toHaveLength(1)
    })

    it('returns empty array when no items match the category', async () => {
      const store = await freshStore()
      await store.addItem(makeData({ weightCategory: 'base' }))
      expect(store.filteredItems('consumable')).toHaveLength(0)
    })
  })

  // ── itemTypes ─────────────────────────────────────────────────────────────

  describe('itemTypes', () => {
    it('returns sorted unique itemType values', async () => {
      const store = await freshStore()
      await store.addItem(makeData({ itemType: 'Shelter' }))
      await store.addItem(makeData({ itemType: 'Sleep' }))
      await store.addItem(makeData({ itemType: 'Shelter' })) // duplicate
      expect(store.itemTypes).toEqual(['Shelter', 'Sleep'])
    })

    it('excludes blank itemType values', async () => {
      const store = await freshStore()
      await store.addItem(makeData({ itemType: '' }))
      await store.addItem(makeData({ itemType: undefined }))
      expect(store.itemTypes).toHaveLength(0)
    })
  })

  // ── loadShared ────────────────────────────────────────────────────────────

  describe('loadShared', () => {
    it('replaces items with the provided array', async () => {
      const store = await freshStore()
      await store.addItem(makeData())
      const shared: GearItem[] = [{
        id: 'shared-1', name: 'Shared Tent', brand: 'BD', weight: 900,
        weightUnit: 'g', weightCategory: 'base', notes: '', itemType: 'Shelter',
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      }]
      store.loadShared(shared)
      expect(store.items).toHaveLength(1)
      expect(store.items[0].id).toBe('shared-1')
    })

    it('sets loaded to true', async () => {
      const store = await freshStore()
      store.loadShared([])
      expect(store.loaded).toBe(true)
    })
  })
})
