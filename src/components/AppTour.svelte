<script lang="ts">
  import { X } from '@lucide/svelte'
  import { settingsStore } from '../lib/stores/settingsStore.svelte'

  type Part = { text: string; align: 'left' | 'center'; html?: boolean }

  type Step = {
    icon: string
    title: string
    parts: Part[]
  }

  let { onDone }: { onDone: () => void } = $props()

  let step = $state(0)

  const steps: Step[] = [
    {
      icon: '🏔️',
      title: 'Welcome to Gear Closet',
      parts: [
        { align: 'center', text: 'Build packing lists for all your outdoor trips, whether day hikes or multi-day backpacking trips. All your data lives entirely on your device — nothing is ever sent to a server.' },
      ],
    },
    {
      icon: '📲',
      title: 'Install for offline use',
      parts: [
        { align: 'center', text: 'Gear Closet is a Progressive Web App (PWA) — a website you can install on your phone, tablet, or desktop. Once installed, it works fully offline, so you can check your packing list in the backcountry without a signal.' },
        { align: 'center', text: 'To install on iOS: Tap Share → Add to Home Screen.\nTo install on Android: Tap the browser menu → Add to Home Screen or Install.' },
      ],
    },
    {
      icon: '🎒',
      title: 'Your Gear Closet',
      parts: [
        { align: 'center', text: 'The Gear Closet tab is your permanent gear catalog. Add every piece of gear you own — name, brand, weight, and category. You only enter it once, then pull from it for any trip.' },
      ],
    },
    {
      icon: '⚖️',
      title: 'Weight categories',
      parts: [
        { align: 'center', text: 'Every item belongs to one of three categories:' },
        { align: 'left', html: true, text: '<strong><u>Base Weight</u></strong> — gear you always carry (shelter, sleep system, pack).\n\n<strong><u>Wearable</u></strong> — what\'s on your body (boots, jacket, hat).\n\n<strong><u>Consumable</u></strong> — things you use up (food, fuel, water).' },
        { align: 'center', text: 'These power the weight breakdown on every packing list.' },
      ],
    },
    {
      icon: '🏷️',
      title: 'Labels',
      parts: [
        { align: 'center', text: 'Assign type labels to your gear — like "shelter", "sleep", "cook", or "safety". Labels let you filter your closet instantly so you can find what you need without scrolling through everything.' },
      ],
    },
    {
      icon: '📦',
      title: 'Kits',
      parts: [
        { align: 'center', text: 'A kit is a reusable group of gear items — like "Sleep System" (sleeping bag + pad + pillow) or "Cook Kit" (stove + pot + spork). Add an entire kit to any packing list in one tap instead of adding items one by one.' },
      ],
    },
    {
      icon: '📋',
      title: 'Packing Lists',
      parts: [
        { align: 'center', text: 'Create a packing list for each trip. Lists are organized into categories (Big Three, Clothing, Cook System, etc.) and you pull gear directly from your closet into each category. Your total weight is calculated automatically.' },
      ],
    },
    {
      icon: '🔄',
      title: 'List modes',
      parts: [
        { align: 'center', text: 'Every packing list has three modes you can switch between freely:' },
        { align: 'left', html: true, text: '<strong><u>Rough Draft</u></strong> — Still editing. Add and remove gear freely.\n\n<strong><u>Final</u></strong> — Gear is confirmed. A clean view of everything you\'re bringing.\n\n<strong><u>Packing List</u></strong> — Check items off as you load your pack. Uncheck to reset.' },
      ],
    },
    {
      icon: '🔗',
      title: 'Sharing',
      parts: [
        { align: 'center', text: 'Generate a share link for any packing list and send it to a friend or trip partner. They can view your full list and gear weights in their browser, and optionally save it to their own device with one tap.' },
      ],
    },
    {
      icon: '🔒',
      title: 'Your data, your device',
      parts: [
        { align: 'center', text: 'Nothing you add to Gear Closet is tracked, collected, or stored anywhere other than your own device. You can export a backup file at any time and import it on another device to keep everything in sync.' },
      ],
    },
  ]

  async function finish() {
    await settingsStore.update({ hasSeenWelcome: true })
    onDone()
  }

  function next() {
    if (step < steps.length - 1) step++
    else finish()
  }

  function back() {
    if (step > 0) step--
  }

  const current = $derived(steps[step])
  const isLast = $derived(step === steps.length - 1)
</script>

<div class="fixed inset-0 z-50 flex flex-col bg-white dark:bg-zinc-950">
  <!-- Close -->
  <div class="flex justify-end px-5 pt-5">
    <button
      onclick={finish}
      class="p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      aria-label="Skip tour"
    >
      <X size={20} />
    </button>
  </div>

  <!-- Content -->
  <div class="flex-1 flex flex-col items-center justify-center px-8 overflow-y-auto py-4">
    <div class="w-full max-w-sm">
      <div class="text-5xl mb-6 text-center leading-normal">{current.icon}</div>
      <h2 class="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 text-center">{current.title}</h2>
      {#each current.parts as part}
        {#if part.html}
          <p class="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line mb-4 {part.align === 'left' ? 'text-left' : 'text-center'}">
            {@html part.text}
          </p>
        {:else}
          <p class="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line mb-4 {part.align === 'left' ? 'text-left' : 'text-center'}">
            {part.text}
          </p>
        {/if}
      {/each}
    </div>
  </div>

  <!-- Progress dots -->
  <div class="flex justify-center gap-1.5 pt-4 pb-4">
    {#each steps as _, i}
      <button
        onclick={() => (step = i)}
        class="w-2 h-2 rounded-full transition-colors {i === step ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-300 dark:bg-zinc-700'}"
        aria-label="Go to step {i + 1}"
      ></button>
    {/each}
  </div>

  <!-- Nav buttons -->
  <div class="flex gap-3 px-6 pt-4 pb-10">
    <button
      onclick={back}
      disabled={step === 0}
      class="flex-1 py-3 rounded-xl text-sm font-medium border border-zinc-200 dark:border-zinc-700
        {step === 0
          ? 'text-zinc-300 dark:text-zinc-700 cursor-not-allowed'
          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors'}"
    >
      Back
    </button>
    <button
      onclick={next}
      class="flex-1 py-3 rounded-xl text-sm font-semibold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
    >
      {isLast ? 'Get started' : 'Next'}
    </button>
  </div>
</div>
