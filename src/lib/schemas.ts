import { z } from 'zod'

export const WeightUnitSchema = z.enum(['g', 'oz', 'lbs', 'kg'])

export const WeightCategorySchema = z.enum(['base', 'wearable', 'consumable'])

export const GearItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  brand: z.string(),
  itemType: z.string().optional(),
  weight: z.number().nonnegative(),
  weightUnit: WeightUnitSchema,
  weightCategory: WeightCategorySchema,
  notes: z.string(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
})

export const KitSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  itemIds: z.array(z.string()),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
})

export const PackingListItemSchema = z.object({
  id: z.string().min(1),
  gearItemId: z.string().min(1),
  quantity: z.number().int().positive(),
  checked: z.boolean(),
})

export const PackingListCategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  items: z.array(PackingListItemSchema),
})

export const PackingListSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  categories: z.array(PackingListCategorySchema),
  tripNotes: z.string(),
  isPackingMode: z.boolean(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
})

export const AppSettingsSchema = z.object({
  weightUnit: WeightUnitSchema,
  lastExportDate: z.string().datetime({ offset: true }).nullable(),
})

export const AppStateSchema = z.object({
  gearItems: z.array(GearItemSchema),
  kits: z.array(KitSchema),
  packingLists: z.array(PackingListSchema),
  settings: AppSettingsSchema,
})

// Inferred types (should match types.ts)
export type WeightUnitInput = z.infer<typeof WeightUnitSchema>
export type WeightCategoryInput = z.infer<typeof WeightCategorySchema>
export type GearItemInput = z.infer<typeof GearItemSchema>
export type KitInput = z.infer<typeof KitSchema>
export type PackingListItemInput = z.infer<typeof PackingListItemSchema>
export type PackingListCategoryInput = z.infer<typeof PackingListCategorySchema>
export type PackingListInput = z.infer<typeof PackingListSchema>
export type AppSettingsInput = z.infer<typeof AppSettingsSchema>
export type AppStateInput = z.infer<typeof AppStateSchema>
