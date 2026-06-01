declare function gtag(...args: unknown[]): void

function isDemoOrTutorial(): boolean {
  try {
    const settings = localStorage.getItem('gear-closet-settings')
    if (!settings) return false
    const parsed = JSON.parse(settings)
    return parsed.tutorialMode === true || parsed.demoMode === true
  } catch {
    return false
  }
}

export function track(eventName: string, params?: Record<string, unknown>): void {
  if (typeof gtag === 'undefined') return
  if (isDemoOrTutorial()) return
  gtag('event', eventName, params ?? {})
}
