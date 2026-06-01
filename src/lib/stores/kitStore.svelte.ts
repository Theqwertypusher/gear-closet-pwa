import { getAllKits, putKit, deleteKit as dbDeleteKit, getSettings } from '../db'
import type { Kit } from '../types'
import { TUTORIAL_KITS } from '../tutorialData'
import { track } from '../analytics'

let isTutorial = false

export function setKitStoreTutorialMode(enabled: boolean) {
  isTutorial = enabled
}

function createKitStore() {
  let kits = $state<Kit[]>([])
  let loaded = $state(false)

  function backfillSortOrder(raw: Kit[]): Kit[] {
    return raw.map((k, i) => ({ sortOrder: i, ...k }))
  }

  async function load() {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('data')) return

    const settings = await getSettings()
    if (isTutorial || settings?.tutorialMode) {
      isTutorial = true
      kits = backfillSortOrder([...TUTORIAL_KITS])
    } else {
      kits = backfillSortOrder(await getAllKits()).sort((a, b) => a.sortOrder - b.sortOrder)
    }
    loaded = true
  }

  async function loadTutorial() {
    kits = backfillSortOrder([...TUTORIAL_KITS])
    loaded = true
  }

  function loadShared(sharedKits: Kit[]) {
    kits = backfillSortOrder([...sharedKits])
    loaded = true
  }

  async function addKit(data: Omit<Kit, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString()
    const kit: Kit = {
      sortOrder: kits.length,
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    }
    if (!isTutorial) {
      await putKit(kit)
    }
    kits = [...kits, kit]
    if (!isTutorial) track('kit_created', { item_count: kit.itemIds.length })
  }

  async function reorderKits(reordered: Kit[]) {
    const updated = reordered.map((k, i) => ({ ...k, sortOrder: i }))
    kits = updated
    if (!isTutorial) {
      await Promise.all(updated.map((k) => putKit(k)))
    }
  }

  async function updateKit(id: string, data: Partial<Omit<Kit, 'id' | 'createdAt'>>) {
    const idx = kits.findIndex((k) => k.id === id)
    if (idx === -1) return
    const updated: Kit = {
      ...kits[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    }
    if (!isTutorial) {
      await putKit(updated)
    }
    kits = kits.map((k) => (k.id === id ? updated : k))
    if (!isTutorial) track('kit_edited')
  }

  async function duplicateKit(id: string) {
    const source = kits.find((k) => k.id === id)
    if (!source) return
    const now = new Date().toISOString()
    const copy: Kit = {
      ...source,
      id: crypto.randomUUID(),
      name: `${source.name} (copy)`,
      sortOrder: kits.length,
      createdAt: now,
      updatedAt: now,
    }
    if (!isTutorial) {
      await putKit(copy)
    }
    kits = [...kits, copy]
    if (!isTutorial) track('kit_duplicated')
  }

  async function deleteKit(id: string) {
    if (!isTutorial) {
      await dbDeleteKit(id)
    }
    kits = kits.filter((k) => k.id !== id)
    if (!isTutorial) track('kit_deleted')
  }

  async function reset() {
    kits = []
    loaded = false
    await load()
  }

  load()

  return {
    get kits() { return kits },
    get loaded() { return loaded },
    addKit,
    duplicateKit,
    updateKit,
    deleteKit,
    reorderKits,
    loadTutorial,
    loadShared,
    reset,
  }
}

export const kitStore = createKitStore()
