import { describe, it, expect } from 'vitest'
import { dragPhase, collapsedWhileDragging, collapsedAfterDrag } from '../dragLifecycle'

const CAT_IDS = ['cat-1', 'cat-2', 'cat-3']

describe('dragPhase', () => {
  describe('pointer drags (mouse and touch)', () => {
    it('starts on consider/dragStarted', () => {
      expect(dragPhase('consider', { trigger: 'dragStarted', source: 'pointer' })).toBe('start')
    })

    it('ends on finalize when the card is dropped into the zone', () => {
      expect(dragPhase('finalize', { trigger: 'droppedIntoZone', source: 'pointer' })).toBe('end')
    })

    it('ends on finalize when the card is dropped outside any zone', () => {
      expect(dragPhase('finalize', { trigger: 'droppedOutsideOfAny', source: 'pointer' })).toBe('end')
    })

    it('stays mid-drag for the considers fired while moving over the list', () => {
      for (const trigger of ['draggedEntered', 'draggedOverIndex', 'draggedLeft', 'draggedLeftAll']) {
        expect(dragPhase('consider', { trigger, source: 'pointer' })).toBeNull()
      }
    })
  })

  describe('keyboard drags', () => {
    it('starts on consider/dragStarted', () => {
      expect(dragPhase('consider', { trigger: 'dragStarted', source: 'keyboard' })).toBe('start')
    })

    it('does NOT end on finalize — arrow keys finalize repeatedly mid-drag', () => {
      expect(dragPhase('finalize', { trigger: 'droppedIntoZone', source: 'keyboard' })).toBeNull()
    })

    it('ends on consider/dragStopped', () => {
      expect(dragPhase('consider', { trigger: 'dragStopped', source: 'keyboard' })).toBe('end')
    })
  })

  it('is null when the event carries no info', () => {
    expect(dragPhase('consider', undefined)).toBeNull()
    expect(dragPhase('finalize', undefined)).toBeNull()
  })
})

describe('collapsedWhileDragging', () => {
  it('collapses every category', () => {
    expect([...collapsedWhileDragging(CAT_IDS)]).toEqual(CAT_IDS)
  })

  it('does not alias the array it was handed', () => {
    const ids = [...CAT_IDS]
    const collapsed = collapsedWhileDragging(ids)
    ids.push('cat-4')
    expect(collapsed.has('cat-4')).toBe(false)
  })

  it('handles an empty list', () => {
    expect(collapsedWhileDragging([]).size).toBe(0)
  })
})

describe('collapsedAfterDrag', () => {
  it('fully expands every card outside reorder mode (issue #26)', () => {
    expect(collapsedAfterDrag(false, CAT_IDS).size).toBe(0)
  })

  it('keeps every card collapsed inside reorder mode', () => {
    expect([...collapsedAfterDrag(true, CAT_IDS)]).toEqual(CAT_IDS)
  })
})
