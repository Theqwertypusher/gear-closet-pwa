import { getAllPackingLists, putPackingList, deletePackingList as dbDeletePackingList, getSettings } from '../db'
import type { PackingList, PackingListCategory } from '../types'
import { TUTORIAL_PACKING_LISTS } from '../tutorialData'
import { track } from '../analytics'

let isTutorial = false

export function setPackingListStoreTutorialMode(enabled: boolean) {
  isTutorial = enabled
}

const DEFAULT_CATEGORIES: string[] = [
  'Big Three',
  'Cook System',
  'Electronics',
  'Ditty Bag',
  'Miscellaneous',
  'Food & Water',
  'Clothing',
]

export function createDefaultCategories(): PackingListCategory[] {
  return DEFAULT_CATEGORIES.map((name, i) => ({
    id: crypto.randomUUID(),
    name,
    items: [],
    sortOrder: i,
  }))
}

function backfillList(l: PackingList, i: number): PackingList {
  return {
    sortOrder: i,
    listMode: 'draft',
    ...l,
    categories: l.categories.map((c, ci) => ({ sortOrder: ci, ...c })),
  }
}

function createPackingListStore() {
  let lists = $state<PackingList[]>([])
  let loaded = $state(false)
  let activeListId = $state<string | null>(null)

  async function load() {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('data')) return

    const settings = await getSettings()
    if (isTutorial || settings?.tutorialMode) {
      isTutorial = true
      lists = TUTORIAL_PACKING_LISTS.map(backfillList)
    } else {
      lists = (await getAllPackingLists()).map(backfillList).sort((a, b) => a.sortOrder - b.sortOrder)
    }
    loaded = true
  }

  async function loadTutorial() {
    lists = TUTORIAL_PACKING_LISTS.map(backfillList)
    loaded = true
  }

  function loadShared(sharedLists: PackingList[]) {
    lists = sharedLists.map(backfillList)
    loaded = true
  }

  async function addList(data: Omit<PackingList, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString()
    const list: PackingList = {
      sortOrder: lists.length,
      listMode: 'draft',
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    }
    if (!isTutorial) {
      await putPackingList(list)
    }
    lists = [...lists, list]
    if (!isTutorial) track('packing_list_created', { category_count: list.categories.length })
    return list
  }

  async function reorderLists(reordered: PackingList[]) {
    const updated = reordered.map((l, i) => ({ ...l, sortOrder: i }))
    lists = updated
    if (!isTutorial) {
      await Promise.all(updated.map((l) => putPackingList(l)))
    }
  }

  async function updateList(id: string, data: Partial<Omit<PackingList, 'id' | 'createdAt'>>) {
    const idx = lists.findIndex((l) => l.id === id)
    if (idx === -1) return
    const updated: PackingList = {
      ...lists[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    }
    if (!isTutorial) {
      await putPackingList(updated)
    }
    lists = lists.map((l) => (l.id === id ? updated : l))
  }

  async function duplicateList(id: string) {
    const source = lists.find((l) => l.id === id)
    if (!source) return
    const now = new Date().toISOString()
    const copy: PackingList = {
      ...source,
      id: crypto.randomUUID(),
      name: `${source.name} (copy)`,
      listMode: 'draft',
      isPackingMode: false,
      sortOrder: lists.length,
      createdAt: now,
      updatedAt: now,
      categories: source.categories.map((cat) => ({
        ...cat,
        id: crypto.randomUUID(),
        items: cat.items.map((item) => ({
          ...item,
          id: crypto.randomUUID(),
          checked: false,
        })),
      })),
    }
    if (!isTutorial) {
      await putPackingList(copy)
    }
    lists = [...lists, copy]
    if (!isTutorial) track('packing_list_duplicated')
    return copy
  }

  async function deleteList(id: string) {
    if (!isTutorial) {
      await dbDeletePackingList(id)
    }
    lists = lists.filter((l) => l.id !== id)
    if (activeListId === id) activeListId = null
    if (!isTutorial) track('packing_list_deleted')
  }

  function setActiveList(id: string | null) {
    if (id && !isTutorial) track('packing_list_opened')
    activeListId = id
  }

  async function reset() {
    lists = []
    activeListId = null
    loaded = false
    await load()
  }

  load()

  return {
    get lists() { return lists },
    get loaded() { return loaded },
    get activeListId() { return activeListId },
    addList,
    duplicateList,
    updateList,
    deleteList,
    reorderLists,
    setActiveList,
    loadTutorial,
    loadShared,
    reset,
  }
}

export const packingListStore = createPackingListStore()
