import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { GearItem, Kit, PackingList, AppSettings } from './types'

interface GearClosetDB extends DBSchema {
  gearItems: {
    key: string
    value: GearItem
    indexes: { 'by-name': string; 'by-brand': string }
  }
  kits: {
    key: string
    value: Kit
    indexes: { 'by-name': string }
  }
  packingLists: {
    key: string
    value: PackingList
    indexes: { 'by-name': string }
  }
  settings: {
    key: string
    value: AppSettings & { id: string }
  }
}

const DB_NAME = 'gear-closet'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<GearClosetDB>> | null = null

export function getDB(): Promise<IDBPDatabase<GearClosetDB>> {
  if (!dbPromise) {
    dbPromise = openDB<GearClosetDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // gearItems store
        const gearItemsStore = db.createObjectStore('gearItems', { keyPath: 'id' })
        gearItemsStore.createIndex('by-name', 'name')
        gearItemsStore.createIndex('by-brand', 'brand')

        // kits store
        const kitsStore = db.createObjectStore('kits', { keyPath: 'id' })
        kitsStore.createIndex('by-name', 'name')

        // packingLists store
        const packingListsStore = db.createObjectStore('packingLists', { keyPath: 'id' })
        packingListsStore.createIndex('by-name', 'name')

        // settings store
        db.createObjectStore('settings', { keyPath: 'id' })
      },
    })
  }
  return dbPromise
}

// GearItems CRUD
export async function getAllGearItems(): Promise<GearItem[]> {
  const db = await getDB()
  return db.getAll('gearItems')
}

export async function getGearItem(id: string): Promise<GearItem | undefined> {
  const db = await getDB()
  return db.get('gearItems', id)
}

export async function putGearItem(item: GearItem): Promise<string> {
  const db = await getDB()
  return db.put('gearItems', item)
}

export async function deleteGearItem(id: string): Promise<void> {
  const db = await getDB()
  return db.delete('gearItems', id)
}

export async function getAllItemTypes(): Promise<string[]> {
  const items = await getAllGearItems()
  const types = new Set<string>()
  for (const item of items) {
    if (item.itemType && item.itemType.trim()) types.add(item.itemType.trim())
  }
  return [...types].sort()
}

// Kits CRUD
export async function getAllKits(): Promise<Kit[]> {
  const db = await getDB()
  return db.getAll('kits')
}

export async function getKit(id: string): Promise<Kit | undefined> {
  const db = await getDB()
  return db.get('kits', id)
}

export async function putKit(kit: Kit): Promise<string> {
  const db = await getDB()
  return db.put('kits', kit)
}

export async function deleteKit(id: string): Promise<void> {
  const db = await getDB()
  return db.delete('kits', id)
}

// PackingLists CRUD
export async function getAllPackingLists(): Promise<PackingList[]> {
  const db = await getDB()
  return db.getAll('packingLists')
}

export async function getPackingList(id: string): Promise<PackingList | undefined> {
  const db = await getDB()
  return db.get('packingLists', id)
}

export async function putPackingList(list: PackingList): Promise<string> {
  const db = await getDB()
  return db.put('packingLists', list)
}

export async function deletePackingList(id: string): Promise<void> {
  const db = await getDB()
  return db.delete('packingLists', id)
}

// Bulk replace all stores (used by import)
export async function replaceAllData(
  gearItems: GearItem[],
  kits: Kit[],
  packingLists: PackingList[],
  settings: AppSettings,
): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(['gearItems', 'kits', 'packingLists', 'settings'], 'readwrite')

  await tx.objectStore('gearItems').clear()
  await tx.objectStore('kits').clear()
  await tx.objectStore('packingLists').clear()
  await tx.objectStore('settings').clear()

  for (const item of gearItems) await tx.objectStore('gearItems').put(item)
  for (const kit of kits) await tx.objectStore('kits').put(kit)
  for (const list of packingLists) await tx.objectStore('packingLists').put(list)
  await tx.objectStore('settings').put({ ...settings, id: 'app-settings' })

  await tx.done
}

// Clear all data
export async function clearAllData(): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(['gearItems', 'kits', 'packingLists', 'settings'], 'readwrite')
  await tx.objectStore('gearItems').clear()
  await tx.objectStore('kits').clear()
  await tx.objectStore('packingLists').clear()
  await tx.objectStore('settings').clear()
  await tx.done
}

// Settings
const SETTINGS_KEY = 'app-settings'

export async function getSettings(): Promise<AppSettings | undefined> {
  const db = await getDB()
  const record = await db.get('settings', SETTINGS_KEY)
  if (!record) return undefined
  const { id: _id, ...settings } = record
  return settings as AppSettings
}

export async function putSettings(settings: AppSettings): Promise<string> {
  const db = await getDB()
  return db.put('settings', { ...settings, id: SETTINGS_KEY })
}
