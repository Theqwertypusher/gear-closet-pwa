import { getSettings, putSettings } from '../db'
import type { AppSettings } from '../types'

const DEFAULT_SETTINGS: AppSettings = {
  weightUnit: 'g',
  lastExportDate: null,
  tutorialMode: false,
  hasSeenWelcome: false,
  theme: 'dark',
  demoModeLocked: false,
}

function createSettingsStore() {
  let settings = $state<AppSettings>({ ...DEFAULT_SETTINGS })
  let loaded = $state(false)

  async function load() {
    const stored = await getSettings()
    if (stored) {
      settings = { ...DEFAULT_SETTINGS, ...stored }
    }
    loaded = true
  }

  async function update(patch: Partial<AppSettings>) {
    settings = { ...settings, ...patch }
    await putSettings(settings)
  }

  async function reset() {
    settings = { ...DEFAULT_SETTINGS }
    loaded = false
    await load()
  }

  load()

  return {
    get settings() { return settings },
    get loaded() { return loaded },
    update,
    reset,
  }
}

export const settingsStore = createSettingsStore()
