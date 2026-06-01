<script lang="ts">
  import { X } from '@lucide/svelte'
  import type { GearItem, WeightCategory, WeightUnit } from '../lib/types'
  import { gearStore } from '../lib/stores/gearStore.svelte'
  import BottomSheet from './BottomSheet.svelte'

  interface Props {
    item?: GearItem | null
    weightUnit: WeightUnit
    onSave: (data: Omit<GearItem, 'id' | 'createdAt' | 'updatedAt'>) => void
    onClose: () => void
  }

  let { item = null, weightUnit, onSave, onClose }: Props = $props()

  let name = $state(item?.name ?? '')
  let brand = $state(item?.brand ?? '')
  let itemType = $state(item?.itemType ?? '')
  let weight = $state<string>(item?.weight != null ? String(item.weight) : '')
  let weightCategory = $state<WeightCategory>(item?.weightCategory ?? 'base')
  let notes = $state(item?.notes ?? '')

  let errors = $state<{ name?: string; weight?: string }>({})

  function validate(): boolean {
    const e: typeof errors = {}
    if (!name.trim()) e.name = 'Name is required'
    const w = parseFloat(weight)
    if (weight === '' || isNaN(w) || w < 0) e.weight = 'Enter a valid weight (0 or more)'
    errors = e
    return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!validate()) return
    onSave({
      name: name.trim(),
      brand: brand.trim(),
      itemType: itemType.trim() || undefined,
      weight: parseFloat(weight),
      weightUnit,
      weightCategory,
      notes: notes.trim(),
    })
  }

  $effect(() => {
    const handler = () => onClose()
    window.addEventListener('shortcut:escape', handler)
    return () => window.removeEventListener('shortcut:escape', handler)
  })

  const categories: { value: WeightCategory; label: string }[] = [
    { value: 'base', label: 'Base' },
    { value: 'wearable', label: 'Wearable' },
    { value: 'consumable', label: 'Consumable' },
  ]
</script>

<BottomSheet onclose={onClose}>
  <div class="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0">
      <h2 class="text-lg font-semibold">{item ? 'Edit Item' : 'Add Item'}</h2>
      <button
        onclick={onClose}
        class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        aria-label="Close"
      >
        <X size={20} />
      </button>
    </div>

    <div class="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
      <!-- Name -->
      <div>
        <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1" for="item-name">
          Name <span class="text-red-500">*</span>
        </label>
        <input
          id="item-name"
          data-focus-first
          type="text"
          bind:value={name}
          placeholder="e.g. Sleeping Bag"
          class="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 text-sm
            {errors.name ? 'border-red-400 focus:ring-red-400' : ''}"
        />
        {#if errors.name}
          <p class="text-xs text-red-500 mt-1">{errors.name}</p>
        {/if}
      </div>

      <!-- Brand -->
      <div>
        <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1" for="item-brand">Brand</label>
        <input
          id="item-brand"
          type="text"
          bind:value={brand}
          placeholder="e.g. Big Agnes"
          class="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 text-sm"
        />
      </div>

      <!-- Item Type -->
      <div>
        <div class="flex items-baseline justify-between mb-1">
          <label class="text-sm font-medium text-zinc-700 dark:text-zinc-300" for="item-type">Item Type</label>
          <span class="text-[11px] text-zinc-400 dark:text-zinc-500">select a tag or type a new one</span>
        </div>
        <input
          id="item-type"
          type="text"
          bind:value={itemType}
          placeholder="e.g. shelter, clothing, toiletries"
          class="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 text-sm"
        />
        {#if itemType.trim()}
          {@const isNew = !gearStore.itemTypes.includes(itemType.trim())}
          <div class="flex items-center gap-1.5 mt-2">
            {#if isNew}
              <span class="text-[10px] text-zinc-400 uppercase tracking-wide">New tag:</span>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900">
                {itemType.trim()}
              </span>
            {:else}
              <span class="text-[10px] text-zinc-400 uppercase tracking-wide">Tag:</span>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900">
                {itemType.trim()}
              </span>
            {/if}
          </div>
        {/if}
        {#if gearStore.itemTypes.filter((t) => t !== itemType.trim()).length > 0}
          <div class="flex flex-wrap gap-1.5 mt-2">
            {#each gearStore.itemTypes.filter((t) => t !== itemType.trim()) as type}
              <button
                type="button"
                onclick={() => (itemType = type)}
                class="px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                {type}
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Weight -->
      <div>
        <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1" for="item-weight">Weight</label>
        <div class="flex items-center gap-2">
          <input
            id="item-weight"
            type="number"
            min="0"
            step="any"
            bind:value={weight}
            placeholder="0"
            class="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 text-sm
              {errors.weight ? 'border-red-400 focus:ring-red-400' : ''}"
          />
          <span class="text-sm font-medium text-zinc-500 dark:text-zinc-400 w-8 text-center">{weightUnit}</span>
        </div>
        {#if errors.weight}
          <p class="text-xs text-red-500 mt-1">{errors.weight}</p>
        {/if}
      </div>

      <!-- Weight Category -->
      <div>
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Category</label>
        <div class="flex gap-2">
          {#each categories as cat}
            <button
              type="button"
              onclick={() => (weightCategory = cat.value)}
              class="flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors
                {weightCategory === cat.value
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
                  : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'}"
            >
              {cat.label}
            </button>
          {/each}
        </div>
      </div>

      <!-- Notes -->
      <div>
        <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1" for="item-notes">Notes</label>
        <textarea
          id="item-notes"
          bind:value={notes}
          rows={3}
          placeholder="Optional notes..."
          class="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 text-sm resize-none"
        ></textarea>
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
      {item ? 'Save Changes' : 'Add Item'}
    </button>
  </div>
</BottomSheet>
