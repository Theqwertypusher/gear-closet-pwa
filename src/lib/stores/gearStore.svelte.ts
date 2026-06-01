import { getAllGearItems, putGearItem, deleteGearItem, getSettings } from '../db'
import type { GearItem, WeightCategory } from '../types'
import { TUTORIAL_GEAR_ITEMS } from '../tutorialData'
import { track } from '../analytics'

let isTutorial = false

export function setGearStoreTutorialMode(enabled: boolean) {
  isTutorial = enabled
}

function createGearStore() {
  let items = $state<GearItem[]>([])
  let loaded = $state(false)

  async function load() {
    // Synchronous bail-out: if a share link is present, don't auto-load anything.
    // loadShared() will be called by App.svelte once the payload is decoded.
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('data')) return

    const settings = await getSettings()
    if (isTutorial || settings?.tutorialMode) {
      isTutorial = true
      items = [...TUTORIAL_GEAR_ITEMS]
    } else {
      items = await getAllGearItems()
    }
    loaded = true
  }

  async function loadTutorial() {
    items = [...TUTORIAL_GEAR_ITEMS]
    loaded = true
  }

  function loadShared(sharedItems: GearItem[]) {
    items = [...sharedItems]
    loaded = true
  }

  async function addItem(data: Omit<GearItem, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString()
    const item: GearItem = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    }
    if (!isTutorial) {
      await putGearItem(item)
    }
    items = [...items, item]
    if (!isTutorial) track('gear_item_added', { weight_category: item.weightCategory })
  }

  async function updateItem(id: string, data: Partial<Omit<GearItem, 'id' | 'createdAt'>>) {
    const idx = items.findIndex((i) => i.id === id)
    if (idx === -1) return
    const updated: GearItem = {
      ...items[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    }
    if (!isTutorial) {
      await putGearItem(updated)
    }
    items = items.map((i) => (i.id === id ? updated : i))
    if (!isTutorial) track('gear_item_edited', { weight_category: updated.weightCategory })
  }

  async function deleteItem(id: string) {
    if (!isTutorial) {
      await deleteGearItem(id)
    }
    items = items.filter((i) => i.id !== id)
    if (!isTutorial) track('gear_item_deleted')
  }

  function filteredItems(category: WeightCategory | 'all') {
    if (category === 'all') return items
    return items.filter((i) => i.weightCategory === category)
  }

  async function reset() {
    items = []
    loaded = false
    await load()
  }

  load()

  const CUSTOM_LABELS_KEY = 'gear-closet:custom-labels'

  function loadCustomLabels(): string[] {
    try {
      return JSON.parse(localStorage.getItem(CUSTOM_LABELS_KEY) ?? '[]')
    } catch { return [] }
  }

  function saveCustomLabels(labels: string[]) {
    localStorage.setItem(CUSTOM_LABELS_KEY, JSON.stringify(labels))
  }

  let customLabels = $state<string[]>(loadCustomLabels())

  function addCustomLabel(label: string) {
    const trimmed = label.trim()
    if (!trimmed || customLabels.includes(trimmed)) return
    customLabels = [...customLabels, trimmed]
    saveCustomLabels(customLabels)
  }

  function removeCustomLabel(label: string) {
    customLabels = customLabels.filter((l) => l !== label)
    saveCustomLabels(customLabels)
  }

  function renameCustomLabel(oldLabel: string, newLabel: string) {
    const trimmed = newLabel.trim()
    if (!trimmed) return
    customLabels = customLabels.map((l) => (l === oldLabel ? trimmed : l))
    saveCustomLabels(customLabels)
  }

  const itemTypes = $derived(
    [...new Set([
      ...items.map((i) => i.itemType).filter((t): t is string => !!t && t.trim() !== ''),
      ...customLabels,
    ])].sort()
  )

  return {
    get items() { return items },
    get loaded() { return loaded },
    get itemTypes() { return itemTypes },
    get customLabels() { return customLabels },
    filteredItems,
    addItem,
    updateItem,
    deleteItem,
    loadTutorial,
    loadShared,
    reset,
    addCustomLabel,
    removeCustomLabel,
    renameCustomLabel,
  }
}

export const gearStore = createGearStore()
