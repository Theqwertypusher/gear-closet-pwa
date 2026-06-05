import { adminStore } from './stores/adminStore.svelte'

export const flags = {
  get collaborateMode() { return adminStore.getFlagValue('collaborate-mode') },
}
