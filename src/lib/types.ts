export type WeightUnit = 'g' | 'oz' | 'lbs' | 'kg'

export type WeightCategory = 'base' | 'wearable' | 'consumable'

export interface GearItem {
  id: string
  name: string
  brand: string
  itemType?: string
  weight: number
  weightUnit: WeightUnit
  weightCategory: WeightCategory
  notes: string
  ownerName?: string
  ownerId?: string
  createdAt: string
  updatedAt: string
}

export interface Kit {
  id: string
  name: string
  description: string
  itemIds: string[]
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface Packer {
  id: string
  name: string
  color: string
}

export const PACKER_COLORS = ['#6366f1', '#f43f5e', '#f59e0b', '#14b8a6', '#8b5cf6']

export interface PackingListItem {
  id: string
  gearItemId: string
  quantity: number
  checked: boolean
  assigneeId?: string
}

export interface PackingListCategory {
  id: string
  name: string
  items: PackingListItem[]
  sortOrder: number
}

export type ListMode = 'draft' | 'final'

export interface PackingList {
  id: string
  name: string
  categories: PackingListCategory[]
  tripNotes: string
  isPackingMode: boolean
  listMode: ListMode
  packers: Packer[]
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type AppTheme = 'light' | 'dark'

export interface AppSettings {
  weightUnit: WeightUnit
  lastExportDate: string | null
  tutorialMode: boolean
  hasSeenWelcome: boolean
  theme: AppTheme
  demoModeLocked: boolean
  displayName: string
}

export interface AppState {
  gearItems: GearItem[]
  kits: Kit[]
  packingLists: PackingList[]
  settings: AppSettings
}
