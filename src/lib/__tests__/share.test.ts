import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  encodeSharePayload,
  decodeSharePayload,
  buildShareUrl,
  readShareParam,
  clearShareParam,
} from '../share'
import type { SharePayload } from '../share'
import type { GearItem, Kit, PackingList } from '../types'

// ─── fixtures ────────────────────────────────────────────────────────────────

function makeGearItem(overrides: Partial<GearItem> = {}): GearItem {
  return {
    id: 'g1', name: 'Tent', brand: 'MSR', weight: 1200, weightUnit: 'g',
    weightCategory: 'base', notes: '', itemType: 'Shelter',
    createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makePackingList(overrides: Partial<PackingList> = {}): PackingList {
  return {
    id: 'l1', name: 'Summer Trip', categories: [], tripNotes: '',
    isPackingMode: false, listMode: 'draft', sortOrder: 0,
    createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

const EMPTY_PAYLOAD: SharePayload = { gearItems: [], kits: [], packingLists: [] }

const SAMPLE_PAYLOAD: SharePayload = {
  gearItems: [makeGearItem()],
  kits: [],
  packingLists: [makePackingList()],
}

// ─── encode / decode ──────────────────────────────────────────────────────────

describe('encodeSharePayload / decodeSharePayload', () => {
  it('round-trips an empty payload', () => {
    const encoded = encodeSharePayload(EMPTY_PAYLOAD)
    expect(typeof encoded).toBe('string')
    expect(encoded.length).toBeGreaterThan(0)
    expect(decodeSharePayload(encoded)).toEqual(EMPTY_PAYLOAD)
  })

  it('round-trips a payload with gear items and packing lists', () => {
    const encoded = encodeSharePayload(SAMPLE_PAYLOAD)
    const decoded = decodeSharePayload(encoded)
    expect(decoded.gearItems).toHaveLength(1)
    expect(decoded.gearItems[0].name).toBe('Tent')
    expect(decoded.packingLists).toHaveLength(1)
    expect(decoded.packingLists[0].name).toBe('Summer Trip')
    expect(decoded.kits).toHaveLength(0)
  })

  it('produces URL-safe characters (no +, /, or =)', () => {
    const encoded = encodeSharePayload(SAMPLE_PAYLOAD)
    expect(encoded).not.toMatch(/[+/=]/)
  })

  it('preserves all fields after round-trip', () => {
    const encoded = encodeSharePayload(SAMPLE_PAYLOAD)
    const decoded = decodeSharePayload(encoded)
    expect(decoded.gearItems[0]).toEqual(SAMPLE_PAYLOAD.gearItems[0])
    expect(decoded.packingLists[0]).toEqual(SAMPLE_PAYLOAD.packingLists[0])
  })
})

// ─── buildShareUrl ────────────────────────────────────────────────────────────

describe('buildShareUrl', () => {
  const originalLocation = window.location

  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: { href: 'http://localhost:5173/app?foo=bar#hash' },
      writable: true,
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    })
  })

  it('returns a URL string containing ?data=', () => {
    const url = buildShareUrl([makeGearItem()], [], [makePackingList()])
    expect(url).toContain('?data=')
  })

  it('strips existing query string and hash', () => {
    const url = buildShareUrl([], [], [])
    expect(url).not.toContain('foo=bar')
    expect(url).not.toContain('#hash')
  })

  it('encoded payload can be decoded back', () => {
    const url = buildShareUrl(SAMPLE_PAYLOAD.gearItems, SAMPLE_PAYLOAD.kits, SAMPLE_PAYLOAD.packingLists)
    const encoded = new URL(url).searchParams.get('data')!
    const decoded = decodeSharePayload(encoded)
    expect(decoded.gearItems[0].id).toBe('g1')
    expect(decoded.packingLists[0].id).toBe('l1')
  })
})

// ─── readShareParam ───────────────────────────────────────────────────────────

describe('readShareParam', () => {
  const originalLocation = window.location

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    })
  })

  it('returns null when no ?data= param is present', () => {
    Object.defineProperty(window, 'location', {
      value: { href: 'http://localhost:5173/', search: '' },
      writable: true,
    })
    expect(readShareParam()).toBeNull()
  })

  it('returns null on malformed/corrupt data param', () => {
    Object.defineProperty(window, 'location', {
      value: { href: 'http://localhost:5173/?data=INVALID!!!', search: '?data=INVALID!!!' },
      writable: true,
    })
    expect(readShareParam()).toBeNull()
  })

  it('decodes a valid ?data= param back to the original payload', () => {
    const encoded = encodeSharePayload(SAMPLE_PAYLOAD)
    const search = `?data=${encoded}`
    Object.defineProperty(window, 'location', {
      value: { href: `http://localhost:5173/${search}`, search },
      writable: true,
    })
    const result = readShareParam()
    expect(result).not.toBeNull()
    expect(result!.gearItems[0].name).toBe('Tent')
  })
})

// ─── clearShareParam ──────────────────────────────────────────────────────────

describe('clearShareParam', () => {
  it('calls history.replaceState to remove ?data= without reload', () => {
    const replaceState = vi.fn()
    vi.stubGlobal('history', { replaceState })
    Object.defineProperty(window, 'location', {
      value: { href: 'http://localhost:5173/?data=abc123', search: '?data=abc123' },
      writable: true,
    })

    clearShareParam()

    expect(replaceState).toHaveBeenCalledOnce()
    const calledUrl = replaceState.mock.calls[0][2] as string
    expect(calledUrl).not.toContain('data=')

    vi.unstubAllGlobals()
  })
})
