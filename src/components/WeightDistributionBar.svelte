<script lang="ts">
  import type { GearItem, PackingListCategory, WeightUnit } from '../lib/types'
  import { formatWeight } from '../lib/weightUtils'
  import {
    computeWeightDistribution,
    describeDistribution,
    type WeightDistributionSegment,
  } from '../lib/weightDistribution'

  interface Props {
    categories: PackingListCategory[]
    gearItems: Map<string, GearItem>
    unit: WeightUnit
  }

  let { categories, gearItems, unit }: Props = $props()

  const distribution = $derived(computeWeightDistribution(categories, gearItems, unit))
  const summary = $derived(describeDistribution(distribution))

  /** Segments that actually occupy space in the bar. */
  const barSegments = $derived(distribution.segments.filter((s) => s.weightPercent > 0))

  /** Horizontal centre of each bar segment, as a percentage, keyed by segment id. */
  const centers = $derived.by(() => {
    const map = new Map<string, number>()
    let cursor = 0
    for (const seg of barSegments) {
      map.set(seg.id, cursor + seg.weightPercent / 2)
      cursor += seg.weightPercent
    }
    return map
  })

  // ─── tooltip state ────────────────────────────────────────────────────────
  // Touch is the primary interaction: a tap pins the tooltip, a tap anywhere
  // else (or Escape) dismisses it. Hover and keyboard focus are layered on top.
  let pinnedId = $state<string | null>(null)
  let hoveredId = $state<string | null>(null)
  let rootEl = $state<HTMLElement | null>(null)

  const activeId = $derived(pinnedId ?? hoveredId)
  const activeSegment = $derived(
    distribution.segments.find((s) => s.id === activeId) ?? null
  )

  /**
   * Anchored so the tooltip can never run off either edge on a narrow screen:
   * it flushes to the left or right edge of the card near the ends of the bar,
   * and only centres on the segment through the middle third.
   */
  const tooltipStyle = $derived.by(() => {
    const center = centers.get(activeId ?? '') ?? 50
    if (center <= 33) return 'left: 0;'
    if (center >= 67) return 'right: 0;'
    return `left: ${center}%; transform: translateX(-50%);`
  })

  function toggle(id: string) {
    pinnedId = pinnedId === id ? null : id
  }

  $effect(() => {
    function onPointerDown(event: PointerEvent) {
      const target = event.target
      if (rootEl && target instanceof Node && rootEl.contains(target)) return
      pinnedId = null
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') pinnedId = null
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  })

  function itemsLabel(count: number): string {
    return `${count} item${count === 1 ? '' : 's'}`
  }

  function segmentLabel(seg: WeightDistributionSegment): string {
    const base = seg.isOther
      ? `Other, ${seg.categoryCount} categories`
      : seg.name
    return `${base}: ${seg.weightPercent}% of weight, ${seg.itemPercent}% of items, ${itemsLabel(seg.itemCount)}, ${formatWeight(seg.weight, unit)}`
  }

  function segmentName(seg: WeightDistributionSegment): string {
    return seg.isOther ? `${seg.name} · ${seg.categoryCount} categories` : seg.name
  }

  const totalLabel = $derived(
    distribution.hasWeight
      ? `${formatWeight(distribution.totalWeight, unit)} · ${itemsLabel(distribution.totalItems)}`
      : itemsLabel(distribution.totalItems)
  )
</script>

{#if distribution.hasItems}
  <section
    bind:this={rootEl}
    class="viz-root mt-3 rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-3"
    aria-labelledby="weight-distribution-heading"
  >
    <div class="flex items-baseline justify-between gap-2 mb-2.5">
      <h3
        id="weight-distribution-heading"
        class="text-xs font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-400"
      >
        Load distribution
      </h3>
      <span class="text-xs tabular-nums text-zinc-500 dark:text-zinc-400 flex-shrink-0">
        {totalLabel}
      </span>
    </div>

    {#if !distribution.hasWeight}
      <p class="text-xs text-zinc-500 dark:text-zinc-400">
        No weights recorded yet — add weights to your gear to see how your load is
        distributed.
      </p>
    {:else}
      <p id="weight-distribution-summary" class="sr-only">{summary}</p>

      <!-- Stacked bar -->
      <div class="relative">
        {#if activeSegment}
          <div
            role="tooltip"
            class="absolute bottom-full mb-2 z-20 w-max max-w-full
              rounded-lg px-2.5 py-1.5 shadow-lg
              bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900
              pointer-events-none"
            style={tooltipStyle}
          >
            <p class="text-xs font-semibold truncate">{segmentName(activeSegment)}</p>
            <p class="text-xs tabular-nums">
              <span class="font-bold">{activeSegment.weightPercent}%</span>
              <span class="opacity-70">of weight</span>
              <span class="opacity-40">·</span>
              <span class="font-bold">{activeSegment.itemPercent}%</span>
              <span class="opacity-70">of items</span>
            </p>
            <p class="text-[11px] tabular-nums opacity-70">
              {formatWeight(activeSegment.weight, unit)} · {itemsLabel(activeSegment.itemCount)}
            </p>
          </div>
        {/if}

        <div
          class="flex gap-[2px] h-6 rounded-[4px] overflow-hidden"
          role="group"
          aria-labelledby="weight-distribution-heading"
          aria-describedby="weight-distribution-summary"
        >
          {#each barSegments as seg (seg.id)}
            <button
              type="button"
              class="h-full transition-opacity duration-150 focus:outline-none
                focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100
                focus-visible:ring-inset
                {activeId === seg.id ? 'brightness-110' : ''}
                {activeId && activeId !== seg.id ? 'opacity-70' : 'opacity-100'}"
              style="flex: {seg.weightPercent} 1 0%; min-width: 8px; background-color: var(--viz-s{seg.colorIndex +
                1});"
              aria-label={segmentLabel(seg)}
              aria-pressed={pinnedId === seg.id}
              onclick={() => toggle(seg.id)}
              onmouseenter={() => (hoveredId = seg.id)}
              onmouseleave={() => (hoveredId = null)}
              onfocus={() => (hoveredId = seg.id)}
              onblur={() => (hoveredId = null)}
            ></button>
          {/each}
        </div>
      </div>

      <!-- Legend / text breakdown: identity and values are never colour-only,
           and every category (including zero-weight ones) is reachable here. -->
      <div
        class="mt-3 flex items-center gap-2 px-1 pb-1 text-[10px] font-semibold uppercase
          tracking-wide text-zinc-400 dark:text-zinc-500"
        aria-hidden="true"
      >
        <span class="w-2.5 flex-shrink-0"></span>
        <span class="flex-1">Category</span>
        <span class="w-12 text-right">Weight</span>
        <span class="w-12 text-right">Items</span>
      </div>
      <ul class="space-y-0.5">
        {#each distribution.segments as seg (seg.id)}
          <li>
            <button
              type="button"
              class="w-full flex items-center gap-2 py-1.5 px-1 -mx-1 rounded-md text-left
                transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900
                focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400
                {activeId === seg.id ? 'bg-zinc-100 dark:bg-zinc-900' : ''}"
              aria-label={segmentLabel(seg)}
              aria-pressed={pinnedId === seg.id}
              onclick={() => toggle(seg.id)}
              onmouseenter={() => (hoveredId = seg.id)}
              onmouseleave={() => (hoveredId = null)}
              onfocus={() => (hoveredId = seg.id)}
              onblur={() => (hoveredId = null)}
            >
              <span
                class="w-2.5 h-2.5 rounded-[2px] flex-shrink-0"
                style="background-color: var(--viz-s{seg.colorIndex + 1});"
              ></span>
              <span class="flex-1 truncate text-xs text-zinc-700 dark:text-zinc-300"
                >{segmentName(seg)}</span
              >
              <span
                class="tabular-nums text-xs font-semibold text-zinc-800 dark:text-zinc-200 w-12 text-right flex-shrink-0"
                >{seg.weightPercent}%</span
              >
              <span
                class="tabular-nums text-xs text-zinc-500 dark:text-zinc-400 w-12 text-right flex-shrink-0"
                >{seg.itemPercent}%</span
              >
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
{/if}

<style>
  /* Categorical palette — slots assigned in fixed order, never cycled.
     Both modes are selected (the dark column is the same hues re-stepped for a
     dark surface) and validated: adjacent-pair CVD ΔE ≥ 8 and normal-vision
     ΔE ≥ 15 in both modes. Three light-mode slots sit under 3:1 against white,
     which the always-present legend relieves with visible text labels. */
  .viz-root {
    --viz-s1: #2a78d6;
    --viz-s2: #eb6834;
    --viz-s3: #1baf7a;
    --viz-s4: #eda100;
    --viz-s5: #e87ba4;
    --viz-s6: #008300;
    --viz-s7: #4a3aa7;
  }

  :global(.dark) .viz-root {
    --viz-s1: #3987e5;
    --viz-s2: #d95926;
    --viz-s3: #199e70;
    --viz-s4: #c98500;
    --viz-s5: #d55181;
    --viz-s6: #008300;
    --viz-s7: #9085e9;
  }
</style>
