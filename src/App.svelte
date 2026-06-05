<script lang="ts">
  import { Backpack, Package, List, Settings as SettingsIcon } from '@lucide/svelte'
  import { inject } from '@vercel/analytics'
  import GearCloset from './components/GearCloset.svelte'
  import Kits from './components/Kits.svelte'
  import PackingLists from './components/PackingLists.svelte'
  import SettingsScreen from './components/Settings.svelte'
  import WelcomeScreen from './components/WelcomeScreen.svelte'
  import AppTour from './components/AppTour.svelte'
  import UpdatePrompt from './components/UpdatePrompt.svelte'
  import { gearStore } from './lib/stores/gearStore.svelte'
  import { packingListStore } from './lib/stores/packingListStore.svelte'
  import { importBackup } from './lib/backup'
  import { replaceAllData } from './lib/db'
  import { readShareParam, clearShareParam, type SharePayload } from './lib/share'
  import { kitStore } from './lib/stores/kitStore.svelte'
  import { settingsStore } from './lib/stores/settingsStore.svelte'
  import { sessionStore } from './lib/stores/sessionStore.svelte'
  import {
    setGearStoreTutorialMode,
  } from './lib/stores/gearStore.svelte'
  import {
    setKitStoreTutorialMode,
  } from './lib/stores/kitStore.svelte'
  import {
    setPackingListStoreTutorialMode,
  } from './lib/stores/packingListStore.svelte'
  import { track } from './lib/analytics'
  import { flags } from './lib/featureFlags'

  type Tab = 'gear' | 'kits' | 'packing-lists' | 'settings'

  let activeTab = $state<Tab>('gear')
  let bannerDismissed = $state(false)
  let welcomeFileInput = $state<HTMLInputElement | undefined>(undefined)
  let tutorialToast = $state(false)
  let showTour = $state(false)

  // Incoming share link — view-only mode
  let viewingShared = $state(false)
  let shareSaved = $state(false)

  // Single effect handles both share-link and tutorial-mode loading.
  // Must be one effect so share link always takes priority — two separate
  // effects reacting to the same dependency (settingsStore.loaded) can race,
  // causing tutorial data to overwrite shared data before viewingShared is set.
  $effect(() => {
    if (!settingsStore.loaded) return

    // Share link takes absolute priority over tutorial mode
    const payload = readShareParam()
    if (payload) {
      clearShareParam()
      setGearStoreTutorialMode(true)
      setKitStoreTutorialMode(true)
      setPackingListStoreTutorialMode(true)
      gearStore.loadShared(payload.gearItems)
      kitStore.loadShared(payload.kits)
      packingListStore.loadShared(payload.packingLists)
      viewingShared = true
      activeTab = 'packing-lists'
      track('share_link_received', { list_count: payload.packingLists.length })
      return // never fall through to tutorial loading
    }

    // Session join link (?session=<hostPeerId>)
    if (flags.collaborateMode) {
      const sessionParam = new URLSearchParams(window.location.search).get('session')
      if (sessionParam) {
        window.history.replaceState({}, '', window.location.pathname)
        activeTab = 'packing-lists'
        sessionStore.joinSession(sessionParam, settingsStore.settings.displayName || 'Me')
        return
      }
    }

    // No share link — load tutorial/demo data if enabled
    if (settingsStore.settings.tutorialMode) {
      setGearStoreTutorialMode(true)
      setKitStoreTutorialMode(true)
      setPackingListStoreTutorialMode(true)
      gearStore.loadTutorial()
      kitStore.loadTutorial()
      packingListStore.loadTutorial()
    }
  })

  async function saveSharedToMyGear() {
    const gearItems = JSON.parse(JSON.stringify(gearStore.items))
    const kits = JSON.parse(JSON.stringify(kitStore.kits))
    const lists = JSON.parse(JSON.stringify(packingListStore.lists))
    // Preserve user's own settings; force hasSeenWelcome true and tutorialMode off
    // so neither the welcome screen nor tutorial reloading triggers after exit.
    const ownSettings = JSON.parse(JSON.stringify({ ...settingsStore.settings, tutorialMode: false, hasSeenWelcome: true }))
    await replaceAllData(gearItems, kits, lists, ownSettings)
    setGearStoreTutorialMode(false)
    setKitStoreTutorialMode(false)
    setPackingListStoreTutorialMode(false)
    await Promise.all([gearStore.reset(), kitStore.reset(), packingListStore.reset()])
    // Update in-memory settings store so derived showWelcomeScreen stays false
    // when viewingShared flips to false.
    await settingsStore.update({ hasSeenWelcome: true, tutorialMode: false })
    viewingShared = false
    shareSaved = true
    setTimeout(() => { shareSaved = false }, 3000)
  }

  async function exitSharedView() {
    setGearStoreTutorialMode(false)
    setKitStoreTutorialMode(false)
    setPackingListStoreTutorialMode(false)
    await Promise.all([gearStore.reset(), kitStore.reset(), packingListStore.reset()])
    // Mark as having seen the app so dismissing a share link never
    // accidentally triggers the welcome screen for first-time visitors.
    await settingsStore.update({ hasSeenWelcome: true })
    viewingShared = false
  }

  // Whether the tutorial toast should be shown after WelcomeScreen chooses tutorial
  // (shown briefly after WelcomeScreen closes)

  // Apply theme class to <html>
  $effect(() => {
    const theme = settingsStore.settings.theme ?? 'dark'
    const html = document.documentElement
    if (theme === 'dark') {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  })


  const tabs: { id: Tab; label: string; icon: typeof Backpack }[] = [
    { id: 'packing-lists', label: 'Packing Lists', icon: List },
    { id: 'kits', label: 'Kits', icon: Package },
    { id: 'gear', label: 'Gear Closet', icon: Backpack },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ]

  // Hide main header/banners when a packing list detail is open (it has its own full-screen header)
  const listDetailOpen = $derived(activeTab === 'packing-lists' && !!packingListStore.activeListId)

  // Show legacy "import" welcome banner only when: no tutorial, no hasSeenWelcome, stores empty
  let showWelcomeBanner = $derived(
    !bannerDismissed &&
    settingsStore.loaded &&
    settingsStore.settings.hasSeenWelcome &&
    !settingsStore.settings.tutorialMode &&
    gearStore.loaded &&
    packingListStore.loaded &&
    gearStore.items.length === 0 &&
    packingListStore.lists.length === 0,
  )

  // Show full-screen welcome when settings loaded, haven't seen it, and not in tutorial/shared mode
  let showWelcomeScreen = $derived(
    settingsStore.loaded &&
    !settingsStore.settings.hasSeenWelcome &&
    !settingsStore.settings.tutorialMode &&
    !viewingShared,
  )

  let showTutorialBanner = $derived(
    settingsStore.loaded && settingsStore.settings.tutorialMode,
  )

  const tabShortcuts: Record<string, Tab> = {
    '1': 'packing-lists',
    '2': 'kits',
    '3': 'gear',
    '4': 'settings',
  }

  // Use a plain object so closures always read the live value
  const held = { a: false, aModifier: false, c: false, i: false }

  function isInput(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement)?.tagName
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' ||
      (e.target as HTMLElement)?.isContentEditable
  }

  async function handleKeydown(e: KeyboardEvent) {
    if (isInput(e)) return
    if (e.metaKey || e.ctrlKey || e.altKey) return
    if (e.repeat && (e.key === 'a' || e.key === 'A' || e.key === 'c' || e.key === 'C' || e.key === 'i' || e.key === 'I')) return

    const k = e.key

    // ── chord: held modifier + second key ──────────────────────────────
    if (held.a && (k === 'i' || k === 'I')) {
      held.aModifier = true
      window.dispatchEvent(new CustomEvent('shortcut:add-item-next'))
      e.preventDefault(); return
    }
    if (held.a && (k === 'k' || k === 'K')) {
      held.aModifier = true
      window.dispatchEvent(new CustomEvent('shortcut:add-kit-next'))
      e.preventDefault(); return
    }
    if (held.c && (k === 'Backspace' || k === 'Delete')) {
      window.dispatchEvent(new CustomEvent('shortcut:delete-category-next'))
      e.preventDefault(); return
    }
    if (held.i && (k === 'Backspace' || k === 'Delete')) {
      window.dispatchEvent(new CustomEvent('shortcut:delete-item-next'))
      e.preventDefault(); return
    }

    // ── standalone keys ────────────────────────────────────────────────
    const tab = tabShortcuts[k]
    if (tab) { activeTab = tab; e.preventDefault(); return }

    if (k === 'a' || k === 'A') { held.a = true; held.aModifier = false; e.preventDefault(); return }
    if (k === 'c' || k === 'C') { held.c = true; e.preventDefault(); return }
    if (k === 'i' || k === 'I') { held.i = true; e.preventDefault(); return }

    if (k === 'u' || k === 'U') {
      const units: import('./lib/types').WeightUnit[] = ['g', 'oz', 'lbs', 'kg']
      const idx = units.indexOf(settingsStore.settings.weightUnit)
      settingsStore.update({ weightUnit: units[(idx + 1) % units.length] })
      e.preventDefault(); return
    }

    if (k === 't' || k === 'T') {
      if (settingsStore.settings.demoModeLocked) return
      if (settingsStore.settings.tutorialMode) {
        setGearStoreTutorialMode(false)
        setKitStoreTutorialMode(false)
        setPackingListStoreTutorialMode(false)
        await settingsStore.update({ tutorialMode: false })
        await Promise.all([gearStore.reset(), kitStore.reset(), packingListStore.reset()])
      } else {
        await settingsStore.update({ tutorialMode: true })
        setGearStoreTutorialMode(true)
        setKitStoreTutorialMode(true)
        setPackingListStoreTutorialMode(true)
        await Promise.all([gearStore.reset(), kitStore.reset(), packingListStore.reset()])
      }
      e.preventDefault(); return
    }

    if (k === 'Backspace' || k === 'Delete') {
      window.dispatchEvent(new CustomEvent('shortcut:back'))
      e.preventDefault(); return
    }
  }

  function handleKeyup(e: KeyboardEvent) {
    const k = e.key
    if (k === 'a' || k === 'A') {
      if (!held.aModifier && !isInput(e)) {
        window.dispatchEvent(new CustomEvent('shortcut:add', { detail: { tab: activeTab } }))
      }
      held.a = false; held.aModifier = false
      e.preventDefault()
    }
    if (k === 'c' || k === 'C') { held.c = false }
    if (k === 'i' || k === 'I') { held.i = false }
  }

  $effect(() => {
    window.addEventListener('keyup', handleKeyup)
    return () => window.removeEventListener('keyup', handleKeyup)
  })

  function handleKeydownEscape(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      window.dispatchEvent(new CustomEvent('shortcut:escape'))
    }
  }

  $effect(() => {
    window.addEventListener('keydown', handleKeydownEscape)
    return () => window.removeEventListener('keydown', handleKeydownEscape)
  })

  $effect(() => {
    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  })

  // Initialize Vercel Analytics
  $effect(() => {
    inject({ mode: 'auto' })
  })

  // PWA install tracking
  $effect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      track('app_opened_as_pwa')
    }
    function onInstallPrompt() { track('pwa_install_prompt_shown') }
    function onInstalled() { track('pwa_installed') }
    window.addEventListener('beforeinstallprompt', onInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  })

  $effect(() => {
    function onNavigateTab(e: Event) {
      const tab = (e as CustomEvent).detail as Tab
      if (tab) activeTab = tab
    }
    window.addEventListener('navigate:tab', onNavigateTab)
    return () => window.removeEventListener('navigate:tab', onNavigateTab)
  })

  $effect(() => {
    const tabNames: Record<Tab, string> = {
      'gear': 'Gear Closet',
      'kits': 'Kits',
      'packing-lists': 'Packing Lists',
      'settings': 'Settings',
    }
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_title: tabNames[activeTab],
        page_location: `${window.location.origin}/${activeTab}`,
      })
    }
  })

  function onWelcomeDone() {
    // If tutorial mode was just enabled show a toast
    if (settingsStore.settings.tutorialMode) {
      tutorialToast = true
      setTimeout(() => { tutorialToast = false }, 4000)
    }
  }

  async function handleWelcomeFileChange(e: Event) {
    const target = e.currentTarget as HTMLInputElement
    const file = target.files?.[0]
    if (!file) return
    try {
      const appState = await importBackup(file)
      await replaceAllData(appState.gearItems, appState.kits, appState.packingLists, appState.settings)
      await Promise.all([
        gearStore.reset(),
        kitStore.reset(),
        packingListStore.reset(),
        settingsStore.reset(),
      ])
      bannerDismissed = true
    } catch {
      // silently ignore; user can try again from Settings
    } finally {
      target.value = ''
    }
  }
</script>

{#if showTour}
  <AppTour onDone={() => { showTour = false; onWelcomeDone() }} />
{:else if showWelcomeScreen}
  <WelcomeScreen onDone={onWelcomeDone} onStartTour={() => { showTour = true }} />
{:else}
  <div class="flex flex-col min-h-svh bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
    {#if !listDetailOpen}
    <!-- Header -->
    <header class="sticky top-0 z-30 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between">
      <h1 class="flex items-center gap-2">
        <img
          src={settingsStore.settings.theme === 'dark' ? '/icons/logo-dark.svg' : '/icons/logo-light.svg'}
          alt="Gear Closet logo"
          class="h-8 w-auto"
        />
        <span class="text-xl font-semibold tracking-tight">Gear Closet</span>
      </h1>
      {#if activeTab !== 'settings'}
      <button
        onclick={() => {
          const units: import('./lib/types').WeightUnit[] = ['g', 'oz', 'lbs', 'kg']
          const idx = units.indexOf(settingsStore.settings.weightUnit)
          const next = units[(idx + 1) % units.length]
          settingsStore.update({ weightUnit: next })
          track('weight_unit_changed', { unit: next })
        }}
        class="px-3 py-1 rounded-full text-sm font-semibold border border-zinc-200 dark:border-zinc-700
          bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300
          hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors min-w-[44px] text-center"
        aria-label="Toggle weight unit"
      >
        {settingsStore.settings.weightUnit}
      </button>
      {/if}
    </header>

    <UpdatePrompt />

    <!-- Demo mode banner -->
    {#if showTutorialBanner}
      <button
        onclick={() => {
          activeTab = 'settings'
          setTimeout(() => {
            const target = document.querySelector('[data-demo-mode-section]') as HTMLElement | null
            const header = document.querySelector('header') as HTMLElement | null
            if (target) {
              const headerHeight = header?.offsetHeight ?? 0
              const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 12
              window.scrollTo({ top, behavior: 'smooth' })
            }
          }, 50)
        }}
        class="w-full flex items-center justify-center gap-2 px-4 py-2 border-b border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 text-sm"
      >
        <span class="font-medium text-green-900 dark:text-green-100">Demo mode active</span>
        <span class="text-green-400 dark:text-green-600">·</span>
        <span class="text-green-700 dark:text-green-400">Tap to manage in Settings</span>
      </button>
    {/if}


    <!-- Shared gear view-only banner -->
    {#if viewingShared}
      <div class="flex items-center gap-3 px-4 py-2.5 bg-blue-50 dark:bg-blue-950/40 border-b border-blue-200 dark:border-blue-800">
        <div class="flex-1 min-w-0">
          <p class="text-xs font-semibold text-blue-900 dark:text-blue-100">Viewing shared gear — your data is untouched</p>
        </div>
        <button
          onclick={saveSharedToMyGear}
          class="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          Save to my gear
        </button>
        <button
          onclick={exitSharedView}
          class="shrink-0 text-xs text-blue-400 hover:text-blue-600 dark:hover:text-blue-200 transition-colors"
          aria-label="Exit shared view"
        >
          ✕
        </button>
      </div>
    {/if}
    {#if shareSaved}
      <div class="px-4 py-2 bg-green-50 dark:bg-green-950/40 border-b border-green-200 dark:border-green-800">
        <p class="text-xs text-green-700 dark:text-green-300 font-medium">Saved to your gear!</p>
      </div>
    {/if}
    {/if}


    <!-- Main content area -->
    <main class="flex-1 overflow-auto">
      {#if activeTab === 'gear'}
        <GearCloset />
      {:else if activeTab === 'kits'}
        <Kits onGoToGear={() => (activeTab = 'gear')} />
      {:else if activeTab === 'packing-lists'}
        <PackingLists onGoToGear={() => (activeTab = 'gear')} />
      {:else if activeTab === 'settings'}
        <SettingsScreen {viewingShared} />
      {/if}
    </main>

    <!-- Bottom nav -->
    {#if !listDetailOpen}
    <nav class="sticky bottom-0 z-30 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800" style="padding-bottom: env(safe-area-inset-bottom);">
      <ul class="flex" style="padding-left: env(safe-area-inset-left); padding-right: env(safe-area-inset-right);">
        {#each tabs as tab}
          <li class="flex-1">
            <button
              onclick={() => (activeTab = tab.id)}
              class="flex flex-col items-center gap-1 py-3 px-2 w-full text-xs font-medium transition-colors
                {activeTab === tab.id
                  ? 'text-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'}"
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              <tab.icon size={22} />
              <span>{tab.label}</span>
            </button>
          </li>
        {/each}
      </ul>
    </nav>
    {/if}
  </div>
{/if}
