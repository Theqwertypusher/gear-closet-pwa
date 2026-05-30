<script lang="ts">
  import { Trash2, ChevronRight } from '@lucide/svelte'
  import type { GearItem, WeightUnit } from '../lib/types'
  import { itemWeightIn, formatWeight } from '../lib/weightUtils'

  interface Props {
    item: GearItem
    weightUnit: WeightUnit
    onEdit: (item: GearItem) => void
    onDelete: (id: string) => void
  }

  let { item, weightUnit, onEdit, onDelete }: Props = $props()

  let confirmDelete = $state(false)

  const badgeClasses: Record<string, string> = {
    base: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    wearable: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    consumable: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  }

  const categoryLabel: Record<string, string> = {
    base: 'Base',
    wearable: 'Wearable',
    consumable: 'Consumable',
  }
</script>

<li class="flex items-center gap-3 px-4 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
  <!-- Main content -->
  <button
    class="flex-1 flex items-center gap-3 text-left min-w-0"
    onclick={() => onEdit(item)}
    aria-label="Edit {item.name}"
  >
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="font-medium text-zinc-900 dark:text-zinc-100 truncate">{item.name}</span>
        <span class="text-xs px-2 py-0.5 rounded-full font-medium shrink-0 {badgeClasses[item.weightCategory]}">
          {categoryLabel[item.weightCategory]}
        </span>
      </div>
      {#if item.brand}
        <p class="text-sm text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">{item.brand}</p>
      {/if}
    </div>

    <div class="flex items-center gap-2 shrink-0">
      <span class="text-sm font-medium text-zinc-600 dark:text-zinc-300 tabular-nums">
        {formatWeight(itemWeightIn(item, weightUnit), weightUnit)}
      </span>
      <ChevronRight size={16} class="text-zinc-300 dark:text-zinc-600" />
    </div>
  </button>

  <!-- Delete -->
  {#if confirmDelete}
    <div class="flex items-center gap-1.5 shrink-0">
      <button
        onclick={() => onDelete(item.id)}
        class="text-xs text-red-600 dark:text-red-400 font-semibold px-2 py-0.5 rounded border border-red-300 dark:border-red-700"
      >
        Confirm
      </button>
      <button
        onclick={() => (confirmDelete = false)}
        class="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
      >
        Cancel
      </button>
    </div>
  {:else}
    <button
      onclick={() => (confirmDelete = true)}
      class="p-2 rounded-lg text-zinc-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 transition-colors shrink-0"
      aria-label="Delete {item.name}"
    >
      <Trash2 size={16} />
    </button>
  {/if}
</li>
