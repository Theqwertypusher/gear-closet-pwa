<script lang="ts">
  import { ChevronDown, ChevronUp, Smartphone } from '@lucide/svelte'
  import { settingsStore } from '../lib/stores/settingsStore.svelte'
  import { track } from '../lib/analytics'
  import { adminStore } from '../lib/stores/adminStore.svelte'
  import { setGearStoreTutorialMode } from '../lib/stores/gearStore.svelte'
  import { setKitStoreTutorialMode } from '../lib/stores/kitStore.svelte'
  import { setPackingListStoreTutorialMode } from '../lib/stores/packingListStore.svelte'
  import { gearStore } from '../lib/stores/gearStore.svelte'
  import { kitStore } from '../lib/stores/kitStore.svelte'
  import { packingListStore } from '../lib/stores/packingListStore.svelte'

  let { onDone, onStartTour }: { onDone: () => void; onStartTour: () => void } = $props()

  let installOpen = $state(false)
  let displayName = $state('')

  $effect(() => { track('welcome_seen') })

  async function chooseTutorial() {
    track('onboarding_sample_data_chosen')
    setGearStoreTutorialMode(true)
    setKitStoreTutorialMode(true)
    setPackingListStoreTutorialMode(true)
    await settingsStore.update({ tutorialMode: true, hasSeenWelcome: true, displayName: displayName.trim() || 'Me' })
    await Promise.all([
      gearStore.loadTutorial(),
      kitStore.loadTutorial(),
      packingListStore.loadTutorial(),
    ])
    onDone()
  }

  async function chooseFresh() {
    track('onboarding_fresh_start_chosen')
    await settingsStore.update({ hasSeenWelcome: true, displayName: displayName.trim() || 'Me' })
    onDone()
  }
</script>

<div class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-zinc-950 px-6 overflow-y-auto py-12">

  <!-- App name -->
  <div class="mb-10 text-center">
    <img
      src="/icons/logo-light.svg"
      alt="Gear Closet logo"
      class="h-20 w-auto mx-auto mb-4 dark:hidden"
    />
    <img
      src="/icons/logo-dark.svg"
      alt="Gear Closet logo"
      class="h-20 w-auto mx-auto mb-4 hidden dark:block"
    />
    <h1 class="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Gear Closet</h1>
    <p class="mt-2 text-base text-zinc-500 dark:text-zinc-400">Your gear. Your trips. Always ready.</p>
  </div>

  <!-- Display name input -->
  <div class="w-full max-w-sm mb-6">
    <input
      type="text"
      bind:value={displayName}
      placeholder="Your name"
      class="w-full px-4 py-3 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
    />
    <p class="mt-1.5 text-xs text-zinc-400 dark:text-zinc-500 text-center">Used when collaborating with others.</p>
    {#if adminStore.isAdmin}
      <p class="text-xs text-green-500 mt-1 text-center">Admin mode active</p>
    {/if}
  </div>

  <!-- Option cards -->
  <div class="w-full max-w-sm space-y-3">
    <!-- App tutorial -->
    <button
      onclick={() => { track('onboarding_tour_started'); onStartTour() }}
      class="w-full text-left rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-5 py-5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900 active:scale-[0.98]"
    >
      <p class="text-base font-semibold text-zinc-900 dark:text-zinc-100">Start app walkthrough</p>
      <p class="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">Learn and understand the app</p>
    </button>

    <!-- Sample data -->
    <button
      onclick={chooseTutorial}
      class="w-full text-left rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-5 py-5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900 active:scale-[0.98]"
    >
      <p class="text-base font-semibold text-zinc-900 dark:text-zinc-100">Start with sample data</p>
      <p class="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">Explore with a real gear loadout</p>
    </button>

    <!-- Fresh start -->
    <button
      onclick={chooseFresh}
      class="w-full text-left rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-5 py-5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900 active:scale-[0.98]"
    >
      <p class="text-base font-semibold text-zinc-900 dark:text-zinc-100">Start fresh</p>
      <p class="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">I'll add my own gear</p>
    </button>
  </div>

  <!-- PWA install disclosure — below cards -->
  <div class="mt-8 w-full max-w-sm">
    <button
      onclick={() => (installOpen = !installOpen)}
      class="flex items-center justify-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors w-full"
    >
      <Smartphone size={14} />
      <span class="font-medium">How to install for offline use</span>
      {#if installOpen}
        <ChevronUp size={14} />
      {:else}
        <ChevronDown size={14} />
      {/if}
    </button>

    {#if installOpen}
      <div class="mt-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-4 space-y-4">
        <div>
          <p class="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">Safari (iPhone / iPad)</p>
          <ol class="list-decimal list-inside space-y-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
            <li>Tap the <strong>Share</strong> button (box with arrow) at the bottom of Safari</li>
            <li>Scroll down and tap <strong>Add to Home Screen</strong></li>
            <li>Tap <strong>Add</strong> to confirm</li>
          </ol>
        </div>
        <div>
          <p class="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">Chrome (Android / Desktop)</p>
          <ol class="list-decimal list-inside space-y-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
            <li>Tap the <strong>three-dot menu</strong> (⋮) in the top right</li>
            <li>Tap <strong>Add to Home Screen</strong> or <strong>Install App</strong></li>
            <li>Tap <strong>Install</strong> to confirm</li>
          </ol>
        </div>
        <div>
          <p class="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">Firefox (Android)</p>
          <ol class="list-decimal list-inside space-y-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
            <li>Tap the <strong>three-dot menu</strong> (⋮) in the top right</li>
            <li>Tap <strong>Install</strong></li>
          </ol>
        </div>
      </div>
    {/if}
  </div>

</div>
