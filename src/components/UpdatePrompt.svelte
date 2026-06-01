<script lang="ts">
  import { useRegisterSW } from 'virtual:pwa-register/svelte'

  const { needRefresh, updateServiceWorker } = useRegisterSW({
    onRegistered(r) {
      // Check for updates every 60 seconds
      r && setInterval(() => r.update(), 60_000)
    },
  })

  const forceShow = false

  function reload() {
    updateServiceWorker(true)
  }
</script>

{#if $needRefresh || forceShow}
  <div class="w-full flex items-center justify-center gap-2 px-4 py-2 border-b border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30 text-sm">
    <span class="font-medium text-purple-900 dark:text-purple-100">A new version is available</span>
    <span class="text-purple-400 dark:text-purple-600">·</span>
    <button
      onclick={reload}
      class="shrink-0 text-xs font-semibold px-3 py-1 rounded-md border border-purple-400 dark:border-purple-600 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
    >
      Update
    </button>
  </div>
{/if}
