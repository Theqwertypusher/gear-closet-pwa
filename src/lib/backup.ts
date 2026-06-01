import { AppStateSchema } from './schemas'
import type { GearItem, Kit, PackingList, AppSettings, AppState } from './types'

const BACKUP_VERSION = 1

export function exportBackup(
  gearItems: GearItem[],
  kits: Kit[],
  packingLists: PackingList[],
  settings: AppSettings,
): void {
  const exportedAt = new Date().toISOString()
  const payload = {
    version: BACKUP_VERSION,
    exportedAt,
    data: { gearItems, kits, packingLists, settings },
  }

  const json = JSON.stringify(payload, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const d = new Date(exportedAt)
  const date = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const a = document.createElement('a')
  a.href = url
  a.download = `${date}-gear-closet-backup.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importBackup(file: File): Promise<AppState> {
  const text = await file.text()

  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('File is not valid JSON.')
  }

  if (
    typeof raw !== 'object' ||
    raw === null ||
    !('data' in raw) ||
    typeof (raw as Record<string, unknown>).data !== 'object'
  ) {
    throw new Error('Backup file structure is invalid.')
  }

  const data = (raw as { data: unknown }).data
  const result = AppStateSchema.safeParse(data)

  if (!result.success) {
    const messages = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')
    throw new Error(`Backup validation failed: ${messages}`)
  }

  return result.data
}
