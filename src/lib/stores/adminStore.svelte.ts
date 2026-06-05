// ── Admin detection ───────────────────────────────────────────────────────────

const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost'
const adminKey = import.meta.env.VITE_ADMIN_KEY ?? ''

// ── Flag overrides (session-only) ─────────────────────────────────────────────

type FlagMap = Record<string, boolean>

// Known flag keys — add here as the app grows
const FLAG_KEYS = ['collaborate-mode']

async function fetchFlag(key: string): Promise<boolean> {
  try {
    const res = await fetch(`/.well-known/vercel/flags`)
    if (!res.ok) return false
    const data = await res.json() as { flags?: Array<{ key: string; value: unknown }> }
    const found = data.flags?.find(f => f.key === key)
    return found ? Boolean(found.value) : false
  } catch {
    return false
  }
}

function createAdminStore() {
  let displayName = $state('')
  let flagOverrides = $state<FlagMap>({})
  let allFlags = $state<FlagMap>({})

  const isAdmin = $derived(
    isLocal || (adminKey.length > 0 && displayName.trim() === adminKey)
  )

  function setDisplayName(name: string) {
    displayName = name
  }

  async function loadFlags() {
    const results: FlagMap = {}
    for (const key of FLAG_KEYS) {
      results[key] = await fetchFlag(key)
    }
    allFlags = results
    flagOverrides = { ...results }
  }

  function toggleFlag(key: string) {
    flagOverrides = { ...flagOverrides, [key]: !flagOverrides[key] }
  }

  function getFlagValue(key: string): boolean {
    if (key in flagOverrides) return flagOverrides[key]
    if (key in allFlags) return allFlags[key]
    return false
  }

  return {
    get isAdmin() { return isAdmin },
    get flagOverrides() { return flagOverrides },
    get allFlags() { return allFlags },
    setDisplayName,
    loadFlags,
    toggleFlag,
    getFlagValue,
  }
}

export const adminStore = createAdminStore()
