<script lang="ts">
  import { scale } from 'svelte/transition'
  import { Check, Link } from '@lucide/svelte'
  import { packingListStore } from '../lib/stores/packingListStore.svelte'
  import { gearStore } from '../lib/stores/gearStore.svelte'
  import { kitStore } from '../lib/stores/kitStore.svelte'
  import { buildShareUrl } from '../lib/share'

  interface Props {
    onclose: () => void
  }
  let { onclose }: Props = $props()

  let selected = $state<Set<string>>(new Set())
  let copied = $state(false)

  function toggle(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    selected = next
  }

  function selectAll() {
    selected = new Set(packingListStore.lists.map((l) => l.id))
  }

  function selectNone() {
    selected = new Set()
  }

  // Collect only the gear items referenced by the selected lists
  const referencedGearIds = $derived.by(() => {
    const ids = new Set<string>()
    for (const list of packingListStore.lists) {
      if (!selected.has(list.id)) continue
      for (const cat of list.categories) {
        for (const item of cat.items) {
          ids.add(item.gearItemId)
        }
      }
    }
    return ids
  })

  const selectedLists = $derived(
    packingListStore.lists.filter((l) => selected.has(l.id))
  )

  const filteredGearItems = $derived(
    gearStore.items.filter((g) => referencedGearIds.has(g.id))
  )

  async function copyLink() {
    if (selected.size === 0) return
    // Only include gear items referenced by the selected lists — no kits needed
    const url = buildShareUrl(
      $state.snapshot(filteredGearItems),
      [],
      $state.snapshot(selectedLists),
    )
    await navigator.clipboard.writeText(url)
    copied = true
    setTimeout(() => { copied = false }, 2500)
  }

  function totalItems(listId: string): number {
    const list = packingListStore.lists.find((l) => l.id === listId)
    return list?.categories.reduce((sum, cat) => sum + cat.items.length, 0) ?? 0
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
  onclick={(e) => { if (e.target === e.currentTarget) onclose() }}
>
  <div class="w-full sm:max-w-sm bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[80vh]">
    <!-- Header -->
    <div class="flex items-center justify-between px-6 pt-6 pb-3">
      <div>
        <p class="font-semibold text-zinc-900 dark:text-zinc-100">Share a link</p>
        <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Select lists to include</p>
      </div>
      <div class="flex items-center gap-3 text-xs text-zinc-400 dark:text-zinc-500">
        <button onclick={selectAll} class="hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">All</button>
        <button onclick={selectNone} class="hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">None</button>
      </div>
    </div>

    <!-- List -->
    <div class="flex-1 overflow-auto divide-y divide-zinc-100 dark:divide-zinc-800">
      {#if packingListStore.lists.length === 0}
        <div class="px-6 py-8 text-center text-sm text-zinc-400 dark:text-zinc-500">
          No packing lists yet
        </div>
      {:else}
        {#each packingListStore.lists as list}
          {@const count = totalItems(list.id)}
          {@const isSelected = selected.has(list.id)}
          <button
            onclick={() => toggle(list.id)}
            class="flex items-center gap-3 w-full px-6 py-3.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
          >
            <div class="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors
              {isSelected ? 'bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100' : 'border-zinc-300 dark:border-zinc-600'}">
              {#if isSelected}
                <Check size={12} class="text-white dark:text-zinc-900" />
              {/if}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{list.name}</p>
              <p class="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                {count} item{count !== 1 ? 's' : ''} · {list.categories.length} {list.categories.length !== 1 ? 'categories' : 'category'}
              </p>
            </div>
          </button>
        {/each}
      {/if}
    </div>

    <!-- Footer -->
    <div class="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-2">
      {#if selected.size > 0}
        <p class="text-xs text-zinc-400 dark:text-zinc-500 text-center">
          {filteredGearItems.length} gear item{filteredGearItems.length !== 1 ? 's' : ''} will be included
        </p>
      {/if}
      <button
        onclick={copyLink}
        disabled={selected.size === 0}
        class="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2
          {copied
            ? 'bg-green-500 text-white scale-[1.02]'
            : selected.size === 0
              ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
              : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300'}"
      >
        {#if copied}
          <span in:scale={{ duration: 200, start: 0.5 }} class="flex items-center gap-2">
            <Check size={16} />
            Link copied!
          </span>
        {:else}
          <Link size={16} />
          Copy link{selected.size > 0 ? ` (${selected.size} list${selected.size !== 1 ? 's' : ''})` : ''}
        {/if}
      </button>
      <button
        onclick={onclose}
        class="w-full py-2 text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
      >
        Cancel
      </button>
    </div>
  </div>
</div>
