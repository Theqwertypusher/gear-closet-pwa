import type { GearItem, PackingListCategory, WeightUnit } from './types'
import { computeItemsWeight } from './weightUtils'

/**
 * Maximum number of coloured segments the stacked bar will ever render.
 * Matches the number of validated categorical palette slots. Anything past
 * this folds into a single "Other" segment rather than inventing a new hue.
 */
export const MAX_DISTRIBUTION_SEGMENTS = 7

/** Stable id used for the folded "Other" segment. */
export const OTHER_SEGMENT_ID = '__other__'

/** Label used for the folded "Other" segment. */
export const OTHER_SEGMENT_NAME = 'Other'

export interface WeightDistributionSegment {
  /** Category id, or OTHER_SEGMENT_ID for the folded remainder. */
  id: string
  /** Category name, or "Other" for the folded remainder. */
  name: string
  /** Weight of this segment, in the requested unit. */
  weight: number
  /** Share of total weight, 0–100, rounded to 1dp. Rounded shares sum to exactly 100. */
  weightPercent: number
  /** Number of items (summed quantities) in this segment. */
  itemCount: number
  /** Share of total items, 0–100, rounded to 1dp. Rounded shares sum to exactly 100. */
  itemPercent: number
  /** 0-based categorical palette slot for this segment. */
  colorIndex: number
  /** True when this segment is the folded remainder. */
  isOther: boolean
  /** How many source categories this segment represents (>1 only for "Other"). */
  categoryCount: number
}

export interface WeightDistribution {
  /** Segments in descending weight order; "Other" (when present) is always last. */
  segments: WeightDistributionSegment[]
  /** Total weight across all categories, in the requested unit. */
  totalWeight: number
  /** Total number of items (summed quantities) across all categories. */
  totalItems: number
  /** Unit the weights are expressed in. */
  unit: WeightUnit
  /** False when the list has no items at all. */
  hasItems: boolean
  /** False when every item weighs zero (or has no weight recorded). */
  hasWeight: boolean
}

/**
 * Turn a set of raw values into percentages that sum to exactly 100 after
 * rounding, using the largest-remainder method so the bar never drifts to
 * 99.9% or 100.1%.
 *
 * Returns all zeroes when the values sum to zero (or are not finite), which is
 * the caller's cue that there is nothing to plot.
 */
export function distributePercentages(values: number[], decimals = 1): number[] {
  const safe = values.map((v) => (Number.isFinite(v) && v > 0 ? v : 0))
  const total = safe.reduce((sum, v) => sum + v, 0)
  if (total <= 0) return safe.map(() => 0)

  const scale = 10 ** decimals
  const target = 100 * scale
  const exact = safe.map((v) => (v / total) * target)
  const out = exact.map((v) => Math.floor(v))

  let remainder = target - out.reduce((sum, v) => sum + v, 0)
  const byFraction = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i)

  for (let k = 0; k < byFraction.length && remainder > 0; k++) {
    out[byFraction[k].i] += 1
    remainder -= 1
  }

  return out.map((v) => v / scale)
}

interface RawCategoryTotals {
  id: string
  name: string
  weight: number
  itemCount: number
}

function rawTotals(
  categories: PackingListCategory[],
  gearItems: Map<string, GearItem>,
  unit: WeightUnit
): RawCategoryTotals[] {
  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    weight: computeItemsWeight(cat.items, gearItems, unit),
    // Only count items whose gear item still exists — those are the ones the
    // list actually renders, and the ones that contribute weight.
    itemCount: cat.items.reduce(
      (sum, item) => (gearItems.has(item.gearItemId) ? sum + item.quantity : sum),
      0
    ),
  }))
}

/**
 * Break a packing list's categories down into stacked-bar segments: each
 * category's share of total weight and share of total item count.
 *
 * Degenerate cases are handled rather than divided by:
 *  - no categories / no items  → `hasItems: false`, no segments
 *  - every item weighs zero    → `hasWeight: false`, weight percentages are 0
 *                                (item percentages are still meaningful)
 *
 * Categories past MAX_DISTRIBUTION_SEGMENTS are folded into a single "Other"
 * segment so the bar never needs an unvalidated colour.
 */
export function computeWeightDistribution(
  categories: PackingListCategory[],
  gearItems: Map<string, GearItem>,
  unit: WeightUnit
): WeightDistribution {
  const totals = rawTotals(categories ?? [], gearItems, unit)
    // Drop empty categories entirely — an empty category is not part of the load.
    .filter((t) => t.itemCount > 0)

  const totalWeight = totals.reduce((sum, t) => sum + t.weight, 0)
  const totalItems = totals.reduce((sum, t) => sum + t.itemCount, 0)

  const empty: WeightDistribution = {
    segments: [],
    totalWeight: 0,
    totalItems: 0,
    unit,
    hasItems: false,
    hasWeight: false,
  }

  if (totals.length === 0 || totalItems === 0) return empty

  // Heaviest first; ties broken by item count, then name, so the order is stable.
  const sorted = [...totals].sort(
    (a, b) => b.weight - a.weight || b.itemCount - a.itemCount || a.name.localeCompare(b.name)
  )

  let grouped: RawCategoryTotals[] = sorted
  let otherCategoryCount = 0

  if (sorted.length > MAX_DISTRIBUTION_SEGMENTS) {
    const head = sorted.slice(0, MAX_DISTRIBUTION_SEGMENTS - 1)
    const tail = sorted.slice(MAX_DISTRIBUTION_SEGMENTS - 1)
    otherCategoryCount = tail.length
    grouped = [
      ...head,
      {
        id: OTHER_SEGMENT_ID,
        name: OTHER_SEGMENT_NAME,
        weight: tail.reduce((sum, t) => sum + t.weight, 0),
        itemCount: tail.reduce((sum, t) => sum + t.itemCount, 0),
      },
    ]
  }

  const weightPercents = distributePercentages(grouped.map((g) => g.weight))
  const itemPercents = distributePercentages(grouped.map((g) => g.itemCount))

  const segments: WeightDistributionSegment[] = grouped.map((g, i) => ({
    id: g.id,
    name: g.name,
    weight: g.weight,
    weightPercent: weightPercents[i],
    itemCount: g.itemCount,
    itemPercent: itemPercents[i],
    colorIndex: i,
    isOther: g.id === OTHER_SEGMENT_ID,
    categoryCount: g.id === OTHER_SEGMENT_ID ? otherCategoryCount : 1,
  }))

  return {
    segments,
    totalWeight,
    totalItems,
    unit,
    hasItems: true,
    hasWeight: totalWeight > 0,
  }
}

/**
 * One-line, screen-reader friendly summary of a distribution. Also used as the
 * bar's accessible description so the chart never relies on colour alone.
 */
export function describeDistribution(distribution: WeightDistribution): string {
  if (!distribution.hasItems) return 'No items to show.'
  if (!distribution.hasWeight) {
    return `${distribution.totalItems} item${distribution.totalItems === 1 ? '' : 's'}, no weights recorded.`
  }
  const parts = distribution.segments.map(
    (s) => `${s.name} ${s.weightPercent}% of weight and ${s.itemPercent}% of items`
  )
  return `Weight distribution by category: ${parts.join(', ')}.`
}
