<script lang="ts">
  import { Plus, ClipboardList, Trash2, Copy } from '@lucide/svelte'
  import { dndzone } from 'svelte-dnd-action'
  import { packingListStore } from '../lib/stores/packingListStore.svelte'
  import { gearStore } from '../lib/stores/gearStore.svelte'
  import { settingsStore } from '../lib/stores/settingsStore.svelte'
  import { computePackingListWeights, formatWeight } from '../lib/weightUtils'
  import CreateListModal from './CreateListModal.svelte'
  import PackingListDetail from './PackingListDetail.svelte'
  import type { PackingList } from '../lib/types'

  interface Props {
    onGoToGear: () => void
  }
  let { onGoToGear }: Props = $props()

  let showCreateModal = $state(false)
  let deleteConfirmId = $state<string | null>(null)

  $effect(() => {
    function onShortcut(e: Event) {
      if ((e as CustomEvent).detail?.tab === 'packing-lists' && !activeList) {
        showCreateModal = true
      }
    }
    window.addEventListener('shortcut:add', onShortcut)
    return () => window.removeEventListener('shortcut:add', onShortcut)
  })

  const gearItemsMap = $derived(new Map(gearStore.items.map((g) => [g.id, g])))
  const unit = $derived(settingsStore.settings.weightUnit)

  const activeList = $derived(
    packingListStore.activeListId
      ? packingListStore.lists.find((l) => l.id === packingListStore.activeListId) ?? null
      : null
  )

  async function handleCreate(name: string, categories: string[]) {
    const list = await packingListStore.addList({
      name,
      categories: categories.map((catName, i) => ({
        id: crypto.randomUUID(),
        name: catName,
        items: [],
        sortOrder: i,
      })),
      tripNotes: '',
      isPackingMode: false,
    })
    packingListStore.setActiveList(list.id)
  }

  // DnD — use a local shadow list so mid-drag visuals update instantly
  let dragLists = $state<PackingList[]>([])
  $effect(() => { dragLists = [...packingListStore.lists] })

  function handleDndConsider(e: CustomEvent<{ items: PackingList[] }>) {
    dragLists = e.detail.items
  }

  async function handleDndFinalize(e: CustomEvent<{ items: PackingList[] }>) {
    dragLists = e.detail.items
    await packingListStore.reorderLists(e.detail.items)
  }

  function openList(list: PackingList) {
    packingListStore.setActiveList(list.id)
  }

  function goBack() {
    packingListStore.setActiveList(null)
  }

  async function deleteList(id: string) {
    await packingListStore.deleteList(id)
    deleteConfirmId = null
  }

  function totalItemCount(list: PackingList): number {
    return list.categories.reduce((sum, cat) => sum + cat.items.length, 0)
  }
</script>

{#if activeList}
  <PackingListDetail list={activeList} onback={goBack} {onGoToGear} />
{:else}
  <div class="flex flex-col min-h-full">
    <!-- List of lists -->
    <div class="flex-1 px-3 pt-4 pb-24 space-y-3">
      {#if packingListStore.lists.length === 0}
        <div class="text-zinc-500 dark:text-zinc-400 text-center mt-24">
          <ClipboardList class="mx-auto mb-3 text-zinc-300 dark:text-zinc-600" size={52} />
          <p class="font-semibold text-zinc-700 dark:text-zinc-300">No packing lists yet</p>
          <p class="text-sm mt-1">Tap + to create your first list</p>
        </div>
      {:else}
        <div
          use:dndzone={{ items: dragLists, flipDurationMs: 200 }}
          onconsider={handleDndConsider}
          onfinalize={handleDndFinalize}
          class="space-y-3"
        >
          {#each dragLists as list (list.id)}
            {@const weights = computePackingListWeights(list, gearItemsMap, unit)}
            {@const itemCount = totalItemCount(list)}
            <!-- svelte-ignore a11y_interactive_supports_focus -->
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <div
              role="button"
              onclick={() => openList(list)}
              class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors active:scale-[0.99] cursor-pointer"
            >
              <!-- Title row with inline actions -->
              <div class="flex items-start gap-2">
                <div class="flex-1 min-w-0">
                  <h3 class="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{list.name}</h3>
                  <p class="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                    {itemCount} item{itemCount !== 1 ? 's' : ''}
                    · {list.categories.length} {list.categories.length !== 1 ? 'categories' : 'category'}
                  </p>
                </div>

                <!-- Inline actions -->
                <div class="flex items-center gap-1 flex-shrink-0">
                  {#if deleteConfirmId === list.id}
                    <button
                      onclick={(e) => { e.stopPropagation(); deleteList(list.id) }}
                      class="text-xs text-red-600 dark:text-red-400 font-medium px-2 py-0.5 rounded border border-red-300 dark:border-red-700"
                    >
                      Confirm
                    </button>
                    <button
                      onclick={(e) => { e.stopPropagation(); deleteConfirmId = null }}
                      class="text-xs text-zinc-500 dark:text-zinc-400"
                    >
                      Cancel
                    </button>
                  {:else}
                    <button
                      onclick={(e) => { e.stopPropagation(); packingListStore.duplicateList(list.id) }}
                      class="p-1.5 rounded-lg text-zinc-300 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                      aria-label="Duplicate list"
                    >
                      <Copy size={15} />
                    </button>
                    <button
                      onclick={(e) => { e.stopPropagation(); deleteConfirmId = list.id }}
                      class="p-1.5 rounded-lg text-zinc-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      aria-label="Delete list"
                    >
                      <Trash2 size={15} />
                    </button>
                  {/if}
                </div>
              </div>

              <!-- Weight breakdown -->
              <div class="flex items-end justify-between mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <div class="flex gap-4">
                  {#each [
                    { label: 'Base', value: weights.base },
                    { label: 'Wearable', value: weights.wearable },
                    { label: 'Consumable', value: weights.consumable },
                  ] as stat}
                    <div class="min-w-[56px]">
                      <p class="text-[10px] text-zinc-400 uppercase tracking-wide">{stat.label}</p>
                      <p class="text-xs font-medium tabular-nums text-zinc-600 dark:text-zinc-400">{formatWeight(stat.value, unit)}</p>
                    </div>
                  {/each}
                </div>
                <div class="text-right flex-shrink-0">
                  <p class="text-[10px] text-zinc-400 uppercase tracking-wide">Total</p>
                  <p class="text-xs font-bold tabular-nums text-zinc-800 dark:text-zinc-200">{formatWeight(weights.total, unit)}</p>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- FAB -->
    <button
      onclick={() => (showCreateModal = true)}
      class="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-lg hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors flex items-center justify-center z-20"
      aria-label="New packing list"
    >
      <Plus size={26} />
    </button>
  </div>
{/if}

{#if showCreateModal}
  <CreateListModal
    onclose={() => (showCreateModal = false)}
    oncreate={handleCreate}
  />
{/if}
