const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

export function focusTrap(node: HTMLElement) {
  function getFocusable(): HTMLElement[] {
    return Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE))
  }

  // Defer two frames — one to mount, one to paint — then focus.
  // Priority: [data-focus-first] > first input/textarea > first focusable
  let rafId: number
  rafId = requestAnimationFrame(() => {
    rafId = requestAnimationFrame(() => {
      const preferred =
        node.querySelector<HTMLElement>('[data-focus-first]') ??
        node.querySelector<HTMLElement>('input:not([disabled]), textarea:not([disabled])')
      const first = preferred ?? getFocusable()[0]
      first?.focus()
    })
  })

  function handleKeydown(e: KeyboardEvent) {
    if (e.key !== 'Tab') return
    const els = getFocusable()
    if (els.length === 0) return
    const firstEl = els[0]
    const lastEl = els[els.length - 1]
    if (e.shiftKey) {
      if (document.activeElement === firstEl) {
        lastEl.focus()
        e.preventDefault()
      }
    } else {
      if (document.activeElement === lastEl) {
        firstEl.focus()
        e.preventDefault()
      }
    }
  }

  node.addEventListener('keydown', handleKeydown)
  return {
    destroy() {
      cancelAnimationFrame(rafId)
      node.removeEventListener('keydown', handleKeydown)
    },
  }
}
