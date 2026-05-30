import { deflateRaw, inflateRaw } from 'pako'
import type { GearItem, Kit, PackingList, AppSettings } from './types'

export interface SharePayload {
  gearItems: GearItem[]
  kits: Kit[]
  packingLists: PackingList[]
}

// Encode data → compressed base64url string
export function encodeSharePayload(payload: SharePayload): string {
  const json = JSON.stringify(payload)
  const compressed = deflateRaw(json)
  const binary = Array.from(compressed).map((b) => String.fromCharCode(b)).join('')
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

// Decode base64url string → data
export function decodeSharePayload(encoded: string): SharePayload {
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  const json = inflateRaw(bytes, { to: 'string' })
  return JSON.parse(json) as SharePayload
}

// Build a full share URL from current data
export function buildShareUrl(
  gearItems: GearItem[],
  kits: Kit[],
  packingLists: PackingList[],
): string {
  const encoded = encodeSharePayload({ gearItems, kits, packingLists })
  const url = new URL(window.location.href)
  url.search = ''
  url.hash = ''
  url.searchParams.set('data', encoded)
  return url.toString()
}

// Read ?data= from current URL, returns null if not present
export function readShareParam(): SharePayload | null {
  const params = new URLSearchParams(window.location.search)
  const data = params.get('data')
  if (!data) return null
  try {
    return decodeSharePayload(data)
  } catch {
    return null
  }
}

// Remove ?data= from the URL without a page reload
export function clearShareParam(): void {
  const url = new URL(window.location.href)
  url.searchParams.delete('data')
  window.history.replaceState({}, '', url.toString())
}
