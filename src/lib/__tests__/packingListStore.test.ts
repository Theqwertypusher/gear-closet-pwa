/**
 * packingListStore tests — tutorial / in-memory mode
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../db', () => ({
  getAllPackingLists:  vi.fn().mockResolvedValue([]),
  putPackingList:     vi.fn().mockResolvedValue(undefined),
  deletePackingList:  vi.fn().mockResolvedValue(undefined),
  getSettings:        vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../tutorialData', () => ({
  TUTORIAL_GEAR_ITEMS: [],
  TUTORIAL_KITS: [],
  TUTORIAL_PACKING_LISTS: [],
}))

import { setPackingListStoreTutorialMode } from '../stores/packingListStore.svelte'
import type { PackingList } from '../types'

// ── helpers ───────────────────────────────────────────────────────────────────

function makeListData(overrides: Partial<Omit<PackingList, 'id' | 'createdAt' | 'updatedAt'>> = {}) {
  return {
    name: 'Summer Hike',
    categories: [],
    tripNotes: '',
    isPackingMode: false,
    listMode: 'draft' as const,
    // intentionally omit sortOrder — let the store assign it
    ...overrides,
  }
}

async function freshStore() {
  const { packingListStore } = await import('../stores/packingListStore.svelte')
  setPackingListStoreTutorialMode(true)
  packingListStore.loadShared([])
  return packingListStore
}

// ─────────────────────────────────────────────────────────────────────────────

describe('packingListStore (tutorial / in-memory mode)', () => {
  beforeEach(() => {
    setPackingListStoreTutorialMode(true)
  })

  // ── addList ─────────────────────────────────────────────────────────────────

  describe('addList', () => {
    it('adds a list and returns the created object', async () => {
      const store = await freshStore()
      const list = await store.addList(makeListData())
      expect(store.lists).toHaveLength(1)
      expect(list.name).toBe('Summer Hike')
    })

    it('generates a unique id', async () => {
      const store = await freshStore()
      const a = await store.addList(makeListData())
      const b = await store.addList(makeListData({ name: 'Winter Trip' }))
      expect(a.id).toBeTruthy()
      expect(b.id).toBeTruthy()
      expect(a.id).not.toBe(b.id)
    })

    it('defaults listMode to draft', async () => {
      const store = await freshStore()
      const list = await store.addList(makeListData())
      expect(list.listMode).toBe('draft')
    })

    it('assigns sortOrder equal to current length', async () => {
      const store = await freshStore()
      await store.addList(makeListData())
      const second = await store.addList(makeListData({ name: 'Trip 2' }))
      expect(second.sortOrder).toBe(1)
    })

    it('does NOT call putPackingList in tutorial mode', async () => {
      const { putPackingList } = await import('../db')
      const store = await freshStore()
      await store.addList(makeListData())
      expect(putPackingList).not.toHaveBeenCalled()
    })
  })

  // ── updateList ──────────────────────────────────────────────────────────────

  describe('updateList', () => {
    it('merges partial data', async () => {
      const store = await freshStore()
      await store.addList(makeListData())
      const id = store.lists[0].id
      await store.updateList(id, { name: 'Updated Name', listMode: 'final' })
      expect(store.lists[0].name).toBe('Updated Name')
      expect(store.lists[0].listMode).toBe('final')
    })

    it('is a no-op when id does not exist', async () => {
      const store = await freshStore()
      await store.addList(makeListData())
      await store.updateList('ghost', { name: 'Ghost' })
      expect(store.lists[0].name).toBe('Summer Hike')
    })
  })

  // ── duplicateList ────────────────────────────────────────────────────────────

  describe('duplicateList', () => {
    it('creates a copy with "(copy)" in the name', async () => {
      const store = await freshStore()
      await store.addList(makeListData())
      await store.duplicateList(store.lists[0].id)
      expect(store.lists).toHaveLength(2)
      expect(store.lists[1].name).toBe('Summer Hike (copy)')
    })

    it('gives the copy a new id', async () => {
      const store = await freshStore()
      await store.addList(makeListData())
      const originalId = store.lists[0].id
      await store.duplicateList(originalId)
      expect(store.lists[1].id).not.toBe(originalId)
    })

    it('resets listMode to draft and isPackingMode to false on the copy', async () => {
      const store = await freshStore()
      await store.addList(makeListData({ listMode: 'final', isPackingMode: true }))
      await store.duplicateList(store.lists[0].id)
      expect(store.lists[1].listMode).toBe('draft')
      expect(store.lists[1].isPackingMode).toBe(false)
    })

    it('deep-clones categories with new UUIDs', async () => {
      const store = await freshStore()
      await store.addList(makeListData({
        categories: [{
          id: 'cat-original', name: 'Shelter', sortOrder: 0,
          items: [{ id: 'item-original', gearItemId: 'g1', quantity: 1, checked: true }],
        }],
      }))
      await store.duplicateList(store.lists[0].id)
      const copyCat = store.lists[1].categories[0]
      expect(copyCat.id).not.toBe('cat-original')
      expect(copyCat.items[0].id).not.toBe('item-original')
      expect(copyCat.items[0].checked).toBe(false) // reset
    })
  })

  // ── deleteList ──────────────────────────────────────────────────────────────

  describe('deleteList', () => {
    it('removes the list from the array', async () => {
      const store = await freshStore()
      await store.addList(makeListData())
      await store.deleteList(store.lists[0].id)
      expect(store.lists).toHaveLength(0)
    })

    it('clears activeListId if the deleted list was active', async () => {
      const store = await freshStore()
      await store.addList(makeListData())
      const id = store.lists[0].id
      store.setActiveList(id)
      expect(store.activeListId).toBe(id)
      await store.deleteList(id)
      expect(store.activeListId).toBeNull()
    })

    it('does NOT clear activeListId when a different list is deleted', async () => {
      const store = await freshStore()
      await store.addList(makeListData({ name: 'A' }))
      await store.addList(makeListData({ name: 'B' }))
      store.setActiveList(store.lists[0].id)
      await store.deleteList(store.lists[1].id)
      expect(store.activeListId).toBe(store.lists[0].id)
    })
  })

  // ── setActiveList ───────────────────────────────────────────────────────────

  describe('setActiveList', () => {
    it('sets the activeListId', async () => {
      const store = await freshStore()
      await store.addList(makeListData())
      store.setActiveList(store.lists[0].id)
      expect(store.activeListId).toBe(store.lists[0].id)
    })

    it('accepts null to deselect', async () => {
      const store = await freshStore()
      await store.addList(makeListData())
      store.setActiveList(store.lists[0].id)
      store.setActiveList(null)
      expect(store.activeListId).toBeNull()
    })
  })

  // ── reorderLists ─────────────────────────────────────────────────────────────

  describe('reorderLists', () => {
    it('reassigns sortOrder by new index', async () => {
      const store = await freshStore()
      await store.addList(makeListData({ name: 'A' }))
      await store.addList(makeListData({ name: 'B' }))
      const [listA, listB] = store.lists
      await store.reorderLists([listB, listA])
      expect(store.lists[0].name).toBe('B')
      expect(store.lists[0].sortOrder).toBe(0)
      expect(store.lists[1].name).toBe('A')
      expect(store.lists[1].sortOrder).toBe(1)
    })
  })

  // ── loadShared ────────────────────────────────────────────────────────────

  describe('loadShared', () => {
    it('replaces lists with provided data', async () => {
      const store = await freshStore()
      await store.addList(makeListData())
      const shared: PackingList[] = [{
        id: 'shared-list', name: 'Shared Trip', categories: [], tripNotes: '',
        isPackingMode: false, listMode: 'draft', sortOrder: 0,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      }]
      store.loadShared(shared)
      expect(store.lists).toHaveLength(1)
      expect(store.lists[0].id).toBe('shared-list')
    })

    it('backfills sortOrder when not present on the list', async () => {
      const store = await freshStore()
      // backfillList uses { sortOrder: i, ...l } so existing sortOrder wins.
      // Pass lists without sortOrder to confirm backfill assigns by index.
      const shared = [
        { id: 'sl1', name: 'A', categories: [], tripNotes: '', isPackingMode: false, listMode: 'draft', createdAt: '', updatedAt: '' },
        { id: 'sl2', name: 'B', categories: [], tripNotes: '', isPackingMode: false, listMode: 'draft', createdAt: '', updatedAt: '' },
      ] as unknown as PackingList[]
      store.loadShared(shared)
      expect(store.lists[0].sortOrder).toBe(0)
      expect(store.lists[1].sortOrder).toBe(1)
    })
  })
})
