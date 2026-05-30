import { describe, it, expect } from 'vitest'
import {
  convertWeight,
  formatWeight,
  itemWeightIn,
  computePackingListWeights,
  computeItemsWeight,
} from '../weightUtils'
import type { GearItem, PackingList } from '../types'

// ─── helpers ────────────────────────────────────────────────────────────────

function makeGearItem(overrides: Partial<GearItem> = {}): GearItem {
  return {
    id: 'gear-1',
    name: 'Test Item',
    brand: 'Brand',
    weight: 1000,
    weightUnit: 'g',
    weightCategory: 'base',
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

function makePackingList(overrides: Partial<PackingList> = {}): PackingList {
  return {
    id: 'list-1',
    name: 'Test List',
    categories: [],
    tripNotes: '',
    isPackingMode: false,
    listMode: 'draft',
    sortOrder: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

// ─── convertWeight ───────────────────────────────────────────────────────────

describe('convertWeight', () => {
  it('returns the same value when from === to', () => {
    expect(convertWeight(500, 'g', 'g')).toBe(500)
    expect(convertWeight(2.5, 'oz', 'oz')).toBe(2.5)
  })

  it('converts grams to ounces', () => {
    // 28.3495 g = 1 oz → 1000 g ≈ 35.27 oz
    expect(convertWeight(1000, 'g', 'oz')).toBeCloseTo(35.27, 1)
  })

  it('converts grams to kg', () => {
    expect(convertWeight(1000, 'g', 'kg')).toBeCloseTo(1, 5)
  })

  it('converts kg to lbs', () => {
    // 1 kg = 1000 g / 453.592 ≈ 2.205 lbs
    expect(convertWeight(1, 'kg', 'lbs')).toBeCloseTo(2.205, 2)
  })

  it('converts oz to g', () => {
    expect(convertWeight(1, 'oz', 'g')).toBeCloseTo(28.3495, 4)
  })

  it('is symmetric (round-trip stays close)', () => {
    const original = 567
    const roundTrip = convertWeight(convertWeight(original, 'g', 'lbs'), 'lbs', 'g')
    expect(roundTrip).toBeCloseTo(original, 5)
  })
})

// ─── formatWeight ────────────────────────────────────────────────────────────

describe('formatWeight', () => {
  it('formats grams with 0 decimal places', () => {
    expect(formatWeight(500, 'g')).toBe('500 g')
    expect(formatWeight(500.9, 'g')).toBe('501 g')
  })

  it('formats oz with 2 decimal places', () => {
    expect(formatWeight(1.5, 'oz')).toBe('1.50 oz')
  })

  it('formats lbs with 2 decimal places', () => {
    expect(formatWeight(2.5, 'lbs')).toBe('2.50 lbs')
  })

  it('formats kg with 2 decimal places', () => {
    expect(formatWeight(1.234, 'kg')).toBe('1.23 kg')
  })
})

// ─── itemWeightIn ─────────────────────────────────────────────────────────────

describe('itemWeightIn', () => {
  it('returns weight in target unit when same', () => {
    const item = makeGearItem({ weight: 800, weightUnit: 'g' })
    expect(itemWeightIn(item, 'g')).toBe(800)
  })

  it('converts item weight to a different unit', () => {
    const item = makeGearItem({ weight: 1000, weightUnit: 'g' })
    expect(itemWeightIn(item, 'kg')).toBeCloseTo(1, 5)
  })
})

// ─── computePackingListWeights ────────────────────────────────────────────────

describe('computePackingListWeights', () => {
  it('returns zeros for an empty list', () => {
    const list = makePackingList()
    const result = computePackingListWeights(list, new Map(), 'g')
    expect(result).toEqual({ base: 0, wearable: 0, consumable: 0, total: 0 })
  })

  it('sums weights by category', () => {
    const tent = makeGearItem({ id: 'tent', weight: 1000, weightUnit: 'g', weightCategory: 'base' })
    const jacket = makeGearItem({ id: 'jacket', weight: 500, weightUnit: 'g', weightCategory: 'wearable' })
    const food = makeGearItem({ id: 'food', weight: 200, weightUnit: 'g', weightCategory: 'consumable' })

    const list = makePackingList({
      categories: [
        {
          id: 'cat-1', name: 'Cat', sortOrder: 0,
          items: [
            { id: 'i1', gearItemId: 'tent', quantity: 1, checked: false },
            { id: 'i2', gearItemId: 'jacket', quantity: 1, checked: false },
            { id: 'i3', gearItemId: 'food', quantity: 2, checked: false },
          ],
        },
      ],
    })

    const gearMap = new Map([['tent', tent], ['jacket', jacket], ['food', food]])
    const result = computePackingListWeights(list, gearMap, 'g')

    expect(result.base).toBe(1000)
    expect(result.wearable).toBe(500)
    expect(result.consumable).toBe(400) // 200 × 2
    expect(result.total).toBe(1900)
  })

  it('multiplies weight by quantity', () => {
    const item = makeGearItem({ id: 'stake', weight: 10, weightUnit: 'g', weightCategory: 'base' })
    const list = makePackingList({
      categories: [{
        id: 'c', name: 'C', sortOrder: 0,
        items: [{ id: 'i', gearItemId: 'stake', quantity: 8, checked: false }],
      }],
    })
    const result = computePackingListWeights(list, new Map([['stake', item]]), 'g')
    expect(result.base).toBe(80)
  })

  it('skips items whose gearItemId is not in the map', () => {
    const list = makePackingList({
      categories: [{
        id: 'c', name: 'C', sortOrder: 0,
        items: [{ id: 'i', gearItemId: 'missing-id', quantity: 1, checked: false }],
      }],
    })
    const result = computePackingListWeights(list, new Map(), 'g')
    expect(result.total).toBe(0)
  })

  it('converts weight to the target unit', () => {
    const item = makeGearItem({ id: 'bag', weight: 1000, weightUnit: 'g', weightCategory: 'base' })
    const list = makePackingList({
      categories: [{
        id: 'c', name: 'C', sortOrder: 0,
        items: [{ id: 'i', gearItemId: 'bag', quantity: 1, checked: false }],
      }],
    })
    const result = computePackingListWeights(list, new Map([['bag', item]]), 'kg')
    expect(result.base).toBeCloseTo(1, 5)
    expect(result.total).toBeCloseTo(1, 5)
  })
})

// ─── computeItemsWeight ───────────────────────────────────────────────────────

describe('computeItemsWeight', () => {
  it('returns 0 for empty item list', () => {
    expect(computeItemsWeight([], new Map(), 'g')).toBe(0)
  })

  it('sums weight × quantity for all items', () => {
    const a = makeGearItem({ id: 'a', weight: 100, weightUnit: 'g', weightCategory: 'base' })
    const b = makeGearItem({ id: 'b', weight: 200, weightUnit: 'g', weightCategory: 'wearable' })
    const items = [
      { id: 'i1', gearItemId: 'a', quantity: 3, checked: false },
      { id: 'i2', gearItemId: 'b', quantity: 1, checked: false },
    ]
    const result = computeItemsWeight(items, new Map([['a', a], ['b', b]]), 'g')
    expect(result).toBe(500) // 300 + 200
  })

  it('skips items not in the gear map', () => {
    const items = [{ id: 'i1', gearItemId: 'ghost', quantity: 5, checked: false }]
    expect(computeItemsWeight(items, new Map(), 'g')).toBe(0)
  })
})
