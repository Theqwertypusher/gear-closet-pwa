<script lang="ts">
  import { X, Check } from '@lucide/svelte'
  import type { Kit, GearItem, WeightUnit, WeightCategory } from '../lib/types'
  import BottomSheet from './BottomSheet.svelte'
  import { itemWeightIn, formatWeight } from '../lib/weightUtils'
  import { gearStore } from '../lib/stores/gearStore.svelte'

  interface Props {
    kit?: Kit | null
    gearItems: GearItem[]
    weightUnit: WeightUnit
    onSave: (data: Omit<Kit, 'id' | 'createdAt' | 'updatedAt'>) => void
    onClose: () => void
  }

  let { kit = null, gearItems, weightUnit, onSave, onClose }: Props = $props()

  const initialName = kit?.name ?? ''
  const initialDesc = kit?.description ?? ''
  const initialIds = kit?.itemIds ?? []

  let name = $state(initialName)
  let description = $state(initialDesc)
  let selectedIds = $state(new Set<string>(initialIds))

  let errors = $state<{ name?: string; items?: string }>({})

  const categoryLabels: Record<WeightCategory, string> = {
    base: 'Base',
    wearable: 'Wearable',
    consumable: 'Consumable',
  }

  const catBadgeClass: Record<WeightCategory, string> = {
    base: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    wearable: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    consumable: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  }

  // Search + filter state
  let search = $state('')
  let activeType = $state<string | null>(null)

  // Item type tags from the gear store (alphabetical)
  const itemTypes = $derived(gearStore.itemTypes)

  // Fuzzy-ish search: score by how early/how many chars match
  function score(item: GearItem, q: string): number {
    if (!q) return 0
    const hay = `${item.name} ${item.brand ?? ''} ${item.itemType ?? ''}`.toLowerCase()
    const needle = q.toLowerCase()
    const idx = hay.indexOf(needle)
    if (idx === -1) return -1
    return 1000 - idx // earlier match = higher score
  }

  const pickerItems = $derived(() => {
    let items = gearItems
    if (activeType) items = items.filter((i) => i.itemType === activeType)
    const q = search.trim()
    if (q) {
      items = items
        .map((i) => ({ item: i, s: score(i, q) }))
        .filter((x) => x.s >= 0)
        .sort((a, b) => b.s - a.s)
        .map((x) => x.item)
    }
    // Sort by weight descending
    return [...items].sort((a, b) => itemWeightIn(b, weightUnit) - itemWeightIn(a, weightUnit))
  })

  // Selected items grouped by weight category (only show categories that have selections)
  const selectedGrouped = $derived(() => {
    const cats: WeightCategory[] = ['base', 'wearable', 'consumable']
    return cats
      .map((cat) => ({
        cat,
        label: categoryLabels[cat],
        items: gearItems.filter((i) => selectedIds.has(i.id) && i.weightCategory === cat),
      }))
      .filter((g) => g.items.length > 0)
  })

  const totalWeight = $derived(() => {
    let sum = 0
    for (const item of gearItems) {
      if (selectedIds.has(item.id)) {
        sum += itemWeightIn(item, weightUnit)
      }
    }
    return sum
  })

  function toggleItem(id: string) {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    selectedIds = next
  }

  function validate(): boolean {
    const e: typeof errors = {}
    if (!name.trim()) e.name = 'Kit name is required'
    if (selectedIds.size === 0) e.items = 'Select at least one item'
    errors = e
    return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!validate()) return
    onSave({
      name: name.trim(),
      description: description.trim(),
      itemIds: Array.from(selectedIds),
    })
  }

  $effect(() => {
    const handler = () => onClose()
    window.addEventListener('shortcut:escape', handler)
    return () => window.removeEventListener('shortcut:escape', handler)
  })
</script>

<BottomSheet onclose={onClose}>
  <!-- Header -->
  <div class="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0">
      <h2 class="text-lg font-semibold">{kit ? `Edit: ${kit.name}` : 'Create Kit'}</h2>
      <button
        onclick={onClose}
        class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        aria-label="Close"
      >
        <X size={20} />
      </button>
    </div>

    <!-- Body -->
    <div class="px-5 py-4 space-y-5 overflow-y-auto flex-1">
      <!-- Name -->
      <div>
        <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1" for="kit-name">
          Kit Name <span class="text-red-500">*</span>
        </label>
        <input
          id="kit-name"
          data-focus-first
          type="text"
          bind:value={name}
          placeholder="e.g. Sleep System"
          class="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 text-sm
            {errors.name ? 'border-red-400 focus:ring-red-400' : ''}"
        />
        {#if errors.name}
          <p class="text-xs text-red-500 mt-1">{errors.name}</p>
        {/if}
      </div>

      <!-- Description -->
      <div>
        <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1" for="kit-desc">Description</label>
        <textarea
          id="kit-desc"
          bind:value={description}
          rows={2}
          placeholder="Optional description..."
          class="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 text-sm resize-none"
        ></textarea>
      </div>

      <!-- Item Picker -->
      <div class="space-y-3">
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Items <span class="text-red-500">*</span>
        </label>
        {#if errors.items}
          <p class="text-xs text-red-500">{errors.items}</p>
        {/if}

        {#if gearItems.length === 0}
          <p class="text-sm text-zinc-400 dark:text-zinc-500 py-4 text-center">No gear items yet. Add some gear first.</p>
        {:else}
          <!-- Item type filter tags -->
          {#if itemTypes.length > 0}
            <div class="flex gap-1.5 flex-wrap">
              {#each itemTypes as type}
                <button
                  type="button"
                  onclick={() => activeType = activeType === type ? null : type}
                  class="px-2.5 py-1 rounded-full text-xs font-medium transition-colors
                    {activeType === type
                      ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}"
                >
                  {type}
                </button>
              {/each}
            </div>
          {/if}

          <!-- Search input -->
          <input
            type="search"
            bind:value={search}
            placeholder="Search gear…"
            class="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700
              bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100
              placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 text-sm"
          />

          <!-- Results list -->
          <div class="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800 max-h-48 overflow-y-auto">
            {#each pickerItems() as item}
              {@const checked = selectedIds.has(item.id)}
              <button
                type="button"
                onclick={() => toggleItem(item.id)}
                class="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors
                  {checked ? 'bg-zinc-50 dark:bg-zinc-800/60' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40'}"
              >
                <span
                  class="w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors
                    {checked
                      ? 'bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100'
                      : 'border-zinc-300 dark:border-zinc-600'}"
                >
                  {#if checked}<Check size={10} class="text-white dark:text-zinc-900" />{/if}
                </span>
                <span class="flex-1 min-w-0">
                  <span class="block text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{item.name}</span>
                  {#if item.brand}
                    <span class="text-xs text-zinc-400 dark:text-zinc-500">{item.brand}</span>
                  {/if}
                </span>
                <span class="flex items-center gap-2 flex-shrink-0">
                  <span class="text-xs px-1.5 py-0.5 rounded-full font-medium {catBadgeClass[item.weightCategory]}">
                    {categoryLabels[item.weightCategory]}
                  </span>
                  <span class="text-xs tabular-nums text-zinc-500 dark:text-zinc-400 w-14 text-right">
                    {formatWeight(itemWeightIn(item, weightUnit), weightUnit)}
                  </span>
                </span>
              </button>
            {/each}
            {#if pickerItems().length === 0}
              <div class="py-8 text-center text-sm text-zinc-400 dark:text-zinc-500">No items match</div>
            {/if}
          </div>

          <!-- Selected items grouped by weight category -->
          {#if selectedIds.size > 0}
            <div class="space-y-2 pt-1">
              <div class="flex items-center justify-between px-0.5">
                <span class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Selected — {selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''}
                </span>
                <span class="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  {formatWeight(totalWeight(), weightUnit)}
                </span>
              </div>
              {#each selectedGrouped() as group}
                <div>
                  <p class="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">{group.label}</p>
                  <div class="space-y-0.5">
                    {#each group.items as item}
                      <div class="flex items-center justify-between text-sm px-0.5">
                        <span class="text-zinc-700 dark:text-zinc-300 truncate">{item.name}</span>
                        <span class="text-xs tabular-nums text-zinc-400 dark:text-zinc-500 flex-shrink-0 ml-2">
                          {formatWeight(itemWeightIn(item, weightUnit), weightUnit)}
                        </span>
                      </div>
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        {/if}
      </div>
    </div>

  <!-- Actions -->
  <div class="flex gap-3 px-5 py-4 border-t border-zinc-100 dark:border-zinc-800 flex-shrink-0" style="padding-bottom: max(1rem, env(safe-area-inset-bottom))">
    <button
      onclick={onClose}
      class="flex-1 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
    >
      Cancel
    </button>
    <button
      onclick={handleSave}
      class="flex-1 py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
    >
      {kit ? 'Save Changes' : 'Create Kit'}
    </button>
  </div>
</BottomSheet>
