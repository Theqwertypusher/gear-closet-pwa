/**
 * kitStore tests — tutorial / in-memory mode
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../db', () => ({
  getAllKits:  vi.fn().mockResolvedValue([]),
  putKit:     vi.fn().mockResolvedValue(undefined),
  deleteKit:  vi.fn().mockResolvedValue(undefined),
  getSettings: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../tutorialData', () => ({
  TUTORIAL_GEAR_ITEMS: [],
  TUTORIAL_KITS: [],
  TUTORIAL_PACKING_LISTS: [],
}))

import { setKitStoreTutorialMode } from '../stores/kitStore.svelte'
import type { Kit } from '../types'

// ── helpers ───────────────────────────────────────────────────────────────────

function makeKitData(overrides: Partial<Omit<Kit, 'id' | 'createdAt' | 'updatedAt'>> = {}) {
  return {
    name: 'Sleep System',
    description: 'Sleeping bag and pad',
    itemIds: ['gear-1', 'gear-2'],
    // intentionally omit sortOrder — let the store assign it
    ...overrides,
  }
}

async function freshStore() {
  const { kitStore } = await import('../stores/kitStore.svelte')
  setKitStoreTutorialMode(true)
  kitStore.loadShared([])
  return kitStore
}

// ─────────────────────────────────────────────────────────────────────────────

describe('kitStore (tutorial / in-memory mode)', () => {
  beforeEach(() => {
    setKitStoreTutorialMode(true)
  })

  // ── addKit ──────────────────────────────────────────────────────────────────

  describe('addKit', () => {
    it('adds a kit to the store', async () => {
      const store = await freshStore()
      await store.addKit(makeKitData())
      expect(store.kits).toHaveLength(1)
      expect(store.kits[0].name).toBe('Sleep System')
    })

    it('generates a unique id', async () => {
      const store = await freshStore()
      await store.addKit(makeKitData())
      await store.addKit(makeKitData({ name: 'Cook Kit' }))
      expect(store.kits[0].id).not.toBe(store.kits[1].id)
    })

    it('assigns sortOrder equal to current length before adding', async () => {
      const store = await freshStore()
      await store.addKit(makeKitData())
      await store.addKit(makeKitData({ name: 'Cook Kit' }))
      expect(store.kits[0].sortOrder).toBe(0)
      expect(store.kits[1].sortOrder).toBe(1)
    })

    it('does NOT call putKit in tutorial mode', async () => {
      const { putKit } = await import('../db')
      const store = await freshStore()
      await store.addKit(makeKitData())
      expect(putKit).not.toHaveBeenCalled()
    })
  })

  // ── updateKit ───────────────────────────────────────────────────────────────

  describe('updateKit', () => {
    it('merges partial data into the existing kit', async () => {
      const store = await freshStore()
      await store.addKit(makeKitData())
      const id = store.kits[0].id
      await store.updateKit(id, { name: 'Updated Sleep' })
      expect(store.kits[0].name).toBe('Updated Sleep')
    })

    it('is a no-op when id does not exist', async () => {
      const store = await freshStore()
      await store.addKit(makeKitData())
      await store.updateKit('ghost-id', { name: 'Ghost' })
      expect(store.kits[0].name).toBe('Sleep System')
    })
  })

  // ── duplicateKit ─────────────────────────────────────────────────────────────

  describe('duplicateKit', () => {
    it('appends a copy with "(copy)" in the name', async () => {
      const store = await freshStore()
      await store.addKit(makeKitData())
      const originalId = store.kits[0].id
      await store.duplicateKit(originalId)
      expect(store.kits).toHaveLength(2)
      expect(store.kits[1].name).toBe('Sleep System (copy)')
    })

    it('gives the copy a new unique id', async () => {
      const store = await freshStore()
      await store.addKit(makeKitData())
      const originalId = store.kits[0].id
      await store.duplicateKit(originalId)
      expect(store.kits[1].id).not.toBe(originalId)
    })

    it('preserves the itemIds from the original', async () => {
      const store = await freshStore()
      await store.addKit(makeKitData({ itemIds: ['g1', 'g2', 'g3'] }))
      await store.duplicateKit(store.kits[0].id)
      expect(store.kits[1].itemIds).toEqual(['g1', 'g2', 'g3'])
    })

    it('is a no-op when id does not exist', async () => {
      const store = await freshStore()
      await store.duplicateKit('nonexistent')
      expect(store.kits).toHaveLength(0)
    })
  })

  // ── deleteKit ───────────────────────────────────────────────────────────────

  describe('deleteKit', () => {
    it('removes the kit from the array', async () => {
      const store = await freshStore()
      await store.addKit(makeKitData())
      const id = store.kits[0].id
      await store.deleteKit(id)
      expect(store.kits).toHaveLength(0)
    })

    it('only removes the targeted kit', async () => {
      const store = await freshStore()
      await store.addKit(makeKitData({ name: 'Kit A' }))
      await store.addKit(makeKitData({ name: 'Kit B' }))
      await store.deleteKit(store.kits[0].id)
      expect(store.kits).toHaveLength(1)
      expect(store.kits[0].name).toBe('Kit B')
    })
  })

  // ── reorderKits ──────────────────────────────────────────────────────────────

  describe('reorderKits', () => {
    it('reassigns sortOrder by new array index', async () => {
      const store = await freshStore()
      await store.addKit(makeKitData({ name: 'A' }))
      await store.addKit(makeKitData({ name: 'B' }))
      const [kitA, kitB] = store.kits
      await store.reorderKits([kitB, kitA]) // reverse order
      expect(store.kits[0].name).toBe('B')
      expect(store.kits[0].sortOrder).toBe(0)
      expect(store.kits[1].name).toBe('A')
      expect(store.kits[1].sortOrder).toBe(1)
    })
  })

  // ── loadShared ────────────────────────────────────────────────────────────

  describe('loadShared', () => {
    it('replaces kits with provided data', async () => {
      const store = await freshStore()
      await store.addKit(makeKitData())
      const shared: Kit[] = [{
        id: 'k1', name: 'Shared Kit', description: '', itemIds: [],
        sortOrder: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      }]
      store.loadShared(shared)
      expect(store.kits).toHaveLength(1)
      expect(store.kits[0].id).toBe('k1')
    })

    it('backfills sortOrder when not present on the kit', async () => {
      const store = await freshStore()
      // backfillSortOrder sets sortOrder: i as default but existing values win
      // (spread is { sortOrder: i, ...k } so k.sortOrder overrides when present)
      // Pass kits without sortOrder to confirm backfill assigns by index
      const shared = [
        { id: 'k1', name: 'A', description: '', itemIds: [], createdAt: '', updatedAt: '' },
        { id: 'k2', name: 'B', description: '', itemIds: [], createdAt: '', updatedAt: '' },
      ] as unknown as Kit[]
      store.loadShared(shared)
      expect(store.kits[0].sortOrder).toBe(0)
      expect(store.kits[1].sortOrder).toBe(1)
    })
  })
})
