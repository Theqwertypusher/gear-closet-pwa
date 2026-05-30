import type { WeightUnit, WeightCategory, GearItem, PackingList, PackingListItem } from './types'

// Conversion factors to grams (base unit)
const TO_GRAMS: Record<WeightUnit, number> = {
  g: 1,
  oz: 28.3495,
  lbs: 453.592,
  kg: 1000,
}

/**
 * Convert a weight value from one unit to another.
 */
export function convertWeight(value: number, from: WeightUnit, to: WeightUnit): number {
  if (from === to) return value
  const grams = value * TO_GRAMS[from]
  return grams / TO_GRAMS[to]
}

/**
 * Format a weight value with a reasonable number of decimal places.
 */
export function formatWeight(value: number, unit: WeightUnit): string {
  const decimals = unit === 'g' ? 0 : 2
  return `${value.toFixed(decimals)} ${unit}`
}

/**
 * Convert a GearItem's weight to the target unit.
 */
export function itemWeightIn(item: GearItem, targetUnit: WeightUnit): number {
  return convertWeight(item.weight, item.weightUnit, targetUnit)
}

export interface WeightTotals {
  base: number
  wearable: number
  consumable: number
  total: number
}

/**
 * Compute weight totals broken down by WeightCategory for a packing list,
 * using the provided gearItems map. All totals are returned in targetUnit.
 */
export function computePackingListWeights(
  packingList: PackingList,
  gearItems: Map<string, GearItem>,
  targetUnit: WeightUnit
): WeightTotals {
  const totals: Record<WeightCategory, number> = {
    base: 0,
    wearable: 0,
    consumable: 0,
  }

  for (const category of packingList.categories) {
    for (const pli of category.items) {
      const gearItem = gearItems.get(pli.gearItemId)
      if (!gearItem) continue
      const weightInTarget = itemWeightIn(gearItem, targetUnit)
      totals[gearItem.weightCategory] += weightInTarget * pli.quantity
    }
  }

  return {
    base: totals.base,
    wearable: totals.wearable,
    consumable: totals.consumable,
    total: totals.base + totals.wearable + totals.consumable,
  }
}

/**
 * Compute the total weight for a subset of PackingListItems (e.g. checked items only).
 */
export function computeItemsWeight(
  items: PackingListItem[],
  gearItems: Map<string, GearItem>,
  targetUnit: WeightUnit
): number {
  return items.reduce((sum, pli) => {
    const gearItem = gearItems.get(pli.gearItemId)
    if (!gearItem) return sum
    return sum + itemWeightIn(gearItem, targetUnit) * pli.quantity
  }, 0)
}
