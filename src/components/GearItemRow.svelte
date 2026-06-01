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
    base: 'text-blue-600 dark:text-blue-400',
    wearable: 'text-green-600 dark:text-green-400',
    consumable: 'text-orange-500 dark:text-orange-400',
  }

  const categoryLabel: Record<string, string> = {
    base: 'Base',
    wearable: 'Wearable',
    consumable: 'Consumable',
  }
</script>

<li class="relative bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
  <!-- Main content -->
  <button
    class="w-full text-left px-4 py-3 pr-16 min-w-0"
    onclick={() => onEdit(item)}
    aria-label="Edit {item.name}"
  >
    <span class="font-medium text-zinc-900 dark:text-zinc-100 truncate">{item.name}</span>
    <p class="text-sm text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">{item.brand || ' '}</p>
  </button>

  <!-- Right column: delete top, weight bottom -->
  <div class="absolute top-0 right-0 bottom-0 flex flex-col items-end justify-between px-3 pt-3 pb-3 pointer-events-none">
    <div class="pointer-events-auto">
      {#if confirmDelete}
        <div class="flex items-center gap-1.5">
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
          class="p-1 rounded-lg text-zinc-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          aria-label="Delete {item.name}"
        >
          <Trash2 size={15} />
        </button>
      {/if}
    </div>
    <div class="flex items-center gap-1.5">
      <span class="text-xs font-medium {badgeClasses[item.weightCategory]}">{categoryLabel[item.weightCategory]}</span>
      <span class="text-xs font-medium text-zinc-600 dark:text-zinc-300 tabular-nums">{formatWeight(itemWeightIn(item, weightUnit), weightUnit)}</span>
    </div>
  </div>
</li>
