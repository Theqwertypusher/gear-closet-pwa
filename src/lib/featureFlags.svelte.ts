import { flagsClient } from '@vercel/flags-core'

let collaborateMode = $state(false)

async function initFlags() {
  try {
    const result = await flagsClient.evaluate('collaborate-mode', false)
    collaborateMode = result.value
  } catch {
    collaborateMode = false
  }
}

initFlags()

export const flags = {
  get collaborateMode() { return collaborateMode },
}
