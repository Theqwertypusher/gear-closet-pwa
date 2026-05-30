<script lang="ts">
  import { Plus, Package, ArrowUpAZ, ArrowDownAZ, ArrowUp01, ArrowDown01, Tag, X, Trash2 } from '@lucide/svelte'
  import { gearStore } from '../lib/stores/gearStore.svelte.ts'
  import { settingsStore } from '../lib/stores/settingsStore.svelte.ts'
  import GearItemRow from './GearItemRow.svelte'
  import GearItemModal from './GearItemModal.svelte'
  import type { GearItem, WeightCategory } from '../lib/types'

  type FilterTab = 'all' | WeightCategory
  type SortField = 'name' | 'weight'
  type SortDir = 'asc' | 'desc'

  let activeFilter = $state<FilterTab>('all')
  let activeTag = $state<string | null>(null)
  let sortField = $state<SortField>('name')
  let sortDir = $state<SortDir>('asc')
  let showModal = $state(false)
  let editingItem = $state<GearItem | null>(null)
  let showLabelsModal = $state(false)
  // Map of tag -> draft rename value while modal is open
  let labelDrafts = $state<Record<string, string>>({})
  let newLabelText = $state('')

  const filterTabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'base', label: 'Base' },
    { id: 'wearable', label: 'Wearable' },
    { id: 'consumable', label: 'Consumable' },
  ]

  function handleSortClick(field: SortField) {
    if (sortField === field) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc'
    } else {
      sortField = field
      sortDir = 'asc'
    }
  }

  function sortItems(items: GearItem[]): GearItem[] {
    return [...items].sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1
      if (sortField === 'name') return mul * a.name.localeCompare(b.name)
      return mul * (a.weight - b.weight)
    })
  }

  const tagFilteredItems = $derived(
    activeTag === '__no_label__'
      ? gearStore.filteredItems(activeFilter).filter((i) => !i.itemType || i.itemType.trim() === '')
      : activeTag
        ? gearStore.filteredItems(activeFilter).filter((i) => i.itemType === activeTag)
        : gearStore.filteredItems(activeFilter)
  )
  let displayedItems = $derived(sortItems(tagFilteredItems))

  const availableTags = $derived(gearStore.itemTypes)
  const hasUnlabeledItems = $derived(gearStore.items.some((i) => !i.itemType || i.itemType.trim() === ''))

  function openAdd() {
    editingItem = null
    showModal = true
  }

  $effect(() => {
    function onShortcut(e: Event) {
      if ((e as CustomEvent).detail?.tab === 'gear') openAdd()
    }
    window.addEventListener('shortcut:add', onShortcut)
    return () => window.removeEventListener('shortcut:add', onShortcut)
  })

  function openEdit(item: GearItem) {
    editingItem = item
    showModal = true
  }

  function closeModal() {
    showModal = false
    editingItem = null
  }

  async function handleSave(data: Omit<GearItem, 'id' | 'createdAt' | 'updatedAt'>) {
    if (editingItem) {
      await gearStore.updateItem(editingItem.id, data)
    } else {
      await gearStore.addItem(data)
    }
    closeModal()
  }

  async function handleDelete(id: string) {
    await gearStore.deleteItem(id)
  }

  function openLabelsModal() {
    const drafts: Record<string, string> = {}
    for (const tag of gearStore.itemTypes) drafts[tag] = tag
    labelDrafts = drafts
    newLabelText = ''
    showLabelsModal = true
  }


  async function renameLabel(oldTag: string) {
    const newTag = labelDrafts[oldTag]?.trim()
    if (!newTag || newTag === oldTag) return
    // Rename on all items
    const affected = gearStore.items.filter((i) => i.itemType === oldTag)
    await Promise.all(affected.map((i) => gearStore.updateItem(i.id, { itemType: newTag })))
    // Rename in custom labels if present
    gearStore.renameCustomLabel(oldTag, newTag)
    if (activeTag === oldTag) activeTag = newTag
    // Update draft key
    const updated: Record<string, string> = {}
    for (const [k, v] of Object.entries(labelDrafts)) {
      updated[k === oldTag ? newTag : k] = v
    }
    labelDrafts = updated
  }

  async function deleteLabel(tag: string) {
    const affected = gearStore.items.filter((i) => i.itemType === tag)
    await Promise.all(affected.map((i) => gearStore.updateItem(i.id, { itemType: '' })))
    gearStore.removeCustomLabel(tag)
    if (activeTag === tag) activeTag = null
    const updated = { ...labelDrafts }
    delete updated[tag]
    labelDrafts = updated
  }

  function addLabel() {
    const name = newLabelText.trim()
    if (!name || labelDrafts[name] !== undefined) return
    gearStore.addCustomLabel(name)
    labelDrafts = { ...labelDrafts, [name]: name }
    newLabelText = ''
  }
</script>

<div class="relative flex flex-col h-full">
  <!-- Sticky header: filter tabs + sort + tag pills -->
  <div class="sticky top-0 z-10 bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800">
    <!-- Filter tabs + sort controls -->
    <div class="flex items-center gap-1 px-4 pt-4 pb-2">
      <div class="flex gap-1 overflow-x-auto scrollbar-none flex-1 min-w-0">
        {#each filterTabs as tab}
          <button
            onclick={() => { activeFilter = tab.id; activeTag = null }}
            class="shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
              {activeFilter === tab.id
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'}"
          >
            {tab.label}
            {#if tab.id === 'all'}
              <span class="ml-1 text-xs opacity-60">({gearStore.items.length})</span>
            {/if}
          </button>
        {/each}
      </div>

      <div class="w-px h-5 bg-zinc-200 dark:bg-zinc-700 shrink-0 mx-1"></div>

      <div class="flex gap-1 shrink-0">
        <button
          onclick={() => handleSortClick('name')}
          class="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors
            {sortField === 'name'
              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
              : 'text-zinc-600 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'}"
          aria-label="Sort alphabetically"
        >
          {#if sortField === 'name' && sortDir === 'desc'}
            <ArrowDownAZ size={14} />
          {:else}
            <ArrowUpAZ size={14} />
          {/if}
        </button>
        <button
          onclick={() => handleSortClick('weight')}
          class="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors
            {sortField === 'weight'
              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
              : 'text-zinc-600 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'}"
          aria-label="Sort by weight"
        >
          {#if sortField === 'weight' && sortDir === 'desc'}
            <ArrowDown01 size={14} />
          {:else}
            <ArrowUp01 size={14} />
          {/if}
        </button>
      </div>
    </div>

    <!-- Tag filter pills -->
    {#if availableTags.length > 0 || hasUnlabeledItems}
      <div class="flex items-center gap-1.5 overflow-x-auto scrollbar-none px-4 pb-4">
        {#each availableTags as tag}
          <button
            onclick={() => (activeTag = activeTag === tag ? null : tag)}
            class="shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors
              {activeTag === tag
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}"
          >
            {tag}
          </button>
        {/each}
        <!-- No label pill — outline only, always last, only when unlabeled items exist -->
        {#if hasUnlabeledItems}
          <button
            onclick={() => (activeTag = activeTag === '__no_label__' ? null : '__no_label__')}
            class="shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors border
              {activeTag === '__no_label__'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
                : 'border-zinc-400 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 hover:border-zinc-600 dark:hover:border-zinc-400 bg-transparent'}"
          >
            No label
          </button>
        {/if}
        <div class="w-px h-4 bg-zinc-200 dark:bg-zinc-700 shrink-0 ml-auto"></div>
        <button
          onclick={openLabelsModal}
          class="shrink-0 p-1.5 rounded-full text-zinc-600 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Manage labels"
        >
          <Tag size={13} />
        </button>
      </div>
    {/if}
  </div>

  <!-- Content -->
  <div class="flex-1 overflow-auto">
    {#if !gearStore.loaded}
      <div class="flex items-center justify-center mt-24 text-zinc-400">
        <p class="text-sm">Loading...</p>
      </div>
    {:else if displayedItems.length === 0}
      <div class="flex flex-col items-center justify-center mt-24 px-6 text-center text-zinc-400 dark:text-zinc-500">
        <Package size={56} class="mb-4 text-zinc-200 dark:text-zinc-700" />
        {#if gearStore.items.length === 0}
          <p class="font-semibold text-zinc-700 dark:text-zinc-300 text-base mb-1">No gear yet</p>
          <p class="text-sm text-zinc-400 dark:text-zinc-500 mt-1">Add the gear you own to start building your catalog.</p>
          <p class="text-sm mt-2">Tap + to add your first item</p>
        {:else}
          <p class="font-medium text-zinc-600 dark:text-zinc-300 text-base mb-1">No items in this category</p>
          <p class="text-sm">Try a different filter</p>
        {/if}
      </div>
    {:else}
      <ul class="divide-y divide-zinc-100 dark:divide-zinc-800">
        {#each displayedItems as item (item.id)}
          <GearItemRow {item} weightUnit={settingsStore.settings.weightUnit} onEdit={openEdit} onDelete={handleDelete} />
        {/each}
      </ul>
      <!-- Spacer for FAB -->
      <div class="h-20"></div>
    {/if}
  </div>

  <!-- FAB -->
  <button
    onclick={openAdd}
    class="fixed bottom-20 right-4 z-20 w-14 h-14 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-lg flex items-center justify-center hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-95 transition-all"
    aria-label="Add gear item"
  >
    <Plus size={24} />
  </button>
</div>

<!-- Gear item modal -->
{#if showModal}
  <GearItemModal
    item={editingItem}
    weightUnit={settingsStore.settings.weightUnit}
    onSave={handleSave}
    onClose={closeModal}
  />
{/if}

<!-- Manage Labels modal -->
{#if showLabelsModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
    onclick={(e) => { if (e.target === e.currentTarget) showLabelsModal = false }}
  >
    <div class="w-full sm:max-w-sm bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[80vh]">
      <!-- Header -->
      <div class="flex items-center justify-between px-5 pt-5 pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <p class="font-semibold text-zinc-900 dark:text-zinc-100 text-base">Manage Labels</p>
        <button
          onclick={() => showLabelsModal = false}
          class="p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <!-- Add new label -->
      <div class="flex items-center gap-2 px-5 pt-4 pb-2">
        <input
          type="text"
          bind:value={newLabelText}
          onkeydown={(e) => { if (e.key === 'Enter') addLabel() }}
          placeholder="New label…"
          class="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500"
        />
        <button
          onclick={addLabel}
          disabled={!newLabelText.trim() || labelDrafts[newLabelText.trim()] !== undefined}
          class="shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors
            {newLabelText.trim() && labelDrafts[newLabelText.trim()] === undefined
              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'}"
        >
          Add
        </button>
      </div>
      <div class="border-t border-zinc-100 dark:border-zinc-800 mx-5"></div>

      <!-- Label list -->
      <div class="overflow-y-auto flex-1 px-5 py-3 space-y-2">
        {#if Object.keys(labelDrafts).length === 0}
          <p class="text-sm text-zinc-400 dark:text-zinc-500 py-4 text-center">No labels yet</p>
        {:else}
          {#each Object.keys(labelDrafts) as tag (tag)}
            <div class="flex items-center gap-2">
              <input
                type="text"
                bind:value={labelDrafts[tag]}
                onblur={() => renameLabel(tag)}
                onkeydown={(e) => { if (e.key === 'Enter') { (e.currentTarget as HTMLInputElement).blur() } }}
                class="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500"
              />
              <button
                onclick={() => deleteLabel(tag)}
                class="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                aria-label="Delete label"
              >
                <Trash2 size={15} />
              </button>
            </div>
          {/each}
          <p class="text-xs text-zinc-400 dark:text-zinc-500 pt-1">Tap a label to rename it. Changes apply to all items with that label.</p>
        {/if}
      </div>

      <!-- Footer -->
      <div class="px-5 py-4 border-t border-zinc-100 dark:border-zinc-800">
        <button
          onclick={() => showLabelsModal = false}
          class="w-full py-2.5 rounded-xl text-sm font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  </div>
{/if}
