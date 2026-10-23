/**
 * Drag lifecycle helpers for category reordering.
 *
 * These are split out of `PackingListDetail.svelte` because the mapping from
 * `svelte-dnd-action` events onto "a drag started / a drag ended" is not
 * one-to-one, and getting it wrong is invisible until you reorder with a
 * keyboard.
 */

export type DndEventName = 'consider' | 'finalize'

/** What a `consider`/`finalize` event means for the held-card UI. */
export type DragPhase = 'start' | 'end' | null

/** The shape of `event.detail.info` that `svelte-dnd-action` hands us. */
export interface DndLifecycleInfo {
  trigger: string
  source: string
}

/**
 * Translate a `svelte-dnd-action` lifecycle event into a drag phase.
 *
 * - A pointer (mouse/touch) drag begins on `consider` with trigger
 *   `dragStarted` and ends on `finalize`.
 * - A keyboard drag also begins on `consider`/`dragStarted`, but then fires a
 *   `finalize` for *every* arrow-key move while the drag is still live; it only
 *   ends on `consider` with trigger `dragStopped`.
 *
 * So treating every `finalize` as "the drag ended" would expand the cards again
 * in the middle of a keyboard reorder. Hence the source check.
 */
export function dragPhase(event: DndEventName, info: DndLifecycleInfo | undefined): DragPhase {
  if (!info) return null
  if (event === 'consider') {
    if (info.trigger === 'dragStarted') return 'start'
    if (info.trigger === 'dragStopped') return 'end'
    return null
  }
  return info.source === 'keyboard' ? null : 'end'
}

/** Every category collapsed — the layout used while a card is held. */
export function collapsedWhileDragging(categoryIds: string[]): Set<string> {
  return new Set(categoryIds)
}

/**
 * What the collapsed set becomes when the held card is released.
 *
 * Issue #26 asks for "all cards fully expand again", so outside reorder mode we
 * return an empty set. Inside reorder mode the all-collapsed layout is the
 * mode's own affordance (and `preReorderCollapsed` still owns restoring the
 * user's real selection when they leave the mode), so we stay collapsed there
 * rather than expanding every card after each drop.
 */
export function collapsedAfterDrag(reorderMode: boolean, categoryIds: string[]): Set<string> {
  return reorderMode ? new Set(categoryIds) : new Set<string>()
}
