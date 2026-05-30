<script lang="ts">
  import { X, Plus, Trash2 } from '@lucide/svelte'
  import { focusTrap } from '../lib/focusTrap'

  const DEFAULT_CATEGORIES = [
    'Big Three',
    'Cook System',
    'Electronics',
    'Ditty Bag',
    'Miscellaneous',
    'Food & Water',
    'Clothing',
  ]

  interface Props {
    onclose: () => void
    oncreate: (name: string, categories: string[]) => void
  }

  let { onclose, oncreate }: Props = $props()

  let name = $state('')
  let useTemplate = $state(false)
  // Editable list of category names shown when template is on
  let categoryNames = $state<string[]>([...DEFAULT_CATEGORIES])

  function toggleTemplate() {
    useTemplate = !useTemplate
    if (useTemplate) {
      categoryNames = [...DEFAULT_CATEGORIES]
    }
  }

  function deleteCategory(index: number) {
    categoryNames = categoryNames.filter((_, i) => i !== index)
  }

  function addCategory() {
    categoryNames = [...categoryNames, '']
  }

  function handleSubmit(e: Event) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    const categories = useTemplate
      ? categoryNames.map((c) => c.trim()).filter(Boolean)
      : []
    oncreate(trimmed, categories)
    onclose()
  }

  function handleBackdrop(e: MouseEvent) {
    if (e.target === e.currentTarget) onclose()
  }

  $effect(() => {
    const handler = () => onclose()
    window.addEventListener('shortcut:escape', handler)
    return () => window.removeEventListener('shortcut:escape', handler)
  })
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
  onclick={handleBackdrop}
>
  <div class="w-full sm:max-w-md bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl shadow-xl" use:focusTrap>
    <!-- Header -->
    <div class="flex items-center justify-between px-6 pt-6 pb-4">
      <h2 class="text-lg font-semibold">New Packing List</h2>
      <button
        onclick={onclose}
        class="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
        aria-label="Close"
      >
        <X size={20} />
      </button>
    </div>

    <!-- Scrollable body -->
    <div class="px-6 max-h-[70vh] overflow-y-auto">
      <form id="create-list-form" onsubmit={handleSubmit} class="space-y-4 pb-4">
        <!-- List name -->
        <div>
          <label for="list-name" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            List name <span class="text-red-500">*</span>
          </label>
          <input
            id="list-name"
            data-focus-first
            type="text"
            bind:value={name}
            placeholder="e.g. JMT 2025"
            class="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700
              bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100
              placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 text-sm"
          />
        </div>

        <!-- Template toggle -->
        <div class="flex items-center justify-between py-1">
          <div>
            <p class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Start from template</p>
            <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Pre-fills default categories</p>
          </div>
          <button
            type="button"
            onclick={toggleTemplate}
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              {useTemplate ? 'bg-zinc-800 dark:bg-zinc-200' : 'bg-zinc-300 dark:bg-zinc-600'}"
            role="switch"
            aria-checked={useTemplate}
          >
            <span
              class="inline-block h-4 w-4 transform rounded-full bg-white dark:bg-zinc-900 transition-transform shadow
                {useTemplate ? 'translate-x-6' : 'translate-x-1'}"
            ></span>
          </button>
        </div>

        <!-- Category editor (shown when template is on) -->
        {#if useTemplate}
          <div class="space-y-2">
            {#each categoryNames as cat, i}
              <div class="flex items-center gap-2">
                <input
                  type="text"
                  bind:value={categoryNames[i]}
                  placeholder="Category name"
                  class="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700
                    bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100
                    placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 text-sm"
                />
                <button
                  type="button"
                  onclick={() => deleteCategory(i)}
                  class="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                  aria-label="Delete category"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            {/each}

            <!-- Add category -->
            <button
              type="button"
              onclick={addCategory}
              class="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400
                hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors py-1"
            >
              <Plus size={15} />
              Add category
            </button>
          </div>
        {/if}
      </form>
    </div>

    <!-- Footer actions -->
    <div class="flex gap-3 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800">
      <button
        type="button"
        onclick={onclose}
        class="flex-1 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700
          text-sm font-medium text-zinc-700 dark:text-zinc-300
          hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
      >
        Cancel
      </button>
      <button
        type="submit"
        form="create-list-form"
        disabled={!name.trim()}
        class="flex-1 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100
          text-sm font-medium text-white dark:text-zinc-900
          hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors
          disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Create
      </button>
    </div>
  </div>
</div>
