<script lang="ts">
  import { tick } from 'svelte'
  import {
    ArrowLeft,
    Plus,
    Minus,
    Trash2,
    ChevronDown,
    ChevronUp,
    Package,
    Layers,
    Check,
    Backpack,
  } from '@lucide/svelte'
  import { dndzone } from 'svelte-dnd-action'
  import { packingListStore } from '../lib/stores/packingListStore.svelte'
  import { gearStore } from '../lib/stores/gearStore.svelte'
  import { kitStore } from '../lib/stores/kitStore.svelte'
  import { settingsStore } from '../lib/stores/settingsStore.svelte'
  import { computePackingListWeights, computeItemsWeight, formatWeight, itemWeightIn } from '../lib/weightUtils'
  import type { PackingList, PackingListCategory, PackingListItem, ListMode } from '../lib/types'

  interface Props {
    list: PackingList
    onback: () => void
    onGoToGear: () => void
  }

  let { list, onback, onGoToGear }: Props = $props()

  // Local mutable copy
  let localList = $state<PackingList>(structuredClone($state.snapshot(list)))

  // UI state
  let editingName = $state(false)
  let collapsedCategories = $state<Set<string>>(new Set())
  let editingCategoryId = $state<string | null>(null)
  let showTripNotes = $state(false)
  let deleteConfirmCatId = $state<string | null>(null)
  let deleteConfirmItemId = $state<string | null>(null)

  // Item picker state
  let itemPickerCatId = $state<string | null>(null)
  let itemPickerSearch = $state('')
  let itemPickerSelected = $state<Set<string>>(new Set())

  // Kit picker state
  let showKitPicker = $state(false)
  let kitPickerTargetCatId = $state<string | null>(null)
  let showEmptyKitsPrompt = $state(false)

  // Derived
  const gearItemsMap = $derived(new Map(gearStore.items.map((g) => [g.id, g])))
  const unit = $derived(settingsStore.settings.weightUnit)

  const weights = $derived(computePackingListWeights(localList, gearItemsMap, unit))

  function categoryWeight(cat: PackingListCategory): number {
    return computeItemsWeight(cat.items, gearItemsMap, unit)
  }

  // Save helper
  async function save() {
    await packingListStore.updateList(localList.id, {
      name: localList.name,
      categories: localList.categories,
      tripNotes: localList.tripNotes,
      isPackingMode: localList.isPackingMode,
      listMode: localList.listMode,
    })
  }

  function setListMode(mode: ListMode) {
    localList.listMode = mode
    localList.isPackingMode = false
    save()
  }

  // Name editing
  function startEditName() { editingName = true }
  function commitName(e: Event) {
    const val = (e.target as HTMLInputElement).value.trim()
    if (val) localList.name = val
    editingName = false
    save()
  }
  function nameKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
    if (e.key === 'Escape') editingName = false
  }

  // Packing mode
  function togglePackingMode() {
    localList.isPackingMode = !localList.isPackingMode
    save()
  }

  function clearAllChecks() {
    localList.categories = localList.categories.map((cat) => ({
      ...cat,
      items: cat.items.map((item) => ({ ...item, checked: false })),
    }))
    save()
  }

  // Category collapse
  function toggleCollapse(catId: string) {
    const next = new Set(collapsedCategories)
    if (next.has(catId)) next.delete(catId)
    else next.add(catId)
    collapsedCategories = next
  }

  // Category name editing
  function startEditCategory(catId: string) { editingCategoryId = catId }
  function commitCategoryName(catId: string, e: Event) {
    const val = (e.target as HTMLInputElement).value.trim()
    if (val) {
      localList.categories = localList.categories.map((c) =>
        c.id === catId ? { ...c, name: val } : c
      )
      save()
    }
    editingCategoryId = null
  }
  function catNameKeydown(catId: string, e: KeyboardEvent) {
    if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
    if (e.key === 'Escape') editingCategoryId = null
  }

  // Delete category
  function confirmDeleteCat(catId: string) {
    deleteConfirmCatId = catId
    tick().then(() => {
      ;(document.querySelector('[data-confirm-delete-cat]') as HTMLElement)?.focus()
    })
  }
  function deleteCategory(catId: string) {
    localList.categories = localList.categories.filter((c) => c.id !== catId)
    deleteConfirmCatId = null
    save()
  }

  // Delete item (with confirm)
  function confirmDeleteItem(itemId: string) {
    deleteConfirmItemId = itemId
    tick().then(() => {
      ;(document.querySelector('[data-confirm-delete-item]') as HTMLElement)?.focus()
    })
  }
  function deleteItem(catId: string, itemId: string) {
    removeItem(catId, itemId)
    deleteConfirmItemId = null
  }

  // Add custom category
  let newCatId = $state<string | null>(null)

  function addCategory() {
    const newCat: PackingListCategory = {
      id: crypto.randomUUID(),
      name: 'New Category',
      items: [],
      sortOrder: 0,
    }
    localList.categories = [newCat, ...localList.categories.map((c, i) => ({ ...c, sortOrder: i + 1 }))]
    editingCategoryId = newCat.id
    newCatId = newCat.id
    setTimeout(() => { newCatId = null }, 800)
    save()
  }

  $effect(() => {
    function onShortcut(e: Event) {
      if ((e as CustomEvent).detail?.tab === 'packing-lists') addCategory()
    }
    window.addEventListener('shortcut:add', onShortcut)
    return () => window.removeEventListener('shortcut:add', onShortcut)
  })

  $effect(() => {
    function onKeydown(e: KeyboardEvent) {
      // Ignore when typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'd') setListMode('draft')
      else if (e.key === 'f') setListMode('final')
      else if (e.key === 'p') togglePackingMode()
    }
    window.addEventListener('keydown', onKeydown)
    return () => window.removeEventListener('keydown', onKeydown)
  })

  // ── Held-key cycling helpers ─────────────────────────────────────────────
  function cycleButtons(selector: string) {
    const buttons = Array.from(document.querySelectorAll(selector)) as HTMLElement[]
    if (buttons.length === 0) return null
    const idx = buttons.indexOf(document.activeElement as HTMLElement)
    const next = idx === -1 ? buttons[0] : buttons[(idx + 1) % buttons.length]
    next?.focus()
    return next
  }

  $effect(() => {
    function onAddItemNext() { cycleButtons('[data-add-item]') }
    function onAddKitNext()  { cycleButtons('[data-add-kit]') }
    function onDeleteCatNext() { cycleButtons('[data-delete-category]') }
    function onDeleteItemNext() { cycleButtons('[data-delete-item]') }

    window.addEventListener('shortcut:add-item-next', onAddItemNext)
    window.addEventListener('shortcut:add-kit-next',  onAddKitNext)
    window.addEventListener('shortcut:delete-category-next', onDeleteCatNext)
    window.addEventListener('shortcut:delete-item-next',     onDeleteItemNext)
    return () => {
      window.removeEventListener('shortcut:add-item-next', onAddItemNext)
      window.removeEventListener('shortcut:add-kit-next',  onAddKitNext)
      window.removeEventListener('shortcut:delete-category-next', onDeleteCatNext)
      window.removeEventListener('shortcut:delete-item-next',     onDeleteItemNext)
    }
  })

  $effect(() => {
    function onEscape() {
      if (showKitPicker) { closeKitPicker(); return }
      if (itemPickerCatId) { closeItemPicker(); return }
      if (showEmptyKitsPrompt) { showEmptyKitsPrompt = false; return }
      if (showEmptyGearPrompt) { showEmptyGearPrompt = false; return }
      if (deleteConfirmCatId) { deleteConfirmCatId = null; return }
      if (editingCategoryId) { editingCategoryId = null; return }
      if (editingName) { editingName = false; return }
    }
    function onBack() {
      if (showKitPicker) { closeKitPicker(); return }
      if (itemPickerCatId) { closeItemPicker(); return }
      if (showEmptyKitsPrompt) { showEmptyKitsPrompt = false; return }
      if (showEmptyGearPrompt) { showEmptyGearPrompt = false; return }
      onback()
    }
    window.addEventListener('shortcut:escape', onEscape)
    window.addEventListener('shortcut:back', onBack)
    return () => {
      window.removeEventListener('shortcut:escape', onEscape)
      window.removeEventListener('shortcut:back', onBack)
    }
  })

  // Category drag-to-reorder
  let dragCategories = $state<PackingListCategory[]>([])
  $effect(() => { dragCategories = [...localList.categories] })

  function handleCatConsider(e: CustomEvent<{ items: PackingListCategory[] }>) {
    dragCategories = e.detail.items
  }

  function handleCatFinalize(e: CustomEvent<{ items: PackingListCategory[] }>) {
    const reordered = e.detail.items.map((c, i) => ({ ...c, sortOrder: i }))
    dragCategories = reordered
    localList.categories = reordered
    save()
  }

  function transformDraggedElement(el: HTMLElement) {
    el.style.outline = '2px solid #6366f1'
    el.style.outlineOffset = '2px'
    el.style.borderRadius = '12px'
    el.style.opacity = '0.95'
  }

  // Quantity stepper
  function changeQty(catId: string, itemId: string, delta: number) {
    localList.categories = localList.categories.map((cat) => {
      if (cat.id !== catId) return cat
      return {
        ...cat,
        items: cat.items.map((item) => {
          if (item.id !== itemId) return item
          const newQty = Math.max(1, item.quantity + delta)
          return { ...item, quantity: newQty }
        }),
      }
    })
    save()
  }

  // Toggle checked
  function toggleChecked(catId: string, itemId: string) {
    localList.categories = localList.categories.map((cat) => {
      if (cat.id !== catId) return cat
      return {
        ...cat,
        items: cat.items.map((item) =>
          item.id === itemId ? { ...item, checked: !item.checked } : item
        ),
      }
    })
    save()
  }

  // Remove item from category
  function removeItem(catId: string, itemId: string) {
    localList.categories = localList.categories.map((cat) => {
      if (cat.id !== catId) return cat
      return { ...cat, items: cat.items.filter((i) => i.id !== itemId) }
    })
    save()
  }

  // Item picker
  let showEmptyGearPrompt = $state(false)

  function openItemPicker(catId: string) {
    if (gearStore.items.length === 0) {
      showEmptyGearPrompt = true
      return
    }
    itemPickerCatId = catId
    itemPickerSearch = ''
    const cat = localList.categories.find((c) => c.id === catId)
    itemPickerSelected = new Set(cat?.items.map((i) => i.gearItemId) ?? [])
  }
  function closeItemPicker() { itemPickerCatId = null }

  const pickerItems = $derived(
    gearStore.items.filter((g) => {
      const q = itemPickerSearch.toLowerCase()
      return (
        g.name.toLowerCase().includes(q) ||
        g.brand.toLowerCase().includes(q) ||
        (g.itemType ?? '').toLowerCase().includes(q)
      )
    })
  )

  function togglePickerItem(gearItemId: string) {
    const next = new Set(itemPickerSelected)
    if (next.has(gearItemId)) next.delete(gearItemId)
    else next.add(gearItemId)
    itemPickerSelected = next
  }

  function confirmItemPicker() {
    if (!itemPickerCatId) return
    const cat = localList.categories.find((c) => c.id === itemPickerCatId)
    if (!cat) return

    // items already in cat
    const existing = new Set(cat.items.map((i) => i.gearItemId))

    // add newly selected
    const toAdd: PackingListItem[] = []
    for (const gearItemId of itemPickerSelected) {
      if (!existing.has(gearItemId)) {
        toAdd.push({
          id: crypto.randomUUID(),
          gearItemId,
          quantity: 1,
          checked: false,
        })
      }
    }

    // remove deselected
    const toRemoveIds = cat.items
      .filter((i) => !itemPickerSelected.has(i.gearItemId))
      .map((i) => i.id)

    localList.categories = localList.categories.map((c) => {
      if (c.id !== itemPickerCatId) return c
      return {
        ...c,
        items: [
          ...c.items.filter((i) => !toRemoveIds.includes(i.id)),
          ...toAdd,
        ],
      }
    })
    save()
    closeItemPicker()
  }

  // Kit picker
  function openKitPicker(catId: string) {
    if (kitStore.kits.length === 0) {
      showEmptyKitsPrompt = true
      return
    }
    kitPickerTargetCatId = catId
    showKitPicker = true
  }
  function closeKitPicker() {
    showKitPicker = false
    kitPickerTargetCatId = null
  }

  function addKit(kitId: string) {
    const kit = kitStore.kits.find((k) => k.id === kitId)
    if (!kit) return

    const newItems: PackingListItem[] = kit.itemIds.map((gearItemId) => ({
      id: crypto.randomUUID(),
      gearItemId,
      quantity: 1,
      checked: false,
    }))

    const targetCat = kitPickerTargetCatId
      ? localList.categories.find((c) => c.id === kitPickerTargetCatId)
      : null

    if (targetCat && targetCat.items.length === 0) {
      // Empty category: rename it to the kit and populate it
      localList.categories = localList.categories.map((c) =>
        c.id === targetCat.id
          ? { ...c, name: kit.name, items: newItems }
          : c
      )
    } else if (targetCat) {
      // Non-empty category: just append items (skip duplicates)
      const existing = new Set(targetCat.items.map((i) => i.gearItemId))
      const toAdd = newItems.filter((i) => !existing.has(i.gearItemId))
      localList.categories = localList.categories.map((c) =>
        c.id === targetCat.id
          ? { ...c, items: [...c.items, ...toAdd] }
          : c
      )
    } else {
      // Fallback: create a new category (shouldn't normally happen)
      const newCat: PackingListCategory = {
        id: crypto.randomUUID(),
        name: kit.name,
        items: newItems,
        sortOrder: localList.categories.length,
      }
      localList.categories = [...localList.categories, newCat]
    }

    showKitPicker = false
    kitPickerTargetCatId = null
    save()
  }

  // Trip notes
  function saveTripNotes() { save() }
</script>

<div class="fixed inset-0 z-40 flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
  <!-- Header -->
  <header class="sticky top-0 z-10 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
    <!-- Row 1: back + title + pills (pills inline on sm+, hidden on mobile) -->
    <div class="flex items-center gap-3">
      <button onclick={onback} class="p-1 -ml-1 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors" aria-label="Back">
        <ArrowLeft size={22} />
      </button>

      {#if editingName}
        <!-- svelte-ignore a11y_autofocus -->
        <input
          class="flex-1 text-xl font-semibold bg-transparent border-b-2 border-zinc-400 focus:outline-none focus:border-zinc-700 dark:focus:border-zinc-200"
          value={localList.name}
          autofocus
          onblur={commitName}
          onkeydown={nameKeydown}
        />
      {:else}
        <button
          onclick={startEditName}
          class="flex-1 text-xl font-semibold text-left truncate hover:opacity-70 transition-opacity"
        >
          {localList.name}
        </button>
      {/if}

      <!-- Mode pills — inline on sm+ only -->
      <div class="hidden sm:flex items-center gap-1.5 flex-shrink-0">
        <button
          onclick={() => setListMode('draft')}
          class="px-2.5 py-1 rounded-full text-xs font-semibold transition-colors
            {(localList.listMode ?? 'draft') === 'draft' && !localList.isPackingMode
              ? 'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}"
        >Draft</button>
        <button
          onclick={() => setListMode('final')}
          class="px-2.5 py-1 rounded-full text-xs font-semibold transition-colors
            {(localList.listMode ?? 'draft') === 'final' && !localList.isPackingMode
              ? 'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}"
        >Final</button>
        <button
          onclick={togglePackingMode}
          class="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors
            {localList.isPackingMode
              ? 'bg-green-700 dark:bg-green-800 text-white shadow-sm shadow-green-900/20'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}"
        >
          <Check size={12} />
          {localList.isPackingMode ? 'Packing' : 'Start Packing'}
        </button>
      </div>
    </div>

    <!-- Row 2: mode pills — mobile only -->
    <div class="flex sm:hidden items-center gap-1.5 mt-2">
      <button
        onclick={() => setListMode('draft')}
        class="px-2.5 py-1 rounded-full text-xs font-semibold transition-colors
          {(localList.listMode ?? 'draft') === 'draft' && !localList.isPackingMode
            ? 'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900'
            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}"
      >Draft</button>
      <button
        onclick={() => setListMode('final')}
        class="px-2.5 py-1 rounded-full text-xs font-semibold transition-colors
          {(localList.listMode ?? 'draft') === 'final' && !localList.isPackingMode
            ? 'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900'
            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}"
      >Final</button>
      <button
        onclick={togglePackingMode}
        class="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors
          {localList.isPackingMode
            ? 'bg-green-700 dark:bg-green-800 text-white shadow-sm shadow-green-900/20'
            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}"
      >
        <Check size={12} />
        {localList.isPackingMode ? 'Packing' : 'Start Packing'}
      </button>
    </div>
  </header>

  <!-- Weight summary bar (sticky below header) -->
  <div class="sticky top-[93px] sm:top-[57px] z-10 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
    <div class="flex items-center">
      <!-- Base / Wearable / Consumable — evenly spaced by content -->
      <div class="flex flex-1 justify-evenly">
        {#each [
          { label: 'Base',       value: weights.base },
          { label: 'Wearable',   value: weights.wearable },
          { label: 'Consumable', value: weights.consumable },
        ] as stat}
          <div class="flex flex-col items-center">
            <span class="text-[10px] uppercase tracking-wide text-zinc-400 dark:text-zinc-500">{stat.label}</span>
            <span class="text-sm font-medium text-zinc-700 dark:text-zinc-300 tabular-nums">
              {formatWeight(stat.value, unit)}
            </span>
          </div>
        {/each}
      </div>
      <!-- Total — separated by divider -->
      <div class="flex flex-col items-center border-l border-zinc-200 dark:border-zinc-700 pl-4 ml-4">
        <span class="text-[10px] uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Total</span>
        <span class="text-sm font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
          {formatWeight(weights.total, unit)}
        </span>
      </div>
    </div>
  </div>

  <!-- Packing mode clear button (Draft mode only) -->
  {#if localList.isPackingMode && (localList.listMode ?? 'draft') === 'draft'}
    <div class="px-4 pt-3">
      <button
        onclick={clearAllChecks}
        class="w-full py-2 rounded-lg bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 text-sm font-medium border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900 transition-colors"
      >
        Clear all checks
      </button>
    </div>
  {/if}

  <!-- Categories -->
  <div class="flex-1 overflow-auto pb-32">
  {#if (localList.listMode ?? 'draft') === 'final'}
    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- FINAL VIEW — lighterpack-style condensed layout            -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <div class="px-4 pt-2 pb-8">
      {#if localList.isPackingMode}
        <div class="my-3">
          <button
            onclick={clearAllChecks}
            class="w-full py-2 rounded-lg bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 text-sm font-medium border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900 transition-colors"
          >
            Clear all checks
          </button>
        </div>
      {/if}

      {#each localList.categories as cat}
        {@const catWeight = categoryWeight(cat)}
        <!-- Category header row -->
        {@const catTotalQty = cat.items.reduce((s, i) => s + i.quantity, 0)}
        <div class="flex items-baseline justify-between pt-5 pb-1.5 border-b border-zinc-300 dark:border-zinc-600">
          <span class="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide">{cat.name}</span>
          <div class="flex items-baseline gap-3 text-xs text-zinc-400 dark:text-zinc-500">
            <span>{catTotalQty} item{catTotalQty !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <!-- Items -->
        {#each cat.items as item}
          {@const gear = gearItemsMap.get(item.gearItemId)}
          {#if gear}
            <div
              class="flex items-center gap-3 py-2 border-b border-zinc-100 dark:border-zinc-800/60
                {item.checked && localList.isPackingMode ? 'opacity-40' : ''}"
            >
              {#if localList.isPackingMode}
                <!-- Quantity label on the left in packing mode -->
                <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400 tabular-nums flex-shrink-0 w-7 text-center">
                  {item.quantity}x
                </span>
              {/if}
              <span class="flex-1 text-sm text-zinc-800 dark:text-zinc-200 truncate
                {item.checked && localList.isPackingMode ? 'line-through' : ''}">
                {gear.name}{#if gear.brand} <span class="text-zinc-400 dark:text-zinc-500 font-normal text-xs">· {gear.brand}</span>{/if}
              </span>
              {#if !localList.isPackingMode}
                <span class="text-xs text-zinc-400 dark:text-zinc-500 tabular-nums flex-shrink-0">
                  {formatWeight(itemWeightIn(gear, unit) * item.quantity, unit)}
                  {#if item.quantity > 1}<span class="ml-0.5 text-zinc-300 dark:text-zinc-600">×{item.quantity}</span>{/if}
                </span>
              {/if}
              {#if localList.isPackingMode}
                <!-- Checkbox on the right in packing mode -->
                <button
                  onclick={() => toggleChecked(cat.id, item.id)}
                  class="w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors
                    {item.checked ? 'bg-green-700 border-green-700' : 'border-zinc-300 dark:border-zinc-600'}"
                  aria-label="Toggle check"
                >
                  {#if item.checked}
                    <Check size={10} class="text-white" />
                  {/if}
                </button>
              {/if}
            </div>
          {/if}
        {/each}
      {/each}
    </div>
  {:else}
    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- DRAFT VIEW — original bordered card layout                 -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <div class="px-4 pt-4 space-y-4">
      <!-- Trip notes + Add category inline -->
      <div class="flex gap-3">
        <!-- Trip Notes — 1/3 width -->
        <div class="flex-[1] rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <button
            onclick={() => (showTripNotes = !showTripNotes)}
            class="flex items-center justify-between w-full px-3 py-3 bg-zinc-50 dark:bg-zinc-900 text-sm font-semibold h-full"
          >
            <span>Notes</span>
            {#if showTripNotes}
              <ChevronUp size={18} class="text-zinc-400" />
            {:else}
              <ChevronDown size={18} class="text-zinc-400" />
            {/if}
          </button>
        </div>

        <!-- Add Category — 2/3 width -->
        <button
          onclick={addCategory}
          class="flex-[2] py-3 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700
            text-sm font-medium text-zinc-400 dark:text-zinc-500
            hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300
            transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Add Category
        </button>
      </div>

      <!-- Trip notes expanded card — below inline row -->
      {#if showTripNotes}
        <div class="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div class="px-4 py-3">
            <textarea
              bind:value={localList.tripNotes}
              onblur={saveTripNotes}
              placeholder="Trip details, reminders, waypoints…"
              rows={5}
              class="w-full text-sm bg-transparent resize-none focus:outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
            ></textarea>
          </div>
        </div>
      {/if}

      <!-- Divider -->
      <div class="border-t border-zinc-200 dark:border-zinc-800"></div>

      <div
        use:dndzone={{ items: dragCategories, flipDurationMs: 200, transformDraggedElement, dropTargetStyle: {} }}
        onconsider={handleCatConsider}
        onfinalize={handleCatFinalize}
        class="space-y-3"
      >
      {#each dragCategories as cat (cat.id)}
        {@const collapsed = collapsedCategories.has(cat.id)}
        <div class={(cat as any).isDndShadowItem ? 'rounded-xl outline outline-2 outline-indigo-500 outline-offset-2 opacity-40' : ''}>
        <div class="rounded-xl border overflow-hidden transition-colors
          {cat.id === newCatId
            ? 'border-zinc-400 dark:border-zinc-500 animate-cat-pop'
            : 'border-zinc-200 dark:border-zinc-800'}">
          <!-- Category header -->
          <div class="flex items-center gap-2 px-4 py-3 bg-zinc-50 dark:bg-zinc-900">
            <!-- Drag handle -->
            <div class="cursor-grab active:cursor-grabbing text-zinc-300 dark:text-zinc-600 touch-none select-none flex-shrink-0">
              <svg width="14" height="20" viewBox="0 0 16 24" fill="currentColor">
                <circle cx="5" cy="6" r="1.5"/><circle cx="11" cy="6" r="1.5"/>
                <circle cx="5" cy="12" r="1.5"/><circle cx="11" cy="12" r="1.5"/>
                <circle cx="5" cy="18" r="1.5"/><circle cx="11" cy="18" r="1.5"/>
              </svg>
            </div>
            <button
              onclick={() => toggleCollapse(cat.id)}
              class="text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
              aria-label={collapsed ? 'Expand' : 'Collapse'}
            >
              {#if collapsed}
                <ChevronDown size={18} />
              {:else}
                <ChevronUp size={18} />
              {/if}
            </button>

            {#if editingCategoryId === cat.id}
              <!-- svelte-ignore a11y_autofocus -->
              <input
                class="flex-1 font-semibold bg-transparent border-b border-zinc-400 focus:outline-none text-sm"
                value={cat.name}
                autofocus
                onblur={(e) => commitCategoryName(cat.id, e)}
                onkeydown={(e) => catNameKeydown(cat.id, e)}
              />
            {:else}
              <button
                onclick={() => startEditCategory(cat.id)}
                class="flex-1 font-semibold text-sm text-left hover:opacity-70 transition-opacity"
              >
                {cat.name}
              </button>
            {/if}

            <span class="text-xs text-zinc-400 dark:text-zinc-500 flex-shrink-0">
              {cat.items.reduce((s, i) => s + i.quantity, 0)} item{cat.items.reduce((s, i) => s + i.quantity, 0) !== 1 ? 's' : ''}
            </span>

          </div>

          <!-- Items -->
          {#if !collapsed}
            <div class="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {#each cat.items as item (item.id)}
                {@const gear = gearItemsMap.get(item.gearItemId)}
                <div class="flex items-center gap-3 px-4 py-3 {item.checked && localList.isPackingMode ? 'opacity-50' : ''}">
                  {#if localList.isPackingMode}
                    <button
                      onclick={() => toggleChecked(cat.id, item.id)}
                      class="flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                        {item.checked
                          ? 'bg-green-700 border-green-700 text-white'
                          : 'border-zinc-300 dark:border-zinc-600'}"
                      aria-label="Toggle checked"
                    >
                      {#if item.checked}
                        <Check size={12} />
                      {/if}
                    </button>
                  {/if}

                  <div class="flex-1 min-w-0">
                    {#if gear}
                      <p class="text-sm font-medium truncate {item.checked && localList.isPackingMode ? 'line-through' : ''}">{gear.name}</p>
                      <p class="text-xs text-zinc-400 dark:text-zinc-500 truncate">{gear.brand || '—'}</p>
                    {:else}
                      <p class="text-sm text-zinc-400 italic">Item not found</p>
                    {/if}
                  </div>

                  {#if gear}
                    <span class="text-xs text-zinc-400 dark:text-zinc-500 tabular-nums w-16 text-right">
                      {formatWeight(itemWeightIn(gear, unit) * item.quantity, unit)}
                    </span>
                  {/if}

                  <!-- Quantity stepper -->
                  <div class="flex items-center gap-1">
                    <button
                      onclick={() => changeQty(cat.id, item.id, -1)}
                      class="w-7 h-7 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} />
                    </button>
                    <span class="text-sm font-medium w-5 text-center tabular-nums">{item.quantity}</span>
                    <button
                      onclick={() => changeQty(cat.id, item.id, 1)}
                      class="w-7 h-7 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {#if deleteConfirmItemId === item.id}
                    <div class="flex items-center gap-1.5 ml-1">
                      <button
                        onclick={() => deleteItem(cat.id, item.id)}
                        data-confirm-delete-item
                        class="text-xs text-red-600 dark:text-red-400 font-medium px-2 py-0.5 rounded border border-red-300 dark:border-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        Confirm
                      </button>
                      <button
                        onclick={() => (deleteConfirmItemId = null)}
                        class="text-xs text-zinc-500 dark:text-zinc-400"
                      >
                        Cancel
                      </button>
                    </div>
                  {:else}
                    <button
                      onclick={() => confirmDeleteItem(item.id)}
                      data-delete-item
                      class="text-zinc-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 focus-visible:text-red-500 dark:focus-visible:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded transition-colors ml-1"
                      aria-label="Remove item"
                    >
                      <Trash2 size={14} />
                    </button>
                  {/if}
                </div>
              {/each}

              <!-- Add item / kit / delete -->
              <div class="flex items-center gap-2 px-4 py-3">
                <button
                  onclick={() => openItemPicker(cat.id)}
                  data-add-item
                  class="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 transition-colors"
                >
                  <Plus size={14} />
                  Add item
                </button>
                <span class="text-zinc-200 dark:text-zinc-700">·</span>
                <button
                  onclick={() => openKitPicker(cat.id)}
                  data-add-kit
                  class="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 transition-colors"
                >
                  <Layers size={14} />
                  Add kit
                </button>
                <div class="flex-1"></div>
                {#if deleteConfirmCatId === cat.id}
                  <button
                    onclick={() => deleteCategory(cat.id)}
                    data-confirm-delete-cat
                    class="text-xs text-red-600 dark:text-red-400 font-medium px-2 py-0.5 rounded border border-red-300 dark:border-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    Confirm
                  </button>
                  <button
                    onclick={() => (deleteConfirmCatId = null)}
                    class="text-xs text-zinc-500"
                  >
                    Cancel
                  </button>
                {:else}
                  <button
                    onclick={() => confirmDeleteCat(cat.id)}
                    data-delete-category
                    class="text-zinc-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 focus-visible:text-red-500 dark:focus-visible:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded transition-colors"
                    aria-label="Delete category"
                  >
                    <Trash2 size={16} />
                  </button>
                {/if}
              </div>
            </div>
          {/if}
        </div>
        </div>
      {/each}
      </div>
    </div>
  {/if}
  <!-- end draft/final -->
  </div>
</div>

<!-- Item picker modal -->
{#if itemPickerCatId !== null}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex flex-col bg-white dark:bg-zinc-950"
    onclick={(e) => { if (e.target === e.currentTarget) closeItemPicker() }}
  >
    <div class="flex items-center gap-3 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
      <button onclick={closeItemPicker} class="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
        <ArrowLeft size={20} />
      </button>
      <h2 class="text-base font-semibold flex-1">Add Gear Items</h2>
      <button
        onclick={confirmItemPicker}
        class="px-4 py-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold"
      >
        Done
      </button>
    </div>

    <div class="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
      <!-- svelte-ignore a11y_autofocus -->
      <input
        type="search"
        bind:value={itemPickerSearch}
        placeholder="Search by name or brand…"
        autofocus
        class="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700
          bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 placeholder:text-zinc-400"
      />
    </div>

    <div class="flex-1 overflow-auto">
      {#each pickerItems as gear}
        {@const selected = itemPickerSelected.has(gear.id)}
        <button
          onclick={() => togglePickerItem(gear.id)}
          class="flex items-center gap-3 w-full px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/60 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
        >
          <div
            class="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors
              {selected ? 'bg-zinc-800 dark:bg-zinc-100 border-zinc-800 dark:border-zinc-100' : 'border-zinc-300 dark:border-zinc-600'}"
          >
            {#if selected}
              <Check size={12} class="text-white dark:text-zinc-900" />
            {/if}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">{gear.name}</p>
            <p class="text-xs text-zinc-400 dark:text-zinc-500 truncate">{gear.brand || '—'}</p>
          </div>
          <span class="text-xs text-zinc-400 tabular-nums">{formatWeight(itemWeightIn(gear, unit), unit)}</span>
        </button>
      {/each}
      {#if pickerItems.length === 0}
        <div class="text-center py-16 text-zinc-400 dark:text-zinc-500">
          <Package class="mx-auto mb-2" size={36} />
          <p class="text-sm">No items found</p>
        </div>
      {/if}
    </div>
  </div>
{/if}

<!-- Empty kits prompt -->
{#if showEmptyKitsPrompt}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
    onclick={(e) => { if (e.target === e.currentTarget) showEmptyKitsPrompt = false }}
  >
    <div class="w-full sm:max-w-sm bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl shadow-xl px-6 py-8 flex flex-col items-center text-center gap-4">
      <Layers size={48} class="text-zinc-300 dark:text-zinc-600" />
      <div>
        <p class="font-semibold text-zinc-900 dark:text-zinc-100 text-lg">No kits yet</p>
        <p class="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Create a kit first by grouping gear items — like a Sleep System or Cook Kit — then add it here.</p>
      </div>
      <button
        onclick={() => { showEmptyKitsPrompt = false; onback(); window.dispatchEvent(new CustomEvent('navigate:tab', { detail: 'kits' })) }}
        class="w-full py-3 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
      >
        Go to Kits
      </button>
      <button
        onclick={() => (showEmptyKitsPrompt = false)}
        class="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
      >
        Cancel
      </button>
    </div>
  </div>
{/if}

<!-- Empty gear closet prompt -->
{#if showEmptyGearPrompt}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
    onclick={(e) => { if (e.target === e.currentTarget) showEmptyGearPrompt = false }}
  >
    <div class="w-full sm:max-w-sm bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl shadow-xl px-6 py-8 flex flex-col items-center text-center gap-4">
      <Backpack size={48} class="text-zinc-300 dark:text-zinc-600" />
      <div>
        <p class="font-semibold text-zinc-900 dark:text-zinc-100 text-lg">Gear Closet is empty</p>
        <p class="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Add gear to your closet first, then come back to build your list.</p>
      </div>
      <button
        onclick={() => { showEmptyGearPrompt = false; onback(); onGoToGear() }}
        class="w-full py-3 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
      >
        Go to Gear Closet
      </button>
      <button
        onclick={() => (showEmptyGearPrompt = false)}
        class="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
      >
        Cancel
      </button>
    </div>
  </div>
{/if}

<!-- Kit picker modal -->
{#if showKitPicker}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex flex-col bg-white dark:bg-zinc-950"
    onclick={(e) => { if (e.target === e.currentTarget) closeKitPicker() }}
  >
    <div class="flex items-center gap-3 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
      <button onclick={closeKitPicker} class="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
        <ArrowLeft size={20} />
      </button>
      <h2 class="text-base font-semibold">Add Kit</h2>
    </div>

    <div class="flex-1 overflow-auto">
      {#each kitStore.kits as kit}
        <button
          onclick={() => addKit(kit.id)}
          class="flex items-center gap-3 w-full px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/60 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
        >
          <Layers size={20} class="text-zinc-400 flex-shrink-0" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">{kit.name}</p>
            <p class="text-xs text-zinc-400 dark:text-zinc-500">{kit.itemIds.length} items</p>
          </div>
        </button>
      {/each}
      {#if kitStore.kits.length === 0}
        <div class="text-center py-16 text-zinc-400 dark:text-zinc-500">
          <Layers class="mx-auto mb-2" size={36} />
          <p class="text-sm">No kits saved yet</p>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  @keyframes cat-pop {
    0%   { background-color: rgb(161 161 170 / 0.25); transform: scale(1.01); }
    60%  { background-color: rgb(161 161 170 / 0.10); transform: scale(1.00); }
    100% { background-color: transparent; }
  }
  :global(.animate-cat-pop) {
    animation: cat-pop 0.7s ease-out forwards;
  }
</style>
