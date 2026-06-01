<script lang="ts">
  import { Plus, Layers, Backpack } from '@lucide/svelte'
  import { dndzone } from 'svelte-dnd-action'
  import { kitStore } from '../lib/stores/kitStore.svelte'
  import { gearStore } from '../lib/stores/gearStore.svelte'
  import { settingsStore } from '../lib/stores/settingsStore.svelte'
  import KitCard from './KitCard.svelte'
  import KitModal from './KitModal.svelte'
  import type { Kit } from '../lib/types'

  interface Props {
    onGoToGear: () => void
  }
  let { onGoToGear }: Props = $props()

  let showEmptyGearPrompt = $state(false)

  let dragKits = $state<Kit[]>([])
  $effect(() => { dragKits = [...kitStore.kits] })

  function handleDndConsider(e: CustomEvent<{ items: Kit[] }>) {
    dragKits = e.detail.items
  }

  async function handleDndFinalize(e: CustomEvent<{ items: Kit[] }>) {
    dragKits = e.detail.items
    await kitStore.reorderKits(e.detail.items)
  }

  function transformDraggedElement(el: HTMLElement) {
    el.style.outline = '2px solid #6366f1'
    el.style.outlineOffset = '2px'
    el.style.borderRadius = '12px'
    el.style.opacity = '0.95'
  }

  let modalOpen = $state(false)
  let editingKit = $state<Kit | null>(null)

  function openCreate() {
    if (gearStore.items.length === 0) {
      showEmptyGearPrompt = true
      return
    }
    editingKit = null
    modalOpen = true
  }

  $effect(() => {
    function onShortcut(e: Event) {
      if ((e as CustomEvent).detail?.tab === 'kits') openCreate()
    }
    window.addEventListener('shortcut:add', onShortcut)
    return () => window.removeEventListener('shortcut:add', onShortcut)
  })

  function openEdit(kit: Kit) {
    editingKit = kit
    modalOpen = true
  }

  function closeModal() {
    modalOpen = false
    editingKit = null
  }

  async function handleSave(data: Omit<Kit, 'id' | 'createdAt' | 'updatedAt'>) {
    if (editingKit) {
      await kitStore.updateKit(editingKit.id, data)
    } else {
      await kitStore.addKit(data)
    }
    closeModal()
  }

  async function handleDelete(id: string) {
    await kitStore.deleteKit(id)
  }

  async function handleDuplicate(id: string) {
    await kitStore.duplicateKit(id)
    dragKits = [...kitStore.kits]
  }
</script>

<div class="flex flex-col min-h-full relative">
  <!-- Kit list or empty state -->
  {#if kitStore.kits.length === 0}
    <div class="text-zinc-500 dark:text-zinc-400 text-center mt-24">
      <Layers class="mx-auto mb-3 text-zinc-300 dark:text-zinc-600" size={52} />
      <p class="font-semibold text-zinc-700 dark:text-zinc-300">No kits yet</p>
      <p class="text-sm text-zinc-400 dark:text-zinc-500 mt-2 px-6">Group gear into reusable kits — like "Sleep System" or "Cook Kit" — and quickly add them to any packing list.</p>
      <p class="text-sm mt-2">Tap + to create your first kit</p>
    </div>
  {:else}
    <div
      use:dndzone={{ items: dragKits, flipDurationMs: 200, transformDraggedElement, dropTargetStyle: {} }}
      onconsider={handleDndConsider}
      onfinalize={handleDndFinalize}
      class="px-3 pt-4 space-y-3 pb-24"
    >
      {#each dragKits as kit (kit.id)}
        <div class={(kit as any).isDndShadowItem ? 'rounded-xl outline outline-2 outline-indigo-500 outline-offset-2 opacity-40' : ''}>
        <KitCard
          {kit}
          gearItems={gearStore.items}
          weightUnit={settingsStore.settings.weightUnit}
          onEdit={() => openEdit(kit)}
          onDuplicate={() => handleDuplicate(kit.id)}
          onDelete={() => handleDelete(kit.id)}
        />
        </div>
      {/each}
    </div>
  {/if}

  <!-- FAB -->
  <button
    onclick={openCreate}
    class="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-lg flex items-center justify-center hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-95 transition-all"
    aria-label="Create kit"
  >
    <Plus size={24} />
  </button>
</div>

{#if modalOpen}
  <KitModal
    kit={editingKit}
    gearItems={gearStore.items}
    weightUnit={settingsStore.settings.weightUnit}
    onSave={handleSave}
    onClose={closeModal}
  />
{/if}

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
        <p class="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Kits are built from gear items. Add some gear first, then come back to assemble your kits.</p>
      </div>
      <button
        onclick={() => { showEmptyGearPrompt = false; onGoToGear() }}
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
