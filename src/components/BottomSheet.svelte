<script lang="ts">
  import { Drawer } from 'vaul-svelte'

  interface Props {
    onclose: () => void
    children: import('svelte').Snippet
  }

  let { onclose, children }: Props = $props()
</script>

<Drawer.Root
  open={true}
  onOpenChange={(v) => { if (!v) onclose() }}
  closeThreshold={0.4}
>
  <Drawer.Portal>
    <Drawer.Overlay class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
    <Drawer.Content
      class="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-white dark:bg-zinc-900 rounded-t-2xl shadow-xl max-h-[92vh] focus:outline-none drawer-content"
    >
      <!-- Drag handle -->
      <div class="flex justify-center pt-3 pb-1 flex-shrink-0">
        <div class="w-10 h-1 bg-zinc-300 dark:bg-zinc-600 rounded-full"></div>
      </div>

      {@render children()}
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>
