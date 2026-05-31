<script lang="ts">
  import { tick } from 'svelte'
  import { scale, slide } from 'svelte/transition'
  import { Download, Upload, Trash2, Info, FlaskConical, Sun, Moon, Keyboard, Link, Check, ChevronDown, ChevronUp } from '@lucide/svelte'
  import { settingsStore } from '../lib/stores/settingsStore.svelte'
  import { gearStore, setGearStoreTutorialMode } from '../lib/stores/gearStore.svelte'
  import { kitStore, setKitStoreTutorialMode } from '../lib/stores/kitStore.svelte'
  import { packingListStore, setPackingListStoreTutorialMode } from '../lib/stores/packingListStore.svelte'
  import { exportBackup, importBackup } from '../lib/backup'
  import { replaceAllData, clearAllData } from '../lib/db'
  import { buildShareUrl } from '../lib/share'
  import ShareModal from './ShareModal.svelte'

  let { viewingShared = false }: { viewingShared?: boolean } = $props()

  let importStatus = $state<{ type: 'success' | 'error'; message: string } | null>(null)
  let showImportModal = $state(false)
  let showShareModal = $state(false)
  // Expanded by default on tablet/desktop (≥768px), collapsed on mobile
  let shortcutsOpen = $state(
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : false
  )
  let tutorialOffStatus = $state(false)
  let keepSavedStatus = $state(false)
  let fileInput: HTMLInputElement
  let showClearModal = $state(false)
  let clearConfirmText = $state('')


  async function handleTutorialToggleOn() {
    await settingsStore.update({ tutorialMode: true })
    setGearStoreTutorialMode(true)
    setKitStoreTutorialMode(true)
    setPackingListStoreTutorialMode(true)
    await Promise.all([
      gearStore.reset(),
      kitStore.reset(),
      packingListStore.reset(),
    ])
  }

  async function handleTutorialToggleOff() {
    setGearStoreTutorialMode(false)
    setKitStoreTutorialMode(false)
    setPackingListStoreTutorialMode(false)
    await settingsStore.update({ tutorialMode: false })
    await Promise.all([
      gearStore.reset(),
      kitStore.reset(),
      packingListStore.reset(),
    ])
    tutorialOffStatus = true
    setTimeout(() => { tutorialOffStatus = false }, 3000)
  }

  async function handleKeepSampleData() {
    // Use $state.snapshot() to strip Svelte Proxy wrappers before writing to IndexedDB
    await replaceAllData(
      $state.snapshot(gearStore.items),
      $state.snapshot(kitStore.kits),
      $state.snapshot(packingListStore.lists),
      { ...$state.snapshot(settingsStore.settings), tutorialMode: false },
    )
    // Disable tutorial mode flags so store resets load from real DB data
    setGearStoreTutorialMode(false)
    setKitStoreTutorialMode(false)
    setPackingListStoreTutorialMode(false)
    // Update in-memory settings immediately (no reset flash)
    await settingsStore.update({ tutorialMode: false })
    // Reload data stores from IndexedDB
    await Promise.all([
      gearStore.reset(),
      kitStore.reset(),
      packingListStore.reset(),
    ])
    keepSavedStatus = true
    setTimeout(() => { keepSavedStatus = false }, 2500)
  }

  async function handleExport() {
    exportBackup(
      $state.snapshot(gearStore.items),
      $state.snapshot(kitStore.kits),
      $state.snapshot(packingListStore.lists),
      $state.snapshot(settingsStore.settings),
    )
    await settingsStore.update({ lastExportDate: new Date().toISOString() })
  }

  function triggerImport() {
    importStatus = null
    showImportModal = true
  }

  function confirmImport() {
    showImportModal = false
    fileInput.click()
  }

  async function handleFileChange(e: Event) {
    const target = e.currentTarget as HTMLInputElement
    const file = target.files?.[0]
    if (!file) return

    try {
      const appState = await importBackup(file)
      await replaceAllData(
        appState.gearItems,
        appState.kits,
        appState.packingLists,
        appState.settings,
      )
      await Promise.all([
        gearStore.reset(),
        kitStore.reset(),
        packingListStore.reset(),
        settingsStore.reset(),
      ])
      importStatus = { type: 'success', message: 'Backup imported successfully!' }
    } catch (err) {
      importStatus = {
        type: 'error',
        message: err instanceof Error ? err.message : 'Import failed.',
      }
    } finally {
      target.value = ''
    }
  }

  async function handleClearAll() {
    if (clearConfirmText.trim().toLowerCase() !== 'delete') return
    showClearModal = false
    clearConfirmText = ''
    await clearAllData()
    await Promise.all([
      gearStore.reset(),
      kitStore.reset(),
      packingListStore.reset(),
      settingsStore.reset(),
    ])
  }

  function openClearModal() {
    clearConfirmText = ''
    showClearModal = true
  }

  function formatDate(iso: string | null): string {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
</script>

<div class="px-4 py-6 space-y-8 max-w-lg mx-auto">

  <!-- About -->
  <section>
    <div class="flex items-center gap-2 mb-1">
      <Info size={14} class="text-zinc-400" />
      <h2 class="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
        About
      </h2>
    </div>
    <div class="border-t border-zinc-200 dark:border-zinc-800 mb-4"></div>

    <div class="space-y-0.5">
      <p class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Gear Closet</p>
      <p class="text-xs text-zinc-500 dark:text-zinc-400">Version 1.0.0</p>
      <p class="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Your gear. Your trips. Always ready.</p>
    </div>
    <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-4 leading-relaxed">
      This is an open source project meant to serve the community. Your data is neither tracked nor saved. You own it all on your device(s). Any feedback and / or issues can be reported below. Happy trailblazing.
    </p>
    {#if import.meta.env.VITE_FEEDBACK_URL}
      <a
        href={import.meta.env.VITE_FEEDBACK_URL}
        target="_blank"
        rel="noopener noreferrer"
        class="inline-block mt-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 underline underline-offset-2 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
      >
        Feedback form
      </a>
    {/if}
  </section>

  <!-- Appearance -->
  <section>
    <div class="flex items-center gap-2 mb-1">
      <Sun size={14} class="text-zinc-400" />
      <h2 class="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
        Appearance
      </h2>
    </div>
    <div class="border-t border-zinc-200 dark:border-zinc-800 mb-4"></div>

    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Theme</p>
        <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          {settingsStore.settings.theme === 'dark' ? 'Dark mode' : 'Light mode'}
        </p>
      </div>
      <button
        onclick={() => settingsStore.update({ theme: settingsStore.settings.theme === 'dark' ? 'light' : 'dark' })}
        class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors
          {settingsStore.settings.theme === 'dark' ? 'bg-zinc-800 dark:bg-zinc-200' : 'bg-zinc-300 dark:bg-zinc-600'}"
        role="switch"
        aria-checked={settingsStore.settings.theme === 'dark'}
      >
        <span class="absolute left-1 transition-all {settingsStore.settings.theme === 'dark' ? 'opacity-0' : 'opacity-100'}">
          <Sun size={10} class="text-amber-500" />
        </span>
        <span
          class="inline-block h-4 w-4 transform rounded-full bg-white dark:bg-zinc-900 transition-transform shadow
            {settingsStore.settings.theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}"
        ></span>
        <span class="absolute right-1 transition-all {settingsStore.settings.theme === 'dark' ? 'opacity-100' : 'opacity-0'}">
          <Moon size={10} class="text-zinc-400 dark:text-zinc-300" />
        </span>
      </button>
    </div>
  </section>

  <!-- Keyboard Shortcuts -->
  <section>
    <button
      onclick={() => (shortcutsOpen = !shortcutsOpen)}
      class="w-full flex items-center justify-between gap-2 mb-1 group"
    >
      <div class="flex items-center gap-2">
        <Keyboard size={14} class="text-zinc-400" />
        <h2 class="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Keyboard Shortcuts
        </h2>
      </div>
      {#if shortcutsOpen}
        <ChevronUp size={14} class="text-zinc-400 dark:text-zinc-500" />
      {:else}
        <ChevronDown size={14} class="text-zinc-400 dark:text-zinc-500" />
      {/if}
    </button>
    <div class="border-t border-zinc-200 dark:border-zinc-800 mb-4"></div>

    {#if shortcutsOpen}
    <div class="space-y-1" transition:slide={{ duration: 200 }}>
      {#each [
        { keys: ['1'], desc: 'Go to Packing Lists' },
        { keys: ['2'], desc: 'Go to Kits' },
        { keys: ['3'], desc: 'Go to Gear Closet' },
        { keys: ['4'], desc: 'Go to Settings' },
        { keys: ['U'], desc: 'Cycle weight unit (g → oz → lbs → kg)' },
        { keys: ['T'], desc: 'Toggle demo mode on / off' },
        { keys: ['A'], desc: 'Add new item / list / kit / category' },
        { keys: ['A', 'I'], desc: 'Cycle Add item buttons in packing list (hold A, tap I)' },
        { keys: ['A', 'K'], desc: 'Cycle Add kit buttons in packing list (hold A, tap K)' },
        { keys: ['C', '⌫'], desc: 'Cycle category delete in packing list (hold C, tap ⌫)' },
        { keys: ['I', '⌫'], desc: 'Cycle item delete in packing list (hold I, tap ⌫)' },
        { keys: ['Esc'], desc: 'Close modal or dismiss' },
        { keys: ['⌫'], desc: 'Go back' },
      ] as shortcut}
        <div class="flex items-center justify-between py-1.5">
          <span class="text-sm text-zinc-600 dark:text-zinc-400">{shortcut.desc}</span>
          <div class="flex items-center gap-1">
            {#each shortcut.keys as key}
              <kbd class="px-2 py-0.5 rounded-md text-xs font-mono font-semibold
                bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300
                border border-zinc-300 dark:border-zinc-600 shadow-sm">
                {key}
              </kbd>
            {/each}
          </div>
        </div>
      {/each}
    </div>
    {/if}
  </section>

  <!-- Demo Mode -->
  <section data-demo-mode-section class={viewingShared ? 'opacity-40 pointer-events-none select-none' : ''}>
    <div class="flex items-center gap-2 mb-1">
      <FlaskConical size={14} class="text-zinc-400" />
      <h2 class="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
        Demo Mode
      </h2>
      {#if viewingShared}
        <span class="ml-auto text-xs text-zinc-400 dark:text-zinc-500 italic">Unavailable while viewing shared gear</span>
      {/if}
    </div>
    <div class="border-t border-zinc-200 dark:border-zinc-800 mb-4"></div>

    {#if settingsStore.settings.tutorialMode}
      <div class="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 px-4 py-3">
        <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100">Currently active</p>
        <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Exploring with sample data</p>
        <div class="flex gap-3 mt-3">
          <button
            onclick={handleKeepSampleData}
            class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
          >
            Save sample data
          </button>
          <button
            onclick={handleTutorialToggleOff}
            class="text-xs font-medium px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Discard &amp; exit
          </button>
        </div>
      </div>
    {:else}
      <div class="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 px-4 py-3">
        <div>
          <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100">Using your own data</p>
          <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Enable to explore with sample data</p>
        </div>
        <button
          onclick={handleTutorialToggleOn}
          class="text-xs font-medium px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          Enable
        </button>
      </div>
    {/if}
    {#if keepSavedStatus}
      <p in:scale={{ duration: 200, start: 0.5 }} class="mt-3 flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
        <Check size={13} />
        Sample data saved!
      </p>
    {/if}
    {#if tutorialOffStatus}
      <p class="mt-2 text-xs text-green-600 dark:text-green-400">
        Demo mode off. You're starting fresh.
      </p>
    {/if}
  </section>

  <!-- Data & Backup -->
  <section>
    <div class="flex items-center gap-2 mb-1">
      <Download size={14} class="text-zinc-400" />
      <h2 class="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
        Data &amp; Backup
      </h2>
    </div>
    <div class="border-t border-zinc-200 dark:border-zinc-800 mb-4"></div>

    <div class="space-y-4">
      <!-- Export + Import inline -->
      <div class="flex items-center justify-between gap-3">
        <button
          onclick={triggerImport}
          class="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <Upload size={16} />
          Import Backup
        </button>
        <button
          onclick={handleExport}
          class="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
        >
          <Download size={16} />
          Export Backup
        </button>
      </div>
      {#if settingsStore.settings.lastExportDate}
        <p class="text-xs text-zinc-500 dark:text-zinc-400">
          Last exported: {formatDate(settingsStore.settings.lastExportDate)}
        </p>
      {/if}
      {#if importStatus}
        <p class="text-xs {importStatus.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
          {importStatus.message}
        </p>
      {/if}
      <input bind:this={fileInput} type="file" accept=".json" class="sr-only" onchange={handleFileChange} />

      <!-- Share link -->
      <div>
        <button
          onclick={() => (showShareModal = true)}
          class="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <Link size={16} />
          Share a link
        </button>
      </div>
    </div>
  </section>

  <!-- Danger Zone -->
  <section>
    <div class="flex items-center gap-2 mb-1">
      <Trash2 size={14} class="text-red-400" />
      <h2 class="text-xs font-semibold uppercase tracking-widest text-red-400">
        Danger Zone
      </h2>
    </div>
    <div class="border-t border-red-200 dark:border-red-900 mb-4"></div>

    <button
      onclick={openClearModal}
      class="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
    >
      Clear All Data
    </button>
    <p class="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">Permanently deletes all gear, kits, and packing lists.</p>
  </section>

</div>

{#if showShareModal}
  <ShareModal onclose={() => (showShareModal = false)} />
{/if}

<!-- Import confirmation modal -->
{#if showImportModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
    onclick={(e) => { if (e.target === e.currentTarget) showImportModal = false }}
  >
    <div class="w-full sm:max-w-sm bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl shadow-xl px-6 py-8 flex flex-col gap-4">
      <div>
        <p class="font-semibold text-zinc-900 dark:text-zinc-100 text-base">Import backup?</p>
        <p class="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          This will replace all your current gear, kits, and packing lists. This cannot be undone — make sure you've exported first.
        </p>
      </div>
      <div class="flex flex-col gap-2">
        <button
          onclick={confirmImport}
          class="w-full py-3 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
        >
          Choose file &amp; import
        </button>
        <button
          onclick={() => (showImportModal = false)}
          class="w-full py-3 rounded-xl text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Clear all data confirmation modal -->
{#if showClearModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
    onclick={(e) => { if (e.target === e.currentTarget) { showClearModal = false; clearConfirmText = '' } }}
  >
    <div class="w-full sm:max-w-sm bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl shadow-xl px-6 py-8 flex flex-col gap-4">
      <div>
        <p class="font-semibold text-zinc-900 dark:text-zinc-100 text-base">Clear all data?</p>
        <p class="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          This will permanently delete all your gear, kits, packing lists, and settings. This cannot be undone.
        </p>
      </div>
      <div class="flex flex-col gap-1.5">
        <label for="clear-confirm" class="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Type <span class="font-mono font-semibold text-red-500">delete</span> to confirm
        </label>
        <input
          id="clear-confirm"
          type="text"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
          bind:value={clearConfirmText}
          onkeydown={(e) => { if (e.key === 'Enter') handleClearAll() }}
          placeholder="delete"
          class="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none focus:ring-2 focus:ring-red-400 dark:focus:ring-red-600"
        />
      </div>
      <div class="flex flex-col gap-2">
        <button
          onclick={handleClearAll}
          disabled={clearConfirmText.trim().toLowerCase() !== 'delete'}
          class="w-full py-3 rounded-xl text-sm font-semibold transition-colors
            {clearConfirmText.trim().toLowerCase() === 'delete'
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'}"
        >
          Clear all data
        </button>
        <button
          onclick={() => { showClearModal = false; clearConfirmText = '' }}
          class="w-full py-3 rounded-xl text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
{/if}
