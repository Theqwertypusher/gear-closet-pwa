import { describe, it, expect } from 'vitest'
import {
  computeWeightDistribution,
  describeDistribution,
  distributePercentages,
  MAX_DISTRIBUTION_SEGMENTS,
  OTHER_SEGMENT_ID,
} from '../weightDistribution'
import type { GearItem, PackingListCategory, PackingListItem } from '../types'

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

function makeItem(gearItemId: string, quantity = 1): PackingListItem {
  return { id: `pli-${gearItemId}-${quantity}`, gearItemId, quantity, checked: false }
}

function makeCategory(
  id: string,
  name: string,
  items: PackingListItem[],
  sortOrder = 0
): PackingListCategory {
  return { id, name, items, sortOrder }
}

/** Build a gear map where gear `g{n}` weighs `weights[n-1]` grams. */
function gearMap(weights: number[]): Map<string, GearItem> {
  return new Map(
    weights.map((w, i) => [
      `g${i + 1}`,
      makeGearItem({ id: `g${i + 1}`, name: `Gear ${i + 1}`, weight: w, weightUnit: 'g' }),
    ])
  )
}

function sum(values: number[]): number {
  return values.reduce((s, v) => s + v, 0)
}

/**
 * Sum 1dp percentages in tenths, so the assertion tests the distribution for
 * drift rather than testing IEEE-754 decimal representation.
 */
function sumPercents(values: number[]): number {
  return values.reduce((s, v) => s + Math.round(v * 10), 0) / 10
}

// ─── distributePercentages ───────────────────────────────────────────────────

describe('distributePercentages', () => {
  it('returns all zeroes for an empty input', () => {
    expect(distributePercentages([])).toEqual([])
  })

  it('returns all zeroes when the values sum to zero', () => {
    expect(distributePercentages([0, 0, 0])).toEqual([0, 0, 0])
  })

  it('gives a single value 100%', () => {
    expect(distributePercentages([42])).toEqual([100])
  })

  it('splits evenly divisible values exactly', () => {
    expect(distributePercentages([1, 1, 1, 1])).toEqual([25, 25, 25, 25])
  })

  it('sums to exactly 100 for values that do not divide evenly', () => {
    const out = distributePercentages([1, 1, 1])
    expect(sumPercents(out)).toBe(100)
    // largest-remainder: on an exact tie the lowest index absorbs the leftover tenth
    expect(out).toEqual([33.4, 33.3, 33.3])
  })

  it('sums to exactly 100 across many awkward values (no drift)', () => {
    const values = [7, 13, 1, 1, 1, 29, 3, 101, 0.5]
    expect(sumPercents(distributePercentages(values))).toBe(100)
  })

  it('treats negative and non-finite values as zero', () => {
    const out = distributePercentages([-5, 10, Number.NaN, 10])
    expect(out).toEqual([0, 50, 0, 50])
  })

  it('honours a custom number of decimal places', () => {
    const out = distributePercentages([1, 1, 1], 0)
    expect(sumPercents(out)).toBe(100)
    expect(out).toEqual([34, 33, 33])
  })
})

// ─── computeWeightDistribution ───────────────────────────────────────────────

describe('computeWeightDistribution', () => {
  it('handles an empty list without dividing by zero', () => {
    const dist = computeWeightDistribution([], new Map(), 'g')
    expect(dist.segments).toEqual([])
    expect(dist.totalWeight).toBe(0)
    expect(dist.totalItems).toBe(0)
    expect(dist.hasItems).toBe(false)
    expect(dist.hasWeight).toBe(false)
  })

  it('ignores categories that contain no items', () => {
    const gear = gearMap([100])
    const dist = computeWeightDistribution(
      [makeCategory('c1', 'Empty', []), makeCategory('c2', 'Shelter', [makeItem('g1')])],
      gear,
      'g'
    )
    expect(dist.segments).toHaveLength(1)
    expect(dist.segments[0].name).toBe('Shelter')
  })

  it('ignores items whose gear item no longer exists', () => {
    const gear = gearMap([100])
    const dist = computeWeightDistribution(
      [makeCategory('c1', 'Shelter', [makeItem('g1'), makeItem('missing', 3)])],
      gear,
      'g'
    )
    expect(dist.totalItems).toBe(1)
    expect(dist.totalWeight).toBeCloseTo(100, 5)
  })

  it('gives a single category 100% of weight and 100% of items', () => {
    const gear = gearMap([250])
    const dist = computeWeightDistribution(
      [makeCategory('c1', 'Shelter', [makeItem('g1', 2)])],
      gear,
      'g'
    )
    expect(dist.segments).toHaveLength(1)
    expect(dist.segments[0]).toMatchObject({
      id: 'c1',
      name: 'Shelter',
      weightPercent: 100,
      itemPercent: 100,
      itemCount: 2,
      colorIndex: 0,
      isOther: false,
      categoryCount: 1,
    })
    expect(dist.segments[0].weight).toBeCloseTo(500, 5)
    expect(dist.hasItems).toBe(true)
    expect(dist.hasWeight).toBe(true)
  })

  it('computes weight and item shares across multiple categories', () => {
    // g1 = 600g, g2 = 300g, g3 = 100g
    const gear = gearMap([600, 300, 100])
    const dist = computeWeightDistribution(
      [
        makeCategory('c1', 'Shelter', [makeItem('g1')]),
        makeCategory('c2', 'Kitchen', [makeItem('g2')]),
        makeCategory('c3', 'Clothing', [makeItem('g3', 2)]),
      ],
      gear,
      'g'
    )

    expect(dist.totalWeight).toBeCloseTo(1100, 5)
    expect(dist.totalItems).toBe(4)
    expect(dist.segments.map((s) => s.name)).toEqual(['Shelter', 'Kitchen', 'Clothing'])
    expect(dist.segments.map((s) => s.weightPercent)).toEqual([54.5, 27.3, 18.2])
    expect(dist.segments.map((s) => s.itemPercent)).toEqual([25, 25, 50])
    expect(sumPercents(dist.segments.map((s) => s.weightPercent))).toBe(100)
    expect(sumPercents(dist.segments.map((s) => s.itemPercent))).toBe(100)
  })

  it('sorts segments heaviest first and assigns colour slots in that order', () => {
    const gear = gearMap([10, 900, 300])
    const dist = computeWeightDistribution(
      [
        makeCategory('c1', 'Light', [makeItem('g1')]),
        makeCategory('c2', 'Heavy', [makeItem('g2')]),
        makeCategory('c3', 'Middle', [makeItem('g3')]),
      ],
      gear,
      'g'
    )
    expect(dist.segments.map((s) => s.name)).toEqual(['Heavy', 'Middle', 'Light'])
    expect(dist.segments.map((s) => s.colorIndex)).toEqual([0, 1, 2])
  })

  it('converts to the requested unit', () => {
    const gear = gearMap([1000])
    const dist = computeWeightDistribution(
      [makeCategory('c1', 'Shelter', [makeItem('g1')])],
      gear,
      'kg'
    )
    expect(dist.unit).toBe('kg')
    expect(dist.totalWeight).toBeCloseTo(1, 5)
  })

  it('handles zero-weight items: item shares still work, weight shares are zero', () => {
    const gear = gearMap([0, 0])
    const dist = computeWeightDistribution(
      [
        makeCategory('c1', 'Shelter', [makeItem('g1')]),
        makeCategory('c2', 'Kitchen', [makeItem('g2', 3)]),
      ],
      gear,
      'g'
    )
    expect(dist.hasItems).toBe(true)
    expect(dist.hasWeight).toBe(false)
    expect(dist.totalWeight).toBe(0)
    expect(dist.segments.map((s) => s.weightPercent)).toEqual([0, 0])
    expect(sumPercents(dist.segments.map((s) => s.itemPercent))).toBe(100)
  })

  it('keeps a zero-weight category in the breakdown at 0% of weight', () => {
    const gear = gearMap([500, 0])
    const dist = computeWeightDistribution(
      [
        makeCategory('c1', 'Shelter', [makeItem('g1')]),
        makeCategory('c2', 'Paperwork', [makeItem('g2', 2)]),
      ],
      gear,
      'g'
    )
    const paperwork = dist.segments.find((s) => s.name === 'Paperwork')
    expect(paperwork).toBeDefined()
    expect(paperwork!.weightPercent).toBe(0)
    expect(paperwork!.itemPercent).toBeCloseTo(66.7, 5)
    expect(sumPercents(dist.segments.map((s) => s.weightPercent))).toBe(100)
  })

  it('folds categories past the palette cap into a single "Other" segment', () => {
    const weights = [100, 90, 80, 70, 60, 50, 40, 30, 20]
    const gear = gearMap(weights)
    const categories = weights.map((_, i) =>
      makeCategory(`c${i + 1}`, `Cat ${i + 1}`, [makeItem(`g${i + 1}`)], i)
    )
    const dist = computeWeightDistribution(categories, gear, 'g')

    expect(dist.segments).toHaveLength(MAX_DISTRIBUTION_SEGMENTS)
    const other = dist.segments[dist.segments.length - 1]
    expect(other.id).toBe(OTHER_SEGMENT_ID)
    expect(other.isOther).toBe(true)
    // the three lightest categories fold in: 40 + 30 + 20
    expect(other.categoryCount).toBe(3)
    expect(other.weight).toBeCloseTo(90, 5)
    expect(other.itemCount).toBe(3)
    expect(sumPercents(dist.segments.map((s) => s.weightPercent))).toBe(100)
    expect(sumPercents(dist.segments.map((s) => s.itemPercent))).toBe(100)
  })

  it('does not fold when the category count exactly fills the palette', () => {
    const weights = [70, 60, 50, 40, 30, 20, 10]
    const gear = gearMap(weights)
    const categories = weights.map((_, i) =>
      makeCategory(`c${i + 1}`, `Cat ${i + 1}`, [makeItem(`g${i + 1}`)], i)
    )
    const dist = computeWeightDistribution(categories, gear, 'g')
    expect(dist.segments).toHaveLength(MAX_DISTRIBUTION_SEGMENTS)
    expect(dist.segments.some((s) => s.isOther)).toBe(false)
  })

  it('percentages sum to exactly 100 for a wide spread of awkward weights', () => {
    const weights = [333, 1, 7, 29, 1001, 17]
    const gear = gearMap(weights)
    const categories = weights.map((_, i) =>
      makeCategory(`c${i + 1}`, `Cat ${i + 1}`, [makeItem(`g${i + 1}`, i + 1)], i)
    )
    const dist = computeWeightDistribution(categories, gear, 'g')
    expect(sumPercents(dist.segments.map((s) => s.weightPercent))).toBe(100)
    expect(sumPercents(dist.segments.map((s) => s.itemPercent))).toBe(100)
  })
})

// ─── describeDistribution ────────────────────────────────────────────────────

describe('describeDistribution', () => {
  it('describes an empty list', () => {
    const dist = computeWeightDistribution([], new Map(), 'g')
    expect(describeDistribution(dist)).toBe('No items to show.')
  })

  it('describes a weightless list', () => {
    const gear = gearMap([0])
    const dist = computeWeightDistribution(
      [makeCategory('c1', 'Shelter', [makeItem('g1')])],
      gear,
      'g'
    )
    expect(describeDistribution(dist)).toBe('1 item, no weights recorded.')
  })

  it('names every category with both percentages', () => {
    const gear = gearMap([750, 250])
    const dist = computeWeightDistribution(
      [
        makeCategory('c1', 'Shelter', [makeItem('g1')]),
        makeCategory('c2', 'Kitchen', [makeItem('g2')]),
      ],
      gear,
      'g'
    )
    expect(describeDistribution(dist)).toBe(
      'Weight distribution by category: Shelter 75% of weight and 50% of items, Kitchen 25% of weight and 50% of items.'
    )
  })
})
