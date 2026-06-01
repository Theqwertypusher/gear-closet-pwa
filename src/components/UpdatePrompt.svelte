<script lang="ts">
  import { useRegisterSW } from 'virtual:pwa-register/svelte'

  const { needRefresh, updateServiceWorker } = useRegisterSW({
    onRegistered(r) {
      // Check for updates every 60 seconds
      r && setInterval(() => r.update(), 60_000)
    },
  })

  function reload() {
    updateServiceWorker(true)
  }
</script>

{#if $needRefresh}
  <div class="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-3 px-4 py-3 bg-indigo-600 text-white text-sm shadow-lg">
    <span class="font-medium">A new version is available.</span>
    <button
      onclick={reload}
      class="shrink-0 px-3 py-1 rounded-full bg-white text-indigo-600 font-semibold text-xs hover:bg-indigo-50 transition-colors"
    >
      Update now
    </button>
  </div>
{/if}
