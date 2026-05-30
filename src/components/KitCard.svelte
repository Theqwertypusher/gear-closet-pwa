<script lang="ts">
  import { Trash2, Copy } from '@lucide/svelte'
  import type { Kit, GearItem, WeightUnit } from '../lib/types'
  import { itemWeightIn, formatWeight } from '../lib/weightUtils'

  interface Props {
    kit: Kit
    gearItems: GearItem[]
    weightUnit: WeightUnit
    onEdit: () => void
    onDuplicate: () => void
    onDelete: () => void
  }

  let { kit, gearItems, weightUnit, onEdit, onDuplicate, onDelete }: Props = $props()

  let confirmDelete = $state(false)

  const kitItems = $derived(
    kit.itemIds
      .map((id) => gearItems.find((g) => g.id === id))
      .filter((g): g is GearItem => g !== undefined)
  )

  const totalWeight = $derived(
    kitItems.reduce((sum, item) => sum + itemWeightIn(item, weightUnit), 0)
  )

  const previewNames = $derived(
    kitItems
      .slice(0, 3)
      .map((i) => i.name)
      .join(', ') + (kitItems.length > 3 ? ` +${kitItems.length - 3} more` : '')
  )


</script>

<!-- Outer container: relative so actions can sit beside the edit button -->
<div class="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors active:scale-[0.99]">
  <!-- Main edit button — takes up all space except the right action column -->
  <button
    type="button"
    onclick={onEdit}
    class="w-full text-left p-4 pr-20 cursor-pointer"
    aria-label="Edit {kit.name}"
  >
    <div class="flex items-center gap-2 min-w-0">
      <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{kit.name}</h3>
      <span class="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-medium flex-shrink-0">
        {kitItems.length} item{kitItems.length !== 1 ? 's' : ''}
      </span>
    </div>
    {#if kit.description}
      <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">{kit.description}</p>
    {/if}
  </button>

  <!-- Right column: weight + actions, absolutely positioned so it never overlaps the edit button's click area via bubbling -->
  <div class="absolute top-0 right-0 bottom-0 flex flex-col items-end justify-between p-3 pointer-events-none">
    {#if kitItems.length > 0}
      <span class="text-xs font-semibold text-zinc-700 dark:text-zinc-300 pt-1">
        {formatWeight(totalWeight, weightUnit)}
      </span>
    {:else}
      <span></span>
    {/if}

    <div class="pointer-events-auto">
      {#if confirmDelete}
        <div class="flex items-center gap-2">
          <button
            type="button"
            onclick={() => onDelete()}
            onpointerdown={(e) => e.stopPropagation()}
            class="text-xs text-red-600 dark:text-red-400 font-semibold bg-red-50 dark:bg-red-950 px-2 py-0.5 rounded border border-red-200 dark:border-red-800"
          >
            Confirm
          </button>
          <button
            type="button"
            onclick={() => { confirmDelete = false }}
            onpointerdown={(e) => e.stopPropagation()}
            class="text-xs text-zinc-500 dark:text-zinc-400"
          >
            Cancel
          </button>
        </div>
      {:else}
        <div class="flex items-center gap-1">
          <button
            type="button"
            onclick={() => onDuplicate()}
            onpointerdown={(e) => e.stopPropagation()}
            class="p-1 rounded-lg text-zinc-300 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            aria-label="Duplicate kit"
          >
            <Copy size={15} />
          </button>
          <button
            type="button"
            onclick={() => { confirmDelete = true }}
            onpointerdown={(e) => e.stopPropagation()}
            class="p-1 rounded-lg text-zinc-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            aria-label="Delete kit"
          >
            <Trash2 size={15} />
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>
